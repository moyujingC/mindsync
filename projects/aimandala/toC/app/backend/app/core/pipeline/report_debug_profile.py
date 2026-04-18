"""Builders for report debug profiles and diagnostics."""

from __future__ import annotations

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
        layer0 = record.layer_0_raw.to_dict() if record.layer_0_raw else None
        layer1 = record.layer_1_lite_draft.to_dict() if record.layer_1_lite_draft else None
        layer2 = record.layer_2_lite_final.to_dict() if record.layer_2_lite_final else None
        layer3 = record.layer_3_pro_draft.to_dict() if record.layer_3_pro_draft else None
        layer4 = record.layer_4_pro_final.to_dict() if record.layer_4_pro_final else None

        lite_field_provenance = [
            {
                "field": "title",
                "final_value": layer2.get("title") if layer2 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_1_lite_draft.title"
                    if self._non_empty_text(layer1.get("title") if layer1 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.title", "value": layer1.get("title") if layer1 else None},
                    {"source": "theme_label", "value": theme_label},
                    {"source": "user.theme", "value": record.theme},
                ],
            },
            {
                "field": "overall_impression",
                "final_value": layer2.get("overall_impression") if layer2 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_1_lite_draft.overall_impression"
                    if self._non_empty_text(layer1.get("overall_impression") if layer1 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.overall_impression", "value": layer1.get("overall_impression") if layer1 else None},
                    {"source": "user.painting_intention", "value": record.painting_intention},
                    {"source": "user.painting_feeling", "value": record.painting_feeling},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                ],
            },
            {
                "field": "visual_elements_rendered",
                "final_value": layer2.get("visual_elements_rendered") if layer2 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_1_lite_draft.visual_elements"
                    if self._non_empty_text(layer1.get("visual_elements") if layer1 else None)
                    else "layer_0_raw.color_analysis"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.visual_elements", "value": layer1.get("visual_elements") if layer1 else None},
                    {"source": "layer_0_raw.color_analysis", "value": layer0.get("color_analysis") if layer0 else None},
                    {"source": "layer_0_raw.circle_colors", "value": layer0.get("circle_colors") if layer0 else None},
                    {"source": "user.three_circles", "value": record.three_circles},
                ],
            },
            {
                "field": "emotion_portrait_rendered",
                "final_value": layer2.get("emotion_portrait_rendered") if layer2 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_1_lite_draft.emotion_portrait"
                    if self._non_empty_text(layer1.get("emotion_portrait") if layer1 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.emotion_portrait", "value": layer1.get("emotion_portrait") if layer1 else None},
                    {"source": "user.painting_feeling", "value": record.painting_feeling},
                    {"source": "knowledge_signal", "value": signal_label},
                    {"source": "theme_summary", "value": theme_summary},
                ],
            },
            {
                "field": "pro_teaser",
                "final_value": layer2.get("pro_teaser") if layer2 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_1_lite_draft.pro_teaser"
                    if self._non_empty_text(layer1.get("pro_teaser") if layer1 else None)
                    else "default_pro_teaser"
                ),
                "upstream_inputs": [
                    {"source": "layer_1_lite_draft.pro_teaser", "value": layer1.get("pro_teaser") if layer1 else None},
                    {"source": "user.theme", "value": record.theme},
                ],
            },
        ]

        pro_field_provenance = [
            {
                "field": "first_impression",
                "final_value": layer3.get("first_impression") if layer3 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "layer_3_pro_draft.first_impression"
                    if self._non_empty_text(layer3.get("first_impression") if layer3 else None)
                    else "template_fallback"
                ),
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.first_impression", "value": layer3.get("first_impression") if layer3 else None},
                    {"source": "layer_1_lite_draft.story", "value": layer1.get("story") if layer1 else None},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                ],
            },
            {
                "field": "core_insight_table",
                "final_value": layer3.get("core_insight_table") if layer3 else None,
                "generation_mode": "knowledge_only",
                "main_source": "layer_3_pro_draft.core_insight_table",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.core_insight_table", "value": layer3.get("core_insight_table") if layer3 else None},
                    {"source": "layer_0_raw.five_elements", "value": layer0.get("five_elements") if layer0 else None},
                    {"source": "layer_0_raw.three_circles", "value": layer0.get("three_circles") if layer0 else None},
                ],
            },
            {
                "field": "root_cause",
                "final_value": layer3.get("root_cause") if layer3 else None,
                "generation_mode": "knowledge_only",
                "main_source": "layer_3_pro_draft.root_cause",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.root_cause", "value": layer3.get("root_cause") if layer3 else None},
                    {"source": "user.painting_intention", "value": record.painting_intention},
                    {
                        "source": "layer_1_lite_draft.story.contradiction",
                        "value": layer1.get("story", {}).get("contradiction")
                        if isinstance(layer1.get("story") if layer1 else None, dict)
                        else None,
                    },
                    {"source": "knowledge_signal", "value": signal_label},
                ],
            },
            {
                "field": "healing_suggestions",
                "final_value": layer3.get("healing_suggestions") if layer3 else None,
                "generation_mode": "knowledge_only",
                "main_source": "layer_3_pro_draft.healing_suggestions",
                "upstream_inputs": [
                    {"source": "layer_3_pro_draft.healing_suggestions", "value": layer3.get("healing_suggestions") if layer3 else None},
                    {"source": "layer_0_raw.imbalance_candidates", "value": layer0.get("imbalance_candidates") if layer0 else None},
                    {
                        "source": "theme_summary.core_issues",
                        "value": theme_summary.get("core_issues") if isinstance(theme_summary, dict) else None,
                    },
                    {"source": "layer_1_lite_draft.theme_insights", "value": layer1.get("theme_insights") if layer1 else None},
                ],
            },
            {
                "field": "full_report_markdown",
                "final_value": layer4.get("full_report_markdown") if layer4 else None,
                "generation_mode": "knowledge_only",
                "main_source": (
                    "template_merge_layer2_plus_layer3"
                    if layer4
                    else "missing_layer_4_pro_final"
                ),
                "upstream_inputs": [
                    {"source": "layer_2_lite_final.full_report_markdown", "value": layer2.get("full_report_markdown") if layer2 else None},
                    {"source": "layer_3_pro_draft", "value": layer3},
                    {"source": "layer_4_pro_final.ai_qa_context", "value": layer4.get("ai_qa_context") if layer4 else None},
                ],
            },
        ]

        lite_schema = self.prompt_builder.get_template("1.6", "lite").load_schema()
        pro_schema = self.prompt_builder.get_template("1.6", "pro").load_schema()
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

        lite_mapped_fields = {
            "title": "layer_2_lite_final.title",
            "overall_impression": "layer_2_lite_final.overall_impression",
            "visual_elements": "layer_2_lite_final.visual_elements_rendered",
            "emotion_portrait": "layer_2_lite_final.emotion_portrait_rendered",
            "story": "layer_2_lite_final.story",
            "theme_scene": "layer_2_lite_final.theme_insights.scene",
            "theme_impact": "layer_2_lite_final.theme_insights.impact",
            "theme_awareness": "layer_2_lite_final.theme_insights.awareness",
            "three_awareness": "layer_2_lite_final.three_awareness",
            "pro_teaser": "layer_2_lite_final.pro_teaser",
        }
        pro_mapped_fields = {
            "first_impression": "layer_3_pro_draft.first_impression / report.summary",
            "core_insight_table": "layer_3_pro_draft.core_insight_table",
            "three_circles_detailed": "layer_3_pro_draft.three_circles_detailed",
            "micro_analysis_detailed": "layer_3_pro_draft.micro_analysis_detailed",
            "imbalance_confirmed": "layer_3_pro_draft.imbalance_confirmed",
            "root_cause": "layer_3_pro_draft.root_cause",
            "healing_suggestions": "layer_3_pro_draft.healing_suggestions",
        }

        lite_schema_fields = self._build_schema_field_debug(
            lite_schema,
            lite_validation_issues,
            lite_mapped_fields,
        )
        pro_schema_fields = self._build_schema_field_debug(
            pro_schema,
            pro_validation_issues,
            pro_mapped_fields,
        )
        lite_field_diagnostics = self._build_field_diagnostics(
            lite_field_provenance,
            lite_schema_fields,
        )
        pro_field_diagnostics = self._build_field_diagnostics(
            pro_field_provenance,
            pro_schema_fields,
        )
        diagnostic_summary = self._build_diagnostic_summary(
            lite_field_diagnostics,
            pro_field_diagnostics,
        )

        steps = [
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
                "key": "layer0",
                "label": "Layer0 原始知识层",
                "status": "done" if layer0 else "missing",
                "created_at": layer0.get("created_at") if layer0 else None,
                "summary": {
                    "imbalance_candidates": layer0.get("imbalance_candidates") if layer0 else [],
                    "color_analysis": layer0.get("color_analysis") if layer0 else None,
                    "circle_colors": layer0.get("circle_colors") if layer0 else None,
                },
            },
            {
                "key": "lite_prompt",
                "label": "Lite Prompt 预览",
                "status": "done" if layer1 else "missing",
                "created_at": layer1.get("created_at") if layer1 else None,
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
                "created_at": layer2.get("created_at") if layer2 else None,
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
                "created_at": layer3.get("created_at") if layer3 else None,
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
                "created_at": layer4.get("created_at") if layer4 else None,
                "summary": {
                    "markdown_excerpt": self._excerpt(layer4.get("full_report_markdown")) if layer4 else None,
                    "ai_qa_context_excerpt": self._excerpt(layer4.get("ai_qa_context")) if layer4 else None,
                },
            },
        ]

        return {
            "interpretation_id": record.interpretation_id,
            "theme": record.theme,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "version_purchased": record.version_purchased,
            "generation_mode": {
                "strategy": "knowledge_first",
                "llm_role": "none",
                "shared_basis": "layer0_theme_projection_plus_narrative_projection",
            },
            "steps": steps,
            "layers": {
                "layer_0_raw": layer0,
                "layer_1_lite_draft": layer1,
                "layer_2_lite_final": layer2,
                "layer_3_pro_draft": layer3,
                "layer_4_pro_final": layer4,
            },
            "field_provenance": {
                "lite": lite_field_provenance,
                "pro": pro_field_provenance,
            },
            "diagnostics": {
                "summary": diagnostic_summary,
                "fields": {
                    "lite": lite_field_diagnostics,
                    "pro": pro_field_diagnostics,
                },
            },
            "prompt_debug": {
                "lite": {
                    "prompt_preview": layer1.get("prompt_preview") if layer1 else None,
                    "knowledge_skeleton_excerpt": self._extract_knowledge_skeleton_excerpt(
                        layer1.get("prompt_preview") if layer1 else None
                    ),
                    "schema": lite_schema,
                    "validation_issues": lite_validation_issues,
                    "schema_fields": lite_schema_fields,
                },
                "pro": {
                    "prompt_preview": layer3.get("prompt_preview") if layer3 else None,
                    "knowledge_skeleton_excerpt": self._extract_knowledge_skeleton_excerpt(
                        layer3.get("prompt_preview") if layer3 else None
                    ),
                    "schema": pro_schema,
                    "validation_issues": pro_validation_issues,
                    "schema_fields": pro_schema_fields,
                },
            },
        }

    def _excerpt(self, value: Any, limit: int = 220) -> Any:
        if not isinstance(value, str):
            return value
        compact = value.strip()
        if not compact:
            return ""
        if len(compact) <= limit:
            return compact
        return f"{compact[:limit]}..."

    def _extract_knowledge_skeleton_excerpt(self, prompt_preview: Any) -> str:
        if not isinstance(prompt_preview, str):
            return ""
        marker = "## 知识骨架（已确定，不要改写判断）"
        if marker not in prompt_preview:
            return ""
        after_marker = prompt_preview.split(marker, 1)[1]
        section = after_marker.split("---", 1)[0].strip()
        return self._excerpt(section, limit=320) or ""

    def _non_empty_text(self, value: Any) -> str:
        if not isinstance(value, str):
            return ""
        return value.strip()

    def _build_schema_field_debug(
        self,
        schema: dict[str, Any],
        issues: list[str],
        mapped_fields: dict[str, str],
    ) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for field in schema.get("fields", []) if isinstance(schema, dict) else []:
            if not isinstance(field, dict):
                continue
            name = field.get("name")
            if not isinstance(name, str) or not name:
                continue
            result.append(
                {
                    "name": name,
                    "required": bool(field.get("required")),
                    "type": field.get("type"),
                    "semantic_role": field.get("semantic_role"),
                    "status": "missing" if name in issues else "hit",
                    "mapped_final_field": mapped_fields.get(name),
                }
            )
        return result

    def _classify_source_category(self, source_name: str | None) -> str:
        source_text = (source_name or "").strip()
        if not source_text:
            return "unknown"
        if "template_fallback" in source_text or "default_" in source_text:
            return "fallback"
        if "template_merge" in source_text:
            return "template_merge"
        if "user." in source_text:
            return "user_input"
        if (
            "layer_0_raw" in source_text
            or "knowledge_signal" in source_text
            or "theme_summary" in source_text
        ):
            return "layer0_or_knowledge"
        if (
            "layer_1_lite_draft" in source_text
            or "layer_3_pro_draft" in source_text
        ):
            return "prompt_draft"
        if (
            "layer_2_lite_final" in source_text
            or "layer_4_pro_final" in source_text
        ):
            return "final_render"
        return "unknown"

    def _build_field_diagnostics(
        self,
        items: list[dict[str, Any]],
        schema_fields: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        schema_status_map = {
            str(field.get("name")): str(field.get("status"))
            for field in schema_fields
            if isinstance(field, dict) and field.get("name")
        }
        diagnostics: list[dict[str, Any]] = []
        for item in items:
            field_name = str(item.get("field"))
            main_source = item.get("main_source")
            upstream_inputs = (
                item.get("upstream_inputs")
                if isinstance(item.get("upstream_inputs"), list)
                else []
            )
            dependency_categories = sorted(
                {
                    self._classify_source_category(
                        upstream.get("source") if isinstance(upstream, dict) else None,
                    )
                    for upstream in upstream_inputs
                }
                - {"unknown"}
            )
            source_category = self._classify_source_category(
                main_source if isinstance(main_source, str) else None,
            )
            final_value = item.get("final_value")
            final_missing = final_value in (None, "", [], {})
            schema_status = schema_status_map.get(field_name, "unknown")
            issue_tags: list[str] = []
            if source_category == "fallback":
                issue_tags.append("fallback")
            if schema_status == "missing":
                issue_tags.append("schema_missing")
            if final_missing:
                issue_tags.append("final_missing")
            if "user_input" in dependency_categories:
                issue_tags.append("depends_on_user_input")
            if "layer0_or_knowledge" in dependency_categories:
                issue_tags.append("depends_on_layer0")
            if (
                "prompt_draft" in dependency_categories
                or source_category == "prompt_draft"
            ):
                issue_tags.append("depends_on_prompt_draft")
            risk_score = 0
            if "fallback" in issue_tags:
                risk_score += 40
            if "schema_missing" in issue_tags:
                risk_score += 35
            if "final_missing" in issue_tags:
                risk_score += 30
            if source_category == "template_merge":
                risk_score += 10
            if "depends_on_layer0" in issue_tags:
                risk_score += 8
            if "depends_on_user_input" in issue_tags:
                risk_score += 6
            if "depends_on_prompt_draft" in issue_tags:
                risk_score += 5
            if risk_score >= 65:
                risk_level = "high"
            elif risk_score >= 30:
                risk_level = "medium"
            else:
                risk_level = "low"
            diagnostics.append(
                {
                    "field": field_name,
                    "main_source": main_source,
                    "main_source_category": source_category,
                    "dependency_categories": dependency_categories,
                    "schema_status": schema_status,
                    "final_missing": final_missing,
                    "issue_tags": issue_tags,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "suggested_action": self._build_field_suggested_action(
                        field=field_name,
                        source_category=source_category,
                        schema_status=schema_status,
                        final_missing=final_missing,
                        dependency_categories=dependency_categories,
                        issue_tags=issue_tags,
                    ),
                    "diagnosis": self._build_field_diagnosis_text(
                        field=field_name,
                        source_category=source_category,
                        schema_status=schema_status,
                        final_missing=final_missing,
                        dependency_categories=dependency_categories,
                    ),
                }
            )
        return sorted(
            diagnostics,
            key=lambda item: (
                -int(item.get("risk_score", 0)),
                str(item.get("field", "")),
            ),
        )

    def _build_diagnostic_summary(
        self,
        lite_items: list[dict[str, Any]],
        pro_items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        combined = lite_items + pro_items
        fallback_fields = [item["field"] for item in combined if "fallback" in item.get("issue_tags", [])]
        schema_missing_fields = [item["field"] for item in combined if "schema_missing" in item.get("issue_tags", [])]
        user_input_driven = [item["field"] for item in combined if "depends_on_user_input" in item.get("issue_tags", [])]
        layer0_driven = [item["field"] for item in combined if "depends_on_layer0" in item.get("issue_tags", [])]
        prompt_draft_driven = [item["field"] for item in combined if "depends_on_prompt_draft" in item.get("issue_tags", [])]
        high_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "high"]
        medium_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "medium"]
        low_risk_fields = [item["field"] for item in combined if item.get("risk_level") == "low"]
        recommended_first_actions = [
            {
                "field": item["field"],
                "risk_level": item["risk_level"],
                "suggested_action": item.get("suggested_action"),
            }
            for item in combined[:5]
        ]
        return {
            "fallback_count": len(fallback_fields),
            "schema_missing_count": len(schema_missing_fields),
            "user_input_driven_count": len(user_input_driven),
            "layer0_driven_count": len(layer0_driven),
            "prompt_draft_driven_count": len(prompt_draft_driven),
            "no_llm_override_on_structured_fields": True,
            "high_risk_count": len(high_risk_fields),
            "medium_risk_count": len(medium_risk_fields),
            "low_risk_count": len(low_risk_fields),
            "fallback_fields": fallback_fields,
            "schema_missing_fields": schema_missing_fields,
            "user_input_driven_fields": user_input_driven,
            "layer0_driven_fields": layer0_driven,
            "prompt_draft_driven_fields": prompt_draft_driven,
            "high_risk_fields": high_risk_fields,
            "medium_risk_fields": medium_risk_fields,
            "low_risk_fields": low_risk_fields,
            "recommended_first_actions": recommended_first_actions,
        }

    def _build_field_diagnosis_text(
        self,
        *,
        field: str,
        source_category: str,
        schema_status: str,
        final_missing: bool,
        dependency_categories: list[str],
    ) -> str:
        parts = [f"{field}"]
        if final_missing:
            parts.append("当前最终值缺失")
        if schema_status == "missing":
            parts.append("schema 必填字段未命中")
        if source_category == "fallback":
            parts.append("主要走了 fallback 产出")
        elif source_category == "prompt_draft":
            parts.append("主要来自 prompt draft")
        elif source_category == "layer0_or_knowledge":
            parts.append("主要依赖 Layer0 / knowledge")
        elif source_category == "template_merge":
            parts.append("主要由最终模板拼装")
        if "user_input" in dependency_categories:
            parts.append("对用户输入较敏感")
        if "layer0_or_knowledge" in dependency_categories:
            parts.append("对 Layer0 知识层较敏感")
        if "prompt_draft" in dependency_categories:
            parts.append("对 prompt draft 较敏感")
        return "；".join(parts)

    def _build_field_suggested_action(
        self,
        *,
        field: str,
        source_category: str,
        schema_status: str,
        final_missing: bool,
        dependency_categories: list[str],
        issue_tags: list[str],
    ) -> dict[str, Any]:
        if "schema_missing" in issue_tags and "fallback" in issue_tags:
            return {
                "priority": "p0",
                "owner": "prompt",
                "action": f"先检查 {field} 的 prompt 输出字段是否命中 schema，再确认 fallback 是否误触发。",
            }
        if "schema_missing" in issue_tags:
            return {
                "priority": "p0",
                "owner": "prompt",
                "action": f"优先修改 {field} 对应 prompt/schema 对齐，确保模型稳定返回该字段。",
            }
        if final_missing:
            return {
                "priority": "p0",
                "owner": "template",
                "action": f"先检查 {field} 在最终模板拼装时是否被正确带入最终 report。",
            }
        if source_category == "fallback":
            return {
                "priority": "p1",
                "owner": "prompt",
                "action": f"{field} 当前主要走 fallback，优先提高 prompt draft 对该字段的稳定产出。",
            }
        if "depends_on_layer0" in issue_tags:
            return {
                "priority": "p1",
                "owner": "layer0",
                "action": f"{field} 强依赖 Layer0，先检查颜色分析、三圈能量和失衡候选是否合理。",
            }
        if "depends_on_user_input" in issue_tags:
            return {
                "priority": "p2",
                "owner": "input",
                "action": f"{field} 对用户输入敏感，先确认意图/感受是否缺失或质量不足。",
            }
        if "depends_on_prompt_draft" in issue_tags:
            return {
                "priority": "p2",
                "owner": "prompt",
                "action": f"{field} 主要依赖 prompt draft，优先比对 draft 和 final 是否发生不必要改写。",
            }
        if source_category == "template_merge":
            return {
                "priority": "p2",
                "owner": "template",
                "action": f"{field} 主要由模板拼装，优先检查 Layer2/Layer3 到最终 Markdown 的组装逻辑。",
            }
        return {
            "priority": "p3",
            "owner": "review",
            "action": f"{field} 当前链路相对稳定，优先做抽样复核即可。",
        }
