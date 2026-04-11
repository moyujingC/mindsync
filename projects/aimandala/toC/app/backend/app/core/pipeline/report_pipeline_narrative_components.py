"""Narrative installer for migrated V2 report pipeline components."""

from __future__ import annotations

from typing import Any

from .report_lite_narrative_builder import ReportLiteNarrativeBuilder
from .report_projection_resolver import ReportProjectionResolver
from .report_pro_narrative_builder import ReportProNarrativeBuilder


def install_report_narrative_components(orchestrator: Any) -> None:
    """Attach narrative and projection helpers that build report meaning."""

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
