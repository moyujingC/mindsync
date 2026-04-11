"""Interactive report helpers for debug and follow-up chat flows."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord
from .report_debug_profile import ReportDebugProfileBuilder
from .store import InterpretationStore


class ReportInteractionSupport:
    """Handle debug profile and report chat access outside the orchestrator shell."""

    def __init__(
        self,
        *,
        store: InterpretationStore,
        report_debug_builder: ReportDebugProfileBuilder,
        knowledge_debug_builder: Any | None,
        get_report_chat_runtime: Callable[[], Any],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str | None],
        get_theme_label: Callable[[str | None], str],
        get_signal_label: Callable[[str], str],
        get_knowledge_theme_summary: Callable[[str | None], dict[str, Any]],
    ) -> None:
        self.store = store
        self.report_debug_builder = report_debug_builder
        self.knowledge_debug_builder = knowledge_debug_builder
        self._get_report_chat_runtime = get_report_chat_runtime
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._get_theme_label = get_theme_label
        self._get_signal_label = get_signal_label
        self._get_knowledge_theme_summary = get_knowledge_theme_summary

    def answer_report_chat(
        self,
        interpretation_id: str,
        *,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        report_chat_runtime = self._get_report_chat_runtime()
        if report_chat_runtime is None:
            raise ValueError("report chat runtime is not configured")

        report_markdown = record.get_pro_report() or record.get_lite_report()
        if not report_markdown:
            raise ValueError("report is not ready")

        reply = report_chat_runtime.reply(
            report_markdown=report_markdown,
            ai_qa_context=record.get_ai_qa_context(),
            theme=record.theme,
            painting_intention=record.painting_intention,
            painting_feeling=record.painting_feeling,
            message=message,
            history=history,
        )
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("report chat runtime returned empty reply")

        return {
            "interpretation_id": interpretation_id,
            "reply": reply.strip(),
        }

    def get_report_debug_profile(
        self,
        interpretation_id: str,
    ) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        knowledge_signal = self._get_primary_knowledge_signal(record)
        payload = self.report_debug_builder.build(
            record=record,
            theme_label=self._get_theme_label(record.theme),
            signal_label=(
                self._get_signal_label(knowledge_signal)
                if knowledge_signal
                else None
            ),
            theme_summary=self._get_knowledge_theme_summary(record.theme),
        )
        if self.knowledge_debug_builder is not None:
            payload["knowledge_debug"] = self.knowledge_debug_builder.build(record)
        return payload
