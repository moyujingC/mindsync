"""Build Lite fallback narrative content for the report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import DailyAwareness, InterpretationRecord, Layer0Raw
from .report_blueprints import (
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    build_lite_experiment_content,
    render_lite_template_text,
)


class ReportLiteNarrativeBuilder:
    """Build Lite narrative text when runtime projections are absent."""

    def __init__(
        self,
        *,
        get_record_theme: Callable[[InterpretationRecord], str],
        get_layer0_view: Callable[[InterpretationRecord], Layer0Raw],
        get_layer0_element_distribution: Callable[[Layer0Raw], list[dict[str, Any]]],
        get_element_theme_phrase: Callable[[str | None, str], str],
        get_element_core_keywords: Callable[[str | None, str], str],
        describe_circle_transition: Callable[[Layer0Raw], str],
        describe_signal: Callable[[str], str],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str],
        resolve_runtime_lite_projection: Callable[..., dict[str, Any]],
        get_projection_text: Callable[[dict[str, Any] | None, str], str],
        get_projection_mapping: Callable[[dict[str, Any] | None, str], dict[str, Any]],
        get_projection_list: Callable[[dict[str, Any] | None, str], list[Any]],
        build_feeling_hint: Callable[[InterpretationRecord], str],
        get_narrative_service: Callable[[], Any],
        clean_knowledge_text_block: Callable[[str], str],
        get_theme_label: Callable[[str | None], str],
    ) -> None:
        self._get_record_theme = get_record_theme
        self._get_layer0_view = get_layer0_view
        self._get_layer0_element_distribution = get_layer0_element_distribution
        self._get_element_theme_phrase = get_element_theme_phrase
        self._get_element_core_keywords = get_element_core_keywords
        self._describe_circle_transition = describe_circle_transition
        self._describe_signal = describe_signal
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._resolve_runtime_lite_projection = resolve_runtime_lite_projection
        self._get_projection_text = get_projection_text
        self._get_projection_mapping = get_projection_mapping
        self._get_projection_list = get_projection_list
        self._build_feeling_hint = build_feeling_hint
        self._get_narrative_service = get_narrative_service
        self._clean_knowledge_text_block = clean_knowledge_text_block
        self._get_theme_label = get_theme_label

    def _build_state_opening(
        self,
        theme_label: str,
        dominant_name: str,
        dominant_theme: str,
        feeling_hint: str,
        signal_text: str,
    ) -> str:
        opening = (
            f"第一眼先看到的，不是你要不要马上往前冲，"
            f"而是你正在把自己重新收回来，确认现在这份力气能不能稳稳地落在{dominant_theme}上。"
        )
        if theme_label != "整体":
            opening = (
                f"放到「{theme_label}」里看，这张画先说中的不是结果，"
                f"而是你在往前之前，会先确认自己有没有站稳{dominant_theme}。"
            )
        if feeling_hint:
            opening = f"{opening} {feeling_hint}"
        elif signal_text:
            opening = f"{opening} {signal_text}"
        return opening.strip()

    def _build_circle_observation(
        self,
        meaning: str,
        dominant: str,
        summary: str,
    ) -> str:
        cleaned_summary = self._clean_knowledge_text_block(summary or "").strip()
        if cleaned_summary:
            return (
                f"{meaning}这一层更显眼的是「{dominant or '未识别'}」的感觉，"
                f"画面上会给人一种{cleaned_summary.rstrip('。')}的印象。"
            )
        if dominant:
            return f"{meaning}这一层更显眼的是「{dominant}」的感觉。"
        return ""

    def _strip_technical_prefixes(self, text: str) -> str:
        cleaned = self._clean_knowledge_text_block(text or "").strip()
        replacements = [
            ("内圈（里圈）主要对应", "最里面这一层常会照见"),
            ("内圈主要对应", "最里面这一层常会照见"),
            ("中圈主要对应", "中间这一层更容易落到"),
            ("外圈主要对应", "最外面这一层更容易碰到"),
            ("此圈可以重点观察：", "放到现实里，往往会连到"),
            ("当前更显著的是", "现在更突出的是"),
            ("「", "「"),
        ]
        for source, target in replacements:
            cleaned = cleaned.replace(source, target)
        return cleaned.strip()

    def build_title(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_title = self._get_projection_text(runtime_projection, "title")
        if isinstance(runtime_title, str) and runtime_title.strip():
            return runtime_title.strip()

        return self.build_title_fallback(record, theme_label)

    def build_title_fallback(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> str:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_key = self._get_record_theme(record)
        inner = circles["inner_radius"]
        middle = circles["middle_radius"]
        if inner >= 42:
            return LITE_REPORT_BLUEPRINT.title_templates["inner_high"].format(
                theme_label=theme_label
            )
        if middle >= 74:
            return LITE_REPORT_BLUEPRINT.title_templates["middle_high"].format(
                theme_label=theme_label
            )
        if theme_key in LITE_REPORT_BLUEPRINT.title_templates:
            return LITE_REPORT_BLUEPRINT.title_templates[theme_key]
        return LITE_REPORT_BLUEPRINT.title_templates["default"]

    def build_overall_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circle_info: dict[str, int],
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_overall = self._get_projection_text(
            runtime_projection,
            "overall_impression",
        )
        if isinstance(runtime_overall, str) and runtime_overall.strip():
            return runtime_overall.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        secondary_keywords = self._get_element_core_keywords(theme, secondary["name"])
        transition = self._describe_circle_transition(layer0)
        feeling_hint = self._build_feeling_hint(record)
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts = [self._build_state_opening(theme_label, dominant["name"], dominant_theme, feeling_hint, signal_text)]
        if transition:
            parts.append(f"再往里看，三圈的走向也在说明同一件事：{transition}")
        parts.append(
            f"所以这不是简单的停住，而更像你先把内在安顿好，"
            f"再慢慢把{secondary_keywords}带回现实。"
        )
        if signal_text:
            parts.append(f"它也提醒你：{signal_text}")
        return " ".join(parts)

    def build_visual_elements(
        self,
        record: InterpretationRecord,
        theme: str,
        circle_info: dict[str, int],
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            self._get_theme_label(theme),
            projection=projection,
        )
        runtime_visual = self._get_projection_text(runtime_projection, "visual_elements")
        if isinstance(runtime_visual, str) and runtime_visual.strip():
            return runtime_visual.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else {"name": "金", "percentage": 0.0}
        inner = layer0.three_circles.inner
        middle = layer0.three_circles.middle
        outer = layer0.three_circles.outer
        circle_pattern = self.describe_circle_pattern(circle_info)
        lines = [
            f"如果只看画面给人的感受，最先浮出来的是两股力量：一股是「{dominant['name']}」的收拢和判断，"
            f"另一股是「{secondary['name']}」想把事情重新带回现实。"
        ]
        if circle_pattern:
            lines.append(f"三层画面的走向也很清楚：{circle_pattern}")
        observations = [
            self._build_circle_observation(
                str(inner.get("meaning", "最里面")),
                str(inner.get("dominant", "")),
                str(inner.get("observation_summary") or inner.get("knowledge_reading") or ""),
            ),
            self._build_circle_observation(
                str(middle.get("meaning", "中间")),
                str(middle.get("dominant", "")),
                str(middle.get("observation_summary") or middle.get("knowledge_reading") or ""),
            ),
            self._build_circle_observation(
                str(outer.get("meaning", "最外面")),
                str(outer.get("dominant", "")),
                str(outer.get("observation_summary") or outer.get("knowledge_reading") or ""),
            ),
        ]
        lines.extend([item for item in observations if item])
        reading_segments = []
        for circle in (inner, middle, outer):
            reading = circle.get("knowledge_reading", "")
            if isinstance(reading, str) and reading.strip():
                reading_segments.append(self._strip_technical_prefixes(reading))
        if reading_segments:
            lines.append("换句话说，" + "；".join(reading_segments[:2]) + "。")
        return " ".join(lines).strip()

    def build_emotion_portrait(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_emotion = self._get_projection_text(
            runtime_projection,
            "emotion_portrait",
        )
        if isinstance(runtime_emotion, str) and runtime_emotion.strip():
            return runtime_emotion.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        outer = layer0.three_circles.outer
        theme = self._get_record_theme(record)
        feeling_hint = self._build_feeling_hint(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts = [
            f"情绪上，你现在不像没感觉，反而像一直在心里默默处理{dominant_theme}这件事。",
            f"而最外层落出来的「{outer.get('dominant', '金')}」感，也说明你并不是想完全退回去，"
            "只是想先弄清楚，接下来该用什么边界和姿态继续向外。"
        ]
        if weakest.get("percentage", 0.0) < 12:
            parts.append(
                f"也因为{weakest_theme}暂时偏弱，"
                "所以一旦节奏变快，你更容易先退回来，等自己重新有把握了再动。"
            )
        if signal_text:
            parts.append(f"这和你现在的状态也很像：{signal_text}")
        if feeling_hint:
            parts.append(feeling_hint)
        return " ".join(part for part in parts if part).strip()

    def build_story_sections(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        secondary_theme = self._get_element_theme_phrase(theme, secondary["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        transition = self._describe_circle_transition(layer0)
        adjacent = layer0.micro_analysis.adjacent or []
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        outer_dominant = layer0.three_circles.outer.get("dominant", secondary["name"])

        base = (
            f"你的底色不是急着证明什么，而是先确认自己有没有站稳在{dominant_theme}上。"
            f"{(' ' + transition) if transition else ''} 所以你很多时候不是慢，而是先要让内在点头。"
        ).strip()
        contradiction = (
            f"矛盾也正在这里：你心里其实想继续往前，"
            f"但外在又已经开始用「{outer_dominant}」的方式先整理边界、秩序或方向。"
            "于是你会一边想行动，一边又不愿再把自己丢回那种失控消耗里。"
        )
        if adjacent:
            pattern = (
                f"久而久之，这会形成你的惯用模式：{adjacent[0]}。"
                "你通常不是直接冲，而是先在心里把事情转过一遍，感觉对了才真正迈出去。"
            )
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"为了不再乱掉，你会自然长出一种防御：更强调清晰、距离感和判断标准。"
            f"它看起来像「{outer_dominant}」的收紧，但本质上是在替现在的你筛选什么值得继续打开。"
        )
        block_parts = ["当前最容易卡住你的，不是没有方向，而是主导能量和现实节奏还没完全接上。"]
        if weakest.get("percentage", 0.0) < 12:
            block_parts.append(
                f"尤其当{weakest_theme}还没跟上时，"
                "你会在快要推进的那一刻先退回来。"
            )
        if signal_text:
            block_parts.append(f"这也是为什么你会反复遇到这样的卡点：{signal_text}")
        light = (
            f"但你的光也已经出来了：你不是只会收着，"
            f"而是正在把「{secondary['name']}」代表的{secondary_theme}慢慢带回生活。"
            "这说明你不是卡死了，而是在学一种更适合自己的前进方式。"
        )
        sections = {
            "base": " ".join(part for part in [base] if part).strip(),
            "contradiction": contradiction.strip(),
            "pattern": pattern.strip(),
            "defense": defense.strip(),
            "block": " ".join(block_parts).strip(),
            "light": light.strip(),
        }
        runtime_sections = self._get_projection_mapping(
            runtime_projection,
            "story_sections",
        )
        if isinstance(runtime_sections, dict):
            for key in sections:
                value = runtime_sections.get(key)
                if isinstance(value, str) and value.strip():
                    sections[key] = value.strip()
        return sections

    def build_theme_insights(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_theme = self._get_element_theme_phrase(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        scene = (
            f"在「{theme_label}」里，你最常出现的场景是："
            "不是没有机会，而是每次准备投入时，都会先问自己现在这样推，会不会又把自己推乱。"
            f"因为画面里更强的那股力量，会先把注意力拉回{dominant_theme}。"
        )
        impact = "这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        if weakest.get("percentage", 0.0) < 12:
            impact += f" 当{weakest_theme}还偏少时，你也会更需要一点缓冲和回收。"
        awareness = "这幅画提醒你的，不是逼自己立刻更强，而是先承认：你想稳住，不等于你退缩；只要先把自己接住，后面的行动会自己长出来。"
        if signal_text:
            awareness += f" {signal_text}"
        insights = {
            "scene": scene.strip(),
            "impact": impact.strip(),
            "awareness": awareness.strip(),
        }
        runtime_insights = self._get_projection_mapping(
            runtime_projection,
            "theme_insights",
        )
        if isinstance(runtime_insights, dict):
            for key in insights:
                value = runtime_insights.get(key)
                if isinstance(value, str) and value.strip():
                    insights[key] = value.strip()
        return insights

    def build_three_awareness(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> list[DailyAwareness]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        theme = self._get_record_theme(record)
        dominant_keywords = self._get_element_core_keywords(theme, dominant["name"])
        weakest_theme = self._get_element_theme_phrase(theme, weakest["name"])
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        signal_short = signal_text.rstrip("。") if signal_text else "想推进却又停住的那个瞬间"
        awareness_items = [
            DailyAwareness(
                day=1,
                title="先安顿自己",
                content=f"今天留意一下，当你准备回应外部事情前，身体会不会先想稳住一点。那不是你拖延，而往往是在提醒你：先照顾好{dominant_keywords}。",
            ),
            DailyAwareness(
                day=2,
                title="看见边界变化",
                content="当你准备继续投入时，观察自己是不是会先把边界、标准或距离感收紧。那不是故意冷下来，而是在确认这件事值不值得你继续打开。",
            ),
            DailyAwareness(
                day=3,
                title="捕捉卡住瞬间",
                content=f"如果今天又出现{signal_short}，别急着评价自己。把那个瞬间记下来，你会更看清自己何时需要补回{weakest_theme}。",
            ),
        ]
        runtime_awareness = self._get_projection_list(
            runtime_projection,
            "three_awareness",
        )
        if isinstance(runtime_awareness, list) and runtime_awareness:
            merged: list[DailyAwareness] = []
            for index, item in enumerate(runtime_awareness[:3], start=1):
                if isinstance(item, DailyAwareness):
                    merged.append(item)
                    continue
                if not isinstance(item, dict):
                    continue
                title = item.get("title")
                content = item.get("content")
                if not isinstance(title, str) or not title.strip():
                    continue
                if not isinstance(content, str) or not content.strip():
                    continue
                day = item.get("day", index)
                if not isinstance(day, int):
                    day = index
                merged.append(
                    DailyAwareness(
                        day=day,
                        title=title.strip(),
                        content=content.strip(),
                    )
                )
            if merged:
                used_days = {item.day for item in merged}
                for fallback_item in awareness_items:
                    if len(merged) >= 3:
                        break
                    if fallback_item.day in used_days:
                        continue
                    merged.append(fallback_item)
                    used_days.add(fallback_item.day)
                merged.sort(key=lambda item: item.day)
                return merged[:3]
        return awareness_items

    def build_six_insights_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        story_sections: dict[str, str],
        projection: dict[str, Any] | None = None,
    ) -> dict[str, dict[str, str]]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_six_insights = self._get_projection_mapping(
            runtime_projection,
            "six_insights",
        )
        if isinstance(runtime_six_insights, dict) and runtime_six_insights:
            normalized: dict[str, dict[str, str]] = {}
            for key in LITE_REPORT_BLUEPRINT.six_insight_layer1_templates.keys():
                payload = runtime_six_insights.get(key)
                if not isinstance(payload, dict):
                    continue
                title = payload.get("title")
                content = payload.get("content")
                summary = payload.get("summary")
                if not isinstance(title, str) or not title.strip():
                    continue
                if not isinstance(content, str) or not content.strip():
                    continue
                normalized[key] = {
                    "title": title.strip(),
                    "content": content.strip(),
                    "summary": (
                        summary.strip()
                        if isinstance(summary, str) and summary.strip()
                        else content.strip()
                    ),
                }
            if normalized:
                return normalized

        story_angles = self._get_projection_mapping(runtime_projection, "story_angles")
        payloads: dict[str, dict[str, str]] = {}
        for key, template in LITE_REPORT_BLUEPRINT.six_insight_layer1_templates.items():
            story_content = story_sections.get(key, "")
            angle = ""
            if isinstance(story_angles, dict):
                value = story_angles.get(key)
                if isinstance(value, str) and value.strip():
                    angle = value.strip()
            base_title = template.get("title", key)
            title = f"{base_title}：{angle}" if angle else base_title
            payloads[key] = {
                "title": title,
                "content": story_content
                or render_lite_template_text(
                    template.get("content", ""),
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
                "summary": story_content
                or render_lite_template_text(
                    template.get("summary", ""),
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
            }
        return payloads

    def build_experiment_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        title: str,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, str]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_experiment = self._get_projection_mapping(runtime_projection, "experiment")
        if isinstance(runtime_experiment, dict):
            experiment_title = runtime_experiment.get("title")
            experiment_content = runtime_experiment.get("content")
            if (
                isinstance(experiment_title, str)
                and experiment_title.strip()
                and isinstance(experiment_content, str)
                and experiment_content.strip()
            ):
                return {
                    "title": experiment_title.strip(),
                    "content": experiment_content.strip(),
                }

        content = build_lite_experiment_content(theme_label=theme_label, title=title)
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        dominant_keywords = self._get_element_core_keywords(
            self._get_record_theme(record),
            dominant["name"],
        )
        content = (
            f"{content}\n补充观察：如果今天只顺着这幅画练习一件事，可以试着把「{dominant['name']}」的品质带进生活里，例如先给自己一点{dominant_keywords}。"
        ).strip()
        return {
            "title": LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"],
            "content": content,
        }

    def build_pro_teaser(
        self,
        record: InterpretationRecord,
        projection: dict[str, Any] | None = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            self._get_theme_label(record.theme),
            projection=projection,
        )
        runtime_teaser = self._get_projection_text(runtime_projection, "pro_teaser")
        if isinstance(runtime_teaser, str) and runtime_teaser.strip():
            return runtime_teaser.strip()

        raw_teaser = ""
        narrative_service = self._get_narrative_service()
        if narrative_service is not None:
            try:
                raw_teaser = narrative_service.get_pro_upgrade_teaser(
                    self._get_record_theme(record)
                )
            except Exception:
                raw_teaser = ""
        cleaned = self._clean_knowledge_text_block(raw_teaser)
        if not cleaned:
            return DEFAULT_PRO_TEASER
        if cleaned in DEFAULT_PRO_TEASER:
            return DEFAULT_PRO_TEASER
        return f"{DEFAULT_PRO_TEASER}\n\n{cleaned}".strip()

    def describe_circle_pattern(self, circles: dict[str, int]) -> str:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        if inner >= 40:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_inner_high"]
        if middle >= 72:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_middle_high"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_default"]
