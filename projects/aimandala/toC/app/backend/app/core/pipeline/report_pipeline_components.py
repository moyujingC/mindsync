"""Component wiring helpers for the migrated V2 report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .report_pipeline_foundation_components import (
    install_report_foundation_components,
)
from .report_pipeline_legacy_bindings import install_report_pipeline_legacy_bindings
from .report_pipeline_narrative_components import install_report_narrative_components
from .report_pipeline_output_components import install_report_output_components


def install_report_pipeline_components(
    orchestrator: Any,
    *,
    extract_colors_by_circles: Any,
    analyze_energy_flow: Callable[[list, list, list], dict[str, Any]],
    detecting_stage: str,
    generating_stage: str,
    processing_stage: str,
    completed_stage: str,
) -> None:
    """Attach report pipeline collaborators and compatibility bindings."""

    install_report_foundation_components(
        orchestrator,
        extract_colors_by_circles=extract_colors_by_circles,
        analyze_energy_flow=analyze_energy_flow,
        detecting_stage=detecting_stage,
        generating_stage=generating_stage,
        processing_stage=processing_stage,
        completed_stage=completed_stage,
    )
    install_report_narrative_components(orchestrator)
    install_report_output_components(orchestrator)
    install_report_pipeline_legacy_bindings(orchestrator)
