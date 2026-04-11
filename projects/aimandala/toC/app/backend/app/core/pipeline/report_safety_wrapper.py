"""Safety wrapper helpers for Lite and Pro report assembly."""

from __future__ import annotations

from typing import Any, Callable

from app.core.safety.protocol import SafetyProtocol, quick_safety_check

from .data_models import InterpretationRecord


class ReportSafetyWrapper:
    """Apply and strip safety disclaimers outside the orchestrator shell."""

    def __init__(
        self,
        *,
        safety_protocol_factory: Callable[[], SafetyProtocol] = SafetyProtocol,
        safety_check: Callable[..., Any] = quick_safety_check,
    ) -> None:
        self._safety_protocol_factory = safety_protocol_factory
        self._safety_check = safety_check

    def strip_wrappers(self, content: str) -> str:
        cleaned = content
        protocol = self._safety_protocol_factory()
        for disclaimer_type in ["basic", "with_crisis_hotline", "high_risk"]:
            disclaimer = protocol.get_disclaimer(disclaimer_type).strip()
            cleaned = cleaned.replace(disclaimer, "").strip()
        return cleaned

    def wrap_report(self, record: InterpretationRecord, content: str) -> str:
        safety = self._safety_check(
            imbalance_type=(
                record.layer_0_raw.imbalance_candidates[0]
                if record.layer_0_raw and record.layer_0_raw.imbalance_candidates
                else None
            ),
            color_analysis=record.layer_0_raw.color_analysis if record.layer_0_raw else None,
            text_content=" ".join(
                part
                for part in [
                    record.painting_intention or "",
                    record.painting_feeling or "",
                    content,
                ]
                if part
            ),
        )
        return self._safety_protocol_factory().wrap_output(
            content,
            safety.risk_level,
            context="toc",
        )
