"""Foundation installer for migrated V2 report pipeline components."""

from __future__ import annotations

from typing import Any, Callable

from app.core.insight import InsightAgent
from app.core.prompt.builder_v2 import PromptBuilder

from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_interaction_support import ReportInteractionSupport
from .report_knowledge_adapter import ReportKnowledgeAdapter
from .report_knowledge_debug import KnowledgeDebugBlockBuilder
from .report_lifecycle import ReportLifecycleManager
from .report_lite_record_workflow import ReportLiteRecordWorkflow
from .report_pipeline_stage_config import ReportPipelineStageConfig
from .report_safety_wrapper import ReportSafetyWrapper
from .report_section_renderer import ReportSectionRenderer
from .stage_process_package import StageProcessPackageAssembler


def install_report_foundation_components(
    orchestrator: Any,
    *,
    extract_colors_by_circles: Any,
    analyze_energy_flow: Callable[[list, list, list], dict[str, Any]],
    stages: ReportPipelineStageConfig,
) -> None:
    """Attach report foundation services shared by all downstream helpers."""

    orchestrator.prompt_builder = PromptBuilder()
    orchestrator.report_contracts = ReportContractAssembler()
    orchestrator.report_section_renderer = ReportSectionRenderer()
    orchestrator.report_knowledge_adapter = ReportKnowledgeAdapter(
        get_narrative_service=lambda: orchestrator.narrative_service,
        get_knowledge_runtime=lambda: orchestrator.knowledge_runtime,
    )
    orchestrator.stage_package_assembler = StageProcessPackageAssembler(
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        get_knowledge_theme_summary=(
            orchestrator.report_knowledge_adapter.get_knowledge_theme_summary
        ),
    )
    orchestrator.report_debug_builder = ReportDebugProfileBuilder(
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
    orchestrator.insight_agent = InsightAgent(
        store=orchestrator.store,
        report_lite_record_workflow=orchestrator.report_lite_record_workflow,
        report_lifecycle_manager=orchestrator.report_lifecycle_manager,
        report_interaction_support=orchestrator.report_interaction_support,
        knowledge_debug_builder=orchestrator.knowledge_debug_builder,
        get_primary_knowledge_signal=(
            orchestrator.report_knowledge_adapter.get_primary_knowledge_signal
        ),
        get_theme_label=orchestrator.report_knowledge_adapter.get_theme_label,
        get_signal_label=orchestrator.report_knowledge_adapter.get_signal_label,
        get_knowledge_theme_summary=(
            orchestrator.report_knowledge_adapter.get_knowledge_theme_summary
        ),
    )
