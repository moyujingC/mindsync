"""Contracts for the first-round insight agent integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.core.pipeline.data_models import InterpretationRecord


@dataclass(frozen=True)
class InsightContext:
    """Normalized insight input assembled from one interpretation record."""

    interpretation_id: str
    user_id: str
    theme: str
    theme_label: str
    knowledge_signal: str | None
    signal_label: str | None
    image: dict[str, Any] = field(default_factory=dict)
    drawing_input: dict[str, Any] = field(default_factory=dict)
    layer0: dict[str, Any] = field(default_factory=dict)
    knowledge: dict[str, Any] = field(default_factory=dict)
    constraints: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "interpretation_id": self.interpretation_id,
            "user_id": self.user_id,
            "theme": self.theme,
            "theme_label": self.theme_label,
            "knowledge_signal": self.knowledge_signal,
            "signal_label": self.signal_label,
            "image": self.image,
            "drawing_input": self.drawing_input,
            "layer0": self.layer0,
            "knowledge": self.knowledge,
            "constraints": self.constraints,
        }


@dataclass(frozen=True)
class LiteReportResult:
    """Insight-agent wrapper around one Lite generation result."""

    record: InterpretationRecord
    context: InsightContext
    report_payload: dict[str, Any] | None


@dataclass(frozen=True)
class ProReportResult:
    """Insight-agent wrapper around one Pro generation result."""

    record: InterpretationRecord
    context: InsightContext
    status_payload: dict[str, Any] | None
    report_payload: dict[str, Any] | None


@dataclass(frozen=True)
class ReportAnswerResult:
    """Insight-agent wrapper around one report-grounded answer."""

    interpretation_id: str
    context: InsightContext
    reply: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "interpretation_id": self.interpretation_id,
            "reply": self.reply,
        }
