"""Tests for the complete-case foundation_image_reading runner."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "run_case_foundation_image_reading.py"
)


def _load_runner_module():
    spec = importlib.util.spec_from_file_location(
        "run_case_foundation_image_reading",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _sample_foundation_payload() -> dict:
    return {
        "stage": "foundation-image-reading",
        "status": "complete",
        "foundation_image_reading": {
            "visual_observation": {
                "overall_observation": {
                    "first_impression": "整体清透，有清楚边界。",
                    "main_visual_content": "内圈蓝色，中圈粉色，外圈紫色。",
                    "visual_atmosphere": "柔和但被留白切分。",
                    "visual_weight_and_rhythm": "重复规整。",
                },
                "three_circle_observation": {
                    "inner": "内圈蓝色圆形。",
                    "middle": "中圈粉色块之间有留白。",
                    "outer": "外圈紫色块重复。",
                    "cross_circle_visual_connection": "三圈层层向外展开。",
                },
                "circle_visual_units": {
                    "inner": {
                        "composition_description": "内圈蓝色。",
                        "visual_units": [
                            {
                                "id": "inner-001",
                                "unit_name": "蓝色圆形",
                                "source_type": "user_painted",
                                "color_description": "蓝色",
                                "shape_description": "圆形",
                                "spatial_relations": "位于中心。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "内圈蓝色圆形。",
                            }
                        ],
                    },
                    "middle": {
                        "composition_description": "中圈粉色与留白。",
                        "visual_units": [
                            {
                                "id": "middle-001",
                                "unit_name": "粉色花瓣",
                                "source_type": "user_painted",
                                "color_description": "粉色",
                                "shape_description": "花瓣",
                                "spatial_relations": "被留白隔开。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "中圈粉色花瓣。",
                            }
                        ],
                    },
                    "outer": {
                        "composition_description": "外圈紫色。",
                        "visual_units": [
                            {
                                "id": "outer-001",
                                "unit_name": "紫色块",
                                "source_type": "user_painted",
                                "color_description": "紫色",
                                "shape_description": "矩形",
                                "spatial_relations": "沿外圈重复。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "外圈紫色矩形重复。",
                            }
                        ],
                    },
                },
            },
            "element_sensing": {
                "inner": {"element_candidates": [], "summary": ""},
                "middle": {"element_candidates": [], "summary": ""},
                "outer": {"element_candidates": [], "summary": ""},
            },
            "intra_circle_relations": {
                "inner": {"relations": [], "summary": ""},
                "middle": {"relations": [], "summary": ""},
                "outer": {"relations": [], "summary": ""},
            },
            "cross_circle_flow": {
                "flow_observations": [],
                "summary": "三圈层层向外展开。",
            },
            "evidence_links": [],
        },
    }


def test_load_complete_cases_finds_all_11_cases():
    runner = _load_runner_module()
    cases = runner.load_complete_cases(runner.CASE_ROOT)

    assert len(cases) == 11
    assert cases[0].case_id == "case-001"
    assert cases[-1].case_id == "case-011"
    assert all(case.image_path.exists() for case in cases)
    assert all(case.marked_image_path.exists() for case in cases)
    assert cases[0].source_visual_notes["inner"]
    assert any("蓝色" in item for item in cases[0].source_visual_notes["inner"])
    assert any("笔触" in item for item in cases[0].source_visual_notes["inner"])
    assert any("莲花" in item for item in cases[1].source_visual_notes["inner"])
    assert cases[3].reviewed_visual_notes["inner"]
    assert any("粉色" in item for item in cases[3].reviewed_visual_notes["inner"])


def test_load_complete_cases_can_filter_one_case():
    runner = _load_runner_module()
    cases = runner.load_complete_cases(runner.CASE_ROOT, case_id="case-002")

    assert [case.case_id for case in cases] == ["case-002"]


def test_build_env_check_requires_real_model_routes(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_VISION_FALLBACK_MODEL", raising=False)

    payload = runner.build_env_check_payload(planned_runs=[])

    assert payload["ready"] is False
    assert "AIMANDALA_LLM_API_KEY" in payload["missing_required"]
    assert "AIMANDALA_LLM_VISION_* or AIMANDALA_LLM_VISION_FALLBACK_*" in payload["missing_required"]


def test_build_env_check_accepts_deepseek_and_qwen_dashscope(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "vision-key")
    monkeypatch.setenv(
        "AIMANDALA_LLM_VISION_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "qwen-vl-max-latest")

    payload = runner.build_env_check_payload(planned_runs=[{"case_id": "case-001"}])

    assert payload["ready"] is True
    assert payload["text_model_matches_app"] is True
    assert payload["app_vision_ready"] is True
    assert payload["planned_run_count"] == 1
    assert payload["thinking_mode"] == "off"


def test_build_env_check_accepts_doubao_ark_vision_route(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "vision-key")
    monkeypatch.setenv(
        "AIMANDALA_LLM_VISION_BASE_URL",
        "https://ark.cn-beijing.volces.com/api/v3",
    )
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "ep-20260522000000-test")

    payload = runner.build_env_check_payload(
        planned_runs=[{"case_id": "case-001"}],
        vision_provider="doubao",
    )

    assert payload["ready"] is True
    assert payload["vision_provider"] == "doubao"
    assert payload["app_vision_ready"] is True


def test_build_env_check_records_thinking_mode(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "vision-key")
    monkeypatch.setenv(
        "AIMANDALA_LLM_VISION_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "qwen-vl-max-latest")

    payload = runner.build_env_check_payload(
        planned_runs=[{"case_id": "case-001"}],
        thinking_mode="on",
    )

    assert payload["ready"] is True
    assert payload["thinking_mode"] == "on"


def test_build_env_check_rejects_doubao_without_ark_endpoint(monkeypatch):
    runner = _load_runner_module()
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "text-key")
    monkeypatch.setenv("AIMANDALA_LLM_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("AIMANDALA_LLM_MODEL", "deepseek-v4-pro")
    monkeypatch.setenv("AIMANDALA_LLM_VISION_API_KEY", "vision-key")
    monkeypatch.setenv(
        "AIMANDALA_LLM_VISION_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    monkeypatch.setenv("AIMANDALA_LLM_VISION_MODEL", "qwen-vl-max-latest")

    payload = runner.build_env_check_payload(
        planned_runs=[{"case_id": "case-001"}],
        vision_provider="doubao",
    )

    assert payload["ready"] is False
    assert "Doubao/Volcengine Ark vision route with ep-* model endpoint" in payload["missing_required"]


def test_render_review_markdown_contains_foundation_review_tables():
    runner = _load_runner_module()
    case = runner.load_complete_cases(runner.CASE_ROOT, case_id="case-001")[0]
    markdown = runner._render_review_markdown(  # noqa: SLF001 - template helper coverage.
        case=case,
        foundation_image_reading=_sample_foundation_payload(),
    )

    assert "# case-001 foundation_image_reading 审核" in markdown
    assert "## 原文对画面内容的描述" in markdown
    assert "### 整体画面" in markdown
    assert "## 人工审核区视觉基准摘录" in markdown
    assert "## 原文、人工基准与模型对照" in markdown
    assert "| 圈层 | 原文对画面内容的描述 | 人工审核区视觉基准 | 模型识别重点 | 初步差异提示 | 人工审核结论 |" in markdown
    assert "## 圈内五行识别" in markdown
    assert "## 三圈能量流动" in markdown
    assert "inner-001" in markdown


def test_comparison_table_does_not_fallback_reviewed_notes_into_source_column():
    runner = _load_runner_module()
    case = runner.CompleteCaseFoundationInput(
        case_id="case-test",
        case_path=Path("case-test.md"),
        image_path=Path("case-test-mandala.jpg"),
        marked_image_path=Path("case-test-mandala-3q.jpg"),
        title="测试案例",
        topic_tags="测试",
        source_visual_notes={"global": [], "inner": [], "middle": [], "outer": []},
        reviewed_visual_notes={
            "global": [],
            "inner": ["内圈：人工审核区粉色圆形。"],
            "middle": [],
            "outer": [],
        },
    )

    sections = runner._source_model_comparison_sections(  # noqa: SLF001 - template helper coverage.
        case=case,
        foundation_image_reading=_sample_foundation_payload(),
    )

    inner_row = next(row for row in sections if row.startswith("| 内圈 |"))
    cells = [cell.strip() for cell in inner_row.strip("|").split("|")]
    assert cells[1] == "原文未提取到明确的画面内容描述。"
    assert cells[2] == "内圈：人工审核区粉色圆形。"


def test_source_model_comparison_hints_missing_blank_space():
    runner = _load_runner_module()
    hint = runner._comparison_hint("中圈有粉红色和白色，白色是金属性。", "中圈粉色花瓣。")

    assert "模型可能漏掉：白色" in hint
    assert "模型可能漏掉：金" in hint


def test_refresh_existing_reviews_uses_existing_foundation_json_without_model(tmp_path):
    runner = _load_runner_module()
    case = runner.load_complete_cases(runner.CASE_ROOT, case_id="case-001")[0]
    output_dir = tmp_path / "case-001"
    output_dir.mkdir(parents=True)
    (output_dir / "foundation_image_reading.json").write_text(
        """{
  "stage": "foundation-image-reading",
  "status": "complete",
  "foundation_image_reading": {
    "visual_observation": {
      "overall_observation": {
        "first_impression": "整体清透",
        "main_visual_content": "内圈蓝色",
        "visual_atmosphere": "柔和",
        "visual_weight_and_rhythm": "规整"
      },
      "three_circle_observation": {
        "inner": "内圈蓝色。",
        "middle": "中圈粉色。",
        "outer": "外圈紫色。",
        "cross_circle_visual_connection": "三圈展开。"
      },
      "circle_visual_units": {
        "inner": {
          "composition_description": "内圈蓝色。",
          "visual_units": [
            {
              "id": "inner-001",
              "unit_name": "蓝色圆形",
              "source_type": "user_painted",
              "color_description": "蓝色",
              "shape_description": "圆形",
              "spatial_relations": "位于中心。",
              "blank_space_role": "none",
              "rich_visual_description": "内圈蓝色圆形。"
            }
          ]
        }
      }
    },
    "element_sensing": {},
    "intra_circle_relations": {},
    "cross_circle_flow": {"flow_observations": [], "summary": ""},
    "evidence_links": []
  }
}
""",
        encoding="utf-8",
    )

    results = runner.refresh_existing_reviews(output_root=tmp_path, cases=[case])

    assert results == [
        {
            "case_id": "case-001",
            "status": "complete",
            "review_path": str(output_dir / "case-001-review.md"),
        }
    ]
    assert "## 原文、人工基准与模型对照" in (output_dir / "case-001-review.md").read_text(encoding="utf-8")


def test_run_meta_records_provider_and_timing():
    runner = _load_runner_module()
    started_at = runner.datetime(2026, 5, 22, 8, 0, tzinfo=runner.timezone.utc)
    finished_at = runner.datetime(2026, 5, 22, 8, 0, 5, tzinfo=runner.timezone.utc)

    meta = runner._run_meta(  # noqa: SLF001 - metadata helper coverage.
        vision_provider="doubao",
        thinking_mode="on",
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=5.1234,
    )

    assert meta["vision_provider"] == "doubao"
    assert meta["thinking_mode"] == "on"
    assert meta["started_at"] == started_at.isoformat()
    assert meta["finished_at"] == finished_at.isoformat()
    assert meta["duration_seconds"] == 5.123
