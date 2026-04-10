"""Unit tests for prompt runtime environment wiring and HTTP behavior."""

import json
import os
import sys
from unittest.mock import patch
from urllib.error import HTTPError, URLError

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.prompt_runtime import (
    HTTPPromptRuntimeConfig,
    HTTPPromptRuntime,
    NoopPromptRuntime,
    create_prompt_runtime_from_env,
    load_http_prompt_runtime_config_from_env,
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


def test_create_prompt_runtime_from_env_defaults_to_noop():
    with patch.dict(os.environ, {}, clear=False):
        runtime = create_prompt_runtime_from_env()

    assert isinstance(runtime, NoopPromptRuntime)


def test_create_prompt_runtime_from_env_uses_shared_llm_runtime_when_available():
    class FakeLLMClient:
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {"title": "来自统一 LLM runtime"}

        def generate_text(self, *, task, system_prompt, user_prompt):
            return "unused"

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_LLM_BACKEND": "openai_compatible",
        },
        clear=False,
    ):
        runtime = create_prompt_runtime_from_env(llm_client=FakeLLMClient())

    result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})
    assert isinstance(result, dict)
    assert result.get("title") == "来自统一 LLM runtime"


def test_load_http_prompt_runtime_config_requires_url():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "",
        },
        clear=False,
    ):
        try:
            load_http_prompt_runtime_config_from_env()
        except ValueError as error:
            assert "AIMANDALA_PROMPT_RUNTIME_HTTP_URL" in str(error)
        else:
            raise AssertionError("Expected missing prompt runtime URL to raise ValueError")


def test_load_http_prompt_runtime_config_requires_positive_timeout():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "https://example.com/runtime",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS": "0",
        },
        clear=False,
    ):
        try:
            load_http_prompt_runtime_config_from_env()
        except ValueError as error:
            assert "positive integer" in str(error)
        else:
            raise AssertionError("Expected invalid prompt runtime timeout to raise ValueError")


def test_create_prompt_runtime_from_env_returns_http_runtime():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_BACKEND": "http",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "https://example.com/runtime",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS": "12",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY": "secret-token",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY_HEADER": "X-API-Key",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES": "3",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS": "120",
        },
        clear=False,
    ):
        runtime = create_prompt_runtime_from_env()

    assert isinstance(runtime, HTTPPromptRuntime)
    assert runtime.config.endpoint_url == "https://example.com/runtime"
    assert runtime.config.timeout_seconds == 12
    assert runtime.config.api_key == "secret-token"
    assert runtime.config.api_key_header == "X-API-Key"
    assert runtime.config.max_retries == 3
    assert runtime.config.retry_backoff_ms == 120


def test_http_prompt_runtime_reads_structured_payload():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "structured": {
                "title": "Lite 标题",
            }
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert isinstance(result, dict)
    assert result.get("title") == "Lite 标题"


def test_http_prompt_runtime_reads_direct_dict_payload():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "first_impression": "Pro 直觉",
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_pro(prompt="hello", schema={"type": "pro"})

    assert isinstance(result, dict)
    assert result.get("first_impression") == "Pro 直觉"


def test_http_prompt_runtime_reads_nested_data_structured_payload():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "ok": True,
            "data": {
                "structured": {
                    "title": "Nested Lite Title",
                }
            },
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert isinstance(result, dict)
    assert result.get("title") == "Nested Lite Title"


def test_http_prompt_runtime_normalizes_lite_alias_keys():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "report_type": "lite",
            "structured": {
                "标题": "别名标题",
                "整体印象": "别名整体印象",
                "画面元素分析": "别名画面元素",
                "情绪画像": "别名情绪画像",
                "心灵画像故事": {
                    "底色": "别名故事底色",
                    "矛盾": "别名故事矛盾",
                },
                "主题场景": "别名主题场景",
                "主题影响": "别名主题影响",
                "主题觉察": "别名主题觉察",
                "三个日常小觉察": [
                    {"day": 1, "title": "先停一下", "content": "先看见自己在赶什么。"},
                    {"day": 2, "title": "留一点白", "content": "今天只保留一件最重要的事。"},
                ],
                "pro预告": "别名 Pro 预告",
            },
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert isinstance(result, dict)
    assert result.get("title") == "别名标题"
    assert result.get("overall_impression") == "别名整体印象"
    assert result.get("visual_elements") == "别名画面元素"
    assert result.get("emotion_portrait") == "别名情绪画像"
    assert result.get("theme_scene") == "别名主题场景"
    assert result.get("theme_impact") == "别名主题影响"
    assert result.get("theme_awareness") == "别名主题觉察"
    assert isinstance(result.get("three_awareness"), list)
    assert result["three_awareness"][0]["title"] == "先停一下"
    assert result.get("pro_teaser") == "别名 Pro 预告"
    assert isinstance(result.get("story"), dict)
    assert result["story"].get("base") == "别名故事底色"
    assert result["story"].get("contradiction") == "别名故事矛盾"


def test_http_prompt_runtime_normalizes_self_understanding_canonical_keys():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "report_type": "lite",
            "structured": {
                "self_understanding_report": {
                    "title": "慢慢归位",
                    "opening_hit": "你最近像是在一边往前，一边确认自己还能不能稳稳站住。",
                    "visual_evidence": {
                        "summary": "画面里明显能看到收束和试探并存，所以这不是停住，而是在重新校准。",
                    },
                    "state_interpretation": {
                        "current_state": "你正在进入一种重新整理自己的阶段。",
                        "emotional_tension": "你既想推进，又怕再次把自己耗空。",
                        "explanation_chain": "这种判断来自画面里的收束感、停顿感和谨慎展开的节奏。",
                    },
                    "pattern_naming": {
                        "pattern_name": "先稳住再前进",
                        "pattern_description": "你习惯先把内部秩序理顺，再决定如何往外走。",
                        "protective_logic": "这是一种避免再次透支自己的保护方式。",
                    },
                    "reality_connection": {
                        "typical_scene": "在事业里，你会在想答应机会时又先停下来确认节奏。",
                        "current_impact": "这会让你外表看起来慢一点，但内在其实是在避免失控。",
                    },
                    "next_step": {
                        "direction": "先分清什么是真想推进，什么只是怕落后。",
                        "action": "今天只保留一件真正重要的推进动作。",
                    },
                    "theme_insights": {
                        "scene": "在事业里，你最近更常出现在想推进又想保留空间的状态。",
                        "impact": "这会影响你答应任务和安排节奏的方式。",
                        "awareness": "先别逼自己全开，先确认最值得投入的一件事。",
                    },
                    "daily_awareness": [
                        {"day": 1, "title": "先收一点", "content": "把今天最消耗你的事情写下来。"},
                    ],
                },
                "pro_teaser": "如果继续往下看，你还可以知道这种模式为什么会反复出现。",
            },
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert isinstance(result, dict)
    assert result.get("title") == "慢慢归位"
    assert "重新校准" in (result.get("visual_elements") or "")
    assert "重新整理自己" in (result.get("emotion_portrait") or "")
    assert result.get("theme_scene", "").startswith("在事业里")
    assert result.get("theme_impact", "").startswith("这会影响")
    assert result.get("theme_awareness", "").startswith("先别逼自己")
    assert isinstance(result.get("three_awareness"), list)
    assert result["three_awareness"][0]["title"] == "先收一点"
    assert isinstance(result.get("story"), dict)
    assert result["story"].get("pattern", "").startswith("先稳住再前进")


def test_http_prompt_runtime_normalizes_pro_alias_keys():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )
    response_payload = json.dumps(
        {
            "ok": True,
            "data": {
                "report_type": "pro",
                "structured": {
                    "第一眼直觉": "别名 Pro 直觉",
                    "核心洞察表格": {"能量本质": "别名能量本质"},
                    "三圈能量画像": {"inner": {"label": "内圈", "reading": "解读"}},
                    "微观能量分析": {"节奏": "别名节奏"},
                    "失衡类型识别": {"primary": "别名失衡类型"},
                    "根源探索": {"surface": "别名表层根源"},
                    "疗愈建议": [{"phase": "第1阶段", "practice": "别名建议"}],
                },
            },
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse(response_payload),
    ):
        result = runtime.generate_pro(prompt="hello", schema={"type": "pro"})

    assert isinstance(result, dict)
    assert result.get("first_impression") == "别名 Pro 直觉"
    assert isinstance(result.get("core_insight_table"), dict)
    assert isinstance(result.get("three_circles_detailed"), dict)
    assert isinstance(result.get("micro_analysis_detailed"), dict)
    assert isinstance(result.get("imbalance_confirmed"), dict)
    assert isinstance(result.get("root_cause"), dict)
    assert isinstance(result.get("healing_suggestions"), list)


def test_http_prompt_runtime_returns_none_on_invalid_json():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
        )
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        return_value=_FakeHTTPResponse("not-json"),
    ):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert result is None


def test_http_prompt_runtime_retries_on_retryable_http_error():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
            max_retries=2,
            retry_backoff_ms=1,
        )
    )
    retryable = HTTPError(
        url="https://example.com/runtime",
        code=503,
        msg="service unavailable",
        hdrs=None,
        fp=None,
    )
    success_payload = json.dumps(
        {
            "structured": {
                "title": "Recovered Title",
            }
        }
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        side_effect=[retryable, _FakeHTTPResponse(success_payload)],
    ) as mocked_urlopen, patch("app.core.pipeline.prompt_runtime.time.sleep"):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert mocked_urlopen.call_count == 2
    assert isinstance(result, dict)
    assert result.get("title") == "Recovered Title"


def test_http_prompt_runtime_does_not_retry_on_non_retryable_http_error():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
            max_retries=3,
            retry_backoff_ms=1,
        )
    )
    non_retryable = HTTPError(
        url="https://example.com/runtime",
        code=400,
        msg="bad request",
        hdrs=None,
        fp=None,
    )

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        side_effect=[non_retryable],
    ) as mocked_urlopen, patch("app.core.pipeline.prompt_runtime.time.sleep"):
        result = runtime.generate_lite(prompt="hello", schema={"type": "lite"})

    assert mocked_urlopen.call_count == 1
    assert result is None


def test_http_prompt_runtime_retries_on_url_error():
    runtime = HTTPPromptRuntime(
        HTTPPromptRuntimeConfig(
            endpoint_url="https://example.com/runtime",
            timeout_seconds=5,
            max_retries=1,
            retry_backoff_ms=1,
        )
    )
    url_error = URLError("temporary network issue")
    success_payload = json.dumps({"first_impression": "Recovered Pro"})

    with patch(
        "app.core.pipeline.prompt_runtime.urlopen",
        side_effect=[url_error, _FakeHTTPResponse(success_payload)],
    ) as mocked_urlopen, patch("app.core.pipeline.prompt_runtime.time.sleep"):
        result = runtime.generate_pro(prompt="hello", schema={"type": "pro"})

    assert mocked_urlopen.call_count == 2
    assert isinstance(result, dict)
    assert result.get("first_impression") == "Recovered Pro"


def test_load_http_prompt_runtime_config_requires_non_negative_retry_config():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "https://example.com/runtime",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES": "-1",
        },
        clear=False,
    ):
        try:
            load_http_prompt_runtime_config_from_env()
        except ValueError as error:
            assert "MAX_RETRIES" in str(error)
        else:
            raise AssertionError("Expected invalid retry count to raise ValueError")

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "https://example.com/runtime",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS": "-1",
        },
        clear=False,
    ):
        try:
            load_http_prompt_runtime_config_from_env()
        except ValueError as error:
            assert "RETRY_BACKOFF_MS" in str(error)
        else:
            raise AssertionError("Expected invalid retry backoff to raise ValueError")
