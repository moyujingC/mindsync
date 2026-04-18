"""Compatibility query engine backed by the v2.1 knowledge runtime."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, List, Optional

from app.core.knowledge_runtime.contracts import QueryResult
from app.core.knowledge_runtime.runtime import get_knowledge_runtime

from .three_circles import analyze_energy_flow as legacy_analyze_energy_flow


class KnowledgeQueryEngine:
    """Compatibility facade around the v2.1 runtime services."""

    def __init__(self, enable_cache: bool = True, version: str = "toc"):
        self.enable_cache = enable_cache
        self.version = version
        self.runtime = get_knowledge_runtime()
        self._cache: dict[str, QueryResult] = {}

    def get_color_meaning(
        self,
        color: str,
        element: Optional[str] = None,
        theme: str = "general",
    ) -> QueryResult:
        cache_key = f"color:{color}:{element}:{theme}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        if theme != "general":
            themed = self.runtime.theme_service.get_theme_color_interpretation(
                theme,
                element or color,
                color if element else "",
            )
            if themed:
                result = QueryResult(
                    value=themed,
                    entity_id=f"theme.{theme}.color",
                    fallback_level="themed",
                    source="theme",
                    evidence=[
                        {
                            "entity_id": f"theme.{theme}",
                            "source_path": f"themes/{theme}.yaml",
                            "kind": "theme_color_meaning",
                        }
                    ],
                )
                self._cache_store(cache_key, result)
                return result

        result = self.runtime.element_service.get_color_meaning(color)
        self._cache_store(cache_key, result)
        return result

    def get_color_detailed(
        self,
        color: str,
        element: Optional[str] = None,
    ) -> QueryResult:
        if element is None:
            mapping = self.runtime.element_service.get_element_by_color(color)
            if not mapping:
                return QueryResult.not_found("暂无详细解读")
            element = mapping["element"]
        return self.runtime.element_service.get_color_detailed_interpretation(
            element,
            color,
            "内圈",
        )

    def get_circle_interpretation(
        self,
        circle: str,
        dominant_element: str,
        theme: str = "general",
    ) -> QueryResult:
        cache_key = f"circle:{circle}:{dominant_element}:{theme}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        result = self.runtime.circle_service.get_circle_interpretation(
            circle,
            dominant_element,
            theme=theme,
        )
        self._cache_store(cache_key, result)
        return result

    def analyze_energy_flow(
        self,
        inner_element: str,
        middle_element: str,
        outer_element: str,
    ) -> QueryResult:
        try:
            flow = legacy_analyze_energy_flow(
                [inner_element] if inner_element else [],
                [middle_element] if middle_element else [],
                [outer_element] if outer_element else [],
            )
            return QueryResult(value=flow, entity_id="circle.energy_flow")
        except Exception as exc:  # pragma: no cover - defensive fallback
            return QueryResult.not_found(f"分析失败: {exc}")

    def identify_imbalances(
        self,
        color_analysis: Dict,
        circle_elements: Dict,
    ) -> List[str]:
        return self.runtime.imbalance_service.identify_imbalances(
            color_analysis,
            circle_elements,
            version=self.version,
        )

    def evaluate_imbalance_trace(
        self,
        color_analysis: Dict,
        circle_elements: Dict,
    ) -> Dict[str, Any]:
        return self.runtime.imbalance_service.evaluate_imbalance_trace(
            color_analysis,
            circle_elements,
            version=self.version,
        )

    def get_imbalance_detail(self, imbalance_type: str) -> QueryResult:
        return self.runtime.imbalance_service.get_imbalance_detail(imbalance_type)

    def get_healing_plan(
        self,
        imbalance_type: str,
        theme: str = "general",
    ) -> QueryResult:
        return self.runtime.healing_service.get_healing_plan(imbalance_type, theme)

    def batch_query(
        self,
        colors: List[str],
        circles: List[str],
        theme: str = "general",
    ) -> Dict[str, Any]:
        results = {
            "color_meanings": {},
            "circle_interpretations": {},
            "theme_config": None,
        }
        for color in colors:
            results["color_meanings"][color] = self.get_color_meaning(
                color,
                theme=theme,
            ).data
        for circle in circles:
            results["circle_interpretations"][circle] = self.get_circle_interpretation(
                circle,
                "土",
                theme=theme,
            ).data
        if theme != "general":
            results["theme_config"] = self.runtime.theme_service.get_theme_config(theme)
        return results

    def list_themes(self) -> List[Dict]:
        return [
            {
                "id": theme_id,
                "name": self.runtime.theme_service.get_theme_summary(theme_id).get("name")
                or theme_id,
            }
            for theme_id in self.runtime.theme_service.list_themes()
        ]

    def list_imbalances(self, version: str = None) -> List[Dict]:
        return self.runtime.imbalance_service.list_imbalances(
            version=version or self.version,
        )

    def clear_cache(self):
        self._cache.clear()

    def get_cache_stats(self) -> Dict:
        return {
            "enabled": self.enable_cache,
            "size": len(self._cache),
        }

    def _cache_get(self, key: str) -> QueryResult | None:
        if not self.enable_cache:
            return None
        return self._cache.get(key)

    def _cache_store(self, key: str, result: QueryResult) -> None:
        if self.enable_cache:
            self._cache[key] = result


@lru_cache(maxsize=128)
def query_color_meaning(
    color: str,
    element: Optional[str] = None,
    theme: str = "general",
) -> str:
    engine = KnowledgeQueryEngine()
    result = engine.get_color_meaning(color, element, theme)
    return result.data if result.found else "暂无解读"


@lru_cache(maxsize=128)
def query_circle_interpretation(
    circle: str,
    dominant_element: str,
    theme: str = "general",
) -> str:
    engine = KnowledgeQueryEngine()
    result = engine.get_circle_interpretation(circle, dominant_element, theme)
    return result.data if result.found else "暂无解读"


def identify_imbalance_types(
    color_analysis: Dict,
    circle_elements: Dict,
    version: str = "toc",
) -> List[str]:
    engine = KnowledgeQueryEngine(version=version)
    return engine.identify_imbalances(color_analysis, circle_elements)
