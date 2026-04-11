"""Narrative helpers backed by the v2.1 knowledge runtime."""

from __future__ import annotations

from typing import Any

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

    def build_imbalance_projection(
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

        summary_parts = [f"当前更接近的核心失衡是「{imbalance_type}」"]
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
            block_parts.append(f"当前更核心的卡点，其实是「{contradiction}」。")
        if manifestation:
            block_parts.append(manifestation.rstrip("。") + "。")

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
            deeper_root = f"更深一层看，这更接近「{imbalance_type}」的模式：{manifestation}。"
            if psychology:
                deeper_root += f" 它常会让人落进「{psychology}」这样的内在循环。"

        core_root = ""
        if issue_type and cognitive_upgrade:
            core_root = f"更深层的位置，是你正在重新学习：在「{issue_type}」这里，{cognitive_upgrade}"
        elif cognitive_upgrade:
            core_root = f"更深层的位置，是你正在重新学习：{cognitive_upgrade}"

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
        inner = inner_dominant or dominant
        middle = middle_dominant or secondary
        readings_text = "；".join(
            item.strip()
            for item in (circle_readings or [])
            if isinstance(item, str) and item.strip()
        )

        overall_parts = [
            f"这幅画首先给人的感觉，是一种以「{dominant}」为主的底色；它更在意的是{dominant_theme}。",
        ]
        if transition:
            overall_parts.append(transition)
        overall_parts.append(
            f"整体来看，这不是单纯往外冲的状态，而更像先把内在安顿住，再慢慢把「{secondary}」相关的{secondary_keywords}带回现实。"
        )
        if signal_text:
            overall_parts.append(signal_text)

        visual_parts = [
            (
                f"从三圈颜色聚合来看，五行里以「{dominant}」({dominant_percentage:.2f}%) "
                f"和「{secondary}」({secondary_percentage:.2f}%) 最突出。"
            ),
            (
                f"内圈主导为「{inner or '未识别'}」，中圈主导为「{middle or '未识别'}」，"
                f"外圈主导为「{outer or '未识别'}」。{circle_pattern}"
            ),
        ]
        if readings_text:
            visual_parts.append(readings_text + "。")

        base = (
            f"你的底色更接近「{dominant}」所代表的{dominant_theme}。"
            f"{transition or ''} 这也让你做很多事之前，会先确认自己是不是已经站稳。"
        ).strip()
        contradiction = (
            f"你内里更需要{dominant_theme}，但外在已经开始调用「{outer}」的力量去整理边界、秩序或方向。"
            f"这会让你一边想继续向外，一边又不愿再用没有承载感的方式消耗自己。"
        )
        if adjacent_relations:
            pattern = (
                f"从圈间关系看，{adjacent_relations[0]}。"
                "所以你的推进方式往往不是一下子冲出去，而是先在内部整合，等感觉对了才继续往前。"
            )
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"当外圈更偏向「{outer}」时，你会更倾向用清晰、距离感或判断标准保护自己。"
            f"这不是冷下来，而是在替现在的自己筛选什么值得继续打开。"
        )
        block_parts = ["当前最容易卡住你的，是主导能量和现实节奏还没完全接上。"]
        if weakest_percentage < 12:
            block_parts.append(
                f"尤其是「{weakest}」相关的{weakest_theme}资源暂时偏少时，你会更容易在快要推进时先退回来。"
            )
        if signal_text:
            block_parts.append(signal_text)
        light = (
            f"你的光并不只在稳定里，也在于你已经开始把「{secondary}」所代表的{secondary_theme}慢慢带出来。"
            f"这说明你不是被困住，而是在学习用更适合自己的方式向前。"
        )

        scene = (
            f"在「{resolved_theme_label}」这个角度里，你更容易出现在“先确认自己有没有站稳，再决定要不要继续投入”的场景里。"
            f"这和画面里「{dominant}」更强有关，因为它会先把注意力拉回{dominant_theme}。"
        )
        impact = "这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        if weakest_percentage < 12:
            impact += f" 当「{weakest}」相关的{weakest_theme}资源偏少时，你也会更需要一点缓冲和回收。"
        awareness = "这幅画提醒你的，不是逼自己立刻变得更强，而是看见：只要先把内在安顿好，后面的行动会自然长出来。"
        if signal_text:
            awareness += f" {signal_text}"

        emotion_parts = [
            f"情绪层面上，你现在更像在优先处理「{dominant}」相关的课题，也就是{dominant_theme}。",
            f"而外圈出现的「{outer}」，又说明你并不是想完全退回去，而是在重新整理自己要用什么样的边界、判断和回应方式与世界接触。",
        ]
        if weakest_percentage < 12:
            emotion_parts.append(
                f"相比之下，「{weakest}」相关的{weakest_theme}资源暂时收得比较里面，所以当节奏一快，你更容易先想停下来整理自己。"
            )
        if signal_text:
            emotion_parts.append(signal_text)
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
                        f"那往往是「{dominant}」在提醒你：先照顾好{dominant_keywords}。"
                    ),
                },
                {
                    "day": 2,
                    "title": "看见边界变化",
                    "content": (
                        "当你准备继续投入时，观察自己是不是会先把边界、标准或距离感收紧。"
                        f"外圈的「{outer}」不是要你拒绝，而是提醒你先看清楚。"
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
        return "\n".join(lines).strip()
