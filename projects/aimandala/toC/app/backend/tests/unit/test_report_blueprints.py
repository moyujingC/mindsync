"""Unit tests for report blueprint template configuration."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.report_blueprints import (
    BLUEPRINT_VALIDATION_ISSUES,
    BlueprintValidationIssue,
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    LITE_AWARENESS_TITLES,
    PRO_REPORT_BLUEPRINT,
    PRO_FALLBACK_TEXTS,
    PRO_IMBALANCE_SELECTION_RULES,
    _build_lite_blueprint,
    _build_pro_blueprint,
)


def test_lite_awareness_titles_load_from_template():
    assert LITE_REPORT_BLUEPRINT.awareness_titles == LITE_AWARENESS_TITLES
    assert len(LITE_AWARENESS_TITLES) == 3
    assert LITE_AWARENESS_TITLES[0] == "倾听身体的悄悄话"
    assert LITE_REPORT_BLUEPRINT.story_section_headings[0] == ("base", "### 【起】你的底色")
    assert LITE_REPORT_BLUEPRINT.theme_labels["wealth_career"] == "财富事业"
    assert LITE_REPORT_BLUEPRINT.title_templates["wealth_career"] == "向前先稳住的人"
    assert LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"] == "曼曼的疗愈仪式：给自己一个稳稳的小空间"
    assert LITE_REPORT_BLUEPRINT.structure_labels["stage_color_summary"] == "当前颜色分析会按逐圈颜色、面积与深浅状态输出正式证据。"
    assert LITE_REPORT_BLUEPRINT.structure_labels["section_story"] == "## 你的心灵画像故事"
    assert "overall_impression" in LITE_REPORT_BLUEPRINT.narrative_templates
    assert "missing_story_sections" in LITE_REPORT_BLUEPRINT.narrative_templates
    assert "user_context_from_intention" in LITE_REPORT_BLUEPRINT.narrative_templates


def test_pro_teaser_loads_from_template():
    assert PRO_REPORT_BLUEPRINT.default_teaser == DEFAULT_PRO_TEASER
    assert "失衡类型与对应疗愈建议" in DEFAULT_PRO_TEASER
    assert "first_impression" in PRO_REPORT_BLUEPRINT.narrative_templates
    assert PRO_REPORT_BLUEPRINT.narrative_templates["root_deeper"]
    assert PRO_REPORT_BLUEPRINT.structure_labels["circle_inner"] == "内圈"
    assert PRO_REPORT_BLUEPRINT.status_messages["already_available"] == "一梳 Pro 版报告已可查看。"


def test_pro_imbalance_selection_rules_are_normalized():
    assert PRO_IMBALANCE_SELECTION_RULES
    assert PRO_IMBALANCE_SELECTION_RULES[0].type == "boundary-constriction"
    assert PRO_IMBALANCE_SELECTION_RULES[0].inner_gte == 42
    assert PRO_IMBALANCE_SELECTION_RULES[1].type == "relational-drain"
    assert PRO_IMBALANCE_SELECTION_RULES[1].middle_gte == 74
    assert PRO_IMBALANCE_SELECTION_RULES[2].type == "emotion-congestion"
    assert PRO_IMBALANCE_SELECTION_RULES[2].theme_in == ("health_wellness",)
    assert PRO_IMBALANCE_SELECTION_RULES[3].type == "action-block"
    assert PRO_IMBALANCE_SELECTION_RULES[3].theme_in == ("wealth_career",)


def test_pro_fallback_texts_load_as_dict():
    assert PRO_REPORT_BLUEPRINT.fallback_texts == PRO_FALLBACK_TEXTS
    assert isinstance(PRO_FALLBACK_TEXTS, dict)
    assert PRO_FALLBACK_TEXTS["missing_core_table"] == "当前缺少核心洞察。"


def test_lite_blueprint_merges_partial_template_overrides():
    blueprint = _build_lite_blueprint(
        {
            "story_connectors": {"base": "新的起手"},
            "six_insight_defaults": {"base": {"title": "新的底色标题"}},
        }
    )

    assert blueprint.story_connectors["base"] == "新的起手"
    assert blueprint.story_connectors["block"] == "但好消息是..."
    assert blueprint.six_insight_defaults["base"]["title"] == "新的底色标题"
    assert "content" in blueprint.six_insight_defaults["base"]


def test_pro_blueprint_merges_partial_fallback_texts():
    blueprint = _build_pro_blueprint(
        {
            "fallback_texts": {"missing_core_table": "自定义缺省文案"},
        }
    )

    assert blueprint.fallback_texts["missing_core_table"] == "自定义缺省文案"
    assert blueprint.fallback_texts["missing_healing_sections"] == "当前缺少调节建议。"


def test_current_blueprints_have_no_validation_issues():
    assert BLUEPRINT_VALIDATION_ISSUES == ()


def test_lite_blueprint_validation_reports_missing_keys():
    blueprint = _build_lite_blueprint(
        {
            "awareness_titles": ["只有一个"],
            "awareness_content_templates": ["只写一条"],
            "story_connectors": {"base": ""},
            "theme_labels": {"wealth_career": ""},
            "title_templates": {"default": ""},
            "structure_labels": {"experiment_title": ""},
            "narrative_templates": {"overall_impression": ""},
            "fallback_experiment_card": {"title": ""},
        }
    )

    issues = blueprint.validate()

    assert BlueprintValidationIssue(
        path="lite.story_connectors.base",
        message="缺少必需字段或内容为空。",
    ) in issues
    assert any(issue.path == "lite.awareness_titles" for issue in issues)
    assert any(issue.path == "lite.awareness_content_templates" for issue in issues)
    assert any(issue.path == "lite.theme_labels.wealth_career" for issue in issues)
    assert any(issue.path == "lite.title_templates.default" for issue in issues)
    assert any(issue.path == "lite.structure_labels.experiment_title" for issue in issues)
    assert any(issue.path == "lite.narrative_templates.overall_impression" for issue in issues)
    assert not any(issue.path == "lite.narrative_templates.missing_story_sections" for issue in issues)


def test_pro_blueprint_validation_reports_missing_fallbacks():
    blueprint = _build_pro_blueprint(
        {
            "default_teaser": "",
            "fallback_texts": {"missing_core_table": ""},
            "structure_labels": {"circle_inner": ""},
            "status_messages": {"already_available": ""},
            "narrative_templates": {"first_impression": ""},
            "imbalance_profiles": {},
            "healing_suggestion_templates": {},
            "core_table_labels": [],
        }
    )

    issues = blueprint.validate()

    assert BlueprintValidationIssue(
        path="pro.default_teaser",
        message="Pro teaser 不能为空。",
    ) in issues
    assert any(issue.path == "pro.fallback_texts.missing_core_table" for issue in issues)
    assert any(issue.path == "pro.structure_labels.circle_inner" for issue in issues)
    assert any(issue.path == "pro.status_messages.already_available" for issue in issues)
    assert any(issue.path == "pro.narrative_templates.first_impression" for issue in issues)
    assert not any(issue.path == "pro.narrative_templates.root_deeper" for issue in issues)
    assert any(issue.path == "pro.imbalance_profiles.energy-block" for issue in issues)
    assert any(issue.path == "pro.healing_suggestion_templates.common_tail" for issue in issues)
