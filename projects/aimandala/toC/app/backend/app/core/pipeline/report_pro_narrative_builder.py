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
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        parts = [
            f"第一眼看这张画，最明显的是「{dominant['name']}」和「{secondary['name']}」共同撑起了整张画的骨架。",
        ]
        if transition:
            parts.append(transition)
        parts.append(
            "这不是表面上的停住，而是这张画正在认真处理一件更底层的事：先把自己安顿住，再决定如何向外表达。"
        )
        if lite_contradiction:
            contradiction = lite_contradiction[:96].strip()
            if contradiction and contradiction[-1] not in "。！？":
                contradiction += "。"
            parts.append(contradiction)
        if signal_text:
            parts.append(signal_text)
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
        return (
            f"{theme_label}主题下，这张画的能量核心更接近「{dominant['name']}」({dominant['percentage']:.2f}%)"
            f" 与「{secondary['name']}」({secondary['percentage']:.2f}%) 的组合。"
            f"{transition or ''} 这说明你现在最重要的功课，不是更快，而是让内在承载、外在边界和现实动作重新接上。"
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
            parts.append(f"当前更核心的卡点，其实是「{mapped_contradiction}」。")
        if mapped_manifestation:
            parts.append(mapped_manifestation.rstrip("。") + "。")
        if lite_block:
            parts.append(lite_block[:96].strip())
        if primary:
            parts.append(f"{primary}让你很难一边往前推进，一边仍然感觉自己是安全的。")
        if weakest.get("percentage", 0.0) < 12:
            weakest_theme = self._get_element_theme_phrase(
                self._get_record_theme(record),
                weakest["name"],
            )
            parts.append(
                f"再加上「{weakest['name']}」相关的{weakest_theme}资源暂时偏少，所以你在快要真正启动时更容易先想缓一缓。"
            )
        if signal_text:
            parts.append(signal_text)
        parts.append(self._build_feeling_hint(record))
        return " ".join(part for part in parts if part).strip()

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
        return PRO_REPORT_BLUEPRINT.narrative_templates["root_deeper"]

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
        return PRO_REPORT_BLUEPRINT.narrative_templates["root_core"]

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
            parts.append(f"{meaning}当前约占 {radius_percent}%，主导元素更偏「{dominant or '未识别'}」。")
        elif dominant:
            parts.append(f"当前主导元素更偏「{dominant}」。")
        if knowledge_reading:
            parts.append(knowledge_reading.rstrip("。") + "。")
        if colors:
            parts.append(f"代表性色彩集中在 {'、'.join(colors[:3])}。")
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
            f"圈间节奏首先显示：{adjacent[0]}。这说明当前能量更像在调整承接，而不是剧烈摆荡。"
            if adjacent
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_rhythm"]
        )
        relationship = (
            f"继续往外看，{adjacent[1]}。这意味着你的关系和现实投入，不只是情绪反应，而是在寻找更合适的承接方式。"
            if len(adjacent) > 1
            else PRO_REPORT_BLUEPRINT.narrative_templates["micro_relationship"]
        )
        action = (
            f"当前最明显的行动提示是：{wrap[0]}。与其一次性猛推，不如让行动和承载一起增长。"
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
                base = f"{base} 更落到现实里看，它常会表现成：{mapped_manifestation}。"
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
            base = f"{base} 现实层面也常会表现成：{mapped_manifestation}。"
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
