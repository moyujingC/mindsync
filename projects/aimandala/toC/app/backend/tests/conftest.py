"""Pytest configuration for Aimandala backend tests."""

from __future__ import annotations

import pytest


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "requires_default_env_file: allow loading backend .env.local during this test",
    )


@pytest.fixture(autouse=True)
def _disable_default_env_file_for_unit_tests(request, monkeypatch):
    if request.node.get_closest_marker("requires_default_env_file"):
        return
    monkeypatch.setenv("AIMANDALA_DISABLE_DEFAULT_ENV_FILE", "1")
