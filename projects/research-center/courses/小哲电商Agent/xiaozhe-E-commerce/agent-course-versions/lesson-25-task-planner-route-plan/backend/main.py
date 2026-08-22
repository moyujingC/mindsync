"""第 25 课后端入口。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import chat
from api.routes import create_router


def create_app() -> FastAPI:
    """创建 FastAPI 应用并挂载第 25 课路由。"""
    app = FastAPI(title="Lesson 25 Xiaozhe Agent TaskPlanner RoutePlan")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(chat))
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
