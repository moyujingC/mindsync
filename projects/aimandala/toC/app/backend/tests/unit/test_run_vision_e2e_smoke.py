"""Tests for the Aimandala vision end-to-end smoke runner."""

import os
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from scripts import run_vision_e2e_smoke


def test_build_fixture_user_context_avoids_test_meta_copy():
    context = run_vision_e2e_smoke._build_fixture_user_context(
        SimpleNamespace(fixture_id="toc-mvp-fixture-003", theme="general")
    )

    assert "端到端验证视觉模型进入三圈识别和报告依据" not in context["painting_intention"]
    assert "保持观察，不做诊断" not in context["painting_feeling"]
    assert "更稳地往前" in context["painting_intention"]


def test_prepare_output_dir_removes_stale_files(tmp_path: Path):
    output_dir = tmp_path / "vision-smoke"
    output_dir.mkdir(parents=True)
    stale_file = output_dir / "stale.json"
    stale_file.write_text("old", encoding="utf-8")

    run_vision_e2e_smoke._prepare_output_dir(output_dir)

    assert output_dir.exists()
    assert not stale_file.exists()


def test_load_env_file_supports_export_quotes_and_comments(tmp_path: Path, monkeypatch):
    env_file = tmp_path / ".env.local"
    env_file.write_text(
        "\n".join(
            [
                "# local smoke keys",
                "export DASHSCOPE_API_KEY='dashscope-demo'",
                'DOUBAO_API_KEY="doubao-demo"',
                "AIMANDALA_LLM_TIMEOUT_SECONDS=60",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.delenv("DASHSCOPE_API_KEY", raising=False)
    monkeypatch.delenv("DOUBAO_API_KEY", raising=False)

    loaded = run_vision_e2e_smoke.load_env_file(env_file)

    assert "DASHSCOPE_API_KEY" in loaded
    assert os.environ["DASHSCOPE_API_KEY"] == "dashscope-demo"
    assert os.environ["DOUBAO_API_KEY"] == "doubao-demo"


def test_load_smoke_env_uses_explicit_env_file(tmp_path: Path, monkeypatch):
    env_file = tmp_path / "smoke.env"
    env_file.write_text("DASHSCOPE_API_KEY=from-file\n", encoding="utf-8")
    monkeypatch.setenv("AIMANDALA_SMOKE_ENV_FILE", str(env_file))
    monkeypatch.delenv("DASHSCOPE_API_KEY", raising=False)

    loaded = run_vision_e2e_smoke.load_smoke_env()

    assert loaded == ["DASHSCOPE_API_KEY"]
    assert os.environ["DASHSCOPE_API_KEY"] == "from-file"


def test_validate_vision_env_rejects_missing_keys(monkeypatch):
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", raising=False)

    try:
        run_vision_e2e_smoke.validate_vision_env()
    except RuntimeError as error:
        message = str(error)
    else:
        raise AssertionError("validate_vision_env should reject missing API keys")

    assert "AIMANDALA_LLM_VISION_API_KEY" in message
    assert "AIMANDALA_LLM_VISION_FALLBACK_API_KEY" in message


def test_main_surfaces_runtime_error_as_structured_failure(monkeypatch, capsys):
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", raising=False)
    monkeypatch.setattr(
        run_vision_e2e_smoke,
        "execute_smoke",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("missing keys")),
    )
    monkeypatch.setattr(sys, "argv", ["run_vision_e2e_smoke.py"])

    exit_code = run_vision_e2e_smoke.main()
    captured = capsys.readouterr()

    assert exit_code == 1
    assert '"ok": false' in captured.out
    assert "missing keys" in captured.out


def test_main_passes_env_file_to_execute_smoke(monkeypatch, tmp_path: Path, capsys):
    env_file = tmp_path / "smoke.env"
    env_file.write_text("DASHSCOPE_API_KEY=demo\n", encoding="utf-8")
    captured_args = {}

    def fake_execute_smoke(fixture_ids, output_dir, *, env_file=None):
        captured_args["fixture_ids"] = fixture_ids
        captured_args["env_file"] = env_file
        return {"ok": True, "mode": "vision_e2e_smoke"}

    monkeypatch.setattr(run_vision_e2e_smoke, "execute_smoke", fake_execute_smoke)
    monkeypatch.setattr(
        sys,
        "argv",
        ["run_vision_e2e_smoke.py", "--fixture-id", "toc-mvp-fixture-003", "--env-file", str(env_file)],
    )

    exit_code = run_vision_e2e_smoke.main()
    capsys.readouterr()

    assert exit_code == 0
    assert captured_args["fixture_ids"] == ["toc-mvp-fixture-003"]
    assert captured_args["env_file"] == env_file


def test_validate_fixture_result_accepts_llm_detect_and_visual_basis():
    result = {
        "fixture_id": "toc-mvp-fixture-003",
        "detect": {
            "method": "llm_vision",
            "confidence": 0.82,
            "inner_radius": 0.31,
            "middle_radius": 0.67,
            "debug_info": {"backend": "llm_vision"},
        },
        "lite_report": {
            "version": "lite",
            "error": None,
            "structured": {
                "visual_basis": "内圈颜色较亮，中圈有紫色花瓣，外圈由绿色和黄色叶片构成。",
                "prompt_schema_validation_issues": [],
            },
        },
        "pro_report": {
            "version": "pro",
            "error": None,
            "structured": {
                "deep_impression": "结构稳定。",
                "evidence_digest": "三圈依据完整。",
            },
        },
    }

    validation = run_vision_e2e_smoke.validate_fixture_result(result)

    assert validation["ok"] is True
    assert validation["failures"] == []


def test_validate_fixture_result_rejects_default_detect_and_missing_visual_basis():
    result = {
        "fixture_id": "toc-mvp-fixture-003",
        "detect": {
            "method": "default",
            "confidence": 0.2,
            "inner_radius": 0.33,
            "middle_radius": 0.66,
            "debug_info": {"reason": "backend_not_configured"},
        },
        "lite_report": {
            "version": "lite",
            "error": None,
            "structured": {
                "visual_basis": "",
                "prompt_schema_validation_issues": ["missing visual_basis"],
            },
        },
        "pro_report": None,
    }

    validation = run_vision_e2e_smoke.validate_fixture_result(result)

    assert validation["ok"] is False
    assert "detect_fallback_default" in validation["failures"]
    assert "lite_visual_basis_missing" in validation["failures"]
    assert "lite_prompt_schema_validation_issues" in validation["failures"]


def test_build_public_summary_omits_report_body_and_upload_local_path():
    result = {
        "fixture_id": "toc-mvp-fixture-003",
        "upload": {
            "image_path": "/tmp/private-runtime-file.jpeg",
            "storage_backend": "local",
            "storage_key": "uploads/demo.jpeg",
            "image_url": "http://testserver/api/v2/uploads/uploads/demo.jpeg",
        },
        "detect": {
            "method": "llm_vision",
            "confidence": 0.82,
            "inner_radius": 0.31,
            "middle_radius": 0.67,
            "debug_info": {"backend": "llm_vision"},
        },
        "lite_report": {
            "version": "lite",
            "title": "一镜 Lite 版",
            "error": None,
            "report": "完整报告正文不进入摘要。",
            "structured": {
                "visual_basis": "内圈颜色较亮，中圈有紫色花瓣，外圈由绿色和黄色叶片构成。",
                "emotion_portrait": "温柔但清楚地命名当前状态。",
                "story": {"base": "先收回自己。"},
                "theme_awareness": "今天先观察一次身体反应。",
                "prompt_schema_validation_issues": [],
            },
        },
        "pro_report": {
            "version": "pro",
            "title": "一梳 Pro 版",
            "error": None,
            "report": "完整 Pro 正文不进入摘要。",
            "structured": {
                "deep_impression": "结构稳定。",
                "root_cause_chain": {"surface": "表层", "deeper": "深层", "core": "核心"},
                "healing_plan": [{"phase": "当前阶段", "practice": "记录一次边界感"}],
                "prompt_preview": "prompt should not be copied into style review fields",
            },
        },
        "validation": {"ok": True, "failures": []},
        "runtime_diagnostics": {
            "record_found": True,
            "status": "completed",
            "generation_stage": "completed",
            "lite_ready": True,
            "pro_ready": True,
        },
    }

    summary = run_vision_e2e_smoke.build_public_summary([result])

    assert summary["ok"] is True
    fixture_summary = summary["fixtures"][0]
    assert fixture_summary["upload"]["storage_backend"] == "local"
    assert "image_path" not in fixture_summary["upload"]
    assert "report" not in fixture_summary["lite_report"]
    assert "report" not in fixture_summary["pro_report"]
    assert fixture_summary["lite_report"]["style_review_fields"]["emotion_portrait"] == "温柔但清楚地命名当前状态。"
    assert fixture_summary["pro_report"]["style_review_fields"]["root_cause_chain"]["core"] == "核心"
    assert "prompt_preview" not in fixture_summary["pro_report"]["style_review_fields"]
    assert fixture_summary["runtime_diagnostics"]["lite_ready"] is True


def test_build_sanitized_fixture_result_omits_runtime_paths_and_raw_report_body():
    result = {
        "fixture_id": "toc-mvp-fixture-003",
        "image_asset": "fixtures/toc-mvp/assets/IMG_5062.jpeg",
        "upload": {
            "image_path": "/tmp/aimandala-runtime/uploads/demo.jpeg",
            "storage_backend": "local",
            "storage_key": "uploads/demo.jpeg",
            "content_type": "image/jpeg",
            "size_bytes": 123,
        },
        "detect": {
            "method": "llm_vision",
            "confidence": 0.82,
            "inner_radius": 0.31,
            "middle_radius": 0.67,
            "debug_info": {"backend": "llm_vision"},
        },
        "create": {
            "interpretation_id": "demo-id",
            "version": "lite",
            "status": "completed",
            "generation_stage": "completed",
            "generation_progress": 100,
            "three_circles": {"inner_radius": 31, "middle_radius": 67},
            "auto_detected": True,
            "report_ready": True,
        },
        "status": {
            "interpretation_id": "demo-id",
            "status": "completed",
            "generation_stage": "completed",
            "generation_progress": 100,
            "report_ready": True,
            "version_purchased": ["lite"],
            "three_circles": {"inner_radius": 31, "middle_radius": 67},
            "auto_detected": True,
        },
        "lite_report": {
            "version": "lite",
            "title": "一镜 Lite 版",
            "overall_impression": "摘要可保留。",
            "error": None,
            "report": "完整 Lite 正文不进入证据文件。",
            "structured": {
                "visual_basis": "内圈颜色较亮，中圈有紫色花瓣，外圈由绿色和黄色叶片构成。",
                "emotion_portrait": "温柔但清楚地命名当前状态。",
                "story": {"base": "先收回自己。"},
                "theme_awareness": "今天先观察一次身体反应。",
                "prompt_schema_validation_issues": [],
            },
        },
        "pro_purchase": {"order": {"raw": "purchase payload should not be copied"}},
        "pro_report": {
            "version": "pro",
            "title": "一梳 Pro 版",
            "overall_impression": "摘要可保留。",
            "error": None,
            "report": "完整 Pro 正文不进入证据文件。",
            "structured": {
                "deep_impression": "结构稳定。",
                "root_cause_chain": {"surface": "表层", "deeper": "深层", "core": "核心"},
                "healing_plan": [{"phase": "当前阶段", "practice": "记录一次边界感"}],
                "prompt_preview": "prompt should not be copied into style review fields",
            },
        },
        "validation": {"ok": True, "failures": []},
        "runtime_diagnostics": {
            "record_found": True,
            "status": "failed",
            "generation_stage": "failed",
            "stage_process": {
                "passed": False,
                "failure_reason": "stage_vision_request_failed",
            },
        },
    }

    sanitized = run_vision_e2e_smoke.build_sanitized_fixture_result(result)

    assert "image_path" not in sanitized["upload"]
    assert "report" not in sanitized["lite_report"]
    assert "report" not in sanitized["pro_report"]
    assert "pro_purchase" not in sanitized
    assert sanitized["detect"]["debug_backend"] == "llm_vision"
    assert sanitized["lite_report"]["style_review_fields"]["story"]["base"] == "先收回自己。"
    assert sanitized["pro_report"]["style_review_fields"]["healing_plan"][0]["phase"] == "当前阶段"
    assert "prompt_preview" not in sanitized["pro_report"]["style_review_fields"]
    assert sanitized["runtime_diagnostics"]["stage_process"]["failure_reason"] == "stage_vision_request_failed"


def test_sanitize_stage_failure_detail_omits_sensitive_payload():
    detail = {
        "stage": "vision",
        "api_key": "secret",
        "request_payload": {"Authorization": "Bearer secret"},
        "llm_error": {"kind": "http_error", "status": 401},
        "llm_attempt_trace": [
            {
                "model": "qwen-vl-max-latest",
                "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                "endpoint_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                "result": "http_error",
                "status": 401,
                "extra": "not copied",
            }
        ],
    }

    sanitized = run_vision_e2e_smoke._sanitize_stage_failure_detail(detail)

    assert "api_key" not in sanitized
    assert "request_payload" not in sanitized
    assert sanitized["llm_error"]["status"] == 401
    assert sanitized["llm_attempt_trace"][0]["result"] == "http_error"
    assert "extra" not in sanitized["llm_attempt_trace"][0]


def test_build_runtime_diagnostics_reads_orchestrator_store(monkeypatch):
    stage_process = SimpleNamespace(
        payload={
            "stage-03-visual-evidence": {
                "status": "failed",
                "failure_reason": "stage_vision_request_failed",
                "failure_detail": {"stage": "vision"},
            }
        },
        fidelity_flags=["stage_vision_failed"],
        fallback_summary={"used": True},
        visual_analysis_basis={"prompt_meta": {"source": "stage_vision_failed"}},
    )
    record = SimpleNamespace(
        status="failed",
        generation_stage="failed",
        generation_progress=100,
        stage_process_package=stage_process,
        layer_2_lite_final=None,
        layer_4_pro_final=None,
    )
    store = SimpleNamespace(load=lambda interpretation_id: record)
    orchestrator = SimpleNamespace(store=store)

    monkeypatch.setattr(
        "app.api.routes_v2.get_orchestrator",
        lambda: orchestrator,
    )

    diagnostics = run_vision_e2e_smoke._build_runtime_diagnostics("demo")

    assert diagnostics["status"] == "failed"
    assert diagnostics["stage_process"]["failure_reason"] == "stage_vision_request_failed"
