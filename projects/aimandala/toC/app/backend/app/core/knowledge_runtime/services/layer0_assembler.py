"""Layer 0 assembler backed by the v2.1 knowledge runtime."""

from __future__ import annotations

from colorsys import rgb_to_hsv
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable

if TYPE_CHECKING:
    from app.core.pipeline.data_models import Layer0Raw

from app.core.knowledge.color_meanings import normalize_color_name
from app.core.llm.runtime import LLMClient, NoopLLMClient
from app.core.pipeline.report_generation_contracts import Layer0BuildBlockedError
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

CIRCLE_POSITION_HINTS = {
    "inner": "中心区域",
    "middle": "中间环带",
    "outer": "外侧环带",
}

VISUAL_ANALYSIS_PROMPT_VERSION = "visual-analysis-basis.v1"
VISUAL_ANALYSIS_PROMPT_TEXT = (
    "请只描述画面中可见事实，不做五行、失衡、主题含义或心理结论。"
    "请分别观察内圈、中圈、外圈，记录颜色、形状、量感、位置、边缘轮廓、笔触和色块关系。"
)

CANONICAL_24_COLOR_SWATCHES = [
    {"label": "白色", "rgb": (248, 246, 240)},
    {"label": "黑色", "rgb": (20, 20, 20)},
    {"label": "金色", "rgb": (212, 180, 92)},
    {"label": "朱红", "rgb": (206, 56, 56)},
    {"label": "大红", "rgb": (231, 40, 45)},
    {"label": "玫红", "rgb": (216, 74, 114)},
    {"label": "粉红", "rgb": (244, 182, 196)},
    {"label": "橙色", "rgb": (235, 142, 58)},
    {"label": "橘黄", "rgb": (238, 176, 52)},
    {"label": "柠檬黄", "rgb": (244, 226, 84)},
    {"label": "中黄", "rgb": (215, 184, 54)},
    {"label": "土黄", "rgb": (173, 141, 73)},
    {"label": "咖色", "rgb": (118, 84, 58)},
    {"label": "草绿", "rgb": (91, 160, 82)},
    {"label": "翠绿", "rgb": (74, 188, 120)},
    {"label": "淡绿", "rgb": (170, 220, 145)},
    {"label": "深绿", "rgb": (46, 101, 56)},
    {"label": "青绿", "rgb": (65, 163, 152)},
    {"label": "天蓝", "rgb": (133, 191, 237)},
    {"label": "湖蓝", "rgb": (81, 143, 205)},
    {"label": "深蓝", "rgb": (41, 87, 150)},
    {"label": "群青", "rgb": (62, 78, 165)},
    {"label": "紫色", "rgb": (136, 88, 173)},
    {"label": "紫罗兰", "rgb": (177, 120, 205)},
]

MERGED_DIRECT_JUDGMENT_CATALOG_VERSION = "merged-manual6-runtime9.v1"
MERGED_DIRECT_JUDGMENT_CATALOG = [
    {
        "judgment_id": "outer_decorative_fragmented",
        "judgment_label": "外圈花边/碎花边",
        "source_family": "merged",
        "merged_from": ["manual_6:外圈花边、星星点点", "runtime_9:外圈颜色五颜六色、零零碎碎、花边"],
        "pattern_summary": "外圈出现碎小装饰、零散点状或花边式分布。",
    },
    {
        "judgment_id": "outer_red_mass",
        "judgment_label": "外圈红色多",
        "source_family": "merged",
        "merged_from": ["manual_6:外圈红色多", "runtime_9:外圈有成片红色"],
        "pattern_summary": "外圈红色或红调色块成片出现，量感明显。",
    },
    {
        "judgment_id": "outer_single_color_large_mass",
        "judgment_label": "外圈颜色单一且面积大",
        "source_family": "merged",
        "merged_from": ["manual_6:外圈颜色单一且面积大"],
        "pattern_summary": "外圈以单一主色为主，且量感明显压过其他颜色。",
    },
    {
        "judgment_id": "gradient_transition",
        "judgment_label": "渐变色",
        "source_family": "merged",
        "merged_from": ["manual_6:渐变色"],
        "pattern_summary": "颜色从内向外或相邻圈之间呈连续过渡。",
    },
    {
        "judgment_id": "heavy_dark_filled",
        "judgment_label": "颜色浓郁深重/整体涂满深色",
        "source_family": "merged",
        "merged_from": ["manual_6:颜色浓郁、深重", "runtime_9:画面整体涂得很满，深色为主"],
        "pattern_summary": "整体颜色偏深且铺陈较满，重色量感明显。",
    },
    {
        "judgment_id": "light_pale_whitish",
        "judgment_label": "颜色浅轻/整体泛白偏淡",
        "source_family": "merged",
        "merged_from": ["manual_6:颜色浅、轻", "runtime_9:整体泛白，颜色偏淡"],
        "pattern_summary": "画面整体偏浅、偏淡，白色或留白感明显。",
    },
    {
        "judgment_id": "blue_green_expression",
        "judgment_label": "蓝色+绿色",
        "source_family": "merged",
        "merged_from": ["runtime_9:明显有蓝色+绿色"],
        "pattern_summary": "画面内能稳定看到蓝色与绿色同时出现。",
    },
    {
        "judgment_id": "inner_outer_same_color",
        "judgment_label": "内圈和外圈颜色一致",
        "source_family": "merged",
        "merged_from": ["runtime_9:内圈和外圈颜色完全一致"],
        "pattern_summary": "内圈和外圈的主色或主色家族保持一致。",
    },
    {
        "judgment_id": "overall_whitespace",
        "judgment_label": "整张留白较多",
        "source_family": "merged",
        "merged_from": ["runtime_9:整张留白较多"],
        "pattern_summary": "圆盘内白色、留白或镂空区域占比明显。",
    },
    {
        "judgment_id": "outer_whitespace_inner_colored",
        "judgment_label": "外圈留白多但内中圈上色较多",
        "source_family": "merged",
        "merged_from": ["runtime_9:外圈留白多，但里圈或中圈涂的颜色3个以上"],
        "pattern_summary": "外圈白色明显，而内圈或中圈仍保持较丰富的上色。",
    },
]


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
        llm_client: LLMClient | None = None,
    ) -> None:
        self.repository = repository
        self.element_service = element_service
        self.circle_service = circle_service
        self.theme_service = theme_service
        self.imbalance_service = imbalance_service
        self.llm_client = llm_client or NoopLLMClient()

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
        interpretation_method_trace = self._build_interpretation_method_trace(
            circles=circles,
            circle_colors=circle_colors,
            element_distribution=element_distribution,
            rule_trace=trace,
            micro_analysis=layer.micro_analysis,
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
        layer.input_package = self._build_input_package(
            record=record,
            image_ref=str(path),
            circles=circles,
        )
        layer.visual_analysis_basis = self._build_visual_analysis_basis(
            image_path=str(path),
            circles=circles,
            circle_colors=circle_colors,
            generated=False,
        )
        if not bool(layer.visual_analysis_basis.get("_layer0_passed", True)):
            failure_reason = str(
                layer.visual_analysis_basis.get("_layer0_failure_reason")
                or "layer0_visual_basis_incomplete"
            ).strip()
            failure_detail = (
                layer.visual_analysis_basis.get("_layer0_failure_detail")
                if isinstance(layer.visual_analysis_basis.get("_layer0_failure_detail"), dict)
                else {}
            )
            layer.layer0_passed = False
            layer.layer0_failure_reason = failure_reason
            layer.layer0_failure_detail = failure_detail
            layer.fidelity_flags = list(
                dict.fromkeys([*layer.fidelity_flags, "layer0_failed"])
            )
            layer.fallback_summary = {
                "used": True,
                "levels": ["layer0_failed"],
                "warnings": [failure_reason],
            }
            layer.visual_facts = {
                "input_package": layer.input_package,
                "visual_analysis_basis": layer.visual_analysis_basis,
                "image_path": str(path),
                "circle_boundaries": circles,
                "dominant_element": ELEMENT_KEY_TO_CN.get(dominant_key, dominant_key),
                "dominant_elements": dominant_elements,
                "circle_colors": circle_colors,
                "circle_colors_detected": sorted(circle_colors.keys()),
                "per_circle_color_analysis": interpretation_method_trace.get(
                    "per_circle_color_analysis",
                    {},
                ),
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
                "interpretation_method_trace": interpretation_method_trace,
                "knowledge_build": {
                    "build_selector": build_info.get("build_selector"),
                    "build_source": build_info.get("build_source"),
                    "build_id": build_info.get("build_id"),
                    "pack_id": build_info.get("pack_id"),
                },
                "layer0_passed": False,
                "layer0_failure_reason": failure_reason,
                "layer0_failure_detail": failure_detail,
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
            raise Layer0BuildBlockedError(
                failure_reason,
                layer_0_raw=layer,
                detail=failure_detail,
            )
        layer.visual_facts = {
            "input_package": layer.input_package,
            "visual_analysis_basis": layer.visual_analysis_basis,
            "image_path": str(path),
            "circle_boundaries": circles,
            "dominant_element": ELEMENT_KEY_TO_CN.get(dominant_key, dominant_key),
            "dominant_elements": dominant_elements,
            "circle_colors": circle_colors,
            "circle_colors_detected": sorted(circle_colors.keys()),
            "per_circle_color_analysis": interpretation_method_trace.get(
                "per_circle_color_analysis",
                {},
            ),
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
            "interpretation_method_trace": interpretation_method_trace,
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
        trace["per_circle_color_analysis"] = interpretation_method_trace.get(
            "per_circle_color_analysis",
            {},
        )
        trace["interpretation_method_trace"] = interpretation_method_trace
        layer.rule_evaluations = {
            "element_states": trace.get("element_states", []),
            "triad_states": trace.get("triad_states", []),
            "imbalance_trace": trace.get("imbalance_trace", {}),
            "primary_candidates": list(primary_candidates),
            "synthetic_signal": synthetic_signal,
            "imbalance_candidates": list(primary_candidates),
            "theme_mappings": primary_theme_mappings,
            "per_circle_color_analysis": interpretation_method_trace.get(
                "per_circle_color_analysis",
                {},
            ),
            "interpretation_method_trace": interpretation_method_trace,
            **trace,
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
        layer.layer0_passed = True
        layer.layer0_failure_reason = ""
        layer.layer0_failure_detail = {}
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
        fallback_method_trace = {
            "direct_judgment": {
                "summary": "视觉抽取失败，当前仅保留可审计的生成兜底判断。",
                "primary_signal": "transition-overload",
                "source": "generated_fallback",
            },
            "per_circle_color_analysis": {
                "inner": {
                    "circle": "inner",
                    "dominant_element": "",
                    "colors": [],
                    "state_basis": {
                        "source": "tutorial_color_area_depth",
                        "area_ratio": 0.1089,
                        "depth_state": "unknown",
                        "fill_state": "generated",
                    },
                },
                "middle": {
                    "circle": "middle",
                    "dominant_element": "",
                    "colors": [],
                    "state_basis": {
                        "source": "tutorial_color_area_depth",
                        "area_ratio": 0.3267,
                        "depth_state": "unknown",
                        "fill_state": "generated",
                    },
                },
                "outer": {
                    "circle": "outer",
                    "dominant_element": "",
                    "colors": [],
                    "state_basis": {
                        "source": "tutorial_color_area_depth",
                        "area_ratio": 0.5644,
                        "depth_state": "unknown",
                        "fill_state": "generated",
                    },
                },
            },
            "shape_analysis": {
                "source": "generated_fallback",
                "overall_features": [],
                "triggered_analyses": [],
            },
            "circle_relation_analysis": {
                "source": "generated_fallback",
                "adjacent_relations": [],
                "wrap_relations": [],
                "synthetic_signal": synthetic_signal,
            },
            "final_algorithm_basis": {
                "ordered_steps": ["直断", "逐圈颜色分析", "形状分析", "圈级生克分析"],
                "selected_primary_candidates": ["transition-overload"],
                "notes": ["vision_extraction_unavailable"],
            },
        }
        layer.input_package = self._build_input_package(
            record=record,
            image_ref=str(getattr(record, "image_local_path", "") or ""),
            circles=circles,
        )
        layer.visual_analysis_basis = self._build_visual_analysis_basis(
            image_path=str(getattr(record, "image_local_path", "") or ""),
            circles=circles,
            circle_colors=layer.circle_colors,
            generated=True,
        )
        layer.visual_facts = {
            "input_package": layer.input_package,
            "visual_analysis_basis": layer.visual_analysis_basis,
            "generated": True,
            "circle_boundaries": circles,
            "circle_colors": layer.circle_colors,
            "per_circle_color_analysis": fallback_method_trace["per_circle_color_analysis"],
            "dominant_elements": {},
            "weighted_element_distribution": {},
            "extracted_color_metrics": {
                "overall_saturation": 0.42,
                "black_ratio": 0.18,
                "red_ratio": 0.11,
            },
            "interpretation_method_trace": fallback_method_trace,
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
            "per_circle_color_analysis": fallback_method_trace["per_circle_color_analysis"],
            "interpretation_method_trace": fallback_method_trace,
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

    def _build_input_package(
        self,
        *,
        record: Any,
        image_ref: str,
        circles: dict[str, Any],
    ) -> dict[str, Any]:
        theme = getattr(record, "theme", None) or "general"
        return {
            "image": {
                "image_ref": self._repo_relative_image_ref(image_ref),
            },
            "topic_input": {
                "topic": theme,
                "topic_label": self._topic_label(theme),
            },
            "user_context": {
                "painting_intention": getattr(record, "painting_intention", None) or "",
                "painting_feeling": getattr(record, "painting_feeling", None) or "",
            },
            "circle_config": {
                "inner_radius": circles.get("inner_radius"),
                "middle_radius": circles.get("middle_radius"),
                "source": self._resolve_circle_config_source(record),
            },
        }

    def _build_visual_analysis_basis(
        self,
        *,
        image_path: str,
        circles: dict[str, Any],
        circle_colors: dict[str, Any],
        generated: bool,
    ) -> dict[str, Any]:
        band_metrics = self._calculate_circle_band_metrics(circles)
        circle_payloads = {
            circle_key: self._build_visual_circle_basis(
                circle_key=circle_key,
                circle_data=circle_colors.get(circle_key, {})
                if isinstance(circle_colors, dict)
                else {},
            )
            for circle_key in ["inner", "middle", "outer"]
        }
        vision_observation = self._build_vision_visual_summary(
            image_path=image_path,
            circles=circle_payloads,
            generated=generated,
        )
        layer0_passed = bool(vision_observation.get("layer0_passed", True))
        failure_reason = str(vision_observation.get("failure_reason") or "").strip()
        failure_detail = (
            vision_observation.get("failure_detail")
            if isinstance(vision_observation.get("failure_detail"), dict)
            else {}
        )
        global_visual_summary = (
            str(vision_observation.get("global_visual_summary") or "").strip()
            if layer0_passed
            else ""
        )
        if not global_visual_summary and generated:
            global_visual_summary = self._build_global_visual_summary(circle_payloads)
        per_circle_summary = (
            vision_observation.get("per_circle_summary", {})
            if isinstance(vision_observation.get("per_circle_summary"), dict)
            else {}
        )
        per_circle_color_labels = (
            vision_observation.get("per_circle_color_labels", {})
            if isinstance(vision_observation.get("per_circle_color_labels"), dict)
            else {}
        )
        per_circle_color_roles = (
            vision_observation.get("per_circle_color_roles", {})
            if isinstance(vision_observation.get("per_circle_color_roles"), dict)
            else {}
        )
        if layer0_passed and per_circle_summary:
            for circle_key in ["inner", "middle", "outer"]:
                summary = str(per_circle_summary.get(circle_key) or "").strip()
                circle_payload = circle_payloads.get(circle_key, {})
                if summary and isinstance(circle_payload, dict):
                    circle_payload["observation_summary"] = summary
        if layer0_passed and per_circle_color_labels:
            for circle_key in ["inner", "middle", "outer"]:
                circle_payload = circle_payloads.get(circle_key, {})
                if not isinstance(circle_payload, dict):
                    continue
                palette = circle_payload.get("palette", {})
                if not isinstance(palette, dict):
                    continue
                labels = self._normalize_llm_color_labels(
                    per_circle_color_labels.get(circle_key)
                )
                if labels:
                    palette["canonical_color_labels"] = labels
                    palette["dominant_color"] = labels[0]
        if layer0_passed and per_circle_color_roles:
            for circle_key in ["inner", "middle", "outer"]:
                circle_payload = circle_payloads.get(circle_key, {})
                if not isinstance(circle_payload, dict):
                    continue
                palette = circle_payload.get("palette", {})
                if not isinstance(palette, dict):
                    continue
                roles = self._normalize_llm_color_roles(
                    per_circle_color_roles.get(circle_key)
                )
                if roles:
                    palette["llm_color_roles"] = roles
                    summary = self._build_observation_summary_from_llm_roles(roles)
                    if summary:
                        circle_payload["observation_summary"] = summary
        program_color_measurement = self._build_program_color_measurement(circle_payloads)
        validation_detail = self._validate_vision_program_consistency(
            circles=circle_payloads,
            per_circle_summary=per_circle_summary,
            per_circle_color_labels=per_circle_color_labels,
        )
        validation_status = (
            "failed"
            if not layer0_passed
            else (
                "warning"
                if not bool(validation_detail.get("circle_color_consistency", True))
                else "passed"
            )
        )
        validation_warning = (
            "program_color_measurement_conflict"
            if validation_status == "warning"
            else ""
        )
        summary_source = (
            "layer0_failed"
            if not layer0_passed
            else str(
                vision_observation.get("source")
                or "deterministic_visual_observation"
            )
        )
        llm_color_observation = self._build_llm_color_observation(
            circle_payloads,
            global_visual_summary=global_visual_summary,
            source=summary_source,
            confidence=vision_observation.get("confidence"),
        )
        if not layer0_passed:
            llm_color_observation = {
                "summary": "",
                "per_circle": {},
                "source": "layer0_failed",
                "canonical_palette": [],
            }
        direct_judgment_hits = (
            self._build_direct_judgment_hits(circle_payloads)
            if layer0_passed
            else {
                "catalog_version": MERGED_DIRECT_JUDGMENT_CATALOG_VERSION,
                "catalog_items": MERGED_DIRECT_JUDGMENT_CATALOG,
                "hits": [],
            }
        )
        payload = {
            "global_visual_summary": global_visual_summary,
            "llm_color_observation": llm_color_observation,
            "program_color_measurement": program_color_measurement,
            "direct_judgment_hits": direct_judgment_hits,
            "circle_band_metrics": band_metrics,
            "circles": circle_payloads,
            "cross_circle_relations": (
                self._build_visual_cross_circle_relations(
                    circle_payloads,
                    generated=generated,
                )
                if layer0_passed
                else []
            ),
            "prompt_meta": {
                "model_role": (
                    "multimodal_visual_observer"
                    if summary_source == "llm_vision_then_program_confirmation"
                    else ("layer0_failed" if summary_source == "layer0_failed" else "objective_visual_transcription")
                ),
                "prompt_version": VISUAL_ANALYSIS_PROMPT_VERSION,
                "prompt_text": VISUAL_ANALYSIS_PROMPT_TEXT,
                "prompt_constraints": [
                    "只描述可见事实",
                    "不解释意义",
                    "不输出五行、失衡或主题结论",
                ],
                "analysis_scope": ["global", "inner", "middle", "outer"],
                "generated_at": "",
                "source": summary_source,
                "confirmation_source": "program_segmented_block_measurement",
                "endpoint_id": self._resolve_llm_endpoint_id(task="vision"),
                "resolved_model": self._resolve_llm_model(task="vision"),
                "vision_unavailable": not layer0_passed,
                "failure_reason": failure_reason,
                "validation_status": validation_status,
                "validation_warning": validation_warning,
                "validation_detail": validation_detail,
            },
        }
        payload["_layer0_passed"] = layer0_passed
        payload["_layer0_failure_reason"] = failure_reason
        payload["_layer0_failure_detail"] = failure_detail
        if not layer0_passed:
            for circle_key in ["inner", "middle", "outer"]:
                circle_payload = payload["circles"].get(circle_key, {})
                if not isinstance(circle_payload, dict):
                    continue
                circle_payload["observation_summary"] = "未观察到足够依据"
                shape_features = circle_payload.get("shape_features", {})
                if isinstance(shape_features, dict):
                    shape_features["boundary_style"] = "未观察到足够依据"
                brushwork = circle_payload.get("brushwork", {})
                if isinstance(brushwork, dict):
                    brushwork["stroke_quality"] = "未观察到足够依据"
        return payload

    def _build_visual_circle_basis(
        self,
        *,
        circle_key: str,
        circle_data: dict[str, Any],
    ) -> dict[str, Any]:
        colors = circle_data.get("colors", []) if isinstance(circle_data, dict) else []
        segmented_blocks = (
            circle_data.get("segmented_blocks", []) if isinstance(circle_data, dict) else []
        )
        color_items = [item for item in colors if isinstance(item, dict)]
        segmented_block_items = [item for item in segmented_blocks if isinstance(item, dict)]
        motif_blocks = (
            self._build_segmented_motif_blocks(
                circle_key=circle_key,
                segmented_blocks=segmented_block_items,
            )
            if segmented_block_items
            else []
        )
        motif_blocks = self._filter_significant_segmented_motif_blocks(motif_blocks)
        top_colors = color_items[:5]
        palette_source = motif_blocks[:5] or top_colors
        avg_brightness, avg_saturation = self._average_color_stats(palette_source)
        if motif_blocks:
            blocks = [
                self._build_visual_segmented_block(
                    circle_key=circle_key,
                    block_data=block,
                    index=index,
                )
                for index, block in enumerate(motif_blocks[:5], start=1)
            ]
        else:
            blocks = [
                self._build_visual_color_block(
                    circle_key=circle_key,
                    color=color,
                    index=index,
                )
                for index, color in enumerate(top_colors[:5], start=1)
            ]
        canonical_color_labels = self._select_canonical_circle_labels(blocks)
        palette = {
            "dominant_color": canonical_color_labels[0] if canonical_color_labels else "",
            "main_colors": [
                {
                    "hex": item.get("hex", ""),
                    "rgb": item.get("rgb", []),
                    "percentage": item.get("percentage", 0.0),
                }
                for item in palette_source
            ],
            "canonical_color_labels": canonical_color_labels,
            "color_concentration": self._classify_color_concentration(palette_source),
            "color_richness": len(palette_source),
        }
        color_stats = {
            "avg_brightness": round(avg_brightness, 2),
            "avg_saturation": round(avg_saturation, 4),
            "depth_state": self._classify_depth_state(
                brightness=avg_brightness,
                saturation=avg_saturation,
            )
            if top_colors
            else "unknown",
            "distribution": self._classify_fill_state(palette_source),
            "program_hex_values": [item.get("hex", "") for item in palette_source if item.get("hex")],
            "program_rgb_values": [item.get("rgb", []) for item in palette_source if item.get("rgb")],
        }
        return {
            "observation_summary": self._build_circle_observation_summary(
                circle_key=circle_key,
                palette=palette,
                color_stats=color_stats,
                blocks=blocks,
            ),
            "palette": palette,
            "color_stats": color_stats,
            "shape_features": {
                "primary_shapes": self._derive_shape_labels(blocks),
                "boundary_style": self._derive_boundary_style(blocks),
                "source": "deterministic_visual_observation",
            },
            "composition": {
                "density": self._fill_state_label(color_stats["distribution"]),
                "visual_weight": self._classify_visual_weight(palette_source),
                "position_bias": CIRCLE_POSITION_HINTS.get(circle_key, circle_key),
                "whitespace_state": self._summarize_whitespace_state(blocks),
            },
            "brushwork": {
                "stroke_quality": self._derive_brushwork_quality(blocks),
                "pressure": self._derive_brushwork_pressure(blocks),
                "outline_crossing": self._derive_outline_crossing(blocks),
                "source": "deterministic_visual_observation",
            },
            "blocks": blocks,
        }

    def _build_visual_segmented_block(
        self,
        *,
        circle_key: str,
        block_data: dict[str, Any],
        index: int,
    ) -> dict[str, Any]:
        rgb = block_data.get("rgb", [])
        white_source = str(block_data.get("white_source") or "none").strip() or "none"
        llm_color_label = (
            "白色"
            if white_source != "none"
            else str(block_data.get("resolved_label") or self._canonical_color_label_from_rgb(rgb)).strip()
        )
        return {
            "llm_color_label": llm_color_label,
            "program_color": {
                "hex": block_data.get("hex", ""),
                "rgb": rgb,
                "percentage": round(self._safe_float(block_data.get("percentage"), 0.0), 2),
            },
            "shape": self._shape_label_for_segmented_block(
                shape_hint=str(block_data.get("shape_hint") or "").strip(),
                llm_color_label=llm_color_label,
                white_source=white_source,
            ),
            "mass_ratio": round(self._safe_float(block_data.get("percentage"), 0.0) / 100.0, 4),
            "position": self._build_segmented_block_position(
                circle_key=circle_key,
                block_data=block_data,
                index=index,
            ),
            "edge_contour": {
                "clarity": self._edge_clarity_from_rgb(rgb, white_source=white_source),
                "description": self._edge_description_from_rgb(rgb, white_source=white_source),
            },
            "brushwork": {
                "quality": self._brushwork_quality_from_rgb(rgb, white_source=white_source),
                "description": self._brushwork_description_from_rgb(rgb, white_source=white_source),
            },
            "adjacent_relations": self._segmented_adjacent_relations_for_block(
                circle_key=circle_key,
                llm_color_label=llm_color_label,
                block_data=block_data,
                index=index,
            ),
            "white_source": white_source,
            "repeat_pattern": block_data.get("repeat_pattern", "unknown"),
            "repeat_count": block_data.get("repeat_count", "unknown"),
        }

    def _build_segmented_motif_blocks(
        self,
        *,
        circle_key: str,
        segmented_blocks: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        grouped: dict[tuple[str, str], dict[str, Any]] = {}
        for block in segmented_blocks:
            rgb = block.get("rgb", [])
            white_source = str(block.get("white_source") or "none").strip() or "none"
            label = "白色" if white_source != "none" else self._canonical_color_label_from_rgb(rgb)
            group_key = (label, white_source)
            current = grouped.get(group_key)
            if current is None:
                current = {
                    **block,
                    "_group_label": label,
                    "_group_white_source": white_source,
                    "_group_mass": 0.0,
                    "_group_count": 0,
                }
                grouped[group_key] = current
            current["_group_mass"] += self._safe_float(block.get("percentage"), 0.0)
            current["_group_count"] += 1
            if self._safe_float(block.get("percentage"), 0.0) > self._safe_float(current.get("percentage"), 0.0):
                preserved_mass = current["_group_mass"]
                preserved_count = current["_group_count"]
                current.clear()
                current.update(block)
                current["_group_label"] = label
                current["_group_white_source"] = white_source
                current["_group_mass"] = preserved_mass
                current["_group_count"] = preserved_count

        motif_blocks: list[dict[str, Any]] = []
        for current in grouped.values():
            motif_blocks.append(
                {
                    **current,
                    "percentage": round(self._safe_float(current.get("_group_mass"), 0.0), 2),
                    "repeat_count": (
                        int(current.get("_group_count", 0))
                        if int(current.get("_group_count", 0)) > 1
                        else "unknown"
                    ),
                    "repeat_pattern": "radial_repetition" if int(current.get("_group_count", 0)) > 1 else "single_motif",
                    "position": {
                        "anchor_band_position": circle_key,
                        "radial_role": "representative_motif",
                        "symmetry_hint": f"{circle_key}_radial_repeat",
                        **(
                            current.get("position", {})
                            if isinstance(current.get("position"), dict)
                            else {}
                        ),
                    },
                    "white_source": current.get("_group_white_source", current.get("white_source", "none")),
                    "resolved_label": current.get("_group_label", ""),
                }
            )
        motif_blocks.sort(
            key=lambda item: float(item.get("percentage", 0.0) or 0.0),
            reverse=True,
        )
        return motif_blocks[:5]

    def _filter_significant_segmented_motif_blocks(
        self,
        motif_blocks: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not motif_blocks:
            return []

        white_blocks = [
            block
            for block in motif_blocks
            if isinstance(block, dict) and str(block.get("white_source") or "none").strip() != "none"
        ]
        non_white_blocks = [
            block
            for block in motif_blocks
            if isinstance(block, dict) and str(block.get("white_source") or "none").strip() == "none"
        ]
        non_white_blocks.sort(
            key=lambda item: float(item.get("percentage", 0.0) or 0.0),
            reverse=True,
        )

        filtered: list[dict[str, Any]] = []
        if white_blocks:
            white_blocks.sort(
                key=lambda item: float(item.get("percentage", 0.0) or 0.0),
                reverse=True,
            )
            filtered.append(white_blocks[0])

        if not non_white_blocks:
            return filtered[:5]

        dominant_ratio = float(non_white_blocks[0].get("percentage", 0.0) or 0.0) / 100.0
        secondary_threshold = max(0.01, dominant_ratio * 0.25)

        for index, block in enumerate(non_white_blocks):
            block_ratio = float(block.get("percentage", 0.0) or 0.0) / 100.0
            if index == 0 or block_ratio >= secondary_threshold:
                filtered.append(block)

        filtered.sort(
            key=lambda item: float(item.get("percentage", 0.0) or 0.0),
            reverse=True,
        )
        return filtered[:5]

    def _build_visual_color_block(
        self,
        *,
        circle_key: str,
        color: dict[str, Any],
        index: int,
    ) -> dict[str, Any]:
        percentage = self._safe_float(color.get("percentage"), 0.0)
        rgb = color.get("rgb", [])
        llm_color_label = self._canonical_color_label_from_rgb(rgb)
        white_source = self._infer_white_source(llm_color_label=llm_color_label, rgb=rgb)
        shape_label = self._shape_label_for_block(llm_color_label=llm_color_label, white_source=white_source)
        return {
            "llm_color_label": llm_color_label,
            "program_color": {
                "hex": color.get("hex", ""),
                "rgb": rgb,
                "percentage": round(percentage, 2),
            },
            "shape": shape_label,
            "mass_ratio": round(percentage / 100.0, 4),
            "position": {
                "region_label": CIRCLE_POSITION_HINTS.get(circle_key, circle_key),
                "coordinate_summary": {
                    "circle": circle_key,
                    "cluster_rank": index,
                },
            },
            "edge_contour": {
                "clarity": self._edge_clarity_from_rgb(rgb, white_source=white_source),
                "description": self._edge_description_from_rgb(rgb, white_source=white_source),
            },
            "brushwork": {
                "quality": self._brushwork_quality_from_rgb(rgb, white_source=white_source),
                "description": self._brushwork_description_from_rgb(rgb, white_source=white_source),
            },
            "adjacent_relations": self._adjacent_relations_for_block(
                circle_key=circle_key,
                llm_color_label=llm_color_label,
                index=index,
            ),
            "white_source": white_source,
            "repeat_pattern": "unknown",
            "repeat_count": "unknown",
        }

    def _build_global_visual_summary(
        self,
        circles: dict[str, dict[str, Any]],
    ) -> str:
        parts = []
        for circle_key in ["inner", "middle", "outer"]:
            circle = circles.get(circle_key, {})
            summary = str(circle.get("observation_summary") or "").strip()
            if summary:
                parts.append(summary)
        return "；".join(parts)

    def _build_vision_visual_summary(
        self,
        *,
        image_path: str,
        circles: dict[str, dict[str, Any]],
        generated: bool,
    ) -> dict[str, Any]:
        if generated or not image_path:
            return {
                "source": "layer0_failed",
                "layer0_passed": False,
                "failure_reason": "layer0_visual_basis_incomplete",
                "failure_detail": {"stage": "vision", "mode": "generated"},
            }
        if type(self.llm_client) is NoopLLMClient:
            deterministic_summary = self._build_global_visual_summary(circles)
            per_circle_summary = {
                circle_key: str(circle.get("observation_summary") or "").strip()
                for circle_key, circle in circles.items()
                if isinstance(circle, dict)
            }
            if deterministic_summary and all(
                per_circle_summary.get(circle_key)
                for circle_key in ["inner", "middle", "outer"]
            ):
                return {
                    "source": "deterministic_visual_observation",
                    "layer0_passed": True,
                    "global_visual_summary": deterministic_summary,
                    "per_circle_summary": per_circle_summary,
                    "per_circle_color_labels": {
                        circle_key: list(
                            (
                                circle.get("palette", {}) or {}
                            ).get("canonical_color_labels", [])
                        )
                        for circle_key, circle in circles.items()
                        if isinstance(circle, dict)
                    },
                    "confidence": 0.0,
                }
            return {
                "source": "layer0_failed",
                "layer0_passed": False,
                "failure_reason": "layer0_vision_unconfigured",
                "failure_detail": {"stage": "vision"},
            }
        payload = self._request_visual_summary_from_llm(
            image_path=image_path,
            circles=circles,
        )
        if not isinstance(payload, dict):
            return {
                "source": "layer0_failed",
                "layer0_passed": False,
                "failure_reason": "layer0_vision_request_failed",
                "failure_detail": {"stage": "vision"},
            }
        summary = str(payload.get("global_visual_summary") or "").strip()
        if not summary:
            return {
                "source": "layer0_failed",
                "layer0_passed": False,
                "failure_reason": "layer0_vision_invalid_payload",
                "failure_detail": {"stage": "vision", "missing": ["global_visual_summary"]},
            }
        per_circle_summary = payload.get("per_circle_summary")
        per_circle_roles = payload.get("per_circle_color_roles")
        has_per_circle_summary = isinstance(per_circle_summary, dict) and all(
            str(per_circle_summary.get(circle_key) or "").strip()
            for circle_key in ["inner", "middle", "outer"]
        )
        has_per_circle_roles = isinstance(per_circle_roles, dict) and all(
            isinstance(per_circle_roles.get(circle_key), dict)
            for circle_key in ["inner", "middle", "outer"]
        )
        if not has_per_circle_summary and not has_per_circle_roles:
            return {
                "source": "layer0_failed",
                "layer0_passed": False,
                "failure_reason": "layer0_visual_basis_incomplete",
                "failure_detail": {
                    "stage": "vision",
                    "missing": ["per_circle_summary_or_roles"],
                },
            }
        return {
            "global_visual_summary": summary,
            "source": "llm_vision_then_program_confirmation",
            "confidence": self._safe_float(payload.get("confidence"), 0.0),
            "per_circle_summary": per_circle_summary if isinstance(per_circle_summary, dict) else {},
            "per_circle_color_labels": (
                payload.get("per_circle_color_labels", {})
                if isinstance(payload.get("per_circle_color_labels"), dict)
                else {}
            ),
            "per_circle_color_roles": (
                payload.get("per_circle_color_roles", {})
                if isinstance(payload.get("per_circle_color_roles"), dict)
                else {}
            ),
            "layer0_passed": True,
        }

    def _request_visual_summary_from_llm(
        self,
        *,
        image_path: str,
        circles: dict[str, dict[str, Any]],
    ) -> dict[str, Any] | None:
        schema = {
            "type": "object",
            "required": ["global_visual_summary"],
            "properties": {
                "global_visual_summary": {"type": "string"},
                "per_circle_summary": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "string"},
                        "middle": {"type": "string"},
                        "outer": {"type": "string"},
                    },
                },
                "per_circle_color_labels": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "array", "items": {"type": "string"}},
                        "middle": {"type": "array", "items": {"type": "string"}},
                        "outer": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "per_circle_color_roles": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "object"},
                        "middle": {"type": "object"},
                        "outer": {"type": "object"},
                    },
                },
                "confidence": {"type": "number"},
            },
        }
        prompt = (
            "只描述这张曼陀罗的可见事实，不解释意义。\n"
            "请分别写内圈、中圈、外圈各一句。\n"
            "每句只写主要颜色、白色/留白、最显著形状。\n"
            "请同时给出每圈的颜色标签列表 per_circle_color_labels。\n"
            "并给出 per_circle_color_roles，其中每圈都要包含：primary_colors（主色），accent_colors（点缀色），white_presence（none/visible/prominent），shape_color_pairs（颜色与形状对应列表）。\n"
            "shape_color_pairs 中每项包含：colors（该形状对应颜色列表），shape（形状），color_pattern（纯色/渐变色）。\n"
            "不要把黑色线框单独当作轮廓色；如果看到淡红或红到淡红的渐变，优先归为红色，不要轻易写成粉色。\n"
            "如果更接近莲花花瓣，就直接写莲花花瓣。\n"
            "黄色花朵如果整体纯黄色、靠近花蕊有留白，要明确写出来。\n"
            "请尝试描述色块之间的相对位置，并写进 relative_position，例如红色花瓣形边框里包着一朵黄色花朵、围绕中心向外展开、位于中圈主体区域。\n"
            "颜色标签只允许使用中文常见颜色词，如红色、粉色、黄色、绿色、蓝色、紫色、白色、黑色、金色、咖色。\n"
            "不要写 #hex，不要写五行，不要写主题，不要写失衡。"
        )
        try:
            payload = self.llm_client.generate_structured(
                task="vision",
                prompt=prompt,
                schema=schema,
                image_path=image_path,
            )
        except Exception:
            return None
        return payload if isinstance(payload, dict) else None

    def _resolve_llm_model(self, *, task: str) -> str:
        config = getattr(self.llm_client, "config", None)
        if config is None or not hasattr(config, "resolve_task_config"):
            return ""
        try:
            task_config = config.resolve_task_config(task)
        except Exception:
            return ""
        return str(getattr(task_config, "model", "") or "").strip()

    def _resolve_llm_endpoint_id(self, *, task: str) -> str:
        model = self._resolve_llm_model(task=task)
        return model if model.startswith("ep-") else ""

    def _build_visual_cross_circle_relations(
        self,
        circles: dict[str, dict[str, Any]],
        *,
        generated: bool,
    ) -> list[dict[str, Any]]:
        if generated:
            return []
        relations: list[dict[str, Any]] = []
        keys = ["inner", "middle", "outer"]
        for left, right in zip(keys, keys[1:]):
            left_color = self._dominant_visual_color(circles.get(left, {}))
            right_color = self._dominant_visual_color(circles.get(right, {}))
            relation_type = "same_color_continuity" if left_color and left_color == right_color else "adjacent_band_transition"
            relations.append(
                {
                    "from_circle": left,
                    "to_circle": right,
                    "relation_type": relation_type,
                    "description": (
                        f"{CIRCLE_KEY_TO_CN[left]}与{CIRCLE_KEY_TO_CN[right]}"
                        f"在主色上{'延续' if relation_type == 'same_color_continuity' else '相邻过渡'}。"
                    ),
                }
            )
        return relations

    def _calculate_circle_band_metrics(self, circles: dict[str, Any]) -> dict[str, Any]:
        inner_ratio = self._normalize_radius(circles.get("inner_radius", 33))
        middle_ratio = self._normalize_radius(circles.get("middle_radius", 66))
        return {
            "inner": {
                "inner_radius": 0.0,
                "outer_radius": round(inner_ratio, 4),
                "band_ratio": round(max(inner_ratio, 0.0), 4),
            },
            "middle": {
                "inner_radius": round(inner_ratio, 4),
                "outer_radius": round(middle_ratio, 4),
                "band_ratio": round(max(middle_ratio - inner_ratio, 0.0), 4),
            },
            "outer": {
                "inner_radius": round(middle_ratio, 4),
                "outer_radius": 1.0,
                "band_ratio": round(max(1.0 - middle_ratio, 0.0), 4),
            },
        }

    def _build_circle_observation_summary(
        self,
        *,
        circle_key: str,
        palette: dict[str, Any],
        color_stats: dict[str, Any],
        blocks: list[dict[str, Any]],
    ) -> str:
        label = CIRCLE_KEY_TO_CN.get(circle_key, circle_key)
        labels = list(palette.get("canonical_color_labels", []) or [])
        main_colors = "、".join(labels[:3]) if labels else "颜色不明显"
        depth = self._depth_state_label(color_stats.get("depth_state"))
        density = self._fill_state_label(color_stats.get("distribution"))
        whitespace = self._summarize_whitespace_state(blocks)
        shape_phrase = self._derive_shape_phrase(blocks)
        return f"{label}以{main_colors}为主，整体{depth}，{density}，{whitespace}，可见{shape_phrase}。"

    def _average_color_stats(self, colors: list[dict[str, Any]]) -> tuple[float, float]:
        brightness_values = []
        saturation_values = []
        for color in colors:
            rgb = color.get("rgb") or []
            if not isinstance(rgb, list) or len(rgb) != 3:
                continue
            r, g, b = [float(value) for value in rgb]
            brightness_values.append(0.299 * r + 0.587 * g + 0.114 * b)
            max_c = max(r, g, b)
            min_c = min(r, g, b)
            saturation_values.append(0.0 if max_c == 0 else (max_c - min_c) / max_c)
        avg_brightness = sum(brightness_values) / len(brightness_values) if brightness_values else 0.0
        avg_saturation = sum(saturation_values) / len(saturation_values) if saturation_values else 0.0
        return avg_brightness, avg_saturation

    def _classify_color_concentration(self, colors: list[dict[str, Any]]) -> str:
        if not colors:
            return "unknown"
        top = max((self._safe_float(item.get("percentage"), 0.0) for item in colors), default=0.0)
        if top >= 60:
            return "concentrated"
        if top <= 25:
            return "dispersed"
        return "mixed"

    def _classify_visual_weight(self, colors: list[dict[str, Any]]) -> str:
        total = sum(self._safe_float(item.get("percentage"), 0.0) for item in colors)
        if total >= 80:
            return "heavy"
        if total <= 35:
            return "light"
        return "medium"

    def _depth_state_label(self, value: Any) -> str:
        return {
            "deep": "颜色偏深",
            "light": "颜色偏浅",
            "middle": "深浅居中",
            "unknown": "深浅未知",
        }.get(str(value or "").strip(), "深浅未知")

    def _fill_state_label(self, value: Any) -> str:
        return {
            "dense": "填充较密",
            "filled": "填充稳定",
            "mixed": "填充较混合",
            "sparse": "填充较少",
        }.get(str(value or "").strip(), "填充状态未明")

    def _dominant_visual_color(self, circle: dict[str, Any]) -> str:
        palette = circle.get("palette", {}) if isinstance(circle, dict) else {}
        return str(palette.get("dominant_color") or "").strip()

    def _build_llm_color_observation(
        self,
        circles: dict[str, dict[str, Any]],
        *,
        global_visual_summary: str,
        source: str,
        confidence: Any = None,
    ) -> dict[str, Any]:
        per_circle = {
            circle_key: {
                "summary": str(tools.get("observation_summary") or "").strip(),
                "canonical_color_labels": list(
                    to_palette.get("canonical_color_labels", [])
                    if isinstance((to_palette := tools.get("palette", {})), dict)
                    else []
                ),
            }
            for circle_key, tools in circles.items()
            if isinstance(tools, dict)
        }
        result = {
            "summary": global_visual_summary,
            "per_circle": per_circle,
            "source": source,
            "canonical_palette": list(
                dict.fromkeys(
                    label
                    for circle_key in ["inner", "middle", "outer"]
                    for label in (
                        circles.get(circle_key, {})
                        .get("palette", {})
                        .get("canonical_color_labels", [])
                        if isinstance(circles.get(circle_key, {}), dict)
                        else []
                    )
                )
            ),
        }
        if confidence is not None:
            result["confidence"] = self._safe_float(confidence, 0.0)
        return result

    def _normalize_llm_color_labels(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        labels: list[str] = []
        for item in value:
            normalized = normalize_color_name(str(item or "").strip())
            if normalized and normalized not in labels:
                labels.append(normalized)
        return labels[:5]

    def _normalize_llm_color_roles(self, value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            return {}
        shape_color_pairs: list[dict[str, Any]] = []
        for item in value.get("shape_color_pairs", []) or []:
            if not isinstance(item, dict):
                continue
            colors = self._normalize_llm_color_labels(item.get("colors"))
            shape = str(item.get("shape") or "").strip()
            color_pattern = str(item.get("color_pattern") or "").strip()
            relative_position = str(item.get("relative_position") or "").strip()
            if not colors or not shape:
                continue
            shape_color_pairs.append(
                {
                    "colors": colors,
                    "shape": shape,
                    "color_pattern": color_pattern or "纯色",
                    "relative_position": relative_position,
                }
            )
        return {
            "primary_colors": self._normalize_llm_color_labels(value.get("primary_colors")),
            "accent_colors": self._normalize_llm_color_labels(value.get("accent_colors")),
            "white_presence": str(value.get("white_presence") or "").strip(),
            "shape_color_pairs": shape_color_pairs,
        }

    def _build_observation_summary_from_llm_roles(self, roles: dict[str, Any]) -> str:
        if not isinstance(roles, dict):
            return ""
        parts: list[str] = []
        primary = list(roles.get("primary_colors", []) or [])
        accent = list(roles.get("accent_colors", []) or [])
        white_presence = str(roles.get("white_presence") or "").strip()
        shape_color_pairs = list(roles.get("shape_color_pairs", []) or [])
        if primary:
            parts.append(f"主色为{'、'.join(primary)}")
        if accent:
            parts.append(f"点缀色为{'、'.join(accent)}")
        if white_presence == "visible":
            parts.append("能看到白色留白")
        elif white_presence == "prominent":
            parts.append("白色留白很明显")
        if shape_color_pairs:
            rendered_pairs = []
            for item in shape_color_pairs:
                if not isinstance(item, dict):
                    continue
                colors = list(item.get("colors", []) or [])
                shape = str(item.get("shape") or "").strip()
                color_pattern = str(item.get("color_pattern") or "").strip() or "纯色"
                relative_position = str(item.get("relative_position") or "").strip()
                if colors and shape:
                    rendered = f"{'、'.join(colors)}{shape}（{color_pattern}"
                    if relative_position:
                        rendered += f"，{relative_position}"
                    rendered += "）"
                    rendered_pairs.append(rendered)
            if rendered_pairs:
                parts.append(f"显著图形包括{'、'.join(rendered_pairs)}")
        return "，".join(parts) + "。" if parts else ""

    def _build_program_color_measurement(
        self,
        circles: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        per_circle: dict[str, Any] = {}
        total_blocks = 0
        for circle_key in ["inner", "middle", "outer"]:
            circle = circles.get(circle_key, {})
            blocks = list(circle.get("blocks", []) or []) if isinstance(circle, dict) else []
            total_blocks += len(blocks)
            per_circle[circle_key] = {
                "dominant_hex": self._first_non_empty(
                    block.get("program_color", {}).get("hex", "")
                    for block in blocks
                    if isinstance(block, dict)
                ),
                "blocks": [
                    {
                        "hex": block.get("program_color", {}).get("hex", ""),
                        "rgb": block.get("program_color", {}).get("rgb", []),
                        "mass_ratio": block.get("mass_ratio", 0.0),
                        "position": block.get("position", {}),
                    }
                    for block in blocks
                    if isinstance(block, dict)
                ],
            }
        return {
            "summary": f"程序分圈聚类共记录 {total_blocks} 个显著色块，可回看每块的 hex、rgb、占比与位置。",
            "per_circle": per_circle,
            "source": "program_segmented_block_measurement",
        }

    def _validate_vision_program_consistency(
        self,
        *,
        circles: dict[str, dict[str, Any]],
        per_circle_summary: dict[str, Any],
        per_circle_color_labels: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        mismatched_circles: list[str] = []
        compared_circles: dict[str, Any] = {}
        for circle_key in ["inner", "middle", "outer"]:
            summary = str(per_circle_summary.get(circle_key) or "").strip()
            circle = circles.get(circle_key, {}) if isinstance(circles.get(circle_key), dict) else {}
            program_labels = self._extract_program_color_labels_from_circle(circle)
            observed_labels = self._normalize_llm_color_labels(
                (per_circle_color_labels or {}).get(circle_key)
            ) or self._extract_color_labels_from_summary(summary)
            observed_families = {
                self._normalize_visual_color_family(label)
                for label in observed_labels
                if self._normalize_visual_color_family(label)
            }
            program_families = {
                self._normalize_visual_color_family(label)
                for label in program_labels
                if self._normalize_visual_color_family(label)
            }
            matched = not observed_families or observed_families.issubset(program_families)
            compared_circles[circle_key] = {
                "observed_labels": sorted(observed_labels),
                "program_labels": program_labels,
                "observed_families": sorted(observed_families),
                "program_families": sorted(program_families),
                "matched": matched,
            }
            if not matched:
                mismatched_circles.append(circle_key)
        return {
            "circle_color_consistency": not mismatched_circles,
            "mismatched_circles": mismatched_circles,
            "compared_circles": compared_circles,
        }

    def _extract_program_color_labels_from_circle(
        self,
        circle: dict[str, Any],
    ) -> list[str]:
        if not isinstance(circle, dict):
            return []
        blocks = list(circle.get("blocks", []) or [])
        labels: list[str] = []
        for block in blocks:
            if not isinstance(block, dict):
                continue
            label = normalize_color_name(str(block.get("llm_color_label") or "").strip())
            if label and label not in labels:
                labels.append(label)
        return labels

    def _extract_color_labels_from_summary(self, summary: str) -> list[str]:
        text = str(summary or "").strip()
        if not text:
            return []
        ordered_candidates = [
            "紫罗兰",
            "柠檬黄",
            "橘黄",
            "朱红",
            "大红",
            "玫红",
            "粉红",
            "橙色",
            "中黄",
            "土黄",
            "咖色",
            "草绿",
            "翠绿",
            "淡绿",
            "深绿",
            "青绿",
            "天蓝",
            "湖蓝",
            "深蓝",
            "群青",
            "紫色",
            "金色",
            "白色",
            "黑色",
            "蓝色",
            "绿色",
            "粉色",
            "黄色",
            "红色",
        ]
        labels: list[str] = []
        for candidate in ordered_candidates:
            if candidate in text:
                normalized = normalize_color_name(candidate)
                if normalized not in labels:
                    labels.append(normalized)
        return labels

    def _normalize_visual_color_family(self, label: str) -> str:
        normalized = normalize_color_name(str(label or "").strip())
        family_mapping = {
            "白色": "white",
            "黑色": "black",
            "金色": "gold",
            "红色": "red",
            "玫瑰红": "red",
            "粉色": "pink",
            "橙色": "orange",
            "黄色": "yellow",
            "咖色": "brown",
            "绿色": "green",
            "蓝色": "blue",
            "紫色": "purple",
        }
        return family_mapping.get(normalized, "")

    def _build_direct_judgment_hits(
        self,
        circles: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        hits: list[dict[str, Any]] = []
        for item in MERGED_DIRECT_JUDGMENT_CATALOG:
            hit = self._evaluate_direct_judgment(item["judgment_id"], circles)
            hits.append(
                {
                    "judgment_id": item["judgment_id"],
                    "judgment_label": item["judgment_label"],
                    **hit,
                    "source": "multimodal_observation",
                }
            )
        return {
            "catalog_version": MERGED_DIRECT_JUDGMENT_CATALOG_VERSION,
            "catalog_items": MERGED_DIRECT_JUDGMENT_CATALOG,
            "hits": hits,
        }

    def _evaluate_direct_judgment(
        self,
        judgment_id: str,
        circles: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        inner = circles.get("inner", {}) if isinstance(circles.get("inner"), dict) else {}
        middle = circles.get("middle", {}) if isinstance(circles.get("middle"), dict) else {}
        outer = circles.get("outer", {}) if isinstance(circles.get("outer"), dict) else {}
        inner_labels = list(inner.get("palette", {}).get("canonical_color_labels", []) or [])
        middle_labels = list(middle.get("palette", {}).get("canonical_color_labels", []) or [])
        outer_labels = list(outer.get("palette", {}).get("canonical_color_labels", []) or [])
        all_labels = inner_labels + middle_labels + outer_labels
        whitespace_score = self._circle_whitespace_score(outer) + self._circle_whitespace_score(middle) + self._circle_whitespace_score(inner)
        heavy_score = sum(self._block_mass_sum(circle) for circle in [inner, middle, outer])
        deep_count = sum(
            1
            for circle in [inner, middle, outer]
            if str(circle.get("color_stats", {}).get("depth_state") or "") == "deep"
        )
        if judgment_id == "outer_decorative_fragmented":
            matched = len(outer.get("blocks", [])) >= 4 and len(outer_labels) >= 2
            return {
                "matched": matched,
                "confidence": 0.76 if matched else 0.22,
                "evidence_excerpt": "外圈显著块数量较多，颜色分布零散。" if matched else "外圈主色较集中，没有明显碎花边特征。",
                "evidence_type": "outer_block_fragmentation",
            }
        if judgment_id == "outer_red_mass":
            matched = any(label in {"朱红", "大红", "玫红"} for label in outer_labels) and self._top_block_mass_ratio(outer) >= 0.25
            return {
                "matched": matched,
                "confidence": 0.82 if matched else 0.18,
                "evidence_excerpt": "外圈可见成片红调色块。" if matched else "外圈没有形成明显红色成片区域。",
                "evidence_type": "outer_red_mass",
            }
        if judgment_id == "outer_single_color_large_mass":
            matched = len(outer_labels) == 1 and self._top_block_mass_ratio(outer) >= 0.45
            return {
                "matched": matched,
                "confidence": 0.84 if matched else 0.2,
                "evidence_excerpt": "外圈主要由单一颜色占据较大比例。" if matched else "外圈颜色并非单一大面积主导。",
                "evidence_type": "outer_single_color_large_mass",
            }
        if judgment_id == "gradient_transition":
            matched = self._has_gradient_transition(circles)
            return {
                "matched": matched,
                "confidence": 0.73 if matched else 0.24,
                "evidence_excerpt": "三圈主色存在连续过渡感。" if matched else "相邻圈之间主色切换较明显，没有稳定渐变。",
                "evidence_type": "gradient_transition",
            }
        if judgment_id == "heavy_dark_filled":
            matched = deep_count >= 2 and heavy_score >= 0.75
            return {
                "matched": matched,
                "confidence": 0.8 if matched else 0.26,
                "evidence_excerpt": "多圈颜色偏深且上色量感较满。" if matched else "整体深色与填充感未形成重压式特征。",
                "evidence_type": "heavy_dark_filled",
            }
        if judgment_id == "light_pale_whitish":
            matched = whitespace_score >= 0.45 or all(label in {"白色", "粉红", "淡绿", "天蓝", "金色"} for label in all_labels[:4] if label)
            return {
                "matched": matched,
                "confidence": 0.81 if matched else 0.25,
                "evidence_excerpt": "画面内白色、浅色或留白感明显。" if matched else "画面整体并不偏浅或泛白。",
                "evidence_type": "light_pale_whitish",
            }
        if judgment_id == "blue_green_expression":
            matched = any(label in {"天蓝", "湖蓝", "深蓝", "群青"} for label in all_labels) and any(label in {"草绿", "翠绿", "淡绿", "深绿", "青绿"} for label in all_labels)
            return {
                "matched": matched,
                "confidence": 0.79 if matched else 0.19,
                "evidence_excerpt": "画面内能同时看到蓝调与绿调色块。" if matched else "蓝绿组合不明显。",
                "evidence_type": "blue_green_expression",
            }
        if judgment_id == "inner_outer_same_color":
            matched = bool(inner_labels and outer_labels and inner_labels[0] == outer_labels[0])
            return {
                "matched": matched,
                "confidence": 0.78 if matched else 0.21,
                "evidence_excerpt": "内圈与外圈的主色家族一致。" if matched else "内外圈主色并不一致。",
                "evidence_type": "inner_outer_same_color",
            }
        if judgment_id == "overall_whitespace":
            matched = whitespace_score >= 0.35
            return {
                "matched": matched,
                "confidence": 0.83 if matched else 0.22,
                "evidence_excerpt": "圆盘内存在连续白色留白或镂空区域。" if matched else "白色留白未达到明显主导程度。",
                "evidence_type": "overall_whitespace",
            }
        matched = self._circle_whitespace_score(outer) >= 0.2 and (len(inner_labels) >= 2 or len(middle_labels) >= 2)
        return {
            "matched": matched,
            "confidence": 0.77 if matched else 0.2,
            "evidence_excerpt": "外圈白色较多，但内圈或中圈仍保持较丰富上色。" if matched else "外圈留白与内中圈上色丰富度未同时满足。",
            "evidence_type": "outer_whitespace_inner_colored",
        }

    def _canonical_color_label_from_rgb(self, rgb: Any) -> str:
        if not isinstance(rgb, list) or len(rgb) != 3:
            return "白色"
        try:
            r, g, b = [int(value) for value in rgb]
        except (TypeError, ValueError):
            return "白色"
        best = min(
            CANONICAL_24_COLOR_SWATCHES,
            key=lambda item: self._rgb_distance((r, g, b), item["rgb"]),
        )
        return normalize_color_name(str(best["label"]))

    def _rgb_distance(self, left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
        return sum((float(a) - float(b)) ** 2 for a, b in zip(left, right))

    def _infer_white_source(self, *, llm_color_label: str, rgb: Any) -> str:
        if llm_color_label != "白色":
            return "none"
        if not isinstance(rgb, list) or len(rgb) != 3:
            return "paper_blank"
        try:
            r, g, b = [int(value) for value in rgb]
        except (TypeError, ValueError):
            return "paper_blank"
        brightness = 0.299 * r + 0.587 * g + 0.114 * b
        spread = max(r, g, b) - min(r, g, b)
        if brightness >= 248 and spread <= 5:
            return "paper_blank"
        if brightness >= 240 and spread <= 12:
            return "hollow_gap"
        return "painted_white"

    def _shape_label_for_block(self, *, llm_color_label: str, white_source: str) -> dict[str, Any]:
        if white_source == "paper_blank":
            return {"label": "留白块", "source": "deterministic_visual_observation"}
        if white_source == "hollow_gap":
            return {"label": "镂空块", "source": "deterministic_visual_observation"}
        if llm_color_label in {"白色", "黑色"}:
            return {"label": "不规则色块", "source": "deterministic_visual_observation"}
        return {"label": "色块", "source": "deterministic_visual_observation"}

    def _shape_label_for_segmented_block(
        self,
        *,
        shape_hint: str,
        llm_color_label: str,
        white_source: str,
    ) -> dict[str, Any]:
        if white_source == "paper_blank":
            label = "留白块"
        elif white_source == "hollow_gap":
            label = "镂空"
        elif white_source == "painted_white":
            label = "团块"
        else:
            label = {
                "圆斑": "圆斑",
                "花瓣状": "花瓣状",
                "条带": "条带",
                "团块": "团块",
                "镂空": "镂空",
                "不规则块": "不规则块",
                "未能稳定判断": "未能稳定判断",
            }.get(shape_hint, "未能稳定判断")
            if label == "未能稳定判断" and llm_color_label == "白色":
                label = "不规则块"
        return {
            "label": label,
            "source": "segmented_program_observation",
        }

    def _edge_clarity_from_rgb(self, rgb: Any, *, white_source: str) -> str:
        if white_source in {"paper_blank", "hollow_gap"}:
            return "soft"
        saturation = self._rgb_saturation(rgb)
        if saturation >= 0.5:
            return "clear"
        if saturation <= 0.12:
            return "soft"
        return "medium"

    def _edge_description_from_rgb(self, rgb: Any, *, white_source: str) -> str:
        if white_source == "paper_blank":
            return "边缘较柔和，像纸面留出的白色空位。"
        if white_source == "hollow_gap":
            return "边缘较轻，像被颜色包围出的白色空隙。"
        saturation = self._rgb_saturation(rgb)
        if saturation >= 0.5:
            return "轮廓感较清楚，边缘比较利落。"
        if saturation <= 0.12:
            return "边缘过渡较轻，轮廓感不强。"
        return "边缘和轮廓感中等，可见但不尖锐。"

    def _brushwork_quality_from_rgb(self, rgb: Any, *, white_source: str) -> str:
        if white_source == "paper_blank":
            return "blank"
        saturation = self._rgb_saturation(rgb)
        if saturation >= 0.55:
            return "firm"
        if saturation <= 0.12:
            return "light"
        return "even"

    def _brushwork_description_from_rgb(self, rgb: Any, *, white_source: str) -> str:
        if white_source == "paper_blank":
            return "更像纸面本身的空白，没有明显笔触。"
        if white_source == "hollow_gap":
            return "更像颜色之间留出的白色缝隙，笔触感较弱。"
        saturation = self._rgb_saturation(rgb)
        if saturation >= 0.55:
            return "颜色压得较实，笔触力量感更强。"
        if saturation <= 0.12:
            return "颜色较轻，笔触存在感偏弱。"
        return "颜色铺陈较均匀，笔触观感相对稳定。"

    def _adjacent_relations_for_block(
        self,
        *,
        circle_key: str,
        llm_color_label: str,
        index: int,
    ) -> list[str]:
        relations = [f"位于{CIRCLE_KEY_TO_CN.get(circle_key, circle_key)}第{index}显著块"]
        if llm_color_label == "白色":
            relations.append("与相邻色块形成留白间隔")
        return relations

    def _segmented_adjacent_relations_for_block(
        self,
        *,
        circle_key: str,
        llm_color_label: str,
        block_data: dict[str, Any],
        index: int,
    ) -> list[str]:
        relations = [f"位于{CIRCLE_KEY_TO_CN.get(circle_key, circle_key)}代表性母题块#{index}"]
        repeat_pattern = str(block_data.get("repeat_pattern") or "").strip()
        if repeat_pattern == "radial_repetition":
            relations.append("沿圆周方向重复出现")
        if llm_color_label == "白色":
            relations.append("与相邻色块形成白色留白或镂空间隔")
        return relations

    def _build_segmented_block_position(
        self,
        *,
        circle_key: str,
        block_data: dict[str, Any],
        index: int,
    ) -> dict[str, Any]:
        position = (
            block_data.get("position", {}) if isinstance(block_data.get("position"), dict) else {}
        )
        return {
            "region_label": CIRCLE_POSITION_HINTS.get(circle_key, circle_key),
            "anchor_band_position": position.get("anchor_band_position", circle_key),
            "radial_role": position.get("radial_role", "representative_motif"),
            "symmetry_hint": position.get("symmetry_hint", f"{circle_key}_radial_repeat"),
        }

    def _rgb_saturation(self, rgb: Any) -> float:
        if not isinstance(rgb, list) or len(rgb) != 3:
            return 0.0
        try:
            r, g, b = [float(value) / 255.0 for value in rgb]
        except (TypeError, ValueError):
            return 0.0
        return rgb_to_hsv(r, g, b)[1]

    def _derive_shape_labels(self, blocks: list[dict[str, Any]]) -> list[str]:
        labels = []
        for block in blocks:
            if not isinstance(block, dict):
                continue
            label = str(block.get("shape", {}).get("label") or "").strip()
            if label:
                labels.append(label)
        return list(dict.fromkeys(labels)) or ["未观察到足够依据"]

    def _derive_boundary_style(self, blocks: list[dict[str, Any]]) -> str:
        if not blocks:
            return "未观察到足够依据"
        clarity = [
            str(block.get("edge_contour", {}).get("clarity") or "").strip()
            for block in blocks
            if isinstance(block, dict)
        ]
        if any(item == "clear" for item in clarity):
            return "轮廓较清楚"
        if all(item == "soft" for item in clarity if item):
            return "轮廓较柔和"
        return "轮廓感中等"

    def _summarize_whitespace_state(self, blocks: list[dict[str, Any]]) -> str:
        white_ratio = sum(
            float(block.get("mass_ratio", 0.0) or 0.0)
            for block in blocks
            if isinstance(block, dict) and block.get("llm_color_label") == "白色"
        )
        if white_ratio >= 0.35:
            return "白色留白感明显"
        if white_ratio >= 0.15:
            return "能看到一定白色空隙"
        return "留白不算突出"

    def _derive_brushwork_quality(self, blocks: list[dict[str, Any]]) -> str:
        qualities = [
            str(block.get("brushwork", {}).get("quality") or "").strip()
            for block in blocks
            if isinstance(block, dict)
        ]
        if any(item == "firm" for item in qualities):
            return "偏重"
        if any(item == "light" for item in qualities):
            return "偏轻"
        if qualities:
            return "较均匀"
        return "未观察到足够依据"

    def _derive_brushwork_pressure(self, blocks: list[dict[str, Any]]) -> str:
        if not blocks:
            return "未观察到足够依据"
        qualities = [
            str(block.get("brushwork", {}).get("quality") or "").strip()
            for block in blocks
            if isinstance(block, dict)
        ]
        if any(item == "firm" for item in qualities):
            return "偏重"
        if any(item == "light" for item in qualities):
            return "偏轻"
        return "中等"

    def _derive_outline_crossing(self, blocks: list[dict[str, Any]]) -> str:
        if not blocks:
            return "未观察到足够依据"
        if any(
            isinstance(block, dict) and block.get("white_source") == "hollow_gap"
            for block in blocks
        ):
            return "能看到颜色之间的白色断口"
        return "未观察到明显出块线框"

    def _derive_shape_phrase(self, blocks: list[dict[str, Any]]) -> str:
        labels = self._derive_shape_labels(blocks)
        if labels == ["未观察到足够依据"]:
            return "形状依据仍不足"
        return "、".join(labels[:3])

    def _select_canonical_circle_labels(self, blocks: list[dict[str, Any]]) -> list[str]:
        valid_blocks = [block for block in blocks if isinstance(block, dict)]
        if not valid_blocks:
            return []

        white_labels: list[str] = []
        non_white_blocks: list[dict[str, Any]] = []
        for block in valid_blocks:
            label = str(block.get("llm_color_label") or "").strip()
            if not label:
                continue
            white_source = str(block.get("white_source") or "none").strip()
            if white_source != "none" or label == "白色":
                white_labels.append(label)
            else:
                non_white_blocks.append(block)

        non_white_blocks.sort(
            key=lambda item: float(item.get("mass_ratio", 0.0) or 0.0),
            reverse=True,
        )
        labels: list[str] = list(dict.fromkeys(white_labels))
        if non_white_blocks:
            dominant_ratio = float(non_white_blocks[0].get("mass_ratio", 0.0) or 0.0)
            secondary_threshold = max(0.01, dominant_ratio * 0.25)
            for index, block in enumerate(non_white_blocks):
                block_ratio = float(block.get("mass_ratio", 0.0) or 0.0)
                if index > 0 and block_ratio < secondary_threshold:
                    continue
                label = str(block.get("llm_color_label") or "").strip()
                if label and label not in labels:
                    labels.append(label)

        if labels:
            return labels[:3]
        return [
            str(block.get("llm_color_label") or "").strip()
            for block in valid_blocks
            if str(block.get("llm_color_label") or "").strip()
        ][:3]

    def _circle_whitespace_score(self, circle: dict[str, Any]) -> float:
        blocks = list(circle.get("blocks", []) or []) if isinstance(circle, dict) else []
        return round(
            sum(
                float(block.get("mass_ratio", 0.0) or 0.0)
                for block in blocks
                if isinstance(block, dict) and block.get("llm_color_label") == "白色"
            ),
            4,
        )

    def _block_mass_sum(self, circle: dict[str, Any]) -> float:
        blocks = list(circle.get("blocks", []) or []) if isinstance(circle, dict) else []
        return round(
            sum(float(block.get("mass_ratio", 0.0) or 0.0) for block in blocks if isinstance(block, dict)),
            4,
        )

    def _top_block_mass_ratio(self, circle: dict[str, Any]) -> float:
        blocks = list(circle.get("blocks", []) or []) if isinstance(circle, dict) else []
        return max(
            (float(block.get("mass_ratio", 0.0) or 0.0) for block in blocks if isinstance(block, dict)),
            default=0.0,
        )

    def _has_gradient_transition(self, circles: dict[str, dict[str, Any]]) -> bool:
        family_sets = []
        for circle_key in ["inner", "middle", "outer"]:
            labels = list(circles.get(circle_key, {}).get("palette", {}).get("canonical_color_labels", []) or [])
            family_sets.append(set(self._color_family(label) for label in labels))
        return all(family_sets) and (
            bool(family_sets[0].intersection(family_sets[1]))
            or bool(family_sets[1].intersection(family_sets[2]))
        )

    def _color_family(self, label: str) -> str:
        mapping = {
            "白色": "white",
            "黑色": "dark",
            "金色": "yellow",
            "朱红": "red",
            "大红": "red",
            "玫红": "red",
            "粉红": "red",
            "橙色": "orange",
            "橘黄": "yellow",
            "柠檬黄": "yellow",
            "中黄": "yellow",
            "土黄": "yellow",
            "咖色": "brown",
            "草绿": "green",
            "翠绿": "green",
            "淡绿": "green",
            "深绿": "green",
            "青绿": "green",
            "天蓝": "blue",
            "湖蓝": "blue",
            "深蓝": "blue",
            "群青": "blue",
            "紫色": "purple",
            "紫罗兰": "purple",
        }
        return mapping.get(label, label)

    def _first_non_empty(self, values: Any) -> str:
        for value in values:
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    def _repo_relative_image_ref(self, image_ref: str) -> str:
        if not image_ref:
            return ""
        path = Path(image_ref)
        if not path.is_absolute():
            return image_ref
        parts = path.parts
        if "projects" in parts:
            project_index = parts.index("projects")
            return "/".join(parts[project_index:])
        cwd = Path.cwd().resolve()
        candidates = [cwd, *cwd.parents]
        for root in candidates:
            try:
                return str(path.relative_to(root))
            except ValueError:
                continue
        return path.name

    def _resolve_circle_config_source(self, record: Any) -> str:
        has_manual = bool(getattr(record, "three_circles", None))
        has_auto = bool(getattr(record, "three_circles_auto_detect", None))
        if has_manual and has_auto:
            return "mixed"
        if has_manual:
            return "user_calibrated"
        if has_auto:
            return "auto_detect"
        return "user_calibrated"

    def _topic_label(self, theme: str) -> str:
        labels = {
            "general": "全面解读",
            "wealth_career": "财富事业",
            "father_relationship": "父亲关系",
            "mother_relationship": "母亲关系",
            "intimate_relationship": "亲密关系",
            "parent_child_relationship": "亲子关系",
            "health_wellness": "身体健康",
            "personal_growth": "个人成长",
        }
        return labels.get(theme, theme)

    def _normalize_radius(self, value: Any) -> float:
        radius = self._safe_float(value, 33.0)
        if radius > 1:
            radius = radius / 100.0
        return max(0.0, min(radius, 1.0))

    def _safe_float(self, value: Any, fallback: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return fallback

    def _build_interpretation_method_trace(
        self,
        *,
        circles: dict[str, int],
        circle_colors: dict[str, Any],
        element_distribution: dict[str, dict[str, Any]],
        rule_trace: dict[str, Any],
        micro_analysis: Any,
    ) -> dict[str, Any]:
        per_circle_color_analysis = self._build_per_circle_color_analysis(
            circles=circles,
            circle_colors=circle_colors,
        )
        primary_candidates = (
            rule_trace.get("imbalance_trace", {}).get("primary_candidates", [])
        )
        synthetic_signal = rule_trace.get("synthetic_signal", {})
        direct_judgment = self._build_direct_judgment(
            element_distribution=element_distribution,
            primary_candidates=primary_candidates,
            synthetic_signal=synthetic_signal,
        )
        shape_analysis = self._build_shape_analysis(
            micro_analysis=micro_analysis,
            circle_colors=circle_colors,
        )
        circle_relation_analysis = self._build_circle_relation_analysis(
            micro_analysis=micro_analysis,
            per_circle_color_analysis=per_circle_color_analysis,
            synthetic_signal=synthetic_signal,
        )
        return {
            "direct_judgment": direct_judgment,
            "per_circle_color_analysis": per_circle_color_analysis,
            "shape_analysis": shape_analysis,
            "circle_relation_analysis": circle_relation_analysis,
            "final_algorithm_basis": {
                "ordered_steps": ["直断", "逐圈颜色分析", "形状分析", "圈级生克分析"],
                "selected_primary_candidates": [
                    item.get("id")
                    for item in primary_candidates
                    if isinstance(item, dict) and isinstance(item.get("id"), str)
                ]
                or [self.imbalance_service.SYNTHETIC_SIGNAL_ID],
                "notes": [
                    "tutorial_state_and_runtime_scoring_are_separated",
                    "relationship_diagnosis_follows_element_state_analysis",
                ],
            },
        }

    def _build_direct_judgment(
        self,
        *,
        element_distribution: dict[str, dict[str, Any]],
        primary_candidates: list[dict[str, Any]],
        synthetic_signal: dict[str, Any],
    ) -> dict[str, Any]:
        ranked = sorted(
            element_distribution.values(),
            key=lambda item: (-float(item.get("percentage", 0.0)), str(item.get("element_cn", ""))),
        )
        dominant = ranked[0] if ranked else {}
        secondary = ranked[1] if len(ranked) > 1 else {}
        primary_id = ""
        if primary_candidates and isinstance(primary_candidates[0], dict):
            primary_id = str(primary_candidates[0].get("id") or "").strip()
        if not primary_id and bool(synthetic_signal.get("used")):
            primary_id = str(synthetic_signal.get("id") or "").strip()
        dominant_label = str(dominant.get("element_cn") or "").strip() or "未识别"
        secondary_label = str(secondary.get("element_cn") or "").strip()
        summary = (
            f"直断先看到「{dominant_label}」更占主体，"
            f"再结合「{secondary_label or dominant_label}」去判断整体能量的主轴。"
        )
        if primary_id:
            summary += f" 当前主判断落在「{primary_id}」。"
        return {
            "summary": summary,
            "dominant_element": dominant_label,
            "secondary_element": secondary_label,
            "primary_signal": primary_id,
            "source": "tutorial_four_step_method",
        }

    def _build_per_circle_color_analysis(
        self,
        *,
        circles: dict[str, int],
        circle_colors: dict[str, Any],
    ) -> dict[str, Any]:
        area_ratios = self._calculate_circle_area_ratios(circles)
        analysis: dict[str, Any] = {}
        for circle_key in ["inner", "middle", "outer"]:
            circle_data = circle_colors.get(circle_key, {}) if isinstance(circle_colors, dict) else {}
            colors = circle_data.get("colors", []) if isinstance(circle_data, dict) else []
            brightness_values = []
            saturation_values = []
            for color in colors:
                if not isinstance(color, dict):
                    continue
                rgb = color.get("rgb") or []
                if not isinstance(rgb, list) or len(rgb) != 3:
                    continue
                r, g, b = [float(value) for value in rgb]
                brightness_values.append(0.299 * r + 0.587 * g + 0.114 * b)
                max_c = max(r, g, b)
                min_c = min(r, g, b)
                saturation_values.append(0.0 if max_c == 0 else (max_c - min_c) / max_c)
            avg_brightness = (
                sum(brightness_values) / len(brightness_values)
                if brightness_values
                else 0.0
            )
            avg_saturation = (
                sum(saturation_values) / len(saturation_values)
                if saturation_values
                else 0.0
            )
            analysis[circle_key] = {
                "circle": circle_key,
                "circle_label": CIRCLE_KEY_TO_CN.get(circle_key, circle_key),
                "dominant_element": ELEMENT_KEY_TO_CN.get(
                    circle_data.get("dominant_element"),
                    circle_data.get("dominant_element", ""),
                ),
                "dominant_color": circle_data.get("dominant_color", ""),
                "colors": colors,
                "state_basis": {
                    "source": "tutorial_color_area_depth",
                    "area_ratio": round(area_ratios.get(circle_key, 0.0), 4),
                    "avg_brightness": round(avg_brightness, 2),
                    "avg_saturation": round(avg_saturation, 4),
                    "depth_state": self._classify_depth_state(
                        brightness=avg_brightness,
                        saturation=avg_saturation,
                    ),
                    "fill_state": self._classify_fill_state(colors),
                },
            }
        return analysis

    def _build_shape_analysis(
        self,
        *,
        micro_analysis: Any,
        circle_colors: dict[str, Any],
    ) -> dict[str, Any]:
        adjacent = list(getattr(micro_analysis, "adjacent", []) or [])
        wrap = list(getattr(micro_analysis, "wrap", []) or [])
        overall_features: list[str] = []
        if adjacent:
            overall_features.append("detected_circle_transition_pattern")
        if wrap:
            overall_features.append("detected_wrap_or_protection_pattern")
        return {
            "source": "micro_analysis_proxy",
            "overall_features": overall_features,
            "triggered_analyses": [
                {
                    "type": "shape_proxy",
                    "circle_count": len(
                        [
                            key for key in ["inner", "middle", "outer"]
                            if isinstance(circle_colors.get(key), dict)
                        ]
                    ),
                    "adjacent_relations": adjacent,
                    "wrap_relations": wrap,
                }
            ],
        }

    def _build_circle_relation_analysis(
        self,
        *,
        micro_analysis: Any,
        per_circle_color_analysis: dict[str, Any],
        synthetic_signal: dict[str, Any],
    ) -> dict[str, Any]:
        circle_elements = {
            key: str(value.get("dominant_element") or "").strip()
            for key, value in per_circle_color_analysis.items()
            if isinstance(value, dict)
        }
        return {
            "source": "circle_energy_flow",
            "circle_elements": circle_elements,
            "adjacent_relations": list(getattr(micro_analysis, "adjacent", []) or []),
            "wrap_relations": list(getattr(micro_analysis, "wrap", []) or []),
            "synthetic_signal": synthetic_signal,
        }

    def _calculate_circle_area_ratios(self, circles: dict[str, int]) -> dict[str, float]:
        inner_ratio = float(circles.get("inner_radius", 33) or 33) / 100.0
        middle_ratio = float(circles.get("middle_radius", 66) or 66) / 100.0
        return {
            "inner": round(max(inner_ratio**2, 0.0), 4),
            "middle": round(max(middle_ratio**2 - inner_ratio**2, 0.0), 4),
            "outer": round(max(1 - middle_ratio**2, 0.0), 4),
        }

    def _classify_depth_state(
        self,
        *,
        brightness: float,
        saturation: float,
    ) -> str:
        if brightness <= 80:
            return "deep"
        if brightness >= 185 and saturation <= 0.18:
            return "light"
        if saturation >= 0.45 and brightness <= 150:
            return "deep"
        return "middle"

    def _classify_fill_state(self, colors: list[Any]) -> str:
        if not colors:
            return "sparse"
        top_percentage = 0.0
        for color in colors:
            if not isinstance(color, dict):
                continue
            try:
                top_percentage = max(top_percentage, float(color.get("percentage", 0.0) or 0.0))
            except (TypeError, ValueError):
                continue
        if top_percentage >= 55:
            return "dense"
        if top_percentage <= 20:
            return "mixed"
        return "filled"
