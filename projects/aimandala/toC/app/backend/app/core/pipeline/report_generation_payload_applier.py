"""Payload application helpers for prompt-backed report generation runtimes."""

from __future__ import annotations

from typing import Any

from .data_models import DailyAwareness, Layer1LiteDraft, Layer3ProDraft


def apply_lite_generation_payload(
    layer: Layer1LiteDraft,
    payload: dict[str, Any],
) -> None:
    """Merge prompt-backed Lite payloads into an existing draft."""

    layer.title = _merge_polished_string(payload.get("title"), layer.title)
    layer.overall_impression = _merge_polished_string(
        payload.get("overall_impression"),
        layer.overall_impression,
    )
    layer.visual_elements = _merge_polished_string(
        payload.get("visual_elements"),
        layer.visual_elements,
    )
    layer.emotion_portrait = _merge_polished_string(
        payload.get("emotion_portrait"),
        layer.emotion_portrait,
    )
    layer.pro_teaser = _merge_polished_string(
        payload.get("pro_teaser"),
        layer.pro_teaser,
    )

    story = payload.get("story")
    if isinstance(story, dict):
        layer.story.base.content = _merge_polished_string(
            story.get("base"),
            layer.story.base.content,
        )
        layer.story.contradiction.content = _merge_polished_string(
            story.get("contradiction"),
            layer.story.contradiction.content,
        )
        layer.story.pattern.content = _merge_polished_string(
            story.get("pattern"),
            layer.story.pattern.content,
        )
        layer.story.defense.content = _merge_polished_string(
            story.get("defense"),
            layer.story.defense.content,
        )
        layer.story.block.content = _merge_polished_string(
            story.get("block"),
            layer.story.block.content,
        )
        layer.story.light.content = _merge_polished_string(
            story.get("light"),
            layer.story.light.content,
        )

    layer.theme_insights.scene = _merge_polished_string(
        payload.get("theme_scene"),
        layer.theme_insights.scene,
    )
    layer.theme_insights.impact = _merge_polished_string(
        payload.get("theme_impact"),
        layer.theme_insights.impact,
    )
    layer.theme_insights.awareness = _merge_polished_string(
        payload.get("theme_awareness"),
        layer.theme_insights.awareness,
    )
    layer.three_awareness = _merge_polished_daily_awareness(
        payload.get("three_awareness"),
        layer.three_awareness,
    )


def apply_pro_generation_payload(
    layer: Layer3ProDraft,
    payload: dict[str, Any],
) -> None:
    """Merge prompt-backed Pro payloads into an existing draft."""

    layer.first_impression = _merge_polished_string(
        payload.get("first_impression"),
        layer.first_impression,
    )
    layer.core_insight_table = _merge_polished_str_dict(
        payload.get("core_insight_table"),
        layer.core_insight_table,
    )
    layer.micro_analysis_detailed = _merge_polished_str_dict(
        payload.get("micro_analysis_detailed"),
        layer.micro_analysis_detailed,
    )
    layer.root_cause = _merge_polished_str_dict(
        payload.get("root_cause"),
        layer.root_cause,
    )
    layer.three_circles_detailed = _merge_polished_nested_str_dict(
        payload.get("three_circles_detailed"),
        layer.three_circles_detailed,
    )
    layer.imbalance_confirmed = _merge_polished_any_dict(
        payload.get("imbalance_confirmed"),
        layer.imbalance_confirmed,
    )
    layer.healing_suggestions = _merge_polished_list_of_dicts(
        payload.get("healing_suggestions"),
        layer.healing_suggestions,
    )


def _coerce_string(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _merge_polished_string(value: Any, fallback: str) -> str:
    if isinstance(fallback, str) and fallback.strip():
        return fallback
    return _coerce_string(value, fallback)


def _coerce_str_dict(value: Any, fallback: dict[str, str]) -> dict[str, str]:
    if not isinstance(value, dict):
        return fallback
    result: dict[str, str] = {}
    for key, item in value.items():
        if not isinstance(key, str):
            continue
        if not isinstance(item, str):
            continue
        if not item.strip():
            continue
        result[key] = item.strip()
    return result or fallback


def _merge_polished_str_dict(
    value: Any,
    fallback: dict[str, str],
) -> dict[str, str]:
    if not isinstance(fallback, dict) or not fallback:
        return _coerce_str_dict(value, fallback)
    return dict(fallback)


def _merge_polished_nested_str_dict(
    value: Any,
    fallback: dict[str, dict[str, str]],
) -> dict[str, dict[str, str]]:
    if not isinstance(fallback, dict) or not fallback:
        if not isinstance(value, dict):
            return fallback
        result: dict[str, dict[str, str]] = {}
        for key, item in value.items():
            if not isinstance(key, str) or not isinstance(item, dict):
                continue
            result[key] = {
                inner_key: inner_value.strip()
                for inner_key, inner_value in item.items()
                if isinstance(inner_key, str)
                and isinstance(inner_value, str)
                and inner_value.strip()
            }
        return result or fallback
    return {
        key: dict(item) if isinstance(item, dict) else item
        for key, item in fallback.items()
    }


def _merge_polished_any_dict(
    value: Any,
    fallback: dict[str, Any],
) -> dict[str, Any]:
    if not isinstance(fallback, dict) or not fallback:
        return value if isinstance(value, dict) else fallback
    return dict(fallback)


def _merge_polished_list_of_dicts(
    value: Any,
    fallback: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not isinstance(fallback, list) or not fallback:
        if not isinstance(value, list):
            return fallback
        result: list[dict[str, Any]] = []
        for item in value:
            if isinstance(item, dict):
                result.append(dict(item))
        return result or fallback
    return [dict(item) if isinstance(item, dict) else item for item in fallback]


def _coerce_daily_awareness(
    value: Any,
    fallback: list[DailyAwareness],
) -> list[DailyAwareness]:
    if not isinstance(value, list):
        return fallback

    result: list[DailyAwareness] = []
    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        content = item.get("content")
        if not isinstance(title, str) or not title.strip():
            continue
        if not isinstance(content, str) or not content.strip():
            continue
        day_raw = item.get("day")
        day = day_raw if isinstance(day_raw, int) and day_raw > 0 else index
        result.append(
            DailyAwareness(
                day=day,
                title=title.strip(),
                content=content.strip(),
            )
        )

    return result or fallback


def _merge_polished_daily_awareness(
    value: Any,
    fallback: list[DailyAwareness],
) -> list[DailyAwareness]:
    if isinstance(fallback, list) and fallback:
        return list(fallback)
    return _coerce_daily_awareness(value, fallback)
