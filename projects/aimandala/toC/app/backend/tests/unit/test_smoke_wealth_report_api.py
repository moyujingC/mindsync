"""Tests for the wealth report API smoke script helpers."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "smoke_wealth_report_api.py"
)


def _load_smoke_module():
    spec = importlib.util.spec_from_file_location(
        "smoke_wealth_report_api",
        SCRIPT_PATH,
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_redeem_code_for_mode_prefers_explicit_code():
    smoke = _load_smoke_module()
    args = SimpleNamespace(redeem_code="ALL-CODE", lite_code="LITE", pro_code="PRO")

    assert smoke._redeem_code_for_mode(args, "lite") == "ALL-CODE"
    assert smoke._redeem_code_for_mode(args, "pro") == "ALL-CODE"


def test_redeem_code_for_mode_uses_mode_specific_defaults():
    smoke = _load_smoke_module()
    args = SimpleNamespace(redeem_code="", lite_code="LITE", pro_code="PRO")

    assert smoke._redeem_code_for_mode(args, "lite") == "LITE"
    assert smoke._redeem_code_for_mode(args, "pro") == "PRO"


def test_content_type_for_image_suffixes():
    smoke = _load_smoke_module()

    assert smoke._content_type_for_image(Path("a.jpeg")) == "image/jpeg"
    assert smoke._content_type_for_image(Path("a.jpg")) == "image/jpeg"
    assert smoke._content_type_for_image(Path("a.webp")) == "image/webp"
    assert smoke._content_type_for_image(Path("a.png")) == "image/png"
