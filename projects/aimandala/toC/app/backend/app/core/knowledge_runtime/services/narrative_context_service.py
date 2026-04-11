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
