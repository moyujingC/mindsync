"""Builders for prompt previews and narrative prompt context."""

from __future__ import annotations

import json
from typing import Any, Callable

from app.core.prompt.builder_v2 import PromptBuilder

from .data_models import InterpretationRecord, Layer0Raw
from .report_blueprints import LITE_REPORT_BLUEPRINT


class ReportPromptPreviewBuilder:
    """Build prompt previews and related narrative context hints."""

    def __init__(
        self,
        *,
        prompt_builder: PromptBuilder,
        get_narrative_service: Callable[[], Any],
        get_theme_label: Callable[[str | None], str],
        get_record_theme: Callable[[InterpretationRecord], str],
        get_layer0_view: Callable[[InterpretationRecord], Layer0Raw],
        get_layer0_element_distribution: Callable[[Layer0Raw], list[dict[str, Any]]],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str | None],
        get_signal_label: Callable[[str], str],
        get_knowledge_theme_summary: Callable[[str | None], dict[str, Any]],
    ) -> None:
        self.prompt_builder = prompt_builder
        self._get_narrative_service = get_narrative_service
        self._get_theme_label = get_theme_label
        self._get_record_theme = get_record_theme
        self._get_layer0_view = get_layer0_view
        self._get_layer0_element_distribution = get_layer0_element_distribution
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._get_signal_label = get_signal_label
        self._get_knowledge_theme_summary = get_knowledge_theme_summary

    def build_user_context_hint(self, record: InterpretationRecord) -> str:
        intention = (record.painting_intention or "").strip()
        feeling = (record.painting_feeling or "").strip()
        parts: list[str] = []
        if intention:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates[
                    "user_context_from_intention"
                ].format(
                    intention=intention,
                )
            )
        if feeling:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates[
                    "user_context_from_feeling"
                ].format(
                    feeling=feeling,
                )
            )
        return " ".join(parts)

    def build_lite_prompt_preview(
        self,
        record: InterpretationRecord,
        *,
        projection: dict[str, Any] | None = None,
    ) -> str:
        return self.build_lite_prompt_preview_with_projection(
            record,
            projection=projection,
        )

    def build_lite_prompt_preview_with_projection(
        self,
        record: InterpretationRecord,
        *,
        projection: dict[str, Any] | None = None,
    ) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
        }
        return self.prompt_builder.build_lite(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self.build_theme_prompt_context(record),
            knowledge_skeleton=self.build_lite_knowledge_skeleton(
                record,
                projection=projection,
            ),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def build_theme_prompt_context(self, record: InterpretationRecord) -> str:
        runtime_context = self._build_runtime_theme_prompt_context(record)
        if runtime_context:
            return runtime_context

        theme_label = self._get_theme_label(record.theme)
        intention = (record.painting_intention or "").strip() or "未填写"
        feeling = (record.painting_feeling or "").strip() or "未填写"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else None
        secondary = distribution[1] if len(distribution) > 1 else None
        signal = self._get_primary_knowledge_signal(record)
        lines = [
            f"- 当前主题：{theme_label}",
            f"- 创作前意图：{intention}",
            f"- 创作时感受：{feeling}",
            f"- 内圈半径：{circles.get('inner_radius', 33)}%",
            f"- 中圈半径：{circles.get('middle_radius', 66)}%",
        ]
        if dominant:
            line = f"- 五行主导：{dominant['name']} {dominant['percentage']:.2f}%"
            if secondary:
                line += f"，其次是 {secondary['name']} {secondary['percentage']:.2f}%"
            lines.append(line)
        lines.append(
            "- 三圈主导："
            f"内圈{layer0.three_circles.inner.get('dominant', '未识别')} / "
            f"中圈{layer0.three_circles.middle.get('dominant', '未识别')} / "
            f"外圈{layer0.three_circles.outer.get('dominant', '未识别')}"
        )
        if signal:
            lines.append(f"- 知识库失衡候选：{self._get_signal_label(signal)}")

        summary = self._get_knowledge_theme_summary(record.theme)
        if summary:
            knowledge_theme_name = summary.get("name")
            core_issues = summary.get("core_issues") or []
            if knowledge_theme_name:
                lines.append(f"- V2知识主题：{knowledge_theme_name}")
            if core_issues:
                lines.append(f"- V2主题核心议题：{' / '.join(core_issues[:4])}")
            if summary.get("focus_element"):
                lines.append(f"- V2主题关注元素：{summary['focus_element']}")

        return "\n".join(lines)

    def build_pro_prompt_preview(
        self,
        record: InterpretationRecord,
        *,
        narrative_projection: dict[str, Any] | None = None,
        imbalance_projection: dict[str, Any] | None = None,
        imbalance_profile: dict[str, Any] | None = None,
    ) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
            "layer_1_lite_draft": (
                record.layer_1_lite_draft.to_dict()
                if record.layer_1_lite_draft
                else None
            ),
        }
        return self.prompt_builder.build_pro(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self.build_theme_prompt_context(record),
            knowledge_skeleton=self.build_pro_knowledge_skeleton(
                record,
                narrative_projection=narrative_projection,
                imbalance_projection=imbalance_projection,
                imbalance_profile=imbalance_profile,
            ),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def build_lite_knowledge_skeleton(
        self,
        record: InterpretationRecord,
        *,
        projection: dict[str, Any] | None = None,
    ) -> str:
        theme_label = self._get_theme_label(record.theme)
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer0 = self._get_layer0_view(record)
        primary_signal = self._get_primary_knowledge_signal(record)
        projection_payload = projection if isinstance(projection, dict) else {}
        skeleton = {
            "generation_mode": "knowledge_first_llm_polish",
            "theme": record.theme or "general",
            "theme_label": theme_label,
            "user_input": {
                "painting_intention": (record.painting_intention or "").strip(),
                "painting_feeling": (record.painting_feeling or "").strip(),
            },
            "four_step_evidence": {
                "three_circles": circles,
                "circle_dominants": {
                    "inner": layer0.three_circles.inner.get("dominant", "未识别"),
                    "middle": layer0.three_circles.middle.get("dominant", "未识别"),
                    "outer": layer0.three_circles.outer.get("dominant", "未识别"),
                },
                "primary_signal": self._get_signal_label(primary_signal)
                if primary_signal
                else "",
                "theme_projection": getattr(layer0, "theme_projection", {}) or {},
                "imbalance_candidates": getattr(layer0, "imbalance_candidates", []) or [],
            },
            "report_skeleton": {
                "title": projection_payload.get("title", ""),
                "overall_impression": projection_payload.get("overall_impression", ""),
                "visual_elements": projection_payload.get("visual_elements", ""),
                "emotion_portrait": projection_payload.get("emotion_portrait", ""),
                "story_sections": projection_payload.get("story_sections", {}),
                "theme_insights": projection_payload.get("theme_insights", {}),
                "three_awareness": projection_payload.get("three_awareness", []),
                "pro_teaser": projection_payload.get("pro_teaser", ""),
            },
            "llm_instruction": "polish_only_do_not_change_judgment",
        }
        return json.dumps(skeleton, ensure_ascii=False, indent=2)

    def build_pro_knowledge_skeleton(
        self,
        record: InterpretationRecord,
        *,
        narrative_projection: dict[str, Any] | None = None,
        imbalance_projection: dict[str, Any] | None = None,
        imbalance_profile: dict[str, Any] | None = None,
    ) -> str:
        theme_label = self._get_theme_label(record.theme)
        layer0 = self._get_layer0_view(record)
        primary_signal = self._get_primary_knowledge_signal(record)
        lite_story = (
            record.layer_1_lite_draft.story if record.layer_1_lite_draft else None
        )
        narrative_payload = (
            narrative_projection if isinstance(narrative_projection, dict) else {}
        )
        imbalance_payload = (
            imbalance_projection if isinstance(imbalance_projection, dict) else {}
        )
        profile_payload = imbalance_profile if isinstance(imbalance_profile, dict) else {}
        skeleton = {
            "generation_mode": "knowledge_first_llm_polish",
            "theme": record.theme or "general",
            "theme_label": theme_label,
            "user_input": {
                "painting_intention": (record.painting_intention or "").strip(),
                "painting_feeling": (record.painting_feeling or "").strip(),
            },
            "shared_knowledge_basis": {
                "primary_signal": self._get_signal_label(primary_signal)
                if primary_signal
                else "",
                "theme_projection": getattr(layer0, "theme_projection", {}) or {},
                "imbalance_candidates": getattr(layer0, "imbalance_candidates", []) or [],
                "lite_story_anchor": {
                    "contradiction": lite_story.contradiction.content if lite_story else "",
                    "block": lite_story.block.content if lite_story else "",
                },
            },
            "report_skeleton": {
                "first_impression": narrative_payload.get("first_impression", ""),
                "core_insight_table": {
                    "能量本质": narrative_payload.get("energy_essence", ""),
                    "核心失衡": profile_payload.get("summary", ""),
                    "关键卡点": narrative_payload.get("block_point", ""),
                    "转化方向": narrative_payload.get("direction", ""),
                    "疗愈核心": narrative_payload.get("healing_core", ""),
                },
                "three_circles_detailed": narrative_payload.get("circle_readings", {}),
                "micro_analysis_detailed": narrative_payload.get("micro_sections", {}),
                "imbalance_confirmed": profile_payload,
                "imbalance_projection": imbalance_payload,
                "root_cause": narrative_payload.get("root_cause", {}),
            },
            "llm_instruction": "polish_only_do_not_change_judgment",
        }
        return json.dumps(skeleton, ensure_ascii=False, indent=2)

    def build_feeling_hint(self, record: InterpretationRecord) -> str:
        feeling = (record.painting_feeling or "").strip()
        if not feeling:
            return LITE_REPORT_BLUEPRINT.narrative_templates["feeling_hint_default"]
        return LITE_REPORT_BLUEPRINT.narrative_templates[
            "feeling_hint_from_feeling"
        ].format(
            feeling=feeling,
        )

    def _build_runtime_theme_prompt_context(
        self,
        record: InterpretationRecord,
    ) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is None or not hasattr(
            narrative_service,
            "build_theme_prompt_context",
        ):
            return ""

        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else None
        secondary = distribution[1] if len(distribution) > 1 else None

        try:
            context = narrative_service.build_theme_prompt_context(
                theme=self._get_record_theme(record),
                theme_label=self._get_theme_label(record.theme),
                painting_intention=(record.painting_intention or "").strip(),
                painting_feeling=(record.painting_feeling or "").strip(),
                inner_radius=int(circles.get("inner_radius", 33)),
                middle_radius=int(circles.get("middle_radius", 66)),
                dominant_element=str(dominant["name"]) if dominant else "",
                dominant_percentage=float(dominant.get("percentage", 0.0) or 0.0)
                if dominant
                else 0.0,
                secondary_element=str(secondary["name"]) if secondary else "",
                secondary_percentage=float(secondary.get("percentage", 0.0) or 0.0)
                if secondary
                else 0.0,
                inner_dominant=str(
                    layer0.three_circles.inner.get("dominant", "") or ""
                ),
                middle_dominant=str(
                    layer0.three_circles.middle.get("dominant", "") or ""
                ),
                outer_dominant=str(
                    layer0.three_circles.outer.get("dominant", "") or ""
                ),
                signal=self._get_primary_knowledge_signal(record),
            )
        except Exception:
            return ""

        return context.strip() if isinstance(context, str) else ""
