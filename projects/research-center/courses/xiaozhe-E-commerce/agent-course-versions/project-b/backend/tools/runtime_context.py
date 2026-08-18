"""Runtime Context 工具函数，负责从当前用户上下文里读取可信身份事实。"""

from __future__ import annotations

from typing import Any

from api.schemas import *


def runtime_context_summary(request: ChatRequest) -> dict[str, Any]:
    """返回前端可观察的 Runtime Context 摘要，区分模型可见和系统边界字段。"""
    return {
        "user_id": request.runtime_user_id,
        "nickname": request.runtime_nickname,
        "member_level": request.runtime_member_level,
        "risk_level": request.runtime_risk_level,
        "trusted_for_model": {
            "nickname": request.runtime_nickname,
            "member_level": request.runtime_member_level,
        },
        "system_only": {
            "user_id": request.runtime_user_id,
            "risk_level": request.runtime_risk_level,
        },
        "source": "request_runtime_context",
    }


def is_runtime_identity_query(user_message: str) -> bool:
    """识别需要直接读取当前登录 Runtime Context 的身份问题。"""
    normalized = user_message.strip().replace("？", "?")
    return any(
        keyword in normalized
        for keyword in (
            "我是谁",
            "我现在是谁",
            "当前用户是谁",
            "当前登录用户",
            "我的账号",
            "我的用户",
            "我的身份",
        )
    )


def runtime_identity_answer(request: ChatRequest) -> str:
    """用系统注入的 Runtime Context 回答身份问题，不从用户文本里猜身份。"""
    nickname = request.runtime_nickname or "当前用户"
    member_level = request.runtime_member_level or "unknown"
    risk_level = request.runtime_risk_level or "unknown"
    return (
        f"你当前登录的是 {nickname}，用户 ID 是 {request.runtime_user_id}，"
        f"会员等级是 {member_level}，账号风险等级是 {risk_level}。"
        "这些信息来自本轮请求的 Runtime Context，不来自用户输入。"
    )


def general_chat_answer(user_message: str) -> str:
    """普通咨询也要返回可直接给用户看的客服话术，不能暴露调试占位说明。"""
    normalized = user_message.strip().replace("？", "?")
    if any(keyword in normalized for keyword in ("你是谁", "你是什么", "你能做什么", "介绍一下你")):
        return (
            "我是这里的 AI 接待助理，不是咨询师本人。我可以帮你了解曼陀罗解读服务、"
            "工作流产品的介绍与价格，也可以引导你预约或转接人工。涉及具体解读内容或疗愈建议，"
            "我会请你添加微信，由咨询师本人在 24 小时内回复。"
        )
    return (
        "你好，我是这里的 AI 接待助理。你可以问解读服务的介绍、价格与流程，"
        "我会根据已公开的信息回答；需要预约或深入咨询时，我会帮你转接人工。"
    )
