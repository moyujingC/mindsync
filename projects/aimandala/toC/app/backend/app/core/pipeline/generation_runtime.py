"""Knowledge-first generation runtime for migrated Lite/Pro report production."""

from __future__ import annotations

from .data_models import (
    InterpretationRecord,
)
from .report_generation_contracts import (
    LiteGenerationBundle,
    ProGenerationBundle,
    ReportGenerationContext,
)


class DeterministicReportGenerationRuntime:
    """Knowledge-first runtime for Lite/Pro generation."""

    def generate_lite(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        layer_0_raw = generation_context._build_layer0_placeholder(record)
        record.layer_0_raw = layer_0_raw
        layer_1_lite_draft = generation_context._build_layer1_placeholder(record)
        record.layer_1_lite_draft = layer_1_lite_draft
        layer_2_lite_final = generation_context._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            layer_0_raw=layer_0_raw,
            layer_1_lite_draft=layer_1_lite_draft,
            layer_2_lite_final=layer_2_lite_final,
        )

    def generate_pro(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        layer_3_pro_draft = generation_context._build_pro_placeholder_draft(record)
        record.layer_3_pro_draft = layer_3_pro_draft
        layer_4_pro_final = generation_context._build_pro_placeholder_report(record)
        return ProGenerationBundle(
            layer_3_pro_draft=layer_3_pro_draft,
            layer_4_pro_final=layer_4_pro_final,
        )
