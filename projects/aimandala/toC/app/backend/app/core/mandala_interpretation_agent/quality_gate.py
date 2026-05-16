"""Quality gates for mandala interpretation agent artifacts."""

from __future__ import annotations

from typing import Any

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS


FORBIDDEN_FINAL_REPORT_TERMS = [
    "stage-",
    "transition-overload",
    "placeholder",
    "legacy",
    "待完整 stage 证据确认",
    "需要进一步确认",
    "应由 stage",
    "回到画面证据",
]

FORBIDDEN_FINANCIAL_PROMISE_TERMS = [
    "财务预测",
    "收益预测",
]

BOUNDARY_TERMS = [
    "投资建议",
    "心理诊断",
]


def run_quality_gate(
    *,
    stage_outputs: dict[str, Any],
    execution_trace: list[dict[str, Any]],
    final_report_md: str,
    report_context_package: dict[str, Any],
) -> dict[str, Any]:
    failure_ids: list[str] = []
    missing_stages = [stage_key for stage_key in STAGE_KEYS if stage_key not in stage_outputs]
    if missing_stages:
        failure_ids.append("missing_stage_outputs")

    expected_blocks = [block["block_id"] for block in EXECUTION_BLOCKS]
    actual_blocks = [str(block.get("block_id") or "") for block in execution_trace]
    if actual_blocks != expected_blocks:
        failure_ids.append("invalid_execution_trace")

    if not final_report_md.strip():
        failure_ids.append("empty_final_report")

    leaked_terms = [
        term
        for term in FORBIDDEN_FINAL_REPORT_TERMS
        if term.lower() in final_report_md.lower()
    ]
    leaked_terms.extend(
        term
        for term in FORBIDDEN_FINANCIAL_PROMISE_TERMS
        if term.lower() in final_report_md.lower()
    )
    leaked_terms.extend(_unsafe_boundary_terms(final_report_md))
    if leaked_terms:
        failure_ids.append("final_report_internal_text_leak")

    required_context_fields = [
        "report_id",
        "report_mode",
        "user_context",
        "visual_observation",
        "circle_interpretation",
        "five_element_interpretation",
        "theme_interpretation",
        "core_thesis",
        "healing_direction",
        "final_report",
        "evidence_map",
        "boundaries",
        "permissions",
    ]
    missing_context_fields = [
        field for field in required_context_fields if field not in report_context_package
    ]
    if missing_context_fields:
        failure_ids.append("missing_report_context_package_fields")

    stage03 = stage_outputs.get("stage-03-visual-evidence", {})
    missing_visual_units = _missing_visual_units(stage03)
    if missing_visual_units:
        failure_ids.append("missing_stage03_visual_units")

    evidence_map = report_context_package.get("evidence_map")
    if not isinstance(evidence_map, list) or not evidence_map:
        failure_ids.append("empty_evidence_map")

    return {
        "passed": not failure_ids,
        "failure_ids": failure_ids,
        "details": {
            "missing_stages": missing_stages,
            "actual_blocks": actual_blocks,
            "expected_blocks": expected_blocks,
            "leaked_terms": leaked_terms,
            "missing_context_fields": missing_context_fields,
            "missing_visual_units": missing_visual_units,
        },
    }


def _missing_visual_units(stage03: Any) -> list[str]:
    if not isinstance(stage03, dict):
        return ["inner", "middle", "outer"]
    circles = stage03.get("circles")
    if not isinstance(circles, dict):
        return ["inner", "middle", "outer"]
    missing = []
    for circle_key in ["inner", "middle", "outer"]:
        circle = circles.get(circle_key)
        if not _circle_has_visual_evidence(circle):
            missing.append(circle_key)
    return missing


def _circle_has_visual_evidence(circle: Any) -> bool:
    if not isinstance(circle, dict):
        return False
    units = circle.get("visual_units")
    if isinstance(units, list) and units:
        return True
    summary = circle.get("summary")
    if isinstance(summary, str) and summary.strip():
        return True
    raw_observation = circle.get("raw_observation")
    if isinstance(raw_observation, dict):
        return any(str(value).strip() for value in raw_observation.values())
    return False


def _unsafe_boundary_terms(final_report_md: str) -> list[str]:
    unsafe_terms = []
    for term in BOUNDARY_TERMS:
        index = final_report_md.find(term)
        while index != -1:
            start = max(0, index - 20)
            end = min(len(final_report_md), index + len(term) + 20)
            window = final_report_md[start:end]
            if not _is_boundary_disclaimer(window):
                unsafe_terms.append(term)
                break
            index = final_report_md.find(term, index + len(term))
    return unsafe_terms


def _is_boundary_disclaimer(text: str) -> bool:
    return any(marker in text for marker in ["不构成", "不提供", "不得输出", "不要做", "避免"])
