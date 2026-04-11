"""Output installer for migrated V2 report pipeline components."""

from __future__ import annotations

from typing import Any

from .report_draft_assembler import ReportDraftAssembler
from .report_placeholder_assembler import ReportPlaceholderAssembler


def install_report_output_components(orchestrator: Any) -> None:
    """Attach report assembly helpers that produce final payload structures."""

    orchestrator.report_draft_assembler = ReportDraftAssembler(
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        build_lite_prompt_preview=(
            orchestrator.report_prompt_preview_builder.build_lite_prompt_preview
        ),
        build_runtime_lite_narrative_projection=(
            orchestrator.report_projection_resolver.build_runtime_lite_narrative_projection
        ),
        build_lite_story_sections=(
            orchestrator.report_lite_narrative_builder.build_story_sections
        ),
        build_lite_theme_insights=(
            orchestrator.report_lite_narrative_builder.build_theme_insights
        ),
        build_lite_title=orchestrator.report_lite_narrative_builder.build_title,
        build_lite_overall_impression=(
            orchestrator.report_lite_narrative_builder.build_overall_impression
        ),
        build_lite_visual_elements=(
            orchestrator.report_lite_narrative_builder.build_visual_elements
        ),
        build_lite_emotion_portrait=(
            orchestrator.report_lite_narrative_builder.build_emotion_portrait
        ),
        build_lite_pro_teaser=orchestrator.report_lite_narrative_builder.build_pro_teaser,
        build_lite_three_awareness=(
            orchestrator.report_lite_narrative_builder.build_three_awareness
        ),
        build_lite_six_insights_payload=(
            orchestrator.report_lite_narrative_builder.build_six_insights_payload
        ),
        build_lite_experiment_payload=(
            orchestrator.report_lite_narrative_builder.build_experiment_payload
        ),
        build_pro_prompt_preview=(
            orchestrator.report_prompt_preview_builder.build_pro_prompt_preview
        ),
        get_runtime_imbalance_projection=(
            orchestrator.report_projection_resolver.get_runtime_imbalance_projection
        ),
        build_pro_imbalance_profile=(
            orchestrator.report_pro_narrative_builder.build_pro_imbalance_profile
        ),
        build_runtime_pro_narrative_projection=(
            orchestrator.report_projection_resolver.build_runtime_pro_narrative_projection
        ),
        build_pro_first_impression=(
            orchestrator.report_pro_narrative_builder.build_first_impression
        ),
        build_pro_energy_essence=(
            orchestrator.report_pro_narrative_builder.build_energy_essence
        ),
        build_pro_block_point=orchestrator.report_pro_narrative_builder.build_block_point,
        build_pro_direction=orchestrator.report_pro_narrative_builder.build_direction,
        build_pro_healing_core=(
            orchestrator.report_pro_narrative_builder.build_healing_core
        ),
        build_pro_circle_reading=(
            orchestrator.report_pro_narrative_builder.build_circle_reading
        ),
        build_pro_micro_sections_from_knowledge=(
            orchestrator.report_pro_narrative_builder.build_micro_sections_from_knowledge
        ),
        build_surface_root_cause=(
            orchestrator.report_pro_narrative_builder.build_surface_root_cause
        ),
        build_deeper_root_cause=(
            orchestrator.report_pro_narrative_builder.build_deeper_root_cause
        ),
        build_core_root_cause=(
            orchestrator.report_pro_narrative_builder.build_core_root_cause
        ),
        build_pro_healing_suggestions=(
            orchestrator.report_pro_narrative_builder.build_pro_healing_suggestions
        ),
    )
    orchestrator.report_placeholder_assembler = ReportPlaceholderAssembler(
        section_renderer=orchestrator.report_section_renderer,
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        build_lite_title=orchestrator.report_lite_narrative_builder.build_title,
        build_lite_overall_impression=(
            orchestrator.report_lite_narrative_builder.build_overall_impression
        ),
        build_lite_visual_elements=(
            orchestrator.report_lite_narrative_builder.build_visual_elements
        ),
        build_lite_emotion_portrait=(
            orchestrator.report_lite_narrative_builder.build_emotion_portrait
        ),
        wrap_report_with_safety=orchestrator.report_safety_wrapper.wrap_report,
        strip_safety_wrappers=orchestrator.report_safety_wrapper.strip_wrappers,
    )
