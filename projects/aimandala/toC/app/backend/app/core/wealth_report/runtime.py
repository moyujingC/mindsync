"""Native wealth report routing backed by the new healing knowledge base."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


SEMANTIC_ROUTE_RULES: dict[str, list[list[list[str]]]] = {
    "outer_red_or_fire_excess": [
        [["外圈", "外围", "边缘", "outer"], ["红", "火", "热", "橙"]]
    ],
    "weak_fire_many": [
        [["弱火", "火弱", "淡红", "粉色", "粉红", "浅红", "玫红"]]
    ],
    "metal_excess": [
        [["金多", "金性"]],
        [["白色", "留白", "空白", "浅色", "灰色"], ["多", "明显", "大片", "大量", "主要", "边界"]],
    ],
    "weak_or_fragmented_earth": [
        [["土弱", "土零散", "不成片"]],
        [["黄色", "棕色", "咖色", "褐色", "土"], ["零散", "分散", "碎", "不成片", "断开"]],
    ],
    "water_fire_conflict": [
        [["水火", "水火相冲", "冲突"]],
        [["蓝色", "水"], ["红色", "粉色", "火"], ["冲突", "拉扯", "对比", "交错"]],
    ],
    "rootless_wood": [
        [["木无根", "无根"]],
        [["绿色", "叶子", "枝条", "木"], ["漂", "无根", "断开", "缺少根基"]],
    ],
    "fragmented_white_or_metal_cut": [
        [["白色", "留白", "浅色", "金"], ["割裂", "截断", "分割", "分隔", "切开"]],
    ],
    "outer_world_closed_or_blank": [
        [["外圈", "外围", "边缘", "outer"], ["留白", "空白", "浅色", "浅色背景", "未填满", "表达弱", "单一"]],
    ],
    "inner_contracted_outer_strong": [
        [["内圈", "里圈", "inner"], ["收缩", "紧凑", "集中"], ["外圈", "外围", "边缘", "outer"]],
    ],
    "middle_tangled_relationship_pull": [
        [["中圈", "中间", "middle"], ["缠绕", "拉扯", "断裂", "卷曲", "打结", "交错"]],
    ],
    "outer_boundary_broken": [
        [["外圈", "外围", "边缘", "边界", "outer"], ["缺口", "破损", "断裂", "漏空", "不完整"]],
    ],
    "outer_boundary_thick_closed": [
        [["外圈", "外围", "边缘", "边界", "outer"], ["边界", "边框", "边界线"], ["闭合", "完整", "厚重", "框定", "保护"]],
    ],
    "fragmented_dots_scattered_energy": [
        [["碎点", "小点", "点缀", "零散"]],
        [["能量", "方向", "目标", "颜色", "图案"], ["分散", "零散", "散", "杂乱"]],
    ],
    "center_clear_outer_weak": [
        [["中心", "内圈", "inner"], ["清晰", "稳定", "聚焦", "焦点"], ["外圈", "外围", "边缘", "outer"], ["留白", "空白", "浅色", "弱", "单一", "简单"]],
    ],
    "heavy_overfilled_composition": [
        [["厚重", "过满", "填满", "压迫", "密集", "拥挤", "负担"]],
    ],
    "color_blocks_split": [
        [["色块", "颜色", "区域", "图案"], ["分割", "分区", "分隔", "交替", "对比"]],
    ],
}


@dataclass(frozen=True)
class WealthRouteMatch:
    """Selected wealth report routing result for one visual input."""

    selected_signal_ids: tuple[str, ...]
    selected_clause_ids: tuple[str, ...]
    selected_module_ids: tuple[str, ...]
    selected_next_explorations: tuple[dict[str, Any], ...]
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
            selected_next_explorations=tuple(
                self._select_next_explorations(
                    observation_text,
                    report_mode=report_mode,
                )
            ),
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
        keyword_groups = route.get("match_keywords")
        if isinstance(keyword_groups, dict):
            any_groups = keyword_groups.get("any", [])
            if isinstance(any_groups, list):
                for group in any_groups:
                    terms = (
                        [str(item).strip() for item in group if str(item).strip()]
                        if isinstance(group, list)
                        else [str(group).strip()]
                    )
                    if terms and all(term in observation_text for term in terms):
                        return True
            all_terms = keyword_groups.get("all", [])
            if isinstance(all_terms, list):
                terms = [str(item).strip() for item in all_terms if str(item).strip()]
                if terms and all(term in observation_text for term in terms):
                    return True

        signal_id = str(route.get("signal_id") or "")
        label = str(route.get("label") or "")
        if self._semantic_route_matches_observation(signal_id, observation_text):
            return True
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

    def _semantic_route_matches_observation(
        self,
        signal_id: str,
        observation_text: str,
    ) -> bool:
        normalized_text = self._normalize_observation_text(observation_text)
        for rule_key, alternatives in SEMANTIC_ROUTE_RULES.items():
            if rule_key not in signal_id:
                continue
            return any(
                all(
                    any(term in normalized_text for term in term_group)
                    for term_group in alternative
                )
                for alternative in alternatives
            )
        return False

    def _select_next_explorations(
        self,
        observation_text: str,
        *,
        report_mode: str,
    ) -> list[dict[str, Any]]:
        recommendations = self.load_routing().get("next_exploration_recommendations", {})
        if not isinstance(recommendations, dict):
            return []
        policy = recommendations.get("policy", {})
        mode_limit = 1 if report_mode == "lite" else 2
        if isinstance(policy, dict):
            raw_limit = policy.get("lite_max") if report_mode == "lite" else policy.get("pro_max")
            try:
                mode_limit = int(raw_limit or mode_limit)
            except (TypeError, ValueError):
                mode_limit = 1 if report_mode == "lite" else 2

        normalized_text = self._normalize_observation_text(observation_text)
        candidates: list[dict[str, Any]] = []
        for item in recommendations.get("mappings", []):
            if not isinstance(item, dict):
                continue
            trigger_signals = self._string_items(item.get("trigger_signals", []))
            if not trigger_signals:
                continue
            matched = [
                signal
                for signal in trigger_signals
                if self._next_exploration_signal_matches(signal, normalized_text)
            ]
            if not matched:
                continue
            candidates.append(
                {
                    "id": item.get("id"),
                    "recommended_topic": item.get("recommended_topic"),
                    "recommended_intention": item.get("recommended_intention"),
                    "matched_signals": matched[:3],
                    "why_not_expand_now": item.get("why_not_expand_now"),
                    "avoid": item.get("avoid", [])[:2] if isinstance(item.get("avoid"), list) else [],
                }
            )
        return candidates[: max(mode_limit, 0)]

    def _next_exploration_signal_matches(self, signal: str, normalized_text: str) -> bool:
        if signal in normalized_text:
            return True
        signal = signal.replace("收束", "收缩")
        text = normalized_text.replace("收束", "收缩")
        circle_terms = ("内圈", "中圈", "外圈")
        for circle in circle_terms:
            if signal.startswith(circle):
                tail = signal.removeprefix(circle)
                return bool(tail and circle in text and tail in text)
        return signal in text

    def _normalize_observation_text(self, text: str) -> str:
        replacements = {
            "inner_circle": "内圈",
            "inner": "内圈",
            "里圈": "内圈",
            "中心区域": "内圈",
            "middle_circle": "中圈",
            "middle": "中圈",
            "中间层": "中圈",
            "中间区域": "中圈",
            "outer_circle": "外圈",
            "outer": "外圈",
            "外围": "外圈",
            "边缘": "外圈",
        }
        normalized = text
        for source, target in replacements.items():
            normalized = normalized.replace(source, target)
        return normalized

    def _flatten_observations(self, observations: dict[str, Any]) -> str:
        parts: list[str] = []

        def collect(value: Any) -> None:
            if isinstance(value, dict):
                for key, child in value.items():
                    parts.append(str(key))
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
