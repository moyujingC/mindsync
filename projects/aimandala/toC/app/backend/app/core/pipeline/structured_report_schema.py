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


STRUCTURED_REPORT_SCHEMA_VERSION = "2026-04-18"

LITE_STRUCTURED_REPORT_CONTRACT = StructuredReportContract(
    report_version="lite",
    schema_version=STRUCTURED_REPORT_SCHEMA_VERSION,
    fields=(
        StructuredFieldSpec("prompt_preview"),
        StructuredFieldSpec("prompt_schema_validation_issues", required=True),
        StructuredFieldSpec("topic_context", required=True),
        StructuredFieldSpec("current_reading", required=True),
        StructuredFieldSpec("visual_basis", required=True),
        StructuredFieldSpec("pattern_interpretation", required=True),
        StructuredFieldSpec("life_connection", required=True),
        StructuredFieldSpec("lite_healing_guidance", required=True),
        StructuredFieldSpec("pro_report_entry", required=True),
    ),
)

PRO_STRUCTURED_REPORT_CONTRACT = StructuredReportContract(
    report_version="pro",
    schema_version=STRUCTURED_REPORT_SCHEMA_VERSION,
    fields=(
        StructuredFieldSpec("prompt_preview"),
        StructuredFieldSpec("prompt_schema_validation_issues", required=True),
        StructuredFieldSpec("topic_context", required=True),
        StructuredFieldSpec("deep_impression", required=True),
        StructuredFieldSpec("evidence_digest", required=True),
        StructuredFieldSpec("imbalance_diagnosis", required=True),
        StructuredFieldSpec("root_cause_chain", required=True),
        StructuredFieldSpec("deep_structure_interpretation", required=True),
        StructuredFieldSpec("healing_plan", required=True),
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
