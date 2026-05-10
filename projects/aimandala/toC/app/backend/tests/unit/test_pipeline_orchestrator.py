"""Unit tests for the stage-based V2 orchestrator shell."""

import asyncio
import os
import sys
from types import SimpleNamespace

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.analysis.circle_detector import CircleDetectionResult
import pytest

from app.core.pipeline.data_models import InterpretationRecord, Layer1LiteDraft, StageProcessPackage
from app.core.pipeline.generation_runtime import DeterministicReportGenerationRuntime
from app.core.pipeline.orchestrator_v2 import GenerationStage, LayeredOrchestrator, PricingSnapshot
from app.core.pipeline.report_generation_contracts import StageProcessPackageBlockedError
from app.core.pipeline.store import InterpretationStore

MANUAL_THREE_CIRCLES = {"inner_radius": 35, "middle_radius": 67}


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


class FailingCircleDetector:
    async def detect_circles(self, **kwargs):
        raise AssertionError(f"unexpected detector call: {kwargs}")


def test_generation_stage_values():
    assert GenerationStage.PENDING == "pending"
    assert GenerationStage.DETECTING == "detecting"
    assert GenerationStage.GENERATING == "generating"
    assert GenerationStage.COMPLETED == "completed"
    assert GenerationStage.FAILED == "failed"


def test_pricing_snapshot_to_dict():
    snapshot = PricingSnapshot(lite=9.9, pro=39.0, upgrade_diff=39.1)
    assert snapshot.to_dict() == {"lite": 9.9, "pro": 39.0, "upgrade_diff": 39.1}


def test_layered_orchestrator_installs_stage_report_bindings(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.store is store
    assert orchestrator.enable_vision is False
    assert orchestrator._build_layer1_placeholder == orchestrator.report_draft_assembler.build_lite
    assert orchestrator._build_lite_placeholder_report == orchestrator.report_placeholder_assembler.build_lite
    assert orchestrator._build_pro_placeholder_draft == orchestrator.report_draft_assembler.build_pro
    assert orchestrator._build_pro_placeholder_report == orchestrator.report_placeholder_assembler.build_pro
    assert LayeredOrchestrator.get_supported_versions() == ("lite", "pro")


def test_prepare_lite_record_requires_manual_circles_and_skips_detector(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=FailingCircleDetector(),
        generation_runtime=DeterministicReportGenerationRuntime(),
        enable_vision=True,
    )

    try:
        asyncio.run(orchestrator.prepare_lite_record(image_path=str(image_path), user_id="user-2"))
    except ValueError as error:
        assert str(error) == "manual three-circle boundaries are required"
    else:
        raise AssertionError("missing manual three-circle boundaries should fail")

    assert store.get_user_records("user-2") == []


def test_generate_lite_placeholder_builds_stage_package(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        generation_runtime=DeterministicReportGenerationRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="stage-user",
            theme="wealth_career",
            three_circles=MANUAL_THREE_CIRCLES,
            check_existing=False,
        )
    )

    assert record.status == "failed"
    assert record.generation_stage == "failed"
    assert record.stage_process_package is not None
    payload = record.stage_process_package.payload
    assert payload["process_contract"]["generation_mode"] == "stage_based_runtime"
    assert payload["process_contract"]["package_status"] == "incomplete"
    assert payload["stage-01-user-input-context"]["theme"] == "wealth_career"
    assert payload["stage-02-circle-boundary-decision"]["inner_middle_radius"] == 35
    assert record.layer_1_lite_draft is None
    assert record.layer_2_lite_final is None


def test_get_report_returns_failed_payload_without_visual_evidence(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        generation_runtime=DeterministicReportGenerationRuntime(),
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-user",
            theme="general",
            three_circles=MANUAL_THREE_CIRCLES,
            check_existing=False,
        )
    )
    assert record.status == "failed"
    lite = orchestrator.get_report(record.interpretation_id, version="lite")
    assert lite["error"] == "lite report not generated yet"


def test_generation_runtime_uses_stage_process_package():
    runtime = DeterministicReportGenerationRuntime()
    context = SimpleNamespace(
        stage_package_assembler=SimpleNamespace(
            build=lambda record, target_report: StageProcessPackage(
                payload={
                    "process_contract": {
                        "target_report": target_report,
                        "package_status": "formal",
                    }
                }
            )
        ),
        _build_layer1_placeholder=lambda record: Layer1LiteDraft(prompt_preview="lite-prompt"),
        _build_lite_placeholder_report=lambda record: "layer2",
        _build_pro_placeholder_draft=lambda record: SimpleNamespace(prompt_preview="pro-prompt"),
        _build_pro_placeholder_report=lambda record: "layer4",
    )
    record = InterpretationRecord(version_purchased=["lite"])

    lite_bundle = runtime.generate_lite(context, record)

    assert lite_bundle.stage_process_package.payload["process_contract"]["target_report"] == "lite"
    assert record.stage_process_package is lite_bundle.stage_process_package
    assert lite_bundle.layer_1_lite_draft.prompt_preview == "lite-prompt"


def test_generation_runtime_blocks_placeholder_stage_package():
    runtime = DeterministicReportGenerationRuntime()
    context = SimpleNamespace(
        stage_package_assembler=SimpleNamespace(
            build=lambda record, target_report: StageProcessPackage(
                payload={
                    "process_contract": {
                        "target_report": target_report,
                        "package_status": "incomplete",
                    },
                    "stage-03-visual-evidence": {
                        "status": "pending_stage_runtime_replacement",
                    },
                }
            )
        ),
        _build_layer1_placeholder=lambda record: Layer1LiteDraft(prompt_preview="lite-prompt"),
        _build_lite_placeholder_report=lambda record: "layer2",
        _build_pro_placeholder_draft=lambda record: SimpleNamespace(prompt_preview="pro-prompt"),
        _build_pro_placeholder_report=lambda record: "layer4",
    )
    record = InterpretationRecord(version_purchased=["lite"])

    with pytest.raises(StageProcessPackageBlockedError, match="incomplete"):
        runtime.generate_lite(context, record)

    assert record.layer_1_lite_draft is None
    assert record.layer_2_lite_final is None
