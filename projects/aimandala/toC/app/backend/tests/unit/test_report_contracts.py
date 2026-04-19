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
    assert payload["structured"]["topic_context"] == {
        "topic": "wealth_career",
        "topic_label": "财富事业",
        "report_mode": "lite",
        "orientation": {
            "intro": "这份报告会从财富事业这个议题角度看这张画。",
            "focus": "这个议题通常关注你如何使用行动力、价值感、资源感和目标节奏。",
            "key_terms": [
                {
                    "term": "价值感",
                    "explanation": "你是否觉得自己的付出、能力和选择值得被看见。",
                },
                {
                    "term": "行动节奏",
                    "explanation": "你在推进目标时，是更容易稳定前进，还是在压力下收缩或过度用力。",
                },
            ],
        },
    }
    assert payload["structured"]["current_reading"] == payload["overall_impression"]
    assert payload["structured"]["visual_basis"]
    assert payload["structured"]["pattern_interpretation"]
    assert payload["structured"]["life_connection"]
    assert payload["structured"]["lite_healing_guidance"]["directions"]
    assert payload["structured"]["lite_healing_guidance"]["micro_practices"]
    assert payload["structured"]["pro_report_entry"]["title"] == "另一份更深的独立报告"
    assert "独立购买" in payload["structured"]["pro_report_entry"]["product_note"]
    assert "pro_teaser" not in payload["structured"]
    assert "story" not in payload["structured"]
    assert "theme_insights" not in payload["structured"]
    assert "self_understanding_blocks" not in payload["structured"]
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
    assert payload["structured"]["topic_context"]["topic"] == "general"
    assert payload["structured"]["topic_context"]["topic_label"] == "全面解读"
    assert payload["structured"]["topic_context"]["report_mode"] == "pro"
    assert payload["structured"]["deep_impression"]
    assert payload["structured"]["evidence_digest"]
    assert payload["structured"]["imbalance_diagnosis"]
    assert payload["structured"]["root_cause_chain"]
    assert payload["structured"]["deep_structure_interpretation"]
    assert payload["structured"]["healing_plan"]
    assert "first_impression" not in payload["structured"]
    assert "core_insight_table" not in payload["structured"]
    assert "root_cause" not in payload["structured"]
    assert "healing_suggestions" not in payload["structured"]
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
    assert payload["structured"]["current_reading"] == payload["overall_impression"]
    assert payload["structured"]["prompt_schema_validation_issues"] == []
    assert payload["structured"]["pro_report_entry"]["summary"]
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

    assert lite_contract.schema_version == "2026-04-18"
    assert lite_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "topic_context",
        "current_reading",
        "visual_basis",
        "pattern_interpretation",
        "life_connection",
        "lite_healing_guidance",
        "pro_report_entry",
    )
    assert pro_contract.required_field_names == (
        "prompt_schema_validation_issues",
        "topic_context",
        "deep_impression",
        "evidence_digest",
        "imbalance_diagnosis",
        "root_cause_chain",
        "deep_structure_interpretation",
        "healing_plan",
    )
