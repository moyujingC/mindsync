"""课程快照薄入口：只负责导入 FastAPI app 并启动当前课后端。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson02Agent
from api.routes import create_router
from api.schemas import ChatRequest, ChatResponse
from config.settings import load_agent_capabilities, load_course_env
from models.llm_client import call_chat_model


agent = Lesson02Agent()


def create_app() -> FastAPI:
    """组装第 02 课 FastAPI 应用，保持入口层只做服务装配。"""

    app = FastAPI(title="Lesson 02 Xiaozhe Agent Chat Service")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 课程重点：main.py 现在只负责组装应用；路由通过 provider 读取当前 Agent，方便测试替换。
    app.include_router(create_router(lambda: agent))
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
