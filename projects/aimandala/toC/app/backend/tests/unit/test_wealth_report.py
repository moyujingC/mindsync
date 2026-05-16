"""Baseline tests for native wealth report payloads."""

from __future__ import annotations

from app.core.wealth_report import get_wealth_report_runtime


def test_native_wealth_topic_context_uses_domain_name():
    topic_context = get_wealth_report_runtime().get_topic_context(report_mode="lite")
    assert topic_context["topic"] == "wealth"
    assert topic_context["topic_label"] == "财富议题"
    assert topic_context["orientation"]["key_terms"][0]["term"] == "金钱关系"


def test_native_wealth_runtime_routes_visual_observations():
    route = get_wealth_report_runtime().route_visual_observations(
        {
            "outer_circle": "外圈红色很多，也有明显留白",
            "middle_circle": "中圈有断裂和拉扯",
            "inner_circle": "内圈收缩",
        },
        report_mode="lite",
    )

    assert route.selected_clause_ids
    assert route.selected_module_ids
