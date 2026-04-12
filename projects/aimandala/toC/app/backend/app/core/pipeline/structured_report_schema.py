"""Authoritative Lite/Pro structured report contracts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


@dataclass(frozen=True)
class StructuredFieldSpec:
    """One stable field in the API-facing structured report payload."""

    name: str
    required: bool = False


@dataclass(frozen=True)
class StructuredReportContract:
    """Single-source contract for one report version."""

    report_version: str
    schema_version: str
    fields: tuple[StructuredFieldSpec, ...]

    @property
    def field_names(self) -> tuple[str, ...]:
        return tuple(field.name for field in self.fields)

    @property
    def required_field_names(self) -> tuple[str, ...]:
        return tuple(field.name for field in self.fields if field.required)

    def build_payload(self, values: Mapping[str, Any]) -> dict[str, Any]:
        payload: dict[str, Any] = {}
        for field in self.fields:
            if field.name in values:
                payload[field.name] = values[field.name]
        return payload


STRUCTURED_REPORT_SCHEMA_VERSION = "2026-04-12"

LITE_STRUCTURED_REPORT_CONTRACT = StructuredReportContract(
    report_version="lite",
    schema_version=STRUCTURED_REPORT_SCHEMA_VERSION,
    fields=(
        StructuredFieldSpec("prompt_preview"),
        StructuredFieldSpec("prompt_schema_validation_issues", required=True),
        StructuredFieldSpec("title", required=True),
        StructuredFieldSpec("overall_impression", required=True),
        StructuredFieldSpec("visual_elements_rendered", required=True),
        StructuredFieldSpec("emotion_portrait_rendered", required=True),
        StructuredFieldSpec("story", required=True),
        StructuredFieldSpec("theme_insights", required=True),
        StructuredFieldSpec("three_awareness", required=True),
        StructuredFieldSpec("self_understanding_blocks", required=True),
        StructuredFieldSpec("six_insights_rendered", required=True),
        StructuredFieldSpec("experiment_rendered", required=True),
        StructuredFieldSpec("pro_teaser", required=True),
    ),
)

PRO_STRUCTURED_REPORT_CONTRACT = StructuredReportContract(
    report_version="pro",
    schema_version=STRUCTURED_REPORT_SCHEMA_VERSION,
    fields=(
        StructuredFieldSpec("prompt_preview"),
        StructuredFieldSpec("prompt_schema_validation_issues", required=True),
        StructuredFieldSpec("first_impression", required=True),
        StructuredFieldSpec("core_insight_table", required=True),
        StructuredFieldSpec("three_circles_detailed", required=True),
        StructuredFieldSpec("micro_analysis_detailed", required=True),
        StructuredFieldSpec("imbalance_confirmed", required=True),
        StructuredFieldSpec("root_cause", required=True),
        StructuredFieldSpec("healing_suggestions", required=True),
    ),
)

STRUCTURED_REPORT_CONTRACTS = {
    "lite": LITE_STRUCTURED_REPORT_CONTRACT,
    "pro": PRO_STRUCTURED_REPORT_CONTRACT,
}


def get_structured_report_contract(report_version: str) -> StructuredReportContract:
    """Return the only supported structured payload contract for one version."""

    normalized = report_version.strip().lower()
    try:
        return STRUCTURED_REPORT_CONTRACTS[normalized]
    except KeyError as error:
        raise ValueError(f"unsupported structured report version: {report_version}") from error
