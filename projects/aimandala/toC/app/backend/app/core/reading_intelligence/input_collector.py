"""Input collectors for mandala reading agent fixtures."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from .contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
FIXTURE_ROOT = AIMANDALA_ROOT / "fixtures" / "toc-mvp"


def load_fixture_agent_input(
    fixture_id: str,
    *,
    report_mode: str | None = None,
) -> MandalaAgentInput:
    """Load a toc-mvp fixture into the new reading agent input contract."""

    fixture_path = FIXTURE_ROOT / f"{fixture_id}.yaml"
    if not fixture_path.exists():
        raise FileNotFoundError(f"fixture not found: {fixture_path}")

    fixture = yaml.safe_load(fixture_path.read_text(encoding="utf-8")) or {}
    input_payload: dict[str, Any] = fixture.get("input") or {}
    asset_ref: dict[str, Any] = fixture.get("asset_ref") or {}
    image_path = input_payload.get("image_path") or asset_ref.get("asset_path") or ""
    resolved_image_path = AIMANDALA_ROOT / image_path
    selected_report_mode = report_mode or input_payload.get("expected_report_version") or "lite"
    theme = str(fixture.get("theme") or "general")

    return MandalaAgentInput(
        report_mode=selected_report_mode,
        image=MandalaImageInput(local_path=str(resolved_image_path)),
        user_context=MandalaUserContext(
            theme=theme,
            theme_label=_theme_label(theme),
            painting_intention=str(input_payload.get("painting_intention") or ""),
            painting_feeling=str(input_payload.get("painting_feeling") or ""),
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "fixture_default",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def _theme_label(theme: str) -> str:
    labels = {
        "general": "全面解读",
    }
    return labels.get(theme, theme)
