"""Foundation installer for migrated V2 report pipeline components."""

from __future__ import annotations

from typing import Any, Callable

from app.core.prompt.builder_v2 import PromptBuilder

from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_interaction_support import ReportInteractionSupport
from .report_knowledge_adapter import ReportKnowledgeAdapter
from .report_knowledge_debug import KnowledgeDebugBlockBuilder
from .report_layer0_support import ReportLayer0Support
from .report_lifecycle import ReportLifecycleManager
from .report_lite_record_workflow import ReportLiteRecordWorkflow
from .report_pipeline_stage_config import ReportPipelineStageConfig
from .report_prompt_preview import ReportPromptPreviewBuilder
from .report_safety_wrapper import ReportSafetyWrapper
from .report_section_renderer import ReportSectionRenderer


def install_report_foundation_components(
    orchestrator: Any,
    *,
    extract_colors_by_circles: Any,
    analyze_energy_flow: Callable[[list, list, list], dict[str, Any]],
    stages: ReportPipelineStageConfig,
) -> None:
    """Attach report foundation services shared by all downstream helpers."""

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
    orchestrator.knowledge_debug_builder = KnowledgeDebugBlockBuilder(
        get_knowledge_runtime=lambda: orchestrator.knowledge_runtime,
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
    )
    orchestrator.report_interaction_support = ReportInteractionSupport(
        store=orchestrator.store,
        report_debug_builder=orchestrator.report_debug_builder,
        knowledge_debug_builder=orchestrator.knowledge_debug_builder,
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
        processing_stage=stages.processing,
        completed_stage=stages.completed,
    )
    orchestrator.report_lite_record_workflow = ReportLiteRecordWorkflow(
        store=orchestrator.store,
        generation_runtime=orchestrator.generation_runtime,
        detecting_stage=stages.detecting,
        generating_stage=stages.generating,
        completed_stage=stages.completed,
    )
