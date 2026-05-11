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


class FakeVisionClient:
    def __init__(self):
        self.last_attempt_trace = [{"model": "fake-vision", "result": "response"}]
        self.last_error_detail = {}

    def generate_structured(self, **kwargs):
        if "第04步" in kwargs["prompt"] or "直断命中" in kwargs["prompt"]:
            return {
                "stage": "stage-04-direct-judgment-high-hit-check",
                "hits": [
                    {
                        "mode": "外圈红色多",
                        "hit_strength": "full_hit",
                        "vision_hit": True,
                        "program_hit": True,
                        "cross_validation": "consistent",
                        "visual_unit_refs": ["outer-001"],
                        "visible_evidence": ["外圈存在成片红色。"],
                        "knowledge_refs": ["direct_judgment.outer_red_mass"],
                        "reasoning": "视觉与程序都确认外圈红色成片。",
                    }
                ],
                "non_hits": [],
                "uncertain_items": [],
                "conflicts": [],
                "summary": "命中外圈红色多。",
            }
        return {
            "stage": "stage-03-visual-evidence",
            "global_summary": "内圈红色集中，中圈绿色放射，外圈红色包裹。",
            "circles": {
                "inner": {
                    "summary": "内圈中心有红色圆形。",
                    "visual_units": [
                        {
                            "id": "inner-001",
                            "position": "中心",
                            "color": {"main": "红色", "depth": "深", "saturation": "高"},
                            "shape": {"type": "圆形", "arrangement": "集中"},
                            "area_ratio": "0.30",
                            "visible_evidence": "内圈中心有红色圆形填色。",
                        }
                    ],
                },
                "middle": {
                    "summary": "中圈绿色条状向外放射。",
                    "visual_units": [
                        {
                            "id": "middle-001",
                            "position": "中圈",
                            "color": {"main": "绿色", "depth": "中", "saturation": "中"},
                            "shape": {"type": "条状", "arrangement": "放射"},
                            "area_ratio": "0.30",
                            "visible_evidence": "中圈绿色条状向外放射。",
                        }
                    ],
                },
                "outer": {
                    "summary": "外圈存在成片红色。",
                    "visual_units": [
                        {
                            "id": "outer-001",
                            "position": "外圈",
                            "color": {"main": "红色", "depth": "深", "saturation": "高"},
                            "shape": {"type": "块状", "arrangement": "成片"},
                            "area_ratio": "0.46",
                            "visible_evidence": "外圈存在成片红色。",
                        }
                    ],
                },
            },
            "evidence_summary": ["外圈存在成片红色。"],
            "uncertainties": [],
        }

    def generate_text(self, **kwargs):
        return None


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


def test_generate_lite_placeholder_with_fake_vision_builds_formal_stage_package(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    runtime = DeterministicReportGenerationRuntime()
    runtime.llm_client = FakeVisionClient()
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        generation_runtime=runtime,
        enable_vision=True,
    )

    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="stage-user-formal",
            theme="wealth_career",
            three_circles=MANUAL_THREE_CIRCLES,
            check_existing=False,
        )
    )

    payload = record.stage_process_package.payload
    assert record.status == "completed"
    assert payload["process_contract"]["package_status"] == "formal"
    assert payload["stage-03-visual-evidence"]["status"] == "complete"
    assert payload["stage-04-direct-judgment-high-hit-check"]["status"] == "complete"
    assert "direct_judgment.outer_red_mass" in payload["stage-04-direct-judgment-high-hit-check"]["knowledge_refs"]
    assert record.layer_2_lite_final is not None


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


def test_generation_runtime_blocks_forbidden_stage_process_package_input():
    runtime = DeterministicReportGenerationRuntime()
    context = SimpleNamespace(
        stage_package_assembler=SimpleNamespace(
            build=lambda record, target_report: StageProcessPackage(
                payload={
                    "process_contract": {
                        "target_report": target_report,
                        "package_status": "formal",
                    },
                    "stage-12-healing-direction-and-report-branching": {
                        "debug_payload": {
                            "source": "old_report_skeleton",
                        },
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

    with pytest.raises(StageProcessPackageBlockedError, match="incomplete_stage_process_package"):
        runtime.generate_lite(context, record)

    assert record.layer_1_lite_draft is None
    assert record.layer_2_lite_final is None
