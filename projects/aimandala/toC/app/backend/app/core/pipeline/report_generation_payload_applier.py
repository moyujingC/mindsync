"""Payload application helpers for prompt-backed report generation runtimes."""

from __future__ import annotations

from typing import Any

from .data_models import DailyAwareness, Layer1LiteDraft, Layer3ProDraft


def apply_lite_generation_payload(
    layer: Layer1LiteDraft,
    payload: dict[str, Any],
) -> None:
    """Merge prompt-backed Lite payloads into an existing draft."""

    layer.title = _coerce_string(payload.get("title"), layer.title)
    layer.overall_impression = _coerce_string(
        payload.get("overall_impression"),
        layer.overall_impression,
    )
    layer.visual_elements = _coerce_string(
        payload.get("visual_elements"),
        layer.visual_elements,
    )
    layer.emotion_portrait = _coerce_string(
        payload.get("emotion_portrait"),
        layer.emotion_portrait,
    )
    layer.pro_teaser = _coerce_string(payload.get("pro_teaser"), layer.pro_teaser)

    story = payload.get("story")
    if isinstance(story, dict):
        layer.story.base.content = _coerce_string(
            story.get("base"),
            layer.story.base.content,
        )
        layer.story.contradiction.content = _coerce_string(
            story.get("contradiction"),
            layer.story.contradiction.content,
        )
        layer.story.pattern.content = _coerce_string(
            story.get("pattern"),
            layer.story.pattern.content,
        )
        layer.story.defense.content = _coerce_string(
            story.get("defense"),
            layer.story.defense.content,
        )
        layer.story.block.content = _coerce_string(
            story.get("block"),
            layer.story.block.content,
        )
        layer.story.light.content = _coerce_string(
            story.get("light"),
            layer.story.light.content,
        )

    layer.theme_insights.scene = _coerce_string(
        payload.get("theme_scene"),
        layer.theme_insights.scene,
    )
    layer.theme_insights.impact = _coerce_string(
        payload.get("theme_impact"),
        layer.theme_insights.impact,
    )
    layer.theme_insights.awareness = _coerce_string(
        payload.get("theme_awareness"),
        layer.theme_insights.awareness,
    )
    layer.three_awareness = _coerce_daily_awareness(
        payload.get("three_awareness"),
        layer.three_awareness,
    )


def apply_pro_generation_payload(
    layer: Layer3ProDraft,
    payload: dict[str, Any],
) -> None:
    """Merge prompt-backed Pro payloads into an existing draft."""

    layer.first_impression = _coerce_string(
        payload.get("first_impression"),
        layer.first_impression,
    )
    layer.core_insight_table = _coerce_str_dict(
        payload.get("core_insight_table"),
        layer.core_insight_table,
    )
    layer.micro_analysis_detailed = _coerce_str_dict(
        payload.get("micro_analysis_detailed"),
        layer.micro_analysis_detailed,
    )
    layer.root_cause = _coerce_str_dict(
        payload.get("root_cause"),
        layer.root_cause,
    )
    if isinstance(payload.get("three_circles_detailed"), dict):
        layer.three_circles_detailed = payload["three_circles_detailed"]
    if isinstance(payload.get("imbalance_confirmed"), dict):
        layer.imbalance_confirmed = payload["imbalance_confirmed"]
    if isinstance(payload.get("healing_suggestions"), list):
        layer.healing_suggestions = payload["healing_suggestions"]


def _coerce_string(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


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
