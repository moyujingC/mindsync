"""Imbalance rule runtime service."""

from __future__ import annotations

from typing import Any

from ..contracts import FallbackLevel, QueryResult
from ..repository import KnowledgeRepository

ELEMENT_CN = ("木", "火", "土", "金", "水")

IMBALANCE_RULE_MATRIX = (
    {"id": "水多木漂", "category": "相生太过", "source": "水", "affected": "木"},
    {"id": "火多土焦", "category": "相生太过", "source": "火", "affected": "土"},
    {"id": "木多火塞", "category": "相生太过", "source": "木", "affected": "火"},
    {"id": "土多金埋", "category": "相生太过", "source": "土", "affected": "金"},
    {"id": "金多水浊", "category": "相生太过", "source": "金", "affected": "水"},
    {"id": "水多金沉", "category": "子病犯母", "source": "水", "affected": "金"},
    {"id": "火多木焚", "category": "子病犯母", "source": "火", "affected": "木"},
    {"id": "土多火晦", "category": "子病犯母", "source": "土", "affected": "火"},
    {"id": "金多土虚", "category": "子病犯母", "source": "金", "affected": "土"},
    {"id": "木多水缩", "category": "子病犯母", "source": "木", "affected": "水"},
    {"id": "水多火灭", "category": "相乘", "source": "水", "affected": "火"},
    {"id": "火多金熔", "category": "相乘", "source": "火", "affected": "金"},
    {"id": "金多木折", "category": "相乘", "source": "金", "affected": "木"},
    {"id": "木多土陷", "category": "相乘", "source": "木", "affected": "土"},
    {"id": "土多水干", "category": "相乘", "source": "土", "affected": "水"},
    {"id": "木多金缺", "category": "相侮", "source": "木", "affected": "金"},
    {"id": "金多火熄", "category": "相侮", "source": "金", "affected": "火"},
    {"id": "火多水灼", "category": "相侮", "source": "火", "affected": "水"},
    {"id": "水多土荡", "category": "相侮", "source": "水", "affected": "土"},
    {"id": "土多木折", "category": "相侮", "source": "土", "affected": "木"},
)


class ImbalanceService:
    """Serve imbalance rules and identification helpers."""

    EXCESS_THRESHOLD = 0.30
    DEFICIENT_THRESHOLD = 0.12
    MIN_VISIBLE_SCORE = 0.55
    SYNTHETIC_SIGNAL_ID = "transition-overload"

    def __init__(self, repository: KnowledgeRepository) -> None:
        self.repository = repository

    def evaluate_imbalance_trace(
        self,
        color_analysis: dict[str, Any],
        circle_elements: dict[str, Any],
        *,
        version: str = "toc",
    ) -> dict[str, Any]:
        proportions = self._extract_element_proportions(color_analysis)
        normalized_circles = self._normalize_circle_elements(circle_elements)
        circle_counts = self._count_circle_dominants(normalized_circles)

        element_state_map = self._build_element_state_map(
            proportions=proportions,
            circle_counts=circle_counts,
        )
        triad_states = self._build_triad_states(
            normalized_circles=normalized_circles,
            element_state_map=element_state_map,
        )

        all_candidates = [
            self._score_candidate(
                rule=rule,
                element_state_map=element_state_map,
                circle_counts=circle_counts,
            )
            for rule in IMBALANCE_RULE_MATRIX
        ]
        all_candidates = sorted(
            all_candidates,
            key=lambda item: (-float(item.get("score", 0.0)), str(item.get("id", ""))),
        )

        primary_candidates = self._select_primary_candidates(
            all_candidates=all_candidates,
            version=version,
        )
        primary_ids = [item["id"] for item in primary_candidates]
        synthetic_signal = {
            "id": self.SYNTHETIC_SIGNAL_ID,
            "used": False,
            "reason": "",
        }

        if primary_ids and primary_ids != [self.SYNTHETIC_SIGNAL_ID]:
            for candidate in all_candidates:
                if candidate["id"] in primary_ids:
                    candidate["selected_for_primary"] = True
                    candidate["decision"] = "primary"
        if not primary_candidates:
            synthetic_signal = {
                "id": self.SYNTHETIC_SIGNAL_ID,
                "used": True,
                "reason": "no_toc_primary_candidate",
            }
            primary_candidates = [
                {
                    "id": self.SYNTHETIC_SIGNAL_ID,
                    "category": "阶段迁移",
                    "toc_supported": True,
                    "score": 1.0,
                    "selected_for_primary": True,
                    "reason_codes": ["no_toc_primary_candidate"],
                    "decision": "synthetic",
                    "warning": None,
                }
            ]
            primary_ids = [self.SYNTHETIC_SIGNAL_ID]

        return {
            "element_states": [
                value for _, value in element_state_map.items()
            ],
            "triad_states": triad_states,
            "imbalance_trace": {
                "all_candidates": all_candidates,
                "primary_candidates": primary_candidates,
                "synthetic_signal": synthetic_signal,
            },
            "primary_candidates": primary_ids,
            "synthetic_signal": synthetic_signal,
            "imbalance_candidates": primary_ids,
        }

    def identify_imbalances(
        self,
        color_analysis: dict[str, Any],
        circle_elements: dict[str, Any],
        *,
        version: str = "toc",
    ) -> list[str]:
        evaluation = self.evaluate_imbalance_trace(
            color_analysis,
            circle_elements,
            version=version,
        )
        return [
            item["id"]
            for item in evaluation.get("imbalance_trace", {}).get("primary_candidates", [])
            if isinstance(item, dict) and isinstance(item.get("id"), str) and item["id"].strip()
        ]

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
        definitions = self.repository.get_lookup("rules").get("rule.imbalance_types", {}).get(
            "imbalances", {}
        )
        if version == "toc":
            return [
                imbalance_id
                for imbalance_id in imbalance_ids
                if definitions.get(imbalance_id, {}).get("toc_supported", False)
            ]
        if version == "tob":
            return [
                imbalance_id
                for imbalance_id in imbalance_ids
                if not definitions.get(imbalance_id, {}).get("toc_supported", False)
            ]
        return imbalance_ids

    def _extract_element_proportions(
        self,
        color_analysis: dict[str, Any],
    ) -> dict[str, float]:
        result = {element: 0.0 for element in ELEMENT_CN}
        for data in color_analysis.values():
            if not isinstance(data, dict):
                continue
            element = self._normalize_element(data.get("element"))
            if not element:
                continue
            try:
                proportion = float(data.get("proportion", 0.0) or 0.0)
            except (TypeError, ValueError):
                proportion = 0.0
            result[element] = result.get(element, 0.0) + proportion
        return result

    def _normalize_circle_elements(
        self,
        circle_elements: dict[str, Any],
    ) -> dict[str, str]:
        result: dict[str, str] = {}
        for circle in ("inner", "middle", "outer"):
            normalized = self._normalize_element(circle_elements.get(circle))
            if normalized:
                result[circle] = normalized
        return result

    def _count_circle_dominants(
        self,
        normalized_circles: dict[str, str],
    ) -> dict[str, int]:
        counts = {element: 0 for element in ELEMENT_CN}
        for element in normalized_circles.values():
            counts[element] = counts.get(element, 0) + 1
        return counts

    def _build_element_state_map(
        self,
        *,
        proportions: dict[str, float],
        circle_counts: dict[str, int],
    ) -> dict[str, dict[str, Any]]:
        state_map: dict[str, dict[str, Any]] = {}
        for element in ELEMENT_CN:
            proportion = round(float(proportions.get(element, 0.0) or 0.0), 4)
            if proportion >= self.EXCESS_THRESHOLD:
                state = "excess"
            elif proportion <= self.DEFICIENT_THRESHOLD:
                state = "deficient"
            else:
                state = "balanced"
            state_map[element] = {
                "element": element,
                "proportion": proportion,
                "state": state,
                "excess_score": round(self._clamp((proportion - 0.20) / 0.20), 4),
                "deficiency_score": round(self._clamp((0.20 - proportion) / 0.20), 4),
                "presence_score": round(self._clamp(proportion / 0.20), 4),
                "evidence_basis": {
                    "proportion_source": "weighted_element_distribution",
                    "dominant_circle_count": circle_counts.get(element, 0),
                    "thresholds": {
                        "excess": self.EXCESS_THRESHOLD,
                        "deficient": self.DEFICIENT_THRESHOLD,
                    },
                },
            }
        return state_map

    def _build_triad_states(
        self,
        *,
        normalized_circles: dict[str, str],
        element_state_map: dict[str, dict[str, Any]],
    ) -> list[dict[str, Any]]:
        triad_states: list[dict[str, Any]] = []
        for circle in ("inner", "middle", "outer"):
            dominant = normalized_circles.get(circle, "")
            inferred_state = (
                element_state_map.get(dominant, {}).get("state", "balanced")
                if dominant
                else "unknown"
            )
            triad_states.append(
                {
                    "circle": circle,
                    "dominant_element": dominant,
                    "inferred_state": inferred_state,
                    "source_hit": f"dominant:{dominant}" if dominant else "missing",
                }
            )
        return triad_states

    def _score_candidate(
        self,
        *,
        rule: dict[str, str],
        element_state_map: dict[str, dict[str, Any]],
        circle_counts: dict[str, int],
    ) -> dict[str, Any]:
        definitions = self.repository.get_lookup("rules").get("rule.imbalance_types", {}).get(
            "imbalances", {}
        )
        definition = definitions.get(rule["id"], {})
        source_state = element_state_map.get(rule["source"], {})
        affected_state = element_state_map.get(rule["affected"], {})
        reason_codes: list[str] = []

        if rule["category"] == "相生太过":
            score = 0.65 * source_state.get("excess_score", 0.0) + 0.35 * affected_state.get(
                "presence_score", 0.0
            )
            if source_state.get("excess_score", 0.0) > 0:
                reason_codes.append("producer_excess")
            if affected_state.get("presence_score", 0.0) > 0:
                reason_codes.append("child_presence")
        elif rule["category"] == "子病犯母":
            score = 0.60 * source_state.get("excess_score", 0.0) + 0.40 * affected_state.get(
                "deficiency_score", 0.0
            )
            if source_state.get("excess_score", 0.0) > 0:
                reason_codes.append("child_excess")
            if affected_state.get("deficiency_score", 0.0) > 0:
                reason_codes.append("mother_deficient")
        elif rule["category"] == "相乘":
            score = 0.60 * source_state.get("excess_score", 0.0) + 0.40 * affected_state.get(
                "deficiency_score", 0.0
            )
            if source_state.get("excess_score", 0.0) > 0:
                reason_codes.append("attacker_excess")
            if affected_state.get("deficiency_score", 0.0) > 0:
                reason_codes.append("target_deficient")
        else:
            score = 0.60 * source_state.get("excess_score", 0.0) + 0.40 * affected_state.get(
                "deficiency_score", 0.0
            )
            if source_state.get("excess_score", 0.0) > 0:
                reason_codes.append("reverse_excess")
            if affected_state.get("deficiency_score", 0.0) > 0:
                reason_codes.append("controller_deficient")

        if circle_counts.get(rule["source"], 0) >= 2:
            score += 0.10
            reason_codes.append("source_dominant_in_two_circles")
        if circle_counts.get(rule["affected"], 0) == 0:
            score += 0.05
            reason_codes.append("affected_absent_from_circles")
        if circle_counts.get(rule["source"], 0) == 0 and circle_counts.get(rule["affected"], 0) == 0:
            score -= 0.15
            reason_codes.append("weak_circle_evidence")

        if definition.get("toc_supported", False):
            reason_codes.append("toc_supported")
        else:
            reason_codes.append("tob_only")

        score = round(self._clamp(score), 4)
        return {
            "id": rule["id"],
            "category": rule["category"],
            "toc_supported": bool(definition.get("toc_supported", False)),
            "score": score,
            "selected_for_primary": False,
            "reason_codes": reason_codes or ["no_signal"],
            "decision": "trace_only",
            "warning": definition.get("warning"),
        }

    def _select_primary_candidates(
        self,
        *,
        all_candidates: list[dict[str, Any]],
        version: str,
    ) -> list[dict[str, Any]]:
        if version == "toc":
            eligible = lambda item: bool(item.get("toc_supported", False))
        elif version == "tob":
            eligible = lambda item: not bool(item.get("toc_supported", False))
        else:
            eligible = lambda item: True

        primary: list[dict[str, Any]] = []
        for candidate in all_candidates:
            if not eligible(candidate):
                continue
            if float(candidate.get("score", 0.0)) < self.MIN_VISIBLE_SCORE:
                continue
            primary.append(
                {
                    **candidate,
                    "selected_for_primary": True,
                    "decision": "primary",
                }
            )
            if len(primary) >= 3:
                break
        return primary

    def _normalize_element(self, value: Any) -> str:
        if not isinstance(value, str):
            return ""
        stripped = value.strip()
        mapping = {
            "wood": "木",
            "fire": "火",
            "earth": "土",
            "metal": "金",
            "water": "水",
            "木": "木",
            "火": "火",
            "土": "土",
            "金": "金",
            "水": "水",
        }
        return mapping.get(stripped, "")

    def _clamp(self, value: float) -> float:
        return max(0.0, min(1.0, value))
