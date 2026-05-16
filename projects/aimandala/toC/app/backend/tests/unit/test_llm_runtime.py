"""Tests for LLM runtime configuration defaults."""

from __future__ import annotations

import os

from app.core.llm.runtime import (
    DEFAULT_DEEPSEEK_V4_BASE_URL,
    DEFAULT_DEEPSEEK_V4_MODEL,
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
