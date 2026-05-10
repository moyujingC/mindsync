"""Unit tests for the stage-based prompt builder."""

import os
import sys
import json

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.prompt.builder_v2 import PromptBuilder


def test_prompt_builder_builds_lite_prompt_without_legacy_template_files():
    builder = PromptBuilder()
    stage_process_package = json.dumps(
        {
            "process_contract": {
                "generation_mode": "stage_based_runtime",
                "target_report": "lite",
            },
        },
        ensure_ascii=False,
        indent=2,
    )

    prompt = builder.build_lite(
        vision_data=stage_process_package,
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        stage_process_package=stage_process_package,
    )

    assert "第13步 Lite 报告生成 Prompt" in prompt
    assert "三圈五行流派 Lite 报告写作者" in prompt
    assert "lite-visual-basis-summary" in prompt
    assert "lite_v1.6" not in prompt


def test_prompt_builder_builds_lite_prompt_with_context():
    builder = PromptBuilder()
    stage_process_package = json.dumps(
        {
            "process_contract": {
                "generation_mode": "stage_based_retrieved_evidence",
                "target_report": "lite",
            },
            "stage-01-user-input-context": {
                "theme": "wealth_career",
            },
        },
        ensure_ascii=False,
        indent=2,
    )

    prompt = builder.build_lite(
        vision_data=stage_process_package,
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        stage_process_package=stage_process_package,
        extra_context={"theme_label": "财富事业"},
    )

    assert "stage_based_retrieved_evidence" in prompt
    assert "- 当前主题：财富事业" in prompt
    assert "Theme id: wealth_career" in prompt


def test_prompt_builder_builds_pro_prompt_with_context():
    builder = PromptBuilder()
    stage_process_package = json.dumps(
        {
            "process_contract": {
                "generation_mode": "stage_based_retrieved_evidence",
                "target_report": "pro",
            },
            "stage-12-healing-direction-and-report-branching": {
                "report_writing_inputs": {"pro": {"root_cause": {"core": "关系耗散"}}},
            },
        },
        ensure_ascii=False,
        indent=2,
    )

    prompt = builder.build_pro(
        vision_data=stage_process_package,
        theme="intimate_relationship",
        theme_context="- 当前主题：亲密关系",
        stage_process_package=stage_process_package,
    )

    assert "stage_based_retrieved_evidence" in prompt
    assert "- 当前主题：亲密关系" in prompt
    assert "第14步 Pro 报告生成 Prompt" in prompt
    assert "不是 Lite 的加长版" in prompt


def test_prompt_builder_includes_lite_stage_process_package_block():
    builder = PromptBuilder()

    prompt = builder.build_lite(
        vision_data='{"theme":"wealth_career"}',
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        stage_process_package=json.dumps(
            {
                "process_contract": {
                    "generation_mode": "stage_based_retrieved_evidence",
                    "target_report": "lite",
                },
                "stage-12-healing-direction-and-report-branching": {
                    "report_writing_inputs": {
                        "lite": {"title": "向前先稳住的人"},
                    },
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        extra_context={"theme_label": "财富事业"},
    )

    assert "Stage 过程交付物" in prompt
    assert '"stage_based_retrieved_evidence"' in prompt
    assert "向前先稳住的人" in prompt
    assert "只使用输入中已有的证据和判断" in prompt
    assert "lite-small-step-healing-card" in prompt


def test_prompt_builder_includes_pro_stage_process_package_block():
    builder = PromptBuilder()

    prompt = builder.build_pro(
        vision_data='{"theme":"intimate_relationship"}',
        theme="intimate_relationship",
        theme_context="- 当前主题：亲密关系",
        stage_process_package=json.dumps(
            {
                "process_contract": {
                    "generation_mode": "stage_based_retrieved_evidence",
                    "target_report": "pro",
                },
                "stage-12-healing-direction-and-report-branching": {
                    "report_writing_inputs": {
                        "pro": {"imbalance_profile": {"primary": "关系耗散"}},
                    },
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        extra_context={"theme_label": "亲密关系"},
    )

    assert "Stage 过程交付物" in prompt
    assert '"target_report": "pro"' in prompt
    assert "关系耗散" in prompt
    assert "所有核心判断都必须能回到前置 stage" in prompt
    assert "pro-root-cause-chain" in prompt


def test_prompt_builder_preserves_stage_process_package_json():
    builder = PromptBuilder()
    stage_package = json.dumps(
        {
            "process_contract": {
                "generation_mode": "stage_based_retrieved_evidence",
                "target_report": "lite",
            },
            "stage-03-visual-evidence": {
                "global_visual_summary": "中心收拢，外圈展开。",
            },
            "stage-09-evidence-consolidation": {
                "knowledge_refs": ["direct_judgment.closed_heart"],
            },
            "stage-12-healing-direction-and-report-branching": {
                "report_writing_inputs": {"lite": {"title": "向内站稳的人"}},
            },
        },
        ensure_ascii=False,
        indent=2,
    )

    prompt = builder.build_lite(
        vision_data=stage_package,
        theme="wealth_career",
        theme_context="- 当前主题：财富事业",
        stage_process_package=stage_package,
        extra_context={"theme_label": "财富事业"},
    )

    assert '"process_contract"' in prompt
    assert '"stage-03-visual-evidence"' in prompt
    assert '"stage-09-evidence-consolidation"' in prompt
    assert '"stage-12-healing-direction-and-report-branching"' in prompt
    assert "stage_process_package" in prompt
