"""Tests for the mandala A/B experiment runner."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "run_mandala_ab_experiment.py"
)


def _load_runner_module():
    spec = importlib.util.spec_from_file_location("run_mandala_ab_experiment", SCRIPT_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_load_cases_defaults_to_case_001():
    runner = _load_runner_module()
    cases = runner.load_cases(runner.CASE_ROOT, case_id="case-001")

    assert len(cases) == 1
    assert cases[0].case_id == "case-001"
    assert cases[0].image_path.exists()
    assert cases[0].marked_image_path.exists()

