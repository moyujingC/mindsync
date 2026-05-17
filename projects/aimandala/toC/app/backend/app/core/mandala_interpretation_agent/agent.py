"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from app.core.wealth_report import get_wealth_report_runtime

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS, MandalaAgentInput, MandalaAgentResult
from .knowledge_pack_builder import knowledge_pack_to_prompt_fragment
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
                "visual_units": list(circle.get("visual_units", [])) if isinstance(circle.get("visual_units"), list) else [],
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
        theme_route = self._build_theme_route(
            agent_input=agent_input,
            stage_outputs=stage_outputs,
        )
        return {
            "stage-10-core-thesis-selection": {
                "stage": "stage-10-core-thesis-selection",
                "status": "complete",
                "core_thesis": core_thesis,
                "evidence_refs": evidence_refs,
                "theme_route": theme_route,
            },
            "stage-11-user-facing-framing": {
                "stage": "stage-11-user-facing-framing",
                "status": "complete",
                "framing": framing,
                "theme_route": theme_route,
            },
            "stage-12-healing-direction-and-report-branching": {
                "stage": "stage-12-healing-direction-and-report-branching",
                "status": "complete",
                "healing_direction": healing_direction,
                "report_mode": agent_input.report_mode,
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
            system_prompt="你是曼陀罗解读报告写作者。写给普通用户，不泄漏内部 stage 或开发标签。",
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
                system_prompt="你是曼陀罗解读报告写作者。请严格修正报告结构问题。",
                user_prompt=(
                    f"{report_prompt}\n\n"
                    "上一次报告未满足以下要求，请重写完整报告，不要解释原因：\n"
                    f"{json.dumps(draft_issues, ensure_ascii=False)}\n\n"
                    f"上一次报告：\n{markdown}"
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
                "circle_interpretation": stage_outputs["stage-05-per-circle-color-shape-element-sensing"],
                "five_element": stage_outputs["stage-06-per-circle-element-generation-control"],
                "core_thesis": stage_outputs["stage-10-core-thesis-selection"],
                "framing": stage_outputs["stage-11-user-facing-framing"],
                "healing": stage_outputs["stage-12-healing-direction-and-report-branching"],
                "theme_route": stage_outputs["stage-12-healing-direction-and-report-branching"].get("theme_route", {}),
            },
        }
        report_structure = self._report_structure_instruction(agent_input.report_mode)
        return (
            "请生成用户可见的曼陀罗解读报告 Markdown。"
            "只基于给定写作输入，不出现 stage、placeholder、legacy 等内部词。"
            "不得输出财务预测、收益预测、投资建议或心理诊断。"
            "不要用“好的”“这是为你生成的报告”“亲爱的朋友”等寒暄式开头。"
            "标题必须明确包含“财富议题”。"
            "报告必须显性呈现五行分析过程，至少写出两个圈内视觉元素（金、木、水、火、土）及其画面依据。"
            "五行分析不是给整圈判定五行，而是分析某一圈内部颜色、形状、面积、相邻元素分别对应的五行。"
            "同一圈内部的元素之间可以分析五行生克，但必须说明是圈内元素关系候选。"
            "五行感知段优先写“某个元素/某个颜色/某个形状对应什么五行”，不要先写“某一圈属什么”。"
            "写作顺序优先先写元素，再写圈层，再写圈内关系候选。"
            "三圈联动只能写内圈本源层、中圈情绪层、外圈现实层之间的承接关系，不能写跨圈五行生克。"
            "财富核心解读和三圈分层解读不得把某一圈的五行与另一圈的五行做因果、拉扯、互相影响或能量通道解释。"
            "不要写“内圈属水”“中圈属木”“外圈呈现土性”这类整圈五行标签。"
            "财富核心解读段不要出现木火土金水、五行、生克、元素这些方法术语，只做财富议题翻译。"
            "提及家庭、关系、身体或事业等浮现议题时，只能写成可观察线索或待验证假设，不能写成确定根因。"
            f"{report_structure}\n\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )

    def _report_structure_instruction(self, report_mode: str) -> str:
        if report_mode == "pro":
            return (
                "Pro 版结构固定为 7 段："
                "1. 标题；"
                "2. 画面证据总览，至少写 3 条可见画面依据；"
                "3. 圈内元素五行感知，分别写内圈、中圈、外圈内部有哪些元素信号及同圈生克候选；"
                "4. 财富核心主轴，用一句话说明金钱、价值、资源或交换机制；"
                "5. 三圈分层解读，分别连接内圈、中圈、外圈到财富议题，但不要使用五行生克；"
                "6. 浮现议题回译，把情绪、关系、家庭、身体或事业线索拉回财富主线；"
                "7. 低风险行动建议，给 2 到 3 个可执行觉察动作。"
                "总长度控制在 1300 到 2000 个中文字符。"
            )
        return (
            "Lite 版结构固定为 5 段："
            "1. 标题；"
            "2. 画面证据速写，至少写 2 条可见画面依据；"
            "3. 五行感知，用 1 段说明最明显的圈内元素五行和同圈关系候选；"
            "4. 财富核心解读，用一句话说明主要财富卡点或优势；"
            "5. 一个温和行动建议。"
            "总长度控制在 600 到 1300 个中文字符。"
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
