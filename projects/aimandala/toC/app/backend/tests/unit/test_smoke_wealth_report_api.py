"""Tests for the wealth report API smoke script helpers."""

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


def test_redeem_code_for_mode_uses_mode_specific_defaults():
    smoke = _load_smoke_module()
    args = SimpleNamespace(redeem_code="", lite_code="LITE", pro_code="PRO")

    assert smoke._redeem_code_for_mode(args, "lite") == "LITE"
    assert smoke._redeem_code_for_mode(args, "pro") == "PRO"


def test_content_type_for_image_suffixes():
    smoke = _load_smoke_module()

    assert smoke._content_type_for_image(Path("a.jpeg")) == "image/jpeg"
    assert smoke._content_type_for_image(Path("a.jpg")) == "image/jpeg"
    assert smoke._content_type_for_image(Path("a.webp")) == "image/webp"
    assert smoke._content_type_for_image(Path("a.png")) == "image/png"


def test_resolve_save_dir_returns_none_when_omitted():
    smoke = _load_smoke_module()

    assert smoke._resolve_save_dir("") is None
    assert smoke._resolve_save_dir("   ") is None


def test_write_report_artifacts_creates_review_files(tmp_path):
    smoke = _load_smoke_module()
    response_payload = {
        "topic": "wealth",
        "report_mode": "lite",
        "report_id": "report-001",
        "final_report_md": "# 财富议题曼陀罗解读报告\n\n## 五行感知\n五行中的水是当前画面依据。",
        "selected_signal_ids": ["visual.outer_world_closed_or_blank"],
        "selected_clause_ids": ["wealth.low_world_connection"],
        "selected_module_ids": ["wealth.world_connection_market"],
        "boundaries": ["不输出财务建议。"],
        "final_report": {"report_id": "report-001"},
        "quality_gate": {"passed": True},
        "report_context_package": {"report_id": "report-001"},
        "agent_output": {"status": "complete"},
    }

    smoke._write_report_artifacts(
        tmp_path,
        request_payload={"report_mode": "lite"},
        response_payload=response_payload,
        upload_payload={"storage_backend": "local"},
        duration_seconds=1.23,
    )

    assert (tmp_path / "final_report.md").read_text(encoding="utf-8").startswith("# 财富议题")
    assert (tmp_path / "quality_gate.json").exists()
    assert (tmp_path / "report_context_package.json").exists()
    assert (tmp_path / "response.json").exists()
    route_summary = (tmp_path / "route_summary.json").read_text(encoding="utf-8")
    assert "wealth.low_world_connection" in route_summary
