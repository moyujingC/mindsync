"""Tests for the wealth report regression runner helpers."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "run_wealth_report_regression.py"
)


def _load_runner_module():
    spec = importlib.util.spec_from_file_location(
        "run_wealth_report_regression",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_load_cases_from_wealth_regression_directory():
    runner = _load_runner_module()
    cases = runner.load_cases(runner.DEFAULT_REGRESSION_ROOT, case_id="wealth-case-001")

    assert len(cases) == 1
    case = cases[0]
    assert case.case_id == "wealth-case-001"
    assert case.image_path.exists()
    assert case.painting_intention


def test_build_agent_input_uses_wealth_theme():
    runner = _load_runner_module()
    case = runner.load_cases(runner.DEFAULT_REGRESSION_ROOT, case_id="wealth-case-001")[0]
    agent_input = runner.build_agent_input(case, report_mode="pro")

    assert agent_input.report_mode == "pro"
    assert agent_input.user_context.theme == "wealth"
    assert agent_input.user_context.theme_label == "财富议题"
    assert agent_input.circle_boundaries["inner_radius"] == 35
