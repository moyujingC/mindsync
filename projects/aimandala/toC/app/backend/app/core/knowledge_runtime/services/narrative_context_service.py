"""Narrative helpers backed by the v2.1 knowledge runtime."""

from __future__ import annotations

from typing import Any

from ..repository import KnowledgeRepository
from .healing_service import HealingService
from .theme_service import ThemeService


class NarrativeContextService:
    """Serve narrative assets and build report chat context."""

    def __init__(
        self,
        *,
        repository: KnowledgeRepository,
        theme_service: ThemeService,
        healing_service: HealingService,
    ) -> None:
        self.repository = repository
        self.theme_service = theme_service
        self.healing_service = healing_service

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
