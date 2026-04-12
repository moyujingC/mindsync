import asyncio

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.report_contracts import ReportContractAssembler
from app.core.pipeline.structured_report_schema import get_structured_report_contract
from app.core.pipeline.store import InterpretationStore

from .test_pipeline_orchestrator import StubCircleDetector


def _create_orchestrator(tmp_path):
    image_path = tmp_path / "image.png"
    image_path.write_bytes(b"mock-image")
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(
        store=store,
        circle_detector=StubCircleDetector(),
        enable_vision=True,
    )
    return orchestrator, image_path


def test_report_contract_assembler_builds_lite_payload(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-lite",
            theme="wealth_career",
        )
    )

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=record,
        requested_version="lite",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )
    lite_contract = get_structured_report_contract("lite")

    assert payload["version"] == "lite"
    assert payload["title"] == "向前先稳住的人"
    assert tuple(payload["structured"].keys()) == lite_contract.field_names
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["structured"]["self_understanding_blocks"]["opening_hit"] == payload["overall_impression"]
    assert (
        payload["structured"]["self_understanding_blocks"]["visual_evidence"]["summary"]
        == payload["structured"]["visual_elements_rendered"]
    )
    assert payload["can_upgrade"] is True
    assert payload["upgrade_price"] == orchestrator.get_upgrade_diff()


def test_report_contract_assembler_builds_pro_payload(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-pro",
        )
    )
    orchestrator.upgrade_to_pro(record.interpretation_id)

    upgraded = orchestrator.store.load(record.interpretation_id)
    assert upgraded is not None

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=upgraded,
        requested_version="pro",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )
    pro_contract = get_structured_report_contract("pro")

    assert payload["version"] == "pro"
    assert tuple(payload["structured"].keys()) == pro_contract.field_names
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["can_upgrade"] is False
    assert payload["upgrade_price"] is None


def test_report_contract_assembler_keeps_lite_contract_after_pro_upgrade(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-lite-after-pro",
        )
    )
    orchestrator.upgrade_to_pro(record.interpretation_id)

    upgraded = orchestrator.store.load(record.interpretation_id)
    assert upgraded is not None

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=upgraded,
        requested_version="lite",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )

    assert payload["version"] == "lite"
    assert payload["structured"]["title"] == payload["title"]
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["can_upgrade"] is False
    assert payload["upgrade_price"] is None


def test_orchestrator_prefers_best_available_report_version(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-best-version",
        )
    )

    lite_payload = orchestrator.get_report(record.interpretation_id)
    assert lite_payload is not None
    assert lite_payload["version"] == "lite"

    orchestrator.upgrade_to_pro(record.interpretation_id)
    best_available_payload = orchestrator.get_report(record.interpretation_id)

    assert best_available_payload is not None
    assert best_available_payload["version"] == "pro"
    assert best_available_payload["structured"]["prompt_schema_validation_issues"] == []
    assert best_available_payload["can_upgrade"] is False


def test_report_contract_assembler_rejects_unsupported_version(tmp_path):
    orchestrator, image_path = _create_orchestrator(tmp_path)
    record = asyncio.run(
        orchestrator.generate_lite_placeholder(
            image_path=str(image_path),
            user_id="report-contract-invalid",
        )
    )

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=record,
        requested_version="unknown",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )

    assert payload == {
        "version": "unknown",
        "error": "unsupported version: unknown",
        "can_upgrade": False,
        "upgrade_price": None,
    }


def test_structured_report_contract_defines_required_fields():
    lite_contract = get_structured_report_contract("lite")
    pro_contract = get_structured_report_contract("pro")

    assert lite_contract.schema_version == "2026-04-12"
    assert lite_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "title",
        "overall_impression",
        "visual_elements_rendered",
        "emotion_portrait_rendered",
        "story",
        "theme_insights",
        "three_awareness",
        "self_understanding_blocks",
        "six_insights_rendered",
        "experiment_rendered",
        "pro_teaser",
    )
    assert pro_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "first_impression",
        "core_insight_table",
        "three_circles_detailed",
        "micro_analysis_detailed",
        "imbalance_confirmed",
        "root_cause",
        "healing_suggestions",
    )
