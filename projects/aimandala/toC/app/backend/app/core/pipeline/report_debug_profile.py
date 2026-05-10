"""Builders for report debug profiles and diagnostics."""

from __future__ import annotations

import json
from typing import Any

from app.core.prompt.builder_v2 import PromptBuilder

from .data_models import InterpretationRecord
from .report_contracts import PromptSchemaValidator


class ReportDebugProfileBuilder:
    """Build development-facing report debug snapshots."""

    def __init__(
        self,
        *,
        prompt_builder: PromptBuilder,
        validator: PromptSchemaValidator,
    ) -> None:
        self.prompt_builder = prompt_builder
        self.validator = validator

    def build(
        self,
        *,
        record: InterpretationRecord,
        theme_label: str,
        signal_label: str | None,
        theme_summary: dict[str, Any],
    ) -> dict[str, Any]:
        stage = record.stage_process_package.payload if record.stage_process_package else {}
        layer1 = record.layer_1_lite_draft.to_dict() if record.layer_1_lite_draft else None
        layer2 = record.layer_2_lite_final.to_dict() if record.layer_2_lite_final else None
        layer3 = record.layer_3_pro_draft.to_dict() if record.layer_3_pro_draft else None
        layer4 = record.layer_4_pro_final.to_dict() if record.layer_4_pro_final else None

        lite_validation_issues = (
            self.validator.validate_lite(record.layer_1_lite_draft)
            if record.layer_1_lite_draft
            else ["missing_layer_1_lite_draft"]
        )
        pro_validation_issues = (
            self.validator.validate_pro(record.layer_3_pro_draft)
            if record.layer_3_pro_draft
            else ["missing_layer_3_pro_draft"]
        )

        return {
            "interpretation_id": record.interpretation_id,
            "theme": record.theme,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "version_purchased": record.version_purchased,
            "generation_mode": {
                "strategy": "stage_based_runtime",
                "stage_package_present": bool(stage),
                "shared_basis": "stage-00-to-stage-12",
            },
            "steps": self._build_steps(record, stage, layer1, layer2, layer3, layer4),
            "layers": {
                "stage_process_package": stage,
                "layer_1_lite_draft": layer1,
                "layer_2_lite_final": layer2,
                "layer_3_pro_draft": layer3,
                "layer_4_pro_final": layer4,
            },
            "field_provenance": {
                "lite": self._build_lite_field_provenance(record, layer1, layer2, stage),
                "pro": self._build_pro_field_provenance(record, layer2, layer3, layer4, stage, theme_summary),
            },
            "diagnostics": {
                "summary": self._build_diagnostic_summary(lite_validation_issues, pro_validation_issues),
                "fields": {
                    "lite": lite_validation_issues,
                    "pro": pro_validation_issues,
                },
            },
            "prompt_debug": {
                "lite": {
                    "prompt_preview": layer1.get("prompt_preview") if layer1 else None,
                    "stage_process_package_excerpt": self._extract_stage_process_package_excerpt(
                        layer1.get("prompt_preview") if layer1 else None
                    ),
                    "schema": self.prompt_builder.get_template("1.6", "lite").load_schema(),
                    "validation_issues": lite_validation_issues,
                },
                "pro": {
                    "prompt_preview": layer3.get("prompt_preview") if layer3 else None,
                    "stage_process_package_excerpt": self._extract_stage_process_package_excerpt(
                        layer3.get("prompt_preview") if layer3 else None
                    ),
                    "schema": self.prompt_builder.get_template("1.6", "pro").load_schema(),
                    "validation_issues": pro_validation_issues,
                },
            },
            "stage_process_package_debug": {
                "excerpt": self._summarize_stage_process_package(stage),
                "process_contract": stage.get("process_contract", {}) if isinstance(stage, dict) else {},
            },
        }

    def _build_steps(
        self,
        record: InterpretationRecord,
        stage: dict[str, Any],
        layer1: dict[str, Any] | None,
        layer2: dict[str, Any] | None,
        layer3: dict[str, Any] | None,
        layer4: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        return [
            {
                "key": "input",
                "label": "用户输入与三圈参数",
                "status": "done",
                "created_at": record.created_at,
                "summary": {
                    "theme": record.theme,
                    "painting_intention": record.painting_intention,
                    "painting_feeling": record.painting_feeling,
                    "three_circles": record.three_circles,
                    "auto_detect": record.three_circles_auto_detect,
                },
            },
            {
                "key": "stage_process_package",
                "label": "Stage 过程包",
                "status": "done" if stage else "missing",
                "summary": self._summarize_stage_process_package(stage),
            },
            {
                "key": "lite_prompt",
                "label": "Lite Prompt 预览",
                "status": "done" if layer1 else "missing",
                "summary": {
                    "prompt_preview": self._excerpt(layer1.get("prompt_preview")) if layer1 else None,
                    "title": layer1.get("title") if layer1 else None,
                    "overall_impression": self._excerpt(layer1.get("overall_impression")) if layer1 else None,
                },
            },
            {
                "key": "lite_final",
                "label": "Lite 最终报告",
                "status": "done" if layer2 else "missing",
                "summary": {
                    "title": layer2.get("title") if layer2 else None,
                    "overall_impression": self._excerpt(layer2.get("overall_impression")) if layer2 else None,
                    "markdown_excerpt": self._excerpt(layer2.get("full_report_markdown")) if layer2 else None,
                },
            },
            {
                "key": "pro_prompt",
                "label": "Pro Prompt 预览",
                "status": "done" if layer3 else "missing",
                "summary": {
                    "prompt_preview": self._excerpt(layer3.get("prompt_preview")) if layer3 else None,
                    "first_impression": self._excerpt(layer3.get("first_impression")) if layer3 else None,
                    "core_insight_table": layer3.get("core_insight_table") if layer3 else None,
                },
            },
            {
                "key": "pro_final",
                "label": "Pro 最终报告",
                "status": "done" if layer4 else "missing",
                "summary": {
                    "markdown_excerpt": self._excerpt(layer4.get("full_report_markdown")) if layer4 else None,
                    "ai_qa_context_excerpt": self._excerpt(layer4.get("ai_qa_context")) if layer4 else None,
                },
            },
        ]

    def _build_lite_field_provenance(
        self,
        record: InterpretationRecord,
        layer1: dict[str, Any] | None,
        layer2: dict[str, Any] | None,
        stage: dict[str, Any],
    ) -> list[dict[str, Any]]:
        return [
            {
                "field": "title",
                "final_value": layer2.get("title") if layer2 else None,
                "main_source": "layer_1_lite_draft.title" if layer1 else "stage_process_package",
                "upstream_inputs": [
                    {"source": "stage-10-core-thesis-selection", "value": stage.get("stage-10-core-thesis-selection")},
                    {"source": "user.theme", "value": record.theme},
                ],
            },
            {
                "field": "overall_impression",
                "final_value": layer2.get("overall_impression") if layer2 else None,
                "main_source": "layer_1_lite_draft.overall_impression" if layer1 else "stage_process_package",
                "upstream_inputs": [
                    {"source": "stage-01-user-input-context", "value": stage.get("stage-01-user-input-context")},
                    {"source": "stage-03-visual-evidence", "value": stage.get("stage-03-visual-evidence")},
                ],
            },
            {
                "field": "visual_elements_rendered",
                "final_value": layer2.get("visual_elements_rendered") if layer2 else None,
                "main_source": "stage-03-visual-evidence",
                "upstream_inputs": [
                    {"source": "stage-03-visual-evidence", "value": stage.get("stage-03-visual-evidence")},
                ],
            },
            {
                "field": "emotion_portrait_rendered",
                "final_value": layer2.get("emotion_portrait_rendered") if layer2 else None,
                "main_source": "stage-11-user-facing-framing",
                "upstream_inputs": [
                    {"source": "stage-11-user-facing-framing", "value": stage.get("stage-11-user-facing-framing")},
                ],
            },
        ]

    def _build_pro_field_provenance(
        self,
        record: InterpretationRecord,
        layer2: dict[str, Any] | None,
        layer3: dict[str, Any] | None,
        layer4: dict[str, Any] | None,
        stage: dict[str, Any],
        theme_summary: dict[str, Any],
    ) -> list[dict[str, Any]]:
        return [
            {
                "field": "first_impression",
                "final_value": layer3.get("first_impression") if layer3 else None,
                "main_source": "stage-10-core-thesis-selection",
                "upstream_inputs": [
                    {"source": "stage-10-core-thesis-selection", "value": stage.get("stage-10-core-thesis-selection")},
                    {"source": "stage-11-user-facing-framing", "value": stage.get("stage-11-user-facing-framing")},
                ],
            },
            {
                "field": "root_cause",
                "final_value": layer3.get("root_cause") if layer3 else None,
                "main_source": "stage-12-healing-direction-and-report-branching",
                "upstream_inputs": [
                    {"source": "stage-12-healing-direction-and-report-branching", "value": stage.get("stage-12-healing-direction-and-report-branching")},
                    {"source": "theme_summary", "value": theme_summary},
                ],
            },
            {
                "field": "healing_suggestions",
                "final_value": layer3.get("healing_suggestions") if layer3 else None,
                "main_source": "stage-12-healing-direction-and-report-branching",
                "upstream_inputs": [
                    {"source": "stage-12-healing-direction-and-report-branching", "value": stage.get("stage-12-healing-direction-and-report-branching")},
                ],
            },
            {
                "field": "full_report_markdown",
                "final_value": layer4.get("full_report_markdown") if layer4 else None,
                "main_source": "template_merge_layer2_plus_layer3",
                "upstream_inputs": [
                    {"source": "layer_2_lite_final.full_report_markdown", "value": layer2.get("full_report_markdown") if layer2 else None},
                    {"source": "layer_3_pro_draft", "value": layer3},
                ],
            },
        ]

    def _build_diagnostic_summary(
        self,
        lite_validation_issues: list[str],
        pro_validation_issues: list[str],
    ) -> dict[str, Any]:
        return {
            "lite_field_issue_count": len(lite_validation_issues),
            "pro_field_issue_count": len(pro_validation_issues),
            "status": "needs_review" if lite_validation_issues or pro_validation_issues else "ok",
        }

    def _summarize_stage_process_package(self, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            return {}
        keys = list(payload.keys())
        return {
            "keys": keys[:24],
            "stage_count": len([key for key in keys if key.startswith("stage-")]),
            "has_process_contract": "process_contract" in payload,
        }

    def _extract_stage_process_package_excerpt(self, prompt_preview: Any) -> str:
        if not isinstance(prompt_preview, str):
            return ""
        marker = "## Stage 过程交付物"
        if marker not in prompt_preview:
            return ""
        after_marker = prompt_preview.rsplit(marker, 1)[1]
        section = after_marker.split("---", 1)[0].strip()
        return self._excerpt(section, 1600) or ""

    def _excerpt(self, value: Any, limit: int = 220) -> Any:
        if not isinstance(value, str):
            return value
        compact = value.strip()
        if not compact:
            return ""
        if len(compact) <= limit:
            return compact
        return f"{compact[:limit]}..."
