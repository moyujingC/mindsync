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

CIRCLE_KEY_TO_CN = {
    "inner": "内圈",
    "middle": "中圈",
    "outer": "外圈",
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
        layer.input_package = self._build_input_package(record, circles)
        layer.visual_analysis_basis = self._build_visual_analysis_basis(circles, layer.circle_colors)
        layer.visual_facts = {
            "input_package": layer.input_package,
            "visual_analysis_basis": layer.visual_analysis_basis,
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

    def _build_input_package(
        self,
        record: InterpretationRecord,
        circles: dict[str, Any],
    ) -> dict[str, Any]:
        theme = getattr(record, "theme", None) or "general"
        image_ref = getattr(record, "image_local_path", None) or getattr(record, "image_path", None) or ""
        return {
            "image": {"image_ref": image_ref},
            "topic_input": {
                "topic": theme,
                "topic_label": theme if theme != "general" else "全面解读",
            },
            "user_context": {
                "painting_intention": getattr(record, "painting_intention", None) or "",
                "painting_feeling": getattr(record, "painting_feeling", None) or "",
            },
            "circle_config": {
                "inner_radius": circles.get("inner_radius"),
                "middle_radius": circles.get("middle_radius"),
                "source": "user_calibrated",
            },
        }

    def _build_visual_analysis_basis(
        self,
        circles: dict[str, Any],
        circle_colors: dict[str, Any],
    ) -> dict[str, Any]:
        inner = self._normalize_radius(circles.get("inner_radius", 33))
        middle = self._normalize_radius(circles.get("middle_radius", 66))
        circle_payloads = {
            circle_key: {
                "observation_summary": f"{CIRCLE_KEY_TO_CN[circle_key]}当前为兜底视觉占位，需重新完成图像抽取。",
                "palette": {"dominant_color": "", "main_colors": [], "color_concentration": "unknown", "color_richness": 0},
                "color_stats": {"avg_brightness": 0.0, "avg_saturation": 0.0, "depth_state": "unknown", "distribution": "generated"},
                "shape_features": {"primary_shapes": [], "boundary_style": "unknown", "source": "fallback"},
                "composition": {"density": "generated", "visual_weight": "unknown", "position_bias": circle_key},
                "brushwork": {"stroke_quality": "unknown", "pressure": "unknown", "outline_crossing": "unknown", "source": "fallback"},
                "blocks": [],
            }
            for circle_key in ["inner", "middle", "outer"]
        }
        return {
            "global_visual_summary": "当前使用兜底视觉层，未完成真实画作视觉转述。",
            "llm_color_observation": {
                "summary": "当前为兜底视觉占位，尚未生成正式的圈级客观观察。",
                "per_circle": {},
                "canonical_palette": [],
                "source": "fallback",
            },
            "program_color_measurement": {
                "summary": "当前为兜底视觉占位，没有真实的程序聚类色值。",
                "per_circle": {},
                "source": "fallback",
            },
            "direct_judgment_hits": {
                "catalog_version": "merged-manual6-runtime9.v1",
                "catalog_items": [],
                "hits": [],
            },
            "circle_band_metrics": {
                "inner": {"inner_radius": 0.0, "outer_radius": inner, "band_ratio": inner},
                "middle": {"inner_radius": inner, "outer_radius": middle, "band_ratio": max(middle - inner, 0.0)},
                "outer": {"inner_radius": middle, "outer_radius": 1.0, "band_ratio": max(1.0 - middle, 0.0)},
            },
            "circles": circle_payloads,
            "cross_circle_relations": [],
            "prompt_meta": {
                "model_role": "objective_visual_transcription",
                "prompt_version": "visual-analysis-basis.v1",
                "prompt_text": "请只描述画面中可见事实，不做五行、失衡、主题含义或心理结论。",
                "prompt_constraints": ["只描述可见事实", "不解释意义"],
                "analysis_scope": ["global", "inner", "middle", "outer"],
                "generated_at": "",
                "source": "fallback",
            },
        }

    def _normalize_radius(self, value: Any) -> float:
        try:
            radius = float(value)
        except (TypeError, ValueError):
            radius = 33.0
        if radius > 1:
            radius = radius / 100.0
        return max(0.0, min(radius, 1.0))

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
