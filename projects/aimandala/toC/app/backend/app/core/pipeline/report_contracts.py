"""Structured report contracts and response assembly for migrated V2 reports."""

from __future__ import annotations

import re
from typing import Any

from .data_models import InterpretationRecord, Layer1LiteDraft, Layer3ProDraft
from .report_blueprints import PRO_REPORT_BLUEPRINT
from .structured_report_schema import get_structured_report_contract


TOPIC_ORIENTATION_PRESETS: dict[str, dict[str, Any]] = {
    "general": {
        "label": "全面解读",
        "focus": "这个议题会从整体状态、能量分布、情绪模式和当下可走的一小步来理解这张画。",
        "key_terms": [],
    },
    "wealth_career": {
        "label": "财富事业",
        "focus": "这个议题通常关注你如何使用行动力、价值感、资源感和目标节奏。",
        "key_terms": [
            {
                "term": "价值感",
                "explanation": "你是否觉得自己的付出、能力和选择值得被看见。",
            },
            {
                "term": "行动节奏",
                "explanation": "你在推进目标时，是更容易稳定前进，还是在压力下收缩或过度用力。",
            },
        ],
    },
    "intimate_relationship": {
        "label": "亲密关系",
        "focus": "这个议题通常关注靠近、边界、安全感和依恋模式。",
        "key_terms": [
            {
                "term": "安全感",
                "explanation": "你在关系里能否感到自己可以被接住，同时仍保有自己的边界。",
            },
            {
                "term": "依恋模式",
                "explanation": "你在靠近、退开、表达需要和保护自己之间形成的惯性。",
            },
        ],
    },
    "father_relationship": {
        "label": "与父亲的关系",
        "focus": "这个议题通常关注权威、规则、行动许可、边界和被认可的经验。",
        "key_terms": [
            {
                "term": "权威关系",
                "explanation": "你如何感受规则、评价和外部要求，以及它们对行动感的影响。",
            },
            {
                "term": "行动许可",
                "explanation": "你是否允许自己向外表达、尝试、争取和承担选择。",
            },
        ],
    },
    "mother_relationship": {
        "label": "与母亲的关系",
        "focus": "这个议题通常关注滋养、接纳、依赖、分离和身体层面的安全感。",
        "key_terms": [
            {
                "term": "滋养感",
                "explanation": "你能否感到自己被照顾，也能否把照顾重新给回自己。",
            },
            {
                "term": "分离与边界",
                "explanation": "你如何在亲近与成为自己之间找到更舒适的位置。",
            },
        ],
    },
    "parent_child_relationship": {
        "label": "亲子关系",
        "focus": "这个议题通常关注照顾、期待、边界、责任感和代际模式。",
        "key_terms": [
            {
                "term": "代际模式",
                "explanation": "家庭中重复出现的期待、责任和回应方式。",
            },
            {
                "term": "照顾边界",
                "explanation": "你如何在爱与责任中保留自己的感受和节奏。",
            },
        ],
    },
    "health_wellness": {
        "label": "身体健康",
        "focus": "这个议题通常关注身体信号、压力调节、休息能力和身心连接。",
        "key_terms": [
            {
                "term": "身体信号",
                "explanation": "身体用紧绷、疲惫、兴奋或迟钝提示你当前的状态。",
            },
            {
                "term": "压力调节",
                "explanation": "你如何在外界压力和内在恢复之间重新找到节奏。",
            },
        ],
    },
    "personal_growth": {
        "label": "个人成长",
        "focus": "这个议题通常关注自我认同、改变动力、内在资源和新的选择方式。",
        "key_terms": [
            {
                "term": "自我认同",
                "explanation": "你如何理解自己是谁，以及现在正在成为怎样的人。",
            },
            {
                "term": "成长边界",
                "explanation": "你在改变时需要的安全感、节奏和可承受范围。",
            },
        ],
    },
}


class PromptSchemaValidator:
    """Validate Lite/Pro draft payloads against the current structured contract."""

    def validate_lite(self, layer: Layer1LiteDraft) -> list[str]:
        required_fields = [
            "title",
            "overall_impression",
            "visual_elements",
            "emotion_portrait",
            "story",
            "theme_scene",
            "theme_impact",
            "theme_awareness",
            "three_awareness",
            "pro_teaser",
        ]
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
        required_fields = [
            "first_impression",
            "core_insight_table",
            "three_circles_detailed",
            "micro_analysis_detailed",
            "imbalance_confirmed",
            "root_cause",
            "healing_suggestions",
        ]
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

    def __init__(self) -> None:
        self.validator = PromptSchemaValidator()

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
            deep_impression = self._sanitize_text(
                pro_draft.first_impression if pro_draft else ""
            )
            return {
                "version": "pro",
                "title": PRO_REPORT_BLUEPRINT.structure_labels["report_title"],
                "overall_impression": deep_impression or None,
                "structured": contract.build_payload({
                    "prompt_preview": pro_draft.prompt_preview if pro_draft else "",
                    "prompt_schema_validation_issues": (
                        self.validator.validate_pro(pro_draft)
                        if pro_draft
                        else ["missing_layer_3_pro_draft"]
                    ),
                    "topic_context": self._build_topic_context(record, "pro"),
                    "deep_impression": deep_impression,
                    "evidence_digest": self._build_pro_evidence_digest(pro_draft),
                    "imbalance_diagnosis": self._build_pro_imbalance_diagnosis(pro_draft),
                    "root_cause_chain": self._build_pro_root_cause_chain(pro_draft),
                    "deep_structure_interpretation": self._build_pro_deep_structure_interpretation(
                        record,
                        pro_draft,
                    ),
                    "healing_plan": self._build_pro_healing_plan(pro_draft),
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
                    "topic_context": self._build_topic_context(record, "lite"),
                    "current_reading": lite_report.overall_impression,
                    "visual_basis": lite_report.visual_elements_rendered,
                    "pattern_interpretation": self._build_lite_pattern_interpretation(lite_report),
                    "life_connection": self._build_lite_life_connection(lite_report),
                    "lite_healing_guidance": self._build_lite_healing_guidance(lite_report),
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

    def _build_topic_context(
        self,
        record: InterpretationRecord,
        report_mode: str,
    ) -> dict[str, Any]:
        topic = (record.theme or "general").strip() or "general"
        preset = TOPIC_ORIENTATION_PRESETS.get(topic, {})
        topic_label = str(preset.get("label") or self._fallback_topic_label(topic)).strip()
        focus = str(preset.get("focus") or f"这个议题会从{topic_label}的角度理解这张画。").strip()
        key_terms = preset.get("key_terms", [])
        return {
            "topic": topic,
            "topic_label": topic_label,
            "report_mode": report_mode,
            "orientation": {
                "intro": f"这份报告会从{topic_label}这个议题角度看这张画。",
                "focus": focus,
                "key_terms": key_terms if isinstance(key_terms, list) else [],
            },
        }

    def _fallback_topic_label(self, topic: str) -> str:
        labels = {
            "general": "全面解读",
            "wealth_career": "财富事业",
            "intimate_relationship": "亲密关系",
            "father_relationship": "与父亲的关系",
            "mother_relationship": "与母亲的关系",
            "parent_child_relationship": "亲子关系",
            "health_wellness": "身体健康",
            "personal_growth": "个人成长",
        }
        return labels.get(topic, topic.replace("_", " ").strip() or "全面解读")

    def _build_lite_pattern_interpretation(self, lite_report: Any) -> str:
        story = lite_report.story if getattr(lite_report, "story", None) else None
        parts = [
            getattr(lite_report, "emotion_portrait_rendered", ""),
            story.pattern.content if story and story.pattern else "",
            story.defense.content if story and story.defense else "",
            story.block.content if story and story.block else "",
        ]
        return self._join_text(parts)

    def _build_lite_life_connection(self, lite_report: Any) -> str:
        theme_insights = (
            lite_report.theme_insights.to_dict()
            if getattr(lite_report, "theme_insights", None)
            else {}
        )
        return self._join_text([
            theme_insights.get("scene", ""),
            theme_insights.get("impact", ""),
            theme_insights.get("awareness", ""),
        ])

    def _build_pro_evidence_digest(self, pro_draft: Layer3ProDraft | None) -> str:
        if pro_draft is None:
            return ""
        circle_parts = []
        for item in (pro_draft.three_circles_detailed or {}).values():
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()
            reading = str(item.get("reading") or "").strip()
            if reading:
                circle_parts.append(f"{label}：{reading}" if label else reading)
        micro_parts = [
            str(value).strip()
            for value in (pro_draft.micro_analysis_detailed or {}).values()
            if isinstance(value, str) and value.strip()
        ]
        core_parts = [
            str(value).strip()
            for value in (pro_draft.core_insight_table or {}).values()
            if isinstance(value, str) and value.strip()
        ]
        return self._sanitize_text(self._join_text(core_parts[:2] + circle_parts + micro_parts))

    def _build_pro_imbalance_diagnosis(self, pro_draft: Layer3ProDraft | None) -> str:
        if pro_draft is None:
            return ""
        imbalance = pro_draft.imbalance_confirmed or {}
        preferred_keys = ["primary", "summary", "evidence", "energy_level", "psychological_level"]
        parts = [
            str(imbalance.get(key) or "").strip()
            for key in preferred_keys
            if isinstance(imbalance.get(key), str) and str(imbalance.get(key)).strip()
        ]
        if parts:
            return self._sanitize_text(self._join_text(parts))
        return self._sanitize_text(self._join_text([
            str(value).strip()
            for value in imbalance.values()
            if isinstance(value, str) and value.strip()
        ]))

    def _build_pro_root_cause_chain(self, pro_draft: Layer3ProDraft | None) -> dict[str, str]:
        root_cause = pro_draft.root_cause if pro_draft else {}
        return {
            "surface": self._sanitize_narrative_sentence(
                str(root_cause.get("surface") or root_cause.get("表面现象") or "").strip()
            ),
            "mechanism": self._sanitize_narrative_sentence(
                str(root_cause.get("deeper") or root_cause.get("形成机制") or "").strip()
            ),
            "core": self._sanitize_narrative_sentence(
                str(root_cause.get("core") or root_cause.get("核心信念") or "").strip()
            ),
        }

    def _build_pro_deep_structure_interpretation(
        self,
        record: InterpretationRecord,
        pro_draft: Layer3ProDraft | None,
    ) -> str:
        topic_label = self._fallback_topic_label(record.theme or "general")
        if pro_draft is None:
            return ""
        root_chain = self._build_pro_root_cause_chain(pro_draft)
        parts = [
            f"在{topic_label}这个议题下，这份 Pro 解读会把画面证据、失衡判断和根因链放在一起看。",
            root_chain.get("mechanism", ""),
            root_chain.get("core", ""),
        ]
        return self._sanitize_text(self._join_text(parts))

    def _join_text(self, parts: list[Any]) -> str:
        cleaned = [
            str(part).strip()
            for part in parts
            if isinstance(part, str) and str(part).strip()
        ]
        return "\n\n".join(cleaned)

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
            "summary": self._sanitize_text(summary),
            "product_note": "Pro 不是串接在 Lite 后面的补充，而是另一份独立购买、独立成立的深度完整解读。",
        }

    def _build_pro_healing_plan(
        self,
        pro_draft: Layer3ProDraft | None,
    ) -> list[dict[str, str]]:
        if pro_draft is None:
            return []
        plan: list[dict[str, str]] = []
        used_practices: set[str] = set()
        for index, item in enumerate(pro_draft.healing_suggestions or []):
            if not isinstance(item, dict):
                continue
            practice = self._sanitize_or_rebuild_healing_field(
                str(item.get("practice") or "").strip(),
                field_name="practice",
                pro_draft=pro_draft,
                item_index=index,
                used_values=used_practices,
            )
            normalized = {
                "phase": self._sanitize_or_rebuild_healing_field(
                    str(item.get("phase") or "").strip(),
                    field_name="phase",
                    pro_draft=pro_draft,
                    item_index=index,
                ),
                "focus": self._sanitize_or_rebuild_healing_field(
                    str(item.get("focus") or "").strip(),
                    field_name="focus",
                    pro_draft=pro_draft,
                    item_index=index,
                ),
                "practice": practice,
            }
            if normalized["practice"]:
                used_practices.add(normalized["practice"])
            if any(normalized.values()):
                plan.append(normalized)
        return plan

    def _sanitize_or_rebuild_healing_field(
        self,
        content: str,
        *,
        field_name: str,
        pro_draft: Layer3ProDraft,
        item_index: int,
        used_values: set[str] | None = None,
    ) -> str:
        cleaned = self._sanitize_narrative_sentence(content)
        if field_name == "focus" and "稳定的调节" in cleaned:
            cleaned = ""
        if cleaned and (not used_values or cleaned not in used_values):
            return cleaned
        return self._fallback_healing_field(
            field_name=field_name,
            pro_draft=pro_draft,
            item_index=item_index,
            used_values=used_values,
        )

    def _fallback_healing_field(
        self,
        *,
        field_name: str,
        pro_draft: Layer3ProDraft,
        item_index: int,
        used_values: set[str] | None = None,
    ) -> str:
        if field_name == "phase":
            return f"第{item_index + 1}步"

        root_cause = pro_draft.root_cause or {}
        imbalance = pro_draft.imbalance_confirmed or {}
        narrative_plan = pro_draft.narrative_plan or {}
        sections = narrative_plan.get("sections", {}) if isinstance(narrative_plan, dict) else {}

        root_candidates = [
            imbalance.get("primary") if isinstance(imbalance, dict) else "",
            imbalance.get("summary") if isinstance(imbalance, dict) else "",
            root_cause.get("deeper") if isinstance(root_cause, dict) else "",
            root_cause.get("core") if isinstance(root_cause, dict) else "",
            root_cause.get("surface") if isinstance(root_cause, dict) else "",
        ]
        clean_candidates = [
            self._sanitize_narrative_sentence(str(value or "").strip())
            for value in root_candidates
            if isinstance(value, str) and str(value).strip()
        ]

        if field_name == "focus":
            theme_label = str(narrative_plan.get("theme_label") or "").strip()
            if clean_candidates:
                base = clean_candidates[min(item_index, len(clean_candidates) - 1)]
                if theme_label and theme_label not in base:
                    return f"在{theme_label}议题下，{base}"
                return base
            topic_prefix = f"在{theme_label}议题下，" if theme_label else ""
            return f"{topic_prefix}把当前失衡和根因链放在一起看，先回到能承接的节奏。"

        if field_name == "practice":
            healing_sections = sections.get("healing_suggestions", [])
            if isinstance(healing_sections, list):
                for item in healing_sections:
                    if not isinstance(item, dict):
                        continue
                    payload = item.get("content")
                    if isinstance(payload, dict):
                        value = self._sanitize_narrative_sentence(str(payload.get("practice") or "").strip())
                        if value and (not used_values or value not in used_values):
                            return value
            fallback_practices = [
                "先选一个今天能完成的最小动作，把标准从完美改成完成。",
                "完成后只记录事实进展，不立刻评价成败。",
                "在下一次推进前，先写下一个可承接的边界和一个可验证的下一步。",
            ]
            for value in fallback_practices:
                if not used_values or value not in used_values:
                    return value
            return fallback_practices[-1]

        return ""

    def _sanitize_narrative_sentence(self, content: str) -> str:
        cleaned = self._sanitize_text(content)
        if not cleaned:
            return ""
        cleaned = cleaned.replace("...", "，")
        cleaned = cleaned.replace("…", "，")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        cleaned = re.sub(r"消耗\s+你原本", "消耗自己。你原本", cleaned)
        cleaned = re.sub(r"([。！？])\s*\1+", r"\1", cleaned)
        cleaned = self._dedupe_sentences(cleaned)
        return cleaned.strip()

    def _dedupe_sentences(self, content: str) -> str:
        parts = [part.strip() for part in re.split(r"(?<=[。！？])", content) if part.strip()]
        if len(parts) <= 1:
            return content
        deduped: list[str] = []
        seen: set[str] = set()
        for part in parts:
            normalized = re.sub(r"\s+", "", part)
            if normalized in seen:
                continue
            seen.add(normalized)
            deduped.append(part)
        return " ".join(deduped)

    def _sanitize_text(self, content: str) -> str:
        if not isinstance(content, str):
            return ""
        if self._looks_like_raw_payload(content):
            return ""
        cleaned = content
        cleaned = self._strip_raw_payload_fragments(cleaned)
        banned_phrases = [
            "Lite" + " 里",
            "解锁" + "完整版",
            "补全" + "版",
            "升级" + "版",
            "21" + "天",
            "{'" + "inner'",
        ]
        for phrase in banned_phrases:
            cleaned = cleaned.replace(phrase, "")
        while "  " in cleaned:
            cleaned = cleaned.replace("  ", " ")
        return cleaned.strip()

    def _looks_like_raw_payload(self, content: str) -> bool:
        text = content.strip()
        if not text:
            return False
        key_markers = (
            "'inner':",
            '"inner":',
            "'middle':",
            '"middle":',
            "'outer':",
            '"outer":',
            "'color':",
            '"color":',
            "'depth_state':",
            '"depth_state":',
            "'avg_brightness':",
            '"avg_brightness":',
            "'avg_saturation':",
            '"avg_saturation":',
        )
        marker_count = sum(1 for marker in key_markers if marker in text)
        if marker_count >= 2:
            return True
        if marker_count >= 1 and (text.startswith("{") or text.startswith(":") or text.endswith("}")):
            return True
        return False

    def _strip_raw_payload_fragments(self, content: str) -> str:
        patterns = [
            r"\{[^{}]*(?:'|\")?(?:inner|middle|outer|depth_state|avg_brightness|avg_saturation)(?:'|\")?\s*:[^{}]*\}",
            r":\s*'[^']+'\s*,\s*'(?:inner|middle|outer)'\s*:[^\n。；]*",
            r":\s*\"[^\"]+\"\s*,\s*\"(?:inner|middle|outer)\"\s*:[^\n。；]*",
        ]
        cleaned = content
        for pattern in patterns:
            cleaned = re.sub(pattern, "", cleaned)
        return cleaned
