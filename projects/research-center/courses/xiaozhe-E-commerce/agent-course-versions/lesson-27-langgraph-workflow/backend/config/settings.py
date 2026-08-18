"""第 27 课：课程配置和 capabilities 读取。运行路径从这里统一管理。"""

from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path
from typing import Any


CAPABILITIES_PATH = Path(__file__).resolve().parents[1] / "agent_capabilities.json"

DEFAULT_COURSE_ENV_PATH = Path(__file__).resolve().parents[3] / "course.env"

DEFAULT_ECOMMERCE_BASE_URL = "http://127.0.0.1:8081"

TODAY = date(2026, 6, 7)

def load_agent_capabilities() -> dict[str, Any]:
    """读取当前课程 capabilities 文件。"""
    with CAPABILITIES_PATH.open(encoding="utf-8") as file:
        return json.load(file)

def load_course_env() -> Path | None:
    """加载课程级环境变量，保证快照可独立运行。"""
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
