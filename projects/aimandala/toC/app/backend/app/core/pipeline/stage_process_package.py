"""Build stage 00-12 process packages for report generation."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, StageProcessPackage


class StageProcessPackageAssembler:
    """Create the formal stage package consumed by Lite/Pro prompts."""

    def __init__(
        self,
        *,
        get_theme_label: Callable[[str | None], str],
        get_knowledge_theme_summary: Callable[[str | None], dict[str, Any]],
    ) -> None:
        self._get_theme_label = get_theme_label
        self._get_knowledge_theme_summary = get_knowledge_theme_summary

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
                "status": "pending_stage_runtime_replacement",
                "global_visual_summary": "",
                "circles": {"inner": {}, "middle": {}, "outer": {}},
                "evidence_refs": [],
            },
            "stage-04-direct-judgment-high-hit-check": {
                "status": "pending_stage_runtime_replacement",
                "matches": [],
                "conflicts": [],
                "knowledge_refs": [],
            },
            "stage-05-per-circle-color-shape-element-sensing": {
                "status": "pending_stage_runtime_replacement",
                "circle_results": [],
                "knowledge_refs": [],
            },
            "stage-06-per-circle-element-generation-control": {
                "status": "pending_stage_runtime_replacement",
                "theme": theme,
                "theme_summary": self._compact_theme_summary(theme_summary),
                "knowledge_refs": [],
            },
            "stage-07-per-circle-imbalance-patterns": {
                "status": "pending_stage_runtime_replacement",
                "candidates": [],
                "knowledge_refs": [],
            },
            "stage-08-energy-flow-diagnosis": {
                "status": "pending_stage_runtime_replacement",
                "inner_flow": "",
                "overall_flow": "",
                "evidence_refs": [],
            },
            "stage-09-evidence-consolidation": {
                "status": "pending_stage_runtime_replacement",
                "report_candidates": [],
                "required_followup": [
                    "stage-03 visual evidence must be generated before production use",
                    "stage-05 to stage-08 rule outputs must be generated before production use",
                ],
            },
            "stage-10-core-thesis-selection": {
                "status": "pending_stage_runtime_replacement",
                "selected_thesis": "",
            },
            "stage-11-user-facing-framing": {
                "status": "pending_stage_runtime_replacement",
                "visual_basis_candidates": [],
                "term_explanations": [],
            },
            "stage-12-healing-direction-and-report-branching": {
                "status": "pending_stage_runtime_replacement",
                "lite_writing_input": {},
                "pro_writing_input": {},
            },
        }
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

    def _json_dumps(self, payload: dict[str, Any]) -> str:
        import json

        return json.dumps(payload, ensure_ascii=False, indent=2)
