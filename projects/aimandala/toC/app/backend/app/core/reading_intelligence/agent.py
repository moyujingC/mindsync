"""Mandala reading agent MVP orchestration."""

from __future__ import annotations

import json
from typing import Any

from .contracts import EXECUTION_BLOCKS, STAGE_KEYS, MandalaAgentInput, MandalaAgentResult
from .knowledge_pack_builder import knowledge_pack_to_prompt_fragment
from .quality_gate import run_quality_gate


class MandalaReadingAgent:
    """Run the MVP mandala reading flow and preserve reviewable artifacts."""

    def __init__(self, *, llm_client: Any) -> None:
        self.llm_client = llm_client

    def run(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
    ) -> MandalaAgentResult:
        stage_outputs: dict[str, Any] = {}
        agent_input_payload = agent_input.to_dict()
        agent_input_payload["knowledge_pack"] = knowledge_pack

        stage_outputs["stage-00-input-context"] = {
            "report_mode": agent_input.report_mode,
            "agent_version": agent_input.agent_version,
            "image": agent_input.image.to_dict(),
        }
        stage_outputs["stage-01-user-input-context"] = agent_input.user_context.to_dict()
        stage_outputs["stage-02-circle-boundary-decision"] = agent_input.circle_boundaries

        visual_observation = self._generate_visual_observation(
            agent_input=agent_input,
            knowledge_pack=knowledge_pack,
        )
        stage_outputs["stage-03-visual-evidence"] = visual_observation
        stage_outputs["stage-04-direct-judgment-high-hit-check"] = {
            "status": "completed",
            "evidence_summary": visual_observation.get("evidence_summary", []),
            "uncertainties": visual_observation.get("uncertainties", []),
        }

        circle_interpretation = self._build_circle_interpretation(visual_observation)
        stage_outputs["stage-05-per-circle-color-shape-element-sensing"] = circle_interpretation
        stage_outputs["stage-06-per-circle-element-generation-control"] = {
            "status": "completed",
            "control_rule": "only infer from visible evidence and compact knowledge pack",
        }
        stage_outputs["stage-07-per-circle-imbalance-patterns"] = {
            "status": "completed",
            "patterns": [],
        }
        stage_outputs["stage-08-energy-flow-diagnosis"] = {
            "status": "completed",
            "summary": visual_observation.get("global_visual_summary", ""),
        }
        evidence_map = self._build_evidence_map(visual_observation)
        stage_outputs["stage-09-evidence-consolidation"] = {
            "evidence_map": evidence_map,
            "evidence_summary": visual_observation.get("evidence_summary", []),
        }

        thesis_payload = self._generate_thesis_payload(
            agent_input=agent_input,
            knowledge_pack=knowledge_pack,
            visual_observation=visual_observation,
            evidence_map=evidence_map,
        )
        stage_outputs["stage-10-core-thesis-selection"] = {
            "core_thesis": thesis_payload.get("core_thesis", ""),
            "evidence_refs": thesis_payload.get("evidence_refs", []),
        }
        stage_outputs["stage-11-user-facing-framing"] = {
            "user_facing_framing": thesis_payload.get("user_facing_framing", ""),
        }
        stage_outputs["stage-12-healing-direction-and-report-branching"] = {
            "healing_direction": thesis_payload.get("healing_direction", ""),
            "report_mode": agent_input.report_mode,
        }

        final_report_md = self._generate_final_report(
            agent_input=agent_input,
            knowledge_pack=knowledge_pack,
            visual_observation=visual_observation,
            thesis_payload=thesis_payload,
        )
        stage_outputs["stage-13-lite-report-draft"] = {
            "enabled": agent_input.report_mode == "lite",
            "markdown": final_report_md if agent_input.report_mode == "lite" else "",
        }
        stage_outputs["stage-14-pro-report-draft"] = {
            "enabled": agent_input.report_mode == "pro",
            "markdown": final_report_md if agent_input.report_mode == "pro" else "",
        }
        stage_outputs["stage-15-visual-assets"] = {
            "status": "not_generated_in_mvp",
            "assets": [],
        }

        final_report = {
            "report_id": "mandala-reading-agent-local",
            "report_mode": agent_input.report_mode,
            "markdown": final_report_md,
            "core_thesis": thesis_payload.get("core_thesis", ""),
        }
        stage_outputs["stage-16-final-report-assembly"] = final_report

        execution_trace = self._build_execution_trace(stage_outputs)
        report_context_package = self._build_report_context_package(
            agent_input=agent_input,
            visual_observation=visual_observation,
            circle_interpretation=circle_interpretation,
            thesis_payload=thesis_payload,
            final_report=final_report,
            evidence_map=evidence_map,
        )
        quality_gate = run_quality_gate(
            stage_outputs=stage_outputs,
            execution_trace=execution_trace,
            final_report_md=final_report_md,
            report_context_package=report_context_package,
        )
        agent_output = {
            "status": "complete" if quality_gate["passed"] else "failed",
            "agent_version": agent_input.agent_version,
            "report_mode": agent_input.report_mode,
            "quality_gate_passed": quality_gate["passed"],
        }
        interpretation_artifacts = {
            "method_source": knowledge_pack.get("method_source", ""),
            "execution_blocks": execution_trace,
            "stage_outputs": stage_outputs,
            "evidence_map": evidence_map,
        }

        return MandalaAgentResult(
            agent_input=agent_input_payload,
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

    def _generate_visual_observation(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
    ) -> dict[str, Any]:
        return self.llm_client.generate_structured(
            task="mandala_visual_observation",
            image=agent_input.image.to_dict(),
            user_context=agent_input.user_context.to_dict(),
            circle_boundaries=agent_input.circle_boundaries,
            knowledge_pack=knowledge_pack_to_prompt_fragment(knowledge_pack),
        )

    def _generate_thesis_payload(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        visual_observation: dict[str, Any],
        evidence_map: list[dict[str, Any]],
    ) -> dict[str, Any]:
        text = self.llm_client.generate_text(
            task="mandala_core_thesis",
            report_mode=agent_input.report_mode,
            user_context=agent_input.user_context.to_dict(),
            visual_observation=visual_observation,
            evidence_map=evidence_map,
            knowledge_pack=knowledge_pack_to_prompt_fragment(knowledge_pack),
        )
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            payload = {}
        return {
            "core_thesis": str(payload.get("core_thesis", "")).strip(),
            "user_facing_framing": str(payload.get("user_facing_framing", "")).strip(),
            "healing_direction": str(payload.get("healing_direction", "")).strip(),
            "evidence_refs": payload.get("evidence_refs", []),
        }

    def _generate_final_report(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any],
        visual_observation: dict[str, Any],
        thesis_payload: dict[str, Any],
    ) -> str:
        return str(
            self.llm_client.generate_text(
                task="mandala_final_report",
                report_mode=agent_input.report_mode,
                output_requirements=agent_input.output_requirements.to_dict(),
                user_context=agent_input.user_context.to_dict(),
                visual_observation=visual_observation,
                thesis_payload=thesis_payload,
                knowledge_pack=knowledge_pack_to_prompt_fragment(knowledge_pack),
            )
        ).strip()

    def _build_execution_trace(self, stage_outputs: dict[str, Any]) -> list[dict[str, Any]]:
        trace = []
        for block in EXECUTION_BLOCKS:
            stage_keys = list(block["stage_keys"])
            trace.append(
                {
                    "block_id": block["block_id"],
                    "stage_keys": stage_keys,
                    "status": "complete"
                    if all(stage_key in stage_outputs for stage_key in stage_keys)
                    else "incomplete",
                }
            )
        return trace

    def _build_circle_interpretation(self, visual_observation: dict[str, Any]) -> dict[str, Any]:
        circles = visual_observation.get("circles", {})
        return {
            circle_name: {
                "summary": circle_payload.get("summary", ""),
                "visual_units": circle_payload.get("visual_units", []),
            }
            for circle_name, circle_payload in circles.items()
            if isinstance(circle_payload, dict)
        }

    def _build_evidence_map(self, visual_observation: dict[str, Any]) -> list[dict[str, Any]]:
        evidence_map: list[dict[str, Any]] = []
        circles = visual_observation.get("circles", {})
        if not isinstance(circles, dict):
            return evidence_map
        for circle_name, circle_payload in circles.items():
            if not isinstance(circle_payload, dict):
                continue
            for visual_unit in circle_payload.get("visual_units", []):
                if not isinstance(visual_unit, dict):
                    continue
                evidence_map.append(
                    {
                        "id": visual_unit.get("id", ""),
                        "circle": circle_name,
                        "position": visual_unit.get("position", ""),
                        "visible_evidence": visual_unit.get("visible_evidence", ""),
                    }
                )
        return evidence_map

    def _build_report_context_package(
        self,
        *,
        agent_input: MandalaAgentInput,
        visual_observation: dict[str, Any],
        circle_interpretation: dict[str, Any],
        thesis_payload: dict[str, Any],
        final_report: dict[str, Any],
        evidence_map: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            "report_id": final_report["report_id"],
            "report_mode": agent_input.report_mode,
            "user_context": agent_input.user_context.to_dict(),
            "visual_observation": visual_observation,
            "circle_interpretation": circle_interpretation,
            "five_element_interpretation": {
                "status": "deferred_to_compact_knowledge_pack",
            },
            "theme_interpretation": {
                "theme": agent_input.user_context.theme,
                "theme_label": agent_input.user_context.theme_label,
            },
            "core_thesis": thesis_payload.get("core_thesis", ""),
            "healing_direction": thesis_payload.get("healing_direction", ""),
            "final_report": final_report,
            "evidence_map": evidence_map,
            "boundaries": agent_input.circle_boundaries,
            "permissions": {
                "report_qa_ready": True,
                "pro_upgrade_ready": agent_input.report_mode == "pro",
            },
        }
