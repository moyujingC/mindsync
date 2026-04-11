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

    def get_healing_issue_mapping(self, imbalance_type: str, theme: str = "general") -> QueryResult:
        mappings = self.repository.get_lookup("rules").get("rule.healing_issue_mappings", {}).get(
            "mappings", {}
        )
        themed_mapping = mappings.get(theme, {}).get(imbalance_type)
        if isinstance(themed_mapping, dict) and themed_mapping.get("issue_type"):
            return QueryResult(
                value={**themed_mapping, "source_theme": theme},
                entity_id=f"rule.healing_issue_mappings.{theme}.{imbalance_type}",
                evidence=[
                    {
                        "entity_id": "rule.healing_issue_mappings",
                        "source_path": "rules/healing_issue_mappings.yaml",
                        "kind": "healing_issue_mapping",
                    }
                ],
            )

        general_mapping = mappings.get("general", {}).get(imbalance_type)
        if isinstance(general_mapping, dict) and general_mapping.get("issue_type"):
            return QueryResult(
                value={**general_mapping, "source_theme": "general"},
                entity_id=f"rule.healing_issue_mappings.general.{imbalance_type}",
                fallback_level=FallbackLevel.GENERAL.value,
                fallback_used=True,
                source="fallback",
                evidence=[
                    {
                        "entity_id": "rule.healing_issue_mappings",
                        "source_path": "rules/healing_issue_mappings.yaml",
                        "kind": "healing_issue_mapping",
                    }
                ],
                warnings=[f"theme {theme} missing healing issue mapping for {imbalance_type}; used general"],
            )

        return QueryResult(
            value={},
            entity_id=f"rule.healing_issue_mappings.{theme}.{imbalance_type}",
            found=False,
            fallback_level=FallbackLevel.GENERATED.value,
            fallback_used=True,
            source="generated",
            warnings=[f"healing issue mapping missing for {theme}:{imbalance_type}"],
        )

    def get_healing_plan(self, imbalance_type: str, theme: str = "general") -> QueryResult:
        mapping_result = self.get_healing_issue_mapping(imbalance_type, theme)
        mapping_value = mapping_result.value if isinstance(mapping_result.value, dict) else {}
        issue_type = str(mapping_value.get("issue_type") or "").strip()
        source_theme = str(mapping_value.get("source_theme") or theme)
        prescription = (
            self.get_healing_prescription(source_theme, issue_type)
            if issue_type
            else {}
        )
        if prescription:
            return QueryResult(
                value={
                    **prescription,
                    "imbalance": imbalance_type,
                    "issue_type": issue_type,
                },
                entity_id=f"healing.{source_theme}.{issue_type}",
                fallback_level=mapping_result.fallback_level,
                fallback_used=mapping_result.fallback_used,
                source=mapping_result.source,
                evidence=[
                    *mapping_result.evidence,
                    {
                        "entity_id": f"healing.{source_theme}",
                        "source_path": f"healing/{source_theme}.yaml",
                        "kind": "theme_healing",
                    },
                ],
                warnings=list(mapping_result.warnings),
            )

        template = self.get_healing_template(theme)
        generated = {
            "imbalance": imbalance_type,
            "issue_type": issue_type,
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
                *mapping_result.evidence,
                {
                    "entity_id": "healing.templates",
                    "source_path": "healing/templates.yaml",
                    "kind": "template_fallback",
                }
            ],
            warnings=[
                *list(mapping_result.warnings),
                f"theme {theme} missing healing prescription for {imbalance_type}",
            ],
        )
