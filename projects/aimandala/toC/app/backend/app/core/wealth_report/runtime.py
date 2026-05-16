"""Native wealth report routing backed by the new healing knowledge base."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class WealthRouteMatch:
    """Selected wealth report routing result for one visual input."""

    selected_signal_ids: tuple[str, ...]
    selected_clause_ids: tuple[str, ...]
    selected_module_ids: tuple[str, ...]
    boundaries: tuple[str, ...]


class WealthReportRuntime:
    """Read and query the native `wealth` report knowledge units.

    This runtime intentionally does not import the old `wealth_career` theme pack.
    It reads the new source-of-truth YAML files from `疗愈体系知识库` directly.
    """

    def __init__(self, *, kb_root: Path | None = None) -> None:
        self.kb_root = kb_root or self._default_kb_root()
        self.routing_path = (
            self.kb_root / "50-结构化知识单元" / "40-wealth-report-routing.yaml"
        )
        self.clauses_path = (
            self.kb_root / "50-结构化知识单元" / "20-wealth-issue-clauses.yaml"
        )
        self.runtime_index_path = (
            self.kb_root / "60-运行时知识包" / "20-aimandala-report-runtime-index.yaml"
        )
        self._routing: dict[str, Any] | None = None
        self._clauses: dict[str, Any] | None = None
        self._runtime_index: dict[str, Any] | None = None

    @staticmethod
    def _default_kb_root() -> Path:
        return (
            Path(__file__).resolve().parents[6]
            / "docs"
            / "sources"
            / "疗愈体系知识库"
        )

    def load_routing(self) -> dict[str, Any]:
        if self._routing is None:
            self._routing = self._load_yaml(self.routing_path)
        return self._routing

    def load_clauses(self) -> dict[str, Any]:
        if self._clauses is None:
            self._clauses = self._load_yaml(self.clauses_path)
        return self._clauses

    def load_runtime_index(self) -> dict[str, Any]:
        if self._runtime_index is None:
            self._runtime_index = self._load_yaml(self.runtime_index_path)
        return self._runtime_index

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            raise FileNotFoundError(f"wealth runtime source missing: {path}")
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}

    def get_topic_context(self, *, report_mode: str) -> dict[str, Any]:
        """Return the product-facing topic context for native wealth reports."""

        clauses = self.load_clauses()
        definition = clauses.get("domain_definition", {})
        return {
            "topic": "wealth",
            "topic_label": str(definition.get("title") or "财富议题"),
            "report_mode": report_mode,
            "orientation": {
                "intro": "这份报告会从财富议题角度看这张画。",
                "focus": str(definition.get("summary") or "").strip(),
                "key_terms": [
                    {
                        "term": "金钱关系",
                        "explanation": "你如何感受、使用、保存和流动金钱。",
                    },
                    {
                        "term": "价值交换",
                        "explanation": "你是否允许自己的能力、服务和创造被看见并被支付。",
                    },
                    {
                        "term": "承载力",
                        "explanation": "机会、收入或资源进入时，你能否稳定接住并保存。",
                    },
                ],
            },
        }

    def get_quality_controls(self) -> tuple[str, ...]:
        routing = self.load_routing()
        controls = routing.get("quality_checks", [])
        return tuple(str(item).strip() for item in controls if str(item).strip())

    def get_safety_boundaries(self) -> tuple[str, ...]:
        routing = self.load_routing()
        safety = routing.get("safety", {})
        global_avoid = safety.get("global_avoid", []) if isinstance(safety, dict) else []
        return tuple(str(item).strip() for item in global_avoid if str(item).strip())

    def route_visual_observations(
        self,
        observations: dict[str, Any],
        *,
        report_mode: str = "lite",
    ) -> WealthRouteMatch:
        """Select candidate wealth clauses/modules from structured observations."""

        routing = self.load_routing()
        routes = routing.get("visual_signal_routes", [])
        mode_policy = (
            routing.get("module_selection", {}).get(report_mode, {})
            if isinstance(routing.get("module_selection"), dict)
            else {}
        )
        max_clauses = int(mode_policy.get("max_issue_clauses") or 2)
        max_modules = int(mode_policy.get("max_primary_modules") or 2)

        signal_ids: list[str] = []
        clause_ids: list[str] = []
        module_ids: list[str] = []
        boundaries: list[str] = []
        observation_text = self._flatten_observations(observations)

        for route in routes:
            if not isinstance(route, dict):
                continue
            if not self._route_matches_observation(route, observation_text):
                continue
            signal_id = str(route.get("signal_id") or "").strip()
            if signal_id:
                signal_ids.append(signal_id)
            clause_ids.extend(self._string_items(route.get("candidate_clauses", [])))
            module_ids.extend(self._string_items(route.get("candidate_modules", [])))
            boundary = str(route.get("report_boundary") or "").strip()
            if boundary:
                boundaries.append(boundary)

        return WealthRouteMatch(
            selected_signal_ids=tuple(self._unique(signal_ids)),
            selected_clause_ids=tuple(self._unique(clause_ids)[:max_clauses]),
            selected_module_ids=tuple(self._unique(module_ids)[:max_modules]),
            boundaries=tuple(self._unique(boundaries)),
        )

    def get_clause(self, clause_id: str) -> dict[str, Any]:
        clauses = self.load_clauses().get("clauses", [])
        for clause in clauses:
            if isinstance(clause, dict) and clause.get("id") == clause_id:
                return clause
        return {}

    def get_module(self, module_id: str) -> dict[str, Any]:
        modules = self.load_routing().get("knowledge_modules", [])
        for module in modules:
            if isinstance(module, dict) and module.get("module_id") == module_id:
                return module
        return {}

    def _route_matches_observation(
        self,
        route: dict[str, Any],
        observation_text: str,
    ) -> bool:
        signal_id = str(route.get("signal_id") or "")
        label = str(route.get("label") or "")
        haystack = f"{signal_id} {label}"
        keywords = {
            "outer_red_or_fire_excess": ("外圈", "红", "火", "热"),
            "weak_fire_many": ("弱火", "火弱", "淡红", "火多"),
            "metal_excess": ("金多", "白", "金色", "金"),
            "weak_or_fragmented_earth": ("土弱", "土零散", "不成片", "零散"),
            "water_fire_conflict": ("水火", "水火相冲", "冲突"),
            "rootless_wood": ("木无根", "无根", "绿色", "木"),
            "fragmented_white_or_metal_cut": ("白色", "割裂", "截断", "碎"),
            "outer_world_closed_or_blank": ("外圈", "留白", "空白", "闭合"),
        }
        for key, terms in keywords.items():
            if key in signal_id or key in haystack:
                return all(term in observation_text for term in terms[:1]) and any(
                    term in observation_text for term in terms[1:]
                )
        return bool(label and label in observation_text)

    def _flatten_observations(self, observations: dict[str, Any]) -> str:
        parts: list[str] = []

        def collect(value: Any) -> None:
            if isinstance(value, dict):
                for child in value.values():
                    collect(child)
            elif isinstance(value, (list, tuple, set)):
                for child in value:
                    collect(child)
            elif value is not None:
                parts.append(str(value))

        collect(observations)
        return " ".join(parts)

    def _string_items(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _unique(self, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))


@lru_cache(maxsize=1)
def get_wealth_report_runtime() -> WealthReportRuntime:
    return WealthReportRuntime()
