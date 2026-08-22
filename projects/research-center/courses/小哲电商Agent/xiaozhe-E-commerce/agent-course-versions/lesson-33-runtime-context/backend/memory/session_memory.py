"""第 33 课沿用的短期 Session Memory。

这里只保留第 32 课已经讲清楚的最近订单线索；Runtime Context 仍然负责身份、
会员和权限判断，记忆不能证明订单归属。
"""

from __future__ import annotations

from typing import Any

from api.schemas import Intent, MemoryDecision, SessionMemorySnapshot
from tools.runtime_context import order_no

SESSION_MEMORIES: dict[str, SessionMemorySnapshot] = {}


class SessionMemoryStore:
    """保存当前 session 里已通过权限校验的最近订单。"""

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
        owned_order: dict[str, Any] | None,
    ) -> list[MemoryDecision]:
        """只在订单通过 Runtime Context 权限校验后写入最近订单。"""
        decisions: list[MemoryDecision] = []
        if owned_order is not None:
            memory.last_order_id = order_no(owned_order)
            decisions.append(
                MemoryDecision(
                    key="last_order_id",
                    value=memory.last_order_id,
                    accepted=True,
                    reason="订单已通过 Runtime Context 的当前用户归属校验，可以延续第 32 课的最近订单记忆。",
                    ttl="session",
                )
            )
        memory.recent_intent = intent
        decisions.append(
            MemoryDecision(
                key="recent_intent",
                value=intent,
                accepted=True,
                reason="最近意图只用于本 session 内追问消歧，不能替代 Runtime Context 权限判断。",
                ttl="session",
            )
        )
        return decisions
