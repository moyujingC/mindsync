"""Structured report contracts and response assembly for migrated V2 reports."""

from __future__ import annotations

from typing import Any

from app.core.prompt.builder_v2 import PromptBuilder

from .data_models import InterpretationRecord, Layer1LiteDraft, Layer3ProDraft
from .report_blueprints import PRO_REPORT_BLUEPRINT
from .structured_report_schema import get_structured_report_contract


class PromptSchemaValidator:
    """Validate Lite/Pro structured payloads against prompt schema requirements."""

    PROMPT_VERSION = "1.6"

    def __init__(self, prompt_builder: PromptBuilder) -> None:
        self.prompt_builder = prompt_builder

    def validate_lite(self, layer: Layer1LiteDraft) -> list[str]:
        schema = self.prompt_builder.get_template(self.PROMPT_VERSION, "lite").load_schema()
        required_fields = self._extract_required_prompt_fields(schema)
        values: dict[str, Any] = {
            "title": layer.title,
            "overall_impression": layer.overall_impression,
            "visual_elements": layer.visual_elements,
            "emotion_portrait": layer.emotion_portrait,
            "story": {
                "base": layer.story.base.content if layer.story else "",
                "contradiction": layer.story.contradiction.content if layer.story else "",
                "pattern": layer.story.pattern.content if layer.story else "",
                "defense": layer.story.defense.content if layer.story else "",
                "block": layer.story.block.content if layer.story else "",
                "light": layer.story.light.content if layer.story else "",
            },
            "theme_scene": layer.theme_insights.scene if layer.theme_insights else "",
            "theme_impact": layer.theme_insights.impact if layer.theme_insights else "",
            "theme_awareness": layer.theme_insights.awareness if layer.theme_insights else "",
            "three_awareness": layer.three_awareness,
            "pro_teaser": layer.pro_teaser,
            "pro_report_entry": layer.pro_teaser,
        }
        return self._collect_missing_required_fields(values, required_fields)

    def validate_pro(self, layer: Layer3ProDraft) -> list[str]:
        schema = self.prompt_builder.get_template(self.PROMPT_VERSION, "pro").load_schema()
        required_fields = self._extract_required_prompt_fields(schema)
        values: dict[str, Any] = {
            "first_impression": layer.first_impression,
            "core_insight_table": layer.core_insight_table,
            "three_circles_detailed": layer.three_circles_detailed,
            "micro_analysis_detailed": layer.micro_analysis_detailed,
            "imbalance_confirmed": layer.imbalance_confirmed,
            "root_cause": layer.root_cause,
            "healing_suggestions": layer.healing_suggestions,
        }
        return self._collect_missing_required_fields(values, required_fields)

    def _extract_required_prompt_fields(self, schema: dict[str, Any]) -> list[str]:
        fields = schema.get("fields", []) if isinstance(schema, dict) else []
        required: list[str] = []
        for field in fields:
            if not isinstance(field, dict):
                continue
            if not field.get("required"):
                continue
            name = field.get("name")
            if isinstance(name, str) and name:
                required.append(name)
        return required

    def _collect_missing_required_fields(
        self,
        values: dict[str, Any],
        required_fields: list[str],
    ) -> list[str]:
        missing: list[str] = []
        for field_name in required_fields:
            value = values.get(field_name)
            if self._is_missing_prompt_field(value):
                missing.append(field_name)
        return missing

    def _is_missing_prompt_field(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str):
            return not value.strip()
        if isinstance(value, (list, tuple, set, dict)):
            return len(value) == 0
        return False


class ReportContractAssembler:
    """Assemble stable Lite/Pro report payloads for API responses."""

    def __init__(self, prompt_builder: PromptBuilder) -> None:
        self.validator = PromptSchemaValidator(prompt_builder)

    def build_report_payload(
        self,
        *,
        record: InterpretationRecord,
        requested_version: str,
        upgrade_diff: float,
    ) -> dict[str, Any]:
        if requested_version == "pro":
            return self._build_pro_report_payload(record)
        if requested_version == "lite":
            return self._build_lite_report_payload(record, upgrade_diff=upgrade_diff)
        return {
            "version": requested_version,
            "error": f"unsupported version: {requested_version}",
            "can_upgrade": False,
            "upgrade_price": None,
        }

    def _build_pro_report_payload(self, record: InterpretationRecord) -> dict[str, Any]:
        report = record.get_pro_report()
        pro_draft = record.layer_3_pro_draft
        if report:
            contract = get_structured_report_contract("pro")
            return {
                "version": "pro",
                "title": PRO_REPORT_BLUEPRINT.structure_labels["report_title"],
                "overall_impression": pro_draft.first_impression if pro_draft else None,
                "structured": contract.build_payload({
                    "prompt_preview": pro_draft.prompt_preview if pro_draft else "",
                    "prompt_schema_validation_issues": (
                        self.validator.validate_pro(pro_draft)
                        if pro_draft
                        else ["missing_layer_3_pro_draft"]
                    ),
                    "first_impression": pro_draft.first_impression if pro_draft else None,
                    "core_insight_table": pro_draft.core_insight_table if pro_draft else {},
                    "three_circles_detailed": pro_draft.three_circles_detailed if pro_draft else {},
                    "micro_analysis_detailed": pro_draft.micro_analysis_detailed if pro_draft else {},
                    "imbalance_confirmed": pro_draft.imbalance_confirmed if pro_draft else {},
                    "root_cause": pro_draft.root_cause if pro_draft else {},
                    "healing_suggestions": pro_draft.healing_suggestions if pro_draft else [],
                }),
                "report": report,
                "ai_qa_context": record.get_ai_qa_context(),
                "can_upgrade": False,
                "upgrade_price": None,
            }
        return {
            "version": "pro",
            "error": "pro report not generated yet",
            "can_upgrade": False,
            "upgrade_price": None,
        }

    def _build_lite_report_payload(
        self,
        record: InterpretationRecord,
        *,
        upgrade_diff: float,
    ) -> dict[str, Any]:
        lite_report = record.layer_2_lite_final
        report = record.get_lite_report()
        if report and lite_report:
            contract = get_structured_report_contract("lite")
            return {
                "version": "lite",
                "title": lite_report.title,
                "overall_impression": lite_report.overall_impression,
                "structured": contract.build_payload({
                    "prompt_preview": (
                        record.layer_1_lite_draft.prompt_preview
                        if record.layer_1_lite_draft
                        else ""
                    ),
                    "prompt_schema_validation_issues": (
                        self.validator.validate_lite(record.layer_1_lite_draft)
                        if record.layer_1_lite_draft
                        else ["missing_layer_1_lite_draft"]
                    ),
                    "title": lite_report.title,
                    "overall_impression": lite_report.overall_impression,
                    "visual_elements_rendered": lite_report.visual_elements_rendered,
                    "emotion_portrait_rendered": lite_report.emotion_portrait_rendered,
                    "story": {
                        "base": lite_report.story.base.to_dict() if lite_report.story.base else None,
                        "contradiction": (
                            lite_report.story.contradiction.to_dict()
                            if lite_report.story.contradiction
                            else None
                        ),
                        "pattern": lite_report.story.pattern.to_dict() if lite_report.story.pattern else None,
                        "defense": lite_report.story.defense.to_dict() if lite_report.story.defense else None,
                        "block": lite_report.story.block.to_dict() if lite_report.story.block else None,
                        "light": lite_report.story.light.to_dict() if lite_report.story.light else None,
                    },
                    "theme_insights": (
                        lite_report.theme_insights.to_dict() if lite_report.theme_insights else None
                    ),
                    "three_awareness": [item.to_dict() for item in lite_report.three_awareness],
                    "self_understanding_blocks": self._build_self_understanding_blocks(lite_report),
                    "lite_healing_guidance": self._build_lite_healing_guidance(lite_report),
                    "six_insights_rendered": lite_report.six_insights_rendered,
                    "experiment_rendered": lite_report.experiment_rendered,
                    "pro_report_entry": self._build_pro_report_entry(lite_report),
                }),
                "report": report,
                "can_upgrade": record.can_upgrade_to_pro(),
                "upgrade_price": upgrade_diff if record.can_upgrade_to_pro() else None,
            }
        return {
            "version": "lite",
            "error": "lite report not generated yet",
            "can_upgrade": False,
            "upgrade_price": None,
        }

    def _build_self_understanding_blocks(self, lite_report: Any) -> dict[str, Any]:
        story = lite_report.story if getattr(lite_report, "story", None) else None
        theme_insights = (
            lite_report.theme_insights.to_dict()
            if getattr(lite_report, "theme_insights", None)
            else {"scene": "", "impact": "", "awareness": ""}
        )
        daily_awareness = [
            item.to_dict()
            for item in getattr(lite_report, "three_awareness", []) or []
        ]

        return {
            "title": getattr(lite_report, "title", ""),
            "opening_hit": getattr(lite_report, "overall_impression", ""),
            "visual_evidence": {
                "summary": getattr(lite_report, "visual_elements_rendered", ""),
                "anchors": [],
            },
            "state_interpretation": {
                "current_state": story.base.content if story and story.base else "",
                "emotional_tension": story.contradiction.content if story and story.contradiction else "",
                "explanation_chain": getattr(lite_report, "emotion_portrait_rendered", ""),
            },
            "pattern_naming": {
                "pattern_name": "",
                "pattern_description": story.pattern.content if story and story.pattern else "",
                "protective_logic": story.defense.content if story and story.defense else "",
            },
            "reality_connection": {
                "life_dimension": "",
                "typical_scene": theme_insights.get("scene", ""),
                "current_impact": theme_insights.get("impact", ""),
            },
            "next_step": {
                "direction": theme_insights.get("awareness", ""),
                "action": daily_awareness[0]["content"] if daily_awareness else "",
            },
            "theme_insights": theme_insights,
            "daily_awareness": daily_awareness,
        }

    def _build_lite_healing_guidance(self, lite_report: Any) -> dict[str, Any]:
        theme_insights = (
            lite_report.theme_insights.to_dict()
            if getattr(lite_report, "theme_insights", None)
            else {"scene": "", "impact": "", "awareness": ""}
        )
        awareness_items = [
            item.to_dict()
            for item in getattr(lite_report, "three_awareness", []) or []
        ]
        experiment_text = str(getattr(lite_report, "experiment_rendered", "") or "").strip()
        directions = []
        practices = []

        direction_candidates = [
            ("先稳住当前节奏", theme_insights.get("awareness", "")),
            ("把理解放回现实场景", theme_insights.get("impact", "")),
            ("保留一个更轻的动作方向", theme_insights.get("scene", "")),
        ]
        for title, content in direction_candidates:
            if isinstance(content, str) and content.strip():
                directions.append({"title": title, "content": content.strip()})

        for item in awareness_items[:3]:
            title = str(item.get("title") or "").strip()
            content = str(item.get("content") or "").strip()
            if title and content:
                practices.append({"title": title, "content": content})

        if experiment_text:
            practices.append(
                {
                    "title": "现在可以先做的小练习",
                    "content": experiment_text,
                }
            )

        return {
            "directions": directions[:3],
            "micro_practices": practices[:3],
        }

    def _build_pro_report_entry(self, lite_report: Any) -> dict[str, str]:
        teaser = str(getattr(lite_report, "pro_teaser", "") or "").strip()
        summary = "如果你希望从更深层结构继续理解这张画，Pro 会提供更完整的结构、根因与疗愈视角。"
        if teaser and "更深层结构" in teaser:
            summary = teaser
        return {
            "title": "另一份更深的独立报告",
            "summary": summary,
            "product_note": "Pro 不是 Lite 的升级版，而是另一份独立购买、独立成立的深度完整解读。",
        }
