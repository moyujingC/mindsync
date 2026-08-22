"""第 16 课后端薄入口。

具体能力已经拆进业务模块；这里只做 FastAPI 装配，并显式导出测试会用到的课程符号。
"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson16Agent
from api.routes import create_router
from api.schemas import ChatRequest, KnowledgeChunk
from rag.index_cache import rebuild_knowledge_index, reset_index_and_cache
from rag.knowledge_base import load_knowledge_chunks
from rag.planning import pre_retrieval_plan


def create_app() -> FastAPI:
    """创建 FastAPI 应用并挂载第 16 课路由。"""
    app = FastAPI(title="Lesson 16 Xiaozhe Agent Index Cache")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(lambda: agent))
    return app


agent = Lesson16Agent()
app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
