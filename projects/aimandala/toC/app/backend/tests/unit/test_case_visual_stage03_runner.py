"""Tests for the complete-case stage-03 visual recognition runner."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "run_case_visual_stage03.py"
)


def _load_runner_module():
    spec = importlib.util.spec_from_file_location(
        "run_case_visual_stage03",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


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
    assert any("绘画者近期开始向内探索" in item for item in cases[0].source_visual_notes["inner"])
    assert any("莲花形状" in item for item in cases[1].source_visual_notes["inner"])
    assert any("说明绘画者" in item for item in cases[1].source_visual_notes["inner"])
    assert any("枝桠" in item for item in cases[9].source_visual_notes["middle"])
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


def test_render_review_markdown_contains_visual_review_table():
    runner = _load_runner_module()
    case = runner.load_complete_cases(runner.CASE_ROOT, case_id="case-001")[0]
    markdown = runner._render_review_markdown(  # noqa: SLF001 - template helper coverage.
        case=case,
        stage03={
            "global_visual_summary": "内圈蓝色，中圈粉色，外圈紫色。",
            "excluded_marks": [],
            "uncertainties": [],
            "circles": {
                "inner": {
                    "summary": "内圈蓝色。",
                    "visual_units": [
                        {
                            "id": "inner-001",
                            "source_type": "user_painted",
                            "include_in_interpretation": True,
                            "color": "蓝色",
                            "shape": "圆形",
                            "is_blank_space": False,
                            "metal_candidate": False,
                            "visible_evidence": "内圈蓝色圆形。",
                        }
                    ],
                }
            },
        },
    )

    assert "# case-001 stage-03 视觉识别审核" in markdown
    assert "## 原文对画面内容的描述" in markdown
    assert "### 整体画面" in markdown
    assert "## 人工审核区视觉基准摘录" in markdown
    assert "## 原文、人工基准与模型对照" in markdown
    assert "| 圈层 | 原文对画面内容的描述 | 人工审核区视觉基准 | 大模型识别重点 | 初步差异提示 | 人工审核结论 |" in markdown
    assert "三圈标记线是否被误识别为画作元素" in markdown
    assert "inner-001" in markdown


def test_comparison_table_does_not_fallback_reviewed_notes_into_source_column():
    runner = _load_runner_module()
    case = runner.CompleteCaseVisualInput(
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
        stage03={"circles": {"inner": {"summary": "内圈粉色圆形。"}}},
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


def test_refresh_existing_reviews_uses_existing_stage03_without_model(tmp_path):
    runner = _load_runner_module()
    case = runner.load_complete_cases(runner.CASE_ROOT, case_id="case-001")[0]
    output_dir = tmp_path / "case-001"
    output_dir.mkdir(parents=True)
    (output_dir / "stage03_visual_evidence.json").write_text(
        """{
  "global_visual_summary": "内圈蓝色。",
  "excluded_marks": [],
  "uncertainties": [],
  "circles": {
    "inner": {
      "summary": "内圈蓝色。",
      "visual_units": [
        {
          "id": "inner-001",
          "source_type": "user_painted",
          "include_in_interpretation": true,
          "color": "蓝色",
          "shape": "圆形",
          "is_blank_space": false,
          "metal_candidate": false,
          "visible_evidence": "内圈蓝色圆形。"
        }
      ]
    }
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
            "review_path": str(output_dir / "review.md"),
        }
    ]
    assert "## 原文、人工基准与模型对照" in (output_dir / "review.md").read_text(encoding="utf-8")
