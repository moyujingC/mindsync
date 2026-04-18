"""Resolve runtime narrative and imbalance projections for reports."""

from __future__ import annotations

from typing import Any, Callable

from .data_models import InterpretationRecord, Layer0Raw
from .report_blueprints import (
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    PRO_REPORT_BLUEPRINT,
    build_lite_experiment_content,
)


class ReportProjectionResolver:
    """Centralize runtime-backed projection lookup and caching."""

    def __init__(
        self,
        *,
        get_narrative_service: Callable[[], Any],
        get_record_theme: Callable[[InterpretationRecord], str],
        get_layer0_view: Callable[[InterpretationRecord], Layer0Raw],
        get_layer0_element_distribution: Callable[[Layer0Raw], list[dict[str, Any]]],
        describe_circle_transition: Callable[[Layer0Raw], str],
        get_primary_knowledge_signal: Callable[[InterpretationRecord], str],
        build_feeling_hint: Callable[[InterpretationRecord], str],
        build_lite_title_fallback: Callable[[InterpretationRecord, str], str],
        get_theme_label: Callable[[str | None], str],
        describe_circle_pattern: Callable[[dict[str, int]], str],
    ) -> None:
        self._get_narrative_service = get_narrative_service
        self._get_record_theme = get_record_theme
        self._get_layer0_view = get_layer0_view
        self._get_layer0_element_distribution = get_layer0_element_distribution
        self._describe_circle_transition = describe_circle_transition
        self._get_primary_knowledge_signal = get_primary_knowledge_signal
        self._build_feeling_hint = build_feeling_hint
        self._build_lite_title_fallback = build_lite_title_fallback
        self._get_theme_label = get_theme_label
        self._describe_circle_pattern = describe_circle_pattern
        self._imbalance_projection_cache: dict[tuple[str, str, str], dict[str, Any]] = {}

    def build_runtime_pro_narrative_projection(
        self,
        record: InterpretationRecord,
        *,
        theme_label: str,
        lite_title: str,
        imbalance_profile: dict[str, str],
        imbalance_projection: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        plan = self.build_runtime_pro_narrative_plan(
            record,
            theme_label=theme_label,
            lite_title=lite_title,
            imbalance_profile=imbalance_profile,
            imbalance_projection=imbalance_projection,
        )
        if isinstance(plan, dict):
            legacy_projection = plan.get("legacy_projection")
            if isinstance(legacy_projection, dict):
                return legacy_projection
        return {}

    def build_runtime_pro_narrative_plan(
        self,
        record: InterpretationRecord,
        *,
        theme_label: str,
        lite_title: str,
        imbalance_profile: dict[str, str],
        imbalance_projection: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        narrative_service = self._get_narrative_service()
        if narrative_service is None:
            return {}

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft
            and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        lite_block = (
            record.layer_1_lite_draft.story.block.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.block.content
            else ""
        )
        circles = {
            "inner": layer0.three_circles.inner,
            "middle": layer0.three_circles.middle,
            "outer": layer0.three_circles.outer,
        }
        adjacent = [
            str(item).strip()
            for item in (layer0.micro_analysis.adjacent or [])
            if isinstance(item, str) and str(item).strip()
        ]
        wrap = [
            str(item).strip()
            for item in (layer0.micro_analysis.wrap or [])
            if isinstance(item, str) and str(item).strip()
        ]

        try:
            plan = narrative_service.build_pro_narrative_plan(
                theme=self._get_record_theme(record),
                theme_label=theme_label,
                lite_title=lite_title,
                lite_contradiction=lite_contradiction,
                lite_block=lite_block,
                intention=(record.painting_intention or "").strip(),
                feeling_hint=self._build_feeling_hint(record),
                dominant_element=dominant["name"],
                dominant_percentage=float(dominant.get("percentage", 0.0) or 0.0),
                secondary_element=secondary["name"],
                secondary_percentage=float(secondary.get("percentage", 0.0) or 0.0),
                weakest_element=weakest["name"],
                weakest_percentage=float(weakest.get("percentage", 0.0) or 0.0),
                signal=self._get_primary_knowledge_signal(record),
                primary_imbalance=str(imbalance_profile.get("primary") or "").strip(),
                transition=self._describe_circle_transition(layer0),
                circles=circles,
                adjacent=adjacent,
                wrap=wrap,
                narrative_templates=dict(PRO_REPORT_BLUEPRINT.narrative_templates),
                structure_labels=dict(PRO_REPORT_BLUEPRINT.structure_labels),
                circle_fallbacks={
                    "inner": PRO_REPORT_BLUEPRINT.narrative_templates[
                        "circle_inner_reading"
                    ].format(inner=(record.three_circles or {}).get("inner_radius", 33)),
                    "middle": PRO_REPORT_BLUEPRINT.narrative_templates[
                        "circle_middle_reading"
                    ].format(
                        middle=(record.three_circles or {}).get("middle_radius", 66)
                    ),
                    "outer": PRO_REPORT_BLUEPRINT.narrative_templates[
                        "circle_outer_reading"
                    ],
                },
                imbalance_projection=imbalance_projection,
            )
        except Exception:
            return {}

        return plan if isinstance(plan, dict) else {}

    def build_runtime_lite_narrative_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> dict[str, Any]:
        plan = self.build_runtime_lite_narrative_plan(
            record,
            theme_label,
        )
        if isinstance(plan, dict):
            legacy_projection = plan.get("legacy_projection")
            if isinstance(legacy_projection, dict):
                return legacy_projection
        return {}

    def build_runtime_lite_narrative_plan(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> dict[str, Any]:
        narrative_service = self._get_narrative_service()
        if narrative_service is None:
            return {}

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        adjacent = [
            str(item).strip()
            for item in (layer0.micro_analysis.adjacent or [])
            if isinstance(item, str) and str(item).strip()
        ]

        try:
            plan = narrative_service.build_lite_narrative_plan(
                theme=self._get_record_theme(record),
                theme_label=theme_label,
                inner_radius=int((record.three_circles or {}).get("inner_radius", 33)),
                middle_radius=int((record.three_circles or {}).get("middle_radius", 66)),
                title_templates=dict(LITE_REPORT_BLUEPRINT.title_templates),
                six_insight_templates=dict(
                    LITE_REPORT_BLUEPRINT.six_insight_layer1_templates
                ),
                experiment_title=LITE_REPORT_BLUEPRINT.structure_labels[
                    "experiment_title"
                ],
                experiment_content=build_lite_experiment_content(
                    theme_label=theme_label,
                    title=self._build_lite_title_fallback(record, theme_label),
                ),
                dominant_element=dominant["name"],
                dominant_percentage=float(dominant.get("percentage", 0.0) or 0.0),
                secondary_element=secondary["name"],
                secondary_percentage=float(secondary.get("percentage", 0.0) or 0.0),
                weakest_element=weakest["name"],
                weakest_percentage=float(weakest.get("percentage", 0.0) or 0.0),
                inner_dominant=layer0.three_circles.inner.get("dominant", dominant["name"]),
                middle_dominant=layer0.three_circles.middle.get(
                    "dominant",
                    secondary["name"],
                ),
                outer_dominant=layer0.three_circles.outer.get(
                    "dominant",
                    secondary["name"],
                ),
                circle_pattern=self._describe_circle_pattern(
                    record.three_circles or {"inner_radius": 33, "middle_radius": 66}
                ),
                circle_readings=[
                    layer0.three_circles.inner.get("knowledge_reading", ""),
                    layer0.three_circles.middle.get("knowledge_reading", ""),
                    layer0.three_circles.outer.get("knowledge_reading", ""),
                ],
                transition=self._describe_circle_transition(layer0),
                adjacent=adjacent,
                signal=self._get_primary_knowledge_signal(record),
                feeling_hint=self._build_feeling_hint(record),
                default_pro_teaser=DEFAULT_PRO_TEASER,
            )
        except Exception:
            return {}

        return plan if isinstance(plan, dict) else {}

    def resolve_runtime_lite_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if isinstance(projection, dict):
            return projection
        return self.build_runtime_lite_narrative_projection(record, theme_label)

    def get_projection_text(
        self,
        projection: dict[str, Any] | None,
        key: str,
    ) -> str:
        if not isinstance(projection, dict):
            return ""
        value = projection.get(key)
        if isinstance(value, str):
            return value
        return ""

    def get_projection_mapping(
        self,
        projection: dict[str, Any] | None,
        key: str,
    ) -> dict[str, Any]:
        if not isinstance(projection, dict):
            return {}
        value = projection.get(key)
        return value if isinstance(value, dict) else {}

    def get_projection_list(
        self,
        projection: dict[str, Any] | None,
        key: str,
    ) -> list[Any]:
        if not isinstance(projection, dict):
            return []
        value = projection.get(key)
        return value if isinstance(value, list) else []

    def get_runtime_imbalance_projection(
        self,
        record: InterpretationRecord,
    ) -> dict[str, Any]:
        basis = self.get_runtime_imbalance_narrative_basis(record)
        if isinstance(basis, dict):
            projection = basis.get("legacy_projection")
            if isinstance(projection, dict):
                return projection
        return {}

    def get_runtime_imbalance_narrative_basis(
        self,
        record: InterpretationRecord,
    ) -> dict[str, Any]:
        narrative_service = self._get_narrative_service()
        if not narrative_service:
            return {}
        imbalance_type = self._get_primary_knowledge_signal(record)
        if not imbalance_type:
            return {}
        theme_key = self._get_record_theme(record)
        theme_label = self._get_theme_label(record.theme)
        cache_key = (theme_key, imbalance_type, theme_label)
        cached = self._imbalance_projection_cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            if hasattr(narrative_service, "build_imbalance_narrative_basis"):
                result = narrative_service.build_imbalance_narrative_basis(
                    theme=theme_key,
                    imbalance_type=imbalance_type,
                    theme_label=theme_label,
                )
            elif hasattr(narrative_service, "build_imbalance_projection"):
                legacy_projection = narrative_service.build_imbalance_projection(
                    theme=theme_key,
                    imbalance_type=imbalance_type,
                    theme_label=theme_label,
                )
                result = {
                    "mode": "imbalance_basis",
                    "generation_mode": "compatibility",
                    "theme": theme_key,
                    "theme_label": theme_label,
                    "imbalance_type": imbalance_type,
                    "sections": {},
                    "legacy_projection": (
                        legacy_projection if isinstance(legacy_projection, dict) else {}
                    ),
                }
            else:
                result = {}
        except Exception:
            result = {}
        basis = result if isinstance(result, dict) else {}
        self._imbalance_projection_cache[cache_key] = basis
        return basis
