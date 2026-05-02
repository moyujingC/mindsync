"""Unit tests for migrated V2 prompt builder."""

import os
import sys
import json

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.prompt.builder_v2 import PromptBuilder, PromptTemplate


def test_prompt_template_loads_lite_template_and_schema():
    template = PromptTemplate(version="1.6", report_type="lite")

    content = template.load()
    schema = template.load_schema()

    assert "一镜 Lite 版解读报告模板 v1.6" in content
    assert "第一段必须尽快命中用户当前状态" in content
    assert "六段故事要像旧版一样形成递进" in content
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
    assert "不是 Lite 扩写版" in prompt


def test_prompt_builder_includes_lite_knowledge_skeleton_block():
    builder = PromptBuilder()

    prompt = builder.build_lite(
        vision_data='{"theme":"wealth_career"}',
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        extra_context={
            "theme_label": "财富事业",
            "knowledge_skeleton": (
                "- 已确定标题：向前先稳住的人\n"
                "- 已确定主判断：这次的主轴不是冲刺，而是先把内在承载接回来。"
            ),
        },
    )

    assert "知识骨架（已确定，不要改写判断）" in prompt
    assert "- 已确定标题：向前先稳住的人" in prompt
    assert "请只做语言润色，不要新增判断" in prompt
    assert "你的目标不是只把字段填满" in prompt


def test_prompt_builder_includes_pro_knowledge_skeleton_block():
    builder = PromptBuilder()

    prompt = builder.build_pro(
        vision_data='{"theme":"intimate_relationship"}',
        theme="intimate_relationship",
        theme_context="- 当前主题：亲密关系",
        extra_context={
            "theme_label": "亲密关系",
            "knowledge_skeleton": (
                "- 已确定核心失衡：关系耗散\n"
                "- 已确定转化方向：先把回应外界的速度慢下来。"
            ),
        },
    )

    assert "知识骨架（已确定，不要改写判断）" in prompt
    assert "- 已确定核心失衡：关系耗散" in prompt
    assert "你只能润色这些既有判断" in prompt
    assert "这是一份独立深度报告，不是 Lite 扩写版" in prompt


def test_prompt_builder_preserves_evidence_first_knowledge_skeleton_json():
    builder = PromptBuilder()
    skeleton = json.dumps(
        {
            "generation_mode": "evidence_first",
            "runtime_evidence": {"visual_facts": {"circle_boundaries": {}}},
            "narrative_plan": {"mode": "lite", "sections": {"title": {"content": "向内站稳的人"}}},
            "compatibility_projection": {"title": "向内站稳的人"},
        },
        ensure_ascii=False,
        indent=2,
    )

    prompt = builder.build_lite(
        vision_data='{"theme":"wealth_career"}',
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        extra_context={
            "theme_label": "财富事业",
            "knowledge_skeleton": skeleton,
        },
    )

    assert '"runtime_evidence"' in prompt
    assert '"narrative_plan"' in prompt
    assert '"compatibility_projection"' in prompt
