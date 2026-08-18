"""第 24 课：FastAPI 路由层。HTTP 边界只负责转发，不承载 Agent 决策。"""

from __future__ import annotations

import inspect
from typing import Any, Callable

from fastapi import APIRouter

from api.schemas import ChatRequest, ChatResponse
from config.settings import load_agent_capabilities


def create_router(chat_handler: Callable[[ChatRequest], Any]) -> APIRouter:
    """创建课程 HTTP 路由。"""

    router = APIRouter()

    @router.get("/health")
    def health() -> dict[str, str]:
        """返回当前课程健康状态。"""

        return {"status": "ok", "lesson": '24'}

    @router.get("/capabilities")
    def capabilities() -> dict[str, Any]:
        """返回当前课程能力开关。"""

        return load_agent_capabilities()

    @router.post("/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest) -> ChatResponse:
        """处理聊天请求并交给 Agent 编排。"""

        result = chat_handler(request)
        if inspect.isawaitable(result):
            return await result
        return result

    return router
