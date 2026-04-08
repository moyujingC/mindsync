import asyncio

from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.report_contracts import ReportContractAssembler
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
            theme="career",
        )
    )

    assembler = ReportContractAssembler(orchestrator.prompt_builder)
    payload = assembler.build_report_payload(
        record=record,
        requested_version="lite",
        upgrade_diff=orchestrator.get_upgrade_diff(),
    )

    assert payload["version"] == "lite"
    assert payload["title"] == "向前先稳住的人"
    assert payload["structured"]["prompt_schema_validation_issues"] == []
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

    assert payload["version"] == "pro"
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["can_upgrade"] is False
    assert payload["upgrade_price"] is None


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
