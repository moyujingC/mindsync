"""Shared stage configuration for migrated V2 report pipeline installers."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ReportPipelineStageConfig:
    """Named stage values shared across report pipeline installers."""

    detecting: str
    generating: str
    processing: str
    completed: str
