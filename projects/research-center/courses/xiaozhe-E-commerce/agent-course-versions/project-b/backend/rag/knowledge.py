"""项目 B 疗愈客服：内置知识片段。把解读服务、工作流产品、价格与交付边界集中成可引用 Citation。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from api.schemas import *
from rag.documents import load_knowledge_citation
from rag.hybrid_retrieval import retrieve_knowledge


@dataclass(frozen=True)
class KnowledgePathResult:
    """稳定知识路径的确定性结果，供 Agent 编排层直接拼装响应。"""

    answer: str
    citations: list[Citation]
    risk_level: RiskLevel
    next_action: NextAction
    needs_human_approval: bool
    cache_hit: bool = False
    rerank: dict[str, Any] | None = None
    retrieval_debug: dict[str, Any] | None = None
    trace_events: tuple[tuple[str, dict[str, Any]], ...] = ()


def low_confidence_result(session_id: str, intent: Intent) -> KnowledgePathResult:
    """纯知识低置信场景保守兜底，不让模型编造未收录的产品事实。"""
    return KnowledgePathResult(
        answer="我没有检索到足够的公开信息来回答这个问题，不能编造。建议你添加咨询师微信，由人工在 24 小时内回复。",
        citations=[],
        risk_level="medium",
        next_action="transfer_to_human",
        needs_human_approval=False,
        trace_events=(
            (
                "rag_low_confidence_fallback",
                {
                    "session_id": session_id,
                    "intent": intent,
                    "hit_count": 0,
                    "retrieval_stage": "pre_retrieval",
                    "pending_action": "transfer_to_human",
                    "status": "low_confidence",
                },
            ),
        ),
    )


def _retrieve_result(session_id: str, user_message: str, intent: Intent) -> KnowledgePathResult:
    """走混合检索拿引用，命中才回答；未命中降级为低置信转人工。"""
    retrieval = retrieve_knowledge(user_message, intent)
    citations = retrieval.citations
    if not citations:
        return low_confidence_result(session_id, intent)
    answer = "；".join(citation.snippet for citation in citations)
    return KnowledgePathResult(
        answer=answer,
        citations=citations,
        risk_level="low",
        next_action="answer_user",
        needs_human_approval=False,
        retrieval_debug=retrieval.debug,
        trace_events=(
            (
                "rag_pre_retrieved",
                {
                    "session_id": session_id,
                    "hit_count": len(citations),
                    "retrieval_stage": "pre_retrieval",
                    "policy_ids": [citation.metadata.get("policy_id") for citation in citations if citation.metadata],
                },
            ),
        ),
    )


def concept_faq_result(session_id: str, user_message: str) -> KnowledgePathResult:
    """认知科普：只回「是什么/适合谁」级别，不越界给疗愈建议。"""
    return _retrieve_result(session_id, user_message, "concept_faq")


def service_intro_result(session_id: str, user_message: str) -> KnowledgePathResult:
    """服务介绍：解读案子与工作流产品的公开介绍。"""
    return _retrieve_result(session_id, user_message, "service_intro")


def pricing_result(session_id: str, user_message: str) -> KnowledgePathResult:
    """价格流程：只引用价格与流程条目，不口头承诺优惠与时效。"""
    return _retrieve_result(session_id, user_message, "pricing_process")


def intake_collect_result(session_id: str) -> KnowledgePathResult:
    """初访收集：识别到明确购买/预约意向，引导留微信并说明后续。"""
    boundary = load_knowledge_citation("delivery_boundary.md")
    answer = (
        "好的，我可以帮你进入预约流程。请添加咨询师微信，并简单说明两件事："
        "1）你想约哪类服务（解读 / 工作流产品）；2）你希望的时间。"
        "咨询师会在 24 小时内回复你，进一步确认细节。"
    )
    return KnowledgePathResult(
        answer=answer,
        citations=[boundary],
        risk_level="medium",
        next_action="transfer_to_human",
        needs_human_approval=False,
        trace_events=(
            (
                "intake_handoff",
                {
                    "session_id": session_id,
                    "pending_action": "transfer_to_human",
                    "status": "waiting_for_contact",
                },
            ),
        ),
    )


def transfer_human_result(session_id: str) -> KnowledgePathResult:
    """转人工：引导留联系方式 + 承诺 24 小时响应，不承诺即时回复。"""
    answer = (
        "这个问题我会转给人工。请添加咨询师微信并留下你的联系方式，"
        "同时简单说明你的诉求；咨询师会在 24 小时内回复你。"
    )
    return KnowledgePathResult(
        answer=answer,
        citations=[],
        risk_level="medium",
        next_action="transfer_to_human",
        needs_human_approval=False,
        trace_events=(
            (
                "transfer_to_human",
                {
                    "session_id": session_id,
                    "pending_action": "transfer_to_human",
                    "response_promise": "within_24h",
                },
            ),
        ),
    )


def ethics_boundary_result(session_id: str) -> KnowledgePathResult:
    """伦理边界外：不诊断、不承诺疗效，明确拒绝并转人工。"""
    answer = (
        "我是一名 AI 接待助理，不做诊断，也不承诺疗效。"
        "关于你的具体情况，建议你联系专业心理咨询师进行评估。"
        "我可以帮你转人工，咨询师会在 24 小时内回复你。"
    )
    return KnowledgePathResult(
        answer=answer,
        citations=[],
        risk_level="medium",
        next_action="transfer_to_human",
        needs_human_approval=False,
        trace_events=(
            (
                "ethics_boundary_triggered",
                {
                    "session_id": session_id,
                    "pending_action": "transfer_to_human",
                    "status": "no_diagnosis_no_efficacy_promise",
                },
            ),
        ),
    )


def crisis_result(session_id: str) -> KnowledgePathResult:
    """危机熔断：固定话术给求助方向，立即转人工，不进行任何干预。"""
    answer = (
        "我很担心你现在的状态。我是一名 AI 助理，无法提供危机干预，"
        "请立即联系你可以信任的人，或拨打当地心理援助热线。"
        "我也会帮你转接人工，咨询师会尽快与你联系。"
    )
    return KnowledgePathResult(
        answer=answer,
        citations=[],
        risk_level="high",
        next_action="transfer_to_human",
        needs_human_approval=False,
        trace_events=(
            (
                "crisis_escalated",
                {
                    "session_id": session_id,
                    "pending_action": "transfer_to_human",
                    "status": "crisis_flagged",
                },
            ),
        ),
    )
