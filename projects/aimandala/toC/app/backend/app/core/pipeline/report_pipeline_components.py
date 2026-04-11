"""Component wiring helpers for the migrated V2 report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from app.core.prompt.builder_v2 import PromptBuilder

from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_draft_assembler import ReportDraftAssembler
from .report_interaction_support import ReportInteractionSupport
from .report_knowledge_adapter import ReportKnowledgeAdapter
from .report_layer0_support import ReportLayer0Support
from .report_lifecycle import ReportLifecycleManager
from .report_lite_record_workflow import ReportLiteRecordWorkflow
from .report_lite_narrative_builder import ReportLiteNarrativeBuilder
from .report_placeholder_assembler import ReportPlaceholderAssembler
from .report_projection_resolver import ReportProjectionResolver
from .report_pro_narrative_builder import ReportProNarrativeBuilder
from .report_prompt_preview import ReportPromptPreviewBuilder
from .report_safety_wrapper import ReportSafetyWrapper
from .report_section_renderer import ReportSectionRenderer


def install_report_pipeline_components(
    orchestrator: Any,
    *,
    extract_colors_by_circles: Any,
    analyze_energy_flow: Callable[[list, list, list], dict[str, Any]],
    detecting_stage: str,
    generating_stage: str,
    processing_stage: str,
    completed_stage: str,
) -> None:
    """Attach report pipeline collaborators and compatibility bindings."""

    orchestrator.report_layer0_support = ReportLayer0Support(
        get_layer0_assembler=lambda: orchestrator.layer0_assembler,
        extract_colors_by_circles=extract_colors_by_circles,
        analyze_energy_flow=analyze_energy_flow,
    )
    orchestrator.prompt_builder = PromptBuilder()
    orchestrator.report_contracts = ReportContractAssembler(orchestrator.prompt_builder)
    orchestrator.report_section_renderer = ReportSectionRenderer()
    orchestrator.report_knowledge_adapter = ReportKnowledgeAdapter(
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_knowledge_runtime=lambda: orchestrator.knowledge_runtime,
        get_layer0_view=orchestrator.report_layer0_support.get_layer0_view,
    )
    orchestrator.report_prompt_preview_builder = ReportPromptPreviewBuilder(
        prompt_builder=orchestrator.prompt_builder,
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        get_record_theme=orchestrator.report_layer0_support.get_record_theme,
        get_layer0_view=orchestrator.report_layer0_support.get_layer0_view,
        get_layer0_element_distribution=(
            orchestrator.report_layer0_support.get_layer0_element_distribution
        ),
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        get_signal_label=orchestrator.report_knowledge_adapter.get_signal_label,
        get_knowledge_theme_summary=(
            orchestrator.report_knowledge_adapter.get_knowledge_theme_summary
        ),
    )
    orchestrator.report_debug_builder = ReportDebugProfileBuilder(
        prompt_builder=orchestrator.prompt_builder,
        validator=orchestrator.report_contracts.validator,
    )
    orchestrator.report_interaction_support = ReportInteractionSupport(
        store=orchestrator.store,
        report_debug_builder=orchestrator.report_debug_builder,
        get_report_chat_runtime=lambda: orchestrator.report_chat_runtime,
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        get_signal_label=orchestrator.report_knowledge_adapter.get_signal_label,
        get_knowledge_theme_summary=(
            orchestrator.report_knowledge_adapter.get_knowledge_theme_summary
        ),
    )
    orchestrator.report_safety_wrapper = ReportSafetyWrapper()
    orchestrator.report_lifecycle_manager = ReportLifecycleManager(
        store=orchestrator.store,
        report_contracts=orchestrator.report_contracts,
        generation_runtime=orchestrator.generation_runtime,
        get_upgrade_diff=orchestrator.get_upgrade_diff,
        processing_stage=processing_stage,
        completed_stage=completed_stage,
    )
    orchestrator.report_lite_record_workflow = ReportLiteRecordWorkflow(
        store=orchestrator.store,
        generation_runtime=orchestrator.generation_runtime,
        detecting_stage=detecting_stage,
        generating_stage=generating_stage,
        completed_stage=completed_stage,
    )
    orchestrator.report_projection_resolver = ReportProjectionResolver(
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_record_theme=orchestrator.report_layer0_support.get_record_theme,
        get_layer0_view=orchestrator.report_layer0_support.get_layer0_view,
        get_layer0_element_distribution=(
            orchestrator.report_layer0_support.get_layer0_element_distribution
        ),
        describe_circle_transition=(
            orchestrator.report_knowledge_adapter.describe_circle_transition
        ),
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        build_feeling_hint=orchestrator.report_prompt_preview_builder.build_feeling_hint,
        build_lite_title_fallback=lambda record, theme_label: (
            orchestrator.report_lite_narrative_builder.build_title_fallback(
                record,
                theme_label,
            )
        ),
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        describe_circle_pattern=lambda circles: (
            orchestrator.report_lite_narrative_builder.describe_circle_pattern(circles)
        ),
    )
    orchestrator.report_lite_narrative_builder = ReportLiteNarrativeBuilder(
        get_record_theme=orchestrator.report_layer0_support.get_record_theme,
        get_layer0_view=orchestrator.report_layer0_support.get_layer0_view,
        get_layer0_element_distribution=(
            orchestrator.report_layer0_support.get_layer0_element_distribution
        ),
        get_element_theme_phrase=(
            orchestrator.report_knowledge_adapter.get_element_theme_phrase
        ),
        get_element_core_keywords=(
            orchestrator.report_knowledge_adapter.get_element_core_keywords
        ),
        describe_circle_transition=(
            orchestrator.report_knowledge_adapter.describe_circle_transition
        ),
        describe_signal=orchestrator.report_knowledge_adapter.describe_signal,
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        resolve_runtime_lite_projection=(
            orchestrator.report_projection_resolver.resolve_runtime_lite_projection
        ),
        get_projection_text=orchestrator.report_projection_resolver.get_projection_text,
        get_projection_mapping=(
            orchestrator.report_projection_resolver.get_projection_mapping
        ),
        get_projection_list=orchestrator.report_projection_resolver.get_projection_list,
        build_feeling_hint=orchestrator.report_prompt_preview_builder.build_feeling_hint,
        get_narrative_service=lambda: orchestrator.narrative_service,
        clean_knowledge_text_block=(
            orchestrator.report_knowledge_adapter.clean_knowledge_text_block
        ),
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
    )
    orchestrator.report_pro_narrative_builder = ReportProNarrativeBuilder(
        get_record_theme=orchestrator.report_layer0_support.get_record_theme,
        get_layer0_view=orchestrator.report_layer0_support.get_layer0_view,
        get_layer0_element_distribution=(
            orchestrator.report_layer0_support.get_layer0_element_distribution
        ),
        describe_circle_transition=(
            orchestrator.report_knowledge_adapter.describe_circle_transition
        ),
        describe_signal=orchestrator.report_knowledge_adapter.describe_signal,
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        get_signal_label=orchestrator.report_knowledge_adapter.get_signal_label,
        get_element_theme_phrase=(
            orchestrator.report_knowledge_adapter.get_element_theme_phrase
        ),
        get_projection_text=orchestrator.report_projection_resolver.get_projection_text,
        get_projection_mapping=(
            orchestrator.report_projection_resolver.get_projection_mapping
        ),
        get_runtime_imbalance_projection=(
            orchestrator.report_projection_resolver.get_runtime_imbalance_projection
        ),
        build_feeling_hint=orchestrator.report_prompt_preview_builder.build_feeling_hint,
        get_knowledge_runtime=lambda: orchestrator.knowledge_runtime,
    )
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
    _install_legacy_report_bindings(orchestrator)


def _install_legacy_report_bindings(orchestrator: Any) -> None:
    """Preserve legacy private entry points while helpers own the logic."""

    legacy_bindings = {
        "_build_lite_placeholder_report": orchestrator.report_placeholder_assembler.build_lite,
        "_build_layer0_placeholder": orchestrator.report_layer0_support.build_placeholder,
        "_build_layer0_fallback": orchestrator.report_layer0_support.build_fallback,
        "_build_layer1_placeholder": orchestrator.report_draft_assembler.build_lite,
        "_build_pro_placeholder_draft": orchestrator.report_draft_assembler.build_pro,
        "_build_runtime_pro_narrative_projection": (
            orchestrator.report_projection_resolver.build_runtime_pro_narrative_projection
        ),
        "_build_pro_placeholder_report": orchestrator.report_placeholder_assembler.build_pro,
        "_get_theme_label": orchestrator.report_knowledge_adapter.get_theme_label,
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
        "_describe_circle_pattern": (
            orchestrator.report_lite_narrative_builder.describe_circle_pattern
        ),
        "_render_story_sections": orchestrator.report_section_renderer.render_story_sections,
        "_render_awareness_lines": orchestrator.report_section_renderer.render_awareness_lines,
        "_render_experiment_text": orchestrator.report_section_renderer.render_experiment_text,
    }
    for name, method in legacy_bindings.items():
        setattr(orchestrator, name, method)
