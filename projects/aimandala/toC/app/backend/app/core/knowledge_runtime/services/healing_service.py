"""Healing plan runtime service."""

from __future__ import annotations

from typing import Any

from ..contracts import FallbackLevel, QueryResult
from ..repository import KnowledgeRepository


class HealingService:
    """Serve healing prescriptions and templates."""

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def get_healing_prescription(
        self,
        theme: str,
        issue_type: str | None = None,
    ) -> dict[str, Any]:
        healing = self.repository.get_lookup("theme_healing").get(theme, {})
        prescriptions = healing.get("healing_prescriptions", {})
        if issue_type is None:
            return prescriptions
        return prescriptions.get("issue_types", {}).get(issue_type, {})

    def get_healing_template(self, theme: str = "general") -> dict[str, Any]:
        healing = self.repository.get_lookup("theme_healing").get(theme, {})
        template = healing.get("healing_template")
        if isinstance(template, dict) and template:
            return template
        template_asset = self.repository.get_assets("healing").get("healing.templates", {})
        return template_asset.get("payload", {}).get("templates", {}).get("standard", {})

    def get_healing_plan(self, imbalance_type: str, theme: str = "general") -> QueryResult:
        prescription = self.get_healing_prescription(theme, imbalance_type)
        if prescription:
            return QueryResult(
                value=prescription,
                entity_id=f"healing.{theme}",
                evidence=[
                    {
                        "entity_id": f"healing.{theme}",
                        "source_path": f"healing/{theme}.yaml",
                        "kind": "theme_healing",
                    }
                ],
            )

        template = self.get_healing_template(theme)
        generated = {
            "imbalance": imbalance_type,
            "direction": template.get("theme", "") or "先稳定，再观察，再调节",
            "daily_practices": template.get("daily_practice", []),
            "phases": template.get("phases", []),
            "duration_days": template.get("duration_days"),
        }
        return QueryResult(
            value=generated,
            entity_id=f"healing.{theme}",
            fallback_level=FallbackLevel.GENERAL.value,
            fallback_used=True,
            source="fallback",
            evidence=[
                {
                    "entity_id": "healing.templates",
                    "source_path": "healing/templates.yaml",
                    "kind": "template_fallback",
                }
            ],
            warnings=[f"theme {theme} missing healing prescription for {imbalance_type}"],
        )

