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
