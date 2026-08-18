"""课程快照配置层，负责能力清单、cases.yml、course.env 和业务后端地址。"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Literal

import httpx
import yaml
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CAPABILITIES_PATH = Path(__file__).resolve().parents[1] / "agent_capabilities.json"

DEFAULT_COURSE_ENV_PATH = Path(__file__).resolve().parents[3] / "course.env"

DEFAULT_ECOMMERCE_BASE_URL = "http://127.0.0.1:8081"

MAX_CONTEXT_TOKENS = 90

RECENT_WINDOW_SIZE = 4

def load_agent_capabilities() -> dict[str, Any]:
    """读取当前课程能力清单，让前端和文档看到这一课新增了哪些 Agent 能力。"""
    with CAPABILITIES_PATH.open(encoding="utf-8") as file:
        return json.load(file)

def load_course_env() -> Path | None:
    """加载发布包根目录的 course.env，使每课快照能复用同一套运行配置。"""
    env_path = Path(os.getenv("AGENT_COURSE_ENV", str(DEFAULT_COURSE_ENV_PATH))).expanduser()
    if not env_path.exists():
        return None
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))
    return env_path

def ecommerce_base_url() -> str:
    """返回业务后端地址；拆成函数是为了让工具层不直接依赖环境变量细节。"""
    return os.getenv("ECOMMERCE_BASE_URL", os.getenv("AGENT_ECOMMERCE_BASE_URL", DEFAULT_ECOMMERCE_BASE_URL)).rstrip("/")
