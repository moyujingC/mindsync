"""课程快照薄入口：只负责导入 FastAPI app 并启动当前课后端。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson04Agent, build_answer, classify_intent, first_matched_keywords, plan_intent_by_rules
from api.routes import create_router
from api.schemas import ChatRequest, ChatResponse, Intent, IntentResult, IntentSource, ReasoningView
from config.settings import load_agent_capabilities, load_course_env
from models.classifier_client import build_classifier_messages, classify_intent_with_model, parse_classifier_json


agent = Lesson04Agent()


def create_app() -> FastAPI:
    """组装第 04 课 FastAPI 应用，并挂载结构化意图路由。"""

    app = FastAPI(title="Lesson 04 Xiaozhe Agent Structured Intent")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 课程重点：从这一课开始，入口只装配 API，意图识别留在 Agent 和模型客户端模块。
    app.include_router(create_router(lambda: agent))
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
