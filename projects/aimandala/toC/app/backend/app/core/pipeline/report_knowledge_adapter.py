"""Knowledge and narrative adapter helpers for the report pipeline."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer0Raw
from .report_blueprints import LITE_REPORT_BLUEPRINT


class ReportKnowledgeAdapter:
    """Resolve theme, signal, and element helpers from runtime services."""

    def __init__(
        self,
        *,
        get_narrative_service: Callable[[], Any],
        get_knowledge_runtime: Callable[[], Any],
        get_layer0_view: Callable[[InterpretationRecord], Layer0Raw],
    ) -> None:
        self._get_narrative_service = get_narrative_service
        self._get_knowledge_runtime = get_knowledge_runtime
        self._get_layer0_view = get_layer0_view
        self._theme_summary_cache: dict[str, dict[str, Any]] = {}
        self._theme_element_profile_cache: dict[tuple[str, str], dict[str, Any]] = {}

    def get_primary_knowledge_signal(self, record: InterpretationRecord) -> str:
        layer0 = self._get_layer0_view(record)
        candidates = getattr(layer0, "imbalance_candidates", []) or []
        for item in candidates:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return ""

    def get_theme_label(self, theme: str | None) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "get_theme_label",
        ):
            try:
                runtime_label = narrative_service.get_theme_label(
                    theme or "general",
                    fallback_label=LITE_REPORT_BLUEPRINT.theme_labels.get(
                        theme or "general",
                        theme or "整体",
                    ),
                )
            except Exception:
                runtime_label = ""
            if isinstance(runtime_label, str) and runtime_label.strip():
                return runtime_label.strip()

        summary = self.get_knowledge_theme_summary(theme)
        if summary.get("name"):
            return str(summary["name"])
        return LITE_REPORT_BLUEPRINT.theme_labels.get(
            theme or "general",
            theme or "整体",
        )

    def get_signal_label(self, signal: str) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "get_signal_label",
        ):
            try:
                runtime_label = narrative_service.get_signal_label(signal)
            except Exception:
                runtime_label = ""
            if isinstance(runtime_label, str) and runtime_label.strip():
                return runtime_label.strip()

        labels = {
            "transition-overload": "过渡负荷",
            "boundary-constriction": "边界紧绷",
            "relational-drain": "关系耗散",
            "emotion-congestion": "情绪淤积",
            "action-block": "行动受阻",
            "energy-block": "能量受阻",
        }
        return labels.get(signal, signal.replace("-", " ").strip())

    def describe_signal(self, signal: str) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "describe_signal",
        ):
            try:
                runtime_description = narrative_service.describe_signal(signal)
            except Exception:
                runtime_description = ""
            if isinstance(runtime_description, str) and runtime_description.strip():
                return runtime_description.strip()

        descriptions = {
            "transition-overload": "你正处在旧节奏尚未完全退场、新节奏又开始拉扯的过渡期。",
            "boundary-constriction": "你更容易先收紧边界来维持安全感。",
            "relational-drain": "很多能量已经流向外部关系与任务，回补速度暂时还没跟上。",
            "emotion-congestion": "情绪更多停留在内部循环，还没有找到稳定的出口。",
            "action-block": "行动能量在启动前被过多顾虑和自我保护截住了。",
            "energy-block": "内外能量的转换还不够顺畅，所以你会时常感觉想推进却又被拉住。",
        }
        return descriptions.get(signal, "")

    def get_element_theme_phrase(self, theme: str | None, element_name: str) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "get_element_theme_phrase",
        ):
            try:
                runtime_phrase = narrative_service.get_element_theme_phrase(
                    theme or "general",
                    element_name,
                )
            except Exception:
                runtime_phrase = ""
            if isinstance(runtime_phrase, str) and runtime_phrase.strip():
                return runtime_phrase.strip()

        profile = self.get_theme_element_profile(theme, element_name)
        psychological_theme = profile.get("psychological_theme")
        if isinstance(psychological_theme, str) and psychological_theme.strip():
            return psychological_theme.strip()
        core_concept = profile.get("core_concept")
        if isinstance(core_concept, str) and core_concept.strip():
            return core_concept.strip()
        return f"{element_name}元素的状态"

    def get_element_core_keywords(self, theme: str | None, element_name: str) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "get_element_core_keywords",
        ):
            try:
                runtime_keywords = narrative_service.get_element_core_keywords(
                    theme or "general",
                    element_name,
                )
            except Exception:
                runtime_keywords = ""
            if isinstance(runtime_keywords, str) and runtime_keywords.strip():
                return runtime_keywords.strip()

        profile = self.get_theme_element_profile(theme, element_name)
        keywords = profile.get("keywords")
        if isinstance(keywords, list) and keywords:
            filtered = [
                str(item).strip()
                for item in keywords
                if isinstance(item, str) and item.strip()
            ]
            if filtered:
                return "、".join(filtered[:3])
        return self.get_element_theme_phrase(theme, element_name)

    def get_theme_element_profile(
        self,
        theme: str | None,
        element_name: str,
    ) -> dict[str, Any]:
        theme_key = (theme or "general").strip() or "general"
        cache_key = (theme_key, element_name)
        cached = self._theme_element_profile_cache.get(cache_key)
        if cached is not None:
            return cached

        profile: dict[str, Any] = {}
        knowledge_runtime = self._get_knowledge_runtime()
        if knowledge_runtime is not None:
            try:
                result = knowledge_runtime.theme_service.get_element_meaning(
                    theme_key,
                    element_name,
                )
            except Exception:
                result = {}
            if isinstance(result, dict):
                profile = result

        self._theme_element_profile_cache[cache_key] = profile
        return profile

    def describe_circle_transition(self, layer0: Layer0Raw) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "describe_circle_transition",
        ):
            try:
                runtime_transition = narrative_service.describe_circle_transition(
                    inner_dominant=layer0.three_circles.inner.get("dominant", ""),
                    middle_dominant=layer0.three_circles.middle.get("dominant", ""),
                    outer_dominant=layer0.three_circles.outer.get("dominant", ""),
                )
            except Exception:
                runtime_transition = ""
            if isinstance(runtime_transition, str) and runtime_transition.strip():
                return runtime_transition.strip()

        inner = layer0.three_circles.inner.get("dominant", "")
        middle = layer0.three_circles.middle.get("dominant", "")
        outer = layer0.three_circles.outer.get("dominant", "")
        if inner and middle and outer:
            if inner == middle == outer:
                return f"三圈目前都围绕「{inner}」展开。"
            if inner == middle and outer != inner:
                return f"内圈和中圈都更偏「{inner}」，外圈则开始转向「{outer}」。"
            return f"三圈依次呈现出「{inner} -> {middle} -> {outer}」的变化。"
        return ""

    def clean_knowledge_text_block(self, content: str) -> str:
        narrative_service = self._get_narrative_service()
        if narrative_service is not None and hasattr(
            narrative_service,
            "clean_text_block",
        ):
            try:
                runtime_cleaned = narrative_service.clean_text_block(content)
            except Exception:
                runtime_cleaned = ""
            if isinstance(runtime_cleaned, str):
                return runtime_cleaned

        if not isinstance(content, str):
            return ""
        lines = []
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

    def get_knowledge_theme_summary(self, theme: str | None) -> dict[str, Any]:
        theme_key = (theme or "general").strip() or "general"
        cached = self._theme_summary_cache.get(theme_key)
        if cached is not None:
            return cached

        summary: dict[str, Any] = {}
        knowledge_runtime = self._get_knowledge_runtime()
        if knowledge_runtime is not None:
            try:
                result = knowledge_runtime.theme_service.get_theme_summary(theme_key)
            except Exception:
                result = {}
            if isinstance(result, dict) and result:
                summary = result

        self._theme_summary_cache[theme_key] = summary
        return summary
