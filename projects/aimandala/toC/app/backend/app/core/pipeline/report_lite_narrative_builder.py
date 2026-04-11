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
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        parts = [
            f"这幅画首先给人的感觉，是一种以「{dominant['name']}」为主的底色；它更在意的是{dominant_theme}。",
        ]
        if transition:
            parts.append(transition)
        parts.append(
            f"整体来看，这不是单纯往外冲的状态，而更像先把内在安顿住，再慢慢把「{secondary['name']}」相关的{secondary_keywords}带回现实。"
        )
        if signal_text:
            parts.append(signal_text)
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
            f"从三圈颜色聚合来看，五行里以「{dominant['name']}」({dominant['percentage']:.2f}%) 和「{secondary['name']}」({secondary['percentage']:.2f}%) 最突出。",
            f"内圈主导为「{inner.get('dominant', '未识别')}」，中圈主导为「{middle.get('dominant', '未识别')}」，外圈主导为「{outer.get('dominant', '未识别')}」。{circle_pattern}",
        ]
        reading_segments = [
            inner.get("knowledge_reading", ""),
            middle.get("knowledge_reading", ""),
            outer.get("knowledge_reading", ""),
        ]
        reading_text = "；".join(
            segment
            for segment in reading_segments
            if isinstance(segment, str) and segment.strip()
        )
        if reading_text:
            lines.append(reading_text + "。")
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
            f"情绪层面上，你现在更像在优先处理「{dominant['name']}」相关的课题，也就是{dominant_theme}。",
            f"而外圈出现的「{outer.get('dominant', '金')}」，又说明你并不是想完全退回去，而是在重新整理自己要用什么样的边界、判断和回应方式与世界接触。",
        ]
        if weakest.get("percentage", 0.0) < 12:
            parts.append(
                f"相比之下，「{weakest['name']}」相关的{weakest_theme}资源暂时收得比较里面，所以当节奏一快，你更容易先想停下来整理自己。"
            )
        if signal_text:
            parts.append(signal_text)
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
            f"你的底色更接近「{dominant['name']}」所代表的{dominant_theme}。"
            f"{transition or ''} 这也让你做很多事之前，会先确认自己是不是已经站稳。"
        ).strip()
        contradiction = (
            f"你内里更需要{dominant_theme}，但外在已经开始调用「{outer_dominant}」的力量去整理边界、秩序或方向。"
            f"这会让你一边想继续向外，一边又不愿再用没有承载感的方式消耗自己。"
        )
        if adjacent:
            pattern = (
                f"从圈间关系看，{adjacent[0]}。所以你的推进方式往往不是一下子冲出去，而是先在内部整合，等感觉对了才继续往前。"
            )
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"当外圈更偏向「{outer_dominant}」时，你会更倾向用清晰、距离感或判断标准保护自己。"
            f"这不是冷下来，而是在替现在的自己筛选什么值得继续打开。"
        )
        block_parts = ["当前最容易卡住你的，是主导能量和现实节奏还没完全接上。"]
        if weakest.get("percentage", 0.0) < 12:
            block_parts.append(
                f"尤其是「{weakest['name']}」相关的{weakest_theme}资源暂时偏少时，你会更容易在快要推进时先退回来。"
            )
        if signal_text:
            block_parts.append(signal_text)
        light = (
            f"你的光并不只在稳定里，也在于你已经开始把「{secondary['name']}」所代表的{secondary_theme}慢慢带出来。"
            f"这说明你不是被困住，而是在学习用更适合自己的方式向前。"
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
            f"在「{theme_label}」这个角度里，你更容易出现在“先确认自己有没有站稳，再决定要不要继续投入”的场景里。"
            f"这和画面里「{dominant['name']}」更强有关，因为它会先把注意力拉回{dominant_theme}。"
        )
        impact = "这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        if weakest.get("percentage", 0.0) < 12:
            impact += f" 当「{weakest['name']}」相关的{weakest_theme}资源偏少时，你也会更需要一点缓冲和回收。"
        awareness = "这幅画提醒你的，不是逼自己立刻变得更强，而是看见：只要先把内在安顿好，后面的行动会自然长出来。"
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
        outer_dominant = layer0.three_circles.outer.get("dominant", "金")
        signal_text = self._describe_signal(self._get_primary_knowledge_signal(record))
        signal_short = signal_text.rstrip("。") if signal_text else "想推进却又停住的那个瞬间"
        awareness_items = [
            DailyAwareness(
                day=1,
                title="先安顿自己",
                content=f"今天留意一下，当你准备回应外部事情前，身体会不会先想稳住一点。那往往是「{dominant['name']}」在提醒你：先照顾好{dominant_keywords}。",
            ),
            DailyAwareness(
                day=2,
                title="看见边界变化",
                content=f"当你准备继续投入时，观察自己是不是会先把边界、标准或距离感收紧。外圈的「{outer_dominant}」不是要你拒绝，而是提醒你先看清楚。",
            ),
            DailyAwareness(
                day=3,
                title="捕捉卡住瞬间",
                content=f"如果今天又出现{signal_short}的时刻，别急着评价自己。把那个瞬间记下来，你会更看清自己何时需要补回与「{weakest['name']}」相关的{weakest_theme}。",
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
