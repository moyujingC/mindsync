"""Run stage-03 visual recognition for the 11 complete mandala cases."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path


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
DEFAULT_OUTPUT_ROOT = CASE_ROOT / "visual-runs" / date.today().isoformat()

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402
from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent  # noqa: E402
from app.core.mandala_interpretation_agent.contracts import (  # noqa: E402
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.knowledge_pack_builder import KnowledgePackBuilder  # noqa: E402


@dataclass(frozen=True)
class CompleteCaseVisualInput:
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
    parser.add_argument(
        "--case-root",
        default=str(CASE_ROOT),
        help="Complete 11-case directory.",
    )
    parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory for visual recognition outputs.",
    )
    parser.add_argument(
        "--case-id",
        default="",
        help="Run one case id only, for example case-001.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate planned cases without calling models.",
    )
    parser.add_argument(
        "--check-env",
        action="store_true",
        help="Check real model environment without calling models.",
    )
    parser.add_argument(
        "--refresh-review",
        action="store_true",
        help="Regenerate review.md from existing stage03_visual_evidence.json without calling models.",
    )
    parser.add_argument(
        "--env-file",
        default="",
        help="Private env file to load before checking or running.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    case_root = Path(args.case_root)
    output_root = Path(args.output_root)
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
        payload = build_env_check_payload(planned_runs=planned)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0 if payload["ready"] else 2

    if args.refresh_review:
        results = refresh_existing_reviews(output_root=output_root, cases=cases)
        print(json.dumps({"status": "refreshed", "results": results}, ensure_ascii=False, indent=2))
        return 0 if all(item["status"] == "complete" for item in results) else 2

    env_check = build_env_check_payload(planned_runs=planned)
    if not env_check["ready"]:
        print(json.dumps(env_check, ensure_ascii=False, indent=2))
        return 2

    load_private_env_file()
    llm_client = create_llm_client_from_env()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    agent = MandalaInterpretationAgent(llm_client=llm_client)
    results = []
    exit_code = 0
    for case in cases:
        output_dir = output_root / case.case_id
        output_dir.mkdir(parents=True, exist_ok=True)
        try:
            stage03 = agent._run_block_2(  # noqa: SLF001 - dedicated review runner for one stage.
                agent_input=build_agent_input(case),
                knowledge_pack=knowledge_pack,
            )["stage-03-visual-evidence"]
            files = write_visual_artifacts(
                output_dir=output_dir,
                case=case,
                stage03=stage03,
                env_check=env_check,
            )
            results.append(
                {
                    "case_id": case.case_id,
                    "status": "complete",
                    "output_dir": str(output_dir),
                    "files": [str(path) for path in files],
                }
            )
        except Exception as error:  # noqa: BLE001 - batch runner should keep all failures readable.
            error_payload = {
                "case_id": case.case_id,
                "status": "failed",
                "error": str(error),
                "output_dir": str(output_dir),
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


def refresh_existing_reviews(
    *,
    output_root: Path,
    cases: list[CompleteCaseVisualInput],
) -> list[dict]:
    results = []
    for case in cases:
        output_dir = output_root / case.case_id
        stage03_path = output_dir / "stage03_visual_evidence.json"
        if not stage03_path.exists():
            results.append(
                {
                    "case_id": case.case_id,
                    "status": "missing_stage03",
                    "stage03_path": str(stage03_path),
                }
            )
            continue
        stage03 = json.loads(stage03_path.read_text(encoding="utf-8"))
        review_path = output_dir / "review.md"
        review_path.write_text(
            _render_review_markdown(case=case, stage03=stage03),
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


def load_complete_cases(case_root: Path, *, case_id: str | None = None) -> list[CompleteCaseVisualInput]:
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


def parse_complete_case(case_path: Path, *, assets_dir: Path) -> CompleteCaseVisualInput:
    text = case_path.read_text(encoding="utf-8")
    case_id = case_path.stem
    image_path = assets_dir / f"{case_id}-mandala.jpg"
    if not image_path.exists():
        png_path = assets_dir / f"{case_id}-mandala.png"
        image_path = png_path if png_path.exists() else image_path
    marked_image_path = _first_existing_path(
        [
            assets_dir / f"{case_id}-mandala-3q.jpg",
            assets_dir / f"{case_id}-mandala-3q.png",
        ]
    )
    if not image_path.exists():
        raise FileNotFoundError(f"{case_id}: original image missing: {image_path}")
    if not marked_image_path.exists():
        raise FileNotFoundError(f"{case_id}: marked image missing")
    return CompleteCaseVisualInput(
        case_id=case_id,
        case_path=case_path,
        image_path=image_path,
        marked_image_path=marked_image_path,
        title=_extract_title(text, fallback=case_id),
        topic_tags=_extract_metadata_bullet(text, "主题标签"),
        source_visual_notes=_extract_source_visual_notes(text),
        reviewed_visual_notes=_extract_reviewed_visual_notes(text),
    )


def build_agent_input(case: CompleteCaseVisualInput) -> MandalaAgentInput:
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(case.image_path)),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention=f"视觉识别审核：{case.title}",
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


def write_visual_artifacts(
    *,
    output_dir: Path,
    case: CompleteCaseVisualInput,
    stage03: dict,
    env_check: dict,
) -> list[Path]:
    files: dict[str, str] = {
        "stage03_visual_evidence.json": json.dumps(stage03, ensure_ascii=False, indent=2) + "\n",
        "env_check.json": json.dumps(env_check, ensure_ascii=False, indent=2) + "\n",
        "review.md": _render_review_markdown(case=case, stage03=stage03),
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
    cases: list[CompleteCaseVisualInput],
    results: list[dict],
    env_check: dict,
) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    rows = [
        "| 案例 | 状态 | 审核入口 | 原画作 | 三圈标记图 |",
        "| --- | --- | --- | --- | --- |",
    ]
    result_by_case = {str(item.get("case_id")): item for item in results}
    for case in cases:
        result = result_by_case.get(case.case_id, {})
        status = result.get("status", "unknown")
        rows.append(
            f"| {case.case_id} | {status} | [{case.case_id}/review.md]({case.case_id}/review.md) | "
            f"`{_repo_relative(case.image_path)}` | `{_repo_relative(case.marked_image_path)}` |"
        )
    content = "\n".join(
        [
            "# stage-03 视觉识别审核运行索引",
            "",
            f"> 生成日期：{date.today().isoformat()}",
            "> 模型要求：文字 DeepSeek v4；视觉 Qwen/DashScope。",
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


def build_env_check_payload(*, planned_runs: list[dict]) -> dict:
    load_private_env_file()
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
    primary_vision_matches_app = _is_qwen_dashscope_vision_route("AIMANDALA_LLM_VISION")
    fallback_vision_matches_app = _is_qwen_dashscope_vision_route("AIMANDALA_LLM_VISION_FALLBACK")
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
        missing_required.append("Qwen/DashScope vision route matching app runtime")
    return {
        "status": "env_check",
        "ready": not missing_required,
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
            "Stage-03 visual review must use real models.",
            "Text route must match DeepSeek v4.",
            "Vision route must match Qwen/DashScope.",
            "Secret values are never printed.",
        ],
    }


def _render_review_markdown(*, case: CompleteCaseVisualInput, stage03: dict) -> str:
    return "\n".join(
        [
            f"# {case.case_id} stage-03 视觉识别审核",
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
            f"- 全局摘要：{stage03.get('global_visual_summary', '')}",
            f"- 排除项数量：{len(stage03.get('excluded_marks', []) if isinstance(stage03.get('excluded_marks'), list) else [])}",
            f"- 不确定项数量：{len(stage03.get('uncertainties', []) if isinstance(stage03.get('uncertainties'), list) else [])}",
            "",
            "## 原文对画面内容的描述",
            "",
            *_source_visual_note_sections(case),
            "## 人工审核区视觉基准摘录",
            "",
            *_reviewed_visual_note_sections(case),
            "## 原文、人工基准与模型对照",
            "",
            *_source_model_comparison_sections(case=case, stage03=stage03),
            "## 圈层视觉单元",
            "",
            *_circle_review_sections(stage03),
            "## 高风险错误检查",
            "",
            "| 检查项 | 人工结论 | 备注 |",
            "| --- | --- | --- |",
            "| 三圈标记线是否被误识别为画作元素 |  |  |",
            "| 模板黑线是否被误识别为画作元素 |  |  |",
            "| 圈内留白是否漏判 |  |  |",
            "| 关键颜色是否误判 |  |  |",
            "| 元素相邻/隔开关系是否足够支持后续五行判断 |  |  |",
            "",
            "## 人工修正",
            "",
            "```text",
            "",
            "```",
            "",
            "## 审核结论",
            "",
            "- 是否可进入五行分析：可以 / 不可以 / 仅可带人工备注进入",
            "- 需要重跑模型：是 / 否",
            "- 需要回写规则：",
            "",
        ]
    )


def _circle_review_sections(stage03: dict) -> list[str]:
    sections = []
    circles = stage03.get("circles", {}) if isinstance(stage03, dict) else {}
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        circle = circles.get(circle_key, {}) if isinstance(circles, dict) else {}
        units = circle.get("visual_units", []) if isinstance(circle, dict) else []
        sections.extend(
            [
                f"### {label}",
                "",
                f"- 摘要：{circle.get('summary', '') if isinstance(circle, dict) else ''}",
                "",
                "| ID | source_type | include | 颜色 | 形状 | 留白 | 金候选 | 依据 | 人工意见 |",
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            ]
        )
        if isinstance(units, list):
            for unit in units:
                if not isinstance(unit, dict):
                    continue
                sections.append(
                    f"| {unit.get('id', '')} | {unit.get('source_type', '')} | "
                    f"{unit.get('include_in_interpretation', '')} | {unit.get('color', '')} | "
                    f"{unit.get('shape', '')} | {unit.get('is_blank_space', '')} | "
                    f"{unit.get('metal_candidate', '')} | {unit.get('visible_evidence', '')} |  |"
                )
        sections.append("")
    return sections


def _source_visual_note_sections(case: CompleteCaseVisualInput) -> list[str]:
    return _visual_note_sections(
        case.source_visual_notes,
        empty_text="原文未提取到明确的画面内容描述。",
    )


def _reviewed_visual_note_sections(case: CompleteCaseVisualInput) -> list[str]:
    return _visual_note_sections(
        case.reviewed_visual_notes,
        empty_text="人工审核区未提取到明确画面识别句。",
    )


def _visual_note_sections(notes_by_circle: dict[str, list[str]], *, empty_text: str) -> list[str]:
    sections: list[str] = []
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        notes = notes_by_circle.get(circle_key, [])
        sections.extend([f"### {label}", ""])
        if notes:
            sections.extend(f"- {note}" for note in notes)
        else:
            sections.append(f"- {empty_text}")
        sections.append("")
    return sections


def _source_model_comparison_sections(
    *,
    case: CompleteCaseVisualInput,
    stage03: dict,
) -> list[str]:
    sections: list[str] = [
        "| 圈层 | 原文对画面内容的描述 | 人工审核区视觉基准 | 大模型识别重点 | 初步差异提示 | 人工审核结论 |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    circles = stage03.get("circles", {}) if isinstance(stage03, dict) else {}
    for circle_key, label in [("inner", "内圈"), ("middle", "中圈"), ("outer", "外圈")]:
        source_notes = "；".join(case.source_visual_notes.get(circle_key, [])) or "原文未提取到明确的画面内容描述。"
        reviewed_notes = "；".join(case.reviewed_visual_notes.get(circle_key, [])) or "人工审核区未提取到明确画面识别句。"
        circle = circles.get(circle_key, {}) if isinstance(circles, dict) else {}
        model_summary = _model_circle_summary(circle)
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


def _model_circle_summary(circle: object) -> str:
    if not isinstance(circle, dict):
        return ""
    parts = []
    summary = str(circle.get("summary") or "").strip()
    if summary:
        parts.append(summary)
    units = circle.get("visual_units", [])
    if isinstance(units, list):
        unit_parts = []
        for unit in units:
            if not isinstance(unit, dict):
                continue
            color = str(unit.get("color") or "").strip()
            shape = str(unit.get("shape") or "").strip()
            blank = "留白" if unit.get("is_blank_space") else ""
            metal = "金候选" if unit.get("metal_candidate") else ""
            segment = " / ".join(item for item in [color, shape, blank, metal] if item)
            if segment:
                unit_parts.append(segment)
        if unit_parts:
            parts.append("；".join(unit_parts))
    return "；".join(parts)


def _comparison_hint(source_text: str, model_text: str) -> str:
    hints = []
    for term in ["留白", "白色", "金", "粉", "红", "紫", "蓝", "绿", "黄", "黑"]:
        if term in source_text and term not in model_text:
            hints.append(f"模型可能漏掉：{term}")
    for term in ["留白", "白色", "粉", "红", "紫", "蓝", "绿", "黄", "黑"]:
        if term in model_text and term not in source_text:
            hints.append(f"模型新增：{term}")
    if "模板" in model_text:
        hints.append("检查模板线是否已排除")
    return "；".join(dict.fromkeys(hints)) or "待人工核对。"


def _combined_comparison_hint(*, source_text: str, reviewed_text: str, model_text: str) -> str:
    source_hint = _comparison_hint(source_text, model_text)
    reviewed_hint = _comparison_hint(reviewed_text, model_text)
    if source_hint == "待人工核对。" and reviewed_hint == "待人工核对。":
        return "待人工核对。"
    return f"对原文：{source_hint}；对人工基准：{reviewed_hint}"


def _extract_source_visual_notes(text: str) -> dict[str, list[str]]:
    raw_source = _extract_original_interpretation_text(text)
    lines = _normalize_source_lines(raw_source)
    notes = {"inner": [], "middle": [], "outer": []}
    current_circle = ""
    for line in lines:
        circle = _circle_for_line(line)
        if circle:
            current_circle = circle
        target = circle or current_circle
        cleaned = _strip_order_prefix(line)
        if target and cleaned and _looks_like_visual_source_line(cleaned):
            if cleaned not in notes[target]:
                notes[target].append(cleaned)
    return {key: value[:4] for key, value in notes.items()}


def _extract_reviewed_visual_notes(text: str) -> dict[str, list[str]]:
    review_text = _extract_review_section(text)
    notes = {"inner": [], "middle": [], "outer": []}
    for section_title in ["画面事实", "五行元素与圈内生克"]:
        section = _extract_subsection(review_text, section_title)
        for raw_line in section.splitlines():
            line = raw_line.strip()
            if not line.startswith("- "):
                continue
            content = line.removeprefix("- ").strip()
            target = _circle_for_line(content)
            if target and content not in notes[target]:
                notes[target].append(content)
    return {key: value[:5] for key, value in notes.items()}


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


def _extract_original_interpretation_text(text: str) -> str:
    start_marker = "## 原始解读文本"
    end_marker = "## 人工审核区"
    start = text.find(start_marker)
    end = text.find(end_marker)
    if start == -1:
        return text[: end if end != -1 else len(text)]
    return text[start:end if end != -1 else len(text)]


def _normalize_source_lines(text: str) -> list[str]:
    lines = []
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped[0:2] in {"1.", "2.", "3."}:
            stripped = stripped[2:].strip()
        for sentence in _split_visual_sentences(stripped):
            if sentence:
                lines.append(sentence)
    return lines


def _split_visual_sentences(text: str) -> list[str]:
    normalized = text.replace("；", "。").replace(";", "。")
    parts = [part.strip(" 。") for part in normalized.split("。")]
    return [part for part in parts if part]


def _circle_for_line(line: str) -> str:
    if "内圈" in line or "里圈" in line or "第一圈" in line:
        return "inner"
    if "中圈" in line or "第二圈" in line:
        return "middle"
    if "外圈" in line or "第三圈" in line:
        return "outer"
    return ""


def _looks_like_visual_source_line(line: str) -> bool:
    if _is_source_reference_fragment(line):
        return False
    if _is_parenthetical_interpretation(line):
        return False
    if any(
        marker in line
        for marker in [
            "建议",
            "比如",
            "学会",
            "调频",
            "代表恋爱",
            "渴望",
            "喜欢撒娇",
            "希望你",
            "案主",
            "绘画者",
            "别人觉得",
            "外人觉得",
            "说明他",
            "说明她",
            "说明案主",
            "能赚钱",
            "赚到钱",
            "漏财",
            "进账",
            "消费",
            "身体上",
            "每天",
        ]
    ):
        return False
    if len(line) < 6:
        return False
    if _is_formal_visual_inventory_or_relation(line):
        return True
    if _has_interpretive_subject(line):
        return False
    return _describes_visual_form_or_relation(line) and _has_color_or_element_term(line)


def _strip_order_prefix(line: str) -> str:
    prefixes = [
        "首先看",
        "其次看",
        "最后看",
        "首先",
        "其次",
        "最后",
    ]
    cleaned = line
    for prefix in prefixes:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix) :].strip(" ，,。")
    return _trim_to_visual_clause(cleaned)


def _trim_to_visual_clause(line: str) -> str:
    cleaned = line.strip()
    cleaned = cleaned.replace("从内圈可以看出，", "")
    cleaned = cleaned.replace("从中圈可以看出，", "")
    cleaned = cleaned.replace("从外圈来看，", "")
    cleaned = cleaned.replace("从外圈可以看出，", "")
    for marker in ["绘画者", "案主", "说明", "心里", "源于", "平时", "别人觉得", "而且"]:
        index = cleaned.find(marker)
        if index > 0:
            cleaned = cleaned[:index].rstrip(" ，,。；;")
    cleaned = cleaned.strip(" ，,。；;")
    if cleaned in {"从内圈", "从中圈", "从外圈", "首先看内圈", "其次看中圈", "最后看外圈"}:
        return ""
    if cleaned.startswith(("金能", "水能", "木能", "火能", "土能")):
        return ""
    if (
        "代表" in cleaned
        and not _starts_as_color_inventory(cleaned)
        and not _describes_visual_form_or_relation(cleaned)
    ):
        return ""
    return cleaned


def _starts_as_color_inventory(line: str) -> bool:
    return any(
        marker in line
        for marker in [
            "内圈有",
            "中圈有",
            "外圈有",
            "第一圈有",
            "第二圈有",
            "第三圈有",
            "里圈有",
            "颜色有",
            "有什么颜色",
            "它的颜色",
            "分别为",
            "属性",
            "五行属",
        ]
    )


def _is_formal_visual_inventory_or_relation(line: str) -> bool:
    formal_markers = [
        "颜色有",
        "有什么颜色",
        "它的颜色",
        "属性有",
        "五行属性",
        "分别为",
        "分别属",
        "分别属于",
        "相生相克关系",
        "相生相克属性",
        "二者关系",
        "关系是：",
        "关系为",
        "有白",
        "有粉",
        "有红",
        "有紫",
        "有蓝",
        "有绿",
        "有黄",
        "有黑",
    ]
    return any(marker in line for marker in formal_markers) and _has_color_or_element_term(line)


def _has_interpretive_subject(line: str) -> bool:
    if "相生相克关系" in line or "相生相克属性" in line:
        return False
    return any(
        marker in line
        for marker in [
            "绘画者",
            "案主",
            "她",
            "他",
            "ta",
            "TA",
            "别人",
            "外人",
            "家人",
            "亲人",
            "伴侣",
            "宝宝",
            "自己",
            "内心",
            "财富",
            "成长",
            "工作",
            "身体",
            "感情",
            "关系",
        ]
    )


def _has_color_or_element_term(line: str) -> bool:
    return any(
        color in line
        for color in ["白", "粉", "红", "紫", "蓝", "绿", "黄", "黑", "金", "木", "水", "火", "土"]
    )


def _is_source_reference_fragment(line: str) -> bool:
    return line.startswith(("（其他", "(其他", "其他")) and "详见" in line


def _is_parenthetical_interpretation(line: str) -> bool:
    stripped = line.strip()
    if not stripped.startswith(("（", "(")):
        return False
    return not _is_formal_visual_inventory_or_relation(stripped)


def _describes_visual_form_or_relation(line: str) -> bool:
    return any(
        marker in line
        for marker in [
            "形状",
            "条状",
            "圆",
            "三角",
            "尖角",
            "隔断",
            "截断",
            "包着",
            "围着",
            "围",
            "挨在一起",
            "没挨",
            "涂得",
            "涂满",
            "涂出",
            "笔触",
            "留白",
            "面积",
            "占比",
            "比重",
            "相生相克",
            "金克",
            "木克",
            "水克",
            "火克",
            "土克",
            "金生",
            "木生",
            "水生",
            "火生",
            "土生",
        ]
    )


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


if __name__ == "__main__":
    raise SystemExit(main())
