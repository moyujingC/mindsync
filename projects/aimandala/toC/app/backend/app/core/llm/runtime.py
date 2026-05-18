"""Unified LLM client and task runtimes for the AI-Mandala To C app."""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Protocol, Sequence
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .prompt_loader import render_prompt_template


DEFAULT_DEEPSEEK_V4_MODEL = "deepseek-v4-pro"
DEFAULT_DEEPSEEK_V4_BASE_URL = "https://api.deepseek.com"


@dataclass(frozen=True)
class LLMTaskConfig:
    """Task-specific endpoint settings."""

    base_url: str
    api_key: Optional[str]
    model: str
    api_key_header: str = "Authorization"

    @property
    def endpoint_url(self) -> str:
        return f"{self.base_url.rstrip('/')}/chat/completions"


@dataclass(frozen=True)
class LLMClientConfig:
    """Configuration for the shared LLM client."""

    default: LLMTaskConfig
    chat: Optional[LLMTaskConfig] = None
    chat_fallback: Optional[LLMTaskConfig] = None
    vision: Optional[LLMTaskConfig] = None
    vision_fallback: Optional[LLMTaskConfig] = None
    timeout_seconds: int = 30
    max_retries: int = 2
    retry_backoff_ms: int = 400

    def resolve_task_config(self, task: str) -> LLMTaskConfig:
        normalized = task.strip().lower()
        task_mapping = {
            "chat": self.chat,
            "vision": self.vision,
        }
        return task_mapping.get(normalized) or self.default

    def resolve_fallback_task_config(self, task: str) -> Optional[LLMTaskConfig]:
        normalized = task.strip().lower()
        fallback_mapping = {
            "chat": self.chat_fallback,
            "vision": self.vision_fallback,
        }
        return fallback_mapping.get(normalized)


class LLMClient(Protocol):
    """Shared contract for all LLM-powered tasks."""

    def generate_structured(
        self,
        *,
        task: str,
        prompt: str,
        schema: Dict[str, Any],
        image_path: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        ...

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
    ) -> Optional[str]:
        ...


class NoopLLMClient:
    """Fallback client used when no real LLM backend is configured."""

    def generate_structured(
        self,
        *,
        task: str,
        prompt: str,
        schema: Dict[str, Any],
        image_path: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        return None

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
    ) -> Optional[str]:
        return None


class OpenAICompatibleLLMClient:
    """OpenAI-compatible chat-completions client used across report, chat, and vision."""

    def __init__(self, config: LLMClientConfig) -> None:
        self.config = config
        self.last_error_detail: dict[str, Any] = {}
        self.last_attempt_trace: list[dict[str, Any]] = []

    def generate_structured(
        self,
        *,
        task: str,
        prompt: str,
        schema: Dict[str, Any],
        image_path: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        self.last_error_detail = {}
        self.last_attempt_trace = []
        task_config = self.config.resolve_task_config(task)
        fallback_task_config = self.config.resolve_fallback_task_config(task)
        schema_json = json.dumps(schema, ensure_ascii=False, indent=2)
        system_prompt = render_prompt_template("json/object_system.md")
        user_prompt = render_prompt_template(
            "json/schema_user.md",
            prompt=prompt.strip(),
            schema_json=schema_json,
        )
        messages = self._build_messages(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_path=image_path,
        )
        is_vision_image_task = task.strip().lower() == "vision" and bool(image_path)
        if is_vision_image_task:
            raw = self._request_chat_completion(
                task_config=task_config,
                fallback_task_config=fallback_task_config,
                messages=messages,
                expect_json=False,
                disable_thinking=True,
                validate_text=self._is_json_object_response,
            )
            if not raw:
                return None
            parsed = self._parse_json_response(raw)
            if parsed is None:
                self._record_json_parse_failure(raw, task=task)
            return parsed

        raw = self._request_chat_completion(
            task_config=task_config,
            fallback_task_config=fallback_task_config,
            messages=messages,
            expect_json=True,
            disable_thinking=False,
            validate_text=self._is_json_object_response,
        )
        if raw is None and task.strip().lower() == "vision":
            raw = self._request_chat_completion(
                task_config=task_config,
                fallback_task_config=fallback_task_config,
                messages=messages,
                expect_json=False,
                disable_thinking=False,
                validate_text=self._is_json_object_response,
            )
        if not raw:
            return None
        parsed = self._parse_json_response(raw)
        if parsed is None:
            self._record_json_parse_failure(raw, task=task)
        return parsed

    def generate_text(
        self,
        *,
        task: str,
        system_prompt: str,
        user_prompt: str,
    ) -> Optional[str]:
        self.last_error_detail = {}
        self.last_attempt_trace = []
        task_config = self.config.resolve_task_config(task)
        fallback_task_config = self.config.resolve_fallback_task_config(task)
        messages = self._build_messages(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_path=None,
        )
        raw = self._request_chat_completion(
            task_config=task_config,
            fallback_task_config=fallback_task_config,
            messages=messages,
            expect_json=False,
            disable_thinking=True,
        )
        if not raw:
            return None
        return raw.strip() or None

    def _build_messages(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        image_path: Optional[str],
    ) -> list[Dict[str, Any]]:
        messages: list[Dict[str, Any]] = [
            {
                "role": "system",
                "content": system_prompt,
            }
        ]
        if image_path:
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": self._encode_image_as_data_url(image_path),
                            },
                        },
                    ],
                }
            )
        else:
            messages.append({"role": "user", "content": user_prompt})
        return messages

    def _encode_image_as_data_url(self, image_path: str) -> str:
        path = Path(image_path)
        mime_type = mimetypes.guess_type(path.name)[0] or "image/png"
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        return f"data:{mime_type};base64,{encoded}"

    def _request_chat_completion(
        self,
        *,
        task_config: LLMTaskConfig,
        fallback_task_config: Optional[LLMTaskConfig],
        messages: Sequence[Dict[str, Any]],
        expect_json: bool,
        disable_thinking: bool,
        validate_text: Optional[Callable[[str], bool]] = None,
    ) -> Optional[str]:
        configs_to_try = [task_config]
        if (
            fallback_task_config is not None
            and fallback_task_config != task_config
        ):
            configs_to_try.append(fallback_task_config)

        for active_config in configs_to_try:
            attempt_trace: dict[str, Any] = {
                "model": active_config.model,
                "base_url": active_config.base_url,
                "endpoint_url": active_config.endpoint_url,
                "result": "pending",
            }
            result = self._request_single_chat_completion(
                task_config=active_config,
                messages=messages,
                expect_json=expect_json,
                disable_thinking=disable_thinking,
                validate_text=validate_text,
                attempt_trace=attempt_trace,
            )
            self.last_attempt_trace.append(attempt_trace)
            if result is not None:
                return result
        return None

    def _request_single_chat_completion(
        self,
        *,
        task_config: LLMTaskConfig,
        messages: Sequence[Dict[str, Any]],
        expect_json: bool,
        disable_thinking: bool,
        validate_text: Optional[Callable[[str], bool]],
        attempt_trace: dict[str, Any],
    ) -> Optional[str]:
        payload: Dict[str, Any] = {
            "model": task_config.model,
            "messages": list(messages),
        }
        if expect_json:
            payload["response_format"] = {"type": "json_object"}
        if disable_thinking:
            payload["thinking"] = {"type": "disabled"}

        total_attempts = self.config.max_retries + 1
        for attempt_index in range(total_attempts):
            request = Request(
                task_config.endpoint_url,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers=self._build_headers(task_config),
                method="POST",
            )
            try:
                with urlopen(request, timeout=self.config.timeout_seconds) as response:
                    raw_payload = response.read().decode("utf-8")
                attempt_trace["result"] = "response"
            except HTTPError as error:
                attempt_trace["result"] = "http_error"
                attempt_trace["status"] = getattr(error, "code", None)
                self.last_error_detail = {
                    "kind": "http_error",
                    "status": getattr(error, "code", None),
                    "reason": str(getattr(error, "reason", "") or ""),
                    "task_model": task_config.model,
                    "base_url": task_config.base_url,
                }
                if attempt_index < total_attempts - 1:
                    self._sleep_for_retry(attempt_index)
                    continue
                return None
            except URLError as error:
                attempt_trace["result"] = "url_error"
                attempt_trace["reason"] = str(getattr(error, "reason", "") or error)
                self.last_error_detail = {
                    "kind": "url_error",
                    "reason": str(getattr(error, "reason", "") or error),
                    "task_model": task_config.model,
                    "base_url": task_config.base_url,
                }
                if attempt_index < total_attempts - 1:
                    self._sleep_for_retry(attempt_index)
                    continue
                return None
            except TimeoutError:
                attempt_trace["result"] = "timeout"
                attempt_trace["timeout_seconds"] = self.config.timeout_seconds
                self.last_error_detail = {
                    "kind": "timeout",
                    "timeout_seconds": self.config.timeout_seconds,
                    "task_model": task_config.model,
                    "base_url": task_config.base_url,
                }
                if attempt_index < total_attempts - 1:
                    self._sleep_for_retry(attempt_index)
                    continue
                return None
            except ValueError as error:
                attempt_trace["result"] = "value_error"
                attempt_trace["reason"] = str(error)
                self.last_error_detail = {
                    "kind": "value_error",
                    "reason": str(error),
                    "task_model": task_config.model,
                    "base_url": task_config.base_url,
                }
                if attempt_index < total_attempts - 1:
                    self._sleep_for_retry(attempt_index)
                    continue
                return None

            parsed_text = self._extract_text_from_response(raw_payload)
            if parsed_text is not None:
                if validate_text is not None and not validate_text(parsed_text):
                    preview = parsed_text.strip().replace("\n", " ")[:240]
                    self.last_error_detail = {
                        "kind": "invalid_json_response",
                        "response_length": len(parsed_text),
                        "response_preview": preview,
                        "task_model": task_config.model,
                        "base_url": task_config.base_url,
                    }
                    attempt_trace["result"] = "invalid_json_response"
                    attempt_trace["invalid_json_attempts"] = (
                        int(attempt_trace.get("invalid_json_attempts") or 0) + 1
                    )
                    if attempt_index < total_attempts - 1:
                        self._sleep_for_retry(attempt_index)
                        continue
                    return None
                self.last_error_detail = {}
                attempt_trace["result"] = "success"
                return parsed_text
            self.last_error_detail = {
                "kind": "invalid_response_payload",
                "task_model": task_config.model,
                "base_url": task_config.base_url,
            }
            attempt_trace["result"] = "invalid_response_payload"
            if attempt_index < total_attempts - 1:
                self._sleep_for_retry(attempt_index)
                continue
            return None
        return None

    def _extract_text_from_response(self, raw_payload: str) -> Optional[str]:
        try:
            decoded = json.loads(raw_payload)
        except json.JSONDecodeError:
            return None

        if not isinstance(decoded, dict):
            return None

        choices = decoded.get("choices")
        if not isinstance(choices, list) or not choices:
            return None
        first_choice = choices[0]
        if not isinstance(first_choice, dict):
            return None
        message = first_choice.get("message")
        if not isinstance(message, dict):
            return None
        content = message.get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                    continue
                if not isinstance(item, dict):
                    continue
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                    continue
                inner_text = item.get("content")
                if isinstance(inner_text, str):
                    parts.append(inner_text)
            joined = "\n".join(part.strip() for part in parts if part.strip())
            return joined or None
        return None

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        candidate = text.strip()
        if candidate.startswith("```"):
            candidate = self._strip_code_fence(candidate)

        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            candidate = self._extract_json_object(candidate)
            if not candidate:
                return None
            try:
                parsed = json.loads(candidate)
            except json.JSONDecodeError:
                return None

        if isinstance(parsed, dict):
            return parsed
        return None

    def _record_json_parse_failure(self, text: str, *, task: str) -> None:
        preview = text.strip().replace("\n", " ")[:240]
        self.last_error_detail = {
            "kind": "invalid_json_response",
            "task": task,
            "response_length": len(text),
            "response_preview": preview,
        }

    def _is_json_object_response(self, text: str) -> bool:
        return self._parse_json_response(text) is not None

    def _extract_json_object(self, text: str) -> Optional[str]:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        return text[start : end + 1]

    def _strip_code_fence(self, text: str) -> str:
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()

    def _build_headers(self, task_config: LLMTaskConfig) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if not task_config.api_key:
            return headers
        if task_config.api_key_header.lower() == "authorization":
            headers[task_config.api_key_header] = f"Bearer {task_config.api_key}"
        else:
            headers[task_config.api_key_header] = task_config.api_key
        return headers

    def _sleep_for_retry(self, attempt_index: int) -> None:
        if self.config.retry_backoff_ms <= 0:
            return
        wait_seconds = (self.config.retry_backoff_ms * (attempt_index + 1)) / 1000
        time.sleep(wait_seconds)


class LLMReportChatRuntime:
    """Report-aware chat runtime for the Pro report follow-up QA flow."""

    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    def reply(
        self,
        *,
        report_markdown: str,
        ai_qa_context: Optional[str],
        theme: str,
        painting_intention: Optional[str],
        painting_feeling: Optional[str],
        message: str,
        history: Optional[Sequence[Dict[str, str]]] = None,
    ) -> Optional[str]:
        history_lines: list[str] = []
        for item in history or []:
            if not isinstance(item, dict):
                continue
            role = str(item.get("role") or "").strip().lower()
            content = str(item.get("content") or "").strip()
            if role not in {"user", "assistant"} or not content:
                continue
            prefix = "用户" if role == "user" else "解读助手"
            history_lines.append(f"{prefix}：{content}")

        user_prompt = "\n\n".join(
            [
                f"主题：{theme or 'general'}",
                f"绘画前意图：{painting_intention or '未填写'}",
                f"绘画时感受：{painting_feeling or '未填写'}",
                f"报告全文：\n{report_markdown.strip()}",
                (
                    f"可追问线索：\n{ai_qa_context.strip()}"
                    if isinstance(ai_qa_context, str) and ai_qa_context.strip()
                    else "可追问线索：无"
                ),
                (
                    f"历史对话：\n{chr(10).join(history_lines)}"
                    if history_lines
                    else "历史对话：无"
                ),
                f"用户当前问题：{message.strip()}",
            ]
        )
        system_prompt = (
            "你是一名曼陀罗解读报告的延展问答助手。"
            "你的回答要温柔、具体、 grounded，并且只能基于当前这份报告做延展。"
            "不要编造报告里没有出现的重大诊断，不要给出医疗或心理治疗结论。"
            "如果用户的问题超出当前报告，请明确说明边界，并邀请对方回到画面、颜色、三圈结构和报告内容本身。"
            "回答优先用 2-4 段短段落。"
            "先回应用户为什么会有这种感受，再引用报告里的具体依据，最后给一个温和的小追问或小觉察方向。"
            "不要把整份报告重新复述一遍，不要堆概念，不要机械分点。"
        )
        return self.llm_client.generate_text(
            task="chat",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )


def create_llm_client_from_env() -> LLMClient:
    load_private_env_file()
    backend = os.getenv("AIMANDALA_LLM_BACKEND", "").strip().lower()
    if backend in {"", "noop", "none"}:
        modern_config = load_modern_llm_client_config_from_env()
        if modern_config is not None:
            return OpenAICompatibleLLMClient(modern_config)
        legacy_config = load_legacy_llm_client_config_from_env()
        if legacy_config is not None:
            return OpenAICompatibleLLMClient(legacy_config)
        return NoopLLMClient()
    if backend == "openai_compatible":
        return OpenAICompatibleLLMClient(load_llm_client_config_from_env())
    raise ValueError(f"Unsupported LLM backend: {backend}")


def load_private_env_file() -> None:
    env_file = os.getenv("AIMANDALA_ENV_FILE", "").strip()
    if not env_file:
        return
    env_path = Path(env_file).expanduser()
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        normalized_key = key.strip()
        if not normalized_key or normalized_key in os.environ:
            continue
        os.environ[normalized_key] = _strip_env_value(value)


def load_modern_llm_client_config_from_env() -> Optional[LLMClientConfig]:
    timeout_seconds = _read_positive_int_env(
        "AIMANDALA_LLM_TIMEOUT_SECONDS",
        default=30,
    )
    max_retries = _read_non_negative_int_env(
        "AIMANDALA_LLM_MAX_RETRIES",
        default=2,
    )
    retry_backoff_ms = _read_non_negative_int_env(
        "AIMANDALA_LLM_RETRY_BACKOFF_MS",
        default=400,
    )
    default_base_url = os.getenv("AIMANDALA_LLM_BASE_URL", "").strip()
    default_model = os.getenv(
        "AIMANDALA_LLM_MODEL",
        DEFAULT_DEEPSEEK_V4_MODEL,
    ).strip() or DEFAULT_DEEPSEEK_V4_MODEL
    default_api_key = os.getenv("AIMANDALA_LLM_API_KEY", "").strip() or None
    default_api_key_header = (
        os.getenv("AIMANDALA_LLM_API_KEY_HEADER", "Authorization").strip()
        or "Authorization"
    )
    if not any([default_base_url, default_api_key]):
        return None
    default_task = LLMTaskConfig(
        base_url=default_base_url or DEFAULT_DEEPSEEK_V4_BASE_URL,
        api_key=default_api_key,
        model=default_model,
        api_key_header=default_api_key_header,
    )
    return LLMClientConfig(
        default=default_task,
        chat=_load_task_config_from_env("AIMANDALA_LLM_CHAT", fallback=default_task)
        or default_task,
        chat_fallback=_load_task_config_from_env("AIMANDALA_LLM_CHAT_FALLBACK", fallback=default_task),
        vision=_load_task_config_from_env("AIMANDALA_LLM_VISION", fallback=default_task)
        or default_task,
        vision_fallback=_load_task_config_from_env("AIMANDALA_LLM_VISION_FALLBACK", fallback=default_task),
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
        retry_backoff_ms=retry_backoff_ms,
    )


def load_llm_client_config_from_env() -> LLMClientConfig:
    timeout_seconds = _read_positive_int_env(
        "AIMANDALA_LLM_TIMEOUT_SECONDS",
        default=30,
    )
    max_retries = _read_non_negative_int_env(
        "AIMANDALA_LLM_MAX_RETRIES",
        default=2,
    )
    retry_backoff_ms = _read_non_negative_int_env(
        "AIMANDALA_LLM_RETRY_BACKOFF_MS",
        default=400,
    )
    default_base_url = (
        os.getenv("AIMANDALA_LLM_BASE_URL", "").strip()
        or DEFAULT_DEEPSEEK_V4_BASE_URL
    )
    default_model = os.getenv(
        "AIMANDALA_LLM_MODEL",
        DEFAULT_DEEPSEEK_V4_MODEL,
    ).strip() or DEFAULT_DEEPSEEK_V4_MODEL
    default_api_key = os.getenv("AIMANDALA_LLM_API_KEY", "").strip() or None
    default_api_key_header = (
        os.getenv("AIMANDALA_LLM_API_KEY_HEADER", "Authorization").strip()
        or "Authorization"
    )
    default_task = LLMTaskConfig(
        base_url=default_base_url,
        api_key=default_api_key,
        model=default_model,
        api_key_header=default_api_key_header,
    )

    return LLMClientConfig(
        default=default_task,
        chat=_load_task_config_from_env("AIMANDALA_LLM_CHAT", fallback=default_task)
        or default_task,
        chat_fallback=_load_task_config_from_env("AIMANDALA_LLM_CHAT_FALLBACK", fallback=default_task),
        vision=_load_task_config_from_env("AIMANDALA_LLM_VISION", fallback=default_task)
        or default_task,
        vision_fallback=_load_task_config_from_env("AIMANDALA_LLM_VISION_FALLBACK", fallback=default_task),
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
        retry_backoff_ms=retry_backoff_ms,
    )


def load_legacy_llm_client_config_from_env() -> Optional[LLMClientConfig]:
    legacy_api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not legacy_api_key:
        return None

    timeout_seconds = _read_positive_int_env(
        "AIMANDALA_LLM_TIMEOUT_SECONDS",
        default=30,
    )
    max_retries = _read_non_negative_int_env(
        "AIMANDALA_LLM_MAX_RETRIES",
        default=2,
    )
    retry_backoff_ms = _read_non_negative_int_env(
        "AIMANDALA_LLM_RETRY_BACKOFF_MS",
        default=400,
    )

    default_task = _build_legacy_task_config(
        base_url=os.getenv("AIMANDALA_LLM_BASE_URL", "").strip()
        or DEFAULT_DEEPSEEK_V4_BASE_URL,
        api_key=legacy_api_key,
        model=os.getenv("AIMANDALA_LLM_MODEL", "").strip()
        or DEFAULT_DEEPSEEK_V4_MODEL,
    )

    return LLMClientConfig(
        default=default_task,
        chat=default_task,
        chat_fallback=None,
        vision=default_task,
        vision_fallback=None,
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
        retry_backoff_ms=retry_backoff_ms,
    )


def _load_task_config_from_env(
    prefix: str,
    *,
    fallback: LLMTaskConfig,
) -> Optional[LLMTaskConfig]:
    base_url = os.getenv(f"{prefix}_BASE_URL", "").strip()
    model = os.getenv(f"{prefix}_MODEL", "").strip()
    api_key_raw = os.getenv(f"{prefix}_API_KEY")
    api_key_header = os.getenv(f"{prefix}_API_KEY_HEADER", "").strip()

    if not any([base_url, model, api_key_raw, api_key_header]):
        return None

    return LLMTaskConfig(
        base_url=base_url or fallback.base_url,
        api_key=(api_key_raw.strip() if isinstance(api_key_raw, str) and api_key_raw.strip() else fallback.api_key),
        model=model or fallback.model,
        api_key_header=api_key_header or fallback.api_key_header,
    )


def _build_legacy_task_config(
    *,
    base_url: str,
    api_key: Optional[str],
    model: str,
) -> LLMTaskConfig:
    return LLMTaskConfig(
        base_url=base_url,
        api_key=api_key or None,
        model=model,
        api_key_header="Authorization",
    )


def _strip_env_value(raw_value: str) -> str:
    value = raw_value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _read_positive_int_env(name: str, *, default: int) -> int:
    raw_value = os.getenv(name, str(default)).strip()
    try:
        parsed = int(raw_value)
    except ValueError as error:
        raise ValueError(f"{name} must be a positive integer") from error
    if parsed <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return parsed


def _read_non_negative_int_env(name: str, *, default: int) -> int:
    raw_value = os.getenv(name, str(default)).strip()
    try:
        parsed = int(raw_value)
    except ValueError as error:
        raise ValueError(f"{name} must be a non-negative integer") from error
    if parsed < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return parsed
