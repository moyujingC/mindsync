"""Unit tests for the shared LLM runtime wiring."""

import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.llm.runtime import (
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
    assert client.config.chat is not None
    assert client.config.chat.model == "gpt-chat"
    assert client.config.vision is not None
    assert client.config.vision.model == "gpt-vision"
    assert client.config.timeout_seconds == 18
    assert client.config.max_retries == 3
    assert client.config.retry_backoff_ms == 250


def test_create_llm_client_from_env_supports_chat_and_vision_overrides():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_API_KEY": "default-secret",
            "AIMANDALA_LLM_MODEL": "gpt-default",
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
    assert client.config.chat is not None
    assert client.config.chat.model == "moonshot-v1-8k"
    assert client.config.vision is not None
    assert client.config.vision.model == "ep-vision"


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
    assert client.config.default.base_url == "https://open.bigmodel.cn/api/paas/v4"
    assert client.config.default.model == "glm-4"
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
            task="vision",
            prompt="请生成 lite",
            schema={"type": "object"},
        )

    assert isinstance(result, dict)
    assert result["title"] == "来自 LLM 的标题"


def test_openai_compatible_llm_client_uses_non_json_mode_for_vision_image_requests(tmp_path: Path):
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_MODEL": "gpt-test",
            "AIMANDALA_LLM_VISION_MODEL": "gpt-vision",
            "AIMANDALA_LLM_TIMEOUT_SECONDS": "5",
            "AIMANDALA_LLM_MAX_RETRIES": "0",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    calls: list[dict[str, object]] = []

    def _fake_urlopen(request, timeout=0):
        del timeout
        payload = json.loads(request.data.decode("utf-8"))
        calls.append(payload)
        return _FakeHTTPResponse(
            json.dumps(
                {
                    "choices": [
                        {
                            "message": {
                                "content": "{\"global_visual_summary\": \"内圈蓝白，中圈粉白，外圈粉紫与白色留白。\"}",
                            }
                        }
                    ]
                }
            )
        )

    with patch("app.core.llm.runtime.urlopen", side_effect=_fake_urlopen):
        image_path = tmp_path / "sample01.jpg"
        image_path.write_bytes(b"fake-image")

        result = client.generate_structured(
            task="vision",
            prompt="请生成视觉摘要",
            schema={"type": "object"},
            image_path=str(image_path),
        )

    assert isinstance(result, dict)
    assert result["global_visual_summary"] == "内圈蓝白，中圈粉白，外圈粉紫与白色留白。"
    assert len(calls) == 1
    assert "response_format" not in calls[0]
    assert calls[0]["thinking"] == {"type": "disabled"}


def test_openai_compatible_llm_client_disables_thinking_for_vision_image_requests(tmp_path: Path):
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
            "AIMANDALA_LLM_BASE_URL": "https://example.com/v1",
            "AIMANDALA_LLM_MODEL": "gpt-test",
            "AIMANDALA_LLM_VISION_MODEL": "gpt-vision",
            "AIMANDALA_LLM_TIMEOUT_SECONDS": "5",
            "AIMANDALA_LLM_MAX_RETRIES": "0",
        },
        clear=False,
    ):
        client = create_llm_client_from_env()

    calls: list[dict[str, object]] = []

    def _fake_urlopen(request, timeout=0):
        del timeout
        payload = json.loads(request.data.decode("utf-8"))
        calls.append(payload)
        return _FakeHTTPResponse(
            json.dumps(
                {
                    "choices": [
                        {
                            "message": {
                                "content": "{\"global_visual_summary\": \"内圈蓝白，中圈粉白，外圈粉紫与白色留白。\"}",
                            }
                        }
                    ]
                }
            )
        )

    with patch("app.core.llm.runtime.urlopen", side_effect=_fake_urlopen):
        image_path = tmp_path / "sample01.jpg"
        image_path.write_bytes(b"fake-image")

        result = client.generate_structured(
            task="vision",
            prompt="请生成视觉摘要",
            schema={"type": "object"},
            image_path=str(image_path),
        )

    assert isinstance(result, dict)
    assert result["global_visual_summary"] == "内圈蓝白，中圈粉白，外圈粉紫与白色留白。"
    assert len(calls) == 1
    assert calls[0]["thinking"] == {"type": "disabled"}
    assert "response_format" not in calls[0]
