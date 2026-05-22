"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
import re
from typing import Any
from uuid import uuid4

from app.core.wealth_report import get_wealth_report_runtime

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS, MandalaAgentInput, MandalaAgentResult
from .prompt_loader import load_prompt_config, load_prompt_template, render_prompt_template
from .quality_gate import GENERIC_OPENING_PHRASES, run_quality_gate


class MandalaInterpretationAgent:
    """Generate mandala interpretation artifacts through the current agent path."""

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
        stage_outputs.update(self._build_input_context(agent_input=agent_input))
        stage_outputs["foundation-image-reading"] = self.run_foundation_image_reading(
            agent_input=agent_input,
        )
        stage_outputs["theme-translation-route"] = self._build_theme_route_stage(
            agent_input=agent_input,
            foundation_image_reading=stage_outputs["foundation-image-reading"],
        )
        stage_outputs.update(
            self._run_thesis_and_framing(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            )
        )
        stage_outputs.update(
            self._run_report_writing(
                agent_input=agent_input,
                knowledge_pack=knowledge_pack,
                stage_outputs=stage_outputs,
            )
        )

        final_report = stage_outputs["final-report-assembly"]["final_report"]
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

    def _build_input_context(self, *, agent_input: MandalaAgentInput) -> dict[str, Any]:
        return {
            "input-context": {
                "stage": "input-context",
                "status": "complete",
                "report_mode": agent_input.report_mode,
                "image": agent_input.image.to_dict(),
                "agent_version": agent_input.agent_version,
            },
            "user-input-context": {
                "stage": "user-input-context",
                "status": "complete",
                "user_context": agent_input.user_context.to_dict(),
            },
            "circle-boundary-context": {
                "stage": "circle-boundary-context",
                "status": "complete",
                "circle_boundaries": agent_input.circle_boundaries,
            },
        }

    def run_foundation_image_reading(
        self,
        *,
        agent_input: MandalaAgentInput,
    ) -> dict[str, Any]:
        visual_payload = self.llm_client.generate_structured(
            task="vision",
            prompt=self._visual_observation_prompt(),
            schema=self._visual_observation_schema(),
            image_paths=self._vision_image_paths(agent_input),
        )
        if not isinstance(visual_payload, dict):
            error_detail = {
                "last_error_detail": getattr(self.llm_client, "last_error_detail", {}),
                "last_attempt_trace": getattr(self.llm_client, "last_attempt_trace", []),
            }
            raise RuntimeError(
                "vision_model_failed: empty or invalid visual_observation payload "
                f"{json.dumps(error_detail, ensure_ascii=False)}"
            )
        visual_observation = self._extract_visual_observation(visual_payload)
        vision_trace = list(getattr(self.llm_client, "last_attempt_trace", []))
        foundation_analysis = self._run_foundation_analysis_from_visual(
            visual_observation=visual_observation,
        )
        analysis_trace = list(getattr(self.llm_client, "last_attempt_trace", []))
        return self._normalize_foundation_image_reading(
            {
                "foundation_image_reading": {
                    "visual_observation": visual_observation,
                    **foundation_analysis,
                }
            },
            model_trace={
                "vision": vision_trace,
                "foundation_analysis": analysis_trace,
            },
        )

    def _run_foundation_analysis_from_visual(
        self,
        *,
        visual_observation: dict[str, Any],
    ) -> dict[str, Any]:
        text = self.llm_client.generate_text(
            task="chat",
            system_prompt=load_prompt_template("thesis/system.md"),
            user_prompt=render_prompt_template(
                "foundation/analyze_from_visual.md",
                visual_observation_json=json.dumps(
                    {"visual_observation": visual_observation},
                    ensure_ascii=False,
                    indent=2,
                ),
            ),
        )
        payload = self._parse_json_text(text) or {}
        return {
            "element_sensing": payload.get("element_sensing"),
            "intra_circle_relations": payload.get("intra_circle_relations"),
            "cross_circle_flow": payload.get("cross_circle_flow"),
        }

    def _build_theme_route_stage(
        self,
        *,
        agent_input: MandalaAgentInput,
        foundation_image_reading: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "stage": "theme-translation-route",
            "status": "complete",
            "theme": agent_input.user_context.theme,
            "route": self._build_theme_route(
                agent_input=agent_input,
                foundation_image_reading=foundation_image_reading,
            ),
        }

    def _run_thesis_and_framing(
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
            evidence_refs = self._visual_unit_refs(stage_outputs["foundation-image-reading"])
        theme_route = stage_outputs["theme-translation-route"].get("route", {})
        return {
            "report-thesis-selection": {
                "stage": "report-thesis-selection",
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
            "user-facing-framing": {
                "stage": "user-facing-framing",
                "status": "complete",
                "framing": framing,
                "entry_circle": entry_circle,
                "entry_signal": entry_signal,
                "entry_reason": entry_reason,
                "narrative_order": narrative_order,
                "integrated_context_threads": integrated_context_threads,
                "theme_route": theme_route,
            },
            "report-branching-plan": {
                "stage": "report-branching-plan",
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

    def _run_report_writing(
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
            "stage": "lite-report-draft",
            "status": "complete",
            "enabled": agent_input.report_mode == "lite",
            "markdown": markdown if agent_input.report_mode == "lite" else "",
        }
        pro_draft = {
            "stage": "pro-report-draft",
            "status": "complete",
            "enabled": agent_input.report_mode == "pro",
            "markdown": markdown if agent_input.report_mode == "pro" else "",
        }
        final_report = {
            "report_id": f"mandala-interpretation-{uuid4().hex[:12]}",
            "report_mode": agent_input.report_mode,
            "title": "曼陀罗解读报告",
            "markdown": markdown,
            "summary": stage_outputs["report-thesis-selection"]["core_thesis"],
        }
        return {
            "lite-report-draft": lite_draft,
            "pro-report-draft": pro_draft,
            "visual-assets": {
                "stage": "visual-assets",
                "status": "skipped",
                "reason": "mvp_no_image_generation",
            },
            "final-report-assembly": {
                "stage": "final-report-assembly",
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
        return "五行" in text and any(label in text for label in ["木", "火", "土", "金", "水"])

    def _normalize_foundation_image_reading(
        self,
        payload: dict[str, Any],
        *,
        model_trace: Any | None = None,
    ) -> dict[str, Any]:
        raw = payload.get("foundation_image_reading")
        foundation = raw if isinstance(raw, dict) else payload
        visual_observation = self._normalize_visual_observation(
            foundation.get("visual_observation")
        )
        unit_id_map = self._visual_unit_id_map(visual_observation)
        element_sensing = self._normalize_layered_payload(
            foundation.get("element_sensing"),
            default_list_key="element_candidates",
            unit_id_map=unit_id_map,
        )
        intra_circle_relations = self._normalize_layered_payload(
            foundation.get("intra_circle_relations"),
            default_list_key="relations",
            unit_id_map=unit_id_map,
        )
        cross_circle_flow = self._normalize_cross_circle_flow(
            foundation.get("cross_circle_flow")
        )
        normalized_foundation = {
            "visual_observation": visual_observation,
            "element_sensing": element_sensing,
            "intra_circle_relations": intra_circle_relations,
            "cross_circle_flow": cross_circle_flow,
        }
        normalized = {
            "stage": "foundation-image-reading",
            "status": "complete",
            "foundation_image_reading": {
                "visual_observation": visual_observation,
                "element_sensing": element_sensing,
                "intra_circle_relations": intra_circle_relations,
                "cross_circle_flow": cross_circle_flow,
                "evidence_links": self._normalize_evidence_links(
                    foundation.get("evidence_links"),
                    foundation=normalized_foundation,
                    unit_id_map=unit_id_map,
                ),
            },
            "model_trace": (
                model_trace
                if model_trace is not None
                else getattr(self.llm_client, "last_attempt_trace", [])
            ),
        }
        return normalized

    def _normalize_visual_observation(self, value: Any) -> dict[str, Any]:
        payload = value if isinstance(value, dict) else {}
        return {
            "overall_observation": self._object_or_empty(payload.get("overall_observation")),
            "three_circle_observation": self._object_or_empty(payload.get("three_circle_observation")),
            "circle_visual_units": self._normalize_circle_visual_units(
                payload.get("circle_visual_units")
            ),
        }

    def _extract_visual_observation(self, payload: dict[str, Any]) -> dict[str, Any]:
        raw = payload.get("visual_observation")
        if not isinstance(raw, dict):
            foundation = payload.get("foundation_image_reading")
            if isinstance(foundation, dict):
                raw = foundation.get("visual_observation")
        return self._normalize_visual_observation(raw)

    def _normalize_circle_visual_units(self, value: Any) -> dict[str, dict[str, Any]]:
        raw_circles = value if isinstance(value, dict) else {}
        normalized = {}
        for circle_key in ["inner", "middle", "outer"]:
            raw_circle = raw_circles.get(circle_key, {}) if isinstance(raw_circles, dict) else {}
            circle = raw_circle if isinstance(raw_circle, dict) else {}
            units = circle.get("visual_units", [])
            normalized_units = [
                self._normalize_visual_unit(circle_key, index, unit)
                for index, unit in enumerate(units)
                if isinstance(unit, dict)
            ] if isinstance(units, list) else []
            normalized[circle_key] = {
                "composition_description": str(circle.get("composition_description") or "").strip(),
                "visual_units": self._normalize_visual_unit_energy_ratios(
                    normalized_units
                ),
            }
        return normalized

    def _normalize_visual_unit(
        self,
        circle_key: str,
        index: int,
        unit: dict[str, Any],
    ) -> dict[str, Any]:
        source_type = str(unit.get("source_type") or "user_painted").strip()
        if source_type not in {"user_painted", "blank_space"}:
            source_type = "user_painted"
        unit_id = self._canonical_visual_unit_id(
            unit.get("id"),
            circle_key=circle_key,
            index=index,
        )
        return {
            "id": unit_id,
            "unit_name": str(unit.get("unit_name") or unit.get("name") or "").strip(),
            "position": str(unit.get("position") or circle_key).strip(),
            "source_type": source_type,
            "color_description": str(
                unit.get("color_description") or unit.get("color") or ""
            ).strip(),
            "shape_description": str(
                unit.get("shape_description") or unit.get("shape") or ""
            ).strip(),
            "texture_and_density": str(unit.get("texture_and_density") or "").strip(),
            "spatial_relations": str(
                unit.get("spatial_relations")
                or unit.get("adjacency")
                or ""
            ).strip(),
            "blank_space_role": str(unit.get("blank_space_role") or "").strip(),
            "energy_ratio_percent": self._safe_float(unit.get("energy_ratio_percent")),
            "rich_visual_description": str(
                unit.get("rich_visual_description")
                or unit.get("visible_evidence")
                or unit.get("description")
                or ""
            ).strip(),
        }

    def _normalize_visual_unit_energy_ratios(
        self,
        units: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not units:
            return []
        raw_values = [self._safe_float(unit.get("energy_ratio_percent")) for unit in units]
        total = sum(value for value in raw_values if value > 0)
        if total <= 0:
            equal_share = round(100 / len(units), 2)
            values = [equal_share for _unit in units]
        else:
            values = [round(max(value, 0) * 100 / total, 2) for value in raw_values]
        drift = round(100 - sum(values), 2)
        values[-1] = round(values[-1] + drift, 2)
        normalized = []
        for unit, value in zip(units, values):
            next_unit = dict(unit)
            next_unit["energy_ratio_percent"] = value
            normalized.append(next_unit)
        return normalized

    def _safe_float(self, value: Any) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def _visual_unit_id_map(self, visual_observation: dict[str, Any]) -> dict[str, str]:
        mapping: dict[str, str] = {}
        circles = (
            visual_observation.get("circle_visual_units")
            if isinstance(visual_observation, dict)
            else {}
        )
        if not isinstance(circles, dict):
            return mapping
        for circle_key, circle in circles.items():
            if not isinstance(circle, dict):
                continue
            units = circle.get("visual_units")
            if not isinstance(units, list):
                continue
            for index, unit in enumerate(units):
                if not isinstance(unit, dict):
                    continue
                canonical = self._canonical_visual_unit_id(
                    unit.get("id"),
                    circle_key=str(circle_key),
                    index=index,
                )
                raw = str(unit.get("id") or "").strip()
                if raw:
                    mapping[raw] = canonical
                mapping[canonical] = canonical
        return mapping

    def _canonical_visual_unit_id(
        self,
        value: Any,
        *,
        circle_key: str,
        index: int,
    ) -> str:
        fallback = f"{circle_key}-{index + 1:03d}"
        raw = str(value or "").strip()
        if not raw:
            return fallback
        normalized = raw.replace("_", "-")
        match = re.fullmatch(r"(inner|middle|outer)-0*(\d+)", normalized)
        if match:
            return f"{match.group(1)}-{int(match.group(2)):03d}"
        return normalized

    def _normalize_visual_unit_ref(
        self,
        value: Any,
        *,
        unit_id_map: dict[str, str],
    ) -> str:
        raw = str(value or "").strip()
        if not raw:
            return ""
        return unit_id_map.get(raw) or unit_id_map.get(raw.replace("_", "-")) or raw.replace("_", "-")

    def _normalize_layered_payload(
        self,
        value: Any,
        *,
        default_list_key: str,
        unit_id_map: dict[str, str] | None = None,
    ) -> dict[str, dict[str, Any]]:
        raw = value if isinstance(value, dict) else {}
        normalized = {}
        for circle_key in ["inner", "middle", "outer"]:
            circle = raw.get(circle_key, {}) if isinstance(raw, dict) else {}
            circle_payload = circle if isinstance(circle, dict) else {}
            items = circle_payload.get(default_list_key)
            normalized[circle_key] = {
                default_list_key: self._normalize_layer_items(
                    items,
                    default_list_key=default_list_key,
                    unit_id_map=unit_id_map or {},
                ),
                "summary": str(circle_payload.get("summary") or "").strip(),
            }
        return normalized

    def _normalize_layer_items(
        self,
        items: Any,
        *,
        default_list_key: str,
        unit_id_map: dict[str, str],
    ) -> list[Any]:
        if not isinstance(items, list):
            return []
        normalized_items: list[Any] = []
        for item in items:
            if not isinstance(item, dict):
                normalized_items.append(item)
                continue
            normalized = dict(item)
            if default_list_key == "element_candidates":
                normalized["basis"] = self._string_list(normalized.get("basis"))
                normalized["visual_unit_id"] = self._normalize_visual_unit_ref(
                    normalized.get("visual_unit_id"),
                    unit_id_map=unit_id_map,
                )
            elif default_list_key == "relations":
                normalized["involved_visual_unit_ids"] = [
                    self._normalize_visual_unit_ref(value, unit_id_map=unit_id_map)
                    for value in self._string_list(normalized.get("involved_visual_unit_ids"))
                ]
            normalized_items.append(normalized)
        return normalized_items

    def _normalize_cross_circle_flow(self, value: Any) -> dict[str, Any]:
        payload = value if isinstance(value, dict) else {}
        observations = payload.get("flow_observations")
        return {
            "flow_observations": observations if isinstance(observations, list) else [],
            "summary": str(payload.get("summary") or "").strip(),
        }

    def _normalize_evidence_links(
        self,
        value: Any,
        *,
        foundation: dict[str, Any],
        unit_id_map: dict[str, str],
    ) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return self._build_evidence_links_from_foundation(foundation)
        links = []
        for item in value:
            if not isinstance(item, dict):
                continue
            links.append(
                {
                    "claim_id": str(item.get("claim_id") or "").strip(),
                    "claim_type": str(item.get("claim_type") or "").strip(),
                    "claim_text": str(item.get("claim_text") or "").strip(),
                    "visual_unit_ids": [
                        self._normalize_visual_unit_ref(unit_id, unit_id_map=unit_id_map)
                        for unit_id in self._string_list(item.get("visual_unit_ids"))
                    ],
                    "circle_observation_refs": self._string_list(
                        item.get("circle_observation_refs")
                    ),
                    "evidence_text": str(item.get("evidence_text") or "").strip(),
                }
            )
        return links or self._build_evidence_links_from_foundation(foundation)

    def _build_evidence_links_from_foundation(
        self,
        foundation: dict[str, Any],
    ) -> list[dict[str, Any]]:
        links: list[dict[str, Any]] = []
        visual_units_by_id = self._visual_units_by_id(foundation)
        element_sensing = foundation.get("element_sensing") if isinstance(foundation, dict) else {}
        element_circles = element_sensing.items() if isinstance(element_sensing, dict) else []
        for circle_key, circle in element_circles:
            if not isinstance(circle, dict):
                continue
            candidates = circle.get("element_candidates")
            if not isinstance(candidates, list):
                continue
            for item in candidates:
                if not isinstance(item, dict):
                    continue
                unit_id = str(item.get("visual_unit_id") or "").strip()
                basis = "；".join(self._string_list(item.get("basis")))
                unit = visual_units_by_id.get(unit_id, {})
                links.append(
                    {
                        "claim_id": unit_id,
                        "claim_type": "element_sensing",
                        "claim_text": f"{unit_id} 五行候选为 {item.get('element', '')}。".strip(),
                        "visual_unit_ids": [unit_id] if unit_id else [],
                        "circle_observation_refs": [f"visual_observation.circle_visual_units.{circle_key}"],
                        "evidence_text": basis or str(unit.get("rich_visual_description") or "").strip(),
                    }
                )
        relations = foundation.get("intra_circle_relations") if isinstance(foundation, dict) else {}
        relation_circles = relations.items() if isinstance(relations, dict) else []
        for circle_key, circle in relation_circles:
            if not isinstance(circle, dict):
                continue
            circle_relations = circle.get("relations")
            if not isinstance(circle_relations, list):
                continue
            for item in circle_relations:
                if not isinstance(item, dict):
                    continue
                relation_id = str(item.get("relation_id") or "").strip()
                links.append(
                    {
                        "claim_id": relation_id,
                        "claim_type": "intra_circle_relation",
                        "claim_text": str(item.get("notes") or item.get("relation_type") or "").strip(),
                        "visual_unit_ids": self._string_list(item.get("involved_visual_unit_ids")),
                        "circle_observation_refs": [f"visual_observation.circle_visual_units.{circle_key}"],
                        "evidence_text": str(item.get("visible_basis") or "").strip(),
                    }
                )
        flow = foundation.get("cross_circle_flow") if isinstance(foundation, dict) else {}
        flow_observations = (
            flow.get("flow_observations")
            if isinstance(flow, dict)
            else []
        )
        if not isinstance(flow_observations, list):
            flow_observations = []
        for item in flow_observations:
            if not isinstance(item, dict):
                continue
            flow_id = str(item.get("flow_id") or "").strip()
            links.append(
                {
                    "claim_id": flow_id,
                    "claim_type": "cross_circle_flow",
                    "claim_text": str(item.get("flow_type") or "").strip(),
                    "visual_unit_ids": [],
                    "circle_observation_refs": ["visual_observation.three_circle_observation"],
                    "evidence_text": str(item.get("visual_basis") or "").strip(),
                }
            )
        return [link for link in links if link.get("claim_id") or link.get("evidence_text")]

    def _visual_units_by_id(self, foundation: dict[str, Any]) -> dict[str, dict[str, Any]]:
        units_by_id: dict[str, dict[str, Any]] = {}
        visual_observation = foundation.get("visual_observation") if isinstance(foundation, dict) else {}
        circles = (
            visual_observation.get("circle_visual_units")
            if isinstance(visual_observation, dict)
            else {}
        )
        if not isinstance(circles, dict):
            return units_by_id
        for circle in circles.values():
            if not isinstance(circle, dict):
                continue
            units = circle.get("visual_units")
            if not isinstance(units, list):
                continue
            for unit in units:
                if not isinstance(unit, dict):
                    continue
                unit_id = str(unit.get("id") or "").strip()
                if unit_id:
                    units_by_id[unit_id] = unit
        return units_by_id

    def _object_or_empty(self, value: Any) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

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
        foundation_image_reading = stage_outputs["foundation-image-reading"]
        return {
            "report_id": final_report["report_id"],
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "foundation_image_reading": foundation_image_reading,
            "visual_observation": foundation_image_reading["foundation_image_reading"]["visual_observation"],
            "element_sensing": foundation_image_reading["foundation_image_reading"]["element_sensing"],
            "intra_circle_relations": foundation_image_reading["foundation_image_reading"]["intra_circle_relations"],
            "cross_circle_flow": foundation_image_reading["foundation_image_reading"]["cross_circle_flow"],
            "theme_interpretation": {
                "theme": agent_input.user_context.theme,
                "theme_label": agent_input.user_context.theme_label,
                "route": stage_outputs["report-branching-plan"].get("theme_route", {}),
            },
            "core_thesis": stage_outputs["report-thesis-selection"]["core_thesis"],
            "healing_direction": stage_outputs["report-branching-plan"]["healing_direction"],
            "final_report": final_report,
            "evidence_map": self._evidence_map(foundation_image_reading),
            "boundaries": agent_input.circle_boundaries,
            "permissions": {
                "can_answer_follow_up": False,
                "post_mvp_agent": "report_qa_agent",
                "allow_seeded_short_report": bool(
                    getattr(self.llm_client, "allow_seeded_short_report", False)
                ),
            },
        }

    def _visual_observation_prompt(self) -> str:
        return load_prompt_template("vision/observe_visual.md")

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
            "foundation_image_reading": stage_outputs["foundation-image-reading"],
            "theme_translation_route": stage_outputs["theme-translation-route"],
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
        foundation_image_reading = stage_outputs["foundation-image-reading"]
        payload = {
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "output_requirements": agent_input.output_requirements.to_dict(),
            "knowledge_pack": {
                "pack_id": knowledge_pack.get("pack_id"),
                "theme": knowledge_pack.get("theme"),
            },
            "writing_inputs": {
                "foundation_image_reading": foundation_image_reading,
                "visual_observation": foundation_image_reading["foundation_image_reading"]["visual_observation"],
                "element_sensing": foundation_image_reading["foundation_image_reading"]["element_sensing"],
                "intra_circle_relations": foundation_image_reading["foundation_image_reading"]["intra_circle_relations"],
                "cross_circle_flow": foundation_image_reading["foundation_image_reading"]["cross_circle_flow"],
                "core_thesis": stage_outputs["report-thesis-selection"],
                "framing": stage_outputs["user-facing-framing"],
                "healing": stage_outputs["report-branching-plan"],
                "theme_route": stage_outputs["report-branching-plan"].get("theme_route", {}),
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
        foundation_image_reading: dict[str, Any],
    ) -> dict[str, Any]:
        if agent_input.user_context.theme != "wealth":
            return {"theme": agent_input.user_context.theme, "status": "not_applicable"}

        runtime = get_wealth_report_runtime()
        route = runtime.route_visual_observations(
            foundation_image_reading,
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

    def _visual_observation_schema(self) -> dict[str, Any]:
        visual_unit_schema = {
            "type": "object",
            "required": [
                "id",
                "unit_name",
                "position",
                "source_type",
                "color_description",
                "shape_description",
                "texture_and_density",
                "spatial_relations",
                "blank_space_role",
                "energy_ratio_percent",
                "rich_visual_description",
            ],
            "properties": {
                "id": {"type": "string"},
                "unit_name": {"type": "string"},
                "position": {"type": "string"},
                "source_type": {"type": "string", "enum": ["user_painted", "blank_space"]},
                "color_description": {"type": "string"},
                "shape_description": {"type": "string"},
                "texture_and_density": {"type": "string"},
                "spatial_relations": {"type": "string"},
                "blank_space_role": {"type": "string"},
                "energy_ratio_percent": {"type": "number"},
                "rich_visual_description": {"type": "string"},
            },
        }
        circle_visual_units_schema = {
            "type": "object",
            "required": ["composition_description", "visual_units"],
            "properties": {
                "composition_description": {"type": "string"},
                "visual_units": {
                    "type": "array",
                    "items": visual_unit_schema,
                    "minItems": 1,
                },
            },
        }
        return {
            "type": "object",
            "required": ["visual_observation"],
            "properties": {
                "visual_observation": {
                    "type": "object",
                    "required": [
                        "overall_observation",
                        "three_circle_observation",
                        "circle_visual_units",
                    ],
                    "properties": {
                        "overall_observation": {"type": "object"},
                        "three_circle_observation": {"type": "object"},
                        "circle_visual_units": {
                            "type": "object",
                            "required": ["inner", "middle", "outer"],
                            "properties": {
                                "inner": circle_visual_units_schema,
                                "middle": circle_visual_units_schema,
                                "outer": circle_visual_units_schema,
                            },
                        },
                    },
                },
            },
        }

    def _vision_schema(self) -> dict[str, Any]:
        visual_observation_schema = self._visual_observation_schema()["properties"]["visual_observation"]
        element_candidate_schema = {
            "type": "object",
            "required": ["visual_unit_id", "element", "basis", "confidence", "notes"],
            "properties": {
                "visual_unit_id": {"type": "string"},
                "element": {
                    "type": "string",
                    "enum": ["wood", "fire", "earth", "metal", "water", "ambiguous"],
                },
                "basis": {"type": "array", "items": {"type": "string"}},
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                "notes": {"type": "string"},
            },
        }
        element_circle_schema = {
            "type": "object",
            "required": ["element_candidates", "summary"],
            "properties": {
                "element_candidates": {
                    "type": "array",
                    "items": element_candidate_schema,
                },
                "summary": {"type": "string"},
            },
        }
        relation_schema = {
            "type": "object",
            "required": [
                "relation_id",
                "relation_type",
                "involved_visual_unit_ids",
                "visible_basis",
                "confidence",
                "notes",
            ],
            "properties": {
                "relation_id": {"type": "string"},
                "relation_type": {
                    "type": "string",
                    "enum": [
                        "generating",
                        "controlling",
                        "cut_by_metal",
                        "surrounded_by",
                        "separated_by_blank_space",
                        "rootless_wood",
                        "imbalance_candidate",
                        "blocked_cycle",
                        "insufficient_evidence",
                    ],
                },
                "involved_visual_unit_ids": {"type": "array", "items": {"type": "string"}},
                "visible_basis": {"type": "string"},
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                "notes": {"type": "string"},
            },
        }
        relation_circle_schema = {
            "type": "object",
            "required": ["relations", "summary"],
            "properties": {
                "relations": {"type": "array", "items": relation_schema},
                "summary": {"type": "string"},
            },
        }
        flow_schema = {
            "type": "object",
            "required": [
                "flow_id",
                "flow_type",
                "involved_circles",
                "visual_basis",
                "confidence",
            ],
            "properties": {
                "flow_id": {"type": "string"},
                "flow_type": {
                    "type": "string",
                    "enum": [
                        "continuous",
                        "interrupted",
                        "outward_expanding",
                        "inward_contracting",
                        "outer_layer_containing",
                        "outer_layer_scattered",
                        "middle_layer_blocked",
                        "inner_outer_mismatch",
                        "insufficient_evidence",
                    ],
                },
                "involved_circles": {"type": "array", "items": {"type": "string"}},
                "visual_basis": {"type": "string"},
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
            },
        }
        return {
            "type": "object",
            "required": ["foundation_image_reading"],
            "properties": {
                "foundation_image_reading": {
                    "type": "object",
                    "required": [
                        "visual_observation",
                        "element_sensing",
                        "intra_circle_relations",
                        "cross_circle_flow",
                    ],
                    "properties": {
                        "visual_observation": visual_observation_schema,
                        "element_sensing": {
                            "type": "object",
                            "required": ["inner", "middle", "outer"],
                            "properties": {
                                "inner": element_circle_schema,
                                "middle": element_circle_schema,
                                "outer": element_circle_schema,
                            },
                        },
                        "intra_circle_relations": {
                            "type": "object",
                            "required": ["inner", "middle", "outer"],
                            "properties": {
                                "inner": relation_circle_schema,
                                "middle": relation_circle_schema,
                                "outer": relation_circle_schema,
                            },
                        },
                        "cross_circle_flow": {
                            "type": "object",
                            "required": ["flow_observations", "summary"],
                            "properties": {
                                "flow_observations": {
                                    "type": "array",
                                    "items": flow_schema,
                                },
                                "summary": {"type": "string"},
                            },
                        },
                        "evidence_links": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": [
                                    "claim_id",
                                    "claim_type",
                                    "claim_text",
                                    "evidence_text",
                                ],
                                "properties": {
                                    "claim_id": {"type": "string"},
                                    "claim_type": {
                                        "type": "string",
                                        "enum": [
                                            "element_sensing",
                                            "intra_circle_relation",
                                            "cross_circle_flow",
                                        ],
                                    },
                                    "claim_text": {"type": "string"},
                                    "visual_unit_ids": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                    "circle_observation_refs": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                    "evidence_text": {"type": "string"},
                                },
                            },
                        },
                    },
                },
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

    def _visual_unit_refs(self, foundation_image_reading: dict[str, Any]) -> list[str]:
        refs: list[str] = []
        units_by_circle = (
            foundation_image_reading
            .get("foundation_image_reading", {})
            .get("visual_observation", {})
            .get("circle_visual_units", {})
        )
        if not isinstance(units_by_circle, dict):
            return refs
        for circle in units_by_circle.values():
            if not isinstance(circle, dict):
                continue
            for unit in circle.get("visual_units", []):
                if isinstance(unit, dict):
                    ref = str(unit.get("id") or "").strip()
                    if ref and ref not in refs:
                        refs.append(ref)
        return refs

    def _evidence_map(self, foundation_image_reading: dict[str, Any]) -> list[dict[str, Any]]:
        evidence = []
        units_by_circle = (
            foundation_image_reading
            .get("foundation_image_reading", {})
            .get("visual_observation", {})
            .get("circle_visual_units", {})
        )
        if not isinstance(units_by_circle, dict):
            return evidence
        for circle_key, circle in units_by_circle.items():
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
                            unit.get("rich_visual_description")
                            or unit.get("spatial_relations")
                            or unit.get("shape_description")
                            or ""
                        ).strip(),
                    }
                )
        return evidence
