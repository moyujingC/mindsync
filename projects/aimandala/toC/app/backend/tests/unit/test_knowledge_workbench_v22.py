"""Tests for the v2.2 local knowledge workbench and debug endpoints."""

import asyncio
import json
import os
import shutil
import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.knowledge_runtime.repository import resolve_build_dir
from app.core.knowledge_runtime.workbench import KnowledgeWorkbench


def _reset_api_state() -> None:
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
    routes_v2._knowledge_workbench = None
    routes_v2._active_pro_upgrade_jobs.clear()


def _force_workbench_noop_llm(monkeypatch) -> None:
    """Lock fixture/workbench exports to the deterministic local review baseline."""
    from app.core.knowledge_runtime import workbench as workbench_module
    from app.core.llm.runtime import NoopLLMClient

    monkeypatch.setattr(
        workbench_module,
        "create_llm_client_from_env",
        lambda: NoopLLMClient(),
    )


def test_v22_workbench_builds_candidate_and_diff(monkeypatch):
    _force_workbench_noop_llm(monkeypatch)
    workbench = KnowledgeWorkbench()
    build_id = "pytest-v22"
    build_selector = f"candidate:{build_id}"
    build_dir = resolve_build_dir(build_selector)
    shutil.rmtree(build_dir, ignore_errors=True)
    original_load_build_summary = workbench.load_build_summary

    async def fake_run_evals(*, build_selector: str, fixture_ids=None):
        eval_dir = resolve_build_dir(build_selector) / "evals"
        eval_dir.mkdir(parents=True, exist_ok=True)
        summary = {
            "build_selector": build_selector,
            "summary": {
                "fixture_count": len(fixture_ids or ["toc-mvp-fixture-001"]),
                "fixture_fallback_count": 0,
                "warning_hit_count": 1,
                "structured_missing_count": 0,
                "regression_flag_count": 0,
            },
            "fixtures": [],
        }
        (eval_dir / "summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return summary

    def fake_load_build_summary(build_selector: str):
        summary = original_load_build_summary(build_selector)
        if build_selector == "current":
            summary["eval_summary"] = {
                "summary": {
                    "fixture_count": 1,
                    "fixture_fallback_count": 0,
                    "warning_hit_count": 1,
                    "structured_missing_count": 0,
                    "regression_flag_count": 0,
                },
                "fixtures": [],
            }
        return summary

    monkeypatch.setattr(workbench, "run_evals", fake_run_evals)
    monkeypatch.setattr(workbench, "load_build_summary", fake_load_build_summary)

    try:
        build_result = workbench.build_candidate(build_id)
        current_summary = workbench.load_build_summary("current")["eval_summary"]
        candidate_summary = asyncio.run(
            workbench.run_evals(
                build_selector=build_selector,
                fixture_ids=["toc-mvp-fixture-001"],
            )
        )
        diff_payload = workbench.diff_builds(
            base_selector="current",
            target_selector=build_selector,
        )

        assert Path(build_result["index_path"]).exists()
        assert Path(build_result["quality_path"]).exists()
        assert (build_dir / "evals" / "summary.json").exists()
        assert current_summary["summary"]["fixture_count"] == 1
        assert candidate_summary["summary"]["fixture_count"] == 1
        assert candidate_summary["summary"]["warning_hit_count"] >= 1
        assert "quality_diff" in diff_payload
        assert "eval_diff" in diff_payload
        assert diff_payload["eval_diff"]["structured_missing_delta"] == 0
    finally:
        shutil.rmtree(build_dir, ignore_errors=True)


def test_v22_debug_endpoints_are_dev_only(monkeypatch):
    from app.api.main import app

    _reset_api_state()
    monkeypatch.delenv("AIMANDALA_ENABLE_DEBUG_WORKBENCH", raising=False)
    client = TestClient(app)

    build_summary = client.get("/api/v2/debug/knowledge/build-summary")
    fixture_preview = client.post(
        "/api/v2/debug/knowledge/fixture-preview",
        json={
            "fixture_id": "toc-mvp-fixture-001",
            "build_selector": "current",
            "version": "lite",
        },
    )

    assert build_summary.status_code == 404
    assert build_summary.json() == {"detail": "knowledge debug workbench is disabled"}
    assert fixture_preview.status_code == 404
    assert fixture_preview.json() == {"detail": "knowledge debug workbench is disabled"}


def test_v22_debug_endpoints_return_payloads_when_enabled(monkeypatch):
    from app.api import routes_v2
    from app.api.main import app

    _reset_api_state()

    class FakeKnowledgeWorkbench:
        async def ensure_build_summary(self, build_selector: str):
            return {
                "build_info": {"build_selector": build_selector},
                "quality": {"summary": {"theme_count": 3}},
                "eval_summary": {"summary": {"fixture_count": 4}},
            }

        async def preview_fixture(
            self,
            *,
            fixture_id: str,
            build_selector: str,
            version: str,
            compare_to_current: bool = True,
        ):
            return {
                "fixture_meta": {
                    "fixture_id": fixture_id,
                    "build_selector": build_selector,
                    "version": version,
                },
                "report_summary": {
                    "version": version,
                    "structured_field_presence": {
                        "deep_impression": True,
                        "evidence_digest": True,
                        "imbalance_diagnosis": True,
                        "root_cause_chain": True,
                        "deep_structure_interpretation": True,
                        "healing_plan": True,
                    },
                },
                "knowledge_summary": {
                    "summary": {
                        "fallback_used": False,
                        "algorithm_fidelity_pass": True,
                        "raw_payload_leak_found": False,
                    },
                    "source_refs": [{"source_path": "fixtures/fake.yaml"}],
                    "field_to_knowledge_map": {
                        "healing_plan": {"entity_ids": ["healing.general"]}
                    },
                },
                "regression_flags": [],
                "diff_from_current": None if not compare_to_current else {},
            }

    routes_v2._knowledge_workbench = FakeKnowledgeWorkbench()
    monkeypatch.setenv("AIMANDALA_ENABLE_DEBUG_WORKBENCH", "1")
    client = TestClient(app)

    build_summary = client.get(
        "/api/v2/debug/knowledge/build-summary",
        params={"build": "current"},
    )
    fixture_preview = client.post(
        "/api/v2/debug/knowledge/fixture-preview",
        json={
            "fixture_id": "toc-mvp-fixture-002",
            "build_selector": "current",
            "version": "pro",
        },
    )

    assert build_summary.status_code == 200
    build_payload = build_summary.json()
    assert build_payload["build_info"]["build_selector"] == "current"
    assert build_payload["quality"]["summary"]["theme_count"] >= 3
    assert build_payload["eval_summary"]["summary"]["fixture_count"] == 4

    assert fixture_preview.status_code == 200
    preview_payload = fixture_preview.json()
    assert preview_payload["fixture_meta"]["fixture_id"] == "toc-mvp-fixture-002"
    assert preview_payload["report_summary"]["version"] == "pro"
    assert preview_payload["knowledge_summary"]["summary"]["fallback_used"] is False
    assert preview_payload["knowledge_summary"]["summary"]["algorithm_fidelity_pass"] is True
    assert preview_payload["knowledge_summary"]["summary"]["raw_payload_leak_found"] is False
    assert preview_payload["knowledge_summary"]["source_refs"]
    assert preview_payload["knowledge_summary"]["field_to_knowledge_map"]["healing_plan"]["entity_ids"]
    assert preview_payload["report_summary"]["structured_field_presence"]["deep_impression"] is True
    assert preview_payload["report_summary"]["structured_field_presence"]["evidence_digest"] is True
    assert preview_payload["report_summary"]["structured_field_presence"]["imbalance_diagnosis"] is True
    assert preview_payload["report_summary"]["structured_field_presence"]["root_cause_chain"] is True
    assert (
        preview_payload["report_summary"]["structured_field_presence"][
            "deep_structure_interpretation"
        ]
        is True
    )
    assert preview_payload["report_summary"]["structured_field_presence"]["healing_plan"] is True
    assert preview_payload["diff_from_current"] is None


def test_v22_workbench_can_export_fixture_golden_assets(monkeypatch, tmp_path):
    _force_workbench_noop_llm(monkeypatch)
    workbench = KnowledgeWorkbench()

    result = asyncio.run(
        workbench.export_fixture_golden(
            fixture_id="toc-mvp-fixture-001",
            build_selector="current",
            version="lite",
            output_dir=tmp_path,
        )
    )

    export_dir = tmp_path / "toc-mvp-fixture-001"
    assert result["fixture_id"] == "toc-mvp-fixture-001"
    assert result["version"] == "lite"
    assert result["output_dir"] == str(export_dir)
    assert (export_dir / "lite.report.json").exists()
    assert (export_dir / "lite.report.md").exists()
    assert (export_dir / "lite.debug.json").exists()

    report_payload = json.loads((export_dir / "lite.report.json").read_text(encoding="utf-8"))
    assert report_payload["version"] == "lite"
    assert report_payload.get("error") is None
    assert report_payload["structured"]["topic_context"]["topic"] == "general"
    assert "current_reading" in report_payload["structured"]
    assert "knowledge_debug" in report_payload
    assert "/Users/xinran" not in json.dumps(report_payload, ensure_ascii=False)

    debug_payload = json.loads((export_dir / "lite.debug.json").read_text(encoding="utf-8"))
    assert "algorithm_fidelity_trace" in debug_payload
    assert debug_payload["algorithm_fidelity_trace"]["scope"] == "lite"
    assert "topic_context_trace" in debug_payload
    assert "narrative_plans" in debug_payload
    assert "field_to_knowledge_map" in debug_payload
    visual_trace = report_payload["knowledge_debug"]["product_block_debug"]["lite"]["visual_basis"]["evidence_trace"]
    assert visual_trace["per_circle_color_summary"]
    assert "method:per_circle_color_analysis" in visual_trace["rule_refs"]

    markdown_payload = (export_dir / "lite.report.md").read_text(encoding="utf-8")
    assert "产品区块" in markdown_payload
    assert "topic_context" not in markdown_payload
    assert "current_reading" not in markdown_payload
    excerpt = markdown_payload.split("## 正文摘录", 1)[1]
    assert excerpt.strip()
    assert "重要声明" not in excerpt[:160]


def test_v22_workbench_exports_real_report_without_llm(monkeypatch, tmp_path):
    _force_workbench_noop_llm(monkeypatch)
    workbench = KnowledgeWorkbench()

    result = asyncio.run(
        workbench.export_fixture_golden(
            fixture_id="toc-mvp-fixture-002",
            build_selector="current",
            version="pro",
            output_dir=tmp_path,
        )
    )

    export_dir = tmp_path / "toc-mvp-fixture-002"
    report_payload = json.loads((export_dir / "pro.report.json").read_text(encoding="utf-8"))
    assert result["version"] == "pro"
    assert report_payload["version"] == "pro"
    assert report_payload.get("error") is None
    assert report_payload["structured"]["deep_impression"]
    assert report_payload["structured"]["evidence_digest"]
    assert report_payload["structured"]["healing_plan"]
    markdown_payload = (export_dir / "pro.report.md").read_text(encoding="utf-8")
    assert "产品区块" in markdown_payload
    excerpt = markdown_payload.split("## 正文摘录", 1)[1]
    assert excerpt.strip()


def test_v22_eval_summary_includes_golden_review_aggregation(tmp_path):
    workbench = KnowledgeWorkbench()
    review_dir = tmp_path / "toc-mvp-fixture-001"
    review_dir.mkdir(parents=True)
    (review_dir / "lite.review.md").write_text(
        "\n".join(
            [
                "---",
                "fixture_id: toc-mvp-fixture-001",
                "mode: lite",
                "topic: general",
                "result: pass_with_drift",
                "deviation_count: 2",
                "---",
                "",
                "# review",
            ]
        ),
        encoding="utf-8",
    )
    (review_dir / "pro.review.md").write_text(
        "\n".join(
            [
                "---",
                "fixture_id: toc-mvp-fixture-001",
                "mode: pro",
                "topic: general",
                "result: fail",
                "deviation_count: 1",
                "---",
                "",
                "# review",
            ]
        ),
        encoding="utf-8",
    )

    sample_results = [
        {
            "fixture_meta": {"fixture_id": "toc-mvp-fixture-001", "theme": "general"},
            "report_summary": {
                "version": "lite",
                "structured_field_presence": {"current_reading": True},
            },
            "knowledge_summary": {
                "warning_analysis": {"warning_hits": []},
                "summary": {
                    "fallback_used": False,
                    "warning_hit_count": 0,
                    "algorithm_fidelity_pass": True,
                    "legacy_semantics_found": False,
                    "raw_payload_leak_found": False,
                },
            },
            "regression_flags": [],
        }
    ]

    summary = workbench._build_eval_summary(
        build_selector="current",
        sample_results=sample_results,
        golden_review_root=tmp_path,
    )

    assert summary["summary"]["golden_reviewed_count"] == 2
    assert summary["summary"]["golden_pass_count"] == 0
    assert summary["summary"]["golden_pass_with_drift_count"] == 1
    assert summary["summary"]["golden_fail_count"] == 1
    assert summary["summary"]["open_deviation_count"] == 3
    assert summary["fixtures"][0]["golden_review"]["result"] == "pass_with_drift"
