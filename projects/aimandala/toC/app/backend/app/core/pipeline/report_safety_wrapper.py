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
        safety_basis = self._build_stage_safety_basis(record)
        safety = self._safety_check(
            imbalance_type=safety_basis.get("imbalance_type"),
            color_analysis=safety_basis.get("color_analysis"),
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

    def _build_stage_safety_basis(self, record: InterpretationRecord) -> dict[str, Any]:
        package = getattr(record, "stage_process_package", None)
        payload = getattr(package, "payload", None)
        if not isinstance(payload, dict):
            return {"imbalance_type": None, "color_analysis": None}

        stage05 = payload.get("stage-05-per-circle-color-shape-element-sensing", {})
        stage07 = payload.get("stage-07-per-circle-imbalance-patterns", {})
        circle_results = (
            stage05.get("circle_results", [])
            if isinstance(stage05, dict)
            else []
        )
        candidates = (
            stage07.get("candidates", [])
            if isinstance(stage07, dict)
            else []
        )
        imbalance_type = None
        for item in candidates if isinstance(candidates, list) else []:
            if isinstance(item, str) and item.strip():
                imbalance_type = item.strip()
                break
            if isinstance(item, dict):
                value = str(item.get("id") or item.get("name") or "").strip()
                if value:
                    imbalance_type = value
                    break
        return {
            "imbalance_type": imbalance_type,
            "color_analysis": {
                "circle_results": circle_results if isinstance(circle_results, list) else [],
            },
        }
