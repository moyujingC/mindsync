"""Legacy private method bindings for the migrated V2 report pipeline."""

from __future__ import annotations

from typing import Any


def install_report_pipeline_legacy_bindings(orchestrator: Any) -> None:
    """Preserve legacy private entry points while helpers own the logic."""

    legacy_bindings: dict[str, Any] = {}
    legacy_bindings.update(_build_legacy_entrypoint_bindings(orchestrator))
    legacy_bindings.update(_build_legacy_lite_bindings(orchestrator))
    legacy_bindings.update(_build_legacy_pro_bindings(orchestrator))
    legacy_bindings.update(_build_legacy_knowledge_bindings(orchestrator))
    legacy_bindings.update(_build_legacy_renderer_bindings(orchestrator))
    for name, method in legacy_bindings.items():
        setattr(orchestrator, name, method)


def _build_legacy_entrypoint_bindings(orchestrator: Any) -> dict[str, Any]:
    return {
        "_build_lite_placeholder_report": orchestrator.report_placeholder_assembler.build_lite,
        "_build_layer0_placeholder": orchestrator.report_layer0_support.build_placeholder,
        "_build_layer0_fallback": orchestrator.report_layer0_support.build_fallback,
        "_build_layer1_placeholder": orchestrator.report_draft_assembler.build_lite,
        "_build_pro_placeholder_draft": orchestrator.report_draft_assembler.build_pro,
        "_build_runtime_pro_narrative_projection": (
            orchestrator.report_projection_resolver.build_runtime_pro_narrative_projection
        ),
        "_build_pro_placeholder_report": orchestrator.report_placeholder_assembler.build_pro,
    }


def _build_legacy_lite_bindings(orchestrator: Any) -> dict[str, Any]:
    return {
        "_build_lite_title": orchestrator.report_lite_narrative_builder.build_title,
        "_build_lite_title_fallback": (
            orchestrator.report_lite_narrative_builder.build_title_fallback
        ),
        "_build_lite_overall_impression": (
            orchestrator.report_lite_narrative_builder.build_overall_impression
        ),
        "_build_lite_visual_elements": (
            orchestrator.report_lite_narrative_builder.build_visual_elements
        ),
        "_build_runtime_lite_narrative_projection": (
            orchestrator.report_projection_resolver.build_runtime_lite_narrative_projection
        ),
        "_resolve_runtime_lite_projection": (
            orchestrator.report_projection_resolver.resolve_runtime_lite_projection
        ),
        "_get_projection_text": orchestrator.report_projection_resolver.get_projection_text,
        "_get_projection_mapping": (
            orchestrator.report_projection_resolver.get_projection_mapping
        ),
        "_get_projection_list": orchestrator.report_projection_resolver.get_projection_list,
        "_build_lite_emotion_portrait": (
            orchestrator.report_lite_narrative_builder.build_emotion_portrait
        ),
        "_build_lite_story_sections": (
            orchestrator.report_lite_narrative_builder.build_story_sections
        ),
        "_build_lite_theme_insights": (
            orchestrator.report_lite_narrative_builder.build_theme_insights
        ),
        "_build_lite_three_awareness": (
            orchestrator.report_lite_narrative_builder.build_three_awareness
        ),
        "_build_lite_six_insights_payload": (
            orchestrator.report_lite_narrative_builder.build_six_insights_payload
        ),
        "_build_lite_experiment_payload": (
            orchestrator.report_lite_narrative_builder.build_experiment_payload
        ),
        "_build_lite_pro_teaser": (
            orchestrator.report_lite_narrative_builder.build_pro_teaser
        ),
        "_describe_circle_pattern": (
            orchestrator.report_lite_narrative_builder.describe_circle_pattern
        ),
    }


def _build_legacy_pro_bindings(orchestrator: Any) -> dict[str, Any]:
    return {
        "_build_pro_first_impression": (
            orchestrator.report_pro_narrative_builder.build_first_impression
        ),
        "_build_pro_energy_essence": (
            orchestrator.report_pro_narrative_builder.build_energy_essence
        ),
        "_build_pro_block_point": (
            orchestrator.report_pro_narrative_builder.build_block_point
        ),
        "_build_pro_direction": orchestrator.report_pro_narrative_builder.build_direction,
        "_build_pro_healing_core": (
            orchestrator.report_pro_narrative_builder.build_healing_core
        ),
        "_build_deeper_root_cause": (
            orchestrator.report_pro_narrative_builder.build_deeper_root_cause
        ),
        "_build_core_root_cause": (
            orchestrator.report_pro_narrative_builder.build_core_root_cause
        ),
        "_get_runtime_imbalance_projection": (
            orchestrator.report_projection_resolver.get_runtime_imbalance_projection
        ),
        "_build_pro_circle_reading": (
            orchestrator.report_pro_narrative_builder.build_circle_reading
        ),
        "_build_pro_micro_sections_from_knowledge": (
            orchestrator.report_pro_narrative_builder.build_micro_sections_from_knowledge
        ),
        "_build_surface_root_cause": (
            orchestrator.report_pro_narrative_builder.build_surface_root_cause
        ),
        "_map_knowledge_signal_to_profile": (
            orchestrator.report_pro_narrative_builder.map_knowledge_signal_to_profile
        ),
        "_build_pro_imbalance_profile": (
            orchestrator.report_pro_narrative_builder.build_pro_imbalance_profile
        ),
        "_build_runtime_imbalance_profile": (
            orchestrator.report_pro_narrative_builder.build_runtime_imbalance_profile
        ),
        "_select_pro_imbalance_type": (
            orchestrator.report_pro_narrative_builder.select_pro_imbalance_type
        ),
        "_build_pro_healing_suggestions": (
            orchestrator.report_pro_narrative_builder.build_pro_healing_suggestions
        ),
        "_build_runtime_healing_suggestions": (
            orchestrator.report_pro_narrative_builder.build_runtime_healing_suggestions
        ),
    }


def _build_legacy_knowledge_bindings(orchestrator: Any) -> dict[str, Any]:
    return {
        "_get_theme_label": orchestrator.report_knowledge_adapter.get_theme_label,
        "_get_record_theme": orchestrator.report_layer0_support.get_record_theme,
        "_get_layer0_view": orchestrator.report_layer0_support.get_layer0_view,
        "_get_layer0_element_distribution": (
            orchestrator.report_layer0_support.get_layer0_element_distribution
        ),
        "_get_primary_knowledge_signal": (
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        "_get_signal_label": orchestrator.report_knowledge_adapter.get_signal_label,
        "_describe_signal": orchestrator.report_knowledge_adapter.describe_signal,
        "_get_element_theme_phrase": (
            orchestrator.report_knowledge_adapter.get_element_theme_phrase
        ),
        "_get_element_core_keywords": (
            orchestrator.report_knowledge_adapter.get_element_core_keywords
        ),
        "_get_theme_element_profile": (
            orchestrator.report_knowledge_adapter.get_theme_element_profile
        ),
        "_describe_circle_transition": (
            orchestrator.report_knowledge_adapter.describe_circle_transition
        ),
        "_clean_knowledge_text_block": (
            orchestrator.report_knowledge_adapter.clean_knowledge_text_block
        ),
        "_build_user_context_hint": (
            orchestrator.report_prompt_preview_builder.build_user_context_hint
        ),
        "_build_lite_prompt_preview": (
            orchestrator.report_prompt_preview_builder.build_lite_prompt_preview
        ),
        "_build_theme_prompt_context": (
            orchestrator.report_prompt_preview_builder.build_theme_prompt_context
        ),
        "get_knowledge_theme_summary": (
            orchestrator.report_knowledge_adapter.get_knowledge_theme_summary
        ),
        "_build_pro_prompt_preview": (
            orchestrator.report_prompt_preview_builder.build_pro_prompt_preview
        ),
        "_build_feeling_hint": orchestrator.report_prompt_preview_builder.build_feeling_hint,
    }


def _build_legacy_renderer_bindings(orchestrator: Any) -> dict[str, Any]:
    return {
        "_render_lite_six_insights": (
            orchestrator.report_section_renderer.render_lite_six_insights
        ),
        "_render_lite_experiment_card": (
            orchestrator.report_section_renderer.render_lite_experiment_card
        ),
        "_render_pro_core_table": orchestrator.report_section_renderer.render_pro_core_table,
        "_render_pro_circle_sections": (
            orchestrator.report_section_renderer.render_pro_circle_sections
        ),
        "_render_pro_micro_sections": (
            orchestrator.report_section_renderer.render_pro_micro_sections
        ),
        "_render_pro_root_sections": (
            orchestrator.report_section_renderer.render_pro_root_sections
        ),
        "_render_pro_imbalance_sections": (
            orchestrator.report_section_renderer.render_pro_imbalance_sections
        ),
        "_render_pro_healing_sections": (
            orchestrator.report_section_renderer.render_pro_healing_sections
        ),
        "_render_story_sections": orchestrator.report_section_renderer.render_story_sections,
        "_render_awareness_lines": orchestrator.report_section_renderer.render_awareness_lines,
        "_render_experiment_text": orchestrator.report_section_renderer.render_experiment_text,
    }
