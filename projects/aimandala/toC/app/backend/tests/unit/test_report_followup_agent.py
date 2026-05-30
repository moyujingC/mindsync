from __future__ import annotations

from app.core.mandala_interpretation_agent.contracts import (
    ReportFollowupContext,
    ReportFollowupInput,
    ReportPersona,
)
from app.core.mandala_interpretation_agent.report_followup_agent import ReportFollowupAgent


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
    assert "内圈较稳" in llm_client.text_calls[0]["user_prompt"]


def test_report_followup_precheck_blocks_diagnostic_request():
    llm_client = StubFollowupLLMClient("不应调用")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("我是不是抑郁症？")
    )

    assert result.out_of_scope is True
    assert "followup_diagnostic_request" in result.safety["failure_ids"]
    assert "不能做心理诊断" in result.answer_md
    assert llm_client.text_calls == []


def test_report_followup_postcheck_replaces_overreach_answer():
    llm_client = StubFollowupLLMClient("我是你的心理咨询师，我会一直陪着你。")
    result = ReportFollowupAgent(llm_client=llm_client).run(
        followup_input=_followup_input("报告里最重要的一句话是什么？")
    )

    assert result.out_of_scope is False
    assert "followup_answer_persona_boundary_overreach" in result.safety["postcheck"]["failure_ids"]
    assert "曼曼只能解释本次报告和画面线索" in result.answer_md
