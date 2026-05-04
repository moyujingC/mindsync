"""Pipeline primitives for AI-Mandala To C V2 flow."""

from .orchestrator_v2 import GenerationStage, LayeredOrchestrator, PricingSnapshot
from .generation_runtime import (
    DeterministicReportGenerationRuntime,
    LLMReportGenerationRuntime,
)
from .report_generation_contracts import (
    LiteGenerationBundle,
    ProGenerationBundle,
    ReportGenerationContext,
    ReportGenerationRuntime,
)
from .report_contracts import PromptSchemaValidator, ReportContractAssembler
from .report_blueprints import (
    BLUEPRINT_VALIDATION_ISSUES,
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    LITE_AWARENESS_TITLES,
    PRO_REPORT_BLUEPRINT,
    PRO_IMBALANCE_LABELS,
    PRO_IMBALANCE_SELECTION_RULES,
    PRO_SECTION_TITLES,
)

__all__ = [
    "BLUEPRINT_VALIDATION_ISSUES",
    "DEFAULT_PRO_TEASER",
    "DeterministicReportGenerationRuntime",
    "GenerationStage",
    "LLMReportGenerationRuntime",
    "LITE_REPORT_BLUEPRINT",
    "LITE_AWARENESS_TITLES",
    "LiteGenerationBundle",
    "LayeredOrchestrator",
    "PricingSnapshot",
    "PRO_IMBALANCE_LABELS",
    "PRO_IMBALANCE_SELECTION_RULES",
    "PRO_REPORT_BLUEPRINT",
    "ProGenerationBundle",
    "PromptSchemaValidator",
    "ReportContractAssembler",
    "ReportGenerationContext",
    "ReportGenerationRuntime",
    "PRO_SECTION_TITLES",
]
