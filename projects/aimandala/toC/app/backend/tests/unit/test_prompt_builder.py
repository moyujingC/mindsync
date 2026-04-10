"""Unit tests for migrated V2 prompt builder."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.prompt.builder_v2 import PromptBuilder, PromptTemplate


def test_prompt_template_loads_lite_template_and_schema():
    template = PromptTemplate(version="1.6", report_type="lite")

    content = template.load()
    schema = template.load_schema()

    assert "一镜 Lite 版解读报告模板 v1.6" in content
    assert schema["type"] == "lite"
    assert schema["version"] == "1.6"


def test_prompt_builder_builds_lite_prompt_with_context():
    builder = PromptBuilder()

    prompt = builder.build_lite(
        vision_data='{"theme":"wealth_career"}',
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        extra_context={"theme_label": "财富事业"},
    )

    assert '{"theme":"wealth_career"}' in prompt
    assert "- 当前主题：财富事业" in prompt
    assert "在「财富事业」中的具体表现" in prompt


def test_prompt_builder_builds_pro_prompt_with_context():
    builder = PromptBuilder()

    prompt = builder.build_pro(
        vision_data='{"theme":"intimate_relationship"}',
        theme="intimate_relationship",
        theme_context="- 当前主题：亲密关系",
    )

    assert '{"theme":"intimate_relationship"}' in prompt
    assert "- 当前主题：亲密关系" in prompt
    assert "一梳 Pro 版解读报告模板 v1.6" in prompt
