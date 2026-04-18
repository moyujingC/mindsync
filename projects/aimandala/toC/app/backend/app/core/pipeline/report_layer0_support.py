"""Layer0 support helpers for the report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer0Raw
from .report_blueprints import LITE_REPORT_BLUEPRINT

ELEMENT_KEY_TO_CN = {
    "wood": "木",
    "fire": "火",
    "earth": "土",
    "metal": "金",
    "water": "水",
}


class ReportLayer0Support:
    """Build and normalize Layer0 payloads for report assembly."""

    def __init__(
        self,
        *,
        get_layer0_assembler: Callable[[], Any],
        extract_colors_by_circles: Any,
        analyze_energy_flow: Callable[[list, list, list], dict[str, Any]],
    ) -> None:
        self._get_layer0_assembler = get_layer0_assembler
        self._extract_colors_by_circles = extract_colors_by_circles
        self._analyze_energy_flow = analyze_energy_flow

    def build_placeholder(self, record: InterpretationRecord) -> Layer0Raw:
        layer0_assembler = self._get_layer0_assembler()
        if layer0_assembler is not None:
            layer = layer0_assembler.build_from_record(
                record,
                extract_colors_by_circles=self._extract_colors_by_circles,
                analyze_energy_flow=self._analyze_energy_flow,
            )
            if layer is not None:
                return layer
            return layer0_assembler.build_fallback(record)

        return self.build_fallback(record)

    def build_fallback(self, record: InterpretationRecord) -> Layer0Raw:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer = Layer0Raw()
        layer.imbalance_candidates = ["transition-overload"]
        layer0_assembler = self._get_layer0_assembler()
        fallback_trace = (
            layer0_assembler.imbalance_service.evaluate_imbalance_trace(
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
            if layer0_assembler is not None
            else {
                "element_states": [],
                "triad_states": [],
                "imbalance_trace": {"all_candidates": []},
            }
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
            "reason": "report_layer0_fallback",
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
        }
        layer.knowledge_hits = {
            "circle_readings": {},
            "source_refs": [
                {
                    "entity_id": "generated.report_layer0",
                    "source_path": "generated:report_layer0_fallback",
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
                        "reason_codes": ["report_layer0_fallback"],
                        "decision": "synthetic",
                        "warning": None,
                    }
                ],
                "synthetic_signal": synthetic_signal,
            },
            "primary_candidates": ["transition-overload"],
            "synthetic_signal": synthetic_signal,
            "imbalance_candidates": ["transition-overload"],
            "theme_mappings": {},
        }
        layer.theme_projection = {"theme_id": getattr(record, "theme", "general")}
        layer.fidelity_flags = ["fallback:generated"]
        layer.fallback_summary = {
            "used": True,
            "levels": ["generated"],
            "warnings": ["layer0 assembler unavailable; using report-layer0 fallback"],
        }
        return layer

    def get_record_theme(self, record: InterpretationRecord) -> str:
        return getattr(record, "theme", None) or "general"

    def get_layer0_view(self, record: InterpretationRecord) -> Layer0Raw:
        layer0 = getattr(record, "layer_0_raw", None)
        if isinstance(layer0, Layer0Raw):
            return layer0
        try:
            return self.build_fallback(record)
        except Exception:
            return Layer0Raw()

    def get_layer0_element_distribution(
        self,
        layer0: Layer0Raw,
    ) -> list[dict[str, Any]]:
        source = {
            "wood": getattr(layer0.five_elements, "wood", {}),
            "fire": getattr(layer0.five_elements, "fire", {}),
            "earth": getattr(layer0.five_elements, "earth", {}),
            "metal": getattr(layer0.five_elements, "metal", {}),
            "water": getattr(layer0.five_elements, "water", {}),
        }
        distribution: list[dict[str, Any]] = []
        for key, item in source.items():
            raw_item = item if isinstance(item, dict) else {}
            try:
                percentage = float(raw_item.get("percentage", 0.0) or 0.0)
            except (TypeError, ValueError):
                percentage = 0.0
            distribution.append(
                {
                    "key": key,
                    "name": raw_item.get("element_cn") or ELEMENT_KEY_TO_CN.get(key, key),
                    "percentage": round(percentage, 2),
                    "areas": raw_item.get("areas", [])
                    if isinstance(raw_item.get("areas", []), list)
                    else [],
                }
            )
        return sorted(distribution, key=lambda item: item["percentage"], reverse=True)
