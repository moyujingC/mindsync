"""Unit tests for the shared LLM runtime wiring."""

import json
import os
import sys
from unittest.mock import patch

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.llm.runtime import (
    LLMPromptRuntime,
    NoopLLMClient,
    OpenAICompatibleLLMClient,
    create_llm_client_from_env,
)


class _FakeHTTPResponse:
    def __init__(self, payload: str):
        self._payload = payload.encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self._payload


def test_create_llm_client_from_env_defaults_to_noop():
    with patch.dict(os.environ, {}, clear=False):
        client = create_llm_client_from_env()

    assert isinstance(client, NoopLLMClient)


def test_create_llm_client_from_env_returns_openai_compatible_client():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_API_KEY": "secret",
            "AIMANDALA_LLM_MODEL": "gpt-test",
            "AIMANDALA_LLM_LITE_MODEL": "gpt-report",
            "AIMANDALA_LLM_CHAT_MODEL": "gpt-chat",
            "AIMANDALA_LLM_VISION_MODEL": "gpt-vision",
            "AIMANDALA_LLM_TIMEOUT_SECONDS": "18",
            "AIMANDALA_LLM_MAX_RETRIES": "3",
            "AIMANDALA_LLM_RETRY_BACKOFF_MS": "250",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    assert isinstance(client, OpenAICompatibleLLMClient)
    assert client.config.default.base_url == "https://example.com/v1"
    assert client.config.default.model == "gpt-test"
    assert client.config.lite_report is not None
    assert client.config.lite_report.model == "gpt-report"
    assert client.config.chat is not None
    assert client.config.chat.model == "gpt-chat"
    assert client.config.vision is not None
    assert client.config.vision.model == "gpt-vision"
    assert client.config.timeout_seconds == 18
    assert client.config.max_retries == 3
    assert client.config.retry_backoff_ms == 250


def test_create_llm_client_from_env_supports_task_specific_overrides():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_API_KEY": "default-secret",
            "AIMANDALA_LLM_MODEL": "gpt-default",
            "AIMANDALA_LLM_LITE_BASE_URL": "https://glm.example.com/v4",
            "AIMANDALA_LLM_LITE_API_KEY": "glm-secret",
            "AIMANDALA_LLM_LITE_MODEL": "glm-4",
            "AIMANDALA_LLM_PRO_BASE_URL": "https://ark.example.com/v3",
            "AIMANDALA_LLM_PRO_API_KEY": "doubao-secret",
            "AIMANDALA_LLM_PRO_MODEL": "ep-pro",
            "AIMANDALA_LLM_CHAT_BASE_URL": "https://moonshot.example.com/v1",
            "AIMANDALA_LLM_CHAT_API_KEY": "kimi-secret",
            "AIMANDALA_LLM_CHAT_MODEL": "moonshot-v1-8k",
            "AIMANDALA_LLM_VISION_BASE_URL": "https://ark.example.com/v3",
            "AIMANDALA_LLM_VISION_API_KEY": "doubao-secret",
            "AIMANDALA_LLM_VISION_MODEL": "ep-vision",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    assert isinstance(client, OpenAICompatibleLLMClient)
    assert client.config.lite_report is not None
    assert client.config.lite_report.base_url == "https://glm.example.com/v4"
    assert client.config.lite_report.model == "glm-4"
    assert client.config.pro_report is not None
    assert client.config.pro_report.model == "ep-pro"
    assert client.config.chat is not None
    assert client.config.chat.model == "moonshot-v1-8k"
    assert client.config.vision is not None
    assert client.config.vision.model == "ep-vision"


def test_create_llm_client_from_env_supports_relayhub_task_alias_models():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://relayhub.jingshu.cc/aimandala/v1",
            "AIMANDALA_LLM_API_KEY": "relayhub-prod-token",
            "AIMANDALA_LLM_MODEL": "relayhub-task-aimandala-lite-report",
            "AIMANDALA_LLM_PRO_MODEL": "relayhub-task-aimandala-pro-report",
            "AIMANDALA_LLM_CHAT_MODEL": "relayhub-task-aimandala-chat",
            "AIMANDALA_LLM_VISION_MODEL": "relayhub-task-aimandala-vision",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    assert isinstance(client, OpenAICompatibleLLMClient)
    assert client.config.default.base_url == "https://relayhub.jingshu.cc/aimandala/v1"
    assert client.config.default.model == "relayhub-task-aimandala-lite-report"
    assert client.config.pro_report is not None
    assert client.config.pro_report.model == "relayhub-task-aimandala-pro-report"
    assert client.config.chat is not None
    assert client.config.chat.model == "relayhub-task-aimandala-chat"
    assert client.config.vision is not None
    assert client.config.vision.model == "relayhub-task-aimandala-vision"


def test_create_llm_client_from_env_supports_legacy_model_envs():
    with patch.dict(
        os.environ,
        {
            "GLM_API_KEY": "glm-secret",
            "DOUBAO_API_KEY": "doubao-secret",
            "DOUBAO_ENDPOINT_ID": "ep-pro",
            "DOUBAO_VISION_ENDPOINT_ID": "ep-vision",
            "MOONSHOT_API_KEY": "kimi-secret",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    assert isinstance(client, OpenAICompatibleLLMClient)
    assert client.config.lite_report is not None
    assert client.config.lite_report.base_url == "https://open.bigmodel.cn/api/paas/v4"
    assert client.config.lite_report.model == "glm-4"
    assert client.config.pro_report is not None
    assert client.config.pro_report.base_url == "https://ark.cn-beijing.volces.com/api/v3"
    assert client.config.pro_report.model == "ep-pro"
    assert client.config.vision is not None
    assert client.config.vision.model == "ep-vision"
    assert client.config.chat is not None
    assert client.config.chat.base_url == "https://api.moonshot.cn/v1"
    assert client.config.chat.model == "moonshot-v1-8k"


def test_openai_compatible_llm_client_parses_code_fenced_json_payload():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_MODEL": "gpt-test",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    response_payload = json.dumps(
        {
            "choices": [
                {
                    "message": {
                        "content": "```json\n{\"title\": \"来自 LLM 的标题\"}\n```",
                    }
                }
            ]
        }
    )

    with patch(
        "app.core.llm.runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = client.generate_structured(
            task="report",
            prompt="请生成 lite",
            schema={"type": "object"},
        )

    assert isinstance(result, dict)
    assert result["title"] == "来自 LLM 的标题"


def test_prompt_runtime_can_wrap_noop_safe_llm_client():
    runtime = LLMPromptRuntime(NoopLLMClient())

    assert runtime.generate_lite(prompt="demo", schema={"type": "object"}) is None
    assert runtime.generate_pro(prompt="demo", schema={"type": "object"}) is None
