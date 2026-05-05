"""Narrative helpers backed by the v2.1 knowledge runtime."""

from __future__ import annotations

import re
from typing import Any

from ..contracts import FallbackLevel, QueryResult
from ..repository import KnowledgeRepository
from .healing_service import HealingService
from .imbalance_service import ImbalanceService
from .theme_service import ThemeService


class NarrativeContextService:
    """Serve narrative assets and build report chat context."""

    def __init__(
        self,
        *,
        repository: KnowledgeRepository,
        theme_service: ThemeService,
        healing_service: HealingService,
        imbalance_service: ImbalanceService,
    ) -> None:
        self.repository = repository
        self.theme_service = theme_service
        self.healing_service = healing_service
        self.imbalance_service = imbalance_service

    def get_insight_templates(self, theme: str) -> dict[str, Any]:
        payload = self.repository.get_lookup("theme_narrative").get(theme, {})
        if payload:
            return payload.get("insight_templates", {})
        return self.repository.get_lookup("theme_narrative").get("general", {}).get(
            "insight_templates", {}
        )

    def query_narrative(self, theme: str) -> QueryResult:
        payload = self.repository.get_lookup("theme_narrative").get(theme, {})
        if payload:
            return QueryResult(
                value=payload,
                entity_id=f"narrative.{theme}",
                evidence=[
                    {
                        "entity_id": f"narrative.{theme}",
                        "source_path": f"narrative/{theme}.yaml",
                        "kind": "theme_narrative",
                    }
                ],
            )

        general = self.repository.get_lookup("theme_narrative").get("general", {})
        if general:
            return QueryResult(
                value=general,
                entity_id="narrative.general",
                fallback_level=FallbackLevel.GENERAL.value,
                fallback_used=True,
                source="fallback",
                evidence=[
                    {
                        "entity_id": "narrative.general",
                        "source_path": "narrative/general.yaml",
                        "kind": "theme_narrative",
                    }
                ],
                warnings=[f"theme {theme} missing narrative asset; used general"],
            )

        return QueryResult.not_found(
            f"narrative {theme} not found",
            entity_id=f"narrative.{theme}",
            warnings=[f"theme {theme} missing narrative asset"],
        )

    def get_pro_upgrade_teaser(self, theme: str) -> str:
        payload = self.repository.get_lookup("theme_narrative").get(theme, {})
        if payload and payload.get("pro_upgrade_teaser"):
            return str(payload["pro_upgrade_teaser"])
        general = self.repository.get_lookup("theme_narrative").get("general", {})
        return str(general.get("pro_upgrade_teaser", ""))

    def build_ai_qa_context(
        self,
        *,
        record_theme: str,
        interpretation_id: str,
        lite_title: str,
        lite_overall_impression: str,
        pro_draft: Any,
    ) -> str:
        theme_summary = self.theme_service.get_theme_summary(record_theme)
        healing_template = self.healing_service.get_healing_template(record_theme)
        phase_labels = self._extract_phase_labels(healing_template.get("phases", []))
        lines = [
            f"主题：{record_theme}",
            f"主题名称：{theme_summary.get('name', '')}",
            f"主题核心议题：{' / '.join(theme_summary.get('core_issues', [])[:4])}",
            f"解读记录ID：{interpretation_id}",
            f"Lite 标题：{lite_title}",
            f"Lite 整体印象：{lite_overall_impression}",
            f"疗愈阶段：{' / '.join(phase_labels[:4])}",
        ]
        if pro_draft and getattr(pro_draft, "first_impression", ""):
            lines.append(f"第一眼直觉：{pro_draft.first_impression}")
        if pro_draft and getattr(pro_draft, "core_insight_table", None):
            lines.append(
                "核心洞察："
                + "；".join(
                    f"{key}={value}"
                    for key, value in list((pro_draft.core_insight_table or {}).items())[:4]
                    if isinstance(value, str) and value.strip()
                )
            )
        if pro_draft and getattr(pro_draft, "healing_suggestions", None):
            practices = [
                item.get("practice", "")
                for item in (pro_draft.healing_suggestions or [])
                if isinstance(item, dict) and isinstance(item.get("practice"), str)
            ]
            if practices:
                lines.append("可继续追问：" + "；".join(item for item in practices if item.strip()))
        return "\n".join(line for line in lines if line)

    def build_theme_prompt_context(
        self,
        *,
        theme: str,
        theme_label: str = "",
        painting_intention: str = "",
        painting_feeling: str = "",
        inner_radius: int = 33,
        middle_radius: int = 66,
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        inner_dominant: str = "",
        middle_dominant: str = "",
        outer_dominant: str = "",
        signal: str = "",
        element_distribution: list[dict[str, Any]] | None = None,
        element_states: list[dict[str, Any]] | dict[str, Any] | None = None,
        triad_states: list[dict[str, Any]] | None = None,
        primary_candidates: list[Any] | None = None,
        synthetic_signal: dict[str, Any] | None = None,
        theme_projection: dict[str, Any] | None = None,
        fidelity_flags: list[str] | None = None,
        fallback_summary: dict[str, Any] | None = None,
    ) -> str:
        resolved_theme = theme or "general"
        theme_summary = self.theme_service.get_theme_summary(resolved_theme)
        resolved_theme_label = (
            theme_label
            or str(theme_summary.get("name") or "").strip()
            or resolved_theme
            or "当前主题"
        )
        intention = str(painting_intention or "").strip() or "未填写"
        feeling = str(painting_feeling or "").strip() or "未填写"
        lines = [
            f"- 当前主题：{resolved_theme_label}",
            f"- 创作前意图：{intention}",
            f"- 创作时感受：{feeling}",
            f"- 内圈半径：{inner_radius}%",
            f"- 中圈半径：{middle_radius}%",
        ]
        if dominant_element:
            line = f"- 五行主导：{dominant_element} {dominant_percentage:.2f}%"
            if secondary_element:
                line += f"，其次是 {secondary_element} {secondary_percentage:.2f}%"
            lines.append(line)
        lines.append(
            "- 三圈主导："
            f"内圈{inner_dominant or '未识别'} / "
            f"中圈{middle_dominant or '未识别'} / "
            f"外圈{outer_dominant or '未识别'}"
        )
        if signal:
            lines.append(f"- 知识库失衡候选：{self._get_signal_label(signal)}")

        knowledge_theme_name = str(theme_summary.get("name") or "").strip()
        core_issues = theme_summary.get("core_issues") or []
        focus_element = str(theme_summary.get("focus_element") or "").strip()
        if knowledge_theme_name:
            lines.append(f"- V2知识主题：{knowledge_theme_name}")
        if isinstance(core_issues, list) and core_issues:
            normalized_issues = [
                str(item).strip()
                for item in core_issues[:4]
                if isinstance(item, str) and str(item).strip()
            ]
            if normalized_issues:
                lines.append(f"- V2主题核心议题：{' / '.join(normalized_issues)}")
        if focus_element:
            lines.append(f"- V2主题关注元素：{focus_element}")

        normalized_distribution = []
        for item in element_distribution or []:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name") or item.get("element") or "").strip()
            if not name:
                continue
            try:
                percentage = float(item.get("percentage", 0.0) or 0.0)
            except (TypeError, ValueError):
                percentage = 0.0
            normalized_distribution.append(f"{name}{percentage:.2f}%")
        if normalized_distribution:
            lines.append(f"- 五行分布：{' / '.join(normalized_distribution)}")

        normalized_element_states = (
            list(element_states.values())
            if isinstance(element_states, dict)
            else list(element_states or [])
        )
        rendered_element_states: list[str] = []
        for item in normalized_element_states:
            if not isinstance(item, dict):
                continue
            name = str(item.get("element") or item.get("name") or "").strip()
            state = str(item.get("state") or "").strip()
            if not name or not state:
                continue
            rendered_element_states.append(f"{name}={state}")
        if rendered_element_states:
            lines.append(f"- 五行状态：{' / '.join(rendered_element_states)}")

        rendered_triad_states: list[str] = []
        for item in triad_states or []:
            if not isinstance(item, dict):
                continue
            circle = str(item.get("circle") or "").strip()
            dominant = str(item.get("dominant_element") or "").strip()
            inferred = str(item.get("inferred_state") or "").strip()
            if not circle or not dominant:
                continue
            if inferred:
                rendered_triad_states.append(f"{circle}:{dominant}({inferred})")
            else:
                rendered_triad_states.append(f"{circle}:{dominant}")
        if rendered_triad_states:
            lines.append(f"- 三元结构：{' / '.join(rendered_triad_states)}")

        rendered_primary_candidates: list[str] = []
        for item in primary_candidates or []:
            if isinstance(item, dict):
                candidate_id = str(item.get("id") or "").strip()
                try:
                    score = float(item.get("score", 0.0) or 0.0)
                except (TypeError, ValueError):
                    score = 0.0
                if candidate_id:
                    rendered_primary_candidates.append(f"{candidate_id}({score:.2f})")
            elif isinstance(item, str) and item.strip():
                rendered_primary_candidates.append(item.strip())
        if rendered_primary_candidates:
            lines.append(f"- 主候选：{' / '.join(rendered_primary_candidates)}")

        synthetic = synthetic_signal if isinstance(synthetic_signal, dict) else {}
        if synthetic:
            signal_id = str(synthetic.get("id") or "").strip()
            used = bool(synthetic.get("used"))
            reason = str(synthetic.get("reason") or "").strip()
            signal_parts = []
            if signal_id:
                signal_parts.append(signal_id)
            signal_parts.append(f"used={str(used).lower()}")
            if reason:
                signal_parts.append(f"reason={reason}")
            lines.append(f"- 合成信号：{' / '.join(signal_parts)}")

        projection = theme_projection if isinstance(theme_projection, dict) else {}
        if projection:
            projection_summary = str(
                projection.get("summary")
                or projection.get("theme_name")
                or projection.get("theme")
                or ""
            ).strip()
            if projection_summary:
                lines.append(f"- theme_projection：{projection_summary}")

        normalized_fidelity_flags = [
            str(item).strip()
            for item in (fidelity_flags or [])
            if isinstance(item, str) and str(item).strip()
        ]
        if normalized_fidelity_flags:
            lines.append(f"- 保真标记：{' / '.join(normalized_fidelity_flags)}")

        normalized_fallback = fallback_summary if isinstance(fallback_summary, dict) else {}
        if normalized_fallback:
            levels = normalized_fallback.get("levels", []) or []
            warnings = normalized_fallback.get("warnings", []) or []
            level_text = ",".join(
                str(item).strip()
                for item in levels
                if isinstance(item, str) and str(item).strip()
            )
            warning_text = " / ".join(
                str(item).strip()
                for item in warnings
                if isinstance(item, str) and str(item).strip()
            )
            lines.append(
                "- fallback摘要："
                f"used={str(bool(normalized_fallback.get('used'))).lower()}"
                f"; levels={level_text or 'none'}"
                f"; warnings={warning_text or 'none'}"
            )

        return "\n".join(lines)

    def get_theme_label(self, theme: str, fallback_label: str = "") -> str:
        summary = self.theme_service.get_theme_summary(theme or "general")
        name = str(summary.get("name") or "").strip()
        if name:
            return name
        fallback = str(fallback_label or "").strip()
        return fallback or (theme or "整体")

    def get_signal_label(self, signal: str) -> str:
        return self._get_signal_label(signal)

    def describe_signal(self, signal: str) -> str:
        return self._describe_signal(signal)

    def get_element_theme_phrase(self, theme: str, element_name: str) -> str:
        return self._get_element_theme_phrase(theme or "general", element_name)

    def get_element_core_keywords(self, theme: str, element_name: str) -> str:
        return self._get_element_core_keywords(theme or "general", element_name)

    def describe_circle_transition(
        self,
        *,
        inner_dominant: str = "",
        middle_dominant: str = "",
        outer_dominant: str = "",
    ) -> str:
        inner = str(inner_dominant or "").strip()
        middle = str(middle_dominant or "").strip()
        outer = str(outer_dominant or "").strip()
        if inner and middle and outer:
            if inner == middle == outer:
                return f"三圈目前都围绕「{inner}」展开。"
            if inner == middle and outer != inner:
                return f"内圈和中圈都更偏「{inner}」，外圈则开始转向「{outer}」。"
            return f"三圈依次呈现出「{inner} -> {middle} -> {outer}」的变化。"
        return ""

    def clean_text_block(self, content: str) -> str:
        return self._clean_text_block(content)

    def build_imbalance_narrative_basis(
        self,
        *,
        theme: str,
        imbalance_type: str,
        theme_label: str = "",
    ) -> dict[str, Any]:
        legacy_projection = self._build_imbalance_projection_payload(
            theme=theme,
            imbalance_type=imbalance_type,
            theme_label=theme_label,
        )
        if not legacy_projection:
            return {}

        resolved_theme = theme or "general"
        resolved_theme_label = (
            theme_label
            or self.get_theme_label(resolved_theme, fallback_label=resolved_theme)
        )
        rule_ref = f"rule:imbalance:{imbalance_type}"
        theme_ref = f"theme:{resolved_theme}"

        return {
            "mode": "imbalance_basis",
            "generation_mode": "evidence_first",
            "theme": resolved_theme,
            "theme_label": resolved_theme_label,
            "imbalance_type": imbalance_type,
            "sections": {
                "summary": self._make_text_section(
                    (
                        f"在{resolved_theme_label}主题下，{legacy_projection.get('summary', '')}"
                        if legacy_projection.get("summary")
                        else ""
                    ),
                    knowledge_hit_refs=[theme_ref],
                    rule_refs=[rule_ref],
                    theme_projection_refs=[f"theme_label:{resolved_theme_label}"],
                ),
                "evidence": self._make_text_section(
                    legacy_projection.get("evidence", ""),
                    knowledge_hit_refs=[theme_ref],
                    rule_refs=[rule_ref],
                    theme_projection_refs=[f"theme_label:{resolved_theme_label}"],
                ),
                "block_point": self._make_text_section(
                    legacy_projection.get("block_point", ""),
                    knowledge_hit_refs=[theme_ref],
                    rule_refs=[rule_ref],
                ),
                "direction": self._make_text_section(
                    legacy_projection.get("direction", ""),
                    knowledge_hit_refs=[theme_ref],
                    rule_refs=[rule_ref],
                ),
                "healing_core": self._make_text_section(
                    legacy_projection.get("healing_core", ""),
                    knowledge_hit_refs=[theme_ref, f"healing:{imbalance_type}"],
                    rule_refs=[rule_ref],
                ),
                "deeper_root": self._make_text_section(
                    legacy_projection.get("deeper_root", ""),
                    knowledge_hit_refs=[theme_ref],
                    rule_refs=[rule_ref],
                ),
                "core_root": self._make_text_section(
                    legacy_projection.get("core_root", ""),
                    knowledge_hit_refs=[theme_ref, f"healing:{imbalance_type}"],
                    rule_refs=[rule_ref],
                ),
            },
            "legacy_projection": legacy_projection,
        }

    def build_lite_narrative_plan(
        self,
        *,
        theme: str,
        theme_label: str = "",
        inner_radius: int = 33,
        middle_radius: int = 66,
        title_templates: dict[str, str] | None = None,
        six_insight_templates: dict[str, dict[str, str]] | None = None,
        experiment_title: str = "",
        experiment_content: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        inner_dominant: str = "",
        middle_dominant: str = "",
        outer_dominant: str = "",
        circle_pattern: str = "",
        circle_readings: list[str] | None = None,
        transition: str = "",
        adjacent: list[str] | None = None,
        signal: str = "",
        feeling_hint: str = "",
        default_pro_teaser: str = "",
        interpretation_method_trace: dict[str, Any] | None = None,
        fidelity_flags: list[str] | None = None,
        fallback_summary: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        legacy_projection = self._build_lite_projection_payload(
            theme=theme,
            theme_label=theme_label,
            inner_radius=inner_radius,
            middle_radius=middle_radius,
            title_templates=title_templates,
            six_insight_templates=six_insight_templates,
            experiment_title=experiment_title,
            experiment_content=experiment_content,
            dominant_element=dominant_element,
            dominant_percentage=dominant_percentage,
            secondary_element=secondary_element,
            secondary_percentage=secondary_percentage,
            weakest_element=weakest_element,
            weakest_percentage=weakest_percentage,
            inner_dominant=inner_dominant,
            middle_dominant=middle_dominant,
            outer_dominant=outer_dominant,
            circle_pattern=circle_pattern,
            circle_readings=circle_readings,
            transition=transition,
            adjacent=adjacent,
            signal=signal,
            feeling_hint=feeling_hint,
            default_pro_teaser=default_pro_teaser,
        )
        if not legacy_projection:
            return {}

        resolved_theme = theme or "general"
        resolved_theme_label = (
            theme_label
            or self.get_theme_label(resolved_theme, fallback_label=resolved_theme)
        )
        signal_ref = f"signal:{signal}" if signal else ""
        visual_refs = [
            ref
            for ref in [
                f"dominant:{dominant_element}" if dominant_element else "",
                f"secondary:{secondary_element}" if secondary_element else "",
                f"inner:{inner_dominant}" if inner_dominant else "",
                f"middle:{middle_dominant}" if middle_dominant else "",
                f"outer:{outer_dominant}" if outer_dominant else "",
            ]
            if ref
        ]
        story_sections = legacy_projection.get("story_sections", {})
        theme_insights = legacy_projection.get("theme_insights", {})
        lite_healing_guidance = {
            "directions": self._build_lite_directions(
                theme_insights=theme_insights,
                signal_text=self._describe_signal(signal),
            ),
            "micro_practices": self._build_lite_micro_practices(
                legacy_projection.get("three_awareness", []),
                legacy_projection.get("experiment", {}),
            ),
        }
        pro_report_entry = {
            "title": "另一份更深的独立报告",
            "summary": (
                "如果你希望从更深层结构继续理解这张画，"
                "Pro 会提供更完整的结构、根因与疗愈视角。"
            ),
            "product_note": "这是独立购买的深度报告，不依赖 Lite 才成立。",
        }
        evidence_trace_summary = self._build_algorithm_evidence_trace_summary(
            interpretation_method_trace=interpretation_method_trace,
            visual_refs=visual_refs,
            knowledge_refs=[f"theme:{resolved_theme}"],
            rule_refs=[signal_ref] if signal_ref else [],
            theme_refs=[f"theme_label:{resolved_theme_label}"],
            fidelity_flags=fidelity_flags,
            fallback_summary=fallback_summary,
        )
        per_circle_observation_summary = str(
            evidence_trace_summary.get("per_circle_observation_summary") or ""
        ).strip()
        visual_elements_content = legacy_projection.get("visual_elements", "")
        if per_circle_observation_summary:
            visual_elements_content = self._clean_user_facing_copy(
                self._join_sentence_parts([
                    visual_elements_content,
                    f"从逐圈观察看，{per_circle_observation_summary}",
                ])
            )
            legacy_projection = {
                **legacy_projection,
                "visual_elements": visual_elements_content,
            }

        return {
            "mode": "lite",
            "generation_mode": "evidence_first",
            "theme": resolved_theme,
            "theme_label": resolved_theme_label,
            "evidence_trace_summary": evidence_trace_summary,
            "sections": {
                "title": self._make_text_section(
                    legacy_projection.get("title", ""),
                    visual_fact_refs=visual_refs[:1],
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    theme_projection_refs=[f"theme_label:{resolved_theme_label}"],
                ),
                "overall_impression": self._make_text_section(
                    legacy_projection.get("overall_impression", ""),
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "visual_elements": self._make_text_section(
                    visual_elements_content,
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[
                        f"circle:{inner_dominant}" if inner_dominant else "",
                        f"circle:{middle_dominant}" if middle_dominant else "",
                        f"circle:{outer_dominant}" if outer_dominant else "",
                    ],
                ),
                "emotion_portrait": self._make_text_section(
                    legacy_projection.get("emotion_portrait", ""),
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "story_sections": self._make_mapping_section(
                    story_sections,
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "theme_insights": self._make_mapping_section(
                    theme_insights,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                    theme_projection_refs=[f"theme_label:{resolved_theme_label}"],
                ),
                "lite_healing_guidance": self._make_typed_section(
                    lite_healing_guidance,
                    knowledge_hit_refs=[f"theme:{resolved_theme}", f"healing:{signal}" if signal else ""],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "pro_report_entry": self._make_typed_section(
                    pro_report_entry,
                    knowledge_hit_refs=[f"theme:{resolved_theme}", "product:pro"],
                    theme_projection_refs=[f"theme_label:{resolved_theme_label}"],
                ),
            },
            "legacy_projection": legacy_projection,
        }

    def build_pro_narrative_plan(
        self,
        *,
        theme: str,
        theme_label: str = "",
        lite_title: str = "",
        lite_contradiction: str = "",
        lite_block: str = "",
        intention: str = "",
        feeling_hint: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        signal: str = "",
        primary_imbalance: str = "",
        transition: str = "",
        circles: dict[str, dict[str, Any]] | None = None,
        adjacent: list[str] | None = None,
        wrap: list[str] | None = None,
        narrative_templates: dict[str, str] | None = None,
        structure_labels: dict[str, str] | None = None,
        circle_fallbacks: dict[str, str] | None = None,
        imbalance_projection: dict[str, Any] | None = None,
        interpretation_method_trace: dict[str, Any] | None = None,
        fidelity_flags: list[str] | None = None,
        fallback_summary: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        legacy_projection = self._build_pro_projection_payload(
            theme=theme,
            theme_label=theme_label,
            lite_title=lite_title,
            lite_contradiction=lite_contradiction,
            lite_block=lite_block,
            intention=intention,
            feeling_hint=feeling_hint,
            dominant_element=dominant_element,
            dominant_percentage=dominant_percentage,
            secondary_element=secondary_element,
            secondary_percentage=secondary_percentage,
            weakest_element=weakest_element,
            weakest_percentage=weakest_percentage,
            signal=signal,
            primary_imbalance=primary_imbalance,
            transition=transition,
            circles=circles,
            adjacent=adjacent,
            wrap=wrap,
            narrative_templates=narrative_templates,
            structure_labels=structure_labels,
            circle_fallbacks=circle_fallbacks,
            imbalance_projection=imbalance_projection,
        )
        if not legacy_projection:
            return {}

        resolved_theme = theme or "general"
        resolved_theme_label = (
            theme_label
            or self.get_theme_label(resolved_theme, fallback_label=resolved_theme)
        )
        signal_ref = f"signal:{signal}" if signal else ""
        visual_refs = [
            ref
            for ref in [
                f"dominant:{dominant_element}" if dominant_element else "",
                f"secondary:{secondary_element}" if secondary_element else "",
                f"weakest:{weakest_element}" if weakest_element else "",
            ]
            if ref
        ]
        healing_suggestions = self._build_pro_healing_suggestion_summary(
            legacy_projection,
            primary_imbalance=primary_imbalance,
            signal=signal,
            theme_label=resolved_theme_label,
        )
        evidence_trace_summary = self._build_algorithm_evidence_trace_summary(
            interpretation_method_trace=interpretation_method_trace,
            visual_refs=visual_refs,
            knowledge_refs=[f"theme:{resolved_theme}"],
            rule_refs=[signal_ref] if signal_ref else [],
            theme_refs=[f"theme_label:{resolved_theme_label}"],
            fidelity_flags=fidelity_flags,
            fallback_summary=fallback_summary,
        )
        per_circle_observations = evidence_trace_summary.get("per_circle_observations", {})
        if not isinstance(per_circle_observations, dict):
            per_circle_observations = {}
        circle_readings_for_plan = legacy_projection.get("circle_readings", {})
        if per_circle_observations and isinstance(circle_readings_for_plan, dict):
            circle_readings_for_plan = {
                key: self._join_sentence_parts([
                    str(value or ""),
                    str(per_circle_observations.get(key) or ""),
                ])
                for key, value in circle_readings_for_plan.items()
            }
            legacy_projection = {
                **legacy_projection,
                "circle_readings": circle_readings_for_plan,
            }

        return {
            "mode": "pro",
            "generation_mode": "evidence_first",
            "theme": resolved_theme,
            "theme_label": resolved_theme_label,
            "evidence_trace_summary": evidence_trace_summary,
            "sections": {
                "first_impression": self._make_text_section(
                    legacy_projection.get("first_impression", ""),
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "core_insight_table": self._make_typed_section(
                    {
                        "能量本质": legacy_projection.get("energy_essence", ""),
                        "核心失衡": legacy_projection.get("block_point", ""),
                        "关键卡点": legacy_projection.get("block_point", ""),
                        "转化方向": legacy_projection.get("direction", ""),
                        "疗愈核心": legacy_projection.get("healing_core", ""),
                    },
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "block_point": self._make_text_section(
                    legacy_projection.get("block_point", ""),
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "three_circles_detailed": self._make_typed_section(
                    circle_readings_for_plan,
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                ),
                "micro_analysis_detailed": self._make_typed_section(
                    legacy_projection.get("micro_sections", {}),
                    visual_fact_refs=visual_refs,
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "imbalance_confirmed": self._make_typed_section(
                    self._build_pro_imbalance_confirmed_summary(
                        legacy_projection,
                        primary_imbalance=primary_imbalance,
                        signal=signal,
                    ),
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "root_cause": self._make_typed_section(
                    legacy_projection.get("root_cause", {}),
                    knowledge_hit_refs=[f"theme:{resolved_theme}"],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
                "healing_suggestions": self._make_typed_section(
                    healing_suggestions,
                    knowledge_hit_refs=[f"theme:{resolved_theme}", f"healing:{signal}" if signal else ""],
                    rule_refs=[signal_ref] if signal_ref else [],
                ),
            },
            "legacy_projection": legacy_projection,
        }

    def build_imbalance_projection(
        self,
        *,
        theme: str,
        imbalance_type: str,
        theme_label: str = "",
    ) -> dict[str, Any]:
        basis = self.build_imbalance_narrative_basis(
            theme=theme,
            imbalance_type=imbalance_type,
            theme_label=theme_label,
        )
        return (
            basis.get("legacy_projection", {})
            if isinstance(basis, dict)
            else {}
        )

    def build_lite_narrative_projection(
        self,
        *,
        theme: str,
        theme_label: str = "",
        inner_radius: int = 33,
        middle_radius: int = 66,
        title_templates: dict[str, str] | None = None,
        six_insight_templates: dict[str, dict[str, str]] | None = None,
        experiment_title: str = "",
        experiment_content: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        inner_dominant: str = "",
        middle_dominant: str = "",
        outer_dominant: str = "",
        circle_pattern: str = "",
        circle_readings: list[str] | None = None,
        transition: str = "",
        adjacent: list[str] | None = None,
        signal: str = "",
        feeling_hint: str = "",
        default_pro_teaser: str = "",
    ) -> dict[str, Any]:
        plan = self.build_lite_narrative_plan(
            theme=theme,
            theme_label=theme_label,
            inner_radius=inner_radius,
            middle_radius=middle_radius,
            title_templates=title_templates,
            six_insight_templates=six_insight_templates,
            experiment_title=experiment_title,
            experiment_content=experiment_content,
            dominant_element=dominant_element,
            dominant_percentage=dominant_percentage,
            secondary_element=secondary_element,
            secondary_percentage=secondary_percentage,
            weakest_element=weakest_element,
            weakest_percentage=weakest_percentage,
            inner_dominant=inner_dominant,
            middle_dominant=middle_dominant,
            outer_dominant=outer_dominant,
            circle_pattern=circle_pattern,
            circle_readings=circle_readings,
            transition=transition,
            adjacent=adjacent,
            signal=signal,
            feeling_hint=feeling_hint,
            default_pro_teaser=default_pro_teaser,
        )
        return (
            plan.get("legacy_projection", {})
            if isinstance(plan, dict)
            else {}
        )

    def _build_lite_projection_payload(
        self,
        *,
        theme: str,
        theme_label: str = "",
        inner_radius: int = 33,
        middle_radius: int = 66,
        title_templates: dict[str, str] | None = None,
        six_insight_templates: dict[str, dict[str, str]] | None = None,
        experiment_title: str = "",
        experiment_content: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        inner_dominant: str = "",
        middle_dominant: str = "",
        outer_dominant: str = "",
        circle_pattern: str = "",
        circle_readings: list[str] | None = None,
        transition: str = "",
        adjacent: list[str] | None = None,
        signal: str = "",
        feeling_hint: str = "",
        default_pro_teaser: str = "",
    ) -> dict[str, Any]:
        resolved_theme = theme or "general"
        theme_summary = self.theme_service.get_theme_summary(resolved_theme)
        resolved_theme_label = (
            theme_label
            or str(theme_summary.get("name") or "").strip()
            or resolved_theme
            or "当前主题"
        )

        dominant = dominant_element or "土"
        secondary = secondary_element or dominant or "金"
        weakest = weakest_element or "水"
        outer = outer_dominant or secondary
        adjacent_relations = [
            str(item).strip()
            for item in (adjacent or [])
            if isinstance(item, str) and str(item).strip()
        ]

        dominant_theme = self._get_element_theme_phrase(resolved_theme, dominant)
        secondary_theme = self._get_element_theme_phrase(resolved_theme, secondary)
        weakest_theme = self._get_element_theme_phrase(resolved_theme, weakest)
        dominant_keywords = self._get_element_core_keywords(resolved_theme, dominant)
        secondary_keywords = self._get_element_core_keywords(resolved_theme, secondary)
        signal_text = self._describe_signal(signal)
        readings_text = "；".join(
            item.strip()
            for item in (circle_readings or [])
            if isinstance(item, str) and item.strip()
        )

        overall_parts = [
            (
                f"这张画更先让人看到的，不是你准备马上往前冲，而是你正在把自己重新收回来，确认现在的自己还能不能稳稳地站在{dominant_theme}上。"
                if resolved_theme == "general"
                else f"放到「{resolved_theme_label}」里看，这张画先说中的不是结果，而是你在往前之前，会先确认自己有没有站稳{dominant_theme}。"
            ),
        ]
        if feeling_hint:
            overall_parts.append(feeling_hint)
        if transition:
            overall_parts.append(f"再往里看，画面的主轴是：{transition}")
        overall_parts.append(
            f"所以这不是简单的停住，而更像你先把内在安顿好，再慢慢把和「{secondary}」有关的{secondary_keywords}带回现实。"
        )
        if signal_text:
            overall_parts.append(f"它也提醒你：{signal_text}")

        visual_parts = [
            (
                f"如果只看画面给人的感受，最先浮出来的是两股力量：一股是「{dominant}」的收拢和判断，另一股是「{secondary}」想把事情重新带回现实。"
            ),
        ]
        if circle_pattern:
            visual_parts.append(f"三层画面的走向也很清楚：{circle_pattern}")
        if readings_text:
            softened_readings = [
                self._soften_circle_reading(item)
                for item in readings_text.split("；")
                if isinstance(item, str) and item.strip()
            ]
            if softened_readings:
                visual_parts.append("换句话说，" + "；".join(softened_readings[:2]) + "。")

        base = (
            f"你的底色不是急着证明什么，而是先确认自己有没有站稳在{dominant_theme}上。"
            f"{transition or ''} 你很多时候不是慢，而是先要让内在点头。"
        ).strip()
        contradiction = (
            f"矛盾也正在这里：你心里其实想继续往前，但外在又已经开始用「{outer}」的方式先整理边界、秩序或方向。"
            "于是你会一边想行动，一边又不愿再把自己丢回那种失控消耗里。"
        )
        if adjacent_relations:
            pattern = (
                f"久而久之，这会形成你的惯用模式：{adjacent_relations[0]}。"
                "你通常不是直接冲，而是先在心里把事情转过一遍，感觉对了才真正迈出去。"
            )
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"为了不再乱掉，你会自然长出一种防御：更强调清晰、距离感和判断标准。"
            f"它看起来像「{outer}」的收紧，但本质上是在替现在的你筛选什么值得继续打开。"
        )
        block_parts = ["当前最容易卡住你的，是主导能量和现实节奏还没完全接上。"]
        if weakest_percentage < 12:
            block_parts.append(
                f"尤其当和「{weakest}」有关的{weakest_theme}还没跟上时，你会在快要推进的那一刻先退回来。"
            )
        if signal_text:
            block_parts.append(f"这也是为什么你会反复遇到这样的卡点：{signal_text}")
        light = (
            f"但你的光也已经出来了：你不是只会收着，而是正在把「{secondary}」代表的{secondary_theme}慢慢带回生活。"
            "这说明你不是卡死了，而是在学一种更适合自己的前进方式。"
        )

        scene = (
            f"在「{resolved_theme_label}」里，你最常出现的场景是：不是没有机会，而是每次准备投入时，都会先问自己现在这样推，会不会又把自己推乱。"
            f"因为画面里更强的那股力量，会先把注意力拉回{dominant_theme}。"
        )
        impact = "这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        if weakest_percentage < 12:
            impact += f" 当和「{weakest}」有关的{weakest_theme}还偏少时，你也会更需要一点缓冲和回收。"
        awareness = "这幅画提醒你的，不是逼自己立刻更强，而是先承认：你想稳住，不等于你退缩；只要先把自己接住，后面的行动会自己长出来。"
        if signal_text:
            awareness += f" {signal_text}"

        emotion_parts = [
            f"情绪上，你现在不像没感觉，反而像一直在心里默默处理{dominant_theme}这件事。",
            f"而最外层落出来的「{outer}」感，也说明你并不是想完全退回去，只是想先弄清楚，接下来该用什么边界和姿态继续向外。",
        ]
        if weakest_percentage < 12:
            emotion_parts.append(
                f"也因为和「{weakest}」有关的{weakest_theme}暂时偏弱，所以一旦节奏变快，你更容易先退回来，等自己重新有把握了再动。"
            )
        if signal_text:
            emotion_parts.append(f"这和你现在的状态也很像：{signal_text}")
        if feeling_hint:
            emotion_parts.append(feeling_hint)

        signal_short = (
            signal_text.rstrip("。") if signal_text else "想推进却又停住的那个瞬间"
        )

        return {
            "title": self._build_lite_title(
                theme=resolved_theme,
                theme_label=resolved_theme_label,
                inner_radius=inner_radius,
                middle_radius=middle_radius,
                title_templates=title_templates or {},
            ),
            "overall_impression": " ".join(
                part for part in overall_parts if isinstance(part, str) and part.strip()
            ).strip(),
            "visual_elements": " ".join(
                part for part in visual_parts if isinstance(part, str) and part.strip()
            ).strip(),
            "story_angles": self._build_story_angles(resolved_theme),
            "six_insights": self._build_lite_six_insights(
                theme=resolved_theme,
                theme_label=resolved_theme_label,
                feeling_hint=feeling_hint,
                story_sections={
                    "base": base,
                    "contradiction": contradiction.strip(),
                    "pattern": pattern.strip(),
                    "defense": defense.strip(),
                    "block": " ".join(block_parts).strip(),
                    "light": light.strip(),
                },
                six_insight_templates=six_insight_templates or {},
            ),
            "experiment": self._build_lite_experiment(
                experiment_title=experiment_title,
                experiment_content=experiment_content,
                dominant_element=dominant,
                dominant_keywords=dominant_keywords,
            ),
            "story_sections": {
                "base": base,
                "contradiction": contradiction.strip(),
                "pattern": pattern.strip(),
                "defense": defense.strip(),
                "block": " ".join(block_parts).strip(),
                "light": light.strip(),
            },
            "theme_insights": {
                "scene": scene.strip(),
                "impact": impact.strip(),
                "awareness": awareness.strip(),
            },
            "emotion_portrait": " ".join(
                part for part in emotion_parts if isinstance(part, str) and part.strip()
            ).strip(),
            "three_awareness": [
                {
                    "day": 1,
                    "title": "先安顿自己",
                    "content": (
                        "今天留意一下，当你准备回应外部事情前，身体会不会先想稳住一点。"
                        f"那不是你拖延，而往往是在提醒你：先照顾好{dominant_keywords}。"
                    ),
                },
                {
                    "day": 2,
                    "title": "看见边界变化",
                    "content": (
                        "当你准备继续投入时，观察自己是不是会先把边界、标准或距离感收紧。"
                        "那不是故意冷下来，而是在确认这件事值不值得你继续打开。"
                    ),
                },
                {
                    "day": 3,
                    "title": "捕捉卡住瞬间",
                    "content": (
                        f"如果今天又出现{signal_short}的时刻，别急着评价自己。"
                        f"把那个瞬间记下来，你会更看清自己何时需要补回与「{weakest}」相关的{weakest_theme}。"
                    ),
                },
            ],
            "pro_teaser": self._build_pro_teaser(resolved_theme, default_pro_teaser),
        }

    def build_pro_narrative_projection(
        self,
        *,
        theme: str,
        theme_label: str = "",
        lite_title: str = "",
        lite_contradiction: str = "",
        lite_block: str = "",
        intention: str = "",
        feeling_hint: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        signal: str = "",
        primary_imbalance: str = "",
        transition: str = "",
        circles: dict[str, dict[str, Any]] | None = None,
        adjacent: list[str] | None = None,
        wrap: list[str] | None = None,
        narrative_templates: dict[str, str] | None = None,
        structure_labels: dict[str, str] | None = None,
        circle_fallbacks: dict[str, str] | None = None,
        imbalance_projection: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        plan = self.build_pro_narrative_plan(
            theme=theme,
            theme_label=theme_label,
            lite_title=lite_title,
            lite_contradiction=lite_contradiction,
            lite_block=lite_block,
            intention=intention,
            feeling_hint=feeling_hint,
            dominant_element=dominant_element,
            dominant_percentage=dominant_percentage,
            secondary_element=secondary_element,
            secondary_percentage=secondary_percentage,
            weakest_element=weakest_element,
            weakest_percentage=weakest_percentage,
            signal=signal,
            primary_imbalance=primary_imbalance,
            transition=transition,
            circles=circles,
            adjacent=adjacent,
            wrap=wrap,
            narrative_templates=narrative_templates,
            structure_labels=structure_labels,
            circle_fallbacks=circle_fallbacks,
            imbalance_projection=imbalance_projection,
        )
        return (
            plan.get("legacy_projection", {})
            if isinstance(plan, dict)
            else {}
        )

    def _build_pro_projection_payload(
        self,
        *,
        theme: str,
        theme_label: str = "",
        lite_title: str = "",
        lite_contradiction: str = "",
        lite_block: str = "",
        intention: str = "",
        feeling_hint: str = "",
        dominant_element: str = "",
        dominant_percentage: float = 0.0,
        secondary_element: str = "",
        secondary_percentage: float = 0.0,
        weakest_element: str = "",
        weakest_percentage: float = 0.0,
        signal: str = "",
        primary_imbalance: str = "",
        transition: str = "",
        circles: dict[str, dict[str, Any]] | None = None,
        adjacent: list[str] | None = None,
        wrap: list[str] | None = None,
        narrative_templates: dict[str, str] | None = None,
        structure_labels: dict[str, str] | None = None,
        circle_fallbacks: dict[str, str] | None = None,
        imbalance_projection: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        resolved_theme = theme or "general"
        theme_summary = self.theme_service.get_theme_summary(resolved_theme)
        resolved_theme_label = (
            theme_label
            or str(theme_summary.get("name") or "").strip()
            or resolved_theme
            or "当前主题"
        )
        templates = narrative_templates if isinstance(narrative_templates, dict) else {}
        labels = structure_labels if isinstance(structure_labels, dict) else {}
        circle_defaults = (
            circle_fallbacks if isinstance(circle_fallbacks, dict) else {}
        )

        dominant = dominant_element or "土"
        secondary = secondary_element or dominant or "金"
        weakest = weakest_element or "水"
        signal_text = self._describe_signal(signal)
        weakest_theme = self._get_element_theme_phrase(resolved_theme, weakest)
        resolved_intention = str(intention or "").strip()
        contradiction_text = str(lite_contradiction or "").strip()
        block_text = str(lite_block or "").strip()
        resolved_feeling_hint = str(feeling_hint or "").strip()
        runtime_imbalance_projection = self._resolve_imbalance_projection(
            theme=resolved_theme,
            theme_label=resolved_theme_label,
            signal=signal,
            projection=imbalance_projection,
        )
        mapped_contradiction = self._projection_text(
            runtime_imbalance_projection,
            "contradiction",
        )
        mapped_manifestation = self._projection_text(
            runtime_imbalance_projection,
            "manifestation",
        )
        mapped_direction = self._projection_text(
            runtime_imbalance_projection,
            "direction",
        )
        mapped_healing_core = self._projection_text(
            runtime_imbalance_projection,
            "healing_core",
        )
        mapped_deeper_root = self._projection_text(
            runtime_imbalance_projection,
            "deeper_root",
        )
        mapped_core_root = self._projection_text(
            runtime_imbalance_projection,
            "core_root",
        )

        first_impression_parts = [
            "第一眼看这张画，最先撞出来的不是结果层面的焦虑，而是你正卡在一个很具体的位置：想往前，但还没有完全放心把自己交出去。"
        ]
        if transition:
            first_impression_parts.append(f"画面的主轴也很明确：{str(transition).strip()}")
        first_impression_parts.append(
            f"所以这不是简单的停住，而是你正在认真处理更底层的事：先把和{self._get_element_theme_phrase(resolved_theme, dominant)}有关的承载感站稳，再决定怎么用「{secondary}」的力量继续向外。"
        )
        if contradiction_text:
            first_impression_parts.append(self._trim_sentence(contradiction_text, 96))
        if signal_text:
            first_impression_parts.append(f"更深一层看，{signal_text}")

        energy_essence = (
            f"这张画的能量主轴，不是拼命往外冲，而是先把{self._get_element_theme_phrase(resolved_theme, dominant)}站稳，再决定怎么让「{secondary}」带着你继续向前。"
            f"{transition or ''}"
        ).strip()

        block_parts: list[str] = []
        if mapped_contradiction:
            block_parts.append(f"你现在更核心的卡点，其实是「{mapped_contradiction}」")
        if mapped_manifestation:
            block_parts.append(f"它不是抽象概念，落到现实里，常常就表现成：{mapped_manifestation.rstrip('。')}。")
        if block_text:
            block_parts.append(f"所以你会反复遇到同一种体验：{self._trim_sentence(block_text, 90).rstrip('。')}")
        if primary_imbalance:
            block_parts.append(
                f"说到底，是因为{primary_imbalance}让你很难一边往前推进，一边仍然感觉自己是安全的。"
            )
        if weakest_percentage < 12:
            block_parts.append(
                f"再加上和「{weakest}」有关的{weakest_theme}资源暂时偏少，所以你在快要真正启动时，更容易先想缓一缓。"
            )
        if signal_text:
            block_parts.append(f"这和画面里的深层信号也是一致的：{signal_text}")
        if resolved_feeling_hint:
            block_parts.append(resolved_feeling_hint)

        base_direction = self._render_runtime_template(
            str(templates.get("core_direction") or "").strip(),
            theme_label=resolved_theme_label,
        )
        direction = (
            f"{mapped_direction}。{base_direction}".strip()
            if mapped_direction and base_direction
            else mapped_direction or base_direction
        )
        healing_core = (
            mapped_healing_core
            or str(templates.get("core_healing") or "").strip()
        )

        surface_root = self._build_surface_root_text(
            lite_contradiction=contradiction_text,
            intention=resolved_intention,
            manifestation=mapped_manifestation,
            signal_text=signal_text,
            without_intention_template=str(
                templates.get("surface_root_without_intention") or ""
            ).strip(),
            with_intention_template=str(
                templates.get("surface_root_with_intention") or ""
            ).strip(),
        )

        circle_payload = circles if isinstance(circles, dict) else {}
        circle_readings = {
            key: self._build_pro_circle_text(
                circle=circle_payload.get(key, {}),
                fallback_text=str(circle_defaults.get(key) or "").strip(),
            )
            for key in ["inner", "middle", "outer"]
        }

        adjacent_relations = [
            str(item).strip()
            for item in (adjacent or [])
            if isinstance(item, str) and str(item).strip()
        ]
        wrap_relations = [
            str(item).strip()
            for item in (wrap or [])
            if isinstance(item, str) and str(item).strip()
        ]
        rhythm_label = str(labels.get("micro_rhythm") or "节奏关系").strip()
        relationship_label = str(labels.get("micro_relationship") or "关系模式").strip()
        action_label = str(labels.get("micro_action") or "行动提示").strip()
        micro_sections = {
            rhythm_label: (
                f"先看节奏，你现在的能量不是散的，而是明显在{adjacent_relations[0]}。这说明你正在调承接，不是在乱。"
                if adjacent_relations
                else str(templates.get("micro_rhythm") or "").strip()
            ),
            relationship_label: (
                f"再往外看，{adjacent_relations[1]}。这意味着你的关系和现实投入，不只是情绪反应，而是在寻找更合适的承接方式。"
                if len(adjacent_relations) > 1
                else str(templates.get("micro_relationship") or "").strip()
            ),
            action_label: (
                f"落到行动上，最明显的提示是：{wrap_relations[0]}。与其一次性猛推，不如让行动和承载一起增长。"
                if wrap_relations
                else str(templates.get("micro_action") or "").strip()
            ),
        }

        return {
            "first_impression": " ".join(
                part
                for part in first_impression_parts
                if isinstance(part, str) and part.strip()
            ).strip(),
            "energy_essence": energy_essence,
            "block_point": " ".join(
                part for part in block_parts if isinstance(part, str) and part.strip()
            ).strip(),
            "direction": direction,
            "healing_core": healing_core,
            "circle_readings": circle_readings,
            "micro_sections": micro_sections,
            "root_cause": {
                "surface": surface_root,
                "deeper": mapped_deeper_root
                or str(templates.get("root_deeper") or "").strip(),
                "core": mapped_core_root
                or str(templates.get("root_core") or "").strip(),
            },
        }

    def _build_imbalance_projection_payload(
        self,
        *,
        theme: str,
        imbalance_type: str,
        theme_label: str = "",
    ) -> dict[str, Any]:
        if not imbalance_type:
            return {}

        theme_summary = self.theme_service.get_theme_summary(theme)
        resolved_theme_label = (
            theme_label
            or str(theme_summary.get("name") or "").strip()
            or theme
            or "当前主题"
        )
        mapping_result = self.imbalance_service.get_theme_mapping(theme, imbalance_type)
        mapping = mapping_result.value if isinstance(mapping_result.value, dict) else {}
        imbalance_result = self.imbalance_service.get_imbalance_detail(imbalance_type)
        imbalance = imbalance_result.value if isinstance(imbalance_result.value, dict) else {}
        healing_result = self.healing_service.get_healing_plan(imbalance_type, theme)
        healing = healing_result.value if isinstance(healing_result.value, dict) else {}

        contradiction = str(mapping.get("核心矛盾") or "").strip()
        manifestation = str(mapping.get("具体表现") or imbalance.get("description") or "").strip()
        direction = str(mapping.get("转变方向") or "").strip()
        category = str(imbalance.get("category") or "").strip()
        display_imbalance = self._get_signal_label(imbalance_type) or imbalance_type
        issue_type = str(healing.get("issue_type") or "").strip()
        cognitive_upgrade = str(healing.get("cognitive_upgrade") or "").strip()
        healing_direction = str(imbalance.get("healing_direction") or "").strip()
        warning = str(imbalance.get("warning") or "").strip()
        manifestations = imbalance.get("manifestations") or []
        psychology = "、".join(
            str(item).strip()
            for item in manifestations
            if isinstance(item, str) and str(item).strip()
        )

        summary_parts = [f"当前更接近的核心失衡是「{display_imbalance}」"]
        if category:
            summary_parts.append(f"（{category}）")
        if contradiction:
            summary_parts.append(f"：{contradiction}")
        elif manifestation:
            summary_parts.append(f"：{manifestation}")
        summary = "".join(summary_parts).strip()
        if summary and summary[-1] not in "。！？":
            summary += "。"

        evidence_parts: list[str] = []
        if manifestation:
            evidence_parts.append(f"在{resolved_theme_label}主题里，它更容易表现成：{manifestation}。")
        if direction:
            evidence_parts.append(f"当前更适合的转向是：{direction}。")
        if warning:
            evidence_parts.append(warning)

        block_parts: list[str] = []
        if contradiction:
            block_parts.append(f"你现在更核心的卡点，其实是「{contradiction}」")
        if manifestation:
            block_parts.append(f"它不是抽象概念，落到现实里，常常就表现成：{manifestation.rstrip('。')}。")

        direction_text = direction
        healing_parts: list[str] = []
        if issue_type and cognitive_upgrade:
            healing_parts.append(f"围绕「{issue_type}」真正要慢慢建立的新体验是：{cognitive_upgrade}。")
        elif cognitive_upgrade:
            healing_parts.append(cognitive_upgrade.rstrip("。") + "。")
        if healing_direction:
            healing_parts.append(f"当前调节方向更接近：{healing_direction}。")
        if warning:
            healing_parts.append(warning)

        deeper_root = ""
        if manifestation:
            deeper_root = f"如果再往下一层看，问题不只是表面卡住，而是你会慢慢形成一种重复机制：「{display_imbalance}」会让你在关键时刻又回到“{manifestation}”里。"
            if psychology:
                deeper_root += f" 它常会让人落进「{psychology}」这样的内在循环。"

        core_root = ""
        if issue_type and cognitive_upgrade:
            core_root = f"而最深的地方，往往不是能力问题，而是你心里对“我可不可以安心拥有、安心向前”这件事还没有完全放松。 在「{issue_type}」这里，你正在重新学习：{cognitive_upgrade}"
        elif cognitive_upgrade:
            core_root = f"而最深的地方，往往不是能力问题，而是你心里对“我可不可以安心拥有、安心向前”这件事还没有完全放松。 {cognitive_upgrade}"

        return {
            "imbalance_type": imbalance_type,
            "summary": summary,
            "evidence": " ".join(part for part in evidence_parts if part).strip(),
            "block_point": " ".join(part for part in block_parts if part).strip(),
            "direction": direction_text,
            "healing_core": " ".join(part for part in healing_parts if part).strip(),
            "deeper_root": deeper_root,
            "core_root": core_root,
            "manifestation": manifestation,
            "contradiction": contradiction,
            "issue_type": issue_type,
        }

    def _extract_phase_labels(self, phases: list[Any]) -> list[str]:
        labels: list[str] = []
        for item in phases:
            if isinstance(item, str) and item.strip():
                labels.append(item.strip())
                continue
            if isinstance(item, dict):
                for key in ["theme", "days", "phase"]:
                    value = item.get(key)
                    if isinstance(value, str) and value.strip():
                        labels.append(value.strip())
                        break
                    if isinstance(value, int):
                        labels.append(str(value))
                        break
        return labels

    def _get_element_theme_phrase(self, theme: str, element_name: str) -> str:
        profile = self.theme_service.get_element_meaning(theme, element_name)
        psychological_theme = profile.get("psychological_theme")
        if isinstance(psychological_theme, str) and psychological_theme.strip():
            return psychological_theme.strip()
        core_concept = profile.get("core_concept")
        if isinstance(core_concept, str) and core_concept.strip():
            return core_concept.strip()
        return f"{element_name}元素的状态"

    def _get_element_core_keywords(self, theme: str, element_name: str) -> str:
        profile = self.theme_service.get_element_meaning(theme, element_name)
        keywords = profile.get("keywords")
        if isinstance(keywords, list) and keywords:
            filtered = [
                str(item).strip()
                for item in keywords
                if isinstance(item, str) and str(item).strip()
            ]
            if filtered:
                return "、".join(filtered[:3])
        return self._get_element_theme_phrase(theme, element_name)

    def _describe_signal(self, signal: str) -> str:
        descriptions = {
            "transition-overload": "你正处在旧节奏尚未完全退场、新节奏又开始拉扯的过渡期。",
            "boundary-constriction": "你更容易先收紧边界来维持安全感。",
            "relational-drain": "很多能量已经流向外部关系与任务，回补速度暂时还没跟上。",
            "emotion-congestion": "情绪更多停留在内部循环，还没有找到稳定的出口。",
            "action-block": "行动能量在启动前被过多顾虑和自我保护截住了。",
            "energy-block": "内外能量的转换还不够顺畅，所以你会时常感觉想推进却又被拉住。",
        }
        return descriptions.get(signal, "")

    def _get_signal_label(self, signal: str) -> str:
        labels = {
            "transition-overload": "过渡负荷",
            "boundary-constriction": "边界紧绷",
            "relational-drain": "关系耗散",
            "emotion-congestion": "情绪淤积",
            "action-block": "行动受阻",
            "energy-block": "能量受阻",
        }
        return labels.get(signal, signal.replace("-", " ").strip())

    def _build_pro_teaser(self, theme: str, default_pro_teaser: str) -> str:
        cleaned = self._clean_text_block(self.get_pro_upgrade_teaser(theme))
        default_text = str(default_pro_teaser or "").strip()
        if not cleaned:
            return default_text
        if default_text and cleaned in default_text:
            return default_text
        if default_text:
            return f"{default_text}\n\n{cleaned}".strip()
        return cleaned

    def _build_story_angles(self, theme: str) -> dict[str, str]:
        label_map = {
            "base": "你的底色",
            "contradiction": "你的矛盾",
            "pattern": "你的模式",
            "defense": "你的防御",
            "block": "你的卡点",
            "light": "你的光",
        }
        templates = self.get_insight_templates(theme)
        angles: dict[str, str] = {}
        for key, label in label_map.items():
            payload = templates.get(label, {}) if isinstance(templates, dict) else {}
            if not isinstance(payload, dict):
                continue
            angle = payload.get("角度")
            if isinstance(angle, str) and angle.strip():
                angles[key] = angle.strip()
        return angles

    def _build_lite_title(
        self,
        *,
        theme: str,
        theme_label: str,
        inner_radius: int,
        middle_radius: int,
        title_templates: dict[str, str],
    ) -> str:
        if inner_radius >= 42:
            template = title_templates.get("inner_high", "")
            if isinstance(template, str) and template.strip():
                return template.format(theme_label=theme_label)
        if middle_radius >= 74:
            template = title_templates.get("middle_high", "")
            if isinstance(template, str) and template.strip():
                return template.format(theme_label=theme_label)

        themed_title = title_templates.get(theme, "")
        if isinstance(themed_title, str) and themed_title.strip():
            return themed_title

        default_title = title_templates.get("default", "")
        if isinstance(default_title, str) and default_title.strip():
            return default_title

        return "慢慢亮起来的中心"

    def _build_lite_experiment(
        self,
        *,
        experiment_title: str,
        experiment_content: str,
        dominant_element: str,
        dominant_keywords: str,
    ) -> dict[str, str]:
        content = str(experiment_content or "").strip()
        if content:
            content = (
                f"{content}\n补充观察：如果今天只顺着这幅画练习一件事，可以试着把「{dominant_element}」的品质带进生活里，"
                f"例如先给自己一点{dominant_keywords}。"
            ).strip()
        return {
            "title": str(experiment_title or "").strip(),
            "content": content,
        }

    def _build_lite_six_insights(
        self,
        *,
        theme: str,
        theme_label: str,
        feeling_hint: str,
        story_sections: dict[str, str],
        six_insight_templates: dict[str, dict[str, str]],
    ) -> dict[str, dict[str, str]]:
        story_angles = self._build_story_angles(theme)
        insights: dict[str, dict[str, str]] = {}
        for key, template in six_insight_templates.items():
            if not isinstance(template, dict):
                continue
            story_content = str(story_sections.get(key) or "").strip()
            base_title = str(template.get("title") or key).strip()
            angle = str(story_angles.get(key) or "").strip()
            title = f"{base_title}：{angle}" if angle else base_title
            fallback_content = self._render_lite_template(
                str(template.get("content") or "").strip(),
                theme_label=theme_label,
                feeling_hint=feeling_hint,
            )
            fallback_summary = self._render_lite_template(
                str(template.get("summary") or "").strip(),
                theme_label=theme_label,
                feeling_hint=feeling_hint,
            )
            insights[key] = {
                "title": title,
                "content": story_content or fallback_content,
                "summary": story_content or fallback_summary,
            }
        return insights

    def _render_lite_template(
        self,
        template: str,
        *,
        theme_label: str,
        feeling_hint: str,
    ) -> str:
        if not template:
            return ""
        try:
            return template.format(
                theme_label=theme_label,
                feeling_hint=feeling_hint,
            ).strip()
        except Exception:
            return template.strip()

    def _clean_text_block(self, content: str) -> str:
        if not isinstance(content, str):
            return ""
        lines: list[str] = []
        for raw_line in content.strip().splitlines():
            line = raw_line.strip()
            if not line:
                if lines and lines[-1]:
                    lines.append("")
                continue
            if line.startswith("💡 "):
                line = line[2:].strip()
            if line.startswith("🔓 "):
                line = line[2:].strip()
            if line.startswith("👉 "):
                line = line[2:].strip()
            lines.append(line)
        cleaned = "\n".join(lines).strip()
        banned_phrases = [
            "Lite" + " 里",
            "解锁" + "完整版",
            "补全" + "版",
            "升级" + "版",
            "21" + "天",
        ]
        for phrase in banned_phrases:
            cleaned = cleaned.replace(phrase, "")
        while "  " in cleaned:
            cleaned = cleaned.replace("  ", " ")
        return cleaned.strip()

    def _build_algorithm_evidence_trace_summary(
        self,
        *,
        interpretation_method_trace: dict[str, Any] | None,
        visual_refs: list[str],
        knowledge_refs: list[str],
        rule_refs: list[str],
        theme_refs: list[str],
        fidelity_flags: list[str] | None,
        fallback_summary: dict[str, Any] | None,
    ) -> dict[str, Any]:
        method_trace = (
            interpretation_method_trace
            if isinstance(interpretation_method_trace, dict)
            else {}
        )
        tutorial_source_refs = [
            "source:four_step_method",
            "source:five_elements_excess_deficiency",
            "source:triad_structure",
        ]
        per_circle_color_summary = self._build_per_circle_color_summary(
            method_trace.get("per_circle_color_analysis", {})
            if isinstance(method_trace, dict)
            else {}
        )
        per_circle_observations = self._build_per_circle_observations(
            method_trace.get("per_circle_color_analysis", {})
            if isinstance(method_trace, dict)
            else {}
        )
        per_circle_observation_summary = "；".join(
            item
            for key in ["inner", "middle", "outer"]
            for item in [per_circle_observations.get(key, "")]
            if item
        )
        return {
            "visual_fact_refs": [item for item in visual_refs if item],
            "knowledge_hit_refs": [item for item in knowledge_refs if item],
            "rule_refs": [item for item in rule_refs if item],
            "theme_projection_refs": [item for item in theme_refs if item],
            "direct_judgment_refs": ["method:direct_judgment"],
            "color_analysis_refs": ["method:per_circle_color_analysis"],
            "shape_analysis_refs": ["method:shape_analysis"],
            "circle_relation_refs": ["method:circle_relation_analysis"],
            "tutorial_source_refs": tutorial_source_refs,
            "per_circle_color_summary": per_circle_color_summary,
            "per_circle_observation_summary": per_circle_observation_summary,
            "per_circle_observations": per_circle_observations,
            "fidelity_flags": [
                str(item).strip()
                for item in (fidelity_flags or [])
                if isinstance(item, str) and str(item).strip()
            ],
            "fallback_summary": (
                fallback_summary
                if isinstance(fallback_summary, dict)
                else {"used": False, "levels": [], "warnings": []}
            ),
        }

    def _build_per_circle_color_summary(self, per_circle_analysis: Any) -> str:
        if not isinstance(per_circle_analysis, dict):
            return ""
        parts: list[str] = []
        for circle_key in ["inner", "middle", "outer"]:
            item = per_circle_analysis.get(circle_key)
            if not isinstance(item, dict):
                continue
            circle_label = str(item.get("circle_label") or self._circle_label(circle_key)).strip()
            dominant_element = str(item.get("dominant_element") or "").strip()
            dominant_color = str(item.get("dominant_color") or "").strip()
            state_basis = item.get("state_basis", {})
            if not isinstance(state_basis, dict):
                state_basis = {}
            area_ratio = self._format_area_ratio(state_basis.get("area_ratio"))
            depth_label = self._depth_state_label(state_basis.get("depth_state"))
            fill_label = self._fill_state_label(state_basis.get("fill_state"))
            color_element = " / ".join(
                value for value in [dominant_color, dominant_element] if value
            ) or "未识别"
            parts.append(
                f"{circle_label}以{color_element}为主，{depth_label}，{fill_label}，面积约{area_ratio}"
            )
        return "；".join(parts)

    def _build_per_circle_observations(self, per_circle_analysis: Any) -> dict[str, str]:
        if not isinstance(per_circle_analysis, dict):
            return {}
        observations: dict[str, str] = {}
        for circle_key in ["inner", "middle", "outer"]:
            item = per_circle_analysis.get(circle_key)
            if not isinstance(item, dict):
                continue
            circle_label = str(item.get("circle_label") or self._circle_label(circle_key)).strip()
            dominant_element = str(item.get("dominant_element") or "").strip() or "未识别元素"
            state_basis = item.get("state_basis", {})
            if not isinstance(state_basis, dict):
                state_basis = {}
            observations[circle_key] = (
                f"{circle_label}主要呈现「{dominant_element}」的状态，"
                f"{self._depth_state_label(state_basis.get('depth_state'))}，"
                f"{self._fill_state_label(state_basis.get('fill_state'))}，"
                f"面积约{self._format_area_ratio(state_basis.get('area_ratio'))}"
            )
        return observations

    def _circle_label(self, circle_key: str) -> str:
        return {
            "inner": "内圈",
            "middle": "中圈",
            "outer": "外圈",
        }.get(circle_key, circle_key)

    def _format_area_ratio(self, value: Any) -> str:
        try:
            ratio = float(value)
        except (TypeError, ValueError):
            return "未知"
        if ratio <= 1:
            return f"{ratio * 100:.1f}%"
        return f"{ratio:.1f}%"

    def _depth_state_label(self, value: Any) -> str:
        return {
            "deep": "颜色偏深",
            "light": "颜色偏浅",
            "middle": "深浅居中",
            "unknown": "深浅未知",
        }.get(str(value or "").strip(), "深浅未知")

    def _fill_state_label(self, value: Any) -> str:
        return {
            "dense": "填充较密",
            "filled": "填充稳定",
            "mixed": "填充较混合",
            "sparse": "填充较少",
        }.get(str(value or "").strip(), "填充状态未明")

    def _join_sentence_parts(self, parts: list[Any]) -> str:
        cleaned = [
            str(part).strip()
            for part in parts
            if isinstance(part, str) and str(part).strip()
        ]
        return " ".join(cleaned).strip()

    def _clean_user_facing_copy(self, content: str) -> str:
        cleaned = str(content or "").strip()
        if not cleaned:
            return ""
        replacements = {
            "。；": "；",
            "；；": "；",
            "。。": "。",
            "。 。": "。",
            "； 。": "；",
        }
        for src, target in replacements.items():
            cleaned = cleaned.replace(src, target)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def _trim_sentence(self, content: str, limit: int = 88) -> str:
        cleaned = self._clean_user_facing_copy(content)
        if not cleaned:
            return ""
        if len(cleaned) <= limit:
            return cleaned if cleaned[-1] in "。！？" else f"{cleaned}。"
        trimmed = cleaned[:limit].rstrip("，,；; ")
        return f"{trimmed}。"

    def _soften_circle_reading(self, content: str) -> str:
        cleaned = self._clean_user_facing_copy(content)
        replacements = [
            ("内圈（里圈）主要对应", "最里面这一层常会照见"),
            ("内圈主要对应", "最里面这一层常会照见"),
            ("中圈主要对应", "中间这一层更容易落到"),
            ("外圈主要对应", "最外面这一层更容易碰到"),
            ("此圈可以重点观察：", "放到现实里，往往会连到"),
            ("当前更显著的是", "现在更突出的是"),
        ]
        for src, target in replacements:
            cleaned = cleaned.replace(src, target)
        return cleaned.strip()

    def _resolve_imbalance_projection(
        self,
        *,
        theme: str,
        theme_label: str,
        signal: str,
        projection: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if isinstance(projection, dict) and projection:
            return projection
        if not signal:
            return {}
        return self.build_imbalance_projection(
            theme=theme,
            imbalance_type=signal,
            theme_label=theme_label,
        )

    def _make_trace(
        self,
        *,
        visual_fact_refs: list[str] | None = None,
        knowledge_hit_refs: list[str] | None = None,
        rule_refs: list[str] | None = None,
        theme_projection_refs: list[str] | None = None,
        reason_codes: list[str] | None = None,
        fallback: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "visual_fact_refs": [
                item for item in (visual_fact_refs or []) if isinstance(item, str) and item
            ],
            "knowledge_hit_refs": [
                item for item in (knowledge_hit_refs or []) if isinstance(item, str) and item
            ],
            "rule_refs": [
                item for item in (rule_refs or []) if isinstance(item, str) and item
            ],
            "theme_projection_refs": [
                item
                for item in (theme_projection_refs or [])
                if isinstance(item, str) and item
            ],
            "reason_codes": [
                item for item in (reason_codes or []) if isinstance(item, str) and item
            ],
            "fallback": fallback or {"used": False},
        }

    def _make_text_section(
        self,
        content: str,
        *,
        visual_fact_refs: list[str] | None = None,
        knowledge_hit_refs: list[str] | None = None,
        rule_refs: list[str] | None = None,
        theme_projection_refs: list[str] | None = None,
        reason_codes: list[str] | None = None,
        fallback: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "content": str(content or "").strip(),
            "trace": self._make_trace(
                visual_fact_refs=visual_fact_refs,
                knowledge_hit_refs=knowledge_hit_refs,
                rule_refs=rule_refs,
                theme_projection_refs=theme_projection_refs,
                reason_codes=reason_codes,
                fallback=fallback,
            ),
        }

    def _make_mapping_section(
        self,
        content: dict[str, Any] | None,
        *,
        visual_fact_refs: list[str] | None = None,
        knowledge_hit_refs: list[str] | None = None,
        rule_refs: list[str] | None = None,
        theme_projection_refs: list[str] | None = None,
        reason_codes: list[str] | None = None,
        fallback: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "content": content if isinstance(content, dict) else {},
            "trace": self._make_trace(
                visual_fact_refs=visual_fact_refs,
                knowledge_hit_refs=knowledge_hit_refs,
                rule_refs=rule_refs,
                theme_projection_refs=theme_projection_refs,
                reason_codes=reason_codes,
                fallback=fallback,
            ),
        }

    def _make_typed_section(
        self,
        content: Any,
        *,
        visual_fact_refs: list[str] | None = None,
        knowledge_hit_refs: list[str] | None = None,
        rule_refs: list[str] | None = None,
        theme_projection_refs: list[str] | None = None,
        reason_codes: list[str] | None = None,
        fallback: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "content": content,
            "trace": self._make_trace(
                visual_fact_refs=visual_fact_refs,
                knowledge_hit_refs=knowledge_hit_refs,
                rule_refs=rule_refs,
                theme_projection_refs=theme_projection_refs,
                reason_codes=reason_codes,
                fallback=fallback,
            ),
        }

    def _build_lite_directions(
        self,
        *,
        theme_insights: dict[str, Any],
        signal_text: str,
    ) -> list[dict[str, str]]:
        directions: list[dict[str, str]] = []
        awareness = str(theme_insights.get("awareness") or "").strip()
        impact = str(theme_insights.get("impact") or "").strip()
        scene = str(theme_insights.get("scene") or "").strip()
        candidates = [
            ("轻量调节方向", awareness),
            ("现实中的温和着力点", impact),
            ("先从一个小场景开始", scene),
        ]
        if signal_text:
            candidates.append(("当前节奏提醒", signal_text))
        for title, content in candidates:
            if content:
                directions.append({"title": title, "content": content})
            if len(directions) >= 3:
                break
        return directions

    def _build_lite_micro_practices(
        self,
        awareness_items: list[Any],
        experiment_payload: dict[str, Any],
    ) -> list[dict[str, str]]:
        practices: list[dict[str, str]] = []
        for item in awareness_items:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or "").strip()
            content = str(item.get("content") or "").strip()
            if title and content:
                practices.append({"title": title, "content": content})
            if len(practices) >= 2:
                break
        experiment_title = str(experiment_payload.get("title") or "").strip()
        experiment_content = str(experiment_payload.get("content") or "").strip()
        if experiment_title and experiment_content and len(practices) < 3:
            practices.append({"title": experiment_title, "content": experiment_content})
        return practices[:3]

    def _build_pro_imbalance_confirmed_summary(
        self,
        legacy_projection: dict[str, Any],
        *,
        primary_imbalance: str,
        signal: str,
    ) -> dict[str, str]:
        summary = str(legacy_projection.get("block_point") or "").strip()
        label = primary_imbalance or self._get_signal_label(signal) or signal
        return {
            "type": signal,
            "primary": label,
            "summary": summary,
            "evidence": str(legacy_projection.get("direction") or "").strip(),
        }

    def _build_pro_healing_suggestion_summary(
        self,
        legacy_projection: dict[str, Any],
        *,
        primary_imbalance: str,
        signal: str,
        theme_label: str,
    ) -> list[dict[str, str]]:
        healing_core = str(legacy_projection.get("healing_core") or "").strip()
        direction = str(legacy_projection.get("direction") or "").strip()
        root_cause = legacy_projection.get("root_cause", {})
        core_root = str(root_cause.get("core") or "").strip() if isinstance(root_cause, dict) else ""
        primary = primary_imbalance or self._get_signal_label(signal) or signal or "当前主轴"
        suggestions = [
            {
                "phase": "当前阶段",
                "focus": primary,
                "practice": healing_core or f"先围绕「{primary}」建立更稳的承载感。",
            },
            {
                "phase": "下一步",
                "focus": f"{theme_label}中的行动节奏",
                "practice": direction or "先把行动拆成可以承接的小单位。",
            },
            {
                "phase": "更深层",
                "focus": "根因层",
                "practice": core_root or "观察自己在哪个瞬间会先收回来。",
            },
        ]
        return suggestions

    def _projection_text(
        self,
        projection: dict[str, Any] | None,
        key: str,
    ) -> str:
        if not isinstance(projection, dict):
            return ""
        value = projection.get(key)
        return value.strip() if isinstance(value, str) else ""

    def _render_runtime_template(
        self,
        template: str,
        **kwargs: Any,
    ) -> str:
        if not template:
            return ""
        try:
            return template.format(**kwargs).strip()
        except Exception:
            return template.strip()

    def _build_surface_root_text(
        self,
        *,
        lite_contradiction: str,
        intention: str,
        manifestation: str,
        signal_text: str,
        without_intention_template: str,
        with_intention_template: str,
    ) -> str:
        contradiction_preview = self._trim_sentence(lite_contradiction, 120)
        if not intention:
            base = self._render_runtime_template(
                without_intention_template,
                lite_contradiction=f"{contradiction_preview} " if contradiction_preview else "",
            )
            base = f"表面上看，你最容易先看到的是：{base}".strip()
            if manifestation:
                base = f"{base} 更落到现实里看，它常会表现成：{manifestation}。"
            return f"{base} {signal_text}".strip() if signal_text else base
        base = self._render_runtime_template(
            with_intention_template,
            lite_contradiction=f"{contradiction_preview} " if contradiction_preview else "",
            intention=intention,
        )
        base = f"表面上看，你最容易先看到的是：{base}".strip()
        if manifestation:
            base = f"{base} 现实层面也常会表现成：{manifestation}。"
        return f"{base} {signal_text}".strip() if signal_text else base

    def _build_pro_circle_text(
        self,
        *,
        circle: dict[str, Any] | Any,
        fallback_text: str,
    ) -> str:
        payload = circle if isinstance(circle, dict) else {}
        meaning = str(payload.get("meaning") or "").strip()
        radius_percent = payload.get("radius_percent")
        dominant = str(payload.get("dominant") or "").strip()
        colors = [
            item
            for item in payload.get("colors", [])
            if isinstance(item, str) and item.strip()
        ]
        knowledge_reading = str(payload.get("knowledge_reading") or "").strip()
        softened_reading = self._soften_circle_reading(knowledge_reading)
        parts: list[str] = []
        if meaning and radius_percent:
            parts.append(
                f"{meaning}这一层当前约占 {radius_percent}%，给人的主感觉更偏「{dominant or '未识别'}」。"
            )
        elif dominant:
            parts.append(f"这一层当前更偏「{dominant}」的感觉。")
        if softened_reading:
            fragments = [
                item.strip()
                for item in softened_reading.split("。")
                if item.strip()
            ]
            if fragments:
                parts.append(fragments[0].rstrip("。") + "。")
            if len(fragments) > 1:
                parts.append(fragments[1].rstrip("。") + "。")
        if colors and not softened_reading:
            parts.append(f"画面里反复出现的颜色集中在 {'、'.join(colors[:3])}。")
        return " ".join(parts).strip() or fallback_text
