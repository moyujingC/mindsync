"""Run wealth report regression on the 10 complete golden cases.

This runner uses the existing golden foundation_image_reading outputs as the
visual seed and the configured real text model for report generation.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Literal


BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
REPO_ROOT = AIMANDALA_ROOT.parents[1]
CASE_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "70-评估与案例"
    / "10-完整解读案例11例"
)
FOUNDATION_SEED_ROOT = CASE_ROOT / "05-foundation-image-reading黄金样例集"
DEFAULT_OUTPUT_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "qa"
    / "model-evals"
    / "2026-05-22-wealth-report-golden-case-regression"
)
EXCLUDED_CASE_IDS = {"case-006"}
ReportMode = Literal["lite", "pro"]


sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402
from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent  # noqa: E402
from app.core.mandala_interpretation_agent.artifact_store import MandalaInterpretationArtifactStore  # noqa: E402
from app.core.mandala_interpretation_agent.contracts import (  # noqa: E402
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.knowledge_pack_builder import KnowledgePackBuilder  # noqa: E402


@dataclass(frozen=True)
class CompleteCaseReportInput:
    case_id: str
    case_path: Path
    image_path: Path
    marked_image_path: Path
    title: str
    topic_tags: str
    source_foundation_path: Path


class FoundationVisualSeedLLMClient:
    """Seed only the visual observation and delegate text stages to the real model."""

    def __init__(self, *, visual_observation: dict[str, Any], delegate: Any) -> None:
        self.visual_observation = visual_observation
        self.delegate = delegate
        self.last_attempt_trace = [{"source": "golden_foundation.visual_observation"}]

    def generate_structured(
        self,
        *,
        task: str,
        prompt: str,
        schema: dict[str, Any],
        image_path: str | None = None,
        image_paths: list[str] | None = None,
        disable_thinking: bool | None = None,
    ) -> dict[str, Any]:
        return {"visual_observation": self.visual_observation}

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
        disable_thinking: bool | None = None,
    ) -> str:
        generated = self.delegate.generate_text(
            task=task,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            disable_thinking=disable_thinking,
        )
        self.last_attempt_trace = list(getattr(self.delegate, "last_attempt_trace", []))
        return generated


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case-root", default=str(CASE_ROOT), help="Complete 11-case directory.")
    parser.add_argument("--foundation-root", default=str(FOUNDATION_SEED_ROOT), help="Seed foundation outputs.")
    parser.add_argument("--output-root", default=str(DEFAULT_OUTPUT_ROOT), help="Output directory.")
    parser.add_argument("--case-id", default="", help="Run one case id only, for example case-001.")
    parser.add_argument(
        "--mode",
        choices=["lite", "pro", "both"],
        default="both",
        help="Report mode to run.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate planned cases without calling models.")
    parser.add_argument("--check-env", action="store_true", help="Check text model and seed assets without calling models.")
    parser.add_argument("--env-file", default="", help="Private env file to load before checking or running.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()

    case_root = Path(args.case_root)
    foundation_root = Path(args.foundation_root)
    output_root = Path(args.output_root)
    cases = load_complete_cases(case_root, foundation_root, case_id=args.case_id.strip() or None)
    modes: list[ReportMode] = ["lite", "pro"] if args.mode == "both" else [args.mode]

    planned = [
        {
            "case_id": case.case_id,
            "mode": mode,
            "case_path": str(case.case_path),
            "seed_path": str(case.source_foundation_path),
            "output_dir": str(output_root / case.case_id / mode),
        }
        for case in cases
        for mode in modes
    ]

    if args.dry_run:
        print(json.dumps({"status": "dry_run", "planned_runs": planned}, ensure_ascii=False, indent=2))
        return 0

    env_check = build_env_check_payload(planned_runs=planned)
    if args.check_env:
        print(json.dumps(env_check, ensure_ascii=False, indent=2))
        return 0 if env_check["ready"] else 2
    if not env_check["ready"]:
        print(json.dumps(env_check, ensure_ascii=False, indent=2))
        return 2

    load_private_env_file()
    llm_client = create_llm_client_from_env()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    results = []
    exit_code = 0

    for case in cases:
        for mode in modes:
            output_dir = output_root / case.case_id / mode
            output_dir.mkdir(parents=True, exist_ok=True)
            started_at = datetime.now(timezone.utc)
            try:
                seed_payload = load_foundation_seed(case.source_foundation_path)
                seeded_client = FoundationVisualSeedLLMClient(
                    visual_observation=extract_visual_observation_seed(seed_payload),
                    delegate=llm_client,
                )
                agent_input = build_agent_input(case, report_mode=mode)
                result = MandalaInterpretationAgent(llm_client=seeded_client).run(
                    agent_input=agent_input,
                    knowledge_pack=knowledge_pack,
                )
                written = MandalaInterpretationArtifactStore(output_dir).write(result)
                (output_dir / "foundation_seed.json").write_text(
                    json.dumps(seed_payload, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                finished_at = datetime.now(timezone.utc)
                results.append(
                    {
                        "case_id": case.case_id,
                        "mode": mode,
                        "status": "complete",
                        "quality_gate_passed": result.quality_gate["passed"],
                        "output_dir": str(output_dir),
                        "started_at": started_at.isoformat(),
                        "finished_at": finished_at.isoformat(),
                        "files": [str(path) for path in written] + [str(output_dir / "foundation_seed.json")],
                    }
                )
                if not result.quality_gate["passed"]:
                    exit_code = 2
            except Exception as error:  # noqa: BLE001 - batch runner must keep failures readable.
                finished_at = datetime.now(timezone.utc)
                error_payload = {
                    "case_id": case.case_id,
                    "mode": mode,
                    "status": "failed",
                    "error": str(error),
                    "output_dir": str(output_dir),
                    "started_at": started_at.isoformat(),
                    "finished_at": finished_at.isoformat(),
                }
                (output_dir / "run_error.json").write_text(
                    json.dumps(error_payload, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                results.append(error_payload)
                exit_code = 2

    write_run_index(output_root=output_root, cases=cases, results=results, env_check=env_check)
    print(json.dumps({"status": "complete", "results": results}, ensure_ascii=False, indent=2))
    return exit_code


def load_complete_cases(
    case_root: Path,
    foundation_root: Path,
    *,
    case_id: str | None = None,
) -> list[CompleteCaseReportInput]:
    cases_dir = case_root / "cases"
    assets_dir = case_root / "assets"
    if not cases_dir.exists():
        raise FileNotFoundError(f"cases directory missing: {cases_dir}")
    if not assets_dir.exists():
        raise FileNotFoundError(f"assets directory missing: {assets_dir}")
    if not foundation_root.exists():
        raise FileNotFoundError(f"foundation seed directory missing: {foundation_root}")

    case_paths = sorted(cases_dir.glob("case-*.md"))
    cases = [parse_complete_case(path, assets_dir=assets_dir, foundation_root=foundation_root) for path in case_paths]
    cases = [case for case in cases if case.case_id not in EXCLUDED_CASE_IDS]
    if case_id:
        cases = [case for case in cases if case.case_id == case_id]
        if not cases:
            raise ValueError(f"case id not found: {case_id}")
    return cases


def parse_complete_case(case_path: Path, *, assets_dir: Path, foundation_root: Path) -> CompleteCaseReportInput:
    text = case_path.read_text(encoding="utf-8")
    case_id = case_path.stem
    image_path = _first_existing_path(
        [
            assets_dir / f"{case_id}-mandala.jpg",
            assets_dir / f"{case_id}-mandala.png",
        ]
    )
    marked_image_path = _first_existing_path(
        [
            assets_dir / f"{case_id}-mandala-3q.jpg",
            assets_dir / f"{case_id}-mandala-3q.png",
        ]
    )
    source_foundation_path = foundation_root / f"{case_id}.foundation-image-reading.json"
    if not image_path.exists():
        raise FileNotFoundError(f"{case_id}: original image missing: {image_path}")
    if not marked_image_path.exists():
        raise FileNotFoundError(f"{case_id}: marked image missing: {marked_image_path}")
    if not source_foundation_path.exists():
        raise FileNotFoundError(f"{case_id}: foundation seed missing: {source_foundation_path}")
    return CompleteCaseReportInput(
        case_id=case_id,
        case_path=case_path,
        image_path=image_path,
        marked_image_path=marked_image_path,
        title=_extract_title(text, fallback=case_id),
        topic_tags=_extract_metadata_bullet(text, "主题标签"),
        source_foundation_path=source_foundation_path,
    )


def load_foundation_seed(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    foundation = payload.get("foundation_image_reading")
    if not isinstance(foundation, dict):
        raise ValueError(f"invalid foundation seed payload: {path}")
    if not foundation.get("evidence_links"):
        foundation["evidence_links"] = build_evidence_links_from_foundation(foundation)
    return payload


def extract_visual_observation_seed(payload: dict[str, Any]) -> dict[str, Any]:
    foundation = payload.get("foundation_image_reading")
    if not isinstance(foundation, dict):
        raise ValueError("foundation_image_reading missing in seed payload")
    visual_observation = foundation.get("visual_observation")
    if not isinstance(visual_observation, dict):
        raise ValueError("visual_observation missing in seed payload")
    return visual_observation


def build_evidence_links_from_foundation(foundation: dict[str, Any]) -> list[dict[str, Any]]:
    links: list[dict[str, Any]] = []
    visual_units_by_id = visual_units_by_id_from_foundation(foundation)

    element_sensing = foundation.get("element_sensing")
    if isinstance(element_sensing, dict):
        for circle_key, circle in element_sensing.items():
            if not isinstance(circle, dict):
                continue
            candidates = circle.get("element_candidates")
            if not isinstance(candidates, list):
                continue
            for item in candidates:
                if not isinstance(item, dict):
                    continue
                unit_id = str(item.get("visual_unit_id") or "").strip()
                basis = "；".join(_string_list(item.get("basis")))
                unit = visual_units_by_id.get(unit_id, {})
                links.append(
                    {
                        "claim_id": unit_id,
                        "claim_type": "element_sensing",
                        "claim_text": f"{unit_id} 五行候选为 {item.get('element', '')}。".strip(),
                        "visual_unit_ids": [unit_id] if unit_id else [],
                        "circle_observation_refs": [f"visual_observation.circle_visual_units.{circle_key}"],
                        "evidence_text": basis or str(unit.get("rich_visual_description") or "").strip(),
                    }
                )

    relations = foundation.get("intra_circle_relations")
    if isinstance(relations, dict):
        for circle_key, circle in relations.items():
            if not isinstance(circle, dict):
                continue
            circle_relations = circle.get("relations")
            if not isinstance(circle_relations, list):
                continue
            for item in circle_relations:
                if not isinstance(item, dict):
                    continue
                relation_id = str(item.get("relation_id") or "").strip()
                links.append(
                    {
                        "claim_id": relation_id,
                        "claim_type": "intra_circle_relation",
                        "claim_text": str(item.get("notes") or item.get("relation_type") or "").strip(),
                        "visual_unit_ids": _string_list(item.get("involved_visual_unit_ids")),
                        "circle_observation_refs": [f"visual_observation.circle_visual_units.{circle_key}"],
                        "evidence_text": str(item.get("visible_basis") or "").strip(),
                    }
                )

    flow = foundation.get("cross_circle_flow")
    flow_observations = flow.get("flow_observations") if isinstance(flow, dict) else []
    if isinstance(flow_observations, list):
        for item in flow_observations:
            if not isinstance(item, dict):
                continue
            flow_id = str(item.get("flow_id") or "").strip()
            links.append(
                {
                    "claim_id": flow_id,
                    "claim_type": "cross_circle_flow",
                    "claim_text": str(item.get("flow_type") or "").strip(),
                    "visual_unit_ids": [],
                    "circle_observation_refs": ["visual_observation.three_circle_observation"],
                    "evidence_text": str(item.get("visual_basis") or "").strip(),
                }
            )
    return [link for link in links if link.get("claim_id") or link.get("evidence_text")]


def visual_units_by_id_from_foundation(foundation: dict[str, Any]) -> dict[str, dict[str, Any]]:
    units_by_id: dict[str, dict[str, Any]] = {}
    visual_observation = foundation.get("visual_observation")
    circles = (
        visual_observation.get("circle_visual_units")
        if isinstance(visual_observation, dict)
        else {}
    )
    if not isinstance(circles, dict):
        return units_by_id
    for circle in circles.values():
        if not isinstance(circle, dict):
            continue
        units = circle.get("visual_units")
        if not isinstance(units, list):
            continue
        for unit in units:
            if not isinstance(unit, dict):
                continue
            unit_id = str(unit.get("id") or "").strip()
            if unit_id:
                units_by_id[unit_id] = unit
    return units_by_id


def build_agent_input(case: CompleteCaseReportInput, *, report_mode: ReportMode) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode=report_mode,
        image=MandalaImageInput(
            local_path=str(case.image_path),
            marked_local_path=str(case.marked_image_path),
        ),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=case.title,
            painting_feeling="",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "golden_case_seed",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def build_env_check_payload(*, planned_runs: list[dict[str, Any]]) -> dict[str, Any]:
    load_private_env_file()
    text_model_ready = bool(os.getenv("AIMANDALA_LLM_API_KEY"))
    text_model_matches_app = _is_deepseek_v4_text_route()
    missing_required: list[str] = []
    if not text_model_ready:
        missing_required.append("AIMANDALA_LLM_API_KEY")
    elif not text_model_matches_app:
        missing_required.append("DeepSeek v4 text route matching app runtime")

    missing_seed_cases = []
    for item in planned_runs:
        seed_path = Path(str(item.get("seed_path") or ""))
        if not seed_path.exists():
            missing_seed_cases.append(str(item.get("case_id") or seed_path))
    if missing_seed_cases:
        missing_required.append(f"foundation seed missing for: {', '.join(missing_seed_cases)}")

    return {
        "status": "env_check",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "ready": not missing_required,
        "planned_run_count": len(planned_runs),
        "text_model_ready": text_model_ready,
        "text_model_matches_app": text_model_matches_app,
        "missing_required": missing_required,
        "notes": [
            "Golden report regression uses seeded golden foundation outputs and a real DeepSeek v4 text model.",
            "Visual quality is not re-evaluated by this runner.",
            "Secret values are never printed.",
        ],
    }


def write_run_index(
    *,
    output_root: Path,
    cases: list[CompleteCaseReportInput],
    results: list[dict[str, Any]],
    env_check: dict[str, Any],
) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    rows = [
        "| 案例 | 模式 | 状态 | 耗时秒 | 报告 | foundation seed |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    result_by_key = {
        f"{str(item.get('case_id'))}:{str(item.get('mode'))}": item
        for item in results
    }
    for case in cases:
        for mode in ["lite", "pro"]:
            key = f"{case.case_id}:{mode}"
            result = result_by_key.get(key) or _existing_mode_result(output_root, case.case_id, mode)
            rows.append(
                f"| {case.case_id} | {mode} | {result.get('status', 'unknown')} | "
                f"{result.get('duration_seconds', '')} | "
                f"[{case.case_id}/{mode}/final_report.md]({case.case_id}/{mode}/final_report.md) | "
                f"`{_repo_relative(case.source_foundation_path)}` |"
            )
    content = "\n".join(
        [
            "# complete-case wealth report regression",
            "",
            f"> 生成日期：{date.today().isoformat()}",
            f"> 生成时间（UTC）：{datetime.now(timezone.utc).isoformat()}",
            "> 模型要求：文字 DeepSeek v4；视觉使用黄金 foundation seed，不重新跑视觉模型。",
            f"> env_ready：{env_check.get('ready')}",
            f"> text_model_matches_app：{env_check.get('text_model_matches_app')}",
            "",
            *rows,
            "",
        ]
    )
    path = output_root / "README.md"
    path.write_text(content, encoding="utf-8")
    return path


def _existing_mode_result(output_root: Path, case_id: str, mode: str) -> dict[str, Any]:
    mode_root = output_root / case_id / mode
    quality_path = mode_root / "quality_gate.json"
    report_path = mode_root / "final_report.md"
    if not quality_path.exists() or not report_path.exists():
        return {}
    try:
        quality = json.loads(quality_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"status": "existing_invalid"}
    return {
        "case_id": case_id,
        "mode": mode,
        "status": "existing_passed" if quality.get("passed") is True else "existing_failed",
    }


def _extract_title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip() or fallback
    return fallback


def _extract_metadata_bullet(text: str, key: str) -> str:
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped.startswith("- "):
            continue
        content = stripped[2:].strip()
        for sep in ["：", ":"]:
            prefix = f"{key}{sep}"
            if content.startswith(prefix):
                return content[len(prefix) :].strip()
    return ""


def _first_existing_path(paths: list[Path]) -> Path:
    for path in paths:
        if path.exists():
            return path
    return paths[0]


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _repo_relative(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _is_deepseek_v4_text_route() -> bool:
    base_url = (
        os.getenv("AIMANDALA_LLM_CHAT_BASE_URL", "").strip()
        or os.getenv("AIMANDALA_LLM_BASE_URL", "").strip()
        or "https://api.deepseek.com"
    ).lower()
    model = (
        os.getenv("AIMANDALA_LLM_CHAT_MODEL", "").strip()
        or os.getenv("AIMANDALA_LLM_MODEL", "").strip()
        or "deepseek-v4-pro"
    ).lower()
    return "deepseek" in base_url and model.startswith("deepseek-v4")


if __name__ == "__main__":
    raise SystemExit(main())
