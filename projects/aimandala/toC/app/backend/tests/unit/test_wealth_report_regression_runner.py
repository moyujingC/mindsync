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


def test_build_env_check_payload_reports_missing_required_fields(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.delenv("AIMANDALA_ENV_FILE", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_CHAT_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_REDEEM_CODES", raising=False)

    payload = runner.build_env_check_payload(planned_runs=[])

    assert payload["status"] == "env_check"
    assert payload["ready"] is False
    assert "AIMANDALA_LLM_API_KEY" in payload["missing_agent_required"]


def test_build_env_check_payload_accepts_loaded_private_env(monkeypatch, tmp_path):
    runner = _load_runner_module()
    env_file = tmp_path / "aimandala.local.env"
    env_file.write_text(
        "\n".join(
            [
                "AIMANDALA_LLM_API_KEY=file-key",
                "AIMANDALA_LLM_VISION_FALLBACK_API_KEY=file-vision-key",
                "AIMANDALA_LLM_VISION_FALLBACK_BASE_URL=https://vision.example.test",
                "AIMANDALA_LLM_VISION_FALLBACK_MODEL=vision-model",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("AIMANDALA_ENV_FILE", str(env_file))
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_REDEEM_CODES", raising=False)

    payload = runner.build_env_check_payload(planned_runs=[{"case_id": "wealth-case-001"}])

    assert payload["ready"] is True
    assert payload["agent_regression_ready"] is True
    assert payload["api_e2e_ready"] is False
    assert payload["missing_api_required"] == ["AIMANDALA_REDEEM_CODES"]
    assert payload["planned_run_count"] == 1
    assert payload["vision_ready"] is True


def test_build_env_check_payload_requires_any_vision_route(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "CODE-LITE:lite")
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_MODEL", raising=False)

    payload = runner.build_env_check_payload(planned_runs=[])

    assert payload["ready"] is False
    assert payload["vision_ready"] is False
    assert "AIMANDALA_LLM_VISION_* or AIMANDALA_LLM_VISION_FALLBACK_*" in payload["missing_required"]


def test_regression_env_example_exists():
    runner = _load_runner_module()
    env_example = Path(runner.BACKEND_ROOT) / ".env.regression.example"

    assert env_example.exists()


def test_env_file_argument_overrides_environment(monkeypatch, tmp_path):
    runner = _load_runner_module()
    env_file = tmp_path / "override.env"
    env_file.write_text(
        "\n".join(
            [
                "AIMANDALA_LLM_API_KEY=override-key",
                "AIMANDALA_LLM_VISION_API_KEY=override-vision-key",
                "AIMANDALA_LLM_VISION_BASE_URL=https://vision.override.test",
                "AIMANDALA_LLM_VISION_MODEL=override-model",
                "AIMANDALA_REDEEM_CODES=CODE-LITE:lite",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("AIMANDALA_ENV_FILE", "ignored.env")
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "shell-key")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "shell-vision-key")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_BASE_URL", "https://shell.example.test")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "shell-model")
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "shell-code")

    monkeypatch.setenv("AIMANDALA_ENV_FILE", str(env_file))
    payload = runner.build_env_check_payload(planned_runs=[])

    assert payload["ready"] is True
