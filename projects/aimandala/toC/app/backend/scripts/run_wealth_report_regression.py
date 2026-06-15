"""Run wealth report regression cases and write Lite / Pro review artifacts."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Literal


BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
REPO_ROOT = AIMANDALA_ROOT.parents[1]
DEFAULT_REGRESSION_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "qa"
    / "model-evals"
    / "2026-05-16-wealth-report-regression"
)

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


ReportMode = Literal["lite", "pro"]


@dataclass(frozen=True)
class WealthRegressionCase:
    case_id: str
    source_path: Path
    image_path: Path
    painting_intention: str
    painting_feeling: str
    inner_radius: int = 35
    middle_radius: int = 65


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--regression-root",
        default=str(DEFAULT_REGRESSION_ROOT),
        help="Wealth regression root containing cases/.",
    )
    parser.add_argument(
        "--case-id",
        default="",
        help="Run one case id only, for example wealth-case-001.",
    )
    parser.add_argument(
        "--mode",
        choices=["lite", "pro", "both"],
        default="both",
        help="Report mode to run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate case configuration and print planned runs without calling models.",
    )
    parser.add_argument(
        "--check-env",
        action="store_true",
        help="Check model and redeem-code environment without calling models.",
    )
    parser.add_argument(
        "--env-file",
        default="",
        help="Private env file to load before checking or running regression; overrides AIMANDALA_ENV_FILE.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    regression_root = Path(args.regression_root)
    cases = load_cases(regression_root, case_id=args.case_id.strip() or None)
    modes: list[ReportMode] = ["lite", "pro"] if args.mode == "both" else [args.mode]

    planned = [
        {
            "case_id": case.case_id,
            "mode": mode,
            "image_path": str(case.image_path),
            "output_dir": str(regression_root / "cases" / case.case_id / mode),
        }
        for case in cases
        for mode in modes
    ]

    if args.dry_run:
        print(json.dumps({"status": "dry_run", "planned_runs": planned}, ensure_ascii=False, indent=2))
        return 0

    if args.check_env:
        payload = build_env_check_payload(planned_runs=planned)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0 if payload["ready"] else 2

    llm_client = create_llm_client_from_env()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    results = []
    exit_code = 0

    for case in cases:
        for mode in modes:
            output_dir = regression_root / "cases" / case.case_id / mode
            try:
                agent_input = build_agent_input(case, report_mode=mode)
                result = MandalaInterpretationAgent(llm_client=llm_client).run(
                    agent_input=agent_input,
                    knowledge_pack=knowledge_pack,
                )
                written = MandalaInterpretationArtifactStore(output_dir).write(result)
                results.append(
                    {
                        "case_id": case.case_id,
                        "mode": mode,
                        "status": "complete",
                        "quality_gate_passed": result.quality_gate["passed"],
                        "output_dir": str(output_dir),
                        "files": [str(path) for path in written],
                    }
                )
                if not result.quality_gate["passed"]:
                    exit_code = 2
            except Exception as error:  # noqa: BLE001 - runner must keep batch status readable.
                output_dir.mkdir(parents=True, exist_ok=True)
                error_payload = {
                    "case_id": case.case_id,
                    "mode": mode,
                    "status": "failed",
                    "error": str(error),
                    "output_dir": str(output_dir),
                }
                (output_dir / "run_error.json").write_text(
                    json.dumps(error_payload, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                results.append(error_payload)
                exit_code = 2

    print(json.dumps({"status": "complete", "results": results}, ensure_ascii=False, indent=2))
    return exit_code


def load_cases(regression_root: Path, *, case_id: str | None = None) -> list[WealthRegressionCase]:
    cases_root = regression_root / "cases"
    if not cases_root.exists():
        raise FileNotFoundError(f"cases directory missing: {cases_root}")

    source_files = sorted(cases_root.glob("wealth-case-*/source.md"))
    cases = [parse_case_source(path) for path in source_files]
    if case_id:
        cases = [case for case in cases if case.case_id == case_id]
        if not cases:
            raise ValueError(f"case id not found: {case_id}")
    return cases


def parse_case_source(source_path: Path) -> WealthRegressionCase:
    text = source_path.read_text(encoding="utf-8")
    case_id = source_path.parent.name
    source_image = _extract_metadata(text, "source_image")
    if not source_image:
        raise ValueError(f"{case_id}: source_image missing")
    image_path = resolve_repo_path(source_image)
    if not image_path.exists():
        raise FileNotFoundError(f"{case_id}: image not found: {image_path}")
    return WealthRegressionCase(
        case_id=case_id,
        source_path=source_path,
        image_path=image_path,
        painting_intention=_extract_bullet_value(text, "用户意图"),
        painting_feeling=_extract_bullet_value(text, "创作感受"),
    )


def build_agent_input(case: WealthRegressionCase, *, report_mode: ReportMode) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode=report_mode,
        image=MandalaImageInput(local_path=str(case.image_path)),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=case.painting_intention,
            painting_feeling="" if case.painting_feeling == "待补充。" else case.painting_feeling,
        ),
        circle_boundaries={
            "inner_radius": case.inner_radius,
            "middle_radius": case.middle_radius,
            "radius_unit": "normalized_percent",
            "source": "manual_regression_default",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def build_env_check_payload(*, planned_runs: list[dict]) -> dict:
    load_private_env_file()
    env_status = {
        name: "set" if os.getenv(name) else "missing"
        for name in [
            "AIMANDALA_ENV_FILE",
            "AIMANDALA_LLM_API_KEY",
            "AIMANDALA_LLM_BASE_URL",
            "AIMANDALA_LLM_MODEL",
            "AIMANDALA_LLM_CHAT_MODEL",
            "AIMANDALA_LLM_VISION_API_KEY",
            "AIMANDALA_LLM_VISION_BASE_URL",
            "AIMANDALA_LLM_VISION_MODEL",
            "AIMANDALA_LLM_VISION_FALLBACK_API_KEY",
            "AIMANDALA_LLM_VISION_FALLBACK_BASE_URL",
            "AIMANDALA_LLM_VISION_FALLBACK_MODEL",
            "AIMANDALA_REDEEM_CODES",
        ]
    }
    primary_vision_required = [
        "AIMANDALA_LLM_VISION_API_KEY",
        "AIMANDALA_LLM_VISION_BASE_URL",
        "AIMANDALA_LLM_VISION_MODEL",
    ]
    fallback_vision_required = [
        "AIMANDALA_LLM_VISION_FALLBACK_API_KEY",
        "AIMANDALA_LLM_VISION_FALLBACK_BASE_URL",
        "AIMANDALA_LLM_VISION_FALLBACK_MODEL",
    ]
    primary_vision_ready = all(os.getenv(name) for name in primary_vision_required)
    fallback_vision_ready = all(os.getenv(name) for name in fallback_vision_required)
    primary_vision_matches_app = _is_app_vision_route("AIMANDALA_LLM_VISION")
    fallback_vision_matches_app = _is_app_vision_route("AIMANDALA_LLM_VISION_FALLBACK")
    vision_ready = primary_vision_ready or fallback_vision_ready
    app_vision_ready = (
        (primary_vision_ready and primary_vision_matches_app)
        or (fallback_vision_ready and fallback_vision_matches_app)
    )
    text_model_ready = bool(os.getenv("AIMANDALA_LLM_API_KEY"))
    text_model_matches_app = _is_deepseek_v4_text_route()
    missing_agent_required = [
        name
        for name in ["AIMANDALA_LLM_API_KEY"]
        if not os.getenv(name)
    ]
    if text_model_ready and not text_model_matches_app:
        missing_agent_required.append("DeepSeek v4 text route matching app runtime")
    if not vision_ready:
        missing_agent_required.append("AIMANDALA_LLM_VISION_* or AIMANDALA_LLM_VISION_FALLBACK_*")
    elif not app_vision_ready:
        missing_agent_required.append("Volcengine Ark vision route matching app runtime")
    missing_api_required = [
        name
        for name in ["AIMANDALA_REDEEM_CODES"]
        if not os.getenv(name)
    ]
    ready = not missing_agent_required
    return {
        "status": "env_check",
        "ready": ready,
        "agent_regression_ready": ready,
        "api_e2e_ready": ready and not missing_api_required,
        "planned_run_count": len(planned_runs),
        "env": env_status,
        "missing_required": missing_agent_required,
        "missing_agent_required": missing_agent_required,
        "missing_api_required": missing_api_required,
        "primary_vision_ready": primary_vision_ready,
        "fallback_vision_ready": fallback_vision_ready,
        "vision_ready": vision_ready,
        "primary_vision_matches_app": primary_vision_matches_app,
        "fallback_vision_matches_app": fallback_vision_matches_app,
        "app_vision_ready": app_vision_ready,
        "text_model_ready": text_model_ready,
        "text_model_matches_app": text_model_matches_app,
        "notes": [
            "Only set/missing status is reported; secret values are never printed.",
            "Report quality regression must use the same DeepSeek v4 text route as the app runtime.",
            "Real image regression must use the same Volcengine Ark vision route as the app runtime.",
            "AIMANDALA_REDEEM_CODES is required for /api/wealth-reports E2E checks, not for this agent regression runner.",
        ],
    }


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


def _is_app_vision_route(prefix: str) -> bool:
    base_url = os.getenv(f"{prefix}_BASE_URL", "").strip().lower()
    model = os.getenv(f"{prefix}_MODEL", "").strip().lower()
    return "ark.cn-beijing.volces.com/api/v3" in base_url and model.startswith("ep-")


def resolve_repo_path(raw_path: str) -> Path:
    path_text = raw_path.strip()
    if path_text.startswith("$REPO_ROOT/"):
        return REPO_ROOT / path_text[len("$REPO_ROOT/") :]
    candidate = Path(path_text)
    if candidate.is_absolute():
        return candidate
    return REPO_ROOT / candidate


def _extract_metadata(text: str, key: str) -> str:
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped.startswith(">"):
            continue
        content = stripped[1:].strip()
        for sep in ["：", ":"]:
            prefix = f"{key}{sep}"
            if content.startswith(prefix):
                return content[len(prefix) :].strip()
    return ""


def _extract_bullet_value(text: str, key: str) -> str:
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


if __name__ == "__main__":
    raise SystemExit(main())
