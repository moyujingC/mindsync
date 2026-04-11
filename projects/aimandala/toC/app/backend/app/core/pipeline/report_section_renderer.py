"""Render markdown sections from layer payloads."""

from __future__ import annotations

from typing import Optional

from .data_models import Layer1LiteDraft, Layer3ProDraft
from .report_blueprints import LITE_REPORT_BLUEPRINT, PRO_REPORT_BLUEPRINT


class ReportSectionRenderer:
    """Render compatible Lite and Pro markdown sections from layer drafts."""

    def render_lite_six_insights(
        self,
        layer1: Optional[Layer1LiteDraft],
    ) -> dict[str, str]:
        rendered: dict[str, str] = {}
        for key, value in LITE_REPORT_BLUEPRINT.six_insight_defaults.items():
            source = getattr(layer1.six_insights, key, {}) if layer1 else {}
            title = source.get("title") or value.get("title", key)
            content = (
                source.get("content")
                or source.get("summary")
                or value.get("content", "")
            )
            rendered[key] = f"【{title}】\n\n{content}"
        return rendered

    def render_lite_experiment_card(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return (
                f"【{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('title', LITE_REPORT_BLUEPRINT.structure_labels['fallback_experiment_title'])}】\n\n"
                f"{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('content', '')}"
            ).strip()

        title = layer1.experiment.get(
            "title",
            LITE_REPORT_BLUEPRINT.structure_labels["fallback_experiment_title"],
        )
        content = layer1.experiment.get("content", "")
        return f"【{title}】\n\n{content}".strip()

    def render_pro_core_table(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.core_insight_table:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_core_table"]

        rows = [
            *[
                (
                    label,
                    pro_draft.core_insight_table.get(key, "")
                    or pro_draft.core_insight_table.get(
                        {
                            "核心失衡": "当前失衡",
                            "关键卡点": PRO_REPORT_BLUEPRINT.structure_labels[
                                "core_table_fallback_block"
                            ],
                            "转化方向": PRO_REPORT_BLUEPRINT.structure_labels[
                                "core_table_fallback_direction"
                            ],
                            "核心失衡": PRO_REPORT_BLUEPRINT.structure_labels[
                                "core_table_fallback_summary"
                            ],
                        }.get(key, key),
                        "",
                    ),
                )
                for key, label in PRO_REPORT_BLUEPRINT.core_table_labels
            ],
        ]
        body = "\n".join(
            f"| {label} | {content} |" for label, content in rows if content
        )
        return "\n".join(
            [
                f"| {PRO_REPORT_BLUEPRINT.structure_labels['core_table_dimension']} | {PRO_REPORT_BLUEPRINT.structure_labels['core_table_content']} |",
                "| --- | --- |",
                body,
            ]
        ).strip()

    def render_pro_circle_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.three_circles_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_circle_sections"]

        sections: list[str] = []
        for key in ["inner", "middle", "outer"]:
            item = pro_draft.three_circles_detailed.get(key)
            if not item:
                continue
            label = item.get("label", key)
            reading = item.get("reading", "")
            if reading:
                sections.extend([f"**{label}**", "", reading, ""])
        return "\n".join(sections).strip()

    def render_pro_micro_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.micro_analysis_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_micro_sections"]

        sections: list[str] = []
        for label, content in pro_draft.micro_analysis_detailed.items():
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def render_pro_root_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.root_cause:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_root_sections"]

        sections: list[str] = []
        for key in ["surface", "deeper", "core"]:
            content = pro_draft.root_cause.get(key, "")
            if not content:
                continue
            sections.extend(
                [
                    f"**{PRO_REPORT_BLUEPRINT.root_cause_labels.get(key, key)}**",
                    "",
                    content,
                    "",
                ]
            )
        return "\n".join(sections).strip()

    def render_pro_imbalance_sections(
        self,
        pro_draft: Optional[Layer3ProDraft],
    ) -> str:
        if not pro_draft or not pro_draft.imbalance_confirmed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_imbalance_sections"]

        sections: list[str] = []
        for key, label in PRO_REPORT_BLUEPRINT.imbalance_labels.items():
            content = pro_draft.imbalance_confirmed.get(key, "")
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def render_pro_healing_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.healing_suggestions:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_healing_sections"]

        sections: list[str] = []
        for item in pro_draft.healing_suggestions:
            phase = item.get(
                "phase",
                PRO_REPORT_BLUEPRINT.narrative_templates["healing_phase_fallback"],
            )
            focus = item.get("focus", "")
            practice = item.get("practice", "")
            if not focus and not practice:
                continue
            sections.extend(
                [
                    f"**{phase}**",
                    focus
                    or PRO_REPORT_BLUEPRINT.narrative_templates[
                        "healing_focus_fallback"
                    ],
                ]
            )
            if practice:
                sections.extend(
                    [
                        f"{PRO_REPORT_BLUEPRINT.structure_labels['healing_action_prefix']}{practice}",
                        "",
                    ]
                )
            else:
                sections.append("")
        return "\n".join(sections).strip()

    def render_story_sections(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_story_sections"]

        return "\n".join(
            sum(
                [
                    [heading, getattr(layer1.story, key).content, ""]
                    for key, heading in LITE_REPORT_BLUEPRINT.story_section_headings
                ],
                [],
            )[:-1]
        )

    def render_awareness_lines(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.three_awareness:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_awareness_lines"]

        return "\n".join(
            f"### 第 {item.day} 天：{item.title}\n{item.content}"
            for item in layer1.three_awareness
        )

    def render_experiment_text(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_experiment_text"]

        return (
            f"{layer1.experiment.get('title', '一个小实验')}："
            f"{layer1.experiment.get('content', '')}"
        )
