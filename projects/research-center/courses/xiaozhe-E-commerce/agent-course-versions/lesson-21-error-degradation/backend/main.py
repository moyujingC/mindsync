"""第 21 课后端入口。"""

from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.customer_service_agent import Lesson21Agent
from api.routes import create_router


def create_app() -> FastAPI:
    """创建 FastAPI 应用并挂载第 21 课路由。"""
    app = FastAPI(title="Lesson 21 Xiaozhe Agent Error Degradation")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(lambda: agent))
    return app


agent = Lesson21Agent()
app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
