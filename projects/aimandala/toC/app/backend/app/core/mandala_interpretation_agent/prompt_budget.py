"""Prompt cache budget estimates for generated mandala prompt packs."""

from __future__ import annotations

from typing import Any


DEFAULT_CONTEXT_LIMIT_TOKENS = 1_000_000
SOFT_WARNING_RATIO = 0.50
HARD_WARNING_RATIO = 0.80


def build_prompt_budget_manifest(
    text: str,
    *,
    context_limit_tokens: int = DEFAULT_CONTEXT_LIMIT_TOKENS,
) -> dict[str, Any]:
    estimated_tokens, estimator = estimate_prompt_tokens(text)
    remaining_tokens = max(context_limit_tokens - estimated_tokens, 0)
    usage_ratio = estimated_tokens / context_limit_tokens if context_limit_tokens > 0 else 0
    return {
        "estimator": estimator,
        "context_limit_tokens": context_limit_tokens,
        "estimated_tokens": estimated_tokens,
        "remaining_tokens": remaining_tokens,
        "usage_ratio": round(usage_ratio, 4),
        "usage_percent": round(usage_ratio * 100, 2),
        "warning_level": _warning_level(usage_ratio),
        "warning_thresholds": {
            "soft_warning_ratio": SOFT_WARNING_RATIO,
            "hard_warning_ratio": HARD_WARNING_RATIO,
        },
    }


def estimate_prompt_tokens(text: str) -> tuple[int, str]:
    try:
        import tiktoken  # type: ignore[import-not-found]

        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text)), "tiktoken:cl100k_base"
    except Exception:
        # Conservative fallback for mixed Chinese/English prompt text.
        return max(1, int(len(text) * 0.75)), "char_count_x0.75_fallback"


def _warning_level(usage_ratio: float) -> str:
    if usage_ratio >= HARD_WARNING_RATIO:
        return "hard"
    if usage_ratio >= SOFT_WARNING_RATIO:
        return "soft"
    return "none"
