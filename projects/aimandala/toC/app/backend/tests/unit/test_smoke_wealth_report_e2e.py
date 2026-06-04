"""Tests for the wealth report smoke helpers under the new contract."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "smoke_wealth_report_api.py"
)


def _load_smoke_module():
    spec = importlib.util.spec_from_file_location(
        "smoke_wealth_report_api",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_redeem_code_for_mode_prefers_explicit_code():
    smoke = _load_smoke_module()
    args = SimpleNamespace(redeem_code="ALL-CODE", lite_code="LITE", pro_code="PRO")

    assert smoke._redeem_code_for_mode(args, "lite") == "ALL-CODE"
    assert smoke._redeem_code_for_mode(args, "pro") == "ALL-CODE"


def test_write_report_artifacts_creates_new_contract_files(tmp_path):
    smoke = _load_smoke_module()
    response_payload = {
        "report_mode": "lite",
        "report_id": "report-001",
        "final_report_md": "# 财富议题曼陀罗解读报告\n\n## 整体感受\n先收住，再展开。",
        "final_report": {"report_id": "report-001", "report_mode": "lite"},
        "visual_draft": {"visual_observation": {"overall_observation": {}}},
        "prompt_pack_manifest": {"pack_id": "wealth-report-v1.0.0"},
        "quality_gate": {"passed": True},
        "run_summary": {"status": "complete"},
        "success": True,
    }

    smoke._write_report_artifacts(
        tmp_path,
        request_payload={"report_mode": "lite"},
        response_payload=response_payload,
        upload_payload={"storage_backend": "local"},
        duration_seconds=1.23,
    )

    assert (tmp_path / "visual_draft.json").exists()
    assert (tmp_path / "prompt_pack_manifest.json").exists()
    assert (tmp_path / "quality_gate.json").exists()
    assert (tmp_path / "run_summary.json").exists()
