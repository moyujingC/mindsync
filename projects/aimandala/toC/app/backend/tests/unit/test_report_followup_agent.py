from __future__ import annotations

from app.core.mandala_interpretation_agent.contracts import (
    ReportFollowupContext,
    ReportFollowupInput,
    ReportPersona,
    ReportSectionReference,
)
from app.core.mandala_interpretation_agent.report_followup_agent import ReportFollowupAgent
from app.core.mandala_interpretation_agent.report_followup_context import build_report_section_map


class StubFollowupLLMClient:
    def __init__(self, answer: str) -> None:
        self.answer = answer
        self.text_calls = []

    def generate_structured(self, **kwargs):
        raise AssertionError("followup agent should not call generate_structured")

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        return self.answer


def _followup_input(question: str) -> ReportFollowupInput:
    return ReportFollowupInput(
        context=ReportFollowupContext(
            report_id="report-1",
            report_mode="lite",
            theme_label="财富关系",
            painting_intention="想看财富卡点",
            painting_feeling="有点紧",
            final_report_md=(
                "# 财富关系曼陀罗解读报告\n\n"
                "## 三圈观察\n内圈较稳，中圈有重复，外圈留白形成边界。\n\n"
                "## 后续建议\n可以先做一个很小的价值表达动作。"
            ),
            final_report={"report_id": "report-1", "persona": ReportPersona().to_dict()},
            visual_draft={"visual_draft_md": "## 三圈观察\n内圈较稳，中圈有重复。"},
            report_sections=[
                ReportSectionReference(
                    section_id="section-1",
                    title="三圈观察",
                    excerpt="内圈较稳，中圈有重复，外圈留白形成边界。",
                ),
                ReportSectionReference(
                    section_id="section-2",
                    title="后续建议",
                    excerpt="可以先做一个很小的价值表达动作。",
                ),
            ],
            persona=ReportPersona(),
        ),
        question=question,
    )


def test_report_followup_agent_answers_with_report_context():
    llm_client = StubFollowupLLMClient("这对应报告里的三圈观察：内圈较稳，中圈有重复。")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("这段三圈观察是什么意思？")
    )

    assert result.report_id == "report-1"
    assert "三圈观察" in result.answer_md
    assert result.persona["persona_id"] == "manman"
    assert result.safety["precheck"]["passed"] is True
    assert result.safety["postcheck"]["passed"] is True
    assert llm_client.text_calls
    assert "曼曼" in llm_client.text_calls[0]["system_prompt"]
    assert "本次报告全文" in llm_client.text_calls[0]["user_prompt"]
    assert "section-1｜三圈观察" in llm_client.text_calls[0]["user_prompt"]
    assert "内圈较稳" in llm_client.text_calls[0]["user_prompt"]
    assert result.referenced_report_sections[0]["section_id"] == "section-1"


def test_report_followup_precheck_blocks_diagnostic_request():
    llm_client = StubFollowupLLMClient("不应调用")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("我是不是抑郁症？")
    )

    assert result.out_of_scope is True
    assert "followup_diagnostic_request" in result.safety["failure_ids"]
    assert "不能做心理诊断" in result.answer_md
    assert llm_client.text_calls == []


def test_report_section_map_extracts_markdown_sections():
    sections = build_report_section_map(
        "# 财富关系曼陀罗解读报告\n\n开头摘要。\n\n## 三圈观察\n内圈较稳，中圈有重复。"
    )

    assert [section.title for section in sections] == ["财富关系曼陀罗解读报告", "三圈观察"]
    assert sections[1].section_id == "section-2"
    assert "内圈较稳" in sections[1].excerpt


def test_report_followup_blocks_financial_decision_request():
    llm_client = StubFollowupLLMClient("不应调用")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("我应该买哪只股票？")
    )

    assert result.out_of_scope is True
    assert "followup_financial_decision_request" in result.safety["failure_ids"]
    assert "不能提供财务预测" in result.answer_md
    assert llm_client.text_calls == []


def test_report_followup_blocks_crisis_request():
    llm_client = StubFollowupLLMClient("不应调用")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("我不想活了怎么办？")
    )

    assert result.out_of_scope is True
    assert "followup_crisis_risk" in result.safety["failure_ids"]
    assert "优先联系身边可信任的人" in result.answer_md
    assert llm_client.text_calls == []


def test_report_followup_keeps_recent_turns_without_long_term_memory():
    base_input = _followup_input("刚才那条建议能再解释一下吗？")
    base = base_input.context
    context = ReportFollowupContext(
        report_id=base.report_id,
        report_mode=base.report_mode,
        theme=base.theme,
        theme_label=base.theme_label,
        painting_intention=base.painting_intention,
        painting_feeling=base.painting_feeling,
        final_report_md=base.final_report_md,
        final_report=base.final_report,
        visual_draft=base.visual_draft,
        report_sections=base.report_sections,
        recent_followup_turns=[
            {"role": "user", "content": "报告里最重要的一句话是什么？"},
            {"role": "assistant", "content": "可以先看后续建议。"},
            {"role": "system", "content": "不应进入 prompt"},
        ],
        persona=base.persona,
    )
    llm_client = StubFollowupLLMClient("这对应报告里的后续建议。")
    ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=ReportFollowupInput(context=context, question=base_input.question)
    )

    user_prompt = llm_client.text_calls[0]["user_prompt"]
    assert "用户：报告里最重要的一句话是什么？" in user_prompt
    assert "曼曼：可以先看后续建议。" in user_prompt
    assert "system" not in user_prompt


def test_report_followup_postcheck_replaces_overreach_answer():
    llm_client = StubFollowupLLMClient("我是你的心理咨询师，我会一直陪着你。")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("报告里最重要的一句话是什么？")
    )

    assert result.out_of_scope is False
    assert "followup_answer_persona_boundary_overreach" in result.safety["postcheck"]["failure_ids"]
    assert "曼曼只能解释本次报告和画面线索" in result.answer_md
