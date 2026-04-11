"""Element and color runtime service."""

from __future__ import annotations

from typing import Any

from ..contracts import QueryResult
from ..repository import KnowledgeRepository


class ElementService:
    """Serve color and element data from the compiled index."""

    DIRECT_COLOR_MAPPING = {
        "红色": "火",
        "黄色": "土",
        "绿色": "木",
        "蓝色": "水",
        "白色": "金",
        "黑色": "水",
    }

    AMBIGUOUS_COLOR_MAPPING = {
        "粉色": "火",
        "玫瑰红": "火",
        "橙色": "火",
        "紫色": "火",
        "咖色": "土",
        "金色": "金",
    }

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def get_color_meaning(self, color: str) -> QueryResult:
        payload = self.repository.get_lookup("elements").get("element.color_meanings", {})
        aliases = payload.get("color_aliases", {})
        color_mapping = payload.get("color_element_mapping", {})
        standard_color = aliases.get(color, color)
        element = color_mapping.get(standard_color)
        if not element:
            return QueryResult.not_found(f"color {color} not found", entity_id=color)

        return QueryResult(
            value={
                "color": standard_color,
                "element": element,
                "is_special": standard_color in payload.get("special_colors", {}),
            },
            entity_id=f"element.color.{standard_color}",
            evidence=[
                {
                    "entity_id": "element.color_meanings",
                    "source_path": "elements/color_meanings.yaml",
                    "kind": "color_mapping",
                }
            ],
        )

    def get_element_by_color(self, color: str) -> dict[str, Any] | None:
        payload = self.repository.get_lookup("elements").get("element.color_meanings", {})
        aliases = payload.get("color_aliases", {})
        standard_color = aliases.get(color, color)
        if standard_color in self.DIRECT_COLOR_MAPPING:
            return {"element": self.DIRECT_COLOR_MAPPING[standard_color], "confidence": "high"}
        if standard_color in self.AMBIGUOUS_COLOR_MAPPING:
            return {
                "element": self.AMBIGUOUS_COLOR_MAPPING[standard_color],
                "confidence": "medium",
            }
        return None

    def get_color_detailed_interpretation(
        self,
        element: str,
        shade: str,
        circle: str,
    ) -> QueryResult:
        payload = self.repository.get_lookup("elements").get("element.color_meanings", {})
        meanings = payload.get("color_meanings", {})
        element_data = meanings.get(element, {})
        if not element_data:
            return QueryResult.not_found(f"element {element} not found", entity_id=element)
        shade_data = element_data.get("shades", {}).get(shade, {})
        if not shade_data:
            return QueryResult.not_found(
                f"shade {shade} not found",
                entity_id=f"{element}.{shade}",
            )
        circle_data = shade_data.get("circles", {}).get(circle, {})
        if not circle_data:
            return QueryResult.not_found(
                f"circle {circle} not found",
                entity_id=f"{element}.{shade}.{circle}",
            )
        return QueryResult(
            value={
                "element": element,
                "shade": shade,
                "circle": circle,
                "interpretation": circle_data.get("interpretation"),
                "keywords": shade_data.get("keywords", []),
                "manifestations": circle_data.get("manifestations", []),
                "healing": circle_data.get("healing", ""),
            },
            entity_id=f"{element}.{shade}.{circle}",
            evidence=[
                {
                    "entity_id": "element.color_meanings",
                    "source_path": "elements/color_meanings.yaml",
                    "kind": "color_detail",
                }
            ],
        )

