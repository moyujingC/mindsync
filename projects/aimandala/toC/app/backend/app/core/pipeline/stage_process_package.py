"""Build stage 00-12 process packages for report generation."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, StageProcessPackage
from app.core.stage_process_contracts import find_pending_stage_markers


class StageProcessPackageAssembler:
    """Create the formal stage package consumed by Lite/Pro prompts."""

    def __init__(
        self,
        *,
        get_theme_label: Callable[[str | None], str],
        get_knowledge_theme_summary: Callable[[str | None], dict[str, Any]],
        get_knowledge_runtime: Callable[[], Any] | None = None,
    ) -> None:
        self._get_theme_label = get_theme_label
        self._get_knowledge_theme_summary = get_knowledge_theme_summary
        self._get_knowledge_runtime = get_knowledge_runtime or (lambda: None)

    def build(
        self,
        record: InterpretationRecord,
        *,
        target_report: str,
    ) -> StageProcessPackage:
        existing = record.stage_process_package
        if existing and isinstance(existing.payload, dict) and existing.payload:
            payload = dict(existing.payload)
            payload.setdefault("process_contract", self._build_contract(target_report))
            payload["process_contract"]["target_report"] = target_report
            payload = self._complete_payload(record, payload, target_report=target_report)
            return StageProcessPackage(payload=payload, created_at=existing.created_at)

        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme = record.theme or "general"
        theme_summary = self._get_knowledge_theme_summary(theme)
        payload = {
            "process_contract": self._build_contract(target_report),
            "stage-00-input-context": {
                "method_source": (
                    "projects/aimandala/docs/sources/知识库构建/"
                    "三圈五行流派解读方法与步骤.md"
                ),
                "report_target": target_report,
                "knowledge_runtime_version": "current",
            },
            "stage-01-user-input-context": {
                "theme": theme,
                "theme_label": self._get_theme_label(theme),
                "painting_intention": (record.painting_intention or "").strip(),
                "painting_feeling": (record.painting_feeling or "").strip(),
                "image_ref": {
                    "storage_backend": record.image_storage_backend,
                    "storage_key": record.image_storage_key,
                    "image_url": record.image_url,
                    "image_local_path": record.image_local_path,
                },
            },
            "stage-02-circle-boundary-decision": {
                "inner_middle_radius": circles.get("inner_radius", 33),
                "middle_outer_radius": circles.get("middle_radius", 66),
                "radius_unit": "normalized_percent",
                "boundary_source": "manual",
                "locked": True,
            },
            "stage-03-visual-evidence": {
                "status": "incomplete",
                "global_visual_summary": "",
                "circles": {"inner": {}, "middle": {}, "outer": {}},
                "evidence_refs": [],
            },
            "stage-04-direct-judgment-high-hit-check": {
                "status": "incomplete",
                "matches": [],
                "conflicts": [],
                "knowledge_refs": [],
            },
        }
        payload = self._complete_payload(record, payload, target_report=target_report)
        return StageProcessPackage(payload=payload)

    def build_prompt(
        self,
        record: InterpretationRecord,
        *,
        target_report: str,
        prompt_builder: Any,
    ) -> str:
        package = self.build(record, target_report=target_report)
        record.stage_process_package = package
        payload_text = self._json_dumps(package.payload)
        theme_context = self._build_theme_context(record)
        if target_report == "pro":
            return prompt_builder.build_pro(
                vision_data=payload_text,
                theme=record.theme or "general",
                theme_context=theme_context,
                stage_process_package=payload_text,
            )
        return prompt_builder.build_lite(
            vision_data=payload_text,
            theme=record.theme or "general",
            theme_context=theme_context,
            stage_process_package=payload_text,
        )

    def _build_contract(self, target_report: str) -> dict[str, Any]:
        return {
            "generation_mode": "stage_based_runtime",
            "target_report": target_report,
            "package_status": "incomplete",
            "completed_stages": [],
            "incomplete_stages": [],
            "blocking_reasons": [],
            "knowledge_ref_count": 0,
            "token_policy": (
                "Use only stage deliverables and cited knowledge entries. "
                "Do not load full Markdown truth sources into this prompt."
            ),
            "forbidden_inputs": [
                "full_markdown_truth_sources",
                "full_theme_knowledge_documents",
                "raw_legacy_container",
                "old_report_skeleton",
                "old_report_plan",
                "private_env_or_api_keys",
            ],
        }

    def _build_theme_context(self, record: InterpretationRecord) -> str:
        theme = record.theme or "general"
        summary = self._get_knowledge_theme_summary(theme)
        lines = [
            f"- 当前主题：{self._get_theme_label(theme)}",
            f"- 创作前意图：{(record.painting_intention or '').strip() or '未填写'}",
            f"- 创作时感受：{(record.painting_feeling or '').strip() or '未填写'}",
        ]
        if summary.get("name"):
            lines.append(f"- 主题知识：{summary['name']}")
        core_issues = summary.get("core_issues")
        if isinstance(core_issues, list) and core_issues:
            lines.append("- 主题核心议题：" + " / ".join(map(str, core_issues[:4])))
        return "\n".join(lines)

    def _compact_theme_summary(self, summary: dict[str, Any]) -> dict[str, Any]:
        return {
            "theme_id": summary.get("theme_id", ""),
            "theme_name": summary.get("name", summary.get("theme_name", "")),
            "core_issues": summary.get("core_issues", []),
            "focus_element": summary.get("focus_element", ""),
        }

    def _complete_payload(
        self,
        record: InterpretationRecord,
        payload: dict[str, Any],
        *,
        target_report: str,
    ) -> dict[str, Any]:
        theme = record.theme or "general"
        stage03 = self._stage(payload, "stage-03-visual-evidence")
        stage04 = self._stage(payload, "stage-04-direct-judgment-high-hit-check")
        has_visual_evidence = self._has_visual_evidence(stage03)
        if has_visual_evidence:
            stage03["status"] = "complete"
        else:
            stage03["status"] = "incomplete"
        stage04.setdefault("status", "complete" if has_visual_evidence else "incomplete")
        stage04.setdefault("matches", [])
        stage04.setdefault("conflicts", [])
        stage04.setdefault("knowledge_refs", [])
        payload["stage-03-visual-evidence"] = stage03
        payload["stage-04-direct-judgment-high-hit-check"] = stage04

        stage05 = self._build_stage05(stage03, theme) if has_visual_evidence else {
            "status": "incomplete",
            "circle_results": [],
            "knowledge_refs": [],
        }
        stage06 = self._build_stage06(stage05, theme)
        stage07 = self._build_stage07(stage05, stage06, theme)
        stage08 = self._build_stage08(stage05, stage07)
        stage09 = self._build_stage09(stage03, stage05, stage06, stage07, stage08)
        stage10 = self._build_stage10(stage06, stage07, theme)
        stage11 = self._build_stage11(stage03, stage05, stage10)
        stage12 = self._build_stage12(stage10, stage11, stage07, stage08, theme)
        payload.update(
            {
                "stage-05-per-circle-color-shape-element-sensing": stage05,
                "stage-06-per-circle-element-generation-control": stage06,
                "stage-07-per-circle-imbalance-patterns": stage07,
                "stage-08-energy-flow-diagnosis": stage08,
                "stage-09-evidence-consolidation": stage09,
                "stage-10-core-thesis-selection": stage10,
                "stage-11-user-facing-framing": stage11,
                "stage-12-healing-direction-and-report-branching": stage12,
            }
        )
        payload["process_contract"] = self._finalize_contract(
            payload,
            target_report=target_report,
        )
        return payload

    def _build_stage05(self, stage03: dict[str, Any], theme: str) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        circle_results = []
        knowledge_refs: list[str] = []
        for circle_key in ("inner", "middle", "outer"):
            circle_payload = self._stage(stage03.get("circles", {}), circle_key)
            units = circle_payload.get("visual_units")
            if not isinstance(units, list):
                units = []
            mapped_units = []
            element_counts: dict[str, float] = {}
            for index, unit in enumerate(units):
                if not isinstance(unit, dict):
                    continue
                color = str(unit.get("color") or unit.get("main_color") or "").strip()
                element = ""
                color_ref = ""
                theme_ref = ""
                if runtime is not None and color:
                    color_result = runtime.element_service.get_color_meaning(color)
                    if isinstance(color_result.value, dict):
                        element = str(color_result.value.get("element") or "").strip()
                    color_ref = color_result.entity_id or f"element.color.{color}"
                    if element:
                        profile = runtime.theme_service.get_element_meaning(theme, element)
                        if profile:
                            theme_ref = f"theme.{theme}.element_meanings.{element}"
                ratio = self._float(unit.get("area_ratio"), default=0.0)
                if element:
                    element_counts[element] = element_counts.get(element, 0.0) + ratio
                refs = [ref for ref in [color_ref, theme_ref] if ref]
                knowledge_refs.extend(refs)
                mapped_units.append(
                    {
                        "id": f"stage-05.{circle_key}.{index}",
                        "visual_description": str(unit.get("description") or "").strip(),
                        "color": color,
                        "shape": str(unit.get("shape") or "").strip(),
                        "shade": str(unit.get("shade") or "medium").strip(),
                        "area_ratio": ratio,
                        "element": element,
                        "knowledge_refs": refs,
                    }
                )
            dominant = max(element_counts, key=element_counts.get) if element_counts else ""
            circle_results.append(
                {
                    "circle": circle_key,
                    "dominant_element": dominant,
                    "element_proportions": element_counts,
                    "visual_units": mapped_units,
                }
            )
        return {
            "status": "complete" if any(item["visual_units"] for item in circle_results) else "incomplete",
            "circle_results": circle_results,
            "knowledge_refs": self._unique(knowledge_refs),
        }

    def _build_stage06(self, stage05: dict[str, Any], theme: str) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        theme_summary = self._compact_theme_summary(self._get_knowledge_theme_summary(theme))
        circle_elements = {
            item.get("circle"): item.get("dominant_element")
            for item in stage05.get("circle_results", [])
            if isinstance(item, dict) and item.get("dominant_element")
        }
        knowledge_refs = [f"theme.{theme}"]
        circle_readings = []
        if runtime is not None:
            for circle, element in circle_elements.items():
                query = runtime.circle_service.get_circle_interpretation(circle, element, theme=theme)
                refs = [e.get("entity_id", "") for e in query.evidence if isinstance(e, dict)]
                knowledge_refs.extend([ref for ref in refs if ref])
                circle_readings.append(
                    {
                        "circle": circle,
                        "element": element,
                        "theme_mapping": runtime.theme_service.get_element_meaning(theme, element),
                        "circle_interpretation": query.value if query.found else {},
                        "knowledge_refs": self._unique(refs + [f"theme.{theme}.element_meanings.{element}"]),
                    }
                )
        return {
            "status": "complete" if circle_readings else "incomplete",
            "theme": theme,
            "theme_summary": theme_summary,
            "circle_elements": circle_elements,
            "circle_readings": circle_readings,
            "knowledge_refs": self._unique(knowledge_refs),
        }

    def _build_stage07(
        self,
        stage05: dict[str, Any],
        stage06: dict[str, Any],
        theme: str,
    ) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        color_analysis = {}
        for item in stage05.get("circle_results", []):
            if not isinstance(item, dict):
                continue
            for unit in item.get("visual_units", []):
                if isinstance(unit, dict) and unit.get("element"):
                    color_analysis[unit.get("id", "")] = {
                        "element": unit.get("element"),
                        "proportion": unit.get("area_ratio", 0.0),
                    }
        circle_elements = stage06.get("circle_elements", {})
        candidates = []
        knowledge_refs: list[str] = []
        if runtime is not None and color_analysis and circle_elements:
            trace = runtime.imbalance_service.evaluate_imbalance_trace(
                color_analysis,
                circle_elements,
                version="toc",
            )
            for candidate in trace.get("imbalance_trace", {}).get("primary_candidates", []):
                if not isinstance(candidate, dict):
                    continue
                candidate_id = str(candidate.get("id") or "").strip()
                if not candidate_id:
                    continue
                detail = runtime.imbalance_service.get_imbalance_detail(candidate_id)
                mapping = runtime.imbalance_service.get_theme_mapping(theme, candidate_id)
                refs = [detail.entity_id, mapping.entity_id]
                knowledge_refs.extend([ref for ref in refs if ref])
                candidates.append(
                    {
                        **candidate,
                        "detail": detail.value if detail.found else {},
                        "theme_mapping": mapping.value if isinstance(mapping.value, dict) else {},
                        "knowledge_refs": self._unique(refs),
                    }
                )
        return {
            "status": "complete" if candidates else "incomplete",
            "candidates": candidates,
            "knowledge_refs": self._unique(knowledge_refs),
        }

    def _build_stage08(self, stage05: dict[str, Any], stage07: dict[str, Any]) -> dict[str, Any]:
        dominant_by_circle = [
            f"{item.get('circle')}:{item.get('dominant_element')}"
            for item in stage05.get("circle_results", [])
            if isinstance(item, dict) and item.get("dominant_element")
        ]
        primary = self._primary_candidate_id(stage07)
        return {
            "status": "complete" if dominant_by_circle else "incomplete",
            "inner_flow": dominant_by_circle[0] if dominant_by_circle else "",
            "overall_flow": " -> ".join(dominant_by_circle),
            "primary_imbalance": primary,
            "evidence_refs": ["stage-05-per-circle-color-shape-element-sensing", "stage-07-per-circle-imbalance-patterns"],
        }

    def _build_stage09(
        self,
        stage03: dict[str, Any],
        stage05: dict[str, Any],
        stage06: dict[str, Any],
        stage07: dict[str, Any],
        stage08: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "status": "complete" if stage08.get("status") == "complete" else "incomplete",
            "report_candidates": [
                stage03.get("global_visual_summary", ""),
                stage08.get("overall_flow", ""),
                self._primary_candidate_id(stage07),
            ],
            "knowledge_refs": self._unique(
                list(stage05.get("knowledge_refs", []))
                + list(stage06.get("knowledge_refs", []))
                + list(stage07.get("knowledge_refs", []))
            ),
        }

    def _build_stage10(self, stage06: dict[str, Any], stage07: dict[str, Any], theme: str) -> dict[str, Any]:
        theme_name = stage06.get("theme_summary", {}).get("theme_name") or self._get_theme_label(theme)
        primary = self._primary_candidate_id(stage07) or "能量正在重新整理"
        return {
            "status": "complete" if stage06.get("status") == "complete" else "incomplete",
            "selected_thesis": f"{theme_name}中，{primary}正在成为这次画作的核心线索。",
            "source_stage_refs": ["stage-06-per-circle-element-generation-control", "stage-07-per-circle-imbalance-patterns"],
        }

    def _build_stage11(self, stage03: dict[str, Any], stage05: dict[str, Any], stage10: dict[str, Any]) -> dict[str, Any]:
        visual_basis = []
        for item in stage05.get("circle_results", []):
            if not isinstance(item, dict):
                continue
            descriptions = [
                str(unit.get("visual_description") or "").strip()
                for unit in item.get("visual_units", [])
                if isinstance(unit, dict) and str(unit.get("visual_description") or "").strip()
            ]
            if descriptions:
                visual_basis.append({"circle": item.get("circle"), "basis": "；".join(descriptions)})
        return {
            "status": "complete" if visual_basis else "incomplete",
            "visual_basis_candidates": visual_basis,
            "term_explanations": [
                {"term": "五行", "plain_language": "用木、火、土、金、水来描述画面能量的不同质感。"},
                {"term": "失衡", "plain_language": "某种能量过强、过弱或流动受阻时呈现出的状态。"},
            ],
            "core_thesis": stage10.get("selected_thesis", ""),
            "source_stage_refs": ["stage-03-visual-evidence", "stage-05-per-circle-color-shape-element-sensing", "stage-10-core-thesis-selection"],
        }

    def _build_stage12(
        self,
        stage10: dict[str, Any],
        stage11: dict[str, Any],
        stage07: dict[str, Any],
        stage08: dict[str, Any],
        theme: str,
    ) -> dict[str, Any]:
        runtime = self._get_knowledge_runtime()
        primary = self._primary_candidate_id(stage07)
        healing_plan = {}
        refs: list[str] = []
        if runtime is not None and primary:
            result = runtime.healing_service.get_healing_plan(primary, theme)
            healing_plan = result.value if isinstance(result.value, dict) else {}
            refs = [result.entity_id]
        return {
            "status": "complete" if stage11.get("status") == "complete" else "incomplete",
            "lite_writing_input": {
                "core_thesis": stage10.get("selected_thesis", ""),
                "visual_basis": stage11.get("visual_basis_candidates", []),
                "healing_direction": healing_plan.get("direction", ""),
            },
            "pro_writing_input": {
                "core_thesis": stage10.get("selected_thesis", ""),
                "energy_flow": stage08.get("overall_flow", ""),
                "primary_imbalance": primary,
                "healing_plan": healing_plan,
            },
            "knowledge_refs": self._unique(refs),
        }

    def _finalize_contract(self, payload: dict[str, Any], *, target_report: str) -> dict[str, Any]:
        contract = self._stage(payload, "process_contract") or self._build_contract(target_report)
        stage_keys = sorted(key for key in payload if key.startswith("stage-"))
        incomplete = []
        for key in stage_keys:
            stage = self._stage(payload, key)
            status = stage.get("status")
            if status is not None and status != "complete":
                incomplete.append(key)
        knowledge_refs = self._collect_knowledge_refs(payload)
        pending_paths = find_pending_stage_markers(payload)
        blocking_reasons = []
        if incomplete:
            blocking_reasons.append("incomplete stages: " + ", ".join(incomplete))
        if pending_paths:
            blocking_reasons.append("pending markers: " + ", ".join(pending_paths[:5]))
        contract.update(
            {
                "generation_mode": "stage_based_runtime",
                "target_report": target_report,
                "package_status": "formal" if not incomplete and not pending_paths else "incomplete",
                "completed_stages": [key for key in stage_keys if key not in incomplete],
                "incomplete_stages": incomplete,
                "blocking_reasons": blocking_reasons,
                "knowledge_ref_count": len(knowledge_refs),
            }
        )
        return contract

    def _has_visual_evidence(self, stage03: dict[str, Any]) -> bool:
        circles = stage03.get("circles")
        if not isinstance(circles, dict):
            return False
        for payload in circles.values():
            if isinstance(payload, dict) and isinstance(payload.get("visual_units"), list) and payload["visual_units"]:
                return True
        return False

    def _collect_knowledge_refs(self, payload: dict[str, Any]) -> list[str]:
        refs: list[str] = []
        for value in payload.values():
            if isinstance(value, dict) and isinstance(value.get("knowledge_refs"), list):
                refs.extend(str(item) for item in value["knowledge_refs"] if str(item).strip())
        return self._unique(refs)

    def _primary_candidate_id(self, stage07: dict[str, Any]) -> str:
        candidates = stage07.get("candidates", [])
        if isinstance(candidates, list) and candidates:
            item = candidates[0]
            if isinstance(item, dict):
                return str(item.get("id") or item.get("name") or "").strip()
            return str(item).strip()
        return ""

    def _stage(self, payload: Any, key: str) -> dict[str, Any]:
        if not isinstance(payload, dict):
            return {}
        value = payload.get(key, {})
        return value if isinstance(value, dict) else {}

    def _float(self, value: Any, *, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _unique(self, values: list[Any]) -> list[str]:
        result = []
        for value in values:
            text = str(value or "").strip()
            if text and text not in result:
                result.append(text)
        return result

    def _json_dumps(self, payload: dict[str, Any]) -> str:
        import json

        return json.dumps(payload, ensure_ascii=False, indent=2)
