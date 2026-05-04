"""Build Pro fallback narrative content for the report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer0Raw
from .report_blueprints import PRO_REPORT_BLUEPRINT, render_template_text


class ReportProNarrativeBuilder:
    """Build Pro narrative text when runtime projections are absent."""

    def __init__(
        self,
        *,
        get_record_theme: Callable[[InterpretationRecord], str],
        get_layer0_view: Callable[[InterpretationRecord], Layer0Raw],
        get_layer0_element_distribution: Callable[[Layer0Raw], list[dict[str, Any]]],
        describe_circle_transition: Callable[[Layer0Raw], str],
        describe_signal: Callable[[str], str],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str],
        get_signal_label: Callable[[str], str],
        get_element_theme_phrase: Callable[[str | None, str], str],
        get_projection_text: Callable[[dict[str, Any] | None, str], str],
        get_projection_mapping: Callable[[dict[str, Any] | None, str], dict[str, Any]],
        get_runtime_imbalance_projection: Callable[[InterpretationRecord], dict[str, Any]],
        build_feeling_hint: Callable[[InterpretationRecord], str],
        get_knowledge_runtime: Callable[[], Any],
    ) -> None:
        self._get_record_theme = get_record_theme
        self._get_layer0_view = get_layer0_view
        self._get_layer0_element_distribution = get_layer0_element_distribution
        self._describe_circle_transition = describe_circle_transition
        self._describe_signal = describe_signal
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._get_signal_label = get_signal_label
        self._get_element_theme_phrase = get_element_theme_phrase
        self._get_projection_text = get_projection_text
        self._get_projection_mapping = get_projection_mapping
        self._get_runtime_imbalance_projection = get_runtime_imbalance_projection
        self._build_feeling_hint = build_feeling_hint
        self._get_knowledge_runtime = get_knowledge_runtime

    def _trim_sentence(self, text: str, limit: int = 88) -> str:
        cleaned = " ".join((text or "").split()).strip()
        if not cleaned:
            return ""
        if len(cleaned) <= limit:
            return cleaned if cleaned[-1] in "。！？" else f"{cleaned}。"
        trimmed = cleaned[:limit].rstrip("，,；; ")
        return trimmed + "。"

    def build_first_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        lite_title: str,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_first_impression = self._get_projection_text(
            projection,
            "first_impression",
        )
        if runtime_first_impression.strip():
            return runtime_first_impression.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        transition = self._describe_circle_transition(layer0)
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        dominant_theme = self._get_element_theme_phrase(
            self._get_record_theme(record),
            dominant["name"],
        )
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        parts = [
            f"第一眼看这张画，最先撞出来的不是结果层面的焦虑，"
            f"而是你正卡在一个很具体的位置：想往前，但还没有完全放心把自己交出去。"
        ]
        if transition:
            parts.append(f"画面的主轴也很明确：{transition}")
        parts.append(
            f"所以这不是简单的停住，而是你正在认真处理更底层的事："
            f"先把和{dominant_theme}有关的承载感站稳，再决定怎么用「{secondary['name']}」的力量继续向外。"
        )
        if lite_contradiction:
            parts.append(self._trim_sentence(lite_contradiction, 96))
        if signal_text:
            parts.append(f"更深一层看，{signal_text}")
        return " ".join(parts)

    def build_energy_essence(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: dict[str, int],
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_energy_essence = self._get_projection_text(
            projection,
            "energy_essence",
        )
        if runtime_energy_essence.strip():
            return runtime_energy_essence.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        transition = self._describe_circle_transition(layer0)
        dominant_theme = self._get_element_theme_phrase(
            self._get_record_theme(record),
            dominant["name"],
        )
        return (
            f"这张画的能量主轴，不是拼命往外冲，"
            f"而是先把{dominant_theme}站稳，再决定怎么让「{secondary['name']}」带着你继续向前。"
            f"{(' ' + transition) if transition else ''}"
        ).strip()

    def build_block_point(
        self,
        record: InterpretationRecord,
        imbalance_profile: dict[str, str] | None = None,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_block_point = self._get_projection_text(
            narrative_projection,
            "block_point",
        )
        if runtime_block_point.strip():
            return runtime_block_point.strip()

        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        lite_block = (
            record.layer_1_lite_draft.story.block.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.block.content
            else ""
        )
        primary = imbalance_profile.get("primary", "") if imbalance_profile else ""
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts: list[str] = []
        mapped_contradiction = self._get_projection_text(
            runtime_projection,
            "contradiction",
        ).strip()
        mapped_manifestation = self._get_projection_text(
            runtime_projection,
            "manifestation",
        ).strip()
        if mapped_contradiction:
            parts.append(f"你现在更核心的卡点，其实是「{mapped_contradiction}」")
        if mapped_manifestation:
            parts.append(f"它不是抽象概念，落到现实里，常常就表现成：{mapped_manifestation.rstrip('。')}。")
        if lite_block:
            parts.append(f"所以你会反复遇到同一种体验：{self._trim_sentence(lite_block, 90).rstrip('。')}")
        if primary:
            parts.append(f"说到底，是因为{primary}让你很难一边往前推进，一边仍然感觉自己是安全的。")
        if weakest.get("percentage", 0.0) < 12:
            weakest_theme = self._get_element_theme_phrase(
                self._get_record_theme(record),
                weakest["name"],
            )
            parts.append(
                f"再加上和「{weakest['name']}」有关的{weakest_theme}资源暂时偏少，"
                "所以你在快要真正启动时，更容易先想缓一缓。"
            )
        if signal_text:
            parts.append(f"这和画面里的深层信号也是一致的：{signal_text}")
        feeling_hint = self._build_feeling_hint(record)
        if feeling_hint:
            parts.append(feeling_hint)
        return " ".join(part for part in parts if part).strip() + "。"

    def build_direction(
        self,
        record: InterpretationRecord,
        theme_label: str,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_direction = self._get_projection_text(
            narrative_projection,
            "direction",
        )
        if runtime_direction.strip():
            return runtime_direction.strip()

        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        mapped_direction = self._get_projection_text(
            runtime_projection,
            "direction",
        ).strip()
        base = PRO_REPORT_BLUEPRINT.narrative_templates["core_direction"].format(
            theme_label=theme_label
        )
        if not mapped_direction:
            return base
        return f"{mapped_direction}。{base}".strip()

    def build_healing_core(
        self,
        record: InterpretationRecord,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_healing_core = self._get_projection_text(
            narrative_projection,
            "healing_core",
        )
        if runtime_healing_core.strip():
            return runtime_healing_core.strip()

        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        return (
            self._get_projection_text(runtime_projection, "healing_core").strip()
            or PRO_REPORT_BLUEPRINT.narrative_templates["core_healing"]
        )

    def build_deeper_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_root_cause = self._get_projection_mapping(
            narrative_projection,
            "root_cause",
        )
        deeper_root = str(runtime_root_cause.get("deeper") or "").strip()
        if deeper_root:
            return deeper_root

        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        deeper_root = self._get_projection_text(runtime_projection, "deeper_root").strip()
        if deeper_root:
            return deeper_root
        runtime_surface = self.build_surface_root_cause(
            record,
            narrative_projection=narrative_projection,
            projection=projection,
        )
        fallback = PRO_REPORT_BLUEPRINT.narrative_templates["root_deeper"]
        return (
            f"如果再往下一层看，问题不只是表面卡住，"
            f"而是你会慢慢形成一种重复机制：{fallback.rstrip('。')}。"
            f"它会把前面那种“{self._trim_sentence(runtime_surface, 52).rstrip('。')}”反复拉回来。"
        )

    def build_core_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_root_cause = self._get_projection_mapping(
            narrative_projection,
            "root_cause",
        )
        core_root = str(runtime_root_cause.get("core") or "").strip()
        if core_root:
            return core_root

        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        core_root = self._get_projection_text(runtime_projection, "core_root").strip()
        if core_root:
            return core_root
        fallback = PRO_REPORT_BLUEPRINT.narrative_templates["root_core"]
        return (
            "而最深的地方，往往不是能力问题，"
            f"而是你心里对“我可不可以安心拥有、安心向前”这件事还没有完全放松。{fallback.rstrip('。')}。"
        )

    def build_circle_reading(
        self,
        record: InterpretationRecord,
        circle_key: str,
        fallback_text: str,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_circle_readings = self._get_projection_mapping(
            projection,
            "circle_readings",
        )
        runtime_circle_reading = str(runtime_circle_readings.get(circle_key) or "").strip()
        if runtime_circle_reading:
            return runtime_circle_reading

        layer0 = self._get_layer0_view(record)
        circle = (
            getattr(layer0.three_circles, circle_key, {})
            if hasattr(layer0.three_circles, circle_key)
            else {}
        )
        if not isinstance(circle, dict):
            return fallback_text
        meaning = circle.get("meaning", "")
        radius_percent = circle.get("radius_percent")
        dominant = circle.get("dominant", "")
        colors = [item for item in circle.get("colors", []) if isinstance(item, str) and item]
        knowledge_reading = circle.get("knowledge_reading", "")
        parts: list[str] = []
        if meaning and radius_percent:
            parts.append(f"{meaning}这一层当前约占 {radius_percent}%，主导感觉更偏「{dominant or '未识别'}」。")
        elif dominant:
            parts.append(f"这一层当前更偏「{dominant}」的感觉。")
        if knowledge_reading:
            parts.append(knowledge_reading.rstrip("。") + "。")
        if colors and not knowledge_reading:
            parts.append(f"画面里反复出现的颜色集中在 {'、'.join(colors[:3])}。")
        return " ".join(parts).strip() or fallback_text

    def build_micro_sections_from_knowledge(
        self,
        record: InterpretationRecord,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        runtime_micro_sections = self._get_projection_mapping(
            projection,
            "micro_sections",
        )
        if runtime_micro_sections:
            return {
                str(key): str(value).strip()
                for key, value in runtime_micro_sections.items()
                if str(key).strip() and isinstance(value, str) and value.strip()
            }

        layer0 = self._get_layer0_view(record)
        adjacent = layer0.micro_analysis.adjacent or []
        wrap = layer0.micro_analysis.wrap or []
        rhythm = (
            f"先看节奏，你现在的能量不是散的，而是明显在{adjacent[0]}。这说明你正在调承接，不是在乱。"
            if adjacent
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_rhythm"]
        )
        relationship = (
            f"再往外看，{adjacent[1]}。这意味着你的关系和现实投入，不只是情绪反应，而是在寻找更合适的承接方式。"
            if len(adjacent) > 1
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_relationship"]
        )
        action = (
            f"落到行动上，最明显的提示是：{wrap[0]}。与其一次性猛推，不如让行动和承载一起增长。"
            if wrap
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_action"]
        )
        return {
            PRO_REPORT_BLUEPRINT.structure_labels["micro_rhythm"]: rhythm,
            PRO_REPORT_BLUEPRINT.structure_labels["micro_relationship"]: relationship,
            PRO_REPORT_BLUEPRINT.structure_labels["micro_action"]: action,
        }

    def build_surface_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: dict[str, Any] | None = None,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_root_cause = self._get_projection_mapping(
            narrative_projection,
            "root_cause",
        )
        surface_root = str(runtime_root_cause.get("surface") or "").strip()
        if surface_root:
            return surface_root

        intention = (record.painting_intention or "").strip()
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        mapped_manifestation = self._get_projection_text(
            runtime_projection,
            "manifestation",
        ).strip()
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        if not intention:
            base = PRO_REPORT_BLUEPRINT.narrative_templates[
                "surface_root_without_intention"
            ].format(
                lite_contradiction=f"{lite_contradiction[:72]} "
                if lite_contradiction
                else ""
            )
            if mapped_manifestation:
                base = f"表面上看，你最容易先看到的是：{base} 更落到现实里看，它常会表现成：{mapped_manifestation}。"
            else:
                base = f"表面上看，你最容易先看到的是：{base}"
            return f"{base} {signal_text}".strip() if signal_text else base
        base = PRO_REPORT_BLUEPRINT.narrative_templates[
            "surface_root_with_intention"
        ].format(
            lite_contradiction=f"{lite_contradiction[:72]} "
            if lite_contradiction
            else "",
            intention=intention,
        )
        if mapped_manifestation:
            base = f"表面上看，你最容易先看到的是：{base} 现实层面也常会表现成：{mapped_manifestation}。"
        else:
            base = f"表面上看，你最容易先看到的是：{base}"
        return f"{base} {signal_text}".strip() if signal_text else base

    def map_knowledge_signal_to_profile(self, signal: str) -> str:
        direct_profiles = set(PRO_REPORT_BLUEPRINT.imbalance_profiles.keys())
        if signal in direct_profiles:
            return signal
        mapping = {
            "transition-overload": "energy-block",
        }
        return mapping.get(signal, "")

    def build_pro_imbalance_profile(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: dict[str, int],
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        profile_key = self.select_pro_imbalance_type(
            record=record,
            inner=inner,
            middle=middle,
        )
        signal = self._get_primary_knowledge_signal(record)
        runtime_profile = self.build_runtime_imbalance_profile(
            record,
            profile_key=profile_key,
            signal=signal,
            theme_label=theme_label,
            projection=projection,
        )
        if runtime_profile:
            return runtime_profile

        signal_label = self._get_signal_label(signal) if signal else ""
        signal_text = self._describe_signal(signal)

        template = PRO_REPORT_BLUEPRINT.imbalance_profiles.get(
            profile_key,
            PRO_REPORT_BLUEPRINT.imbalance_profiles.get("energy-block", {}),
        )
        summary = render_template_text(
            template.get("summary", ""),
            inner=str(inner),
            middle=str(middle),
            theme_label=theme_label,
        )
        evidence = render_template_text(
            template.get("evidence", ""),
            inner=str(inner),
            middle=str(middle),
            theme_label=theme_label,
        )
        if signal and signal != profile_key:
            summary = (
                f"{summary} 同时，Layer 0 的知识候选更接近「{signal_label}」，"
                "说明这不是单点问题，而更像阶段性的能量转折。"
            )
            evidence = f"{evidence} 知识库原始候选同时提示为「{signal_label}」。"
        elif signal_text:
            evidence = f"{evidence} {signal_text}".strip()
        return {
            "type": profile_key,
            "primary": template.get("primary", "能量受阻型失衡"),
            "summary": summary,
            "evidence": evidence,
            "energy_level": render_template_text(
                template.get("energy_level", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
            "psychological_level": render_template_text(
                template.get("psychological_level", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
            "life_manifestation": render_template_text(
                template.get("life_manifestation", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
        }

    def build_runtime_imbalance_profile(
        self,
        record: InterpretationRecord,
        *,
        profile_key: str,
        signal: str,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        if not signal:
            return {}
        runtime_projection = projection or self._get_runtime_imbalance_projection(record)
        if not runtime_projection:
            return {}
        mapped_contradiction = self._get_projection_text(
            runtime_projection,
            "contradiction",
        ).strip()
        mapped_manifestation = self._get_projection_text(
            runtime_projection,
            "manifestation",
        ).strip()
        if not mapped_contradiction and not mapped_manifestation:
            return {}

        return {
            "type": profile_key,
            "primary": mapped_contradiction or self._get_signal_label(signal),
            "summary": self._get_projection_text(runtime_projection, "summary"),
            "evidence": self._get_projection_text(runtime_projection, "evidence"),
            "energy_level": mapped_manifestation or self._describe_signal(signal),
            "psychological_level": mapped_contradiction or self._describe_signal(signal),
            "life_manifestation": str(
                mapped_manifestation
                or self._get_projection_text(runtime_projection, "direction")
                or self._describe_signal(signal)
            ),
        }

    def select_pro_imbalance_type(
        self,
        *,
        record: InterpretationRecord,
        inner: int,
        middle: int,
    ) -> str:
        signal = self._get_primary_knowledge_signal(record)
        mapped_signal = self.map_knowledge_signal_to_profile(signal)
        if mapped_signal:
            return mapped_signal

        for rule in PRO_REPORT_BLUEPRINT.imbalance_selection_rules:
            if rule.inner_gte is not None and inner < rule.inner_gte:
                continue
            if rule.middle_gte is not None and middle < rule.middle_gte:
                continue
            if rule.theme_in and (record.theme or "general") not in set(rule.theme_in):
                continue
            return rule.type

        return "energy-block"

    def build_pro_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        imbalance_profile: dict[str, str],
        theme_label: str,
    ) -> list[dict[str, str]]:
        primary = imbalance_profile.get("primary", "能量受阻型失衡")
        runtime_rendered = self.build_runtime_healing_suggestions(
            record,
            primary=primary,
            theme_label=theme_label,
        )
        if runtime_rendered:
            return runtime_rendered

        type_code = imbalance_profile.get("type", "energy-block")
        templates = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get(
            type_code
        ) or PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get("energy-block", [])
        rendered = [
            {
                "phase": item.get("phase", ""),
                "focus": render_template_text(
                    item.get("focus", ""),
                    primary=primary,
                    theme_label=theme_label,
                ),
                "practice": render_template_text(
                    item.get("practice", ""),
                    primary=primary,
                    theme_label=theme_label,
                ),
            }
            for item in templates
        ]
        common_tail_template = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get(
            "common_tail",
            {},
        )
        common_tail = {
            "phase": common_tail_template.get("phase", "建议三：把理解变成稳定边界"),
            "focus": render_template_text(
                common_tail_template.get(
                    "focus",
                    "真正的疗愈不是一次性解决全部问题，而是围绕「{primary}」慢慢建立更适合你的节奏与承载方式。",
                ),
                primary=primary,
                theme_label=theme_label,
            ),
            "practice": render_template_text(
                common_tail_template.get(
                    "practice",
                    "这周在{theme_label}里只保留少量但稳定的承诺，练习在不透支自己的前提下继续向外连接。",
                ),
                primary=primary,
                theme_label=theme_label,
            ),
        }
        return [*rendered, common_tail]

    def build_runtime_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        primary: str,
        theme_label: str,
    ) -> list[dict[str, str]]:
        knowledge_runtime = self._get_knowledge_runtime()
        if not knowledge_runtime:
            return []

        imbalance_type = self._get_primary_knowledge_signal(record)
        if not imbalance_type:
            return []

        healing_result = knowledge_runtime.healing_service.get_healing_plan(
            imbalance_type,
            self._get_record_theme(record),
        )
        payload = (
            healing_result.value
            if isinstance(healing_result.value, dict)
            else {}
        )
        if not payload:
            return []

        issue_type = self._clean_runtime_healing_text(payload.get("issue_type"))
        symptoms = self._clean_runtime_healing_text(payload.get("symptoms"))
        mandala_prescription = self._clean_runtime_healing_text(
            payload.get("mandala_prescription")
        )
        daily_practice = self._clean_runtime_healing_text(payload.get("daily_practice"))
        cognitive_upgrade = self._clean_runtime_healing_text(
            payload.get("cognitive_upgrade")
        )

        if not any(
            [
                issue_type,
                symptoms,
                mandala_prescription,
                daily_practice,
                cognitive_upgrade,
            ]
        ):
            return []

        phase_one_focus = (
            symptoms
            or f"这次更需要先看见「{issue_type or primary}」在你当下的具体表现。"
        )
        if issue_type:
            phase_one_focus = f"当前更接近的疗愈议题是「{issue_type}」。{phase_one_focus}"

        phase_two_focus = (
            mandala_prescription
            or f"围绕「{primary}」先做小幅但稳定的调节，而不是期待一次性把所有问题解决。"
        )
        phase_three_focus = (
            cognitive_upgrade
            or f"真正的转化，不是立刻变成另一个人，而是在{theme_label}里慢慢长出更稳的节奏。"
        )

        return [
            {
                "phase": f"建议一：先识别「{issue_type or primary}」",
                "focus": phase_one_focus,
                "practice": daily_practice
                or "先用一句话写下你最近最常出现的感受，再决定要不要马上处理它。",
            },
            {
                "phase": "建议二：把绘画当成调节容器",
                "focus": phase_two_focus,
                "practice": daily_practice
                or f"本周只围绕{theme_label}做一个最小动作，让身体先适应新的节奏。",
            },
            {
                "phase": "建议三：把理解落回现实生活",
                "focus": phase_three_focus,
                "practice": render_template_text(
                    "这周在{theme_label}里保留少量但稳定的承诺，围绕「{primary}」练习不过度用力，也不完全退回去。",
                    primary=primary,
                    theme_label=theme_label,
                ),
            },
        ]

    def _clean_runtime_healing_text(self, value: Any) -> str:
        if not isinstance(value, str):
            return ""
        text = value.strip()
        if not text:
            return ""
        raw_markers = [
            "{'" + "inner'",
            '"inner"',
            "'inner':",
            "'middle':",
            "'outer':",
            '"middle":',
            '"outer":',
            "'depth_state':",
            '"depth_state":',
            "'avg_brightness':",
            '"avg_brightness":',
            "'avg_saturation':",
            '"avg_saturation":',
        ]
        if any(marker in text for marker in raw_markers):
            return ""
        return text
