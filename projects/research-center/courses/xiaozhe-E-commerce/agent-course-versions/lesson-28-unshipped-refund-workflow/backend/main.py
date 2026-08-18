"""第 28 课后端入口。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson28Agent
from api.routes import create_router


def create_app() -> FastAPI:
    """创建 FastAPI 应用并挂载第 28 课路由。"""
    app = FastAPI(title="Lesson 28 Xiaozhe Agent Unshipped Refund Workflow")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(chat_handler))
    return app


agent = Lesson28Agent()
chat_handler = lambda request: agent.chat(request)
app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
