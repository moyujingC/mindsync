"""项目 B 疗愈客服：轻量规划工具。规则路由、危机熔断检测和 token 估算。"""

from __future__ import annotations

from typing import Any

from api.schemas import *


def classify_guard_intent(user_message: str) -> Intent | None:
    """只识别足够明确、允许覆盖模型路由的确定性边界。

    危机熔断优先于一切——它是疗愈场景不可绕过的伦理红线，任何状态下无条件触发。
    """
    # 危机熔断（最高优先级，无条件覆盖模型判断）
    if any(
        term in user_message
        for term in [
            "想死",
            "自杀",
            "自残",
            "轻生",
            "不想活",
            "活不下去",
            "结束生命",
            "了结自己",
            "伤害自己",
            "割腕",
            "跳楼",
            "伤害别人",
            "杀人",
            "同归于尽",
        ]
    ):
        return "crisis"
    # 安全拦截：索取内部信息 / 注入攻击
    if any(term in user_message for term in ["系统提示词", "hidden reasoning", "隐藏推理", "工具 schema", "内部策略"]):
        return "security_request"
    # 明确转人工
    if any(
        term in user_message
        for term in ["转人工", "人工客服", "找真人", "联系你们", "加微信", "留个微信", "微信号"]
    ):
        return "transfer_human"
    return None


def classify_intent(user_message: str) -> Intent:
    """规则兜底路由。模型可用时优先模型判断，此函数只在模型不可用时兜底。"""
    guard_intent = classify_guard_intent(user_message)
    if guard_intent is not None:
        return guard_intent
    # 初访收集：明确购买/预约意向
    if any(
        term in user_message
        for term in ["我想约", "我要买", "想购买", "想预约", "想报名", "怎么约", "怎么买", "想做解读", "想做咨询", "下单", "付款"]
    ):
        return "intake_collect"
    # 价格流程
    if any(term in user_message for term in ["价格", "多少钱", "收费", "怎么收费", "费用", "优惠"]):
        return "pricing_process"
    # 服务介绍
    if any(
        term in user_message
        for term in ["解读案子", "工作流", "课程", "服务", "适合谁", "流程", "怎么做", "怎么学"]
    ):
        return "service_intro"
    # 认知科普
    if any(term in user_message for term in ["曼陀罗", "是什么", "什么意思", "原理", "为什么", "解读"]):
        return "concept_faq"
    return "general_chat"


def build_route_plan(
    *,
    intent: Intent,
    user_message: str,
    model_used: bool,
) -> RoutePlan:
    """把意图收敛成疗愈知识域，无实时业务工具可调用。"""
    knowledge_domains: list[str] = []
    risk_level: RiskLevel = "low"
    if intent == "concept_faq":
        knowledge_domains = ["concept_faq"]
    elif intent == "service_intro":
        knowledge_domains = ["service_intro"]
    elif intent == "pricing_process":
        knowledge_domains = ["pricing_process"]
    elif intent == "intake_collect":
        knowledge_domains = ["delivery_boundary"]
        risk_level = "medium"
    elif intent == "transfer_human":
        risk_level = "medium"
    elif intent == "crisis":
        risk_level = "high"
    elif intent == "security_request":
        risk_level = "high"
    return RoutePlan(
        intent=intent,
        needs_rag=bool(knowledge_domains),
        needs_business_tools=False,
        required_tools=[],
        tool_candidates=[],
        knowledge_domains=knowledge_domains,
        entity_refs=[],
        risk_level=risk_level,
        requires_workflow=False,
        confidence=0.9 if model_used else 0.75,
        source="llm_with_policy_constraints" if model_used else "deterministic_fallback",
        fallback_policy="safe_deterministic_path",
    )


def estimate_tokens(text: str) -> int:
    """用近似 token 估算服务成本治理和上下文预算展示。"""
    return max(1, len(text) // 2)
