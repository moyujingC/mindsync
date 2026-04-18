"""Assemble Lite and Pro draft layers from report helper callbacks."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer1LiteDraft, Layer3ProDraft
from .report_blueprints import LITE_REPORT_BLUEPRINT, PRO_REPORT_BLUEPRINT


class ReportDraftAssembler:
    """Build Layer1/Layer3 drafts while keeping orchestrator composition-focused."""

    def __init__(
        self,
        *,
        get_theme_label: Callable[[str | None], str],
        build_lite_prompt_preview: Callable[[InterpretationRecord], str],
        build_runtime_lite_narrative_plan: Callable[..., dict[str, Any]],
        build_runtime_lite_narrative_projection: Callable[..., dict[str, Any]],
        build_lite_story_sections: Callable[..., dict[str, str]],
        build_lite_theme_insights: Callable[..., dict[str, str]],
        build_lite_title: Callable[..., str],
        build_lite_overall_impression: Callable[..., str],
        build_lite_visual_elements: Callable[..., str],
        build_lite_emotion_portrait: Callable[..., str],
        build_lite_pro_teaser: Callable[..., str],
        build_lite_three_awareness: Callable[..., list[Any]],
        build_lite_six_insights_payload: Callable[..., dict[str, dict[str, str]]],
        build_lite_experiment_payload: Callable[..., dict[str, str]],
        build_pro_prompt_preview: Callable[[InterpretationRecord], str],
        get_runtime_imbalance_narrative_basis: Callable[[InterpretationRecord], dict[str, Any]],
        get_runtime_imbalance_projection: Callable[[InterpretationRecord], dict[str, Any]],
        build_pro_imbalance_profile: Callable[..., dict[str, Any]],
        build_runtime_pro_narrative_plan: Callable[..., dict[str, Any]],
        build_runtime_pro_narrative_projection: Callable[..., dict[str, Any]],
        build_pro_first_impression: Callable[..., str],
        build_pro_energy_essence: Callable[..., str],
        build_pro_block_point: Callable[..., str],
        build_pro_direction: Callable[..., str],
        build_pro_healing_core: Callable[..., str],
        build_pro_circle_reading: Callable[..., str],
        build_pro_micro_sections_from_knowledge: Callable[..., dict[str, str]],
        build_surface_root_cause: Callable[..., str],
        build_deeper_root_cause: Callable[..., str],
        build_core_root_cause: Callable[..., str],
        build_pro_healing_suggestions: Callable[..., list[dict[str, Any]]],
    ) -> None:
        self._get_theme_label = get_theme_label
        self._build_lite_prompt_preview = build_lite_prompt_preview
        self._build_runtime_lite_narrative_plan = build_runtime_lite_narrative_plan
        self._build_runtime_lite_narrative_projection = (
            build_runtime_lite_narrative_projection
        )
        self._build_lite_story_sections = build_lite_story_sections
        self._build_lite_theme_insights = build_lite_theme_insights
        self._build_lite_title = build_lite_title
        self._build_lite_overall_impression = build_lite_overall_impression
        self._build_lite_visual_elements = build_lite_visual_elements
        self._build_lite_emotion_portrait = build_lite_emotion_portrait
        self._build_lite_pro_teaser = build_lite_pro_teaser
        self._build_lite_three_awareness = build_lite_three_awareness
        self._build_lite_six_insights_payload = build_lite_six_insights_payload
        self._build_lite_experiment_payload = build_lite_experiment_payload
        self._build_pro_prompt_preview = build_pro_prompt_preview
        self._get_runtime_imbalance_narrative_basis = (
            get_runtime_imbalance_narrative_basis
        )
        self._get_runtime_imbalance_projection = get_runtime_imbalance_projection
        self._build_pro_imbalance_profile = build_pro_imbalance_profile
        self._build_runtime_pro_narrative_plan = build_runtime_pro_narrative_plan
        self._build_runtime_pro_narrative_projection = (
            build_runtime_pro_narrative_projection
        )
        self._build_pro_first_impression = build_pro_first_impression
        self._build_pro_energy_essence = build_pro_energy_essence
        self._build_pro_block_point = build_pro_block_point
        self._build_pro_direction = build_pro_direction
        self._build_pro_healing_core = build_pro_healing_core
        self._build_pro_circle_reading = build_pro_circle_reading
        self._build_pro_micro_sections_from_knowledge = (
            build_pro_micro_sections_from_knowledge
        )
        self._build_surface_root_cause = build_surface_root_cause
        self._build_deeper_root_cause = build_deeper_root_cause
        self._build_core_root_cause = build_core_root_cause
        self._build_pro_healing_suggestions = build_pro_healing_suggestions

    def build_lite(self, record: InterpretationRecord) -> Layer1LiteDraft:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(record.theme)
        lite_plan = self._build_runtime_lite_narrative_plan(
            record,
            theme_label,
        )
        lite_projection = (
            lite_plan.get("legacy_projection", {})
            if isinstance(lite_plan, dict)
            else self._build_runtime_lite_narrative_projection(
                record,
                theme_label,
            )
        )
        lite_prompt_preview = self._build_lite_prompt_preview(
            record,
            projection=lite_projection,
            narrative_plan=lite_plan if isinstance(lite_plan, dict) else {},
        )
        story_sections = self._build_lite_story_sections(
            record,
            theme_label,
            projection=lite_projection,
        )
        theme_insights = self._build_lite_theme_insights(
            record,
            theme_label,
            projection=lite_projection,
        )
        layer = Layer1LiteDraft(
            title=self._build_lite_title(
                record,
                theme_label,
                projection=lite_projection,
            ),
            overall_impression=self._build_lite_overall_impression(
                record,
                theme_label,
                circles,
                projection=lite_projection,
            ),
            visual_elements=self._build_lite_visual_elements(
                record,
                record.theme or "general",
                circles,
                projection=lite_projection,
            ),
            emotion_portrait=self._build_lite_emotion_portrait(
                record,
                theme_label,
                projection=lite_projection,
            ),
            pro_teaser=self._build_lite_pro_teaser(
                record,
                projection=lite_projection,
            ),
            narrative_plan=lite_plan if isinstance(lite_plan, dict) else {},
        )
        layer.story.base.content = story_sections["base"]
        layer.story.base.connector = LITE_REPORT_BLUEPRINT.story_connectors["base"]
        layer.story.contradiction.content = story_sections["contradiction"]
        layer.story.contradiction.connector = LITE_REPORT_BLUEPRINT.story_connectors[
            "contradiction"
        ]
        layer.story.pattern.content = story_sections["pattern"]
        layer.story.pattern.connector = LITE_REPORT_BLUEPRINT.story_connectors[
            "pattern"
        ]
        layer.story.defense.content = story_sections["defense"]
        layer.story.defense.connector = LITE_REPORT_BLUEPRINT.story_connectors[
            "defense"
        ]
        layer.story.block.content = story_sections["block"]
        layer.story.block.connector = LITE_REPORT_BLUEPRINT.story_connectors["block"]
        layer.story.light.content = story_sections["light"]
        layer.theme_insights.scene = theme_insights["scene"]
        layer.theme_insights.impact = theme_insights["impact"]
        layer.theme_insights.awareness = theme_insights["awareness"]
        layer.three_awareness = self._build_lite_three_awareness(
            record,
            theme_label,
            projection=lite_projection,
        )
        six_insights = self._build_lite_six_insights_payload(
            record,
            theme_label,
            story_sections,
            projection=lite_projection,
        )
        for key, payload in six_insights.items():
            getattr(layer.six_insights, key).update(payload)
        layer.experiment = self._build_lite_experiment_payload(
            record,
            theme_label,
            layer.title,
            projection=lite_projection,
        )
        layer.prompt_preview = lite_prompt_preview
        return layer

    def build_pro(self, record: InterpretationRecord) -> Layer3ProDraft:
        theme = record.theme or "general"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        imbalance_basis = self._get_runtime_imbalance_narrative_basis(record)
        imbalance_projection = (
            imbalance_basis.get("legacy_projection", {})
            if isinstance(imbalance_basis, dict)
            else self._get_runtime_imbalance_projection(record)
        )
        imbalance_profile = self._build_pro_imbalance_profile(
            record,
            theme_label,
            circles,
            projection=imbalance_projection,
        )
        lite_title = (
            record.layer_2_lite_final.title
            if record.layer_2_lite_final and record.layer_2_lite_final.title
            else self._build_lite_title(record, theme_label)
        )
        pro_plan = self._build_runtime_pro_narrative_plan(
            record,
            theme_label=theme_label,
            lite_title=lite_title,
            imbalance_profile=imbalance_profile,
            imbalance_projection=imbalance_projection,
        )
        pro_projection = (
            pro_plan.get("legacy_projection", {})
            if isinstance(pro_plan, dict)
            else self._build_runtime_pro_narrative_projection(
                record,
                theme_label=theme_label,
                lite_title=lite_title,
                imbalance_profile=imbalance_profile,
                imbalance_projection=imbalance_projection,
            )
        )
        pro_prompt_preview = self._build_pro_prompt_preview(
            record,
            narrative_projection=pro_projection,
            imbalance_projection=imbalance_projection,
            imbalance_profile=imbalance_profile,
            narrative_plan=pro_plan if isinstance(pro_plan, dict) else {},
        )
        layer = Layer3ProDraft(
            first_impression=self._build_pro_first_impression(
                record,
                theme_label,
                lite_title,
                projection=pro_projection,
            ),
            core_insight_table={
                "能量本质": self._build_pro_energy_essence(
                    record,
                    theme_label,
                    circles,
                    projection=pro_projection,
                ),
                "核心失衡": imbalance_profile["summary"],
                "关键卡点": self._build_pro_block_point(
                    record,
                    imbalance_profile,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
                "转化方向": self._build_pro_direction(
                    record,
                    theme_label,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
                "疗愈核心": self._build_pro_healing_core(
                    record,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
            },
            three_circles_detailed={
                "inner": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_inner"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "inner",
                        PRO_REPORT_BLUEPRINT.narrative_templates[
                            "circle_inner_reading"
                        ].format(inner=circles["inner_radius"]),
                        projection=pro_projection,
                    ),
                },
                "middle": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_middle"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "middle",
                        PRO_REPORT_BLUEPRINT.narrative_templates[
                            "circle_middle_reading"
                        ].format(middle=circles["middle_radius"]),
                        projection=pro_projection,
                    ),
                },
                "outer": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_outer"],
                    "reading": self._build_pro_circle_reading(
                        record,
                        "outer",
                        PRO_REPORT_BLUEPRINT.narrative_templates[
                            "circle_outer_reading"
                        ],
                        projection=pro_projection,
                    ),
                },
            },
            micro_analysis_detailed=self._build_pro_micro_sections_from_knowledge(
                record,
                projection=pro_projection,
            ),
            imbalance_confirmed=imbalance_profile,
            root_cause={
                "surface": self._build_surface_root_cause(
                    record,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
                "deeper": self._build_deeper_root_cause(
                    record,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
                "core": self._build_core_root_cause(
                    record,
                    narrative_projection=pro_projection,
                    projection=imbalance_projection,
                ),
            },
            healing_suggestions=self._build_pro_healing_suggestions(
                record,
                imbalance_profile=imbalance_profile,
                theme_label=theme_label,
            ),
            narrative_plan=pro_plan if isinstance(pro_plan, dict) else {},
        )
        layer.prompt_preview = pro_prompt_preview
        return layer
