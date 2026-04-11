"""Lite record preparation and placeholder generation helpers."""

from __future__ import annotations

from hashlib import sha256
from pathlib import Path
from typing import Awaitable, Callable

from app.core.analysis.circle_detector import CircleDetectionResult

from .data_models import GenerationStatus, InterpretationRecord
from .generation_runtime import ReportGenerationContext, ReportGenerationRuntime
from .store import InterpretationStore


class ReportLiteRecordWorkflow:
    """Manage Lite record creation and placeholder generation outside orchestrator."""

    def __init__(
        self,
        *,
        store: InterpretationStore,
        generation_runtime: ReportGenerationRuntime,
        detecting_stage: str,
        generating_stage: str,
        completed_stage: str,
    ) -> None:
        self.store = store
        self.generation_runtime = generation_runtime
        self.detecting_stage = detecting_stage
        self.generating_stage = generating_stage
        self.completed_stage = completed_stage

    async def prepare_record(
        self,
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
    ) -> InterpretationRecord:
        image_hash = self.hash_image(image_path)
        record = self.store.create_record(
            user_id=user_id,
            image_hash=image_hash,
            theme=theme,
        )
        record.image_url = image_url
        record.image_storage_backend = image_storage_backend
        record.image_storage_key = image_storage_key
        record.image_local_path = image_path
        record.image_local_expires_at = image_local_expires_at
        record.painting_intention = painting_intention
        record.painting_feeling = painting_feeling
        record.status = GenerationStatus.PROCESSING

        if three_circles:
            normalized = self.normalize_circle_payload(three_circles)
            record.three_circles = normalized
            record.three_circles_user_adjusted = True
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "manual",
                }
            )
        else:
            detection = await detect_three_circles(image_path=image_path)
            normalized = self.normalize_circle_payload(
                {
                    "inner_radius": int(round(detection.inner_radius * 100)),
                    "middle_radius": int(round(detection.middle_radius * 100)),
                }
            )
            record.three_circles = normalized
            record.three_circles_auto_detect = {
                "inner_radius": detection.inner_radius,
                "middle_radius": detection.middle_radius,
                "confidence": detection.confidence,
                "method": detection.method,
            }
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "auto",
                }
            )

        record.update_progress(self.detecting_stage, 10)
        self.store.save(record)
        return record

    async def generate_placeholder(
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
    ) -> InterpretationRecord:
        image_hash = self.hash_image(image_path)
        if check_existing:
            existing = self.store.find_existing_record(
                image_hash=image_hash,
                user_id=user_id,
                theme=theme,
            )
            if existing is not None:
                return existing

        record = await self.prepare_record(
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
        )

        record.update_progress(self.generating_stage, 70)
        lite_bundle = self.generation_runtime.generate_lite(generation_context, record)
        record.layer_0_raw = lite_bundle.layer_0_raw
        record.layer_1_lite_draft = lite_bundle.layer_1_lite_draft
        record.layer_2_lite_final = lite_bundle.layer_2_lite_final

        if "lite" not in record.version_purchased:
            record.version_purchased.append("lite")

        record.status = GenerationStatus.COMPLETED
        record.update_progress(self.completed_stage, 100)
        self.store.save(record)
        return record

    def hash_image(self, image_path: str) -> str:
        path = Path(image_path)
        if not path.exists():
            return f"missing:{path.name}"
        return sha256(path.read_bytes()).hexdigest()[:16]

    def normalize_circle_payload(self, circle_payload: dict[str, int]) -> dict[str, int]:
        inner = int(circle_payload.get("inner_radius", 33))
        middle = int(circle_payload.get("middle_radius", 66))
        inner = max(10, min(inner, 90))
        middle = max(inner + 5, min(middle, 90))
        return {
            "inner_radius": inner,
            "middle_radius": middle,
        }
