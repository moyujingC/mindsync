"""Run foundation_image_reading for the 11 complete mandala cases."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


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
DEFAULT_OUTPUT_ROOT = CASE_ROOT / "foundation-runs" / date.today().isoformat()
VISION_PROVIDERS = {"qwen", "doubao", "custom"}
THINKING_MODES = {"on", "off"}

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402
from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent  # noqa: E402
from app.core.mandala_interpretation_agent.contracts import (  # noqa: E402
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)


NOTE_KEYS = ["global", "inner", "middle", "outer"]
NOTE_LABELS = [
    ("global", "整体画面"),
    ("inner", "内圈"),
    ("middle", "中圈"),
    ("outer", "外圈"),
]
MAX_SOURCE_NOTES_PER_LAYER = 10
MAX_REVIEWED_NOTES_PER_LAYER = 8


@dataclass(frozen=True)
class CompleteCaseFoundationInput:
    case_id: str
    case_path: Path
    image_path: Path
    marked_image_path: Path
    title: str
    topic_tags: str
    source_visual_notes: dict[str, list[str]]
    reviewed_visual_notes: dict[str, list[str]]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case-root", default=str(CASE_ROOT), help="Complete 11-case directory.")
    parser.add_argument("--output-root", default=str(DEFAULT_OUTPUT_ROOT), help="Output directory.")
    parser.add_argument("--case-id", default="", help="Run one case id only, for example case-001.")
    parser.add_argument(
        "--vision-provider",
        choices=sorted(VISION_PROVIDERS),
        default="qwen",
        help="Vision route requirement for review runs.",
    )
    parser.add_argument(
        "--thinking-mode",
        choices=sorted(THINKING_MODES),
        default="off",
        help="Whether to request model thinking during the run.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate planned cases without calling models.")
    parser.add_argument("--check-env", action="store_true", help="Check real model environment without calling models.")
    parser.add_argument(
        "--refresh-review",
        action="store_true",
        help="Regenerate review.md from existing foundation_image_reading.json without calling models.",
    )
    parser.add_argument("--env-file", default="", help="Private env file to load before checking or running.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    vision_provider = args.vision_provider.strip().lower()

    case_root = Path(args.case_root)
    thinking_mode = _normalize_thinking_mode(args.thinking_mode)
    output_root = _resolve_output_root(
        raw_output_root=args.output_root,
        vision_provider=vision_provider,
        thinking_mode=thinking_mode,
    )
    cases = load_complete_cases(case_root, case_id=args.case_id.strip() or None)
    planned = [
        {
            "case_id": case.case_id,
            "image_path": str(case.image_path),
            "marked_image_path": str(case.marked_image_path),
            "output_dir": str(output_root / case.case_id),
        }
        for case in cases
    ]

    if args.dry_run:
        print(json.dumps({"status": "dry_run", "planned_runs": planned}, ensure_ascii=False, indent=2))
        return 0

    if args.check_env:
        payload = build_env_check_payload(
            planned_runs=planned,
            vision_provider=vision_provider,
            thinking_mode=thinking_mode,
        )
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0 if payload["ready"] else 2

    if args.refresh_review:
        results = refresh_existing_reviews(output_root=output_root, cases=cases)
        print(json.dumps({"status": "refreshed", "results": results}, ensure_ascii=False, indent=2))
        return 0 if all(item["status"] == "complete" for item in results) else 2

    env_check = build_env_check_payload(
        planned_runs=planned,
        vision_provider=vision_provider,
        thinking_mode=thinking_mode,
    )
    if not env_check["ready"]:
        print(json.dumps(env_check, ensure_ascii=False, indent=2))
        return 2

    load_private_env_file()
    agent = MandalaInterpretationAgent(llm_client=create_llm_client_from_env())
    results = []
    exit_code = 0
    for case in cases:
        output_dir = output_root / case.case_id
        output_dir.mkdir(parents=True, exist_ok=True)
        case_started_at = datetime.now(timezone.utc)
        case_started_monotonic = time.monotonic()
        try:
            foundation_image_reading = agent.run_foundation_image_reading(
                agent_input=build_agent_input(case),
                disable_thinking=_thinking_mode_enabled(thinking_mode) is False,
            )
            case_finished_at = datetime.now(timezone.utc)
            files = write_foundation_artifacts(
                output_dir=output_dir,
                case=case,
                foundation_image_reading=foundation_image_reading,
                env_check=env_check,
                run_meta=_run_meta(
                    vision_provider=vision_provider,
                    thinking_mode=thinking_mode,
                    started_at=case_started_at,
                    finished_at=case_finished_at,
                    duration_seconds=time.monotonic() - case_started_monotonic,
                ),
            )
            results.append(
                {
                    "case_id": case.case_id,
                    "status": "complete",
                    "output_dir": str(output_dir),
                    "started_at": case_started_at.isoformat(),
                    "finished_at": case_finished_at.isoformat(),
                    "duration_seconds": round(time.monotonic() - case_started_monotonic, 3),
                    "files": [str(path) for path in files],
                }
            )
        except Exception as error:  # noqa: BLE001 - batch runner should keep failures readable.
            case_finished_at = datetime.now(timezone.utc)
            error_payload = {
                "case_id": case.case_id,
                "status": "failed",
                "error": str(error),
                "output_dir": str(output_dir),
                "started_at": case_started_at.isoformat(),
                "finished_at": case_finished_at.isoformat(),
                "duration_seconds": round(time.monotonic() - case_started_monotonic, 3),
            }
            (output_dir / "run_error.json").write_text(
                json.dumps(error_payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            results.append(error_payload)
            exit_code = 2
    write_run_index(
        output_root=output_root,
        cases=cases,
        results=results,
        env_check=env_check,
    )
    print(json.dumps({"status": "complete", "results": results}, ensure_ascii=False, indent=2))
    return exit_code


def load_complete_cases(
    case_root: Path,
    *,
    case_id: str | None = None,
) -> list[CompleteCaseFoundationInput]:
    cases_dir = case_root / "cases"
    assets_dir = case_root / "assets"
    if not cases_dir.exists():
        raise FileNotFoundError(f"cases directory missing: {cases_dir}")
    if not assets_dir.exists():
        raise FileNotFoundError(f"assets directory missing: {assets_dir}")
    case_paths = sorted(cases_dir.glob("case-*.md"))
    cases = [parse_complete_case(path, assets_dir=assets_dir) for path in case_paths]
    if case_id:
        cases = [case for case in cases if case.case_id == case_id]
        if not cases:
            raise ValueError(f"case id not found: {case_id}")
    return cases


def parse_complete_case(case_path: Path, *, assets_dir: Path) -> CompleteCaseFoundationInput:
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
    if not image_path.exists():
        raise FileNotFoundError(f"{case_id}: original image missing: {image_path}")
    if not marked_image_path.exists():
        raise FileNotFoundError(f"{case_id}: marked image missing: {marked_image_path}")
    return CompleteCaseFoundationInput(
        case_id=case_id,
        case_path=case_path,
        image_path=image_path,
        marked_image_path=marked_image_path,
        title=_extract_title(text, fallback=case_id),
        topic_tags=_extract_metadata_bullet(text, "主题标签"),
        source_visual_notes=_extract_source_visual_notes(text),
        reviewed_visual_notes=_extract_reviewed_visual_notes(text),
    )


def build_agent_input(case: CompleteCaseFoundationInput) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(
            local_path=str(case.image_path),
            marked_local_path=str(case.marked_image_path),
        ),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=f"基础层图像解读审核：{case.title}",
            painting_feeling="",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual_case_review_default",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def build_env_check_payload(
    *,
    planned_runs: list[dict[str, Any]],
    vision_provider: str = "qwen",
    thinking_mode: str = "off",
) -> dict[str, Any]:
    load_private_env_file()
    normalized_provider = _normalize_vision_provider(vision_provider)
    normalized_thinking_mode = _normalize_thinking_mode(thinking_mode)
    primary_vision_ready = all(
        os.getenv(name)
        for name in [
            "AIMANDALA_LLM_VISION_API_KEY",
            "AIMANDALA_LLM_VISION_BASE_URL",
            "AIMANDALA_LLM_VISION_MODEL",
        ]
    )
    fallback_vision_ready = all(
        os.getenv(name)
        for name in [
            "AIMANDALA_LLM_VISION_FALLBACK_API_KEY",
            "AIMANDALA_LLM_VISION_FALLBACK_BASE_URL",
            "AIMANDALA_LLM_VISION_FALLBACK_MODEL",
        ]
    )
    primary_vision_matches_app = _vision_route_matches_provider(
        "AIMANDALA_LLM_VISION",
        provider=normalized_provider,
    )
    fallback_vision_matches_app = _vision_route_matches_provider(
        "AIMANDALA_LLM_VISION_FALLBACK",
        provider=normalized_provider,
    )
    vision_ready = primary_vision_ready or fallback_vision_ready
    app_vision_ready = (
        (primary_vision_ready and primary_vision_matches_app)
        or (fallback_vision_ready and fallback_vision_matches_app)
    )
    text_model_ready = bool(os.getenv("AIMANDALA_LLM_API_KEY"))
    text_model_matches_app = _is_deepseek_v4_text_route()
    missing_required = []
    if not text_model_ready:
        missing_required.append("AIMANDALA_LLM_API_KEY")
    elif not text_model_matches_app:
        missing_required.append("DeepSeek v4 text route matching app runtime")
    if not vision_ready:
        missing_required.append("AIMANDALA_LLM_VISION_* or AIMANDALA_LLM_VISION_FALLBACK_*")
    elif not app_vision_ready:
        missing_required.append(_vision_route_requirement_label(normalized_provider))
    return {
        "status": "env_check",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "ready": not missing_required,
        "vision_provider": normalized_provider,
        "thinking_mode": normalized_thinking_mode,
        "planned_run_count": len(planned_runs),
        "missing_required": missing_required,
        "text_model_ready": text_model_ready,
        "text_model_matches_app": text_model_matches_app,
        "primary_vision_ready": primary_vision_ready,
        "fallback_vision_ready": fallback_vision_ready,
        "vision_ready": vision_ready,
        "primary_vision_matches_app": primary_vision_matches_app,
        "fallback_vision_matches_app": fallback_vision_matches_app,
        "app_vision_ready": app_vision_ready,
        "notes": [
            "Foundation image reading review must use real models.",
            "Text route must match DeepSeek v4.",
            f"Vision route must match {normalized_provider}.",
            f"Thinking mode is {normalized_thinking_mode}.",
            "Secret values are never printed.",
        ],
    }


def refresh_existing_reviews(
    *,
    output_root: Path,
    cases: list[CompleteCaseFoundationInput],
) -> list[dict[str, Any]]:
    results = []
    for case in cases:
        output_dir = output_root / case.case_id
        foundation_path = output_dir / "foundation_image_reading.json"
        if not foundation_path.exists():
            results.append(
                {
                    "case_id": case.case_id,
                    "status": "missing_foundation_image_reading",
                    "foundation_path": str(foundation_path),
                }
            )
            continue
        foundation_image_reading = json.loads(foundation_path.read_text(encoding="utf-8"))
        review_path = output_dir / f"{case.case_id}-review.md"
        review_path.write_text(
            _render_review_markdown(
                case=case,
                foundation_image_reading=foundation_image_reading,
            ),
            encoding="utf-8",
        )
        results.append(
            {
                "case_id": case.case_id,
                "status": "complete",
                "review_path": str(review_path),
            }
        )
    return results


def write_foundation_artifacts(
    *,
    output_dir: Path,
    case: CompleteCaseFoundationInput,
    foundation_image_reading: dict[str, Any],
    env_check: dict[str, Any],
    run_meta: dict[str, Any],
) -> list[Path]:
    files: dict[str, str] = {
        "foundation_image_reading.json": json.dumps(
            {
                **foundation_image_reading,
                "run_meta": run_meta,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        "env_check.json": json.dumps(env_check, ensure_ascii=False, indent=2) + "\n",
        f"{case.case_id}-review.md": _render_review_markdown(
            case=case,
            foundation_image_reading=foundation_image_reading,
        ),
    }
    written = []
    for filename, content in files.items():
        path = output_dir / filename
        path.write_text(content, encoding="utf-8")
        written.append(path)
    return written


def write_run_index(
    *,
    output_root: Path,
    cases: list[CompleteCaseFoundationInput],
    results: list[dict[str, Any]],
    env_check: dict[str, Any],
) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    rows = [
        "| 案例 | 状态 | 耗时秒 | 审核入口 | 原画作 | 三圈标记图 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    result_by_case = {str(item.get("case_id")): item for item in results}
    for case in cases:
        result = result_by_case.get(case.case_id, {})
        rows.append(
            f"| {case.case_id} | {result.get('status', 'unknown')} | "
            f"{result.get('duration_seconds', '')} | "
            f"[{case.case_id}/{case.case_id}-review.md]({case.case_id}/{case.case_id}-review.md) | "
            f"`{_repo_relative(case.image_path)}` | `{_repo_relative(case.marked_image_path)}` |"
        )
    content = "\n".join(
        [
            "# foundation_image_reading 审核运行索引",
            "",
            f"> 生成日期：{date.today().isoformat()}",
            f"> 生成时间（UTC）：{datetime.now(timezone.utc).isoformat()}",
            "> 模型要求：文字 DeepSeek v4；视觉 Qwen/DashScope。",
            f"> thinking_mode：{env_check.get('thinking_mode')}",
            f"> env_ready：{env_check.get('ready')}",
            f"> app_vision_ready：{env_check.get('app_vision_ready')}",
            f"> text_model_matches_app：{env_check.get('text_model_matches_app')}",
            "",
            *rows,
            "",
        ]
    )
    path = output_root / "README.md"
    path.write_text(content, encoding="utf-8")
    return path


def _render_review_markdown(
    *,
    case: CompleteCaseFoundationInput,
    foundation_image_reading: dict[str, Any],
) -> str:
    foundation = _foundation_payload(foundation_image_reading)
    return "\n".join(
        [
            f"# {case.case_id} foundation_image_reading 审核",
            "",
            "## 基本信息",
            "",
            f"- 案例：{case.title}",
            f"- 主题标签：{case.topic_tags or '未提取'}",
            f"- 原画作：`{_repo_relative(case.image_path)}`",
            f"- 三圈标记图：`{_repo_relative(case.marked_image_path)}`",
            "- 审核状态：待人工审核",
            "",
            "## 模型输出摘要",
            "",
            *_model_summary_lines(foundation),
            "",
            "## 原文对画面内容的描述",
            "",
            *_visual_note_sections(
                case.source_visual_notes,
                empty_text="原文未提取到明确的画面内容描述。",
            ),
            "## 人工审核区视觉基准摘录",
            "",
            *_visual_note_sections(
                case.reviewed_visual_notes,
                empty_text="人工审核区未提取到明确画面识别句。",
            ),
            "## 原文、人工基准与模型对照",
            "",
            *_source_model_comparison_sections(
                case=case,
                foundation_image_reading=foundation_image_reading,
            ),
            "## 圈层视觉单元",
            "",
            *_circle_visual_unit_sections(foundation),
            "## 圈内五行识别",
            "",
            *_element_sensing_sections(foundation),
            "## 圈内关系",
            "",
            *_intra_circle_relation_sections(foundation),
            "## 三圈能量流动",
            "",
            *_cross_circle_flow_sections(foundation),
            "## 高风险错误检查",
            "",
            "| 检查项 | 人工结论 | 备注 |",
            "| --- | --- | --- |",
            "| 三圈标记线是否被误识别为画作元素 |  |  |",
            "| 模板黑线是否被误识别为画作元素 |  |  |",
            "| 圈内留白是否漏判 |  |  |",
            "| 每圈视觉单元能量占比是否合计 100 |  |  |",
            "| 能量占比是否符合面积大小与视觉重量 |  |  |",
            "| 是否给整圈贴单一五行 |  |  |",
            "| 是否出现跨圈五行生克 |  |  |",
            "| 是否混入财富、关系、身体、心理或疗愈建议 |  |  |",
            "| 基础层判断是否缺少视觉证据 |  |  |",
            "",
            "## 人工修正",
            "",
            "```text",
            "",
            "```",
            "",
            "## 审核结论",
            "",
            "- 是否可进入议题翻译层：可以 / 不可以 / 仅可带人工备注进入",
            "- 需要重跑模型：是 / 否",
            "- 需要回写 prompt 规则：",
            "- 需要回写 schema 规则：",
            "",
        ]
    )


def _model_summary_lines(foundation: dict[str, Any]) -> list[str]:
    visual = foundation.get("visual_observation", {}) if isinstance(foundation, dict) else {}
    overall = visual.get("overall_observation", {}) if isinstance(visual, dict) else {}
    three_circle = visual.get("three_circle_observation", {}) if isinstance(visual, dict) else {}
    flow = foundation.get("cross_circle_flow", {}) if isinstance(foundation, dict) else {}
    return [
        f"- 第一眼感受：{overall.get('first_impression', '') if isinstance(overall, dict) else ''}",
        f"- 主要画面内容：{overall.get('main_visual_content', '') if isinstance(overall, dict) else ''}",
        f"- 三圈衔接：{three_circle.get('cross_circle_visual_connection', '') if isinstance(three_circle, dict) else ''}",
        f"- 三圈能量流动：{flow.get('summary', '') if isinstance(flow, dict) else ''}",
    ]


def _source_model_comparison_sections(
    *,
    case: CompleteCaseFoundationInput,
    foundation_image_reading: dict[str, Any],
) -> list[str]:
    foundation = _foundation_payload(foundation_image_reading)
    sections = [
        "| 圈层 | 原文对画面内容的描述 | 人工审核区视觉基准 | 模型识别重点 | 初步差异提示 | 人工审核结论 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for circle_key, label in NOTE_LABELS:
        source_notes = "；".join(case.source_visual_notes.get(circle_key, [])) or "原文未提取到明确的画面内容描述。"
        reviewed_notes = "；".join(case.reviewed_visual_notes.get(circle_key, [])) or "人工审核区未提取到明确画面识别句。"
        model_summary = _model_layer_summary(foundation, circle_key)
        diff_hint = _combined_comparison_hint(
            source_text=source_notes,
            reviewed_text=reviewed_notes,
            model_text=model_summary,
        )
        sections.append(
            f"| {label} | {_md_cell(source_notes)} | {_md_cell(reviewed_notes)} | "
            f"{_md_cell(model_summary)} | {_md_cell(diff_hint)} |  |"
        )
    sections.append("")
    return sections


def _circle_visual_unit_sections(foundation: dict[str, Any]) -> list[str]:
    sections = []
    circles = (
        foundation.get("visual_observation", {})
        .get("circle_visual_units", {})
        if isinstance(foundation.get("visual_observation"), dict)
        else {}
    )
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        circle = circles.get(circle_key, {}) if isinstance(circles, dict) else {}
        sections.extend(
            [
                f"### {label}",
                "",
                f"- 构图：{circle.get('composition_description', '') if isinstance(circle, dict) else ''}",
                "",
                "| ID | 名称 | source_type | 能量占比 | 颜色 | 形状 | 位置关系 | 留白作用 | 人工意见 |",
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            ]
        )
        for unit in circle.get("visual_units", []) if isinstance(circle, dict) else []:
            if not isinstance(unit, dict):
                continue
            sections.append(
                f"| {unit.get('id', '')} | {unit.get('unit_name', '')} | {unit.get('source_type', '')} | "
                f"{unit.get('energy_ratio_percent', '')}% | "
                f"{_md_cell(str(unit.get('color_description', '')))} | "
                f"{_md_cell(str(unit.get('shape_description', '')))} | "
                f"{_md_cell(str(unit.get('spatial_relations', '')))} | "
                f"{_md_cell(str(unit.get('blank_space_role', '')))} |  |"
            )
        sections.append("")
    return sections


def _element_sensing_sections(foundation: dict[str, Any]) -> list[str]:
    sections = [
        "| 圈层 | 视觉单元 ID | 五行 | 依据 | 置信度 | 人工意见 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    element_sensing = foundation.get("element_sensing", {})
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        circle = element_sensing.get(circle_key, {}) if isinstance(element_sensing, dict) else {}
        for item in circle.get("element_candidates", []) if isinstance(circle, dict) else []:
            if not isinstance(item, dict):
                continue
            basis = "；".join(str(value) for value in item.get("basis", []) if str(value).strip())
            sections.append(
                f"| {label} | {item.get('visual_unit_id', '')} | {item.get('element', '')} | "
                f"{_md_cell(basis)} | {item.get('confidence', '')} |  |"
            )
    sections.append("")
    return sections


def _intra_circle_relation_sections(foundation: dict[str, Any]) -> list[str]:
    sections = [
        "| 圈层 | 关系 ID | 类型 | 视觉单元 | 可见依据 | 置信度 | 人工意见 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    relations = foundation.get("intra_circle_relations", {})
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        circle = relations.get(circle_key, {}) if isinstance(relations, dict) else {}
        for item in circle.get("relations", []) if isinstance(circle, dict) else []:
            if not isinstance(item, dict):
                continue
            unit_ids = "、".join(str(value) for value in item.get("involved_visual_unit_ids", []) if str(value).strip())
            sections.append(
                f"| {label} | {item.get('relation_id', '')} | {item.get('relation_type', '')} | "
                f"{unit_ids} | {_md_cell(str(item.get('visible_basis', '')))} | {item.get('confidence', '')} |  |"
            )
    sections.append("")
    return sections


def _cross_circle_flow_sections(foundation: dict[str, Any]) -> list[str]:
    flow = foundation.get("cross_circle_flow", {})
    sections = [
        f"- 摘要：{flow.get('summary', '') if isinstance(flow, dict) else ''}",
        "",
        "| Flow ID | 类型 | 涉及圈层 | 可见依据 | 置信度 | 人工意见 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for item in flow.get("flow_observations", []) if isinstance(flow, dict) else []:
        if not isinstance(item, dict):
            continue
        circles = "、".join(str(value) for value in item.get("involved_circles", []) if str(value).strip())
        sections.append(
            f"| {item.get('flow_id', '')} | {item.get('flow_type', '')} | {circles} | "
            f"{_md_cell(str(item.get('visual_basis', '')))} | {item.get('confidence', '')} |  |"
        )
    sections.append("")
    return sections


def _visual_note_sections(notes_by_circle: dict[str, list[str]], *, empty_text: str) -> list[str]:
    sections: list[str] = []
    for circle_key, label in NOTE_LABELS:
        notes = notes_by_circle.get(circle_key, [])
        sections.extend([f"### {label}", ""])
        if notes:
            sections.extend(f"- {note}" for note in notes)
        else:
            sections.append(f"- {empty_text}")
        sections.append("")
    return sections


def _extract_source_visual_notes(text: str) -> dict[str, list[str]]:
    raw_source = _extract_original_interpretation_text(text)
    segments = _segment_source_by_layer(raw_source)
    return {
        key: _extract_visual_sentences(segment, layer=key, limit=MAX_SOURCE_NOTES_PER_LAYER)
        for key, segment in segments.items()
    }


def _extract_reviewed_visual_notes(text: str) -> dict[str, list[str]]:
    review_text = _extract_review_section(text)
    notes = {key: [] for key in NOTE_KEYS}
    for section_title in ["画面事实", "五行元素与圈内生克"]:
        section = _extract_subsection(review_text, section_title)
        for raw_line in section.splitlines():
            line = raw_line.strip()
            if not line.startswith("- "):
                continue
            content = line.removeprefix("- ").strip()
            target = _circle_for_line(content)
            if not target and _contains_visual_descriptor(content):
                target = "global"
            if target and content not in notes[target]:
                notes[target].append(content)
    return {key: value[:MAX_REVIEWED_NOTES_PER_LAYER] for key, value in notes.items()}


def _extract_visual_sentences(segment: str, *, layer: str, limit: int) -> list[str]:
    notes: list[str] = []
    for sentence in _split_sentences(segment):
        cleaned = _strip_order_prefix(sentence.strip())
        if not cleaned or len(cleaned) < 4:
            continue
        if layer != "global" and _has_strong_non_visual_topic(cleaned):
            continue
        if _contains_visual_descriptor(cleaned) and _is_layer_relevant(cleaned, layer=layer):
            _append_unique(notes, cleaned, limit=limit)
        if len(notes) >= limit:
            return notes
    return notes


def _segment_source_by_layer(text: str) -> dict[str, str]:
    segments: dict[str, list[str]] = {key: [] for key in NOTE_KEYS}
    current = "global"
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("#### 调整方案") or line.startswith("#### 调频建议") or "调频建议" in line:
            break
        layer = _circle_heading_for_line(line)
        if layer:
            current = layer
        segments[current].append(line)
    return {key: "\n".join(value) for key, value in segments.items()}


def _split_sentences(text: str) -> list[str]:
    prepared = re.sub(r"\s+", " ", text)
    chunks = re.split(r"(?<=[。！？；;])", prepared)
    return [chunk.strip(" 。；;") for chunk in chunks if chunk.strip(" 。；;")]


def _extract_original_interpretation_text(text: str) -> str:
    start_marker = "## 原始解读文本"
    end_marker = "## 人工审核区"
    start = text.find(start_marker)
    end = text.find(end_marker)
    if start == -1:
        return text[: end if end != -1 else len(text)]
    return text[start:end if end != -1 else len(text)]


def _extract_review_section(text: str) -> str:
    marker = "## 人工审核区"
    start = text.find(marker)
    return "" if start == -1 else text[start:]


def _extract_subsection(text: str, title: str) -> str:
    marker = f"### {title}"
    start = text.find(marker)
    if start == -1:
        return ""
    next_start = text.find("\n### ", start + len(marker))
    return text[start: next_start if next_start != -1 else len(text)]


def _foundation_payload(foundation_image_reading: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(foundation_image_reading, dict):
        return {}
    payload = foundation_image_reading.get("foundation_image_reading")
    return payload if isinstance(payload, dict) else foundation_image_reading


def _model_layer_summary(foundation: dict[str, Any], circle_key: str) -> str:
    visual = foundation.get("visual_observation", {}) if isinstance(foundation, dict) else {}
    if circle_key == "global":
        overall = visual.get("overall_observation", {}) if isinstance(visual, dict) else {}
        if not isinstance(overall, dict):
            return ""
        return "；".join(
            str(overall.get(key) or "").strip()
            for key in ["first_impression", "main_visual_content", "visual_atmosphere"]
            if str(overall.get(key) or "").strip()
        )
    units_by_circle = visual.get("circle_visual_units", {}) if isinstance(visual, dict) else {}
    circle = units_by_circle.get(circle_key, {}) if isinstance(units_by_circle, dict) else {}
    if not isinstance(circle, dict):
        return ""
    parts = [str(circle.get("composition_description") or "").strip()]
    for unit in circle.get("visual_units", []):
        if not isinstance(unit, dict):
            continue
        parts.append(
            " / ".join(
                item
                for item in [
                    str(unit.get("unit_name") or "").strip(),
                    str(unit.get("color_description") or "").strip(),
                    str(unit.get("shape_description") or "").strip(),
                    str(unit.get("spatial_relations") or "").strip(),
                ]
                if item
            )
        )
    return "；".join(part for part in parts if part)


def _combined_comparison_hint(*, source_text: str, reviewed_text: str, model_text: str) -> str:
    source_hint = _comparison_hint(source_text, model_text)
    reviewed_hint = _comparison_hint(reviewed_text, model_text)
    if source_hint == "待人工核对。" and reviewed_hint == "待人工核对。":
        return "待人工核对。"
    return f"对原文：{source_hint}；对人工基准：{reviewed_hint}"


def _comparison_hint(source_text: str, model_text: str) -> str:
    hints = []
    for term in ["留白", "白色", "金", "粉", "红", "紫", "蓝", "绿", "黄", "黑", "莲花", "花瓣", "三角", "圆形"]:
        if term in source_text and term not in model_text:
            hints.append(f"模型可能漏掉：{term}")
    for term in ["留白", "白色", "粉", "红", "紫", "蓝", "绿", "黄", "黑", "标记线"]:
        if term in model_text and term not in source_text:
            hints.append(f"模型新增：{term}")
    if "模板" in model_text or "标记线" in model_text:
        hints.append("检查非画作线条是否已排除")
    return "；".join(dict.fromkeys(hints)) or "待人工核对。"


def _circle_heading_for_line(line: str) -> str | None:
    if any(marker in line for marker in ["首先看内圈", "首先来看第一圈", "第一圈", "内圈"]):
        return "inner"
    if any(marker in line for marker in ["其次看中圈", "第二圈", "中圈"]):
        return "middle"
    if any(marker in line for marker in ["最后看外圈", "第三圈", "外圈"]):
        return "outer"
    return None


def _circle_for_line(line: str) -> str | None:
    if "内圈" in line or "第一圈" in line:
        return "inner"
    if "中圈" in line or "第二圈" in line:
        return "middle"
    if "外圈" in line or "第三圈" in line:
        return "outer"
    return None


def _is_layer_relevant(line: str, *, layer: str) -> bool:
    if layer == "global":
        return any(marker in line for marker in ["整体", "画面", "颜色", "曼陀罗", "三圈"])
    circle = _circle_for_line(line)
    return circle is None or circle == layer


def _contains_visual_descriptor(line: str) -> bool:
    return any(
        marker in line
        for marker in [
            "颜色",
            "蓝色",
            "白色",
            "粉色",
            "粉红色",
            "红色",
            "黄色",
            "绿色",
            "紫色",
            "黑色",
            "留白",
            "笔触",
            "占比",
            "比重",
            "形状",
            "莲花",
            "花瓣",
            "圆形",
            "圆圈",
            "三角",
            "方形",
            "几何",
            "条状",
            "块",
            "小点",
            "叶片",
            "枝桠",
            "小人",
            "小草",
            "线条",
            "包围",
            "包住",
            "隔断",
            "隔开",
            "截断",
            "穿插",
            "相邻",
            "外侧",
            "内侧",
            "中间",
            "周围",
            "向外",
            "延伸",
            "涂满",
            "深浅",
            "渐变",
        ]
    )


def _has_strong_non_visual_topic(line: str) -> bool:
    return any(
        marker in line
        for marker in [
            "建议",
            "调频",
            "冥想",
            "腹式呼吸",
            "站桩",
            "收入",
            "投资建议",
            "心理诊断",
        ]
    )


def _strip_order_prefix(text: str) -> str:
    return re.sub(r"^\d+[.、]\s*", "", text).strip()


def _append_unique(values: list[str], item: str, *, limit: int) -> None:
    normalized = item.strip()
    if normalized and normalized not in values:
        values.append(normalized)
    if len(values) > limit:
        del values[limit:]


def _md_cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", "<br>")


def _first_existing_path(paths: list[Path]) -> Path:
    for path in paths:
        if path.exists():
            return path
    return paths[0]


def _extract_title(text: str, *, fallback: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped.removeprefix("# ").strip()
    return fallback


def _extract_metadata_bullet(text: str, key: str) -> str:
    prefix = f"- {key}："
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix):
            return stripped[len(prefix) :].strip()
    return ""


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


def _is_qwen_dashscope_vision_route(prefix: str) -> bool:
    base_url = os.getenv(f"{prefix}_BASE_URL", "").strip().lower()
    model = os.getenv(f"{prefix}_MODEL", "").strip().lower()
    return "dashscope.aliyuncs.com" in base_url and model.startswith("qwen")


def _is_doubao_ark_vision_route(prefix: str) -> bool:
    base_url = os.getenv(f"{prefix}_BASE_URL", "").strip().lower()
    model = os.getenv(f"{prefix}_MODEL", "").strip().lower()
    return "ark.cn-beijing.volces.com/api/v3" in base_url and model.startswith("ep-")


def _normalize_vision_provider(value: str) -> str:
    normalized = value.strip().lower() or "qwen"
    return normalized if normalized in VISION_PROVIDERS else "qwen"


def _normalize_thinking_mode(value: str) -> str:
    normalized = value.strip().lower() or "off"
    return normalized if normalized in THINKING_MODES else "off"


def _thinking_mode_enabled(value: str) -> bool:
    return _normalize_thinking_mode(value) == "on"


def _run_meta(
    *,
    vision_provider: str,
    thinking_mode: str,
    started_at: datetime,
    finished_at: datetime,
    duration_seconds: float,
) -> dict[str, Any]:
    return {
        "vision_provider": _normalize_vision_provider(vision_provider),
        "thinking_mode": _normalize_thinking_mode(thinking_mode),
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "duration_seconds": round(duration_seconds, 3),
    }


def _resolve_output_root(
    *,
    raw_output_root: str,
    vision_provider: str,
    thinking_mode: str,
) -> Path:
    output_root = Path(raw_output_root)
    if output_root == DEFAULT_OUTPUT_ROOT:
        return (
            DEFAULT_OUTPUT_ROOT
            / _normalize_vision_provider(vision_provider)
            / f"thinking-{_normalize_thinking_mode(thinking_mode)}"
        )
    return output_root


def _vision_route_matches_provider(prefix: str, *, provider: str) -> bool:
    if provider == "qwen":
        return _is_qwen_dashscope_vision_route(prefix)
    if provider == "doubao":
        return _is_doubao_ark_vision_route(prefix)
    return True


def _vision_route_requirement_label(provider: str) -> str:
    if provider == "doubao":
        return "Doubao/Volcengine Ark vision route with ep-* model endpoint"
    if provider == "custom":
        return "Configured OpenAI-compatible vision route"
    return "Qwen/DashScope vision route matching app runtime"


if __name__ == "__main__":
    raise SystemExit(main())
