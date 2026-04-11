"""Report access and upgrade lifecycle helpers for the migrated V2 pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import GenerationStatus, InterpretationRecord
from .report_generation_contracts import (
    ReportGenerationContext,
    ReportGenerationRuntime,
)
from .report_blueprints import PRO_REPORT_BLUEPRINT
from .report_contracts import ReportContractAssembler
from .store import InterpretationStore


class ReportLifecycleManager:
    """Handle report retrieval and Pro upgrade flow while keeping orchestrator thin."""

    def __init__(
        self,
        *,
        store: InterpretationStore,
        report_contracts: ReportContractAssembler,
        generation_runtime: ReportGenerationRuntime,
        get_upgrade_diff: Callable[[], float],
        processing_stage: str,
        completed_stage: str,
    ) -> None:
        self.store = store
        self.report_contracts = report_contracts
        self.generation_runtime = generation_runtime
        self._get_upgrade_diff = get_upgrade_diff
        self.processing_stage = processing_stage
        self.completed_stage = completed_stage

    def get_report(
        self,
        interpretation_id: str,
        *,
        version: str | None = None,
    ) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        requested_version = version or self._resolve_best_available_version(record)
        return self.report_contracts.build_report_payload(
            record=record,
            requested_version=requested_version,
            upgrade_diff=self._get_upgrade_diff(),
        )

    def get_status(self, interpretation_id: str) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        return {
            "interpretation_id": record.interpretation_id,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "report_ready": record.layer_2_lite_final is not None,
            "version_purchased": record.version_purchased,
            "three_circles": record.three_circles or {},
            "auto_detected": record.three_circles_auto_detect is not None,
            "can_upgrade": record.can_upgrade_to_pro(),
        }

    def upgrade_to_pro(
        self,
        generation_context: ReportGenerationContext,
        interpretation_id: str,
    ) -> dict[str, Any] | None:
        started = self.start_pro_upgrade(interpretation_id)
        if started is None:
            return None
        if started["status"] == "completed":
            return started
        return self.complete_pro_upgrade(generation_context, interpretation_id)

    def start_pro_upgrade(self, interpretation_id: str) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        if record.get_pro_report():
            return self._build_pro_response(
                interpretation_id=interpretation_id,
                status="completed",
                message=PRO_REPORT_BLUEPRINT.status_messages["already_available"],
            )

        if "pro" in record.version_purchased:
            upgraded = record
        else:
            upgraded = self.store.upgrade_to_pro(
                interpretation_id,
                price_diff=self._get_upgrade_diff(),
            )
            if upgraded is None:
                return None

        self._mark_processing(upgraded)
        return self._build_pro_response(
            interpretation_id=interpretation_id,
            status="processing",
            message="一梳 Pro 版正在生成中，请稍候查看。",
        )

    def complete_pro_upgrade(
        self,
        generation_context: ReportGenerationContext,
        interpretation_id: str,
    ) -> dict[str, Any] | None:
        record = self.store.load(interpretation_id)
        if record is None:
            return None

        if record.get_pro_report():
            return self._build_pro_response(
                interpretation_id=interpretation_id,
                status="completed",
                message=PRO_REPORT_BLUEPRINT.status_messages["already_available"],
            )

        if "pro" not in record.version_purchased:
            started = self.start_pro_upgrade(interpretation_id)
            if started is None:
                return None
            record = self.store.load(interpretation_id)
            if record is None:
                return None

        self._mark_processing(record)
        pro_bundle = self.generation_runtime.generate_pro(generation_context, record)
        record.layer_3_pro_draft = pro_bundle.layer_3_pro_draft
        record.layer_4_pro_final = pro_bundle.layer_4_pro_final
        self._mark_completed(record)

        return self._build_pro_response(
            interpretation_id=interpretation_id,
            status="completed",
            message=PRO_REPORT_BLUEPRINT.status_messages["generated_success"],
        )

    def _resolve_best_available_version(self, record: InterpretationRecord) -> str:
        if record.get_pro_report():
            return "pro"
        return "lite"

    def _mark_processing(self, record: InterpretationRecord) -> None:
        record.status = GenerationStatus.PROCESSING
        record.update_progress(self.processing_stage, 85)
        self.store.save(record)

    def _mark_completed(self, record: InterpretationRecord) -> None:
        record.status = GenerationStatus.COMPLETED
        record.update_progress(self.completed_stage, 100)
        self.store.save(record)

    def _build_pro_response(
        self,
        *,
        interpretation_id: str,
        status: str,
        message: str,
    ) -> dict[str, Any]:
        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": status,
            "message": message,
        }
