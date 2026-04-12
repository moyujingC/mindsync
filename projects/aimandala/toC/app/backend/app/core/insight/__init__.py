"""Insight agent contracts and runtime facade for interpretation flows."""

from .agent import InsightAgent
from .contracts import (
    InsightContext,
    LiteReportResult,
    ProReportResult,
    ReportAnswerResult,
)

__all__ = [
    "InsightAgent",
    "InsightContext",
    "LiteReportResult",
    "ProReportResult",
    "ReportAnswerResult",
]
