"""Fixture input collector for mandala reading agent MVP runs."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from .contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
MANIFEST_PATH = AIMANDALA_ROOT / "fixtures" / "manifest.yaml"


def load_fixture_agent_input(
    fixture_id: str,
    *,
    report_mode: Literal["lite", "pro"] = "lite",
) -> MandalaAgentInput:
    descriptor_path = _find_fixture_descriptor(fixture_id)
    descriptor = _parse_simple_yaml(descriptor_path)
    input_payload = descriptor.get("input")
    if not isinstance(input_payload, dict):
        raise ValueError(f"{fixture_id}: input block missing")
    raw_image_path = str(input_payload.get("image_path") or "").strip()
    if not raw_image_path:
        raise ValueError(f"{fixture_id}: input.image_path missing")
    image_path = _resolve_aimandala_path(raw_image_path)
    if not image_path.exists():
        raise ValueError(f"{fixture_id}: image not found: {image_path}")

    theme = str(descriptor.get("theme") or "general").strip() or "general"
    return MandalaAgentInput(
        report_mode=report_mode,
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme=theme,
            theme_label=_theme_label(theme),
            painting_intention=str(input_payload.get("painting_intention") or "").strip(),
            painting_feeling=str(input_payload.get("painting_feeling") or "").strip(),
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def _find_fixture_descriptor(fixture_id: str) -> Path:
    current_id: str | None = None
    for raw_line in MANIFEST_PATH.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("- id:"):
            current_id = stripped.split(":", 1)[1].strip()
            continue
        if current_id == fixture_id and stripped.startswith("path:"):
            return _resolve_aimandala_path(stripped.split(":", 1)[1].strip())
    raise ValueError(f"fixture id not found: {fixture_id}")


def _parse_simple_yaml(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = {}
    current_block: dict[str, Any] | None = None
    current_list_key: str | None = None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip(" "))
        if stripped.startswith("- ") and current_list_key and current_block is not None:
            target = current_block[current_list_key]
            if isinstance(target, list):
                target.append(stripped[2:].strip())
            continue
        if ":" not in stripped:
            continue

        key, value = stripped.split(":", 1)
        key = key.strip()
        value = value.strip()
        if indent == 0:
            current_block = None
            current_list_key = None
            if value:
                data[key] = value
            else:
                next_container: dict[str, Any] = {}
                data[key] = next_container
                current_block = next_container
            continue
        if current_block is not None:
            if value:
                current_block[key] = value
            else:
                current_block[key] = []
                current_list_key = key
    return data


def _resolve_aimandala_path(raw_path: str) -> Path:
    path = raw_path.strip()
    if path.startswith("$REPO_ROOT/"):
        return AIMANDALA_ROOT.parents[1] / path[len("$REPO_ROOT/") :]
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return AIMANDALA_ROOT / candidate


def _theme_label(theme: str) -> str:
    labels = {
        "general": "全面解读",
        "health_wellness": "健康疗愈",
        "intimate_relationship": "亲密关系",
        "wealth_career": "财富事业",
        "personal_growth": "个人成长",
        "parent_child_relationship": "亲子关系",
        "father_relationship": "父亲关系",
        "mother_relationship": "母亲关系",
    }
    return labels.get(theme, theme)
