"""课程快照薄入口：只负责导入 FastAPI app 并启动当前课后端。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson03Agent, build_customer_service_messages
from api.routes import create_router
from api.schemas import ChatRequest, ChatResponse, ReasoningView
from config.settings import load_agent_capabilities, load_course_env
from models.llm_client import call_chat_model


agent = Lesson03Agent()


def create_app() -> FastAPI:
    """组装第 03 课 FastAPI 应用，真正的客服逻辑留在 agents/。"""

    app = FastAPI(title="Lesson 03 Xiaozhe Agent LLM Customer Boundary")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 课程重点：main.py 保持薄入口，真正的客服编排在 agents/ 中。
    app.include_router(create_router(lambda: agent))
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
