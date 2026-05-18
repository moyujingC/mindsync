"""Prompt template loading for API-level seeded report fallbacks."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path


PROMPTS_ROOT = Path(__file__).with_name("prompts")


@lru_cache(maxsize=None)
def load_prompt_template(name: str) -> str:
    path = PROMPTS_ROOT / name
    if not path.exists():
        raise FileNotFoundError(f"prompt template not found: {path}")
    return path.read_text(encoding="utf-8").strip()
