"""Run or plan Aimandala domestic vision model evals."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
REPO_ROOT = Path(__file__).resolve().parents[6]
MANIFEST_PATH = AIMANDALA_ROOT / "fixtures" / "manifest.yaml"
DEFAULT_OUTPUT_DIR = AIMANDALA_ROOT / "docs" / "qa" / "model-evals" / "2026-05-05-vision"

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import (  # noqa: E402
    LLMClientConfig,
    LLMTaskConfig,
    OpenAICompatibleLLMClient,
)


VISION_EVAL_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "center_observation",
        "circle_boundaries",
        "dominant_colors",
        "structure_notes",
        "risk_flags",
        "confidence",
    ],
    "properties": {
        "center_observation": {"type": "string"},
        "circle_boundaries": {
            "type": "object",
            "required": ["inner", "middle", "outer"],
            "properties": {
                "inner": {"type": "string"},
                "middle": {"type": "string"},
                "outer": {"type": "string"},
            },
        },
        "dominant_colors": {"type": "array", "items": {"type": "string"}},
        "structure_notes": {"type": "array", "items": {"type": "string"}},
        "risk_flags": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
    },
}

VISION_EVAL_PROMPT = """你正在为 Aimandala 的三圈识别任务评测视觉模型。

请只做视觉结构观察，不要做心理诊断、疗愈建议或人格判断。

观察重点：
1. 画面中心位置与中心区域特征。
2. 内圈、中圈、外圈的大致边界和可见程度。
3. 主要颜色块、留白、拥挤、断裂、偏移或层次变化。
4. 哪些观察可以支持后续报告中的 visual_basis。
5. 如果不确定，请明确标注不确定，不要强行断言。

请用中文输出，并严格返回 JSON。"""


@dataclass(frozen=True)
class Fixture:
    fixture_id: str
    descriptor_path: Path
    image_path: Path
    theme: str | None
    fixture_type: str | None


@dataclass(frozen=True)
class Candidate:
    candidate_id: str
    base_url: str
    model: str
    api_key: str | None
    api_key_env: str | None
    api_key_header: str
    timeout_seconds: int
    max_retries: int
    retry_backoff_ms: int

    @property
    def api_key_configured(self) -> bool:
        return bool(self.api_key)

    def public_payload(self) -> dict[str, Any]:
        return {
            "id": self.candidate_id,
            "base_url": self.base_url,
            "model": self.model,
            "api_key_env": self.api_key_env,
            "api_key_configured": self.api_key_configured,
            "api_key_header": self.api_key_header,
            "timeout_seconds": self.timeout_seconds,
            "max_retries": self.max_retries,
        }


def _read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def _resolve_aimandala_path(raw_path: str) -> Path:
    path = raw_path.strip()
    if path.startswith("$REPO_ROOT/"):
        return REPO_ROOT / path[len("$REPO_ROOT/") :]
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return AIMANDALA_ROOT / candidate


def _parse_manifest(path: Path) -> list[tuple[str, Path]]:
    entries: list[tuple[str, Path]] = []
    current_id: str | None = None
    current_path: str | None = None

    for raw_line in _read_lines(path):
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#") or stripped == "fixtures:":
            continue
        if stripped.startswith("- id:"):
            if current_id and current_path:
                entries.append((current_id, _resolve_aimandala_path(current_path)))
            current_id = stripped.split(":", 1)[1].strip()
            current_path = None
            continue
        if current_id and stripped.startswith("path:"):
            current_path = stripped.split(":", 1)[1].strip()

    if current_id and current_path:
        entries.append((current_id, _resolve_aimandala_path(current_path)))
    return entries


def _parse_descriptor(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = {}
    current_block: dict[str, str] | None = None

    for raw_line in _read_lines(path):
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or ":" not in stripped:
            continue

        indent = len(line) - len(line.lstrip(" "))
        key, value = stripped.split(":", 1)
        key = key.strip()
        value = value.strip()

        if indent == 0:
            current_block = None
            if value:
                data[key] = value
            else:
                current_block = {}
                data[key] = current_block
            continue

        if current_block is not None and value:
            current_block[key] = value

    return data


def load_fixtures(fixture_ids: list[str] | None = None) -> list[Fixture]:
    requested = set(fixture_ids or [])
    fixtures: list[Fixture] = []
    for fixture_id, descriptor_path in _parse_manifest(MANIFEST_PATH):
        if requested and fixture_id not in requested:
            continue
        descriptor = _parse_descriptor(descriptor_path)
        input_payload = descriptor.get("input")
        if not isinstance(input_payload, dict):
            raise ValueError(f"{fixture_id}: descriptor input block missing")
        raw_image_path = input_payload.get("image_path")
        if not isinstance(raw_image_path, str) or not raw_image_path.strip():
            raise ValueError(f"{fixture_id}: input.image_path missing")
        image_path = _resolve_aimandala_path(raw_image_path)
        if not image_path.exists():
            raise ValueError(f"{fixture_id}: image not found: {image_path}")
        fixtures.append(
            Fixture(
                fixture_id=fixture_id,
                descriptor_path=descriptor_path,
                image_path=image_path,
                theme=str(descriptor.get("theme") or "") or None,
                fixture_type=str(descriptor.get("fixture_type") or "") or None,
            )
        )
    if requested:
        found = {fixture.fixture_id for fixture in fixtures}
        missing = sorted(requested - found)
        if missing:
            raise ValueError(f"requested fixture ids not found: {', '.join(missing)}")
    return fixtures


def load_candidates(config_path: Path | None) -> list[Candidate]:
    if config_path is None:
        return []
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    raw_candidates = payload.get("candidates")
    if not isinstance(raw_candidates, list):
        raise ValueError("candidate config must contain a candidates array")

    candidates: list[Candidate] = []
    for index, raw_candidate in enumerate(raw_candidates):
        if not isinstance(raw_candidate, dict):
            raise ValueError(f"candidate #{index + 1} must be an object")
        candidate_id = str(raw_candidate.get("id") or "").strip()
        base_url = str(raw_candidate.get("base_url") or "").strip()
        model = str(raw_candidate.get("model") or "").strip()
        api_key_env = str(raw_candidate.get("api_key_env") or "").strip() or None
        explicit_api_key = str(raw_candidate.get("api_key") or "").strip() or None
        api_key = explicit_api_key or (os.getenv(api_key_env, "").strip() if api_key_env else None)
        api_key_header = str(raw_candidate.get("api_key_header") or "Authorization").strip() or "Authorization"
        if not candidate_id:
            raise ValueError(f"candidate #{index + 1} missing id")
        if not base_url:
            raise ValueError(f"{candidate_id}: missing base_url")
        if not model:
            raise ValueError(f"{candidate_id}: missing model")
        candidates.append(
            Candidate(
                candidate_id=candidate_id,
                base_url=base_url,
                model=model,
                api_key=api_key,
                api_key_env=api_key_env,
                api_key_header=api_key_header,
                timeout_seconds=int(raw_candidate.get("timeout_seconds") or 45),
                max_retries=int(raw_candidate.get("max_retries") or 1),
                retry_backoff_ms=int(raw_candidate.get("retry_backoff_ms") or 500),
            )
        )
    return candidates


def build_plan(fixtures: list[Fixture], candidates: list[Candidate], output_dir: Path) -> dict[str, Any]:
    return {
        "ok": True,
        "mode": "plan",
        "fixture_count": len(fixtures),
        "candidate_count": len(candidates),
        "output_dir": str(output_dir),
        "fixtures": [
            {
                "fixture_id": fixture.fixture_id,
                "theme": fixture.theme,
                "fixture_type": fixture.fixture_type,
                "image_path": str(fixture.image_path.relative_to(AIMANDALA_ROOT)),
            }
            for fixture in fixtures
        ],
        "candidates": [candidate.public_payload() for candidate in candidates],
    }


def _build_client(candidate: Candidate) -> OpenAICompatibleLLMClient:
    task = LLMTaskConfig(
        base_url=candidate.base_url,
        api_key=candidate.api_key,
        model=candidate.model,
        api_key_header=candidate.api_key_header,
    )
    return OpenAICompatibleLLMClient(
        LLMClientConfig(
            default=task,
            vision=task,
            timeout_seconds=candidate.timeout_seconds,
            max_retries=candidate.max_retries,
            retry_backoff_ms=candidate.retry_backoff_ms,
        )
    )


def execute_evals(fixtures: list[Fixture], candidates: list[Candidate], output_dir: Path) -> dict[str, Any]:
    if not candidates:
        raise ValueError("--execute requires at least one candidate")
    missing_keys = [candidate.candidate_id for candidate in candidates if not candidate.api_key_configured]
    if missing_keys:
        raise ValueError(f"missing API key for candidates: {', '.join(missing_keys)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []
    for candidate in candidates:
        client = _build_client(candidate)
        candidate_dir = output_dir / candidate.candidate_id
        candidate_dir.mkdir(parents=True, exist_ok=True)
        for fixture in fixtures:
            started_at = time.time()
            payload = client.generate_structured(
                task="vision",
                prompt=VISION_EVAL_PROMPT,
                schema=VISION_EVAL_SCHEMA,
                image_path=str(fixture.image_path),
            )
            duration_ms = round((time.time() - started_at) * 1000)
            result = {
                "ok": isinstance(payload, dict),
                "fixture_id": fixture.fixture_id,
                "model": candidate.model,
                "candidate_id": candidate.candidate_id,
                "duration_ms": duration_ms,
                "image_path": str(fixture.image_path.relative_to(AIMANDALA_ROOT)),
                "output": payload,
            }
            output_path = candidate_dir / f"{fixture.fixture_id}.json"
            output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            results.append({**result, "output_path": str(output_path)})

    summary = {
        "ok": all(item["ok"] for item in results),
        "mode": "execute",
        "fixture_count": len(fixtures),
        "candidate_count": len(candidates),
        "result_count": len(results),
        "output_dir": str(output_dir),
        "results": results,
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return summary


def config_template() -> dict[str, Any]:
    return {
        "candidates": [
            {
                "id": "doubao-vision",
                "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                "model": "<doubao-vision-endpoint-id>",
                "api_key_env": "DOUBAO_API_KEY",
                "api_key_header": "Authorization",
            },
            {
                "id": "qwen-vl",
                "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                "model": "<qwen-vl-model-id>",
                "api_key_env": "DASHSCOPE_API_KEY",
                "api_key_header": "Authorization",
            },
            {
                "id": "glm-vision",
                "base_url": "https://open.bigmodel.cn/api/paas/v4",
                "model": "<glm-vision-model-id>",
                "api_key_env": "GLM_API_KEY",
                "api_key_header": "Authorization",
            },
        ]
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate-config", type=Path, help="JSON file containing vision model candidates.")
    parser.add_argument("--fixture-id", action="append", default=[], help="Fixture id to run, can be repeated.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--execute", action="store_true", help="Call real model APIs and write result JSON files.")
    parser.add_argument("--print-config-template", action="store_true", help="Print a candidate config template.")
    args = parser.parse_args()

    if args.print_config_template:
        print(json.dumps(config_template(), ensure_ascii=False, indent=2))
        return 0

    fixtures = load_fixtures(args.fixture_id or None)
    candidates = load_candidates(args.candidate_config)
    if args.execute:
        result = execute_evals(fixtures, candidates, args.output_dir)
    else:
        result = build_plan(fixtures, candidates, args.output_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
