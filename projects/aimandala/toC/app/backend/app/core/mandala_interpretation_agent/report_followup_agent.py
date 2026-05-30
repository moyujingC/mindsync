"""Report-bound follow-up agent for Aimandala reports."""

from __future__ import annotations

from typing import Any

from app.core.llm.runtime import LLMClient

from .contracts import ReportFollowupInput, ReportFollowupResult
from .quality_gate import run_followup_answer_gate

CRISIS_TERMS = ["自杀", "自伤", "不想活", "活不下去", "伤害别人", "杀了", "被伤害"]
DIAGNOSTIC_REQUEST_TERMS = ["抑郁症", "焦虑症", "人格障碍", "诊断", "病吗", "吃药", "药物"]
FINANCIAL_DECISION_TERMS = ["买哪只股票", "投资什么", "收益预测", "会赚钱吗", "财务预测"]
OUT_OF_SCOPE_TERMS = ["上次", "长期人格", "永久记住", "以后任何事", "替我决定", "帮我决定"]


class ReportFollowupAgent:
    """Answer follow-up questions only within the current report context."""

    def __init__(self, *, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    def run(self, *, followup_input: ReportFollowupInput) -> ReportFollowupResult:
        context = followup_input.context
        question = followup_input.question.strip()
        precheck = run_followup_precheck(question)
        if not precheck["passed"]:
            return ReportFollowupResult(
                report_id=context.report_id,
                answer_md=str(precheck["safe_reply"]),
                referenced_report_sections=[],
                safety=precheck,
                out_of_scope=True,
                persona=context.persona.to_dict(),
            )

        answer_md = self.llm_client.generate_text(
            task="chat",
            system_prompt=self._build_system_prompt(followup_input),
            user_prompt=self._build_user_prompt(followup_input),
            disable_thinking=False,
        )
        if not answer_md or not answer_md.strip():
            raise RuntimeError("followup_chat_model_failed: empty answer")
        answer_md = answer_md.strip()
        postcheck = run_followup_answer_gate(answer_md)
        if not postcheck["passed"]:
            answer_md = _boundary_reply()
        return ReportFollowupResult(
            report_id=context.report_id,
            answer_md=answer_md,
            referenced_report_sections=_extract_referenced_sections(answer_md, context.final_report_md),
            safety={
                "precheck": precheck,
                "postcheck": postcheck,
            },
            out_of_scope=False,
            persona=context.persona.to_dict(),
        )

    def _build_system_prompt(self, followup_input: ReportFollowupInput) -> str:
        persona = followup_input.context.persona
        return "\n".join(
            [
                f"你是{persona.display_name}，{persona.role_label}。",
                "你只能基于本次画作和本次报告回答用户追问。",
                "不要回答开放式百科问题，不要跨报告总结用户长期人格，不要暗示长期记忆。",
                "不要自称心理咨询师、治疗师、真实疗愈师或长期陪伴者。",
                "不要提供医疗建议、心理诊断、财务预测、投资建议或重大现实决策。",
                "回答需要引用或点明本次报告中的具体段落、标题或画面线索。",
                "如果问题偏离报告，请温和拉回本次画作和报告内容。",
                "回答 2-4 个短段落即可，语气温和、具体、克制。",
            ]
        )

    def _build_user_prompt(self, followup_input: ReportFollowupInput) -> str:
        context = followup_input.context
        history_lines = []
        for item in context.recent_followup_turns[-6:]:
            role = item.get("role")
            content = str(item.get("content") or "").strip()
            if role not in {"user", "assistant"} or not content:
                continue
            history_lines.append(f"{'用户' if role == 'user' else '曼曼'}：{content}")
        return "\n\n".join(
            [
                f"report_id：{context.report_id}",
                f"报告模式：{context.report_mode}",
                f"主题：{context.theme_label}",
                f"绘画前意图：{context.painting_intention or '未填写'}",
                f"绘画时感受：{context.painting_feeling or '未填写'}",
                "视觉草稿摘要：",
                _compact_visual_draft(context.visual_draft),
                "本次报告全文：",
                context.final_report_md.strip(),
                "本轮追问历史：",
                "\n".join(history_lines) if history_lines else "无",
                "用户当前问题：",
                followup_input.question.strip(),
            ]
        )


def run_followup_precheck(question: str) -> dict[str, Any]:
    normalized = question.strip().lower()
    if not normalized:
        return {
            "passed": False,
            "failure_ids": ["empty_followup_question"],
            "safe_reply": "你可以输入想继续追问的报告问题，曼曼会基于本次报告陪你看清楚。",
        }
    if _contains_any(normalized, CRISIS_TERMS):
        return {
            "passed": False,
            "failure_ids": ["followup_crisis_risk"],
            "safe_reply": "这个问题已经超出报告解读范围。如果你或他人正处在现实危险中，请优先联系身边可信任的人、当地紧急服务或专业支持。曼曼不能替代危机干预或专业帮助。",
        }
    if _contains_any(normalized, DIAGNOSTIC_REQUEST_TERMS):
        return {
            "passed": False,
            "failure_ids": ["followup_diagnostic_request"],
            "safe_reply": "曼曼不能做心理诊断或医疗判断。我们可以回到本次报告和画面线索，只看这段内容在提醒你留意什么感受或处境。",
        }
    if _contains_any(normalized, FINANCIAL_DECISION_TERMS):
        return {
            "passed": False,
            "failure_ids": ["followup_financial_decision_request"],
            "safe_reply": "曼曼不能提供财务预测、投资建议或替你做现实决策。可以基于这份报告，陪你看清财富关系里正在出现的感受和行动卡点。",
        }
    if _contains_any(normalized, OUT_OF_SCOPE_TERMS):
        return {
            "passed": False,
            "failure_ids": ["followup_out_of_scope"],
            "safe_reply": _boundary_reply(),
        }
    return {"passed": True, "failure_ids": [], "safe_reply": None}


def _contains_any(text: str, terms: list[str]) -> bool:
    return any(term.lower() in text for term in terms)


def _boundary_reply() -> str:
    return "曼曼只能解释本次报告和画面线索，不能替代专业心理咨询、医疗建议、财务建议或重大现实决策。我们可以先回到这份报告里你最在意的一段，看看它具体在说什么。"


def _compact_visual_draft(visual_draft: dict[str, Any] | None) -> str:
    if not isinstance(visual_draft, dict):
        return "无"
    for key in ["visual_draft_md", "visual_observation_md", "summary", "global_visual_summary"]:
        value = visual_draft.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:2000]
    return "无"


def _extract_referenced_sections(answer_md: str, report_md: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    headings = [line.lstrip("#").strip() for line in report_md.splitlines() if line.strip().startswith("#")]
    for heading in headings:
        if heading and heading in answer_md:
            sections.append({"label": heading, "quote": heading})
    if sections:
        return sections[:3]
    first_heading = headings[0] if headings else "本次报告"
    return [{"label": first_heading, "quote": first_heading}]
