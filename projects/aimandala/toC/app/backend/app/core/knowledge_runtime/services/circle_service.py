"""Circle interpretation runtime service."""

from __future__ import annotations

from ..contracts import QueryResult
from ..repository import KnowledgeRepository


class CircleService:
    """Serve circle interpretations from the compiled index."""

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def get_circle_interpretation(
        self,
        circle_name: str,
        dominant_element: str,
        theme: str = "general",
    ) -> QueryResult:
        payload = self.repository.get_lookup("circles").get("circle.three_circles", {})
        circles = payload.get("three_circles", {})
        selected_key = None
        selected = None
        for key, value in circles.items():
            aliases = [key, *(value.get("alias") or [])]
            if circle_name in aliases:
                selected_key = key
                selected = value
                break

        if not selected or not selected_key:
            return QueryResult.not_found(
                f"circle {circle_name} not found",
                entity_id=f"circle.{circle_name}",
            )

        description = selected.get("interpretation", {}).get("description", "")
        focus = " / ".join(selected.get("interpretation", {}).get("focus", [])[:3])
        reading = (
            f"{selected.get('name', circle_name)}主要对应{description}"
            f"，当前更显著的是「{dominant_element}」特质。"
        )
        if focus:
            reading += f" 此圈可以重点观察：{focus}。"

        return QueryResult(
            value=reading,
            entity_id=f"circle.{selected_key}",
            evidence=[
                {
                    "entity_id": f"circle.{selected_key}",
                    "source_path": "circles/three_circles.yaml",
                    "kind": "circle_definition",
                    "theme": theme,
                }
            ],
        )

