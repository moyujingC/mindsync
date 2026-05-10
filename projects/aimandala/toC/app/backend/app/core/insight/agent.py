"""First-round insight agent facade for interpretation report flows."""

from __future__ import annotations

from typing import Any, Awaitable, Callable

from app.core.analysis.circle_detector import CircleDetectionResult
from app.core.pipeline.data_models import InterpretationRecord
from app.core.pipeline.report_generation_contracts import ReportGenerationContext

from .contracts import (
    InsightContext,
    LiteReportResult,
    ProReportResult,
    ReportAnswerResult,
)


class InsightAgent:
    """Wrap report generation, report access, and report QA behind one boundary."""

    def __init__(
        self,
        *,
        store: Any,
        report_lite_record_workflow: Any,
        report_lifecycle_manager: Any,
        report_interaction_support: Any,
        knowledge_debug_builder: Any | None,
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str | None],
        get_theme_label: Callable[[str | None], str],
        get_signal_label: Callable[[str], str],
        get_knowledge_theme_summary: Callable[[str | None], dict[str, Any]],
    ) -> None:
        self.store = store
        self.report_lite_record_workflow = report_lite_record_workflow
        self.report_lifecycle_manager = report_lifecycle_manager
        self.report_interaction_support = report_interaction_support
        self.knowledge_debug_builder = knowledge_debug_builder
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._get_theme_label = get_theme_label
        self._get_signal_label = get_signal_label
        self._get_knowledge_theme_summary = get_knowledge_theme_summary

    async def generate_lite_report(
        self,
        generation_context: ReportGenerationContext,
        *,
        detect_three_circles: Callable[..., Awaitable[CircleDetectionResult]],
        image_path: str,
        user_id: str,
        theme: str = "general",
        image_url: str | None = None,
        image_storage_backend: str | None = None,
        image_storage_key: str | None = None,
        image_local_expires_at: str | None = None,
        painting_intention: str | None = None,
        painting_feeling: str | None = None,
        three_circles: dict[str, int] | None = None,
        check_existing: bool = True,
    ) -> LiteReportResult:
        record = await self.report_lite_record_workflow.generate_placeholder(
            generation_context,
            detect_three_circles=detect_three_circles,
            image_path=image_path,
            user_id=user_id,
            theme=theme,
            image_url=image_url,
            image_storage_backend=image_storage_backend,
            image_storage_key=image_storage_key,
            image_local_expires_at=image_local_expires_at,
            painting_intention=painting_intention,
            painting_feeling=painting_feeling,
            three_circles=three_circles,
            check_existing=check_existing,
        )
        context = self.build_context(record)
        report_payload = self.report_lifecycle_manager.get_report(
            record.interpretation_id,
            version="lite",
        )
        return LiteReportResult(
            record=record,
            context=context,
            report_payload=report_payload,
        )

    def generate_pro_report(
        self,
        generation_context: ReportGenerationContext,
        interpretation_id: str,
    ) -> ProReportResult | None:
        status_payload = self.report_lifecycle_manager.complete_pro_upgrade(
            generation_context,
            interpretation_id,
        )
        if status_payload is None:
            return None

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        context = self.build_context(record)
        report_payload = self.report_lifecycle_manager.get_report(
            interpretation_id,
            version="pro",
        )
        return ProReportResult(
            record=record,
            context=context,
            status_payload=status_payload,
            report_payload=report_payload,
        )

    def get_report(
        self,
        interpretation_id: str,
        *,
        version: str | None = None,
    ) -> dict[str, Any] | None:
        return self.report_lifecycle_manager.get_report(
            interpretation_id,
            version=version,
        )

    def answer_report_question(
        self,
        interpretation_id: str,
        *,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> ReportAnswerResult | None:
        result = self.report_interaction_support.answer_report_chat(
            interpretation_id,
            message=message,
            history=history,
        )
        if result is None:
            return None

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        return ReportAnswerResult(
            interpretation_id=interpretation_id,
            context=self.build_context(record),
            reply=str(result.get("reply", "")).strip(),
        )

    def get_report_debug_profile(
        self,
        interpretation_id: str,
    ) -> dict[str, Any] | None:
        payload = self.report_interaction_support.get_report_debug_profile(
            interpretation_id,
        )
        if payload is None:
            return None

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        context = self.build_context(record)
        knowledge_debug = payload.get("knowledge_debug")
        payload["insight_context_summary"] = context.to_dict()
        payload["evidence_summary"] = self._build_evidence_summary(
            context=context,
            knowledge_debug=knowledge_debug,
        )
        payload["fallback_summary"] = self._build_fallback_summary(
            context=context,
            knowledge_debug=knowledge_debug,
        )
        return payload

    def build_context(self, record: InterpretationRecord) -> InsightContext:
        knowledge_signal = self._get_primary_knowledge_signal(record)
        signal_label = (
            self._get_signal_label(knowledge_signal)
            if knowledge_signal
            else None
        )
        stage_process = self._build_stage_process_view(record)
        build_info: dict[str, Any] = {}
        if self.knowledge_debug_builder is not None:
            knowledge_debug = self.knowledge_debug_builder.build(record)
            build_info = (
                knowledge_debug.get("build_info", {})
                if isinstance(knowledge_debug, dict)
                else {}
            )
        return InsightContext(
            interpretation_id=record.interpretation_id,
            user_id=record.user_id,
            theme=record.theme,
            theme_label=self._get_theme_label(record.theme),
            knowledge_signal=knowledge_signal,
            signal_label=signal_label,
            image={
                "image_url": record.image_url,
                "image_local_path": record.image_local_path,
                "storage_backend": record.image_storage_backend,
                "storage_key": record.image_storage_key,
                "image_local_expires_at": record.image_local_expires_at,
            },
            drawing_input={
                "painting_intention": record.painting_intention,
                "painting_feeling": record.painting_feeling,
                "three_circles": record.three_circles or {},
                "auto_detected": record.three_circles_auto_detect is not None,
                "auto_detect_summary": record.three_circles_auto_detect,
                "user_adjusted": record.three_circles_user_adjusted,
            },
            stage_process=stage_process,
            knowledge={
                "theme_summary": self._get_knowledge_theme_summary(record.theme),
                "build_info": build_info,
            },
            constraints={
                "scope": "single_interpretation",
                "chat_scope": "current_report_only",
                "medical_boundary": "non_clinical",
                "fallback_present": False,
            },
        )

    def _build_stage_process_view(self, record: InterpretationRecord) -> dict[str, Any]:
        package = getattr(record, "stage_process_package", None)
        payload = getattr(package, "payload", None)
        if not isinstance(payload, dict):
            return {
                "present": False,
                "stage_count": 0,
                "stages": {},
            }
        stage_keys = sorted(key for key in payload if str(key).startswith("stage-"))
        return {
            "present": True,
            "stage_count": len(stage_keys),
            "process_contract": payload.get("process_contract", {}),
            "stages": {
                key: self._summarize_stage(payload.get(key))
                for key in stage_keys
            },
            "primary_signal": self._get_primary_knowledge_signal(record),
        }

    def _summarize_stage(self, value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            return {"type": type(value).__name__}
        refs = value.get("knowledge_refs") or value.get("evidence_refs")
        summary = {
            "status": value.get("status", "done"),
            "keys": sorted(str(key) for key in value.keys())[:16],
        }
        if isinstance(refs, list):
            summary["ref_count"] = len(refs)
        return summary

    def _build_evidence_summary(
        self,
        *,
        context: InsightContext,
        knowledge_debug: Any,
    ) -> dict[str, Any]:
        knowledge_debug_record = (
            knowledge_debug if isinstance(knowledge_debug, dict) else {}
        )
        source_refs = knowledge_debug_record.get("source_refs", [])
        return {
            "agent": {
                "name": "InsightAgent",
                "version": "v1",
            },
            "theme": {
                "theme": context.theme,
                "theme_label": context.theme_label,
                "knowledge_signal": context.knowledge_signal,
                "signal_label": context.signal_label,
            },
            "knowledge_sources": {
                "build_info": context.knowledge.get("build_info", {}),
                "source_ref_count": len(source_refs) if isinstance(source_refs, list) else 0,
                "field_mapping_count": len(
                    knowledge_debug_record.get("field_to_knowledge_map", {})
                )
                if isinstance(knowledge_debug_record.get("field_to_knowledge_map"), dict)
                else 0,
            },
            "stage_process": {
                "present": bool(context.stage_process.get("present")),
                "stage_count": context.stage_process.get("stage_count", 0),
                "stage_keys": sorted(
                    (context.stage_process.get("stages", {}) or {}).keys()
                ),
                "primary_signal": context.stage_process.get("primary_signal"),
            },
        }

    def _build_fallback_summary(
        self,
        *,
        context: InsightContext,
        knowledge_debug: Any,
    ) -> dict[str, Any]:
        knowledge_debug_record = (
            knowledge_debug if isinstance(knowledge_debug, dict) else {}
        )
        fallback_analysis = knowledge_debug_record.get("fallback_analysis", {})
        if not isinstance(fallback_analysis, dict):
            fallback_analysis = {}
        levels: list[Any] = []
        for item in fallback_analysis.get("levels", []) or []:
            if item not in levels:
                levels.append(item)
        warnings: list[Any] = []
        for item in fallback_analysis.get("warnings", []) or []:
            if item not in warnings:
                warnings.append(item)
        return {
            "used": bool(fallback_analysis.get("used")),
            "levels": levels,
            "warnings": warnings,
            "query_fallbacks": fallback_analysis.get("query_fallbacks", []),
        }
