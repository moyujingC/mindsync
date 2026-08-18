"""轻量规划工具。这里展示课程版路由、订单号抽取和 token 估算。"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

import httpx
import yaml
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from api.schemas import *


def classify_guard_intent(user_message: str) -> Intent | None:
    """只识别足够明确、允许覆盖模型路由的确定性边界。"""
    if "SERVICE_TIMEOUT" in user_message:
        return "degradation_request"
    if any(term in user_message for term in ["系统提示词", "hidden reasoning", "隐藏推理", "工具 schema", "内部策略"]):
        return "security_request"
    if any(
        term in user_message
        for term in [
            "我要退货",
            "我想退货",
            "我要申请退货",
            "我想申请退货",
            "帮我退货",
            "申请退货",
            "七天无理由",
            "寄回",
            "能退货吗",
            "可以退货吗",
        ]
    ):
        return "return_request"
    if any(
        term in user_message
        for term in [
            "我要退款",
            "我想退款",
            "我要申请退款",
            "我想申请退款",
            "帮我退款",
            "帮我申请退款",
            "给我退款",
            "直接退款",
            "直接给我退",
            "把钱退给我",
            "取消订单",
        ]
    ):
        return "refund_request"
    if any(subject in user_message for subject in ["退款", "退钱"]) and any(
        term in user_message
        for term in [
            "进度",
            "状态",
            "情况",
            "处理到哪",
            "什么时候到账",
            "怎么样",
            "结果",
            "是否到账",
            "到账了吗",
            "审核",
            "是否通过",
            "有没有通过",
            "退了吗",
        ]
    ):
        return "refund_status_query"
    if any(
        term in user_message
        for term in ["申请退款", "发起退款", "办理退款", "退钱", "能退款吗", "可以退款吗", "还能退款吗", "能不能退款"]
    ):
        return "refund_request"
    return None


def classify_intent(user_message: str) -> Intent:
    """用可读规则做总演习路由，展示 Tool、RAG、Workflow、降级和安全分流入口。"""
    guard_intent = classify_guard_intent(user_message)
    if guard_intent is not None:
        return guard_intent
    # 模型不可用时仍提供课程兜底；这些宽泛关键词不能反向覆盖有效的模型判断。
    if any(term in user_message for term in ["服务抽风", "工具超时", "接口不可用"]):
        return "degradation_request"
    if "退货" in user_message:
        return "return_request"
    if any(term in user_message for term in ["退款", "退钱"]):
        return "refund_request"
    if any(term in user_message for term in ["订单", "物流", "快递"]):
        return "order_query"
    if "发票" in user_message:
        return "faq_query"
    if any(term in user_message for term in ["火星会员", "隐藏券", "不存在的活动", "未知活动"]):
        return "low_confidence_query"
    if any(term in user_message for term in ["活动", "满减", "会员券", "优惠券", "会员规则", "大促"]):
        if any(term in user_message for term in ["商品", "耳机", "音箱", "库存", "价格", "多少钱", "有货"]):
            return "product_query"
        return "promotion_query"
    if any(term in user_message for term in ["商品", "耳机", "音箱", "库存", "价格", "多少钱", "有货", "推荐"]):
        return "product_query"
    return "general_chat"


def extract_order_id(user_message: str) -> str | None:
    """从用户问题中抽取小哲电商订单号，供工具调用前参数校验。"""
    match = re.search(r"\b(?:SO[A-Za-z0-9_-]{6,}|ORD\d{4,})\b", user_message, flags=re.IGNORECASE)
    return match.group(0) if match else None


def extract_return_reason(user_message: str) -> str | None:
    """只接受用户明确表达的退货原因，不由模型代填高风险售后事实。"""
    reason_terms = ("七天无理由", "质量问题", "商品破损", "发错货", "少件", "与描述不符")
    return next((term for term in reason_terms if term in user_message), None)


def build_route_plan(
    *,
    intent: Intent,
    user_message: str,
    order_id: str | None,
    model_used: bool,
) -> RoutePlan:
    """把意图收敛成白名单 RoutePlan，模型不能自由增加工具或高风险动作。"""
    candidate_catalog = {
        "get_order_detail": ToolCandidate(
            name="get_order_detail",
            domain="order",
            risk_level="low",
            reason="读取当前用户订单事实，不执行业务写操作。",
        ),
        "get_order_logistics": ToolCandidate(
            name="get_order_logistics",
            domain="logistics",
            risk_level="low",
            reason="读取当前用户订单及物流状态。",
        ),
        "get_refund_status": ToolCandidate(
            name="get_refund_status",
            domain="after_sale",
            risk_level="low",
            reason="只读查询当前用户订单的售后申请状态，不创建退款申请。",
        ),
        "search_products": ToolCandidate(
            name="search_products",
            domain="product",
            risk_level="low",
            reason="查询商品价格、库存和活动等实时事实。",
        ),
    }
    required_tools: list[str] = []
    knowledge_domains: list[str] = []
    risk_level: RiskLevel = "low"
    requires_workflow = False
    if intent == "order_query":
        required_tools = ["get_order_logistics"]
    elif intent == "refund_status_query":
        required_tools = ["get_refund_status"]
    elif intent == "refund_request":
        required_tools = ["get_order_detail"]
        knowledge_domains = ["after_sale_policy"]
        risk_level = "high"
        requires_workflow = True
    elif intent == "return_request":
        required_tools = ["get_order_detail"]
        knowledge_domains = ["received_return_policy"]
        risk_level = "high"
        requires_workflow = True
    elif intent == "product_query":
        required_tools = ["search_products"]
        knowledge_domains = ["promotion_and_member_policy"] if any(term in user_message for term in ["活动", "优惠", "满减", "会员"]) else []
    elif intent in {"faq_query", "promotion_query", "low_confidence_query"}:
        knowledge_domains = ["faq"] if intent == "faq_query" else ["promotion_and_member_policy"]
    elif intent in {"security_request", "degradation_request"}:
        risk_level = "high" if intent == "security_request" else "medium"

    # 缺少订单号时保留候选工具，但不允许模型凭空生成参数并执行。
    order_bound_tools = {"get_order_detail", "get_order_logistics", "get_refund_status"}
    executable_tools = required_tools if order_id or not any(name in order_bound_tools for name in required_tools) else []
    return RoutePlan(
        intent=intent,
        needs_rag=bool(knowledge_domains),
        needs_business_tools=bool(required_tools),
        required_tools=executable_tools,
        tool_candidates=[candidate_catalog[name] for name in required_tools],
        knowledge_domains=knowledge_domains,
        entity_refs=[order_id] if order_id else [],
        risk_level=risk_level,
        requires_workflow=requires_workflow,
        confidence=0.9 if model_used else 0.75,
        source="llm_with_policy_constraints" if model_used else "deterministic_fallback",
        fallback_policy="ask_order_id" if required_tools and not order_id and any(name in order_bound_tools for name in required_tools) else "safe_deterministic_path",
    )


def build_order_clarification(request: ChatRequest, route_plan: RoutePlan) -> ClarificationRequest | None:
    """后端根据 RoutePlan 必填参数和可信 Runtime Context 生成候选，不让模型代选订单。"""
    if route_plan.fallback_policy != "ask_order_id" or not route_plan.tool_candidates:
        return None
    orders = (request.runtime_context or {}).get("currentUserOrders", [])
    candidates: list[ClarificationCandidate] = []
    for order in orders:
        if str(order.get("userId")) != request.runtime_user_id:
            continue
        order_id = str(order.get("orderNo") or "").strip()
        if not order_id:
            continue
        items = order.get("items") or []
        product_names = "、".join(str(item.get("productName")) for item in items[:2] if item.get("productName"))
        candidates.append(
            ClarificationCandidate(
                value=order_id,
                label=order_id,
                hint=product_names or "当前账号订单",
            )
        )
    action = "退款" if route_plan.intent == "refund_request" else "查询"
    return ClarificationRequest(
        clarification_field="order_id",
        message=f"你要{action}哪一个订单？请选择订单号，或直接补充订单号。",
        candidates=candidates,
    )


def estimate_tokens(text: str) -> int:
    """用近似 token 估算服务成本治理和上下文预算展示。"""
    return max(1, len(text) // 2)
