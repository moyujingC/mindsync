"""Tests for LLM runtime configuration defaults."""

from __future__ import annotations

import os

from app.core.llm.runtime import (
    DEFAULT_DEEPSEEK_V4_BASE_URL,
    DEFAULT_DEEPSEEK_V4_MODEL,
    LLMClientConfig,
    LLMTaskConfig,
    NoopLLMClient,
    OpenAICompatibleLLMClient,
    create_llm_client_from_env,
    load_private_env_file,
    load_modern_llm_client_config_from_env,
)


def test_load_modern_llm_client_config_defaults_to_deepseek_v4(
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "test-key")
    monkeypatch.delenv("AIMANDALA_LLM_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_MODEL", raising=False)

    config = load_modern_llm_client_config_from_env()

    assert config is not None
    assert config.default.base_url == DEFAULT_DEEPSEEK_V4_BASE_URL
    assert config.default.model == DEFAULT_DEEPSEEK_V4_MODEL
    assert config.default.api_key == "test-key"


def test_create_llm_client_from_env_auto_enables_deepseek_v4_when_only_key_is_set(
    monkeypatch,
):
    monkeypatch.delenv("AIMANDALA_LLM_BACKEND", raising=False)
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "test-key")
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    client = create_llm_client_from_env()

    assert isinstance(client, OpenAICompatibleLLMClient)
    assert client.config.default.base_url == DEFAULT_DEEPSEEK_V4_BASE_URL
    assert client.config.default.model == DEFAULT_DEEPSEEK_V4_MODEL


def test_create_llm_client_from_env_returns_noop_without_llm_configuration(
    monkeypatch,
):
    monkeypatch.delenv("AIMANDALA_LLM_BACKEND", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_BASE_URL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    client = create_llm_client_from_env()

    assert isinstance(client, NoopLLMClient)


def test_load_private_env_file_sets_missing_values_without_overriding_shell(
    tmp_path,
    monkeypatch,
):
    env_file = tmp_path / "aimandala.env"
    env_file.write_text(
        "\n".join(
            [
                "AIMANDALA_LLM_API_KEY=file-key",
                "AIMANDALA_LLM_MODEL='deepseek-v4-pro'",
                "AIMANDALA_LLM_BASE_URL=https://example.test",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("AIMANDALA_ENV_FILE", str(env_file))
    monkeypatch.setenv("AIMANDALA_LLM_API_KEY", "shell-key")
    monkeypatch.delenv("AIMANDALA_LLM_MODEL", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_BASE_URL", raising=False)

    load_private_env_file()

    assert os.environ["AIMANDALA_LLM_API_KEY"] == "shell-key"
    assert os.environ["AIMANDALA_LLM_MODEL"] == "deepseek-v4-pro"
    assert os.environ["AIMANDALA_LLM_BASE_URL"] == "https://example.test"


def test_structured_generation_retries_invalid_json_response():
    client = _ScriptedLLMClient(["not json", '{"ok": true}'])

    result = client.generate_structured(
        task="vision",
        prompt="return json",
        schema={"type": "object"},
        image_path="/tmp/fake.png",
    )

    assert result == {"ok": True}
    assert client.request_count == 2
    assert client.last_attempt_trace[0]["result"] == "success"
    assert client.last_attempt_trace[0]["invalid_json_attempts"] == 1


def test_structured_generation_uses_fallback_after_invalid_json_retries():
    primary = LLMTaskConfig(
        base_url="https://primary.example.test",
        api_key="primary-key",
        model="primary-model",
    )
    fallback = LLMTaskConfig(
        base_url="https://fallback.example.test",
        api_key="fallback-key",
        model="fallback-model",
    )
    client = _ScriptedLLMClient(
        ["not json", '{"fallback": true}'],
        max_retries=0,
        primary=primary,
        fallback=fallback,
    )

    result = client.generate_structured(
        task="vision",
        prompt="return json",
        schema={"type": "object"},
        image_path="/tmp/fake.png",
    )

    assert result == {"fallback": True}
    assert client.request_count == 2
    assert [attempt["model"] for attempt in client.last_attempt_trace] == [
        "primary-model",
        "fallback-model",
    ]
    assert client.last_attempt_trace[0]["result"] == "invalid_json_response"
    assert client.last_attempt_trace[1]["result"] == "success"


def test_build_messages_supports_multiple_images(tmp_path):
    first = tmp_path / "first.png"
    second = tmp_path / "second.jpg"
    first.write_bytes(b"first")
    second.write_bytes(b"second")
    client = OpenAICompatibleLLMClient(
        LLMClientConfig(
            default=LLMTaskConfig(
                base_url="https://example.test",
                api_key="test-key",
                model="test-model",
            )
        )
    )

    messages = client._build_messages(  # noqa: SLF001 - verifies outbound vision payload shape.
        system_prompt="system",
        user_prompt="user",
        image_paths=[str(first), str(second)],
    )

    content = messages[1]["content"]
    image_items = [item for item in content if item["type"] == "image_url"]
    assert len(image_items) == 2
    assert image_items[0]["image_url"]["url"].startswith("data:image/png;base64,")
    assert image_items[1]["image_url"]["url"].startswith("data:image/jpeg;base64,")


class _ScriptedLLMClient(OpenAICompatibleLLMClient):
    def __init__(
        self,
        responses: list[str],
        *,
        max_retries: int = 1,
        primary: LLMTaskConfig | None = None,
        fallback: LLMTaskConfig | None = None,
    ) -> None:
        default_task = primary or LLMTaskConfig(
            base_url="https://example.test",
            api_key="test-key",
            model="test-model",
        )
        super().__init__(
            LLMClientConfig(
                default=default_task,
                vision=default_task,
                vision_fallback=fallback,
                timeout_seconds=1,
                max_retries=max_retries,
                retry_backoff_ms=0,
            )
        )
        self.responses = list(responses)
        self.request_count = 0

    def _extract_text_from_response(self, raw_payload: str):
        return raw_payload

    def _build_messages(self, *, system_prompt: str, user_prompt: str, image_paths):
        return [{"role": "user", "content": user_prompt}]

    def _encode_image_as_data_url(self, image_path: str) -> str:
        return "data:image/png;base64,ZmFrZQ=="

    def _request_single_chat_completion(
        self,
        *,
        task_config,
        messages,
        expect_json,
        disable_thinking,
        validate_text,
        attempt_trace,
    ):
        total_attempts = self.config.max_retries + 1
        for attempt_index in range(total_attempts):
            self.request_count += 1
            response = self.responses.pop(0)
            if validate_text is not None and not validate_text(response):
                attempt_trace["result"] = "invalid_json_response"
                attempt_trace["invalid_json_attempts"] = (
                    int(attempt_trace.get("invalid_json_attempts") or 0) + 1
                )
                if attempt_index < total_attempts - 1:
                    continue
                return None
            attempt_trace["result"] = "success"
            return response
        return None
