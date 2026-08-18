"""运行配置层，集中读取课程环境变量、能力声明和模型连接参数。"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


BACKEND_DIR = Path(__file__).resolve().parents[1]
CAPABILITIES_PATH = BACKEND_DIR / "agent_capabilities.json"
# 课程所有 lesson 共享一份 course.env，Prompt 变化不应该带来重复环境配置。
DEFAULT_COURSE_ENV_PATH = BACKEND_DIR.parents[1] / "course.env"
PLACEHOLDER_API_KEYS = {"", "你的模型平台 Key", "your-api-key", "YOUR_API_KEY"}


def load_agent_capabilities() -> dict[str, Any]:
    """读取给调试后台使用的配置，不参与 `/chat` 主流程。"""

    with CAPABILITIES_PATH.open(encoding="utf-8") as file:
        return json.load(file)


def load_course_env() -> Path | None:
    """读取全课共享配置。每个 lesson 后端都复用 code/agent-course-versions/course.env。"""

    env_path = Path(os.getenv("AGENT_COURSE_ENV", str(DEFAULT_COURSE_ENV_PATH))).expanduser()
    if not env_path.exists():
        return None

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key:
            os.environ.setdefault(key, value)
    return env_path


def api_key_is_missing(api_key: str | None) -> bool:
    """判断模型 Key 是否缺失或仍是课程占位值。"""

    # 占位 Key 要当成未配置处理，不能让它一路打到模型平台才失败。
    return api_key is None or api_key.strip() in PLACEHOLDER_API_KEYS
