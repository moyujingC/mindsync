"""Tests for the end-to-end mandala interpretation agent."""

from __future__ import annotations

from pathlib import Path

from app.core.mandala_interpretation_agent import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaInterpretationAgent,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.foundation_prompt_pack_builder import (
    FoundationPromptPackBuilder,
)
from app.core.mandala_interpretation_agent.prompt_pack_builder import PromptPackBuilder
from app.core.mandala_interpretation_agent.wealth_prompt_pack_builder import (
    WealthPromptPackBuilder,
)


class StubE2ELLMClient:
    def __init__(self) -> None:
        self.last_prompt_cache_hit_tokens = 12
        self.last_prompt_cache_miss_tokens = 34
        self.last_attempt_trace = [{"model": "stub", "status": "ok"}]
        self.vision_calls: list[dict] = []
        self.text_calls: list[dict] = []
        self.return_structured_first_vision_text = False

    def generate_structured(self, **kwargs):
        self.vision_calls.append(kwargs)
        return (
            "## 整体画面\n"
            "画面先给人一种收住后再展开的感觉，中心稳定，向外有层次地铺开。\n\n"
            "## 三圈观察\n"
            "内圈是蓝色的中心结构，偏向安静、聚焦和向内整合；中圈有粉色与紫色交织的重复元素，像是热情、标准和规则感在相互拉扯；外圈是紫色长方形与大量留白，显得外层更松、更空，也更像在等待被填满。\n\n"
            "## 主要视觉单元\n"
            "可以清楚看到内圈蓝色圆形，中圈粉色花瓣与紫色方块，外圈紫色矩形和留白边界。各单元之间不是孤立出现，而是通过重复、切分和留白形成关系。\n\n"
            "## 留白与相邻关系\n"
            "留白并不是背景噪音，而是画作内部非常重要的一部分。它在中圈和外圈之间形成切分，也让外圈的紫色显得更疏、更多空位。\n\n"
            "## 可供后续解读的视觉重点\n"
            "这幅画最值得保留的视觉线索，是内圈的稳定核心、中圈被切分的重复结构，以及外圈大量留白带来的收缩和未完成感。"
        )

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        if kwargs.get("task") == "vision":
            if "方案 B：单阶段端到端直出" in kwargs.get("user_prompt", ""):
                return (
                    "# 财富议题曼陀罗解读报告\n\n"
                    "## 整体感受\n"
                    "这是一份单阶段直出的财富议题报告。\n\n"
                    "## 财富主线\n"
                    "画面显示财富议题需要从内在稳定走向外在表达。\n"
                )
            if self.return_structured_first_vision_text and "上一轮输出仍然偏结构化" not in kwargs.get("user_prompt", ""):
                return "```json\n{\"visual.circle.inner\": true}\n```"
            return (
                "## 整体画面\n"
                "画面先给人一种收住后再展开的感觉，中心稳定，向外有层次地铺开。\n\n"
                "## 三圈观察\n"
                "内圈是蓝色的中心结构，偏向安静、聚焦和向内整合；中圈有粉色与紫色交织的重复元素，像是热情、标准和规则感在相互拉扯；外圈是紫色长方形与大量留白，显得外层更松、更空，也更像在等待被填满。\n\n"
                "## 主要视觉单元\n"
                "可以清楚看到内圈蓝色圆形，中圈粉色花瓣与紫色方块，外圈紫色矩形和留白边界。各单元之间不是孤立出现，而是通过重复、切分和留白形成关系。\n\n"
                "## 留白与相邻关系\n"
                "留白并不是背景噪音，而是画作内部非常重要的一部分。它在中圈和外圈之间形成切分，也让外圈的紫色显得更疏、更多空位。\n\n"
                "## 可供后续解读的视觉重点\n"
                "这幅画最值得保留的视觉线索，是内圈的稳定核心、中圈被切分的重复结构，以及外圈大量留白带来的收缩和未完成感。"
            )
        return (
            "# 财富议题曼陀罗解读报告\n\n"
            "## 整体感受\n"
            "这幅画先给人的感觉是先收住，再向外展开。\n\n"
            "## 三圈观察\n"
            "内圈较稳，中圈有重复，外圈留白形成边界。\n\n"
            "## 圈内解读\n"
            "画面里能看到五行识别的基础线索。\n\n"
            "## 跨圈衔接\n"
            "三圈之间是先展开后收束的结构。\n\n"
            "## 财富主线\n"
            "财富议题更像是先稳住承载，再进入交换。\n\n"
            "## 后续建议\n"
            "可以先做一个很小的价值表达动作。\n"
        )


def _agent_input(tmp_path: Path) -> MandalaAgentInput:
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention="想看财富卡点",
            painting_feeling="有点紧",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def test_end_to_end_agent_returns_new_contract(tmp_path):
    llm_client = StubE2ELLMClient()
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
    )

    assert "## 整体画面" in result.visual_draft["visual_draft_md"]
    assert "## 三圈观察" in result.visual_draft["visual_draft_md"]
    assert result.prompt_pack_manifest["pack_id"] == "wealth-report-v1.0.0"
    assert result.final_report["report_mode"] == "lite"
    assert result.quality_gate["passed"] is True
    assert result.run_summary["status"] == "complete"
    assert result.run_summary["agent_variant"] == "two_pass_e2e"
    assert result.run_summary["reusable_visual_baseline"] is True
    assert result.run_summary["production_role"] == "default_production"
    assert result.visual_draft["reusable_visual_baseline"] is True
    assert result.run_summary["foundation_prompt_pack"]["pack_id"] == "foundation-vision-v1.0.0"
    assert result.run_summary["wealth_prompt_pack"]["pack_id"] == "wealth-reasoning-v1.0.0"
    vision_text_call = llm_client.text_calls[0]
    report_text_call = llm_client.text_calls[1]
    assert vision_text_call["task"] == "vision"
    assert "00-曼陀罗基础层解读流程.md" in vision_text_call["system_prompt"]
    assert "确认内圈、中圈、外圈的边界" in vision_text_call["user_prompt"]
    assert "标记线不是画作内容" in vision_text_call["user_prompt"]
    assert "10-财富/11-财富议题手册.md" not in vision_text_call["system_prompt"]
    assert "50-结构化知识单元" not in vision_text_call["system_prompt"]
    assert "90-来源原文/01-完整解读案例11例合并原文.md" in vision_text_call["system_prompt"]
    assert "本次视觉观察任务" in vision_text_call["user_prompt"]
    assert "10-财富/10-财富议题翻译层/01-基础信号财富翻译总表.md" in report_text_call["system_prompt"]
    assert "50-结构化知识单元" not in report_text_call["system_prompt"]
    assert "12-财富中的浮现议题回译规则.md" in report_text_call["system_prompt"]


def test_two_pass_rewrites_structured_visual_draft_to_markdown(tmp_path):
    llm_client = StubE2ELLMClient()
    llm_client.return_structured_first_vision_text = True

    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
    )

    assert "```json" not in result.visual_draft["visual_draft_md"]
    assert "visual.circle" not in result.visual_draft["visual_draft_md"]
    assert "## 整体画面" in result.visual_draft["visual_draft_md"]
    assert len([call for call in llm_client.text_calls if call["task"] == "vision"]) == 2


def test_two_pass_visual_draft_does_not_leak_cross_circle_five_elements(tmp_path):
    llm_client = StubE2ELLMClient()
    MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
    )

    vision_prompt = llm_client.text_calls[0]["user_prompt"]
    assert "确认内圈、中圈、外圈的边界" in vision_prompt
    assert "标记线不是画作内容" in vision_prompt


def test_quality_gate_flags_cross_circle_five_element_leak():
    from app.core.mandala_interpretation_agent.quality_gate import run_quality_gate

    quality = run_quality_gate(
        visual_draft={
            "visual_draft_md": "## 三圈能量流动\n这里出现水克火与金克火。",
        },
        prompt_pack_manifest={"pack_id": "wealth-report-v1.0.0"},
        final_report_md="# 财富议题曼陀罗解读报告",
        final_report={"report_id": "report-1"},
    )

    assert quality["passed"] is False
    assert "visual_draft_cross_circle_five_element_leak" in quality["failure_ids"]


def test_quality_gate_does_not_flag_normal_flow_words():
    from app.core.mandala_interpretation_agent.quality_gate import run_quality_gate

    quality = run_quality_gate(
        visual_draft={
            "visual_draft_md": "## 三圈能量流动\n内圈能量形成承接，外圈趋于堵塞。",
        },
        prompt_pack_manifest={"pack_id": "wealth-report-v1.0.0"},
        final_report_md="# 财富议题曼陀罗解读报告",
        final_report={"report_id": "report-1"},
    )

    assert quality["passed"] is True
    assert quality["details"]["cross_circle_leaked_terms"] == []


def test_single_pass_agent_variant_generates_report_with_one_vision_text_call(tmp_path):
    llm_client = StubE2ELLMClient()
    agent_input = _agent_input(tmp_path)
    single_pass_input = MandalaAgentInput(
        report_mode=agent_input.report_mode,
        image=agent_input.image,
        user_context=agent_input.user_context,
        circle_boundaries=agent_input.circle_boundaries,
        agent_variant="single_pass_e2e",
        output_requirements=agent_input.output_requirements,
    )

    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=single_pass_input,
    )

    assert result.run_summary["agent_variant"] == "single_pass_e2e"
    assert result.visual_draft["mode"] == "internal_visual_reasoning"
    assert result.visual_draft["reusable_visual_baseline"] is False
    assert result.run_summary["reusable_visual_baseline"] is False
    assert result.run_summary["production_role"] == "ab_experiment_only"
    assert llm_client.vision_calls == []
    assert len(llm_client.text_calls) == 1
    assert llm_client.text_calls[0]["task"] == "vision"
    assert llm_client.text_calls[0]["image_paths"]
    assert "方案 B：单阶段端到端直出" in llm_client.text_calls[0]["user_prompt"]
    assert "00-曼陀罗基础层解读流程.md" in llm_client.text_calls[0]["system_prompt"]
    assert "50-结构化知识单元" not in llm_client.text_calls[0]["system_prompt"]
    assert "10-财富/10-财富议题翻译层/01-基础信号财富翻译总表.md" in llm_client.text_calls[0]["system_prompt"]
    assert result.quality_gate["passed"] is True


def test_pro_report_mode_remains_internal_prelaunch(tmp_path):
    llm_client = StubE2ELLMClient()
    agent_input = _agent_input(tmp_path)
    pro_input = MandalaAgentInput(
        report_mode="pro",
        image=agent_input.image,
        user_context=agent_input.user_context,
        circle_boundaries=agent_input.circle_boundaries,
        agent_variant="two_pass_e2e",
        output_requirements=agent_input.output_requirements,
    )

    result = MandalaInterpretationAgent(llm_client=llm_client).run(agent_input=pro_input)

    assert pro_input.is_public_mode() is False
    assert result.final_report["report_mode"] == "pro"
    assert "一梳 Pro 版" in llm_client.text_calls[1]["system_prompt"]
    assert "一镜 Lite 版" not in llm_client.text_calls[1]["system_prompt"]


def test_prompt_pack_builder_uses_real_files():
    pack = PromptPackBuilder().build()

    assert pack.pack_id == "wealth-report-v1.0.0"
    assert pack.manifest["file_count"] == 2
    assert pack.manifest["prompt_budget"]["estimated_tokens"] > 0
    assert pack.manifest["prompt_budget"]["warning_level"] == "none"
    assert "财富议题" in pack.stable_prefix
    assert "财务预测" in pack.stable_prefix
    assert "一镜 Lite 版" in pack.stable_prefix


def test_prompt_pack_builder_uses_pro_files():
    pack = PromptPackBuilder(report_mode="pro").build()

    assert pack.pack_id == "wealth-report-v1.0.0"
    assert pack.manifest["file_count"] == 2
    assert "一梳 Pro 版" in pack.stable_prefix
    assert "一镜 Lite 版" not in pack.stable_prefix


def test_foundation_prompt_pack_builder_uses_mandala_foundation_documents():
    pack = FoundationPromptPackBuilder().build()

    assert pack.pack_id == "foundation-vision-v1.0.0"
    assert pack.manifest["file_count"] >= 20
    assert pack.manifest["char_count"] > 50000
    assert pack.manifest["prompt_budget"]["estimated_tokens"] > 50000
    assert pack.manifest["prompt_budget"]["remaining_tokens"] > 0
    assert pack.manifest["prompt_budget"]["warning_level"] == "none"
    assert "00-曼陀罗基础层解读流程.md" in pack.stable_prefix
    assert "20-圈内五行解读/五行生克/01-木生火.md" in pack.stable_prefix
    assert "01-画面信号总目录.md" not in pack.stable_prefix
    assert "40-组合模式/12-高频组合模式.md" not in pack.stable_prefix
    assert "visual.circle.inner" not in pack.stable_prefix
    assert "10-财富/11-财富议题手册.md" not in pack.stable_prefix
    assert "50-结构化知识单元" not in pack.stable_prefix
    assert "90-来源原文/01-完整解读案例11例合并原文.md" in pack.stable_prefix


def test_wealth_prompt_pack_builder_uses_topic_and_report_documents():
    pack = WealthPromptPackBuilder().build()

    assert pack.pack_id == "wealth-reasoning-v1.0.0"
    assert pack.manifest["file_count"] >= 19
    assert pack.manifest["char_count"] > 60000
    assert pack.manifest["prompt_budget"]["estimated_tokens"] > 50000
    assert pack.manifest["prompt_budget"]["remaining_tokens"] > 0
    assert pack.manifest["prompt_budget"]["warning_level"] == "none"
    assert "10-财富/11-财富议题手册.md" in pack.stable_prefix
    assert "10-财富/10-财富议题翻译层/01-基础信号财富翻译总表.md" in pack.stable_prefix
    assert "50-结构化知识单元" not in pack.stable_prefix
    assert "10-财富/12-财富中的浮现议题回译规则.md" in pack.stable_prefix
    assert "30-应用适配/10-aimandala/07-报告语言风格指南.md" in pack.stable_prefix


def test_generated_prompt_pack_precedence(tmp_path):
    generated_root = tmp_path / "generated_prompt_packs"
    foundation_dir = generated_root / "foundation-vision-v1.0.0"
    foundation_dir.mkdir(parents=True)
    (foundation_dir / "prompt.md").write_text("generated foundation", encoding="utf-8")
    (foundation_dir / "manifest.json").write_text(
        '{"pack_id":"foundation-vision-v1.0.0","file_order":["a.md"],"file_count":1,"char_count":20,"pack_hash":"abc","build_mode":"generated"}',
        encoding="utf-8",
    )

    pack = FoundationPromptPackBuilder(generated_root=generated_root).build()

    assert pack.stable_prefix == "generated foundation"
    assert pack.manifest["build_mode"] == "generated"
    assert pack.pack_id == "foundation-vision-v1.0.0"
    assert pack.manifest["prompt_budget"]["estimated_tokens"] > 0
