"""Direct judgment runtime service."""

from __future__ import annotations

from typing import Any

from ..repository import KnowledgeRepository


class DirectJudgmentService:
    """Serve and programmatically match direct judgment rules."""

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def list_judgments(self) -> list[dict[str, Any]]:
        payload = self.repository.get_lookup("rules").get("rule.direct_judgments", {})
        judgments = payload.get("judgments", [])
        if not isinstance(judgments, list):
            return []
        return [item for item in judgments if isinstance(item, dict)]

    def match_programmatically(self, stage03: dict[str, Any]) -> list[dict[str, Any]]:
        units_by_circle = self._units_by_circle(stage03)
        matches: list[dict[str, Any]] = []
        for judgment in self.list_judgments():
            match = self._match_one(judgment, units_by_circle)
            if match:
                matches.append(match)
        return matches

    def _match_one(
        self,
        judgment: dict[str, Any],
        units_by_circle: dict[str, list[dict[str, Any]]],
    ) -> dict[str, Any] | None:
        judgment_id = str(judgment.get("id") or "").strip()
        if judgment_id == "direct_judgment.outer_red_mass":
            return self._match_outer_red_mass(judgment, units_by_circle)
        if judgment_id == "direct_judgment.large_yellow_mass":
            return self._match_large_color_mass(judgment, units_by_circle, color="黄色")
        if judgment_id == "direct_judgment.blue_green_expression":
            return self._match_blue_green(judgment, units_by_circle)
        return None

    def _match_outer_red_mass(
        self,
        judgment: dict[str, Any],
        units_by_circle: dict[str, list[dict[str, Any]]],
    ) -> dict[str, Any] | None:
        red_units = [
            unit
            for unit in units_by_circle.get("outer", [])
            if "红" in str(unit.get("color") or "")
            and self._area_ratio(unit) >= 0.25
        ]
        if not red_units:
            return None
        return self._build_match(judgment, red_units, "外圈存在成片红色。")

    def _match_large_color_mass(
        self,
        judgment: dict[str, Any],
        units_by_circle: dict[str, list[dict[str, Any]]],
        *,
        color: str,
    ) -> dict[str, Any] | None:
        units = [
            unit
            for circle_units in units_by_circle.values()
            for unit in circle_units
            if color in str(unit.get("color") or "")
            and self._area_ratio(unit) >= 0.30
        ]
        if not units:
            return None
        return self._build_match(judgment, units, f"画面存在成片{color}。")

    def _match_blue_green(
        self,
        judgment: dict[str, Any],
        units_by_circle: dict[str, list[dict[str, Any]]],
    ) -> dict[str, Any] | None:
        all_units = [unit for units in units_by_circle.values() for unit in units]
        blue_units = [unit for unit in all_units if "蓝" in str(unit.get("color") or "")]
        green_units = [unit for unit in all_units if "绿" in str(unit.get("color") or "")]
        if not blue_units or not green_units:
            return None
        return self._build_match(
            judgment,
            [blue_units[0], green_units[0]],
            "画面同时出现蓝色和绿色。",
        )

    def _build_match(
        self,
        judgment: dict[str, Any],
        units: list[dict[str, Any]],
        evidence: str,
    ) -> dict[str, Any]:
        judgment_id = str(judgment.get("id") or "").strip()
        return {
            "mode": str(judgment.get("name") or judgment_id),
            "mode_id": judgment_id,
            "hit_strength": "full_hit",
            "visual_unit_refs": [
                str(unit.get("id") or "").strip()
                for unit in units
                if str(unit.get("id") or "").strip()
            ],
            "visible_evidence": [evidence],
            "knowledge_refs": [judgment_id],
            "program_hit": True,
        }

    def _units_by_circle(self, stage03: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        circles = stage03.get("circles") if isinstance(stage03, dict) else {}
        result: dict[str, list[dict[str, Any]]] = {}
        if not isinstance(circles, dict):
            return result
        for circle_key, circle_payload in circles.items():
            if not isinstance(circle_payload, dict):
                continue
            units = circle_payload.get("visual_units", [])
            if isinstance(units, list):
                result[str(circle_key)] = [
                    item for item in units if isinstance(item, dict)
                ]
        return result

    def _area_ratio(self, unit: dict[str, Any]) -> float:
        try:
            return float(unit.get("area_ratio", 0.0) or 0.0)
        except (TypeError, ValueError):
            return 0.0
