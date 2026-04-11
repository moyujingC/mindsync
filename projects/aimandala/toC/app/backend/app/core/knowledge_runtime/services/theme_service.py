"""Theme-focused runtime service."""

from __future__ import annotations

from typing import Any

from ..contracts import QueryResult
from ..repository import KnowledgeRepository


class ThemeService:
    """Serve theme configs and summaries from the compiled index."""

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def list_themes(self) -> list[str]:
        return sorted(self.repository.get_lookup("themes").keys())

    def get_theme_config(self, theme: str) -> dict[str, Any]:
        themes = self.repository.get_lookup("themes")
        if theme in themes:
            return themes[theme]
        return themes.get("general", {})

    def get_theme_summary(self, theme: str) -> dict[str, Any]:
        config = self.get_theme_config(theme)
        return {
            "name": config.get("theme_name_cn") or config.get("name", ""),
            "description": config.get("description", ""),
            "core_issues": config.get("core_issues", []),
            "focus_element": config.get("focus_element", ""),
            "related_circles": config.get("related_circles", []),
            "issue_type_count": len(self.list_issue_types(theme)),
            "theme_id": config.get("theme_id", theme),
        }

    def list_issue_types(self, theme: str) -> list[str]:
        healing = self.repository.get_lookup("theme_healing").get(theme, {})
        issue_types = healing.get("healing_prescriptions", {}).get("issue_types", {})
        return sorted(issue_types.keys())

    def get_theme_color_interpretation(
        self,
        theme: str,
        element_or_color: str,
        intensity_or_element: str,
        circle: str | None = None,
    ) -> dict[str, Any]:
        config = self.get_theme_config(theme)
        meanings = config.get("color_meanings", {})
        entry = meanings.get(element_or_color, {})
        if not entry:
            return {}

        shades = entry.get("shades", {})
        intensity_data = shades.get(intensity_or_element, {})
        if circle and isinstance(intensity_data, dict):
            return intensity_data.get("circles", {}).get(circle, {})
        return intensity_data if isinstance(intensity_data, dict) else {}

    def get_theme_imbalance_mapping(
        self,
        theme: str,
        imbalance_type: str | None = None,
    ) -> dict[str, Any]:
        mappings = self.get_theme_config(theme).get("imbalance_mappings", {})
        if imbalance_type is None:
            return mappings
        return mappings.get(imbalance_type, {})

    def get_element_meaning(self, theme: str, element: str) -> dict[str, Any]:
        return self.get_theme_config(theme).get("element_meanings", {}).get(element, {})

    def query_theme(self, theme: str) -> QueryResult:
        config = self.get_theme_config(theme)
        if not config:
            return QueryResult.not_found(f"theme {theme} not found", entity_id=theme)
        return QueryResult(
            value=config,
            entity_id=f"theme.{config.get('theme_id', theme)}",
            evidence=[
                {
                    "entity_id": f"theme.{config.get('theme_id', theme)}",
                    "source_path": f"themes/{config.get('theme_id', theme)}.yaml",
                    "kind": "theme_config",
                }
            ],
        )

