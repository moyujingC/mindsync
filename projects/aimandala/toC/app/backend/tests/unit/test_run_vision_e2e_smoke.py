"""Tests for the Aimandala vision end-to-end smoke runner."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from scripts import run_vision_e2e_smoke


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
