"""课程快照薄入口：只负责导入 FastAPI app 并启动当前课后端。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson06Agent, classify_intent, first_matched_keywords
from api.routes import create_router
from api.schemas import ChatRequest, ChatResponse, Intent, IntentResult, PromptFragment, ReasoningView
from config.settings import load_agent_capabilities, load_course_env
from models.llm_client import call_chat_model
from prompts.loader import load_prompt_registry, render_prompt_template, select_prompt_fragments


agent = Lesson06Agent()


def create_app() -> FastAPI:
    """组装第 06 课 FastAPI 应用，并挂载 Prompt Registry 路由。"""

    app = FastAPI(title="Lesson 06 Xiaozhe Agent Prompt Registry")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 课程重点：Prompt 选择和渲染已进入 prompts/，main.py 只留下服务装配。
    app.include_router(create_router(lambda: agent))
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
