"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from app.core.wealth_report import get_wealth_report_runtime

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS, MandalaAgentInput, MandalaAgentResult
from .prompt_loader import load_prompt_config, load_prompt_template, render_prompt_template
from .quality_gate import GENERIC_OPENING_PHRASES, run_quality_gate


ELEMENT_LABELS = {
    "wood": "木",
    "fire": "火",
    "earth": "土",
    "metal": "金",
    "water": "水",
}

ELEMENT_RULES = {
    "wood": {
        "terms": ["绿", "青", "长条", "竖线", "枝", "叶"],
        "hint": "木性指向生长、向上、边界和行动力。",
    },
    "fire": {
        "terms": ["红", "粉", "橙", "紫", "玫", "三角", "尖", "星"],
        "hint": "火性指向热情、表达、焦急和动力消耗。",
    },
    "earth": {
        "terms": ["黄", "咖", "棕", "褐", "方", "正方", "块"],
        "hint": "土性指向承载、稳定、现实感和责任压力。",
    },
    "metal": {
        "terms": ["白", "留白", "灰", "银", "小圆", "半圆", "边界"],
        "hint": "金性指向规则、收敛、标准、边界和价值感。",
    },
    "water": {
        "terms": ["蓝", "黑", "水", "波浪", "流线", "弧线"],
        "hint": "水性指向流动、感受、恐惧、智慧和深层安全感。",
    },
}

GENERATES = {
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
    "metal": "water",
    "water": "wood",
}

CONTROLS = {
    "wood": "earth",
    "earth": "water",
    "water": "fire",
    "fire": "metal",
    "metal": "wood",
}


class MandalaInterpretationAgent:
    """Generate mandala interpretation artifacts through a single agent path."""

    def __init__(self, *, llm_client: Any) -> None:
        self.llm_client = llm_client

    def run(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
    ) -> MandalaAgentResult:
        input_payload = agent_input.to_dict()
        input_payload["knowledge_pack"] = {
            "pack_id": knowledge_pack.get("pack_id"),
            "theme": knowledge_pack.get("theme"),
            "method_source": knowledge_pack.get("method_source"),
        }

        stage_outputs: dict[str, Any] = {}
        stage_outputs.update(self._run_block_1(agent_input=agent_input))
        stage_outputs.update(
            self._run_block_2(agent_input=agent_input, knowledge_pack=knowledge_pack)
        )
        stage_outputs.update(
            self._run_block_3(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            )
        )
        stage_outputs.update(
            self._run_block_4(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            )
        )
        stage_outputs.update(
            self._run_block_5(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            )
        )

        final_report = stage_outputs["stage-16-final-report-assembly"]["final_report"]
        final_report_md = final_report["markdown"]
        report_context_package = self._build_report_context_package(
            agent_input=agent_input,
            stage_outputs=stage_outputs,
            final_report=final_report,
        )
        execution_trace = self._build_execution_trace(stage_outputs)
        quality_gate = run_quality_gate(
            stage_outputs=stage_outputs,
            execution_trace=execution_trace,
            final_report_md=final_report_md,
            report_context_package=report_context_package,
        )
        agent_output = {
            "agent_version": agent_input.agent_version,
            "status": "complete" if quality_gate["passed"] else "failed_quality_gate",
            "report_mode": agent_input.report_mode,
            "stage_count": len(stage_outputs),
            "quality_gate_passed": quality_gate["passed"],
        }
        interpretation_artifacts = {
            "method_source": knowledge_pack.get("method_source"),
            "execution_blocks": execution_trace,
            "stage_outputs": stage_outputs,
            "evidence_map": report_context_package["evidence_map"],
        }
        return MandalaAgentResult(
            agent_input=input_payload,
            knowledge_pack=knowledge_pack,
            agent_output=agent_output,
            interpretation_artifacts=interpretation_artifacts,
            stage_outputs=stage_outputs,
            execution_trace=execution_trace,
            final_report=final_report,
            final_report_md=final_report_md,
            report_context_package=report_context_package,
            quality_gate=quality_gate,
        )

    def _run_block_1(self, *, agent_input: MandalaAgentInput) -> dict[str, Any]:
        return {
            "stage-00-input-context": {
                "stage": "stage-00-input-context",
                "status": "complete",
                "report_mode": agent_input.report_mode,
                "image": agent_input.image.to_dict(),
                "agent_version": agent_input.agent_version,
            },
            "stage-01-user-input-context": {
                "stage": "stage-01-user-input-context",
                "status": "complete",
                "user_context": agent_input.user_context.to_dict(),
            },
            "stage-02-circle-boundary-decision": {
                "stage": "stage-02-circle-boundary-decision",
                "status": "complete",
                "circle_boundaries": agent_input.circle_boundaries,
            },
        }

    def _run_block_2(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
    ) -> dict[str, Any]:
        stage03_payload = self.llm_client.generate_structured(
            task="vision",
            prompt=self._vision_prompt(agent_input=agent_input),
            schema=self._vision_schema(),
            image_paths=self._vision_image_paths(agent_input),
        )
        if not isinstance(stage03_payload, dict):
            raise RuntimeError("vision_model_failed: empty or invalid stage-03 payload")
        stage03 = self._normalize_stage03(stage03_payload)
        stage04 = self._build_stage04(stage03)
        return {
            "stage-03-visual-evidence": stage03,
            "stage-04-direct-judgment-high-hit-check": stage04,
        }

    def _run_block_3(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> dict[str, Any]:
        stage03 = stage_outputs["stage-03-visual-evidence"]
        circles = stage03.get("circles", {})
        per_circle = {
            circle_key: {
                "visual_summary": circle.get("summary", ""),
                "dominant_colors": self._collect_interpretable_values(circle, "color"),
                "dominant_shapes": self._collect_interpretable_values(circle, "shape"),
                "visual_units": self._interpretable_visual_units(circle),
                "knowledge_refs": self._knowledge_refs_for_circle(circle_key, knowledge_pack),
            }
            for circle_key, circle in circles.items()
            if isinstance(circle, dict)
        }
        five_element_profile = self._five_element_profile(per_circle)
        return {
            "stage-05-per-circle-color-shape-element-sensing": {
                "stage": "stage-05-per-circle-color-shape-element-sensing",
                "status": "complete",
                "per_circle": per_circle,
            },
            "stage-06-per-circle-element-generation-control": {
                "stage": "stage-06-per-circle-element-generation-control",
                "status": "complete",
                "theme": agent_input.user_context.theme,
                "control_notes": [
                    "按当前画面证据和精简知识包推导，不新增画面事实。",
                    "五行分析只识别每圈内部的视觉元素属性，不给整圈贴单一五行标签。",
                    "五行生克只在同一圈内部的元素之间判断。",
                    "三圈联动不使用五行生克关系，只分析内圈、中圈、外圈之间的层级承接。",
                ],
                "scope": {
                    "five_element_scope": "intra_circle_visual_elements",
                    "circle_primary_element_labeling": "excluded",
                    "intra_circle_element_relations": "allowed",
                    "cross_circle_five_element_relations": "excluded",
                    "report_rule": "报告必须展示圈内元素五行和同圈生克候选，不得把一个圈简化成单一五行。",
                },
                "profile": five_element_profile,
                "per_circle": five_element_profile["per_circle"],
            },
            "stage-07-per-circle-imbalance-patterns": {
                "stage": "stage-07-per-circle-imbalance-patterns",
                "status": "complete",
                "candidates": self._imbalance_candidates(per_circle),
            },
            "stage-08-energy-flow-diagnosis": {
                "stage": "stage-08-energy-flow-diagnosis",
                "status": "complete",
                "diagnosis": "内圈到中圈已有表达，外圈边界仍较谨慎。",
                "evidence_refs": self._visual_unit_refs(stage03),
            },
            "stage-09-evidence-consolidation": {
                "stage": "stage-09-evidence-consolidation",
                "status": "complete",
                "evidence_map": self._evidence_map(stage03),
            },
        }

    def _run_block_4(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> dict[str, Any]:
        text = self.llm_client.generate_text(
            task="chat",
            system_prompt=load_prompt_template("thesis/system.md"),
            user_prompt=self._thesis_prompt(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            ),
        )
        payload = self._parse_json_text(text) or {}
        core_thesis = str(payload.get("core_thesis") or "").strip() or "画面呈现出自我稳定与外部表达之间的调节过程。"
        framing = str(payload.get("user_facing_framing") or "").strip() or "这份解读会先从画面证据出发，再连接到当下状态。"
        healing_direction = str(payload.get("healing_direction") or "").strip() or "先确认稳定支点，再逐步展开表达。"
        entry_circle = self._safe_entry_circle(payload.get("entry_circle"))
        entry_signal = str(payload.get("entry_signal") or "").strip()
        entry_reason = str(payload.get("entry_reason") or "").strip()
        narrative_order = self._safe_narrative_order(payload.get("narrative_order"), entry_circle)
        integrated_context_threads = self._string_list(payload.get("integrated_context_threads"))
        evidence_refs = payload.get("evidence_refs")
        if not isinstance(evidence_refs, list):
            evidence_refs = self._visual_unit_refs(stage_outputs["stage-03-visual-evidence"])
        theme_route = self._build_theme_route(
            agent_input=agent_input,
            stage_outputs=stage_outputs,
        )
        return {
            "stage-10-core-thesis-selection": {
                "stage": "stage-10-core-thesis-selection",
                "status": "complete",
                "core_thesis": core_thesis,
                "entry_circle": entry_circle,
                "entry_signal": entry_signal,
                "entry_reason": entry_reason,
                "narrative_order": narrative_order,
                "integrated_context_threads": integrated_context_threads,
                "evidence_refs": evidence_refs,
                "theme_route": theme_route,
            },
            "stage-11-user-facing-framing": {
                "stage": "stage-11-user-facing-framing",
                "status": "complete",
                "framing": framing,
                "entry_circle": entry_circle,
                "entry_signal": entry_signal,
                "entry_reason": entry_reason,
                "narrative_order": narrative_order,
                "integrated_context_threads": integrated_context_threads,
                "theme_route": theme_route,
            },
            "stage-12-healing-direction-and-report-branching": {
                "stage": "stage-12-healing-direction-and-report-branching",
                "status": "complete",
                "healing_direction": healing_direction,
                "report_mode": agent_input.report_mode,
                "entry_circle": entry_circle,
                "entry_signal": entry_signal,
                "entry_reason": entry_reason,
                "narrative_order": narrative_order,
                "integrated_context_threads": integrated_context_threads,
                "writing_input_refs": evidence_refs,
                "theme_route": theme_route,
            },
        }

    def _run_block_5(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> dict[str, Any]:
        report_prompt = self._report_prompt(
            agent_input=agent_input,
            knowledge_pack=knowledge_pack,
            stage_outputs=stage_outputs,
        )
        report_text = self.llm_client.generate_text(
            task="chat",
            system_prompt=load_prompt_template("report/system.md"),
            user_prompt=report_prompt,
        )
        if not report_text or not report_text.strip():
            raise RuntimeError("chat_model_failed: empty final report")
        markdown = report_text.strip()
        for _attempt in range(2):
            draft_issues = self._report_draft_issues(markdown, report_mode=agent_input.report_mode)
            if not draft_issues:
                break
            retry_text = self.llm_client.generate_text(
                task="chat",
                system_prompt=load_prompt_template("report/rewrite_system.md"),
                user_prompt=render_prompt_template(
                    "report/rewrite_user.md",
                    report_prompt=report_prompt,
                    draft_issues_json=json.dumps(draft_issues, ensure_ascii=False),
                    previous_report=markdown,
                ),
            )
            if retry_text and retry_text.strip():
                markdown = retry_text.strip()
        lite_draft = {
            "stage": "stage-13-lite-report-draft",
            "status": "complete",
            "enabled": agent_input.report_mode == "lite",
            "markdown": markdown if agent_input.report_mode == "lite" else "",
        }
        pro_draft = {
            "stage": "stage-14-pro-report-draft",
            "status": "complete",
            "enabled": agent_input.report_mode == "pro",
            "markdown": markdown if agent_input.report_mode == "pro" else "",
        }
        final_report = {
            "report_id": f"mandala-interpretation-{uuid4().hex[:12]}",
            "report_mode": agent_input.report_mode,
            "title": "曼陀罗解读报告",
            "markdown": markdown,
            "summary": stage_outputs["stage-10-core-thesis-selection"]["core_thesis"],
        }
        return {
            "stage-13-lite-report-draft": lite_draft,
            "stage-14-pro-report-draft": pro_draft,
            "stage-15-visual-assets": {
                "stage": "stage-15-visual-assets",
                "status": "skipped",
                "reason": "mvp_no_image_generation",
            },
            "stage-16-final-report-assembly": {
                "stage": "stage-16-final-report-assembly",
                "status": "complete",
                "final_report": final_report,
            },
        }

    def _report_draft_issues(self, markdown: str, *, report_mode: str) -> list[str]:
        issues: list[str] = []
        text = markdown.strip()
        if not text.startswith("# ") or "财富议题" not in text.splitlines()[0]:
            issues.append("title_must_be_markdown_h1_and_include_wealth_topic")
        if any(phrase in text[:300] for phrase in GENERIC_OPENING_PHRASES):
            issues.append("opening_must_not_use_generic_greeting")
        if not self._has_visible_five_element_analysis(text):
            issues.append("report_must_include_visible_five_element_analysis")
        min_chars = 1000 if report_mode == "pro" else 500
        if len(text) < min_chars:
            issues.append(f"report_too_short_min_{min_chars}_chars")
        max_chars = 2400 if report_mode == "pro" else 1600
        if len(text) > max_chars:
            issues.append(f"report_too_long_max_{max_chars}_chars")
        return issues

    def _has_visible_five_element_analysis(self, text: str) -> bool:
        return "五行" in text and any(label in text for label in ELEMENT_LABELS.values())

    def _normalize_stage03(self, payload: dict[str, Any]) -> dict[str, Any]:
        circles = self._normalize_circles(payload.get("circles"))
        return {
            "stage": "stage-03-visual-evidence",
            "status": "complete",
            "global_visual_summary": str(
                payload.get("global_visual_summary") or payload.get("global_summary") or ""
            ).strip(),
            "circles": circles,
            "evidence_refs": payload.get("evidence_summary", []),
            "evidence_summary": self._string_list(payload.get("evidence_summary")),
            "excluded_marks": self._excluded_marks(payload.get("excluded_marks")),
            "uncertainties": payload.get("uncertainties", []),
            "model_trace": getattr(self.llm_client, "last_attempt_trace", []),
        }

    def _normalize_circles(self, raw_circles: Any) -> dict[str, dict[str, Any]]:
        normalized: dict[str, dict[str, Any]] = {}
        circles = raw_circles if isinstance(raw_circles, dict) else {}
        aliases = {
            "inner": ["inner", "inner_circle", "内圈", "里圈", "中心"],
            "middle": ["middle", "middle_circle", "中圈", "中间层"],
            "outer": ["outer", "outer_circle", "外圈", "外层", "边界"],
        }
        for canonical, candidate_keys in aliases.items():
            raw_circle = self._first_circle_payload(circles, candidate_keys)
            normalized[canonical] = self._normalize_circle_payload(
                canonical,
                raw_circle,
            )
        return normalized

    def _first_circle_payload(
        self,
        circles: dict[str, Any],
        candidate_keys: list[str],
    ) -> dict[str, Any]:
        for key in candidate_keys:
            payload = circles.get(key)
            if isinstance(payload, dict):
                return payload
        return {}

    def _normalize_circle_payload(
        self,
        circle_key: str,
        raw_circle: dict[str, Any],
    ) -> dict[str, Any]:
        raw_units = raw_circle.get("visual_units")
        units = [
            self._normalize_visual_unit(circle_key, index, unit)
            for index, unit in enumerate(raw_units)
            if isinstance(unit, dict)
        ] if isinstance(raw_units, list) else []
        if not units:
            units = self._visual_units_from_circle_summary(circle_key, raw_circle)
        return {
            "summary": self._circle_summary(raw_circle),
            "visual_units": units,
            "raw_observation": raw_circle,
        }

    def _visual_units_from_circle_summary(
        self,
        circle_key: str,
        raw_circle: dict[str, Any],
    ) -> list[dict[str, Any]]:
        color_values = self._string_list(raw_circle.get("color_distribution"))
        if not color_values:
            color_values = self._string_list(raw_circle.get("dominant_colors"))
        if not color_values:
            color_values = self._string_list(raw_circle.get("colors"))
        shape = str(
            raw_circle.get("shape")
            or raw_circle.get("shapes")
            or raw_circle.get("pattern")
            or raw_circle.get("patterns")
            or ""
        ).strip()
        evidence = self._circle_summary(raw_circle)
        if not evidence and not color_values and not shape:
            return []
        return [
            {
                "id": f"{circle_key}-001",
                "position": circle_key,
                "source_type": "user_painted",
                "include_in_interpretation": True,
                "exclude_reason": "none",
                "color": "、".join(color_values),
                "color_confidence": "medium",
                "shape": shape,
                "size_tendency": "unknown",
                "adjacency": [],
                "is_blank_space": False,
                "metal_candidate": any("白" in color or "留白" in color for color in color_values),
                "visible_evidence": evidence,
                "confidence": "medium",
            }
        ]

    def _normalize_visual_unit(
        self,
        circle_key: str,
        index: int,
        unit: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "id": str(unit.get("id") or f"{circle_key}-{index + 1:03d}").strip(),
            "position": str(unit.get("position") or circle_key).strip(),
            "source_type": self._safe_source_type(unit.get("source_type")),
            "include_in_interpretation": self._include_visual_unit(unit),
            "exclude_reason": str(unit.get("exclude_reason") or "none").strip(),
            "color": self._main_value(unit.get("color")),
            "color_confidence": self._safe_confidence(unit.get("color_confidence")),
            "shape": self._main_value(unit.get("shape")),
            "size_tendency": self._safe_size_tendency(unit.get("size_tendency")),
            "adjacency": self._string_list(unit.get("adjacency")),
            "is_blank_space": bool(unit.get("is_blank_space")),
            "metal_candidate": bool(unit.get("metal_candidate")),
            "visible_evidence": str(
                unit.get("visible_evidence")
                or unit.get("description")
                or unit.get("evidence")
                or ""
            ).strip(),
            "confidence": self._safe_confidence(unit.get("confidence")),
        }

    def _circle_summary(self, raw_circle: dict[str, Any]) -> str:
        explicit = str(
            raw_circle.get("summary")
            or raw_circle.get("description")
            or ""
        ).strip()
        if explicit:
            return explicit
        parts = []
        for key in [
            "center",
            "color_distribution",
            "dominant_colors",
            "colors",
            "texture",
            "pattern",
            "patterns",
            "shape",
            "shapes",
            "transition",
            "boundary",
            "intensity",
        ]:
            value = raw_circle.get(key)
            if isinstance(value, list):
                value_text = "、".join(str(item).strip() for item in value if str(item).strip())
            else:
                value_text = str(value or "").strip()
            if value_text:
                parts.append(value_text)
        return "；".join(parts)

    def _main_value(self, value: Any) -> str:
        if isinstance(value, dict):
            return str(value.get("main") or value.get("type") or value.get("name") or "").strip()
        if isinstance(value, list):
            return "、".join(str(item).strip() for item in value if str(item).strip())
        return str(value or "").strip()

    def _safe_source_type(self, value: Any) -> str:
        source_type = str(value or "user_painted").strip()
        allowed = {
            "user_painted",
            "blank_space",
            "template_line",
            "therapist_marker",
            "uncertain",
        }
        return source_type if source_type in allowed else "uncertain"

    def _include_visual_unit(self, unit: dict[str, Any]) -> bool:
        explicit = unit.get("include_in_interpretation")
        if isinstance(explicit, bool):
            return explicit
        return self._safe_source_type(unit.get("source_type")) in {"user_painted", "blank_space"}

    def _safe_confidence(self, value: Any) -> str:
        confidence = str(value or "medium").strip().lower()
        return confidence if confidence in {"high", "medium", "low"} else "medium"

    def _safe_size_tendency(self, value: Any) -> str:
        size_tendency = str(value or "unknown").strip().lower()
        allowed = {"large", "medium", "small", "scattered", "unknown"}
        return size_tendency if size_tendency in allowed else "unknown"

    def _excluded_marks(self, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []
        marks = []
        for index, item in enumerate(value):
            if isinstance(item, dict):
                marks.append(
                    {
                        "id": str(item.get("id") or f"excluded-{index + 1:03d}").strip(),
                        "source_type": self._safe_source_type(item.get("source_type")),
                        "reason": str(item.get("reason") or item.get("exclude_reason") or "").strip(),
                        "visible_evidence": str(item.get("visible_evidence") or item.get("evidence") or "").strip(),
                    }
                )
            elif str(item).strip():
                marks.append(
                    {
                        "id": f"excluded-{index + 1:03d}",
                        "source_type": "uncertain",
                        "reason": str(item).strip(),
                        "visible_evidence": str(item).strip(),
                    }
                )
        return marks

    def _string_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    def _safe_entry_circle(self, value: Any) -> str:
        circle = str(value or "").strip().lower()
        return circle if circle in {"inner", "middle", "outer"} else "inner"

    def _safe_narrative_order(self, value: Any, entry_circle: str) -> list[str]:
        valid = ["inner", "middle", "outer"]
        order = []
        if isinstance(value, list):
            for item in value:
                circle = str(item or "").strip().lower()
                if circle in valid and circle not in order:
                    order.append(circle)
        if entry_circle in valid and entry_circle not in order:
            order.insert(0, entry_circle)
        for circle in valid:
            if circle not in order:
                order.append(circle)
        return order

    def _build_stage04(self, stage03: dict[str, Any]) -> dict[str, Any]:
        evidence_refs = self._visual_unit_refs(stage03)
        return {
            "stage": "stage-04-direct-judgment-high-hit-check",
            "status": "complete",
            "hits": [],
            "non_hits": [],
            "uncertain_items": [],
            "conflicts": [],
            "summary": "MVP 首轮只记录直断互验入口，不强行判定高命中模式。",
            "evidence_refs": evidence_refs,
        }

    def _build_execution_trace(self, stage_outputs: dict[str, Any]) -> list[dict[str, Any]]:
        trace = []
        for block in EXECUTION_BLOCKS:
            stage_keys = list(block["stage_keys"])
            trace.append(
                {
                    "block_id": block["block_id"],
                    "stage_keys": stage_keys,
                    "status": "complete"
                    if all(stage_outputs.get(stage_key, {}).get("status") for stage_key in stage_keys)
                    else "incomplete",
                }
            )
        return trace

    def _build_report_context_package(
        self,
        *,
        agent_input: MandalaAgentInput,
        stage_outputs: dict[str, Any],
        final_report: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "report_id": final_report["report_id"],
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "visual_observation": stage_outputs["stage-03-visual-evidence"],
            "circle_interpretation": stage_outputs["stage-05-per-circle-color-shape-element-sensing"],
            "five_element_interpretation": stage_outputs["stage-06-per-circle-element-generation-control"],
            "theme_interpretation": {
                "theme": agent_input.user_context.theme,
                "theme_label": agent_input.user_context.theme_label,
                "route": stage_outputs["stage-12-healing-direction-and-report-branching"].get("theme_route", {}),
            },
            "core_thesis": stage_outputs["stage-10-core-thesis-selection"]["core_thesis"],
            "healing_direction": stage_outputs["stage-12-healing-direction-and-report-branching"]["healing_direction"],
            "final_report": final_report,
            "evidence_map": stage_outputs["stage-09-evidence-consolidation"]["evidence_map"],
            "boundaries": agent_input.circle_boundaries,
            "permissions": {
                "can_answer_follow_up": False,
                "post_mvp_agent": "report_qa_agent",
                "allow_seeded_short_report": bool(
                    getattr(self.llm_client, "allow_seeded_short_report", False)
                ),
            },
        }

    def _vision_prompt(
        self,
        *,
        agent_input: MandalaAgentInput,
    ) -> str:
        return render_prompt_template(
            "vision/observe.md",
            circle_boundaries_json=json.dumps(agent_input.circle_boundaries, ensure_ascii=False),
        )

    def _vision_image_paths(self, agent_input: MandalaAgentInput) -> list[str]:
        paths = [agent_input.image.local_path]
        if agent_input.image.marked_local_path:
            paths.append(agent_input.image.marked_local_path)
        return paths

    def _thesis_prompt(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> str:
        payload = {
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "knowledge_pack": {
                "pack_id": knowledge_pack.get("pack_id"),
                "theme": knowledge_pack.get("theme"),
            },
            "stage_outputs": {
                key: stage_outputs[key]
                for key in STAGE_KEYS[:10]
                if key in stage_outputs
            },
        }
        return render_prompt_template(
            "thesis/select.md",
            payload_json=json.dumps(payload, ensure_ascii=False, indent=2),
        )

    def _report_prompt(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> str:
        payload = {
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "output_requirements": agent_input.output_requirements.to_dict(),
            "knowledge_pack": {
                "pack_id": knowledge_pack.get("pack_id"),
                "theme": knowledge_pack.get("theme"),
            },
            "writing_inputs": {
                "visual": stage_outputs["stage-03-visual-evidence"],
                "circle_interpretation": stage_outputs["stage-05-per-circle-color-shape-element-sensing"],
                "five_element": stage_outputs["stage-06-per-circle-element-generation-control"],
                "core_thesis": stage_outputs["stage-10-core-thesis-selection"],
                "framing": stage_outputs["stage-11-user-facing-framing"],
                "healing": stage_outputs["stage-12-healing-direction-and-report-branching"],
                "theme_route": stage_outputs["stage-12-healing-direction-and-report-branching"].get("theme_route", {}),
            },
        }
        report_structure_map = load_prompt_config("report/config.json")
        report_structure = load_prompt_template(report_structure_map[agent_input.report_mode])
        return render_prompt_template(
            "report/write.md",
            report_structure=report_structure,
            payload_json=json.dumps(payload, ensure_ascii=False, indent=2),
        )

    def _build_theme_route(
        self,
        *,
        agent_input: MandalaAgentInput,
        stage_outputs: dict[str, Any],
    ) -> dict[str, Any]:
        if agent_input.user_context.theme != "wealth":
            return {"theme": agent_input.user_context.theme, "status": "not_applicable"}

        runtime = get_wealth_report_runtime()
        route = runtime.route_visual_observations(
            stage_outputs["stage-03-visual-evidence"],
            report_mode=agent_input.report_mode,
        )
        clauses = [
            self._compact_clause(runtime.get_clause(clause_id))
            for clause_id in route.selected_clause_ids
        ]
        modules = [
            self._compact_module(runtime.get_module(module_id))
            for module_id in route.selected_module_ids
        ]
        return {
            "theme": "wealth",
            "status": "matched",
            "selected_signal_ids": list(route.selected_signal_ids),
            "selected_clause_ids": list(route.selected_clause_ids),
            "selected_module_ids": list(route.selected_module_ids),
            "next_exploration_recommendations": list(route.selected_next_explorations),
            "clauses": [clause for clause in clauses if clause],
            "modules": [module for module in modules if module],
            "boundaries": list(route.boundaries),
        }

    def _compact_clause(self, clause: dict[str, Any]) -> dict[str, Any]:
        if not clause:
            return {}
        return {
            "id": clause.get("id"),
            "title": clause.get("title"),
            "summary": clause.get("summary"),
            "report_language": clause.get("report_language", [])[:2],
            "healing_direction": clause.get("healing_direction", [])[:3],
            "source_status": (
                clause.get("provenance", {}).get("source_status")
                if isinstance(clause.get("provenance"), dict)
                else None
            ),
        }

    def _compact_module(self, module: dict[str, Any]) -> dict[str, Any]:
        if not module:
            return {}
        return {
            "module_id": module.get("module_id"),
            "title": module.get("title"),
            "status": module.get("status"),
            "report_use": module.get("report_use"),
            "output_strength": module.get("output_strength"),
        }

    def _vision_schema(self) -> dict[str, Any]:
        visual_unit_schema = {
            "type": "object",
            "required": [
                "id",
                "position",
                "source_type",
                "include_in_interpretation",
                "color",
                "color_confidence",
                "shape",
                "size_tendency",
                "adjacency",
                "is_blank_space",
                "metal_candidate",
                "visible_evidence",
                "confidence",
            ],
            "properties": {
                "id": {"type": "string"},
                "position": {"type": "string"},
                "source_type": {
                    "type": "string",
                    "enum": [
                        "user_painted",
                        "blank_space",
                        "template_line",
                        "therapist_marker",
                        "uncertain",
                    ],
                },
                "include_in_interpretation": {"type": "boolean"},
                "exclude_reason": {"type": "string"},
                "color": {"type": "string"},
                "color_confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                },
                "shape": {"type": "string"},
                "size_tendency": {
                    "type": "string",
                    "enum": ["large", "medium", "small", "scattered", "unknown"],
                },
                "adjacency": {"type": "array", "items": {"type": "string"}},
                "is_blank_space": {"type": "boolean"},
                "metal_candidate": {"type": "boolean"},
                "visible_evidence": {"type": "string"},
                "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                },
            },
        }
        circle_schema = {
            "type": "object",
            "required": ["summary", "visual_units"],
            "properties": {
                "summary": {"type": "string"},
                "visual_units": {
                    "type": "array",
                    "items": visual_unit_schema,
                    "minItems": 1,
                },
            },
        }
        return {
            "type": "object",
            "required": [
                "global_visual_summary",
                "circles",
                "evidence_summary",
                "excluded_marks",
                "uncertainties",
            ],
            "properties": {
                "global_visual_summary": {"type": "string"},
                "circles": {
                    "type": "object",
                    "required": ["inner", "middle", "outer"],
                    "properties": {
                        "inner": circle_schema,
                        "middle": circle_schema,
                        "outer": circle_schema,
                    },
                },
                "evidence_summary": {"type": "array", "items": {"type": "string"}},
                "excluded_marks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "source_type": {"type": "string"},
                            "reason": {"type": "string"},
                            "visible_evidence": {"type": "string"},
                        },
                    },
                },
                "uncertainties": {"type": "array", "items": {"type": "string"}},
            },
        }

    def _parse_json_text(self, text: str | None) -> dict[str, Any] | None:
        if not text:
            return None
        stripped = text.strip()
        if stripped.startswith("```"):
            stripped = stripped.strip("`")
            if stripped.startswith("json"):
                stripped = stripped[4:].strip()
        try:
            parsed = json.loads(stripped)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None

    def _collect_values(self, circle: dict[str, Any], field_name: str) -> list[str]:
        values: list[str] = []
        for unit in circle.get("visual_units", []):
            if isinstance(unit, dict):
                value = str(unit.get(field_name) or "").strip()
                if value and value not in values:
                    values.append(value)
        return values

    def _collect_interpretable_values(self, circle: dict[str, Any], field_name: str) -> list[str]:
        values: list[str] = []
        for unit in self._interpretable_visual_units(circle):
            value = str(unit.get(field_name) or "").strip()
            if value and value not in values:
                values.append(value)
        return values

    def _interpretable_visual_units(self, circle: dict[str, Any]) -> list[dict[str, Any]]:
        units = circle.get("visual_units", [])
        if not isinstance(units, list):
            return []
        return [
            unit
            for unit in units
            if isinstance(unit, dict) and unit.get("include_in_interpretation") is not False
        ]

    def _five_element_profile(self, per_circle: dict[str, Any]) -> dict[str, Any]:
        circle_profiles: dict[str, Any] = {}
        element_counts: dict[str, int] = {element: 0 for element in ELEMENT_LABELS}
        for circle_key, circle_payload in per_circle.items():
            element_signals = self._element_signals_for_circle(circle_key, circle_payload)
            present_elements = []
            for signal in element_signals:
                element_key = str(signal.get("element") or "")
                if element_key in ELEMENT_LABELS and element_key not in present_elements:
                    present_elements.append(element_key)
                    element_counts[element_key] += 1
            circle_profiles[circle_key] = {
                "circle": circle_key,
                "element_signals": element_signals,
                "present_elements": [
                    {"element": element_key, "label": ELEMENT_LABELS[element_key]}
                    for element_key in present_elements
                ],
                "intra_circle_relations": self._intra_circle_relations(present_elements),
                "evidence": {
                    "colors": circle_payload.get("dominant_colors", []),
                    "shapes": circle_payload.get("dominant_shapes", []),
                    "summary": circle_payload.get("visual_summary", ""),
                },
                "interpretation_hint": self._element_circle_hint(
                    circle_key,
                    element_signals,
                    present_elements,
                ),
                "scope_note": "仅解释本圈内部视觉元素及同圈生克候选，不给整圈贴单一五行标签。",
            }
        dominant_elements = [
            {
                "element": element_key,
                "label": ELEMENT_LABELS[element_key],
                "score": score,
            }
            for element_key, score in sorted(
                element_counts.items(),
                key=lambda item: item[1],
                reverse=True,
            )
            if score > 0
        ]
        return {
            "scope": "intra_circle_visual_elements",
            "per_circle": circle_profiles,
            "dominant_elements": dominant_elements,
            "report_language": self._five_element_report_language(circle_profiles),
            "intra_circle_rule": "五行生克只用于同一圈内部已经识别出的视觉元素之间。",
            "cross_circle_rule": "三圈联动分析使用圈层结构，不使用五行生克。",
        }

    def _element_signals_for_circle(
        self,
        circle_key: str,
        circle_payload: dict[str, Any],
    ) -> list[dict[str, Any]]:
        signals: list[dict[str, Any]] = []
        for unit in circle_payload.get("visual_units", []):
            if not isinstance(unit, dict):
                continue
            if unit.get("include_in_interpretation") is False:
                continue
            unit_id = str(unit.get("id") or f"{circle_key}-unit").strip()
            source_values = [
                ("color", str(unit.get("color") or "")),
                ("shape", str(unit.get("shape") or "")),
                ("evidence", str(unit.get("visible_evidence") or "")),
            ]
            for source_type, value in source_values:
                for element_key in self._elements_for_text(value):
                    signal = {
                        "unit_id": unit_id,
                        "element": element_key,
                        "label": ELEMENT_LABELS[element_key],
                        "source_type": source_type,
                        "evidence": value,
                        "hint": ELEMENT_RULES[element_key]["hint"],
                    }
                    if signal not in signals:
                        signals.append(signal)
        if not signals:
            summary = str(circle_payload.get("visual_summary") or "")
            for element_key in self._elements_for_text(summary):
                signal = {
                    "unit_id": f"{circle_key}-summary",
                    "element": element_key,
                    "label": ELEMENT_LABELS[element_key],
                    "source_type": "summary",
                    "evidence": summary,
                    "hint": ELEMENT_RULES[element_key]["hint"],
                }
                if signal not in signals:
                    signals.append(signal)
        return signals

    def _elements_for_text(self, text: str) -> list[str]:
        normalized = text.lower()
        matches: list[str] = []
        for element_key, rule in ELEMENT_RULES.items():
            if any(term.lower() in normalized for term in rule["terms"]):
                matches.append(element_key)
        return matches

    def _intra_circle_relations(self, elements: list[str]) -> list[dict[str, Any]]:
        relations: list[dict[str, Any]] = []
        present = set(elements)
        for source, target in GENERATES.items():
            if source in present and target in present:
                relations.append(
                    {
                        "type": "generate",
                        "label": f"{ELEMENT_LABELS[source]}生{ELEMENT_LABELS[target]}",
                        "source_element": source,
                        "target_element": target,
                        "scope_note": "同圈元素关系候选，需结合面积、相邻程度和形状强弱判断。",
                    }
                )
        for source, target in CONTROLS.items():
            if source in present and target in present:
                relations.append(
                    {
                        "type": "control",
                        "label": f"{ELEMENT_LABELS[source]}克{ELEMENT_LABELS[target]}",
                        "source_element": source,
                        "target_element": target,
                        "scope_note": "同圈元素关系候选，需结合面积、相邻程度和形状强弱判断。",
                    }
                )
        return relations

    def _element_circle_hint(
        self,
        circle_key: str,
        element_signals: list[dict[str, Any]],
        present_elements: list[str],
    ) -> str:
        if not element_signals:
            return "当前圈层的五行信号不足，报告只能保留为待确认线索。"
        circle_names = {
            "inner": "内圈本源层",
            "middle": "中圈情绪层",
            "outer": "外圈现实层",
        }
        labels = "、".join(ELEMENT_LABELS[element] for element in present_elements)
        relation_labels = "、".join(
            relation["label"] for relation in self._intra_circle_relations(present_elements)
        )
        relation_text = f"；同圈关系候选包括{relation_labels}" if relation_labels else ""
        return (
            f"{circle_names.get(circle_key, circle_key)}内识别到{labels}等元素信号，"
            f"需按圈内元素组合与相邻关系解读{relation_text}。"
        )

    def _five_element_report_language(self, circle_profiles: dict[str, Any]) -> list[str]:
        lines = []
        for circle_key in ["inner", "middle", "outer"]:
            profile = circle_profiles.get(circle_key)
            if not isinstance(profile, dict):
                continue
            hint = str(profile.get("interpretation_hint") or "").strip()
            if hint:
                lines.append(hint)
        return lines

    def _knowledge_refs_for_circle(
        self,
        circle_key: str,
        knowledge_pack: dict[str, Any],
    ) -> list[str]:
        theme = str(knowledge_pack.get("theme") or "general")
        return [
            f"circle.{circle_key}",
            "elements.color_meanings",
            "elements.five_elements",
            f"themes.{theme}",
        ]

    def _imbalance_candidates(self, per_circle: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = []
        for circle_key, circle_payload in per_circle.items():
            colors = circle_payload.get("dominant_colors", [])
            candidates.append(
                {
                    "circle": circle_key,
                    "candidate": "needs_human_review",
                    "basis": colors,
                }
            )
        return candidates

    def _visual_unit_refs(self, stage03: dict[str, Any]) -> list[str]:
        refs: list[str] = []
        circles = stage03.get("circles", {})
        if not isinstance(circles, dict):
            return refs
        for circle in circles.values():
            if not isinstance(circle, dict):
                continue
            for unit in circle.get("visual_units", []):
                if isinstance(unit, dict):
                    ref = str(unit.get("id") or "").strip()
                    if ref and ref not in refs:
                        refs.append(ref)
        return refs

    def _evidence_map(self, stage03: dict[str, Any]) -> list[dict[str, Any]]:
        evidence = []
        circles = stage03.get("circles", {})
        if not isinstance(circles, dict):
            return evidence
        for circle_key, circle in circles.items():
            if not isinstance(circle, dict):
                continue
            for unit in circle.get("visual_units", []):
                if not isinstance(unit, dict):
                    continue
                evidence.append(
                    {
                        "id": str(unit.get("id") or "").strip(),
                        "circle": circle_key,
                        "visible_evidence": str(
                            unit.get("visible_evidence")
                            or unit.get("description")
                            or ""
                        ).strip(),
                    }
                )
        return evidence
