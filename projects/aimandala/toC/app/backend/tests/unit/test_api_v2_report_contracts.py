"""Focused API contract regression tests for the knowledge runtime v2.1 flow."""

import os
import shutil
import sys
import time

from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


def _reset_api_state() -> None:
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
    routes_v2._knowledge_workbench = None
    routes_v2._miniapp_stub_store = None
    routes_v2._active_pro_upgrade_jobs.clear()
    shutil.rmtree(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
        ),
        ignore_errors=True,
    )


def _wait_for_pro_report(
    client: TestClient,
    interpretation_id: str,
    attempts: int = 20,
) -> dict:
    last_payload = None
    for _ in range(attempts):
        response = client.get(
            f"/api/v2/interpretations/{interpretation_id}/report",
            params={"version": "pro"},
        )
        assert response.status_code == 200
        last_payload = response.json()
        if last_payload.get("version") == "pro" and not last_payload.get("error"):
            return last_payload
        time.sleep(0.05)

    raise AssertionError(f"pro report did not become ready in time: {last_payload}")


def test_api_v2_report_lifecycle_contract(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "wealth-career-contract.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-contract-lifecycle",
            "image_path": str(image_path),
            "theme": "wealth_career",
            "painting_intention": "想看看自己最近为什么会对推进事情有迟疑。",
            "painting_feeling": "画的时候有点紧，但也有一点想往外走。",
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    interpretation_id = created["interpretation_id"]
    assert created == {
        "success": True,
        "interpretation_id": interpretation_id,
        "version": "lite",
        "status": "completed",
        "generation_stage": "completed",
        "generation_progress": 100,
        "three_circles": {"inner_radius": 33, "middle_radius": 66},
        "auto_detected": True,
        "existing": False,
        "report_ready": True,
    }

    record_response = client.get(f"/api/v2/interpretations/{interpretation_id}")
    assert record_response.status_code == 200
    record = record_response.json()
    assert record["interpretation_id"] == interpretation_id
    assert record["user_id"] == "user-contract-lifecycle"
    assert record["theme"] == "wealth_career"
    assert record["version_purchased"] == ["lite"]
    assert record["can_upgrade"] is True

    status_response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["interpretation_id"] == interpretation_id
    assert status_payload["report_ready"] is True
    assert status_payload["generation_stage"] == "completed"
    assert status_payload["generation_progress"] == 100

    lite_report_response = client.get(
        f"/api/v2/interpretations/{interpretation_id}/report",
        params={"version": "lite"},
    )
    assert lite_report_response.status_code == 200
    lite_report = lite_report_response.json()
    assert lite_report["interpretation_id"] == interpretation_id
    assert lite_report["version"] == "lite"
    assert lite_report["structured"]["prompt_schema_validation_issues"] == []
    assert lite_report["structured"]["topic_context"]["topic"] == "wealth_career"
    assert lite_report["structured"]["topic_context"]["topic_label"] == "财富事业"
    assert lite_report["structured"]["topic_context"]["report_mode"] == "lite"
    assert lite_report["structured"]["topic_context"]["orientation"]["key_terms"]
    assert lite_report["structured"]["current_reading"] == lite_report["overall_impression"]
    assert lite_report["structured"]["visual_basis"]
    assert lite_report["structured"]["pattern_interpretation"]
    assert lite_report["structured"]["life_connection"]
    assert lite_report["structured"]["lite_healing_guidance"]["directions"]
    assert lite_report["structured"]["pro_report_entry"]["title"] == "另一份更深的独立报告"
    assert "story" not in lite_report["structured"]
    assert "theme_insights" not in lite_report["structured"]
    assert "pro_teaser" not in lite_report["structured"]
    assert lite_report["can_upgrade"] is True
    assert lite_report["upgrade_price"] == 39.1
    assert lite_report["error"] is None

    debug_response = client.get(
        f"/api/v2/interpretations/{interpretation_id}/report-debug"
    )
    assert debug_response.status_code == 200
    debug_payload = debug_response.json()
    assert debug_payload["interpretation_id"] == interpretation_id
    assert debug_payload["theme"] == "wealth_career"
    assert debug_payload["layers"]["layer_0_raw"] is not None
    assert debug_payload["layers"]["layer_2_lite_final"] is not None
    assert debug_payload["field_provenance"]["lite"]
    assert debug_payload["diagnostics"]["summary"]["layer0_driven_count"] >= 1
    assert debug_payload["prompt_debug"]["lite"]["validation_issues"] == []
    assert debug_payload["insight_context_summary"]["theme"] == "wealth_career"
    assert debug_payload["insight_context_summary"]["constraints"]["scope"] == "single_interpretation"
    assert debug_payload["evidence_summary"]["agent"]["name"] == "InsightAgent"
    assert "knowledge_sources" in debug_payload["evidence_summary"]
    assert "used" in debug_payload["fallback_summary"]
    knowledge_debug = debug_payload["knowledge_debug"]
    assert knowledge_debug["build_info"]["build_selector"] == "current"
    assert knowledge_debug["algorithm_fidelity_trace"]["method_trace_keys"] == [
        "direct_judgment",
        "per_circle_color_analysis",
        "shape_analysis",
        "circle_relation_analysis",
        "final_algorithm_basis",
    ]
    assert knowledge_debug["algorithm_fidelity_trace"]["algorithm_fidelity_pass"] is True
    assert knowledge_debug["algorithm_fidelity_trace"]["legacy_semantics_found"] is False
    assert knowledge_debug["algorithm_fidelity_trace"]["raw_payload_leak_found"] is False
    assert knowledge_debug["layer0_evidence"]["visual_facts"]
    assert knowledge_debug["layer0_evidence"]["input_package"]
    assert knowledge_debug["layer0_evidence"]["visual_analysis_basis"]
    assert knowledge_debug["input_package"]
    assert knowledge_debug["layer0_evidence"]["knowledge_hits"]
    assert knowledge_debug["layer0_evidence"]["rule_evaluations"]
    assert knowledge_debug["layer0_evidence"]["fidelity_flags"] == knowledge_debug["layer0_evidence"]["quality_flags"]
    assert knowledge_debug["layer0_evidence"]["rule_evaluations"]["imbalance_trace"]["all_candidates"]
    assert knowledge_debug["layer0_evidence"]["rule_evaluations"]["interpretation_method_trace"]
    assert knowledge_debug["layer0_evidence"]["rule_evaluations"]["imbalance_trace"]["synthetic_signal"]["id"] == "transition-overload"
    assert knowledge_debug["layer0_evidence"]["theme_projection"]
    assert knowledge_debug["layer0_evidence"]["fallback_summary"] is not None
    assert knowledge_debug["query_results"]["theme"]["entity_id"] == "theme.wealth_career"
    assert knowledge_debug["query_results"]["healing"]["entity_id"]
    assert knowledge_debug["query_results"]["narrative"]["entity_id"] == "narrative.wealth_career"
    assert knowledge_debug["narrative_plans"]["lite"]["mode"] == "lite"
    assert "pro" in knowledge_debug["narrative_plans"]
    assert knowledge_debug["narrative_plans"]["lite"]["sections"]["pro_report_entry"]
    assert set(knowledge_debug["product_block_debug"]["lite"]) == {
        "current_reading",
        "visual_basis",
        "pattern_interpretation",
        "life_connection",
        "lite_healing_guidance",
        "pro_report_entry",
    }
    assert set(knowledge_debug["product_block_debug"]["pro"]) == {
        "deep_impression",
        "evidence_digest",
        "imbalance_diagnosis",
        "root_cause_chain",
        "deep_structure_interpretation",
        "healing_plan",
    }
    assert knowledge_debug["product_block_debug"]["lite"]["current_reading"]["final"]
    assert knowledge_debug["product_block_debug"]["lite"]["current_reading"]["evidence_trace"]
    assert knowledge_debug["product_block_debug"]["lite"]["pro_report_entry"]["prompt_trace"]
    assert knowledge_debug["product_block_debug"]["pro"]["healing_plan"]["quality_trace"]
    assert knowledge_debug["topic_context_trace"]["topic"] == "wealth_career"
    assert knowledge_debug["topic_context_trace"]["knowledge_route"] == "theme_only"
    assert "pro_teaser" in knowledge_debug["internal_compatibility"]["legacy_fields"]
    assert isinstance(knowledge_debug["source_refs"], list)
    assert "current_reading" in knowledge_debug["field_to_knowledge_map"]

    upgrade_response = client.post(f"/api/v2/interpretations/{interpretation_id}/upgrade")
    assert upgrade_response.status_code == 200
    upgrade_payload = upgrade_response.json()
    assert upgrade_payload["success"] is True
    assert upgrade_payload["interpretation_id"] == interpretation_id
    assert upgrade_payload["version"] == "pro"
    assert upgrade_payload["enabled"] is False
    assert upgrade_payload["status"] == "disabled"
    assert "独立购买" in upgrade_payload["message"]


def test_api_v2_report_chat_returns_llm_grounded_reply(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "general-chat-contract.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-contract-chat",
            "image_path": str(image_path),
            "theme": "general",
        },
    )
    assert create_response.status_code == 200
    interpretation_id = create_response.json()["interpretation_id"]

    order_response = client.post(
        "/api/v2/miniapp/orders",
        json={
            "interpretation_id": interpretation_id,
            "product_type": "pro",
            "channel": "miniapp",
        },
    )
    assert order_response.status_code == 200
    order_id = order_response.json()["order_id"]
    notify_response = client.post(
        "/api/v2/miniapp/payments/wechat/notify",
        json={
            "order_id": order_id,
            "event": "paid",
        },
    )
    assert notify_response.status_code == 200
    reconcile_response = client.post(f"/api/v2/miniapp/orders/{order_id}/reconcile")
    assert reconcile_response.status_code == 200
    _wait_for_pro_report(client, interpretation_id)

    chat_response = client.post(
        f"/api/v2/interpretations/{interpretation_id}/chat",
        json={
            "message": "我现在最需要留意什么？",
            "history": [{"role": "user", "content": "我最近有点乱。"}],
        },
    )
    assert chat_response.status_code == 200
    payload = chat_response.json()
    assert payload["interpretation_id"] == interpretation_id
    assert payload["reply"]


def test_api_v2_create_interpretation_returns_failed_record_when_layer0_blocks(tmp_path, monkeypatch):
    from app.api.main import app
    from app.api import routes_v2
    from app.core.pipeline.data_models import Layer0Raw
    from app.core.pipeline.orchestrator_v2 import GenerationStage

    _reset_api_state()

    class FailingLayer0Runtime:
        def generate_lite(self, generation_context, record):
            record.layer_0_raw = Layer0Raw(
                input_package={
                    "image": {"image_ref": "tmp/api-layer0-failed.png"},
                    "topic_input": {"topic": "general", "topic_label": "全面解读"},
                    "circle_config": {"inner_radius": 35, "middle_radius": 67, "source": "auto_detect"},
                },
                visual_analysis_basis={
                    "global_visual_summary": "",
                    "llm_color_observation": {"summary": "", "source": "layer0_failed"},
                    "program_color_measurement": {
                        "summary": "程序中间结果仍可查看。",
                        "source": "program_segmented_block_measurement",
                    },
                    "direct_judgment_hits": {
                        "catalog_version": "merged-manual6-runtime9.v1",
                        "catalog_items": [],
                        "hits": [],
                    },
                    "circles": {"inner": {}, "middle": {}, "outer": {}},
                    "prompt_meta": {
                        "source": "layer0_failed",
                        "failure_reason": "layer0_vision_unconfigured",
                        "vision_unavailable": True,
                    },
                },
                visual_facts={"program_color_measurement": {"source": "program_segmented_block_measurement"}},
                layer0_passed=False,
                layer0_failure_reason="layer0_vision_unconfigured",
                layer0_failure_detail={"stage": "vision"},
                fallback_summary={
                    "used": True,
                    "levels": ["layer0_failed"],
                    "warnings": ["layer0_vision_unconfigured"],
                },
            )
            raise RuntimeError("layer0_generation_failed_blocking:layer0_vision_unconfigured")

    orchestrator = routes_v2.get_orchestrator()
    failing_runtime = FailingLayer0Runtime()
    orchestrator.generation_runtime = failing_runtime
    orchestrator.report_lite_record_workflow.generation_runtime = failing_runtime
    orchestrator.report_lifecycle_manager.generation_runtime = failing_runtime
    monkeypatch.setattr(routes_v2, "_orchestrator", orchestrator)
    client = TestClient(app)
    image_path = tmp_path / "api-layer0-failed.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-layer0-api-failed",
            "image_path": str(image_path),
            "theme": "general",
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    interpretation_id = created["interpretation_id"]
    assert created["status"] == "failed"
    assert created["generation_stage"] == GenerationStage.FAILED.value
    assert created["report_ready"] is False

    status_response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["status"] == "failed"
    assert status_payload["generation_stage"] == "failed"
    assert status_payload["report_ready"] is False

    debug_response = client.get(f"/api/v2/interpretations/{interpretation_id}/report-debug")
    assert debug_response.status_code == 200
    debug_payload = debug_response.json()
    knowledge_debug = debug_payload["knowledge_debug"]
    assert knowledge_debug["layer0_evidence"]["input_package"]["image"]["image_ref"] == "tmp/api-layer0-failed.png"
    assert knowledge_debug["layer0_evidence"]["visual_analysis_basis"]["prompt_meta"]["source"] == "layer0_failed"
    assert knowledge_debug["layer0_evidence"]["layer0_passed"] is False
    assert knowledge_debug["layer0_evidence"]["layer0_failure_reason"] == "layer0_vision_unconfigured"
    assert knowledge_debug["model_trace"]["vision"]["source"] == "layer0_failed"


def test_api_v2_history_filters_mark_direct_pro_purchase_ready(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    general_image = tmp_path / "history-general.png"
    wealth_image = tmp_path / "history-wealth.png"
    relationship_image = tmp_path / "history-relationship.png"
    general_image.write_bytes(b"mock-general")
    wealth_image.write_bytes(b"mock-wealth")
    relationship_image.write_bytes(b"mock-relationship")

    general_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-contract-history",
            "image_path": str(general_image),
            "theme": "general",
        },
    )
    wealth_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-contract-history",
            "image_path": str(wealth_image),
            "theme": "wealth_career",
        },
    )
    relationship_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-contract-history",
            "image_path": str(relationship_image),
            "theme": "intimate_relationship",
        },
    )

    assert general_response.status_code == 200
    assert wealth_response.status_code == 200
    assert relationship_response.status_code == 200

    pending_interpretation_id = relationship_response.json()["interpretation_id"]
    order_response = client.post(
        "/api/v2/miniapp/orders",
        json={
            "interpretation_id": pending_interpretation_id,
            "product_type": "pro",
            "channel": "miniapp",
        },
    )
    assert order_response.status_code == 200
    order_id = order_response.json()["order_id"]
    assert client.post(
        "/api/v2/miniapp/payments/wechat/notify",
        json={
            "order_id": order_id,
            "event": "paid",
        },
    ).status_code == 200
    assert client.post(f"/api/v2/miniapp/orders/{order_id}/reconcile").status_code == 200

    all_response = client.get("/api/v2/users/user-contract-history/interpretations")
    ready_response = client.get(
        "/api/v2/users/user-contract-history/interpretations?filter=ready"
    )
    pending_response = client.get(
        "/api/v2/users/user-contract-history/interpretations?filter=pending"
    )

    assert all_response.status_code == 200
    assert ready_response.status_code == 200
    assert pending_response.status_code == 200

    all_payload = all_response.json()
    ready_payload = ready_response.json()
    pending_payload = pending_response.json()

    assert len(all_payload) == 3
    assert {item["theme"] for item in all_payload} == {
        "general",
        "wealth_career",
        "intimate_relationship",
    }
    assert {item["theme"] for item in ready_payload} == {
        "general",
        "wealth_career",
        "intimate_relationship",
    }
    ready_by_id = {
        item["interpretation_id"]: item
        for item in ready_payload
    }
    assert ready_by_id[pending_interpretation_id]["version_purchased"] == ["lite", "pro"]
    assert ready_by_id[pending_interpretation_id]["generation_stage"] == "completed"
    assert ready_by_id[pending_interpretation_id]["generation_progress"] == 100
    assert pending_payload == []
