"""Assemble final Lite and Pro placeholder reports from layer drafts."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer2LiteFinal, Layer4ProFinal
from .report_blueprints import (
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    PRO_REPORT_BLUEPRINT,
    PRO_REPORT_INTRO,
    PRO_REPORT_TITLE,
)
from .report_section_renderer import ReportSectionRenderer


class ReportPlaceholderAssembler:
    """Build final report payloads while keeping orchestrator thin."""

    def __init__(
        self,
        *,
        section_renderer: ReportSectionRenderer,
        get_narrative_service: Callable[[], Any],
        get_theme_label: Callable[[str | None], str],
        build_lite_title: Callable[[InterpretationRecord, str], str],
        build_lite_overall_impression: Callable[
            [InterpretationRecord, str, dict[str, int]],
            str,
        ],
        build_lite_visual_elements: Callable[
            [InterpretationRecord, str, dict[str, int]],
            str,
        ],
        build_lite_emotion_portrait: Callable[[InterpretationRecord, str], str],
        wrap_report_with_safety: Callable[[InterpretationRecord, str], str],
        strip_safety_wrappers: Callable[[str], str],
    ) -> None:
        self.section_renderer = section_renderer
        self._get_narrative_service = get_narrative_service
        self._get_theme_label = get_theme_label
        self._build_lite_title = build_lite_title
        self._build_lite_overall_impression = build_lite_overall_impression
        self._build_lite_visual_elements = build_lite_visual_elements
        self._build_lite_emotion_portrait = build_lite_emotion_portrait
        self._wrap_report_with_safety = wrap_report_with_safety
        self._strip_safety_wrappers = strip_safety_wrappers

    def build_lite(self, record: InterpretationRecord) -> Layer2LiteFinal:
        layer1 = record.layer_1_lite_draft
        theme = record.theme or "general"
        circle_info = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        title = (
            layer1.title
            if layer1 and layer1.title
            else self._build_lite_title(record, theme_label)
        )
        overall_impression = (
            layer1.overall_impression
            if layer1 and layer1.overall_impression
            else self._build_lite_overall_impression(record, theme_label, circle_info)
        )
        visual_elements = (
            layer1.visual_elements
            if layer1 and layer1.visual_elements
            else self._build_lite_visual_elements(record, theme, circle_info)
        )
        emotion_portrait = (
            layer1.emotion_portrait
            if layer1 and layer1.emotion_portrait
            else self._build_lite_emotion_portrait(record, theme_label)
        )
        six_insights_rendered = self.section_renderer.render_lite_six_insights(layer1)
        experiment_rendered = self.section_renderer.render_lite_experiment_card(layer1)
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {title}",
                    "",
                    overall_impression,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_visual_elements"],
                    visual_elements,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_emotion_portrait"],
                    emotion_portrait,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_story"],
                    self.section_renderer.render_story_sections(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels[
                        "section_theme_details"
                    ].format(theme_label=theme_label),
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_scene_label']}{layer1.theme_insights.scene if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_scene']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_impact_label']}{layer1.theme_insights.impact if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_impact']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_awareness_label']}{layer1.theme_insights.awareness if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_awareness']}",
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_six_insights"],
                    six_insights_rendered["base"],
                    "",
                    six_insights_rendered["contradiction"],
                    "",
                    six_insights_rendered["pattern"],
                    "",
                    six_insights_rendered["defense"],
                    "",
                    six_insights_rendered["block"],
                    "",
                    six_insights_rendered["light"],
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_three_awareness"],
                    LITE_REPORT_BLUEPRINT.structure_labels["section_awareness_invitation"],
                    self.section_renderer.render_awareness_lines(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_experiment"],
                    experiment_rendered,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_pro_teaser"],
                    (
                        layer1.pro_teaser
                        if layer1 and layer1.pro_teaser
                        else DEFAULT_PRO_TEASER
                    ),
                ]
            ),
        )

        layer2 = Layer2LiteFinal(
            title=title,
            overall_impression=overall_impression,
            visual_elements_rendered=visual_elements,
            emotion_portrait_rendered=emotion_portrait,
            pro_teaser=(
                layer1.pro_teaser
                if layer1 and layer1.pro_teaser
                else DEFAULT_PRO_TEASER
            ),
            full_report_markdown=full_report_markdown,
            six_insights_rendered=six_insights_rendered,
            experiment_rendered=experiment_rendered,
        )
        if layer1:
            layer2.story = layer1.story
            layer2.theme_insights = layer1.theme_insights
            layer2.three_awareness = layer1.three_awareness

        return layer2

    def build_pro(self, record: InterpretationRecord) -> Layer4ProFinal:
        lite_report = record.layer_2_lite_final
        pro_draft = record.layer_3_pro_draft
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {PRO_REPORT_TITLE}",
                    "",
                    PRO_REPORT_INTRO,
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['first_impression']}",
                    (
                        pro_draft.first_impression
                        if pro_draft
                        else PRO_REPORT_BLUEPRINT.fallback_texts[
                            "missing_pro_increment"
                        ]
                    ),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['core_table']}",
                    self.section_renderer.render_pro_core_table(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['lite_base']}",
                    (
                        self._strip_safety_wrappers(lite_report.full_report_markdown)
                        if lite_report
                        else PRO_REPORT_BLUEPRINT.fallback_texts["missing_lite_base"]
                    ),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['circles']}",
                    self.section_renderer.render_pro_circle_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['micro']}",
                    self.section_renderer.render_pro_micro_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['imbalance']}",
                    self.section_renderer.render_pro_imbalance_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['root_cause']}",
                    self.section_renderer.render_pro_root_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['healing']}",
                    self.section_renderer.render_pro_healing_sections(pro_draft),
                ]
            ),
        )
        return Layer4ProFinal(
            full_report_markdown=full_report_markdown,
            ai_qa_context=self._build_ai_qa_context(record, lite_report, pro_draft),
        )

    def _build_ai_qa_context(
        self,
        record: InterpretationRecord,
        lite_report: Any,
        pro_draft: Any,
    ) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "build_ai_qa_context",
        ):
            return narrative_service.build_ai_qa_context(
                record_theme=record.theme or "general",
                interpretation_id=record.interpretation_id,
                lite_title=lite_report.title if lite_report and lite_report.title else "",
                lite_overall_impression=(
                    lite_report.overall_impression
                    if lite_report and lite_report.overall_impression
                    else ""
                ),
                pro_draft=pro_draft,
            )

        return "\n".join(
            [
                f"主题：{record.theme}",
                f"解读记录ID：{record.interpretation_id}",
                f"Lite 标题：{lite_report.title if lite_report and lite_report.title else ''}",
                f"Lite 整体印象：{lite_report.overall_impression if lite_report and lite_report.overall_impression else ''}",
                (
                    f"第一眼直觉：{pro_draft.first_impression}"
                    if pro_draft and pro_draft.first_impression
                    else ""
                ),
                (
                    "核心洞察："
                    + "；".join(
                        f"{key}={value}"
                        for key, value in list((pro_draft.core_insight_table or {}).items())[:4]
                        if isinstance(value, str) and value.strip()
                    )
                    if pro_draft and pro_draft.core_insight_table
                    else ""
                ),
            ]
        )
