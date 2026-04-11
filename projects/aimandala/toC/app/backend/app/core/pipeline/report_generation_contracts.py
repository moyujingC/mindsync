"""Shared contracts for migrated V2 report generation runtimes."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from .data_models import (
    InterpretationRecord,
    Layer0Raw,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
)


@dataclass(frozen=True)
class LiteGenerationBundle:
    layer_0_raw: Layer0Raw
    layer_1_lite_draft: Layer1LiteDraft
    layer_2_lite_final: Layer2LiteFinal


@dataclass(frozen=True)
class ProGenerationBundle:
    layer_3_pro_draft: Layer3ProDraft
    layer_4_pro_final: Layer4ProFinal


class ReportGenerationContext(Protocol):
    """Minimal collaborator surface required by report generation runtimes."""

    prompt_builder: Any

    def _build_layer0_placeholder(self, record: InterpretationRecord) -> Layer0Raw:
        ...

    def _build_layer1_placeholder(
        self,
        record: InterpretationRecord,
    ) -> Layer1LiteDraft:
        ...

    def _build_lite_placeholder_report(
        self,
        record: InterpretationRecord,
    ) -> Layer2LiteFinal:
        ...

    def _build_pro_placeholder_draft(
        self,
        record: InterpretationRecord,
    ) -> Layer3ProDraft:
        ...

    def _build_pro_placeholder_report(
        self,
        record: InterpretationRecord,
    ) -> Layer4ProFinal:
        ...


class ReportGenerationRuntime(Protocol):
    """Runtime contract for generating migrated Lite/Pro layers."""

    def generate_lite(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        ...

    def generate_pro(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        ...
