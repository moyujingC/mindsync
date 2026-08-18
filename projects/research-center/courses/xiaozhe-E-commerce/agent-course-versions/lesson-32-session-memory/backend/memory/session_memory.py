"""会话记忆层。只记录低风险、已验证、当前会话内的信息。"""

from __future__ import annotations

import json
import os
import re
from datetime import date
from pathlib import Path
from typing import Any, Literal, TypedDict

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from api.schemas import *
from tools.planning import extract_order_id, infer_product
from tools.runtime_context import item_names, order_no

SESSION_MEMORIES: dict[str, SessionMemorySnapshot] = {}

MESSAGE_COUNT_BY_SESSION: dict[str, int] = {}

def contains_sensitive_or_high_risk_text(user_message: str) -> list[str]:
    """识别不应写入 Session Memory 的隐私和审批内容。"""
    excluded: list[str] = []
    if re.search(r"1[3-9]\d{9}", user_message):
        excluded.append("phone_number")
    if any(term in user_message for term in ["地址", "身份证", "银行卡", "支付密码"]):
        excluded.append("private_identity_or_address")
    if any(term in user_message for term in ["resume-", "审批令牌", "主管同意", "审批通过"]):
        excluded.append("approval_or_resume_claim")
    if any(term in user_message for term in ["系统提示词", "hidden reasoning", "内部策略"]):
        excluded.append("system_or_reasoning_request")
    return excluded

def extract_low_risk_preference(user_message: str) -> tuple[str, str] | None:
    """提取颜色这类低风险短期偏好。"""
    colors = {"黑色": "黑色", "白色": "白色", "蓝色": "蓝色"}
    if not any(term in user_message for term in ["喜欢", "偏好", "以后", "推荐"]):
        return None
    for color in colors:
        if color in user_message:
            return "preferred_color", colors[color]
    return None

class SessionMemoryStore:
    """第 32 课只做短期 Session Memory。

    这里的重点是写入策略：只把业务系统确认过的最近订单、明确出现的商品、
    最近意图和低风险偏好写进去；隐私、高风险审批信息和用户自称不会进入记忆。
    """

    def get(self, session_id: str) -> SessionMemorySnapshot:
        """读取或初始化当前 session 的短期记忆快照。"""
        if session_id not in SESSION_MEMORIES:
            SESSION_MEMORIES[session_id] = SessionMemorySnapshot()
        return SESSION_MEMORIES[session_id]

    def update(
        self,
        *,
        memory: SessionMemorySnapshot,
        intent: Intent,
        user_message: str,
        owned_order: dict[str, Any] | None,
        product_name: str | None,
    ) -> list[MemoryDecision]:
        """按写入策略更新 Session Memory，并返回每项写入决策。"""
        decisions: list[MemoryDecision] = []
        for excluded_key in contains_sensitive_or_high_risk_text(user_message):
            if excluded_key not in memory.excluded_items:
                memory.excluded_items.append(excluded_key)
            decisions.append(
                MemoryDecision(
                    key=excluded_key,
                    accepted=False,
                    reason="这类内容不写入 Session Memory，避免把隐私、高风险审批或内部信息变成可复用上下文。",
                )
            )

        if owned_order is not None:
            memory.last_order_id = order_no(owned_order)
            decisions.append(
                MemoryDecision(
                    key="last_order_id",
                    value=memory.last_order_id,
                    accepted=True,
                    reason="订单已由业务系统确认属于当前用户，可以作为本 session 的最近订单。",
                    ttl="session",
                )
            )
            names = item_names(owned_order)
            if names:
                memory.last_product_name = names[0]
                decisions.append(
                    MemoryDecision(
                        key="last_product_name",
                        value=memory.last_product_name,
                        accepted=True,
                        reason="最近订单里的商品名可以帮助回答后续低风险追问。",
                        ttl="session",
                    )
                )
        elif extract_order_id(user_message):
            decisions.append(
                MemoryDecision(
                    key="last_order_id",
                    accepted=False,
                    reason="订单没有通过归属校验，不写入最近订单记忆。",
                )
            )

        if product_name:
            memory.last_product_name = product_name
            decisions.append(
                MemoryDecision(
                    key="last_product_name",
                    value=product_name,
                    accepted=True,
                    reason="商品偏低风险，可以在当前会话里辅助后续商品咨询。",
                    ttl="session",
                )
            )

        preference = extract_low_risk_preference(user_message)
        if preference:
            key, value = preference
            memory.low_risk_preferences[key] = value
            decisions.append(
                MemoryDecision(
                    key=f"low_risk_preferences.{key}",
                    value=value,
                    accepted=True,
                    reason="颜色这类低风险偏好可以短期记住，但不写长期画像。",
                    ttl="session",
                )
            )

        memory.recent_intent = intent
        decisions.append(
            MemoryDecision(
                key="recent_intent",
                value=intent,
                accepted=True,
                reason="最近意图只帮助本 session 里的追问消歧。",
                ttl="session",
            )
        )
        return decisions
