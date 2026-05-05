"""Tests for the Aimandala vision model eval runner."""

import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from scripts import run_vision_model_evals


def test_load_fixtures_reads_existing_manifest():
    fixtures = run_vision_model_evals.load_fixtures(["toc-mvp-fixture-001"])

    assert len(fixtures) == 1
    assert fixtures[0].fixture_id == "toc-mvp-fixture-001"
    assert fixtures[0].image_path.exists()


def test_build_plan_does_not_require_candidates():
    fixtures = run_vision_model_evals.load_fixtures(["toc-mvp-fixture-001"])

    plan = run_vision_model_evals.build_plan(
        fixtures,
        candidates=[],
        output_dir=Path("/tmp/vision-evals"),
    )

    assert plan["ok"] is True
    assert plan["mode"] == "plan"
    assert plan["fixture_count"] == 1
    assert plan["candidate_count"] == 0


def test_config_template_includes_four_domestic_vision_candidates():
    template = run_vision_model_evals.config_template()
    candidate_ids = {candidate["id"] for candidate in template["candidates"]}

    assert candidate_ids == {
        "doubao-vision",
        "qwen-vl",
        "glm-vision",
        "kimi-vision",
    }


def test_load_candidates_resolves_api_key_from_env(tmp_path: Path, monkeypatch):
    config_path = tmp_path / "candidates.json"
    config_path.write_text(
        json.dumps(
            {
                "candidates": [
                    {
                        "id": "qwen-vl",
                        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                        "model": "qwen-vl-max",
                        "api_key_env": "DASHSCOPE_API_KEY",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("DASHSCOPE_API_KEY", "secret")

    candidates = run_vision_model_evals.load_candidates(config_path)

    assert len(candidates) == 1
    assert candidates[0].candidate_id == "qwen-vl"
    assert candidates[0].api_key_configured is True
    assert candidates[0].public_payload()["api_key_configured"] is True
    assert "secret" not in json.dumps(candidates[0].public_payload())


def test_execute_requires_candidate_api_key(tmp_path: Path):
    fixtures = run_vision_model_evals.load_fixtures(["toc-mvp-fixture-001"])
    candidate = run_vision_model_evals.Candidate(
        candidate_id="missing-key",
        base_url="https://example.com/v1",
        model="vision-model",
        api_key=None,
        api_key_env="MISSING_KEY",
        api_key_header="Authorization",
        timeout_seconds=1,
        max_retries=0,
        retry_backoff_ms=0,
    )

    try:
        run_vision_model_evals.execute_evals(fixtures, [candidate], tmp_path)
    except ValueError as error:
        assert "missing API key" in str(error)
    else:
        raise AssertionError("execute_evals should reject candidates without API keys")


def test_execute_writes_result_files(tmp_path: Path):
    fixtures = run_vision_model_evals.load_fixtures(["toc-mvp-fixture-001"])
    candidate = run_vision_model_evals.Candidate(
        candidate_id="fake-vision",
        base_url="https://example.com/v1",
        model="vision-model",
        api_key="secret",
        api_key_env=None,
        api_key_header="Authorization",
        timeout_seconds=1,
        max_retries=0,
        retry_backoff_ms=0,
    )

    fake_payload = {
        "center_observation": "中心较稳定。",
        "circle_boundaries": {
            "inner": "内圈可见。",
            "middle": "中圈可见。",
            "outer": "外圈清晰。",
        },
        "dominant_colors": ["蓝色", "白色"],
        "structure_notes": ["结构集中"],
        "risk_flags": [],
        "confidence": "medium",
    }

    with patch.object(
        run_vision_model_evals.OpenAICompatibleLLMClient,
        "generate_structured",
        return_value=fake_payload,
    ):
        summary = run_vision_model_evals.execute_evals(fixtures, [candidate], tmp_path)

    output_path = tmp_path / "fake-vision" / "toc-mvp-fixture-001.json"
    assert summary["ok"] is True
    assert output_path.exists()
    written = json.loads(output_path.read_text(encoding="utf-8"))
    assert written["output"]["center_observation"] == "中心较稳定。"
