"""Tests for the v2.2 local knowledge workbench and debug endpoints."""

import asyncio
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


def test_v22_workbench_builds_candidate_and_diff():
    workbench = KnowledgeWorkbench()
    build_id = "pytest-v22"
    build_selector = f"candidate:{build_id}"
    build_dir = resolve_build_dir(build_selector)
    shutil.rmtree(build_dir, ignore_errors=True)

    try:
        build_result = workbench.build_candidate(build_id)
        current_summary = asyncio.run(workbench.ensure_build_summary("current"))
        candidate_summary = asyncio.run(workbench.run_evals(build_selector=build_selector))
        diff_payload = workbench.diff_builds(
            base_selector="current",
            target_selector=build_selector,
        )

        assert Path(build_result["index_path"]).exists()
        assert Path(build_result["quality_path"]).exists()
        assert (build_dir / "evals" / "summary.json").exists()
        assert current_summary["quality"]["build_info"]["build_selector"] == "current"
        assert candidate_summary["summary"]["fixture_count"] >= 5
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
            "fixture_id": "toc-mvp-sample-a-lite-general",
            "build_selector": "current",
            "version": "lite",
        },
    )

    assert build_summary.status_code == 404
    assert build_summary.json() == {"detail": "knowledge debug workbench is disabled"}
    assert fixture_preview.status_code == 404
    assert fixture_preview.json() == {"detail": "knowledge debug workbench is disabled"}


def test_v22_debug_endpoints_return_payloads_when_enabled(monkeypatch):
    from app.api.main import app

    _reset_api_state()
    monkeypatch.setenv("AIMANDALA_ENABLE_DEBUG_WORKBENCH", "1")
    client = TestClient(app)

    build_summary = client.get(
        "/api/v2/debug/knowledge/build-summary",
        params={"build": "current"},
    )
    fixture_preview = client.post(
        "/api/v2/debug/knowledge/fixture-preview",
        json={
            "fixture_id": "toc-mvp-sample-b-lite-to-pro-career",
            "build_selector": "current",
            "version": "pro",
        },
    )

    assert build_summary.status_code == 200
    build_payload = build_summary.json()
    assert build_payload["build_info"]["build_selector"] == "current"
    assert build_payload["quality"]["summary"]["theme_count"] >= 3
    assert build_payload["eval_summary"]["summary"]["fixture_count"] >= 5

    assert fixture_preview.status_code == 200
    preview_payload = fixture_preview.json()
    assert preview_payload["fixture_meta"]["fixture_id"] == "toc-mvp-sample-b-lite-to-pro-career"
    assert preview_payload["report_summary"]["version"] == "pro"
    assert preview_payload["knowledge_summary"]["summary"]["fallback_used"] is True
    assert preview_payload["knowledge_summary"]["source_refs"]
    assert preview_payload["knowledge_summary"]["field_to_knowledge_map"]["healing_suggestions"][
        "entity_ids"
    ]
    assert preview_payload["diff_from_current"] is None
