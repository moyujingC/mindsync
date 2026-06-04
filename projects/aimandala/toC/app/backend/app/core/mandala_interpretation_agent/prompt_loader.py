"""Prompt template loading for the mandala interpretation agent."""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Any


PROMPTS_ROOT = Path(__file__).with_name("prompts")


class _SafeFormatDict(dict[str, Any]):
    def __missing__(self, key: str) -> str:
        raise KeyError(f"prompt template variable missing: {key}")


@lru_cache(maxsize=None)
def load_prompt_template(name: str) -> str:
    path = PROMPTS_ROOT / name
    if not path.exists():
        raise FileNotFoundError(f"prompt template not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def render_prompt_template(name: str, **values: Any) -> str:
    template = load_prompt_template(name)
    return template.format_map(_SafeFormatDict(values))


def load_prompt_config(name: str) -> dict[str, Any]:
    path = PROMPTS_ROOT / name
    if not path.exists():
        raise FileNotFoundError(f"prompt config not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"prompt config must be a JSON object: {path}")
    return data
