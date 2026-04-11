"""Pluggable generation runtime for migrated Lite/Pro report production."""

from __future__ import annotations

from typing import Any, Optional

from .data_models import (
    InterpretationRecord,
    Layer1LiteDraft,
    Layer3ProDraft,
)
from .prompt_runtime import PromptRuntime
from .report_generation_contracts import (
    LiteGenerationBundle,
    ProGenerationBundle,
    ReportGenerationContext,
    ReportGenerationRuntime,
)
from .report_generation_payload_applier import (
    apply_lite_generation_payload,
    apply_pro_generation_payload,
)


class DeterministicReportGenerationRuntime:
    """Current migration-time deterministic runtime.

    This preserves the existing placeholder behavior while exposing a clean
    replacement seam for future model-backed generation.
    """

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


class PromptBackedReportGenerationRuntime:
    """Runtime that tries prompt-runtime output before falling back deterministically."""

    def __init__(
        self,
        *,
        prompt_runtime: PromptRuntime,
        fallback_runtime: Optional[DeterministicReportGenerationRuntime] = None,
    ) -> None:
        self.prompt_runtime = prompt_runtime
        self.fallback_runtime = fallback_runtime or DeterministicReportGenerationRuntime()

    def generate_lite(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        base = self.fallback_runtime.generate_lite(generation_context, record)
        schema = generation_context.prompt_builder.get_template(
            "1.6",
            "lite",
        ).load_schema()
        payload = self.prompt_runtime.generate_lite(
            prompt=base.layer_1_lite_draft.prompt_preview,
            schema=schema,
        )
        if not isinstance(payload, dict):
            return base

        layer1 = base.layer_1_lite_draft
        apply_lite_generation_payload(layer1, payload)
        record.layer_1_lite_draft = layer1
        layer2 = generation_context._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            layer_0_raw=base.layer_0_raw,
            layer_1_lite_draft=layer1,
            layer_2_lite_final=layer2,
        )

    def generate_pro(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        base = self.fallback_runtime.generate_pro(generation_context, record)
        schema = generation_context.prompt_builder.get_template(
            "1.6",
            "pro",
        ).load_schema()
        payload = self.prompt_runtime.generate_pro(
            prompt=base.layer_3_pro_draft.prompt_preview,
            schema=schema,
        )
        if not isinstance(payload, dict):
            return base

        layer3 = base.layer_3_pro_draft
        apply_pro_generation_payload(layer3, payload)
        record.layer_3_pro_draft = layer3
        layer4 = generation_context._build_pro_placeholder_report(record)
        return ProGenerationBundle(
            layer_3_pro_draft=layer3,
            layer_4_pro_final=layer4,
        )

    def _apply_lite_payload(self, layer: Layer1LiteDraft, payload: dict[str, Any]) -> None:
        apply_lite_generation_payload(layer, payload)

    def _apply_pro_payload(self, layer: Layer3ProDraft, payload: dict[str, Any]) -> None:
        apply_pro_generation_payload(layer, payload)
