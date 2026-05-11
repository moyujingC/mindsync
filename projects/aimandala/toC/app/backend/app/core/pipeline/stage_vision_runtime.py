"""Stage-03/04 vision runtime for report generation."""

from __future__ import annotations

import json
from typing import Any


class StageVisionRuntime:
    """Generate visual evidence and direct judgment stages with a vision LLM."""

    def __init__(self, *, llm_client: Any, direct_judgment_service: Any) -> None:
        self.llm_client = llm_client
        self.direct_judgment_service = direct_judgment_service

    def generate_stage03(
        self,
        *,
        image_path: str,
        theme: str,
        three_circles: dict[str, Any],
    ) -> dict[str, Any]:
        if self.llm_client is None or not hasattr(self.llm_client, "generate_structured"):
            return self._failed_stage03("vision_client_unavailable")
        payload = self.llm_client.generate_structured(
            task="vision",
            prompt=self._stage03_prompt(theme=theme, three_circles=three_circles),
            schema=self._stage03_schema(),
            image_path=image_path,
        )
        if not isinstance(payload, dict):
            return self._failed_stage03("vision_empty_or_invalid")
        normalized = self._normalize_stage03(payload, three_circles=three_circles)
        if not self._has_visual_units(normalized):
            return self._failed_stage03("empty_visual_units", raw_payload=payload)
        normalized["status"] = "complete"
        normalized["model_trace"] = self._model_trace()
        return normalized

    def generate_stage04(
        self,
        *,
        image_path: str,
        stage03: dict[str, Any],
    ) -> dict[str, Any]:
        program_matches = (
            self.direct_judgment_service.match_programmatically(stage03)
            if self.direct_judgment_service is not None
            else []
        )
        judgments = (
            self.direct_judgment_service.list_judgments()
            if self.direct_judgment_service is not None
            else []
        )
        if self.llm_client is None or not hasattr(self.llm_client, "generate_structured"):
            return self._failed_stage04("vision_client_unavailable", program_matches)
        payload = self.llm_client.generate_structured(
            task="vision",
            prompt=self._stage04_prompt(
                stage03=stage03,
                judgments=judgments,
                program_matches=program_matches,
            ),
            schema=self._stage04_schema(),
            image_path=image_path,
        )
        if not isinstance(payload, dict):
            return self._failed_stage04("vision_empty_or_invalid", program_matches)
        normalized = self._normalize_stage04(payload, program_matches=program_matches)
        normalized["status"] = "complete"
        normalized["model_trace"] = self._model_trace()
        return normalized

    def _normalize_stage03(
        self,
        payload: dict[str, Any],
        *,
        three_circles: dict[str, Any],
    ) -> dict[str, Any]:
        circles: dict[str, Any] = {}
        raw_circles = payload.get("circles", {})
        if not isinstance(raw_circles, dict):
            raw_circles = {}
        top_level_units = payload.get("visual_units", [])
        if not any(
            isinstance(raw_circles.get(circle_key), dict)
            and isinstance(raw_circles.get(circle_key, {}).get("visual_units"), list)
            and raw_circles.get(circle_key, {}).get("visual_units")
            for circle_key in ("inner", "middle", "outer")
        ) and isinstance(top_level_units, list):
            raw_circles = self._group_flat_visual_units(top_level_units)
        for circle_key in ("inner", "middle", "outer"):
            raw_circle = raw_circles.get(circle_key, {})
            if not isinstance(raw_circle, dict):
                raw_circle = {}
            circles[circle_key] = {
                "summary": str(raw_circle.get("summary") or "").strip(),
                "visual_units": [
                    self._normalize_visual_unit(circle_key, index, unit)
                    for index, unit in enumerate(raw_circle.get("visual_units", []))
                    if isinstance(unit, dict)
                ],
                "intra_circle_relations": raw_circle.get("intra_circle_relations", []),
                "uncertainties": raw_circle.get("uncertainties", []),
            }
        return {
            "stage": "stage-03-visual-evidence",
            "status": "complete",
            "global_visual_summary": str(
                payload.get("global_visual_summary") or payload.get("global_summary") or ""
            ).strip(),
            "circle_boundary_ref": {
                "inner_middle_radius": three_circles.get("inner_radius"),
                "middle_outer_radius": three_circles.get("middle_radius"),
                "radius_unit": "normalized_percent",
            },
            "circles": circles,
            "inter_circle_relations": payload.get("inter_circle_relations", []),
            "evidence_refs": payload.get("evidence_summary", []),
            "uncertainties": payload.get("uncertainties", []),
        }

    def _normalize_visual_unit(
        self,
        circle_key: str,
        index: int,
        unit: dict[str, Any],
    ) -> dict[str, Any]:
        color = unit.get("color")
        shape = unit.get("shape")
        return {
            "id": str(unit.get("id") or f"{circle_key}-{index + 1:03d}").strip(),
            "position": str(unit.get("position") or "").strip(),
            "color": self._main_color(color),
            "secondary_colors": color.get("secondary", []) if isinstance(color, dict) else [],
            "shade": str(
                unit.get("shade")
                or (color.get("depth") if isinstance(color, dict) else "")
                or "medium"
            ).strip(),
            "saturation": str(color.get("saturation") if isinstance(color, dict) else "").strip(),
            "shape": self._shape_type(shape),
            "shape_arrangement": str(
                shape.get("arrangement") if isinstance(shape, dict) else ""
            ).strip(),
            "area_ratio": self._area_ratio(unit),
            "fill_state": str(unit.get("fill_state") or unit.get("fill_status") or unit.get("filling_status") or "").strip(),
            "whitespace_state": str(unit.get("whitespace_state") or "").strip(),
            "relation_to_neighbors": unit.get("relation_to_neighbors")
            or unit.get("adjacent_relationships")
            or unit.get("adjacent_relationship")
            or [],
            "description": str(
                unit.get("description") or unit.get("visible_evidence") or ""
            ).strip(),
        }

    def _group_flat_visual_units(self, units: list[Any]) -> dict[str, Any]:
        grouped = {
            "inner": {"summary": "", "visual_units": []},
            "middle": {"summary": "", "visual_units": []},
            "outer": {"summary": "", "visual_units": []},
        }
        for unit in units:
            if not isinstance(unit, dict):
                continue
            circle_key = self._infer_circle_from_unit(unit)
            grouped[circle_key]["visual_units"].append(unit)
        for circle_key, circle in grouped.items():
            descriptions = [
                str(item.get("description") or item.get("visible_evidence") or item.get("position") or "").strip()
                for item in circle["visual_units"][:3]
                if isinstance(item, dict)
            ]
            circle["summary"] = "；".join(item for item in descriptions if item)
        return grouped

    def _infer_circle_from_unit(self, unit: dict[str, Any]) -> str:
        text = " ".join(
            str(unit.get(key) or "")
            for key in [
                "position",
                "description",
                "visible_evidence",
                "adjacent_relationship",
            ]
        ).lower()
        relation = unit.get("adjacent_relationships") or unit.get("relation_to_neighbors")
        if isinstance(relation, list):
            text += " " + " ".join(str(item).lower() for item in relation)
        inner_keywords = [
            "中心",
            "中央",
            "核心",
            "内圈",
            "center",
            "central",
            "centered",
            "core",
            "inner",
            "immediately surrounding",
        ]
        middle_keywords = [
            "中圈",
            "中间",
            "middle",
            "middle ring",
            "second layer",
            "second region",
            "radiating",
            "between",
        ]
        outer_keywords = [
            "外圈",
            "最外",
            "边界",
            "外围",
            "outer",
            "outermost",
            "boundary",
            "surrounds entire",
            "circumference",
        ]
        if any(keyword in text for keyword in outer_keywords):
            return "outer"
        if any(keyword in text for keyword in middle_keywords):
            return "middle"
        if any(keyword in text for keyword in inner_keywords):
            return "inner"
        return "middle"

    def _normalize_stage04(
        self,
        payload: dict[str, Any],
        *,
        program_matches: list[dict[str, Any]],
    ) -> dict[str, Any]:
        hits = payload.get("hits", [])
        if not isinstance(hits, list):
            hits = []
        normalized_hits = [item for item in hits if isinstance(item, dict)]
        refs = self._unique(
            [
                ref
                for item in [*normalized_hits, *program_matches]
                for ref in item.get("knowledge_refs", [])
                if isinstance(item, dict)
            ]
        )
        return {
            "stage": "stage-04-direct-judgment-high-hit-check",
            "status": "complete",
            "source_inputs": payload.get("source_inputs", {}),
            "hits": normalized_hits,
            "program_matches": program_matches,
            "non_hits": payload.get("non_hits", []),
            "uncertain_items": payload.get("uncertain_items", []),
            "conflicts": payload.get("conflicts", []),
            "matches": normalized_hits,
            "summary": str(payload.get("summary") or "").strip(),
            "knowledge_refs": refs,
        }

    def _failed_stage03(
        self,
        reason: str,
        *,
        raw_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "stage": "stage-03-visual-evidence",
            "status": "failed",
            "failure_reason": reason,
            "global_visual_summary": "",
            "circles": {"inner": {}, "middle": {}, "outer": {}},
            "evidence_refs": [],
            "raw_payload": raw_payload or {},
            "model_trace": self._model_trace(),
        }

    def _failed_stage04(
        self,
        reason: str,
        program_matches: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            "stage": "stage-04-direct-judgment-high-hit-check",
            "status": "failed",
            "failure_reason": reason,
            "hits": [],
            "program_matches": program_matches,
            "non_hits": [],
            "uncertain_items": [],
            "conflicts": [],
            "matches": [],
            "knowledge_refs": self._unique(
                [
                    ref
                    for item in program_matches
                    for ref in item.get("knowledge_refs", [])
                ]
            ),
            "model_trace": self._model_trace(),
        }

    def _stage03_prompt(self, *, theme: str, three_circles: dict[str, Any]) -> str:
        return (
            "执行第03步视觉证据提取，来源口径为《第03步视觉证据提取Prompt》。"
            "你是一名画面证据记录员，只记录可见事实，不做五行、生克、失衡、疗愈、人格或关系诊断。"
            "必须忽略画纸原有的黑色线框画稿；黑色线框是底图模板，不是作者本次填色表达，"
            "不能进入颜色、边缘、分割、边界强弱或结构强弱判断。"
            "每个 visual_unit 必须把颜色、形状、位置、面积比例、填充状态和相邻关系放在同一个图案单元里，"
            "禁止拆成孤立的颜色列表和形状列表。"
            "必须按 circles.inner、circles.middle、circles.outer 三个圈层分别输出 visual_units，"
            "禁止只在顶层输出 visual_units。"
            "所有颜色、形状、位置、描述必须使用中文，例如红色、绿色、蓝色、黄色、圆形、花瓣、条状、方形。"
            "每个圈层至少输出 2 个 visual_units；如果某圈可见元素很少，也要记录该圈最明显的颜色与形状。"
            f"主题: {theme}。三圈半径: {three_circles}。"
        )

    def _stage04_prompt(
        self,
        *,
        stage03: dict[str, Any],
        judgments: list[dict[str, Any]],
        program_matches: list[dict[str, Any]],
    ) -> str:
        return (
            "执行第04步直断命中检查，来源口径为《第04步直断命中检查Prompt》。"
            "只检查是否命中直断模式，不生成完整解读。"
            "每个命中必须引用 direct_judgment.* 知识条目。"
            "视觉大模型结果必须和默认程序匹配结果互验，输出 consistent、vision_only、program_only、conflict 或 not_enough_evidence。"
            "直断结论只是快速抓手，不能写成最终心理诊断。"
            "\n\n第03步视觉证据:\n"
            + json.dumps(stage03, ensure_ascii=False)
            + "\n\n直断模式清单:\n"
            + json.dumps(judgments, ensure_ascii=False)
            + "\n\n默认程序匹配结果:\n"
            + json.dumps(program_matches, ensure_ascii=False)
        )

    def _stage03_schema(self) -> dict[str, Any]:
        visual_unit_schema = {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "position": {"type": "string"},
                "color": {
                    "type": "object",
                    "properties": {
                        "main": {"type": "string"},
                        "secondary": {"type": "array", "items": {"type": "string"}},
                        "depth": {"type": "string"},
                        "saturation": {"type": "string"},
                    },
                    "required": ["main"],
                },
                "shape": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string"},
                        "arrangement": {"type": "string"},
                    },
                    "required": ["type"],
                },
                "area_ratio": {"type": "number"},
                "fill_state": {"type": "string"},
                "whitespace_state": {"type": "string"},
                "relation_to_neighbors": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "description": {"type": "string"},
            },
            "required": ["position", "color", "shape", "description"],
        }
        circle_schema = {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "visual_units": {
                    "type": "array",
                    "items": visual_unit_schema,
                    "minItems": 1,
                },
                "intra_circle_relations": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "uncertainties": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["summary", "visual_units"],
        }
        return {
            "type": "object",
            "properties": {
                "stage": {"type": "string"},
                "global_visual_summary": {"type": "string"},
                "circles": {
                    "type": "object",
                    "properties": {
                        "inner": circle_schema,
                        "middle": circle_schema,
                        "outer": circle_schema,
                    },
                    "required": ["inner", "middle", "outer"],
                },
                "inter_circle_relations": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "evidence_summary": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "uncertainties": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["global_visual_summary", "circles"],
        }

    def _stage04_schema(self) -> dict[str, Any]:
        return {"type": "object"}

    def _model_trace(self) -> dict[str, Any]:
        return {
            "source": "vision_llm",
            "attempt_trace": list(getattr(self.llm_client, "last_attempt_trace", []) or []),
            "error_detail": dict(getattr(self.llm_client, "last_error_detail", {}) or {}),
        }

    def _has_visual_units(self, stage03: dict[str, Any]) -> bool:
        circles = stage03.get("circles", {})
        if not isinstance(circles, dict):
            return False
        for circle in circles.values():
            if isinstance(circle, dict) and circle.get("visual_units"):
                return True
        return False

    def _main_color(self, color: Any) -> str:
        if isinstance(color, dict):
            return str(color.get("main") or "").strip()
        return str(color or "").strip()

    def _shape_type(self, shape: Any) -> str:
        if isinstance(shape, dict):
            return str(shape.get("type") or "").strip()
        return str(shape or "").strip()

    def _float(self, value: Any, *, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _area_ratio(self, unit: dict[str, Any]) -> float:
        value = unit.get("area_ratio")
        if value is None:
            value = unit.get("area_proportion")
        if isinstance(value, str):
            lowered = value.strip().lower()
            qualitative = {
                "very small": 0.03,
                "small": 0.08,
                "medium": 0.18,
                "large": 0.32,
                "very large": 0.45,
                "thin ring": 0.05,
                "wide band": 0.25,
                "大": 0.32,
                "中": 0.18,
                "小": 0.08,
            }
            for key, mapped in qualitative.items():
                if key in lowered:
                    return mapped
        return self._float(value, default=0.0)

    def _unique(self, values: list[Any]) -> list[str]:
        result: list[str] = []
        for value in values:
            text = str(value or "").strip()
            if text and text not in result:
                result.append(text)
        return result
