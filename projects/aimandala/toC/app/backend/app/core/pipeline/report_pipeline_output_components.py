"""Output installer for the stage-based report pipeline."""

from __future__ import annotations

from typing import Any

from .data_models import DailyAwareness
from .report_draft_assembler import ReportDraftAssembler
from .report_placeholder_assembler import ReportPlaceholderAssembler


def install_report_output_components(orchestrator: Any) -> None:
    """Attach report assembly helpers that produce final payload structures."""

    orchestrator.report_draft_assembler = ReportDraftAssembler(
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        build_lite_prompt_preview=lambda record: (
            orchestrator.stage_package_assembler.build_prompt(
                record,
                target_report="lite",
                prompt_builder=orchestrator.prompt_builder,
            )
        ),
        build_lite_story_sections=_build_lite_story_sections,
        build_lite_theme_insights=_build_lite_theme_insights,
        build_lite_title=_build_lite_title,
        build_lite_overall_impression=_build_lite_overall_impression,
        build_lite_visual_elements=_build_lite_visual_elements,
        build_lite_emotion_portrait=_build_lite_emotion_portrait,
        build_lite_pro_teaser=_build_lite_pro_teaser,
        build_lite_three_awareness=_build_lite_three_awareness,
        build_lite_six_insights_payload=_build_lite_six_insights_payload,
        build_lite_experiment_payload=_build_lite_experiment_payload,
        build_pro_prompt_preview=lambda record: (
            orchestrator.stage_package_assembler.build_prompt(
                record,
                target_report="pro",
                prompt_builder=orchestrator.prompt_builder,
            )
        ),
        build_pro_imbalance_profile=_build_pro_imbalance_profile,
        build_runtime_pro_narrative_plan=lambda *args, **kwargs: {},
        build_pro_first_impression=_build_pro_first_impression,
        build_pro_energy_essence=_build_pro_energy_essence,
        build_pro_block_point=_build_pro_block_point,
        build_pro_direction=_build_pro_direction,
        build_pro_healing_core=_build_pro_healing_core,
        build_pro_circle_reading=_build_pro_circle_reading,
        build_pro_micro_sections_from_knowledge=_build_pro_micro_sections,
        build_surface_root_cause=_build_surface_root_cause,
        build_deeper_root_cause=_build_deeper_root_cause,
        build_core_root_cause=_build_core_root_cause,
        build_pro_healing_suggestions=_build_pro_healing_suggestions,
    )
    orchestrator.report_placeholder_assembler = ReportPlaceholderAssembler(
        section_renderer=orchestrator.report_section_renderer,
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        build_lite_title=_build_lite_title,
        build_lite_overall_impression=_build_lite_overall_impression,
        build_lite_visual_elements=_build_lite_visual_elements,
        build_lite_emotion_portrait=_build_lite_emotion_portrait,
        wrap_report_with_safety=orchestrator.report_safety_wrapper.wrap_report,
        strip_safety_wrappers=orchestrator.report_safety_wrapper.strip_wrappers,
    )
    orchestrator._build_layer1_placeholder = orchestrator.report_draft_assembler.build_lite
    orchestrator._build_lite_placeholder_report = orchestrator.report_placeholder_assembler.build_lite
    orchestrator._build_pro_placeholder_draft = orchestrator.report_draft_assembler.build_pro
    orchestrator._build_pro_placeholder_report = orchestrator.report_placeholder_assembler.build_pro


def _stage_payload(record: Any) -> dict[str, Any]:
    package = getattr(record, "stage_process_package", None)
    return package.payload if package is not None and isinstance(package.payload, dict) else {}


def _stage(record: Any, key: str) -> dict[str, Any]:
    value = _stage_payload(record).get(key, {})
    return value if isinstance(value, dict) else {}


def _build_lite_title(record: Any, theme_label: str, **_: Any) -> str:
    stage10 = _stage(record, "stage-10-core-thesis-selection")
    thesis = str(stage10.get("selected_thesis", "") or "").strip()
    return thesis[:18] if thesis else "看见此刻的自己"


def _build_lite_overall_impression(
    record: Any,
    theme_label: str,
    circles: dict[str, int] | None = None,
    **_: Any,
) -> str:
    intention = (getattr(record, "painting_intention", None) or "").strip()
    if intention:
        return f"这份解读会先回应你本次的主题：{intention}。"
    return f"这份解读会围绕「{theme_label}」看见你当下的状态。"


def _build_lite_visual_elements(
    record: Any,
    theme: str,
    circles: dict[str, int] | None = None,
    **_: Any,
) -> str:
    stage03 = _stage(record, "stage-03-visual-evidence")
    summary = str(stage03.get("global_visual_summary", "") or "").strip()
    return summary or "画面依据将在 stage-03 视觉证据完成后进入这里。"


def _build_lite_emotion_portrait(record: Any, theme_label: str, **_: Any) -> str:
    stage09 = _stage(record, "stage-09-evidence-consolidation")
    candidates = stage09.get("report_candidates", [])
    if isinstance(candidates, list) and candidates:
        return "；".join(str(item) for item in candidates[:3])
    return "当前报告先保留温和、开放的表达，等待完整 stage 证据链补齐。"


def _build_lite_story_sections(record: Any, theme_label: str, **_: Any) -> dict[str, str]:
    base = _build_lite_overall_impression(record, theme_label)
    return {
        "base": base,
        "contradiction": "你正在整理内在需要与现实主题之间的关系。",
        "pattern": "这张画会帮助你看见一种反复出现的状态模式。",
        "defense": "这些模式也可能是一种保护，让你先确认安全再继续。",
        "block": "真正需要被看见的，是哪里还没有足够顺畅地流动。",
        "light": "当这些信息被看见，下一步会变得更清楚、更可承接。",
    }


def _build_lite_theme_insights(record: Any, theme_label: str, **_: Any) -> dict[str, str]:
    return {
        "scene": f"在「{theme_label}」这个主题里，它会先表现为你对当下状态的重新确认。",
        "impact": "它可能影响你如何做决定、如何回应外界，也影响你给自己的空间。",
        "awareness": "先把画面依据和身体感受放在一起看，不急着给自己下定论。",
    }


def _build_lite_pro_teaser(record: Any, **_: Any) -> str:
    return "Pro 版会继续展开三圈之间的能量流动、失衡线索和更具体的调整方向。"


def _build_lite_three_awareness(record: Any, theme_label: str, **_: Any) -> list[DailyAwareness]:
    return [
        DailyAwareness(day=1, title="先看见", content="今天先记录一个最明显的画面细节。"),
        DailyAwareness(day=2, title="再连接", content="把这个细节和最近一个真实场景连起来。"),
        DailyAwareness(day=3, title="小步调整", content="只选择一个低压力动作，让自己更稳一点。"),
    ]


def _build_lite_six_insights_payload(
    record: Any,
    theme_label: str,
    story_sections: dict[str, str],
    **_: Any,
) -> dict[str, dict[str, str]]:
    return {
        key: {"title": key, "content": value}
        for key, value in story_sections.items()
    }


def _build_lite_experiment_payload(record: Any, theme_label: str, title: str, **_: Any) -> dict[str, str]:
    return {
        "title": "一个低压小练习",
        "content": "选一个安静的三分钟，写下：我现在最想先稳住的是什么。",
    }


def _build_pro_imbalance_profile(record: Any, theme_label: str, circles: dict[str, int] | None = None, **_: Any) -> dict[str, Any]:
    stage07 = _stage(record, "stage-07-per-circle-imbalance-patterns")
    candidates = stage07.get("candidates", [])
    primary = candidates[0] if isinstance(candidates, list) and candidates else ""
    if isinstance(primary, dict):
        primary = primary.get("name") or primary.get("id") or ""
    primary_text = str(primary or "待完整 stage 证据确认").strip()
    return {
        "type": primary_text,
        "summary": f"当前最需要关注的线索是：{primary_text}。",
        "primary": primary_text,
        "evidence": "该判断应回到 stage-03 到 stage-07 的证据链确认。",
        "energy_level": "能量层面等待 stage-08 完整诊断。",
        "psychological_level": "心理层面先保持开放，不做诊断式定性。",
        "life_manifestation": f"在「{theme_label}」主题下，先观察它如何进入现实选择。",
    }


def _build_pro_first_impression(record: Any, theme_label: str, lite_title: str, **_: Any) -> str:
    return f"这份深度报告会在「{lite_title}」的基础上，继续看你在「{theme_label}」中的核心流动。"


def _build_pro_energy_essence(record: Any, theme_label: str, circles: dict[str, int] | None = None, **_: Any) -> str:
    stage08 = _stage(record, "stage-08-energy-flow-diagnosis")
    return str(stage08.get("overall_flow", "") or "整体能量流动等待 stage-08 诊断补齐。")


def _build_pro_block_point(record: Any, imbalance_profile: dict[str, Any], **_: Any) -> str:
    return str(imbalance_profile.get("primary", "") or "当前卡点等待证据链确认。")


def _build_pro_direction(record: Any, theme_label: str, **_: Any) -> str:
    return f"先在「{theme_label}」主题中选择一个能被承接的小步调整。"


def _build_pro_healing_core(record: Any, **_: Any) -> str:
    return "疗愈核心是先恢复可感知、可承接、可执行的节奏。"


def _build_pro_circle_reading(record: Any, circle: str, fallback: str, **_: Any) -> str:
    stage03 = _stage(record, "stage-03-visual-evidence")
    circles = stage03.get("circles", {}) if isinstance(stage03, dict) else {}
    circle_payload = circles.get(circle, {}) if isinstance(circles, dict) else {}
    summary = circle_payload.get("observation_summary") if isinstance(circle_payload, dict) else ""
    return str(summary or fallback)


def _build_pro_micro_sections(record: Any, theme_label: str, **_: Any) -> dict[str, str]:
    return {
        "节奏关系": "节奏关系应由 stage-08 的能量流动诊断支撑。",
        "关系模式": f"关系模式需要结合「{theme_label}」主题知识进一步确认。",
        "行动模式": "行动模式需要回到画面证据和用户意图共同判断。",
    }


def _build_surface_root_cause(record: Any, imbalance_profile: dict[str, Any], **_: Any) -> str:
    return str(imbalance_profile.get("life_manifestation", "") or "")


def _build_deeper_root_cause(record: Any, imbalance_profile: dict[str, Any], **_: Any) -> str:
    return str(imbalance_profile.get("psychological_level", "") or "")


def _build_core_root_cause(record: Any, imbalance_profile: dict[str, Any], **_: Any) -> str:
    return "更深的核心需要在完整 stage 证据和用户主题中谨慎确认。"


def _build_pro_healing_suggestions(record: Any, theme_label: str, **_: Any) -> list[dict[str, Any]]:
    return [
        {"phase": "当前阶段", "focus": "先稳定", "practice": "每天记录一个最明显的身体或情绪信号。"},
        {"phase": "接下来", "focus": "再连接", "practice": f"把这个信号放回「{theme_label}」里的一个真实场景。"},
        {"phase": "继续深化", "focus": "小步行动", "practice": "选择一个今天能完成的低压力动作。"},
    ]
