"""Validation helpers for formal stage process packages."""

from __future__ import annotations

from typing import Any

PENDING_STAGE_STATUS = "pending_stage_runtime_replacement"
FORMAL_PACKAGE_STATUS = "formal"
FORBIDDEN_INPUT_MARKERS = (
    "full_markdown_truth_sources",
    "full_theme_knowledge_documents",
    "raw_legacy_container",
    "old_report_skeleton",
    "old_report_plan",
    "private_env_or_api_keys",
)


def find_pending_stage_markers(value: Any) -> list[str]:
    """Return JSON-ish paths that still contain placeholder stage markers."""

    paths: list[str] = []

    def visit(item: Any, path: str) -> None:
        if item == PENDING_STAGE_STATUS:
            paths.append(path)
            return
        if isinstance(item, dict):
            for key, child in item.items():
                visit(child, f"{path}.{key}" if path else str(key))
            return
        if isinstance(item, list):
            for index, child in enumerate(item):
                visit(child, f"{path}[{index}]")

    visit(value, "")
    return paths


def find_forbidden_input_markers(value: Any) -> list[str]:
    """Return JSON-ish paths that contain forbidden formal generation inputs."""

    paths: list[str] = []

    def marker_in(text: Any) -> bool:
        return isinstance(text, str) and any(marker in text for marker in FORBIDDEN_INPUT_MARKERS)

    def visit(item: Any, path: str) -> None:
        if path == "process_contract.forbidden_inputs":
            return
        if marker_in(item):
            paths.append(path or "$")
            return
        if isinstance(item, dict):
            for key, child in item.items():
                child_path = f"{path}.{key}" if path else str(key)
                if marker_in(key):
                    paths.append(child_path)
                    continue
                visit(child, child_path)
            return
        if isinstance(item, list):
            for index, child in enumerate(item):
                visit(child, f"{path}[{index}]")

    visit(value, "")
    return paths


def validate_formal_stage_process_package(payload: Any) -> None:
    """Raise when a package is not safe to feed into formal report generation."""

    if not isinstance(payload, dict) or not payload:
        raise ValueError("formal stage_process_package is required")
    contract = payload.get("process_contract")
    if not isinstance(contract, dict):
        raise ValueError("formal stage_process_package requires process_contract")
    status = str(contract.get("package_status", "")).strip()
    if status != FORMAL_PACKAGE_STATUS:
        raise ValueError(f"formal stage_process_package required, got {status or 'missing'}")
    pending = find_pending_stage_markers(payload)
    if pending:
        raise ValueError(
            "formal stage_process_package contains pending stage markers: "
            + ", ".join(pending[:5])
        )
    forbidden = find_forbidden_input_markers(payload)
    if forbidden:
        raise ValueError(
            "formal stage_process_package contains forbidden inputs: "
            + ", ".join(forbidden[:5])
        )
