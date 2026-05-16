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


def test_native_wealth_runtime_uses_yaml_match_keywords_for_expanded_routes():
    route = get_wealth_report_runtime().route_visual_observations(
        {
            "inner_circle": "内圈比较清晰。",
            "middle_circle": "中圈缠绕，关系拉扯感明显。",
            "outer_circle": "外圈边界有缺口，零散小点很多，能量分散。",
        },
        report_mode="pro",
    )

    assert "visual.middle_tangled_relationship_pull" in route.selected_signal_ids
    assert "visual.outer_boundary_broken" in route.selected_signal_ids
    assert "visual.fragmented_dots_scattered_energy" in route.selected_signal_ids
    assert "wealth.exchange_boundary_imbalance" in route.selected_clause_ids
    assert "wealth.resource_leakage" in route.selected_clause_ids
