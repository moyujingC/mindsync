"""会话记忆层。只记录低风险、已验证、当前会话内的信息。"""

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
SESSION_MEMORIES: dict[str, dict[str, Any]] = {}

MESSAGE_COUNT_BY_SESSION: dict[str, int] = {}

WORKFLOW_CHECKPOINTS: dict[tuple[str, str], dict[str, Any]] = {}

SUBMITTED_ACTIONS: dict[str, dict[str, Any]] = {}

def current_memory(session_id: str) -> dict[str, Any]:
    """读取或初始化 Context Builder 使用的会话记忆。"""
    if session_id not in SESSION_MEMORIES:
        SESSION_MEMORIES[session_id] = {"last_order_id": None, "recent_intent": None}
    return SESSION_MEMORIES[session_id]
