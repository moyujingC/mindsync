"""Prompt runtime abstraction for model-backed Lite/Pro generation."""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class PromptRuntime(Protocol):
    """Contract for executing prompt + schema and returning structured fields."""

    def generate_lite(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        ...

    def generate_pro(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        ...


class NoopPromptRuntime:
    """Default runtime that disables model execution and returns no payload."""

    def generate_lite(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        return None

    def generate_pro(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        return None


@dataclass(frozen=True)
class HTTPPromptRuntimeConfig:
    endpoint_url: str
    timeout_seconds: int = 20
    api_key: Optional[str] = None
    api_key_header: str = "Authorization"
    max_retries: int = 2
    retry_backoff_ms: int = 300


class HTTPPromptRuntime:
    """HTTP-backed prompt runtime for external model gateway integration."""

    def __init__(self, config: HTTPPromptRuntimeConfig) -> None:
        self.config = config

    def generate_lite(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        return self._generate(report_type="lite", prompt=prompt, schema=schema)

    def generate_pro(
        self,
        *,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        return self._generate(report_type="pro", prompt=prompt, schema=schema)

    def _generate(
        self,
        *,
        report_type: str,
        prompt: str,
        schema: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        payload = {
            "protocol_version": "aimandala.prompt-runtime.v1",
            "report_type": report_type,
            "input": {
                "prompt": prompt,
                "schema": schema,
            },
            # keep flat fields for backward compatibility with early gateway stubs
            "prompt": prompt,
            "schema": schema,
        }
        total_attempts = self.config.max_retries + 1
        for attempt_index in range(total_attempts):
            request = Request(
                self.config.endpoint_url,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers=self._build_headers(),
                method="POST",
            )
            try:
                with urlopen(request, timeout=self.config.timeout_seconds) as response:
                    raw = response.read().decode("utf-8")
            except (HTTPError, URLError, TimeoutError, ValueError) as error:
                if (
                    attempt_index < total_attempts - 1
                    and self._is_retryable_error(error)
                ):
                    self._sleep_for_retry(attempt_index)
                    continue
                return None

            parsed = self._parse_response_payload(raw, requested_report_type=report_type)
            if parsed is not None:
                return parsed
            if attempt_index < total_attempts - 1:
                self._sleep_for_retry(attempt_index)
                continue
            return None
        return None

    def _parse_response_payload(
        self,
        raw_payload: str,
        *,
        requested_report_type: str,
    ) -> Optional[Dict[str, Any]]:
        try:
            decoded = json.loads(raw_payload)
        except json.JSONDecodeError:
            return None

        if not isinstance(decoded, dict):
            return None
        if decoded.get("ok") is False:
            return None

        structured = decoded.get("structured")
        if isinstance(structured, dict):
            return self._normalize_structured_payload(
                decoded.get("report_type") or requested_report_type,
                structured,
            )
        data = decoded.get("data")
        if isinstance(data, dict):
            nested_structured = data.get("structured")
            if isinstance(nested_structured, dict):
                report_type = data.get("report_type") or decoded.get("report_type")
                return self._normalize_structured_payload(report_type, nested_structured)
        return self._normalize_structured_payload(
            decoded.get("report_type") or requested_report_type,
            decoded,
        )

    def _normalize_structured_payload(
        self,
        report_type: Any,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not isinstance(payload, dict):
            return {}
        normalized_type = str(report_type or "").strip().lower()
        if normalized_type == "lite":
            return self._normalize_lite_payload(payload)
        if normalized_type == "pro":
            return self._normalize_pro_payload(payload)
        if self._looks_like_pro_payload(payload):
            return self._normalize_pro_payload(payload)
        return self._normalize_lite_payload(payload)

    def _normalize_lite_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload = self._extract_lite_source_payload(payload)
        alias_map = {
            "title": ["title", "标题", "report_title"],
            "overall_impression": ["overall_impression", "整体印象", "overall", "opening_hit", "openingHit"],
            "visual_elements": ["visual_elements", "画面元素分析", "visual"],
            "emotion_portrait": ["emotion_portrait", "情绪画像", "emotion"],
            "story": ["story", "心灵画像故事"],
            "theme_scene": ["theme_scene", "themeScene", "主题场景", "scene"],
            "theme_impact": ["theme_impact", "themeImpact", "主题影响", "impact"],
            "theme_awareness": ["theme_awareness", "themeAwareness", "主题觉察", "awareness"],
            "three_awareness": ["three_awareness", "threeAwareness", "三个日常小觉察", "daily_awareness", "dailyAwareness"],
            "pro_teaser": ["pro_teaser", "proTeaser", "pro预告", "pro_teaser_text"],
        }
        normalized: Dict[str, Any] = {}
        for canonical_key, aliases in alias_map.items():
            value = self._pick_alias_value(payload, aliases)
            if value is not None:
                normalized[canonical_key] = value

        visual_evidence = self._pick_alias_value(payload, ["visual_evidence", "visualEvidence"])
        if "visual_elements" not in normalized and isinstance(visual_evidence, dict):
            summary = visual_evidence.get("summary")
            if isinstance(summary, str) and summary.strip():
                normalized["visual_elements"] = summary.strip()

        state_interpretation = self._pick_alias_value(
            payload,
            ["state_interpretation", "stateInterpretation"],
        )
        if "emotion_portrait" not in normalized and isinstance(state_interpretation, dict):
            combined = self._compose_text_sections(
                [
                    state_interpretation.get("current_state"),
                    state_interpretation.get("emotional_tension"),
                    state_interpretation.get("explanation_chain"),
                ]
            )
            if combined:
                normalized["emotion_portrait"] = combined

        pattern_naming = self._pick_alias_value(payload, ["pattern_naming", "patternNaming"])
        reality_connection = self._pick_alias_value(
            payload,
            ["reality_connection", "realityConnection"],
        )
        next_step = self._pick_alias_value(payload, ["next_step", "nextStep"])
        theme_insights = self._pick_alias_value(payload, ["theme_insights", "themeInsights"])

        if "story" not in normalized:
            story = self._build_story_from_self_understanding_blocks(
                state_interpretation=state_interpretation,
                pattern_naming=pattern_naming,
                reality_connection=reality_connection,
                next_step=next_step,
            )
            if story:
                normalized["story"] = story

        if "theme_scene" not in normalized:
            theme_scene = self._pick_nested_string(theme_insights, "scene") or self._pick_nested_string(
                reality_connection,
                "typical_scene",
            )
            if theme_scene:
                normalized["theme_scene"] = theme_scene

        if "theme_impact" not in normalized:
            theme_impact = self._pick_nested_string(theme_insights, "impact") or self._pick_nested_string(
                reality_connection,
                "current_impact",
            )
            if theme_impact:
                normalized["theme_impact"] = theme_impact

        if "theme_awareness" not in normalized:
            theme_awareness = self._pick_nested_string(theme_insights, "awareness")
            if not theme_awareness:
                theme_awareness = self._pick_nested_string(next_step, "direction")
            if not theme_awareness:
                theme_awareness = self._pick_nested_string(next_step, "action")
            if theme_awareness:
                normalized["theme_awareness"] = theme_awareness

        story = normalized.get("story")
        if isinstance(story, dict):
            normalized["story"] = self._normalize_story_payload(story)
        return normalized

    def _extract_lite_source_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        nested = payload.get("self_understanding_report")
        if not isinstance(nested, dict):
            return payload
        merged = dict(payload)
        for key, value in nested.items():
            merged.setdefault(key, value)
        return merged

    def _normalize_story_payload(self, story: Dict[str, Any]) -> Dict[str, Any]:
        alias_map = {
            "base": ["base", "起", "底色"],
            "contradiction": ["contradiction", "承", "矛盾"],
            "pattern": ["pattern", "转一", "模式"],
            "defense": ["defense", "转二", "防御"],
            "block": ["block", "合", "卡点"],
            "light": ["light", "升", "光"],
        }
        normalized: Dict[str, Any] = {}
        for canonical_key, aliases in alias_map.items():
            value = self._pick_alias_value(story, aliases)
            if value is not None:
                normalized[canonical_key] = value
        return normalized

    def _build_story_from_self_understanding_blocks(
        self,
        *,
        state_interpretation: Any,
        pattern_naming: Any,
        reality_connection: Any,
        next_step: Any,
    ) -> Dict[str, Any]:
        if not any(
            isinstance(item, dict)
            for item in [state_interpretation, pattern_naming, reality_connection, next_step]
        ):
            return {}

        story: Dict[str, Any] = {}
        base = self._pick_nested_string(state_interpretation, "current_state")
        contradiction = self._pick_nested_string(state_interpretation, "emotional_tension")
        pattern_name = self._pick_nested_string(pattern_naming, "pattern_name")
        pattern_description = self._pick_nested_string(pattern_naming, "pattern_description")
        protective_logic = self._pick_nested_string(pattern_naming, "protective_logic")
        current_impact = self._pick_nested_string(reality_connection, "current_impact")
        direction = self._pick_nested_string(next_step, "direction")

        if base:
            story["base"] = base
        if contradiction:
            story["contradiction"] = contradiction
        pattern_text = self._compose_text_sections([pattern_name, pattern_description], separator="：")
        if pattern_text:
            story["pattern"] = pattern_text
        if protective_logic:
            story["defense"] = protective_logic
        if current_impact:
            story["block"] = current_impact
        if direction:
            story["light"] = direction
        return story

    def _normalize_pro_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        alias_map = {
            "first_impression": ["first_impression", "第一眼直觉", "firstImpression"],
            "core_insight_table": ["core_insight_table", "核心洞察表格", "coreInsightTable"],
            "three_circles_detailed": ["three_circles_detailed", "三圈能量画像", "threeCirclesDetailed"],
            "micro_analysis_detailed": ["micro_analysis_detailed", "微观能量分析", "microAnalysisDetailed"],
            "imbalance_confirmed": ["imbalance_confirmed", "失衡类型识别", "imbalanceConfirmed"],
            "root_cause": ["root_cause", "根源探索", "rootCause"],
            "healing_suggestions": ["healing_suggestions", "疗愈建议", "healingSuggestions"],
        }
        normalized: Dict[str, Any] = {}
        for canonical_key, aliases in alias_map.items():
            value = self._pick_alias_value(payload, aliases)
            if value is not None:
                normalized[canonical_key] = value
        return normalized

    def _pick_alias_value(self, payload: Dict[str, Any], aliases: list[str]) -> Any:
        for key in aliases:
            if key in payload:
                return payload[key]
        return None

    def _pick_nested_string(self, payload: Any, key: str) -> str | None:
        if not isinstance(payload, dict):
            return None
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        return None

    def _compose_text_sections(
        self,
        values: list[Any],
        *,
        separator: str = "\n\n",
    ) -> str:
        parts = [value.strip() for value in values if isinstance(value, str) and value.strip()]
        return separator.join(parts)

    def _looks_like_pro_payload(self, payload: Dict[str, Any]) -> bool:
        pro_markers = {
            "first_impression",
            "第一眼直觉",
            "core_insight_table",
            "核心洞察表格",
            "imbalance_confirmed",
            "失衡类型识别",
        }
        return any(key in payload for key in pro_markers)

    def _is_retryable_error(self, error: BaseException) -> bool:
        if isinstance(error, HTTPError):
            return error.code in {408, 409, 425, 429, 500, 502, 503, 504}
        if isinstance(error, TimeoutError):
            return True
        if isinstance(error, URLError):
            return True
        return False

    def _sleep_for_retry(self, attempt_index: int) -> None:
        if self.config.retry_backoff_ms <= 0:
            return
        # simple linear backoff: 1x, 2x, 3x...
        wait_seconds = (self.config.retry_backoff_ms * (attempt_index + 1)) / 1000
        time.sleep(wait_seconds)

    def _build_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if not self.config.api_key:
            return headers
        if self.config.api_key_header.lower() == "authorization":
            headers[self.config.api_key_header] = f"Bearer {self.config.api_key}"
        else:
            headers[self.config.api_key_header] = self.config.api_key
        return headers


def create_prompt_runtime_from_env(llm_client: Optional[Any] = None) -> PromptRuntime:
    backend = os.getenv("AIMANDALA_PROMPT_RUNTIME_BACKEND", "").strip().lower()
    if backend in {"noop", "none"}:
        return NoopPromptRuntime()
    if backend == "http":
        return HTTPPromptRuntime(load_http_prompt_runtime_config_from_env())
    if backend:
        raise ValueError(f"Unsupported prompt runtime backend: {backend}")

    llm_backend = os.getenv("AIMANDALA_LLM_BACKEND", "").strip().lower()
    if llm_backend not in {"", "noop", "none"}:
        from app.core.llm import LLMPromptRuntime, NoopLLMClient, create_llm_client_from_env

        resolved_client = llm_client or create_llm_client_from_env()
        if isinstance(resolved_client, NoopLLMClient):
            return NoopPromptRuntime()
        return LLMPromptRuntime(resolved_client)

    if llm_client is not None:
        from app.core.llm import LLMPromptRuntime, NoopLLMClient

        if not isinstance(llm_client, NoopLLMClient):
            return LLMPromptRuntime(llm_client)

    return NoopPromptRuntime()


def load_http_prompt_runtime_config_from_env() -> HTTPPromptRuntimeConfig:
    endpoint_url = os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_URL", "").strip()
    if not endpoint_url:
        raise ValueError("Missing required prompt runtime config: AIMANDALA_PROMPT_RUNTIME_HTTP_URL")

    timeout_raw = os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS", "20").strip()
    try:
        timeout_seconds = int(timeout_raw)
    except ValueError as error:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS must be a positive integer"
        ) from error
    if timeout_seconds <= 0:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_TIMEOUT_SECONDS must be a positive integer"
        )

    max_retries_raw = os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES", "2").strip()
    try:
        max_retries = int(max_retries_raw)
    except ValueError as error:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES must be a non-negative integer"
        ) from error
    if max_retries < 0:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_MAX_RETRIES must be a non-negative integer"
        )

    retry_backoff_raw = os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS", "300").strip()
    try:
        retry_backoff_ms = int(retry_backoff_raw)
    except ValueError as error:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS must be a non-negative integer"
        ) from error
    if retry_backoff_ms < 0:
        raise ValueError(
            "AIMANDALA_PROMPT_RUNTIME_HTTP_RETRY_BACKOFF_MS must be a non-negative integer"
        )

    api_key = os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY", "").strip() or None
    api_key_header = (
        os.getenv("AIMANDALA_PROMPT_RUNTIME_HTTP_API_KEY_HEADER", "Authorization").strip()
        or "Authorization"
    )

    return HTTPPromptRuntimeConfig(
        endpoint_url=endpoint_url,
        timeout_seconds=timeout_seconds,
        api_key=api_key,
        api_key_header=api_key_header,
        max_retries=max_retries,
        retry_backoff_ms=retry_backoff_ms,
    )
