"""第 08 课客服 Agent 编排。

这里负责串起粗意图、RAG 检索、Prompt 渲染、模型调用和成本观察。
真正贴近生产的 Agent 不是一个巨大的 route handler，而是一条可拆开测试的链路。
"""

from __future__ import annotations

import httpx

from api.schemas import ChatRequest, ChatResponse, Intent, IntentResult
from cost.observer import build_cost_summary
from models.llm_client import call_chat_model
from rag.knowledge_base import load_knowledge_snippets, render_rag_messages, retrieve_relevant_knowledge


def first_matched_keywords(message: str, keywords: list[str]) -> list[str]:
    """返回用户问题中命中的关键词列表。"""

    return [keyword for keyword in keywords if keyword.lower() in message]


def classify_intent(user_message: str) -> IntentResult:
    """用少量业务关键词识别粗意图，为第 08 课的 RAG 提供检索方向。"""

    message = user_message.strip().lower()
    intent_rules: list[tuple[Intent, list[str], str]] = [
        ("complaint", ["投诉", "举报", "赔偿", "曝光", "315", "别踢皮球"], "用户表达了投诉或强烈不满。"),
        ("refund_request", ["退款", "退货", "取消订单", "坏了", "无法开机", "质量问题"], "用户在询问退款、退货或质量问题。"),
        ("order_query", ["订单", "物流", "快递", "发货", "到哪", "运单"], "用户在询问订单或物流状态。"),
        ("promotion_consult", ["优惠", "活动", "会员价", "券", "满减", "折扣"], "用户在询问优惠或活动。"),
        ("product_consult", ["耳机", "充电器", "音箱", "推荐", "哪个好"], "用户在询问商品或推荐。"),
        ("general_chat", ["你好", "您好", "在吗", "谢谢"], "用户只是普通问候。"),
    ]
    for intent, keywords, explanation in intent_rules:
        matched = first_matched_keywords(message, keywords)
        if matched:
            return IntentResult(intent=intent, matched_keywords=matched, explanation=explanation)
    return IntentResult(intent="unknown", matched_keywords=[], explanation="没有命中当前版本的粗意图规则。")


class Lesson08Agent:
    """基础 RAG 思路版 Agent：先找相关资料，再组织回答。"""

    def __init__(
        self,
        *,
        chat_http_client: httpx.Client | None = None,
        chat_api_key: str | None = None,
        chat_base_url: str | None = None,
        chat_model_name: str | None = None,
    ) -> None:
        """保存模型客户端配置，并为每个会话维护最小状态。"""

        self._message_count_by_session: dict[str, int] = {}
        self._chat_http_client = chat_http_client
        self._chat_api_key = chat_api_key
        self._chat_base_url = chat_base_url
        self._chat_model_name = chat_model_name

    def chat(self, request: ChatRequest) -> ChatResponse:
        """执行一次客服问答：先检索，再把相关知识交给模型。"""

        self._message_count_by_session[request.session_id] = (
            self._message_count_by_session.get(request.session_id, 0) + 1
        )
        message_count = self._message_count_by_session[request.session_id]

        # 第 08 课的核心变化：Prompt 不再吞全部规则，而是先做一次轻量检索。
        intent_result = classify_intent(request.user_message)
        hits = retrieve_relevant_knowledge(request.user_message, intent_result.intent)
        messages = render_rag_messages(request, intent_result, hits)
        answer = call_chat_model(
            messages,
            http_client=self._chat_http_client,
            api_key=self._chat_api_key,
            base_url=self._chat_base_url,
            model=self._chat_model_name,
        )
        cost_summary = build_cost_summary(messages, answer)
        reasoning_summary = [
            "后端先识别粗意图，再按用户问题检索当前相关知识。",
            f"本轮只把 {len(hits)} 个相关知识片段放进 Prompt，而不是注入全部规则。",
            "当前版本先展示基础 RAG 思路；引用来源字段会在后续版本补齐。",
        ]
        session_state = {
            "agent_version": "lesson-08-rag-thinking",
            "message_count": message_count,
            "runtime_context": {
                "user_id": request.runtime_user_id,
                "nickname": request.runtime_nickname,
                "member_level": request.runtime_member_level,
                "risk_level": request.runtime_risk_level,
                "page_context": request.runtime_context or {},
            },
            "rag": {
                "mode": "select_relevant_snippets",
                "top_k": 2,
                "candidate_count": len(load_knowledge_snippets()),
                "retrieved_count": len(hits),
                "matched_snippet_ids": [hit.snippet.snippet_id for hit in hits],
                "matched_keywords": {hit.snippet.snippet_id: hit.matched_keywords for hit in hits},
            },
            "cost_observation": {
                "prompt_tokens": cost_summary.prompt_tokens,
                "context_chars": cost_summary.context_chars,
            },
            "next_gap": "现在只会粗略找相关资料；下一步要把文档切开、贴 metadata，让知识片段更稳定。",
        }
        return ChatResponse(
            session_id=request.session_id,
            answer=answer,
            intent=intent_result.intent,
            intent_result=intent_result,
            cost_summary=cost_summary,
            reasoning_summary=reasoning_summary,
            session_state=session_state,
        )
