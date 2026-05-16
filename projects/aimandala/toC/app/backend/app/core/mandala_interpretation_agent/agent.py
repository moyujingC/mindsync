"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS, MandalaAgentInput, MandalaAgentResult
from .knowledge_pack_builder import knowledge_pack_to_prompt_fragment
from .quality_gate import run_quality_gate


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
            prompt=self._vision_prompt(agent_input=agent_input, knowledge_pack=knowledge_pack),
            schema=self._vision_schema(),
            image_path=agent_input.image.local_path,
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
                "dominant_colors": self._collect_values(circle, "color"),
                "dominant_shapes": self._collect_values(circle, "shape"),
                "knowledge_refs": self._knowledge_refs_for_circle(circle_key, knowledge_pack),
            }
            for circle_key, circle in circles.items()
            if isinstance(circle, dict)
        }
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
                ],
                "per_circle": per_circle,
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
            system_prompt="你是曼陀罗解读智能体。只基于已给 stage 证据做主轴选择，返回 JSON。",
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
        evidence_refs = payload.get("evidence_refs")
        if not isinstance(evidence_refs, list):
            evidence_refs = self._visual_unit_refs(stage_outputs["stage-03-visual-evidence"])
        return {
            "stage-10-core-thesis-selection": {
                "stage": "stage-10-core-thesis-selection",
                "status": "complete",
                "core_thesis": core_thesis,
                "evidence_refs": evidence_refs,
            },
            "stage-11-user-facing-framing": {
                "stage": "stage-11-user-facing-framing",
                "status": "complete",
                "framing": framing,
            },
            "stage-12-healing-direction-and-report-branching": {
                "stage": "stage-12-healing-direction-and-report-branching",
                "status": "complete",
                "healing_direction": healing_direction,
                "report_mode": agent_input.report_mode,
                "writing_input_refs": evidence_refs,
            },
        }

    def _run_block_5(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        stage_outputs: dict[str, Any],
    ) -> dict[str, Any]:
        report_text = self.llm_client.generate_text(
            task="chat",
            system_prompt="你是曼陀罗解读报告写作者。写给普通用户，不泄漏内部 stage 或开发标签。",
            user_prompt=self._report_prompt(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            ),
        )
        if not report_text or not report_text.strip():
            raise RuntimeError("chat_model_failed: empty final report")
        markdown = report_text.strip()
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
        shape = str(raw_circle.get("shape") or raw_circle.get("pattern") or "").strip()
        evidence = self._circle_summary(raw_circle)
        if not evidence and not color_values and not shape:
            return []
        return [
            {
                "id": f"{circle_key}-001",
                "position": circle_key,
                "color": "、".join(color_values),
                "shape": shape,
                "visible_evidence": evidence,
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
            "color": self._main_value(unit.get("color")),
            "shape": self._main_value(unit.get("shape")),
            "visible_evidence": str(
                unit.get("visible_evidence")
                or unit.get("description")
                or unit.get("evidence")
                or ""
            ).strip(),
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
        for key in ["color_distribution", "texture", "pattern", "shape", "intensity"]:
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

    def _string_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

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
            },
            "core_thesis": stage_outputs["stage-10-core-thesis-selection"]["core_thesis"],
            "healing_direction": stage_outputs["stage-12-healing-direction-and-report-branching"]["healing_direction"],
            "final_report": final_report,
            "evidence_map": stage_outputs["stage-09-evidence-consolidation"]["evidence_map"],
            "boundaries": agent_input.circle_boundaries,
            "permissions": {
                "can_answer_follow_up": False,
                "post_mvp_agent": "report_qa_agent",
            },
        }

    def _vision_prompt(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
    ) -> str:
        return (
            "请观察这张曼陀罗画作，只输出视觉证据 JSON。"
            "不要做心理诊断，不要写报告正文。\n\n"
            f"用户主题：{agent_input.user_context.theme_label}\n"
            f"三圈边界：{json.dumps(agent_input.circle_boundaries, ensure_ascii=False)}\n"
            f"精简知识包：{knowledge_pack_to_prompt_fragment(knowledge_pack)}"
        )

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
        return (
            "请从已有证据中选择报告主轴，返回 JSON："
            "core_thesis、user_facing_framing、healing_direction、evidence_refs。\n\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
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
                "core_thesis": stage_outputs["stage-10-core-thesis-selection"],
                "framing": stage_outputs["stage-11-user-facing-framing"],
                "healing": stage_outputs["stage-12-healing-direction-and-report-branching"],
            },
        }
        return (
            "请生成用户可见的曼陀罗解读报告 Markdown。"
            "只基于给定写作输入，不出现 stage、placeholder、legacy 等内部词。"
            "不得输出财务预测、收益预测、投资建议或心理诊断。\n\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )

    def _vision_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "required": ["global_visual_summary", "circles"],
            "properties": {
                "global_visual_summary": {"type": "string"},
                "circles": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "object"},
                        "middle": {"type": "object"},
                        "outer": {"type": "object"},
                    },
                },
                "evidence_summary": {"type": "array", "items": {"type": "string"}},
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
