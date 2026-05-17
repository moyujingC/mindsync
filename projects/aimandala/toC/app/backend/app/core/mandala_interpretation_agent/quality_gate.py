"""Quality gates for mandala interpretation agent artifacts."""

from __future__ import annotations

import re
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

FORBIDDEN_METHOD_BOUNDARY_PATTERNS = [
    "内圈属木",
    "内圈属火",
    "内圈属土",
    "内圈属金",
    "内圈属水",
    "中圈属木",
    "中圈属火",
    "中圈属土",
    "中圈属金",
    "中圈属水",
    "外圈属木",
    "外圈属火",
    "外圈属土",
    "外圈属金",
    "外圈属水",
    "内圈呈现木性",
    "内圈呈现火性",
    "内圈呈现土性",
    "内圈呈现金性",
    "内圈呈现水性",
    "中圈呈现木性",
    "中圈呈现火性",
    "中圈呈现土性",
    "中圈呈现金性",
    "中圈呈现水性",
    "外圈呈现木性",
    "外圈呈现火性",
    "外圈呈现土性",
    "外圈呈现金性",
    "外圈呈现水性",
    "内圈木生中圈火",
    "内圈火生中圈土",
    "内圈土生中圈金",
    "内圈金生中圈水",
    "内圈水生中圈木",
    "中圈木生外圈火",
    "中圈火生外圈土",
    "中圈土生外圈金",
    "中圈金生外圈水",
    "中圈水生外圈木",
    "内圈木克中圈土",
    "内圈土克中圈水",
    "内圈水克中圈火",
    "内圈火克中圈金",
    "内圈金克中圈木",
    "中圈木克外圈土",
    "中圈土克外圈水",
    "中圈水克外圈火",
    "中圈火克外圈金",
    "中圈金克外圈木",
]

BOUNDARY_TERMS = [
    "投资建议",
    "心理诊断",
]

DETERMINISTIC_CAUSE_TERMS = [
    "很可能与早期家庭",
    "源于早期家庭",
    "来自原生家庭",
    "是因为你的父母",
    "说明你原生家庭",
]

WEALTH_CORE_FORBIDDEN_METHOD_TERMS = [
    "五行",
    "生克",
    "元素",
    "木性",
    "火性",
    "土性",
    "金性",
    "水性",
    "属木",
    "属火",
    "属土",
    "属金",
    "属水",
    "木生火",
    "火生土",
    "土生金",
    "金生水",
    "水生木",
    "木克土",
    "土克水",
    "水克火",
    "火克金",
    "金克木",
]

RELATION_WORDS = [
    "拉扯",
    "互相",
    "导致",
    "使得",
    "影响",
    "结果",
    "源于",
    "来自",
    "之间",
    "通道",
    "流动",
    "生",
    "克",
]

FIVE_ELEMENT_TERMS = [
    "木",
    "火",
    "土",
    "金",
    "水",
]

GENERIC_OPENING_PHRASES = [
    "好的",
    "你好",
    "您好",
    "亲爱的朋友",
    "这是为你生成",
    "这是一份为你生成",
    "这是一份关于",
    "感谢你的信任",
    "感谢你带着",
    "让我们一起",
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

    report_shape_issues = []
    permissions = report_context_package.get("permissions")
    allow_seeded_short_report = (
        isinstance(permissions, dict)
        and permissions.get("allow_seeded_short_report") is True
    )
    if isinstance(report_context_package.get("final_report"), dict) and not allow_seeded_short_report:
        report_shape_issues = _report_shape_issues(
            final_report_md,
            report_mode=str(report_context_package.get("report_mode") or ""),
        )
    if report_shape_issues:
        failure_ids.append("invalid_final_report_shape")

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

    method_boundary_terms = _method_boundary_terms(final_report_md)
    if method_boundary_terms:
        failure_ids.append("cross_circle_five_element_relation_leak")

    deterministic_cause_terms = [
        term for term in DETERMINISTIC_CAUSE_TERMS if term in final_report_md
    ]
    if deterministic_cause_terms:
        failure_ids.append("deterministic_cause_claim")

    if (
        not allow_seeded_short_report
        and final_report_md.strip()
        and not _has_visible_five_element_analysis(final_report_md)
    ):
        failure_ids.append("missing_visible_five_element_analysis")

    wealth_core_method_terms = _wealth_core_method_terms(final_report_md)
    if wealth_core_method_terms:
        failure_ids.append("wealth_core_method_leak")

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
            "method_boundary_terms": method_boundary_terms,
            "deterministic_cause_terms": deterministic_cause_terms,
            "wealth_core_method_terms": wealth_core_method_terms,
            "report_shape_issues": report_shape_issues,
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


def _method_boundary_terms(final_report_md: str) -> list[str]:
    terms = [
        term for term in FORBIDDEN_METHOD_BOUNDARY_PATTERNS if term in final_report_md
    ]
    terms.extend(_cross_circle_five_element_sentences(final_report_md))
    return terms


def _cross_circle_five_element_sentences(final_report_md: str) -> list[str]:
    findings: list[str] = []
    for sentence in re.split(r"[。！？\n]", final_report_md):
        text = sentence.strip()
        if not text:
            continue
        if len(_circle_mentions(text)) < 2:
            continue
        if len(_circle_element_mentions(text)) >= 2:
            if any(word in text for word in RELATION_WORDS):
                findings.append(text[:80])
    return findings


def _circle_mentions(text: str) -> set[str]:
    mentions = set()
    for key in ["内圈", "中圈", "外圈"]:
        if key in text:
            mentions.add(key)
    return mentions


def _circle_element_mentions(text: str) -> set[str]:
    mentions = set()
    for circle in ["内圈", "中圈", "外圈"]:
        for element in FIVE_ELEMENT_TERMS:
            if re.search(rf"{circle}[^。！？\n]{{0,24}}{element}[性气]?", text):
                mentions.add(f"{circle}:{element}")
    return mentions


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


def _report_shape_issues(final_report_md: str, *, report_mode: str) -> list[str]:
    issues: list[str] = []
    text = final_report_md.strip()
    if not text:
        return ["empty"]
    first_line = text.splitlines()[0].strip()
    if not first_line.startswith("# ") or "财富议题" not in first_line:
        issues.append("title_missing_wealth_topic")
    opening_window = text[:300]
    if any(phrase in opening_window for phrase in GENERIC_OPENING_PHRASES):
        issues.append("generic_greeting_opening")
    min_chars = 1000 if report_mode == "pro" else 500
    if len(text) < min_chars:
        issues.append(f"too_short_min_{min_chars}")
    max_chars = 2400 if report_mode == "pro" else 1600
    if len(text) > max_chars:
        issues.append(f"too_long_max_{max_chars}")
    return issues


def _has_visible_five_element_analysis(final_report_md: str) -> bool:
    return "五行" in final_report_md and (
        "元素" in final_report_md or "颜色" in final_report_md or "形状" in final_report_md
    ) and any(
        term in final_report_md for term in FIVE_ELEMENT_TERMS
    )


def _wealth_core_method_terms(final_report_md: str) -> list[str]:
    lines = final_report_md.splitlines()
    captured: list[str] = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith("## 财富核心"):
            continue
        block = " ".join(lines[index : index + 4])
        if any(term in block for term in WEALTH_CORE_FORBIDDEN_METHOD_TERMS) or re.search(
            r"木[、,， ]*火[、,， ]*土[、,， ]*金[、,， ]*水",
            block,
        ):
            captured.append(block[:120])
    return captured
