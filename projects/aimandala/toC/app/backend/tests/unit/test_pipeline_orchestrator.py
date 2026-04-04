"""Unit tests for the minimal migrated V2 orchestrator shell."""

import asyncio
import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.analysis.circle_detector import CircleDetectionResult
from app.core.pipeline.data_models import GenerationStatus
from app.core.pipeline.orchestrator_v2 import (
    GenerationStage,
    LayeredOrchestrator,
    PricingSnapshot,
)
from app.core.pipeline.store import InterpretationStore


class StubCircleDetector:
    async def detect_circles(
        self,
        image_path: str,
        use_ai: bool = True,
        use_opencv: bool = True,
        confidence_threshold: float = 0.3,
    ):
        return CircleDetectionResult(
            inner_radius=0.35,
            middle_radius=0.67,
            confidence=0.8,
            method="stub",
        )


def test_generation_stage_values():
    assert GenerationStage.PENDING == "pending"
    assert GenerationStage.DETECTING == "detecting"
    assert GenerationStage.ANALYZING == "analyzing"
    assert GenerationStage.GENERATING == "generating"
    assert GenerationStage.FINALIZING == "finalizing"
    assert GenerationStage.COMPLETED == "completed"
    assert GenerationStage.FAILED == "failed"


def test_pricing_snapshot_to_dict():
    snapshot = PricingSnapshot(lite=9.9, pro=49.0, upgrade_diff=39.1)

    assert snapshot.to_dict() == {
        "lite": 9.9,
        "pro": 49.0,
        "upgrade_diff": 39.1,
    }


def test_layered_orchestrator_exposes_fixed_pricing(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.store is store
    assert orchestrator.enable_vision is False
    assert LayeredOrchestrator.get_supported_versions() == ("lite", "pro")
    assert LayeredOrchestrator.get_upgrade_diff() == 39.1

    pricing = LayeredOrchestrator.get_pricing()
    assert pricing.lite == 9.9
    assert pricing.pro == 49.0
    assert pricing.upgrade_diff == 39.1


def test_normalize_circle_payload():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    payload = orchestrator._normalize_circle_payload(
        {"inner_radius": 8, "middle_radius": 11}
    )

    assert payload == {
        "inner_radius": 10,
        "middle_radius": 15,
    }


def test_hash_image_missing_file():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    image_hash = orchestrator._hash_image("/tmp/aimandala-no-file.png")

    assert image_hash == "missing:aimandala-no-file.png"


def test_prepare_lite_record_with_manual_circles(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-1",
            three_circles={"inner_radius": 40, "middle_radius": 72},
        )
    )

    assert record.three_circles == {"inner_radius": 40, "middle_radius": 72}
    assert record.three_circles_user_adjusted is True
    assert record.generation_stage == "detecting"
    assert record.generation_progress == 10


def test_prepare_lite_record_uses_detector_when_missing_manual_input(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-2",
        )
    )

    assert record.three_circles == {"inner_radius": 35, "middle_radius": 67}
    assert record.three_circles_auto_detect["method"] == "stub"
    assert record.three_circles_user_adjusted is False


def test_get_report_returns_lite_placeholder_when_not_generated(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.prepare_lite_record(
            image_path=str(image_path),
            user_id="user-3",
        )
    )

    report = orchestrator.get_report(record.interpretation_id)

    assert report is not None
    assert report["version"] == "lite"
    assert report["error"] == "lite report not generated yet"


def test_get_report_returns_none_for_missing_record(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.get_report("missing-record-id") is None


def test_generate_lite_placeholder_creates_report(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-4",
            theme="career",
        )
    )

    assert record.status == GenerationStatus.COMPLETED
    assert record.generation_stage == "completed"
    assert record.generation_progress == 100
    assert "lite" in record.version_purchased
    assert record.layer_2_lite_final is not None
    assert "迁移期的最小 Lite 闭环" in record.layer_2_lite_final.full_report_markdown


def test_get_report_returns_lite_report_after_placeholder_generation(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-5",
        )
    )

    report = orchestrator.get_report(record.interpretation_id)

    assert report is not None
    assert report["version"] == "lite"
    assert report["report"] is not None
    assert report["title"] == "一镜 Lite 版占位报告"
    assert report["structured"]["pro_teaser"] == "后续将接入正式的一梳 Pro 版生成链路。"
    assert report["can_upgrade"] is False


def test_get_status_returns_compact_snapshot(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-6",
        )
    )

    status = orchestrator.get_status(record.interpretation_id)

    assert status is not None
    assert status["interpretation_id"] == record.interpretation_id
    assert status["generation_stage"] == "completed"
    assert status["generation_progress"] == 100
    assert status["report_ready"] is True


def test_get_upgrade_placeholder_returns_compatibility_message(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="user-7",
        )
    )

    result = orchestrator.get_upgrade_placeholder(record.interpretation_id)

    assert result is not None
    assert result["success"] is False
    assert result["enabled"] is False
    assert result["status"] == "not_enabled"
