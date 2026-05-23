"""Quality gate for the end-to-end mandala interpretation agent."""

from __future__ import annotations

from typing import Any


FORBIDDEN_FINAL_REPORT_TERMS = [
    "stage-",
    "placeholder",
    "legacy",
    "quality_gate",
]

FORBIDDEN_FINANCIAL_PROMISE_TERMS = [
    "财务预测",
    "收益预测",
    "投资建议",
]

FORBIDDEN_DIAGNOSTIC_TERMS = [
    "心理诊断",
    "医疗建议",
]


def run_quality_gate(
    *,
    visual_draft: dict[str, Any],
    prompt_pack_manifest: dict[str, Any],
    final_report_md: str,
    final_report: dict[str, Any],
) -> dict[str, Any]:
    failure_ids: list[str] = []

    if not isinstance(visual_draft, dict) or not visual_draft:
        failure_ids.append("missing_visual_draft")

    if not isinstance(prompt_pack_manifest, dict) or not prompt_pack_manifest:
        failure_ids.append("missing_prompt_pack_manifest")

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
    leaked_terms.extend(
        term for term in FORBIDDEN_DIAGNOSTIC_TERMS if term.lower() in final_report_md.lower()
    )
    if leaked_terms:
        failure_ids.append("final_report_internal_text_leak")

    if "财富议题" not in final_report_md:
        failure_ids.append("missing_wealth_topic")

    if not final_report.get("report_id"):
        failure_ids.append("missing_report_id")

    return {
        "passed": not failure_ids,
        "failure_ids": failure_ids,
        "details": {
            "leaked_terms": leaked_terms,
        },
    }
