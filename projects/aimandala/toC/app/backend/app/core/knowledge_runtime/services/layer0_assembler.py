"""Layer 0 assembler backed by the v2.1 knowledge runtime."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable

if TYPE_CHECKING:
    from app.core.pipeline.data_models import Layer0Raw

from ..repository import KnowledgeRepository
from .circle_service import CircleService
from .element_service import ElementService
from .imbalance_service import ImbalanceService
from .theme_service import ThemeService

ELEMENT_KEY_TO_CN = {
    "wood": "木",
    "fire": "火",
    "earth": "土",
    "metal": "金",
    "water": "水",
}

CIRCLE_KEY_TO_CN = {
    "inner": "内圈",
    "middle": "中圈",
    "outer": "外圈",
}


class Layer0Assembler:
    """Build structured Layer 0 evidence from extracted circle colors."""

    def __init__(
        self,
        *,
        repository: KnowledgeRepository,
        element_service: ElementService,
        circle_service: CircleService,
        theme_service: ThemeService,
        imbalance_service: ImbalanceService,
    ) -> None:
        self.repository = repository
        self.element_service = element_service
        self.circle_service = circle_service
        self.theme_service = theme_service
        self.imbalance_service = imbalance_service

    def build_from_record(
        self,
        record: Any,
        *,
        extract_colors_by_circles: Callable[..., dict[str, Any]] | None,
        analyze_energy_flow: Callable[[list[str], list[str], list[str]], dict[str, Any]],
    ) -> Any:
        from app.core.pipeline.data_models import Layer0Raw

        if extract_colors_by_circles is None:
            return None

        image_path = (getattr(record, "image_local_path", None) or "").strip()
        if not image_path:
            return None

        path = Path(image_path)
        if not path.exists():
            return None

        circles = getattr(record, "three_circles", None) or {"inner_radius": 33, "middle_radius": 66}
        inner_ratio = circles.get("inner_radius", 33) / 100.0
        middle_ratio = circles.get("middle_radius", 66) / 100.0

        try:
            circle_colors = extract_colors_by_circles(
                str(path),
                inner_radius=inner_ratio,
                middle_radius=middle_ratio,
            )
        except Exception:
            return None

        if not isinstance(circle_colors, dict) or not circle_colors:
            return None

        element_distribution = self._aggregate_five_elements(circle_colors, circles)
        layer = Layer0Raw(description="V2.1知识结构化解释证据")
        layer.circle_colors = circle_colors
        layer.color_analysis = self._build_color_analysis(
            circle_colors,
            element_distribution,
            theme=getattr(record, "theme", "general"),
        )
        self._apply_five_elements(layer, element_distribution)
        self._apply_three_circles(
            layer,
            circle_colors,
            circles,
            theme=getattr(record, "theme", "general"),
        )
        self._apply_micro_analysis(layer, circle_colors, analyze_energy_flow=analyze_energy_flow)

        color_analysis = {
            key: {
                "element": item["element_cn"],
                "proportion": item["proportion"],
            }
            for key, item in element_distribution.items()
        }
        circle_elements = {
            circle_key: ELEMENT_KEY_TO_CN.get(circle_data.get("dominant_element"), "")
            for circle_key, circle_data in circle_colors.items()
            if isinstance(circle_data, dict)
        }
        trace = self.imbalance_service.evaluate_imbalance_trace(
            color_analysis,
            circle_elements,
            version="toc",
        )
        primary_candidates = trace.get("primary_candidates", [])
        synthetic_signal = trace.get("synthetic_signal", {})
        layer.imbalance_candidates = list(primary_candidates)

        theme_summary = self.theme_service.get_theme_summary(getattr(record, "theme", "general"))
        build_info = self.repository.get_build_info()
        dominant_key = max(
            element_distribution.items(),
            key=lambda item: item[1].get("percentage", 0.0),
        )[0]
        dominant_elements = {
            circle_key: ELEMENT_KEY_TO_CN.get(circle_data.get("dominant_element"), "")
            for circle_key, circle_data in circle_colors.items()
            if isinstance(circle_data, dict)
        }
        extracted_color_metrics = {
            "overall_saturation": layer.color_analysis.get("overall_saturation"),
            "black_ratio": layer.color_analysis.get("black_ratio"),
            "red_ratio": layer.color_analysis.get("red_ratio"),
        }
        layer.visual_facts = {
            "image_path": str(path),
            "circle_boundaries": circles,
            "dominant_element": ELEMENT_KEY_TO_CN.get(dominant_key, dominant_key),
            "dominant_elements": dominant_elements,
            "circle_colors": circle_colors,
            "circle_colors_detected": sorted(circle_colors.keys()),
            "weighted_element_distribution": {
                key: {
                    "element": item["element_cn"],
                    "proportion": item["proportion"],
                    "percentage": item["percentage"],
                    "areas": item["areas"],
                }
                for key, item in element_distribution.items()
            },
            "extracted_color_metrics": extracted_color_metrics,
            "knowledge_build": {
                "build_selector": build_info.get("build_selector"),
                "build_source": build_info.get("build_source"),
                "build_id": build_info.get("build_id"),
                "pack_id": build_info.get("pack_id"),
            },
        }
        layer.knowledge_hits = {
            "circle_readings": {
                circle_key: getattr(layer.three_circles, circle_key).get("knowledge_reading", "")
                for circle_key in ["inner", "middle", "outer"]
            },
            "theme_summary": theme_summary,
            "build_info": build_info,
            "source_refs": [
                {
                    "entity_id": f"theme.{theme_summary.get('theme_id', getattr(record, 'theme', 'general'))}",
                    "source_path": f"themes/{theme_summary.get('theme_id', getattr(record, 'theme', 'general'))}.yaml",
                    "kind": "theme_config",
                },
                {
                    "entity_id": "circle.三圈",
                    "source_path": "circles/three_circles.yaml",
                    "kind": "circle_runtime",
                },
                {
                    "entity_id": "rule.imbalance_types",
                    "source_path": "rules/imbalance_types.yaml",
                    "kind": "imbalance_rule",
                },
            ],
        }
        primary_theme_mappings = {
            imbalance_id: self.imbalance_service.get_theme_mapping(
                getattr(record, "theme", "general"),
                imbalance_id,
            ).value
            for imbalance_id in primary_candidates
        }
        trace["theme_mappings"] = primary_theme_mappings
        trace["primary_candidates"] = list(primary_candidates)
        trace["synthetic_signal"] = synthetic_signal
        trace["imbalance_candidates"] = list(primary_candidates)
        layer.rule_evaluations = {
            **trace,
            "theme_mappings": primary_theme_mappings,
        }
        layer.theme_projection = {
            "theme_id": getattr(record, "theme", "general"),
            "theme_name": theme_summary.get("name", ""),
            "core_issues": theme_summary.get("core_issues", []),
            "focus_element": theme_summary.get("focus_element", ""),
            "related_circles": theme_summary.get("related_circles", []),
            "issue_type_count": theme_summary.get("issue_type_count", 0),
        }
        layer.fidelity_flags = self._collect_fidelity_flags(
            circle_colors=circle_colors,
            trace=trace,
        )
        layer.fallback_summary = {
            "used": False,
            "levels": [],
            "warnings": (
                ["no toc primary candidate; using transition-overload synthetic signal"]
                if synthetic_signal.get("used")
                else []
            ),
        }
        return layer

    def build_fallback(self, record: Any) -> Layer0Raw:
        from app.core.pipeline.data_models import Layer0Raw
        from app.core.pipeline.report_blueprints import LITE_REPORT_BLUEPRINT

        circles = getattr(record, "three_circles", None) or {"inner_radius": 33, "middle_radius": 66}
        theme = getattr(record, "theme", "general")
        theme_summary = self.theme_service.get_theme_summary(theme)
        layer = Layer0Raw()
        layer.imbalance_candidates = ["transition-overload"]
        fallback_trace = self.imbalance_service.evaluate_imbalance_trace(
            {
                "wood": {"element": "木", "proportion": 0.20},
                "fire": {"element": "火", "proportion": 0.20},
                "earth": {"element": "土", "proportion": 0.20},
                "metal": {"element": "金", "proportion": 0.20},
                "water": {"element": "水", "proportion": 0.20},
            },
            {},
            version="toc",
        )
        layer.color_analysis = {
            "summary": LITE_REPORT_BLUEPRINT.structure_labels["layer0_color_summary"],
            "overall_saturation": 0.42,
            "black_ratio": 0.18,
            "red_ratio": 0.11,
        }
        layer.circle_colors = {
            "inner": {"focus": "self-protection"},
            "middle": {"focus": "relationship-adjustment"},
            "outer": {"focus": "external-expression"},
        }
        layer.three_circles.inner = {
            "radius_percent": circles["inner_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_inner_meaning"],
        }
        layer.three_circles.middle = {
            "radius_percent": circles["middle_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_middle_meaning"],
        }
        layer.three_circles.outer = {
            "radius_percent": 100,
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_outer_meaning"],
        }
        layer.micro_analysis.adjacent = [
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_left"],
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_right"],
        ]
        layer.micro_analysis.wrap = [LITE_REPORT_BLUEPRINT.structure_labels["layer0_wrap"]]
        synthetic_signal = {
            "id": "transition-overload",
            "used": True,
            "reason": "generated_fallback",
        }
        layer.visual_facts = {
            "generated": True,
            "circle_boundaries": circles,
            "circle_colors": layer.circle_colors,
            "dominant_elements": {},
            "weighted_element_distribution": {},
            "extracted_color_metrics": {
                "overall_saturation": 0.42,
                "black_ratio": 0.18,
                "red_ratio": 0.11,
            },
            "knowledge_build": self.repository.get_build_info(),
        }
        layer.knowledge_hits = {
            "build_info": self.repository.get_build_info(),
            "theme_summary": theme_summary,
            "circle_readings": {
                "inner": layer.three_circles.inner.get("meaning", ""),
                "middle": layer.three_circles.middle.get("meaning", ""),
                "outer": layer.three_circles.outer.get("meaning", ""),
            },
            "source_refs": [
                {
                    "entity_id": "generated.layer0",
                    "source_path": "generated:layer0_fallback",
                    "kind": "generated_fallback",
                }
            ],
        }
        layer.rule_evaluations = {
            "element_states": fallback_trace.get("element_states", []),
            "triad_states": [
                {
                    **item,
                    "source_hit": "generated",
                }
                for item in fallback_trace.get("triad_states", [])
            ],
            "imbalance_trace": {
                "all_candidates": fallback_trace.get("imbalance_trace", {}).get("all_candidates", []),
                "primary_candidates": [
                    {
                        "id": "transition-overload",
                        "category": "阶段迁移",
                        "toc_supported": True,
                        "score": 1.0,
                        "selected_for_primary": True,
                        "reason_codes": ["generated_fallback"],
                        "decision": "synthetic",
                        "warning": None,
                    }
                ],
                "synthetic_signal": synthetic_signal,
            },
            "primary_candidates": ["transition-overload"],
            "synthetic_signal": synthetic_signal,
            "imbalance_candidates": ["transition-overload"],
            "theme_mappings": {
                "transition-overload": self.imbalance_service.get_theme_mapping(
                    theme,
                    "transition-overload",
                ).value
            },
        }
        layer.theme_projection = {
            "theme_id": theme,
            "theme_name": theme_summary.get("name", ""),
            "core_issues": theme_summary.get("core_issues", []),
            "focus_element": theme_summary.get("focus_element", ""),
            "related_circles": theme_summary.get("related_circles", []),
            "issue_type_count": theme_summary.get("issue_type_count", 0),
        }
        layer.fallback_summary = {
            "used": True,
            "levels": ["generated"],
            "warnings": ["vision extraction unavailable; using deterministic fallback layer0"],
        }
        layer.fidelity_flags = ["fallback:generated"]
        return layer

    def _aggregate_five_elements(
        self,
        circle_colors: dict[str, Any],
        circles: dict[str, int],
    ) -> dict[str, dict[str, Any]]:
        inner_ratio = circles.get("inner_radius", 33) / 100.0
        middle_ratio = circles.get("middle_radius", 66) / 100.0
        weights = {
            "inner": max(inner_ratio**2, 0.0001),
            "middle": max(middle_ratio**2 - inner_ratio**2, 0.0001),
            "outer": max(1 - middle_ratio**2, 0.0001),
        }
        aggregate = {key: 0.0 for key in ELEMENT_KEY_TO_CN}
        areas = {key: [] for key in ELEMENT_KEY_TO_CN}
        for circle_key, weight in weights.items():
            circle_data = circle_colors.get(circle_key, {})
            distribution = circle_data.get("five_elements", {})
            for element_key, percentage in distribution.items():
                if element_key not in aggregate:
                    continue
                aggregate[element_key] += weight * (float(percentage) / 100.0)
            dominant = circle_data.get("dominant_element")
            if dominant in areas:
                areas[dominant].append(CIRCLE_KEY_TO_CN.get(circle_key, circle_key))
        total = sum(aggregate.values()) or 1.0
        return {
            element_key: {
                "percentage": round(value / total * 100.0, 2),
                "proportion": round((value / total), 4),
                "areas": areas.get(element_key, []),
                "element_cn": ELEMENT_KEY_TO_CN[element_key],
            }
            for element_key, value in aggregate.items()
        }

    def _build_color_analysis(
        self,
        circle_colors: dict[str, Any],
        element_distribution: dict[str, dict[str, Any]],
        *,
        theme: str,
    ) -> dict[str, Any]:
        metrics = self._derive_color_risk_metrics(circle_colors)
        dominant = max(
            element_distribution.items(),
            key=lambda item: item[1].get("percentage", 0.0),
        )[0]
        return {
            "summary": f"V2.1已基于三圈颜色提取完成五行聚合，当前主导元素更接近「{ELEMENT_KEY_TO_CN.get(dominant, dominant)}」。",
            "overall_saturation": metrics["overall_saturation"],
            "black_ratio": metrics["black_ratio"],
            "red_ratio": metrics["red_ratio"],
            "theme_summary": self.theme_service.get_theme_summary(theme),
            "element_distribution": {
                key: {
                    "element": item["element_cn"],
                    "percentage": item["percentage"],
                    "proportion": item["proportion"],
                    "areas": item["areas"],
                }
                for key, item in element_distribution.items()
            },
        }

    def _derive_color_risk_metrics(self, circle_colors: dict[str, Any]) -> dict[str, float]:
        weighted_saturation = 0.0
        weighted_black = 0.0
        weighted_red = 0.0
        total_weight = 0.0
        for circle_data in circle_colors.values():
            for color in circle_data.get("colors", []):
                percentage = float(color.get("percentage", 0.0)) / 100.0
                rgb = color.get("rgb") or []
                if len(rgb) != 3:
                    continue
                r, g, b = [float(value) for value in rgb]
                max_c = max(r, g, b)
                min_c = min(r, g, b)
                saturation = 0.0 if max_c == 0 else (max_c - min_c) / max_c
                brightness = 0.299 * r + 0.587 * g + 0.114 * b
                weighted_saturation += saturation * percentage
                if brightness < 40:
                    weighted_black += percentage
                if r > 120 and r > g * 1.15 and r > b * 1.15:
                    weighted_red += percentage
                total_weight += percentage
        if total_weight <= 0:
            return {"overall_saturation": 0.42, "black_ratio": 0.18, "red_ratio": 0.11}
        return {
            "overall_saturation": round(weighted_saturation / total_weight, 4),
            "black_ratio": round(weighted_black / total_weight, 4),
            "red_ratio": round(weighted_red / total_weight, 4),
        }

    def _apply_five_elements(
        self,
        layer: Any,
        element_distribution: dict[str, dict[str, Any]],
    ) -> None:
        for element_key, item in element_distribution.items():
            setattr(
                layer.five_elements,
                element_key,
                {
                    "percentage": item["percentage"],
                    "areas": item["areas"],
                    "element_cn": item["element_cn"],
                },
            )

    def _apply_three_circles(
        self,
        layer: Any,
        circle_colors: dict[str, Any],
        circles: dict[str, int],
        *,
        theme: str,
    ) -> None:
        from app.core.pipeline.report_blueprints import LITE_REPORT_BLUEPRINT

        radius_map = {
            "inner": circles.get("inner_radius", 33),
            "middle": circles.get("middle_radius", 66),
            "outer": 100,
        }
        meaning_map = {
            "inner": LITE_REPORT_BLUEPRINT.structure_labels["layer0_inner_meaning"],
            "middle": LITE_REPORT_BLUEPRINT.structure_labels["layer0_middle_meaning"],
            "outer": LITE_REPORT_BLUEPRINT.structure_labels["layer0_outer_meaning"],
        }
        for circle_key in ["inner", "middle", "outer"]:
            circle_data = circle_colors.get(circle_key, {})
            dominant_key = circle_data.get("dominant_element")
            dominant_cn = ELEMENT_KEY_TO_CN.get(dominant_key, dominant_key or "")
            knowledge_result = self.circle_service.get_circle_interpretation(
                CIRCLE_KEY_TO_CN[circle_key],
                dominant_cn,
                theme=theme,
            )
            target = getattr(layer.three_circles, circle_key)
            target.update(
                {
                    "radius_percent": radius_map[circle_key],
                    "meaning": meaning_map[circle_key],
                    "dominant": dominant_cn,
                    "dominant_color": circle_data.get("dominant_color"),
                    "five_elements": circle_data.get("five_elements", {}),
                    "colors": [item.get("hex") for item in circle_data.get("colors", [])[:3]],
                    "knowledge_reading": knowledge_result.data if knowledge_result.found else "",
                }
            )

    def _apply_micro_analysis(
        self,
        layer: Any,
        circle_colors: dict[str, Any],
        *,
        analyze_energy_flow: Callable[[list[str], list[str], list[str]], dict[str, Any]],
    ) -> None:
        from app.core.pipeline.report_blueprints import LITE_REPORT_BLUEPRINT

        inner = ELEMENT_KEY_TO_CN.get(circle_colors.get("inner", {}).get("dominant_element"), "")
        middle = ELEMENT_KEY_TO_CN.get(circle_colors.get("middle", {}).get("dominant_element"), "")
        outer = ELEMENT_KEY_TO_CN.get(circle_colors.get("outer", {}).get("dominant_element"), "")
        flow_analysis = analyze_energy_flow(
            [inner] if inner else [],
            [middle] if middle else [],
            [outer] if outer else [],
        )
        path_analysis = flow_analysis.get("path_analysis", {}) if isinstance(flow_analysis, dict) else {}
        blockages = flow_analysis.get("blockages", []) if isinstance(flow_analysis, dict) else []
        recommendations = flow_analysis.get("recommendations", []) if isinstance(flow_analysis, dict) else []
        adjacent = [
            item.get("description", "")
            for item in path_analysis.values()
            if isinstance(item, dict) and item.get("description")
        ]
        if not adjacent:
            adjacent = [
                LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_left"],
                LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_right"],
            ]
        wrap = [item for item in [*blockages, *recommendations] if isinstance(item, str) and item]
        if not wrap:
            wrap = [LITE_REPORT_BLUEPRINT.structure_labels["layer0_wrap"]]
        layer.micro_analysis.adjacent = adjacent
        layer.micro_analysis.wrap = wrap

    def _collect_fidelity_flags(
        self,
        circle_colors: dict[str, Any],
        trace: dict[str, Any],
    ) -> list[str]:
        flags: list[str] = []
        for circle_key in ["inner", "middle", "outer"]:
            if not circle_colors.get(circle_key):
                flags.append(f"missing_circle:{circle_key}")
        all_candidates = trace.get("imbalance_trace", {}).get("all_candidates", [])
        if any(
            not bool(candidate.get("toc_supported", False))
            and float(candidate.get("score", 0.0)) >= self.imbalance_service.MIN_VISIBLE_SCORE
            for candidate in all_candidates
            if isinstance(candidate, dict)
        ):
            flags.append("trace:tob_only_candidate_present")
        for candidate in all_candidates:
            if not isinstance(candidate, dict):
                continue
            warning = str(candidate.get("warning") or "").strip()
            if warning and float(candidate.get("score", 0.0)) >= self.imbalance_service.MIN_VISIBLE_SCORE:
                flags.append(f"warning:{candidate.get('id')}")
        return flags
