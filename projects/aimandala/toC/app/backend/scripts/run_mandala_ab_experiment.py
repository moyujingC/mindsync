"""Run mandala report A/B experiment for one or more complete cases."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import date
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
DEFAULT_OUTPUT_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "qa"
    / "model-evals"
    / f"{date.today().isoformat()}-mandala-ab-experiment"
)
AgentVariant = Literal["two_pass_e2e", "single_pass_e2e"]

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402
from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent  # noqa: E402
from app.core.mandala_interpretation_agent.contracts import (  # noqa: E402
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)


@dataclass(frozen=True)
class AbCaseInput:
    case_id: str
    case_path: Path
    image_path: Path
    marked_image_path: Path
    title: str
    topic_tags: str


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case-root", default=str(CASE_ROOT), help="Complete 11-case directory.")
    parser.add_argument("--output-root", default=str(DEFAULT_OUTPUT_ROOT), help="Output directory.")
    parser.add_argument("--case-id", default="case-001", help="Run one case id only.")
    parser.add_argument(
        "--variant",
        choices=["a", "b", "both"],
        default="both",
        help="Which variant(s) to run for each case.",
    )
    parser.add_argument("--env-file", default="", help="Private env file to load before running.")
    parser.add_argument("--thinking-mode", choices=["default", "on", "off"], default="off")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    load_private_env_file()

    case_root = Path(args.case_root)
    output_root = Path(args.output_root)
    cases = load_cases(case_root, case_id=args.case_id.strip())
    client = create_llm_client_from_env()
    if client.__class__.__name__ == "NoopLLMClient":
        raise RuntimeError("no real LLM client is configured")

    results: list[dict[str, Any]] = []
    for case in cases:
        case_dir = output_root / case.case_id
        case_dir.mkdir(parents=True, exist_ok=True)
        a_dir = case_dir / "a"
        b_dir = case_dir / "b"
        a_dir.mkdir(parents=True, exist_ok=True)
        b_dir.mkdir(parents=True, exist_ok=True)

        a_result = None
        b_result = None
        if args.variant in {"a", "both"}:
            a_result = _run_variant(
                client=client,
                case=case,
                variant="two_pass_e2e",
                output_dir=a_dir,
                thinking_mode=args.thinking_mode,
            )
        if args.variant in {"b", "both"}:
            b_result = _run_variant(
                client=client,
                case=case,
                variant="single_pass_e2e",
                output_dir=b_dir,
                thinking_mode=args.thinking_mode,
            )

        _write_comparison(case_dir / "comparison.md", case=case, a_result=a_result, b_result=b_result)
        results.append(
            {
                "case_id": case.case_id,
                "status": "complete",
                "case_dir": str(case_dir),
                "a": a_result["run_summary"].get("production_role") if a_result else None,
                "b": b_result["run_summary"].get("production_role") if b_result else None,
            }
        )

    summary = {
        "status": "complete",
        "output_root": str(output_root),
        "results": results,
    }
    summary_path = output_root / "run_summary.json"
    if summary_path.exists():
        try:
            existing = json.loads(summary_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
        existing_results = existing.get("results") if isinstance(existing, dict) else []
        merged_by_case: dict[str, dict[str, Any]] = {}
        if isinstance(existing_results, list):
            for item in existing_results:
                if isinstance(item, dict) and item.get("case_id"):
                    merged_by_case[str(item["case_id"])] = item
        for item in results:
            merged_by_case[str(item["case_id"])] = item
        summary["results"] = [merged_by_case[key] for key in sorted(merged_by_case)]
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


def load_cases(case_root: Path, *, case_id: str) -> list[AbCaseInput]:
    cases_dir = case_root / "cases"
    assets_dir = case_root / "assets"
    case_paths = sorted(cases_dir.glob("case-*.md"))
    cases: list[AbCaseInput] = []
    for case_path in case_paths:
        current_id = case_path.stem
        if case_id and current_id != case_id:
            continue
        image_path = _first_existing_asset(assets_dir, f"{current_id}-mandala", ["jpg", "jpeg", "png"])
        marked_image_path = _first_existing_asset(assets_dir, f"{current_id}-mandala-3q", ["jpg", "jpeg", "png"])
        cases.append(
            AbCaseInput(
                case_id=current_id,
                case_path=case_path,
                image_path=image_path,
                marked_image_path=marked_image_path,
                title=_extract_title(case_path.read_text(encoding="utf-8"), fallback=current_id),
                topic_tags=_extract_metadata_bullet(case_path.read_text(encoding="utf-8"), "主题标签"),
            )
        )
    return cases


def _run_variant(
    *,
    client,
    case: AbCaseInput,
    variant: AgentVariant,
    output_dir: Path,
    thinking_mode: str,
) -> dict[str, Any]:
    agent_input = MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(
            local_path=str(case.image_path),
            marked_local_path=str(case.marked_image_path),
        ),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=f"A/B 对照：{case.title}",
            painting_feeling="",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "ab_experiment",
        },
        agent_variant=variant,
        output_requirements=MandalaOutputRequirements(),
    )
    result = MandalaInterpretationAgent(llm_client=client).run(
        agent_input=agent_input,
        disable_thinking=(False if thinking_mode == "on" else True),
    )
    _write_artifacts(output_dir, result)
    return {
        "run_summary": result.run_summary,
        "quality_gate": result.quality_gate,
        "prompt_pack_manifest": result.prompt_pack_manifest,
        "final_report_md": result.final_report_md,
    }


def _write_artifacts(output_dir: Path, result) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    files = {
        "agent_input.json": result.agent_input,
        "visual_draft.json": result.visual_draft,
        "prompt_pack_manifest.json": result.prompt_pack_manifest,
        "final_report.json": result.final_report,
        "quality_gate.json": result.quality_gate,
        "run_summary.json": result.run_summary,
    }
    for filename, payload in files.items():
        (output_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    (output_dir / "visual_draft.md").write_text(
        _visual_draft_markdown(result.visual_draft) + "\n",
        encoding="utf-8",
    )
    (output_dir / "final_report.md").write_text(result.final_report_md.strip() + "\n", encoding="utf-8")


def _write_comparison(path: Path, *, case: AbCaseInput, a_result: dict[str, Any], b_result: dict[str, Any]) -> None:
    lines = [
        f"# {case.case_id} A/B 对照",
        "",
        f"- 案例：{case.title}",
        f"- 主题标签：{case.topic_tags or '未提取'}",
        f"- 原图：`{_repo_relative(case.image_path)}`",
        f"- 标记图：`{_repo_relative(case.marked_image_path)}`",
        "",
        "## A 方案",
        "",
        f"- 生产角色：{a_result['run_summary'].get('production_role')}" if a_result else "- 生产角色：未运行",
        f"- 可复用视觉基准：{a_result['run_summary'].get('reusable_visual_baseline')}" if a_result else "- 可复用视觉基准：未运行",
        f"- 质量门：{a_result['quality_gate'].get('passed')}" if a_result else "- 质量门：未运行",
        "- 报告：a/final_report.md",
        "",
        "## B 方案",
        "",
        f"- 生产角色：{b_result['run_summary'].get('production_role')}" if b_result else "- 生产角色：未运行",
        f"- 可复用视觉基准：{b_result['run_summary'].get('reusable_visual_baseline')}" if b_result else "- 可复用视觉基准：未运行",
        f"- 质量门：{b_result['quality_gate'].get('passed')}" if b_result else "- 质量门：未运行",
        "- 报告：b/final_report.md",
        "",
        "## 人工评审建议",
        "",
        "- 先看视觉一致性，再看财富主线，再看疗愈师带读感。",
        "- 如果 B 更自然，优点只反哺 A，不直接替换生产默认。",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _visual_draft_markdown(visual_draft: dict[str, Any]) -> str:
    markdown = visual_draft.get("visual_draft_md")
    if isinstance(markdown, str) and markdown.strip():
        return markdown.strip()
    return json.dumps(visual_draft, ensure_ascii=False, indent=2)


def _repo_relative(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _extract_title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def _first_existing_asset(assets_dir: Path, stem: str, suffixes: list[str]) -> Path:
    for suffix in suffixes:
        path = assets_dir / f"{stem}.{suffix}"
        if path.exists():
            return path
    return assets_dir / f"{stem}.{suffixes[0]}"


def _extract_metadata_bullet(text: str, label: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(f"- {label}："):
            return stripped.split("：", 1)[1].strip()
    return ""


if __name__ == "__main__":
    raise SystemExit(main())
