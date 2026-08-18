"""聊天模型调用封装。"""

from __future__ import annotations

import os

import httpx

from config.settings import api_key_is_missing, load_course_env


def call_chat_model(
    messages: list[dict[str, str]],
    *,
    http_client: httpx.Client | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    model: str | None = None,
) -> str:
    """调用 OpenAI 兼容聊天接口；缺少 Key 时返回课程可读提示。"""

    load_course_env()
    resolved_api_key = api_key or os.getenv("AGENT_OPENAI_API_KEY")
    if api_key_is_missing(resolved_api_key):
        return "统一运行配置未设置有效的 AGENT_OPENAI_API_KEY。当前版本已经完成硅基流动 embedding 检索链路。"

    resolved_base_url = (base_url or os.getenv("AGENT_OPENAI_BASE_URL", "https://api.siliconflow.cn/v1")).rstrip("/")
    resolved_model = model or os.getenv("AGENT_OPENAI_MODEL", "Qwen/Qwen3-8B")
    request_kwargs = {
        "headers": {"Authorization": f"Bearer {resolved_api_key}", "Content-Type": "application/json"},
        "json": {"model": resolved_model, "messages": messages},
    }
    if http_client is not None:
        response = http_client.post(f"{resolved_base_url}/chat/completions", **request_kwargs)
    else:
        response = httpx.post(f"{resolved_base_url}/chat/completions", **request_kwargs, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return payload["choices"][0]["message"]["content"]
