"""Tests for the complete-case wealth report regression runner."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "run_complete_case_wealth_report_regression.py"
)


def _load_runner_module():
    spec = importlib.util.spec_from_file_location(
        "run_complete_case_wealth_report_regression",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_load_complete_cases_excludes_case_006():
    runner = _load_runner_module()
    cases = runner.load_complete_cases(runner.CASE_ROOT, runner.FOUNDATION_SEED_ROOT)

    assert len(cases) == 10
    assert all(case.case_id != "case-006" for case in cases)
    assert cases[0].case_id == "case-001"
    assert cases[-1].case_id == "case-011"


def test_build_env_check_requires_deepseek_v4(monkeypatch, tmp_path):
    runner = _load_runner_module()
    seed_dir = tmp_path / "seed"
    seed_dir.mkdir()
    seed_path = seed_dir / "case-001.foundation-image-reading.json"
    seed_path.write_text(
        "{\"foundation_image_reading\": {\"visual_observation\": {}}}",
        encoding="utf-8",
    )

    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")

    payload = runner.build_env_check_payload(
        planned_runs=[
            {
                "case_id": "case-001",
                "seed_path": str(seed_path),
            }
        ]
    )

    assert payload["ready"] is True
    assert payload["text_model_matches_app"] is True
    assert payload["planned_run_count"] == 1
