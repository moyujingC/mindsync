"""Stage-safe narrative helpers backed by the v2.1 knowledge runtime."""

from __future__ import annotations

import re
from typing import Any

from ..contracts import FallbackLevel, QueryResult
from ..repository import KnowledgeRepository
from .healing_service import HealingService
from .imbalance_service import ImbalanceService
from .theme_service import ThemeService


class NarrativeContextService:
    """Serve only the narrative helpers still required by the stage runtime."""

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
                if isinstance(item, dict) and item.get("practice")
            ]
            if practices:
                lines.append(f"可执行建议：{' / '.join(practices[:3])}")
        return "\n".join(line for line in lines if str(line).strip())

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

    def _extract_phase_labels(self, phases: list[Any]) -> list[str]:
        labels: list[str] = []
        for phase in phases:
            if isinstance(phase, dict):
                label = str(phase.get("label") or phase.get("name") or "").strip()
                if label:
                    labels.append(label)
                    continue
                value = phase.get("value")
                if isinstance(value, str) and value.strip():
                    labels.append(value.strip())
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
        for phrase in ["Lite 里", "解锁完整版", "补全版", "升级版", "21天"]:
            cleaned = cleaned.replace(phrase, "")
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
        return cleaned
