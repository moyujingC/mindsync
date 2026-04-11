"""Imbalance rule runtime service."""

from __future__ import annotations

from typing import Any

from ..contracts import FallbackLevel, QueryResult
from ..repository import KnowledgeRepository


class ImbalanceService:
    """Serve imbalance rules and identification helpers."""

    DOMINANCE_RULES = {
        "水": ["水多木漂", "水多火灭", "水多金沉", "水多土荡"],
        "火": ["火多土焦", "火多金熔", "火多木焚", "火多水灼"],
        "木": ["木多火塞", "木多土陷", "木多水缩", "木多金缺"],
        "土": ["土多金埋", "土多火晦", "土多水干", "土多木折"],
        "金": ["金多水浊", "金多火熄", "金多土虚", "金多木折"],
    }

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def identify_imbalances(
        self,
        color_analysis: dict[str, Any],
        circle_elements: dict[str, Any],
        *,
        version: str = "toc",
    ) -> list[str]:
        element_props: dict[str, float] = {}
        for _, data in color_analysis.items():
            if isinstance(data, dict):
                element = data.get("element")
                prop = float(data.get("proportion", 0.0))
            else:
                element = data
                prop = 0.2
            if isinstance(element, str) and element:
                element_props[element] = element_props.get(element, 0.0) + prop

        imbalances: list[str] = []
        for element, proportion in element_props.items():
            if proportion > 0.5:
                imbalances.extend(self.DOMINANCE_RULES.get(element, []))

        unique = list(dict.fromkeys(imbalances))
        return self.filter_by_version(unique, version=version)[:3]

    def get_imbalance_detail(self, imbalance_type: str) -> QueryResult:
        definitions = self.repository.get_lookup("rules").get("rule.imbalance_types", {}).get(
            "imbalances", {}
        )
        definition = definitions.get(imbalance_type)
        if not definition:
            return QueryResult.not_found(
                f"imbalance {imbalance_type} not found",
                entity_id=f"imbalance.{imbalance_type}",
            )
        return QueryResult(
            value={
                "type": imbalance_type,
                "category": definition.get("category"),
                "description": definition.get("manifestation"),
                "manifestations": str(definition.get("psychology", "")).split("，")[:3],
                "healing_direction": definition.get("healing_direction"),
                "toc_supported": definition.get("toc_supported", False),
                "warning": definition.get("warning"),
            },
            entity_id=f"imbalance.{imbalance_type}",
            evidence=[
                {
                    "entity_id": "rule.imbalance_types",
                    "source_path": "rules/imbalance_types.yaml",
                    "kind": "imbalance_rule",
                }
            ],
        )

    def list_imbalances(self, *, version: str = "toc") -> list[dict[str, Any]]:
        definitions = self.repository.get_lookup("rules").get("rule.imbalance_types", {}).get(
            "imbalances", {}
        )
        results = []
        for imbalance_id, definition in definitions.items():
            if version == "toc" and not definition.get("toc_supported", False):
                continue
            results.append(
                {
                    "id": imbalance_id,
                    "name": imbalance_id,
                    "category": definition.get("category"),
                    "toc_supported": definition.get("toc_supported", False),
                }
            )
        return results

    def get_theme_mapping(self, theme: str, imbalance_type: str) -> QueryResult:
        payload = self.repository.get_lookup("rules").get("rule.theme_mappings", {})
        mapping = payload.get("mappings", {}).get(theme, {}).get(imbalance_type, {})
        if mapping:
            return QueryResult(
                value=mapping,
                entity_id=f"rule.theme_mappings.{theme}.{imbalance_type}",
                evidence=[
                    {
                        "entity_id": "rule.theme_mappings",
                        "source_path": "rules/theme_mappings.yaml",
                        "kind": "theme_mapping",
                    }
                ],
            )
        return QueryResult(
            value={},
            entity_id=f"rule.theme_mappings.{theme}.{imbalance_type}",
            fallback_level=FallbackLevel.GENERAL.value,
            fallback_used=True,
            source="fallback",
            warnings=[f"theme mapping missing for {theme}:{imbalance_type}"],
        )

    def filter_by_version(self, imbalance_ids: list[str], *, version: str = "toc") -> list[str]:
        if version != "toc":
            return imbalance_ids
        definitions = self.repository.get_lookup("rules").get("rule.imbalance_types", {}).get(
            "imbalances", {}
        )
        return [
            imbalance_id
            for imbalance_id in imbalance_ids
            if definitions.get(imbalance_id, {}).get("toc_supported", False)
        ]

