"""FastAPI 路由层。路由只负责调用 Agent，并返回课程契约响应。"""

from __future__ import annotations

import json
import os
import re
from datetime import date
from pathlib import Path
from typing import Any, Literal, TypedDict

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from api.schemas import *
from config.settings import load_agent_capabilities
from agents.customer_service_agent import Lesson30Agent

app = FastAPI(title="Lesson 30 Xiaozhe Agent HITL Approval")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = Lesson30Agent()

@app.get("/capabilities")
def capabilities() -> dict[str, Any]:
    """返回当前课程开放和关闭的能力边界。"""
    return load_agent_capabilities()

@app.get("/health")
def health() -> dict[str, str]:
    """提供课程快照的最小健康检查。"""
    return {"status": "ok", "lesson": "30"}

@app.post("/chat")
def chat(request: ChatRequest) -> ChatResponse:
    """处理一次 /chat 请求，并返回课程约定的公开响应结构。"""
    return agent.chat(request)
