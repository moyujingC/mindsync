"""Pluggable generation runtime for migrated Lite/Pro report production."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Dict, Optional, Protocol

from .data_models import (
    InterpretationRecord,
    Layer0Raw,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
)
from .prompt_runtime import PromptRuntime

if TYPE_CHECKING:
    from .orchestrator_v2 import LayeredOrchestrator


@dataclass(frozen=True)
class LiteGenerationBundle:
    layer_0_raw: Layer0Raw
    layer_1_lite_draft: Layer1LiteDraft
    layer_2_lite_final: Layer2LiteFinal


@dataclass(frozen=True)
class ProGenerationBundle:
    layer_3_pro_draft: Layer3ProDraft
    layer_4_pro_final: Layer4ProFinal


class ReportGenerationRuntime(Protocol):
    """Runtime contract for generating migrated Lite/Pro layers."""

    def generate_lite(
        self,
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        ...

    def generate_pro(
        self,
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        ...


class DeterministicReportGenerationRuntime:
    """Current migration-time deterministic runtime.

    This preserves the existing placeholder behavior while exposing a clean
    replacement seam for future model-backed generation.
    """

    def generate_lite(
        self,
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        layer_0_raw = orchestrator._build_layer0_placeholder(record)
        record.layer_0_raw = layer_0_raw
        layer_1_lite_draft = orchestrator._build_layer1_placeholder(record)
        record.layer_1_lite_draft = layer_1_lite_draft
        layer_2_lite_final = orchestrator._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            layer_0_raw=layer_0_raw,
            layer_1_lite_draft=layer_1_lite_draft,
            layer_2_lite_final=layer_2_lite_final,
        )

    def generate_pro(
        self,
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        layer_3_pro_draft = orchestrator._build_pro_placeholder_draft(record)
        record.layer_3_pro_draft = layer_3_pro_draft
        layer_4_pro_final = orchestrator._build_pro_placeholder_report(record)
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
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        base = self.fallback_runtime.generate_lite(orchestrator, record)
        schema = orchestrator.prompt_builder.get_template("1.6", "lite").load_schema()
        payload = self.prompt_runtime.generate_lite(
            prompt=base.layer_1_lite_draft.prompt_preview,
            schema=schema,
        )
        if not isinstance(payload, dict):
            return base

        layer1 = base.layer_1_lite_draft
        self._apply_lite_payload(layer1, payload)
        record.layer_1_lite_draft = layer1
        layer2 = orchestrator._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            layer_0_raw=base.layer_0_raw,
            layer_1_lite_draft=layer1,
            layer_2_lite_final=layer2,
        )

    def generate_pro(
        self,
        orchestrator: LayeredOrchestrator,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        base = self.fallback_runtime.generate_pro(orchestrator, record)
        schema = orchestrator.prompt_builder.get_template("1.6", "pro").load_schema()
        payload = self.prompt_runtime.generate_pro(
            prompt=base.layer_3_pro_draft.prompt_preview,
            schema=schema,
        )
        if not isinstance(payload, dict):
            return base

        layer3 = base.layer_3_pro_draft
        self._apply_pro_payload(layer3, payload)
        record.layer_3_pro_draft = layer3
        layer4 = orchestrator._build_pro_placeholder_report(record)
        return ProGenerationBundle(
            layer_3_pro_draft=layer3,
            layer_4_pro_final=layer4,
        )

    def _apply_lite_payload(self, layer: Layer1LiteDraft, payload: Dict[str, Any]) -> None:
        layer.title = self._coerce_string(payload.get("title"), layer.title)
        layer.overall_impression = self._coerce_string(
            payload.get("overall_impression"),
            layer.overall_impression,
        )
        layer.visual_elements = self._coerce_string(payload.get("visual_elements"), layer.visual_elements)
        layer.emotion_portrait = self._coerce_string(
            payload.get("emotion_portrait"),
            layer.emotion_portrait,
        )
        layer.pro_teaser = self._coerce_string(payload.get("pro_teaser"), layer.pro_teaser)

        story = payload.get("story")
        if isinstance(story, dict):
            layer.story.base.content = self._coerce_string(story.get("base"), layer.story.base.content)
            layer.story.contradiction.content = self._coerce_string(
                story.get("contradiction"),
                layer.story.contradiction.content,
            )
            layer.story.pattern.content = self._coerce_string(story.get("pattern"), layer.story.pattern.content)
            layer.story.defense.content = self._coerce_string(story.get("defense"), layer.story.defense.content)
            layer.story.block.content = self._coerce_string(story.get("block"), layer.story.block.content)
            layer.story.light.content = self._coerce_string(story.get("light"), layer.story.light.content)

        layer.theme_insights.scene = self._coerce_string(
            payload.get("theme_scene"),
            layer.theme_insights.scene,
        )
        layer.theme_insights.impact = self._coerce_string(
            payload.get("theme_impact"),
            layer.theme_insights.impact,
        )
        layer.theme_insights.awareness = self._coerce_string(
            payload.get("theme_awareness"),
            layer.theme_insights.awareness,
        )

    def _apply_pro_payload(self, layer: Layer3ProDraft, payload: Dict[str, Any]) -> None:
        layer.first_impression = self._coerce_string(
            payload.get("first_impression"),
            layer.first_impression,
        )
        layer.core_insight_table = self._coerce_str_dict(
            payload.get("core_insight_table"),
            layer.core_insight_table,
        )
        layer.micro_analysis_detailed = self._coerce_str_dict(
            payload.get("micro_analysis_detailed"),
            layer.micro_analysis_detailed,
        )
        layer.root_cause = self._coerce_str_dict(
            payload.get("root_cause"),
            layer.root_cause,
        )
        if isinstance(payload.get("three_circles_detailed"), dict):
            layer.three_circles_detailed = payload["three_circles_detailed"]
        if isinstance(payload.get("imbalance_confirmed"), dict):
            layer.imbalance_confirmed = payload["imbalance_confirmed"]
        if isinstance(payload.get("healing_suggestions"), list):
            layer.healing_suggestions = payload["healing_suggestions"]

    def _coerce_string(self, value: Any, fallback: str) -> str:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return fallback

    def _coerce_str_dict(self, value: Any, fallback: Dict[str, str]) -> Dict[str, str]:
        if not isinstance(value, dict):
            return fallback
        result: Dict[str, str] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                continue
            if not isinstance(item, str):
                continue
            if not item.strip():
                continue
            result[key] = item.strip()
        return result or fallback
