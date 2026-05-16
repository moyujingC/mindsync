"""Baseline tests for native wealth report payloads."""

from __future__ import annotations

from app.core.wealth_report import get_wealth_report_runtime


def test_native_wealth_topic_context_uses_domain_name():
    topic_context = get_wealth_report_runtime().get_topic_context(report_mode="lite")
    assert topic_context["topic"] == "wealth"
    assert topic_context["topic_label"] == "财富议题"
    assert topic_context["orientation"]["key_terms"][0]["term"] == "金钱关系"


def test_report_blueprint_accepts_wealth_theme_name():
    from app.core.pipeline.report_blueprints import LITE_TITLE_TEMPLATES

    assert "wealth" in LITE_TITLE_TEMPLATES
    assert LITE_TITLE_TEMPLATES["wealth"] == "财富里的稳住者"
    assert "wealth_career" not in LITE_TITLE_TEMPLATES
