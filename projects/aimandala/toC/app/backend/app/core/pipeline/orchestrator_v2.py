"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

import json
from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.analysis.circle_detector import CircleDetectionResult, CircleDetector
from app.core.prompt.builder_v2 import PromptBuilder
from app.core.safety.protocol import SafetyProtocol, quick_safety_check

from .data_models import (
    DailyAwareness,
    GenerationStatus,
    InterpretationRecord,
    Layer0Raw,
    Layer1LiteDraft,
    Layer2LiteFinal,
    Layer3ProDraft,
    Layer4ProFinal,
)
from .generation_runtime import (
    DeterministicReportGenerationRuntime,
    PromptBackedReportGenerationRuntime,
    ReportGenerationRuntime,
)
from .prompt_runtime import PromptRuntime
from .report_blueprints import (
    DEFAULT_PRO_TEASER,
    LITE_REPORT_BLUEPRINT,
    PRO_REPORT_BLUEPRINT,
    PRO_REPORT_INTRO,
    PRO_REPORT_TITLE,
    build_lite_experiment_content,
    render_lite_template_text,
    render_template_text,
)
from .store import InterpretationStore


class GenerationStage(str, Enum):
    """Execution stages for the migrated V2 interpretation pipeline."""

    PENDING = "pending"
    DETECTING = "detecting"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    FINALIZING = "finalizing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass(frozen=True)
class PricingSnapshot:
    """Current public pricing for the To C V2 baseline."""

    lite: float
    pro: float
    upgrade_diff: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "lite": self.lite,
            "pro": self.pro,
            "upgrade_diff": self.upgrade_diff,
        }


class LayeredOrchestrator:
    """Thin migration-safe shell of the legacy V2 layered orchestrator.

    This class intentionally keeps only stable, dependency-light behavior first:
    pricing baseline, stage vocabulary, and store wiring. Heavy AI, prompt,
    analysis, and safety dependencies will be reintroduced incrementally.
    """

    PRICING = PricingSnapshot(
        lite=9.9,
        pro=49.0,
        # Kept only for legacy V2 response compatibility. Product semantics remain
        # "independent purchase" unless a later decision explicitly changes them.
        upgrade_diff=39.1,
    )

    def __init__(
        self,
        knowledge_engine: Optional[Any] = None,
        store: Optional[InterpretationStore] = None,
        circle_detector: Optional[CircleDetector] = None,
        generation_runtime: Optional[ReportGenerationRuntime] = None,
        prompt_runtime: Optional[PromptRuntime] = None,
        enable_vision: bool = True,
    ) -> None:
        self.knowledge_engine = knowledge_engine
        self.store = store or InterpretationStore()
        self.circle_detector = circle_detector or CircleDetector()
        if generation_runtime is not None:
            self.generation_runtime = generation_runtime
        elif prompt_runtime is not None:
            self.generation_runtime = PromptBackedReportGenerationRuntime(
                prompt_runtime=prompt_runtime,
            )
        else:
            self.generation_runtime = DeterministicReportGenerationRuntime()
        self.enable_vision = enable_vision
        self.prompt_builder = PromptBuilder()

    @classmethod
    def get_pricing(cls) -> PricingSnapshot:
        """Return the fixed V2 pricing baseline used by the current To C MVP."""

        return cls.PRICING

    @classmethod
    def get_upgrade_diff(cls) -> float:
        """Expose the legacy compatibility field for existing V2 clients."""

        return cls.PRICING.upgrade_diff

    @classmethod
    def get_supported_versions(cls) -> tuple[str, str]:
        """Return the two report versions currently exposed by the To C MVP."""

        return ("lite", "pro")

    async def detect_three_circles(
        self,
        image_path: str,
        confidence_threshold: float = 0.3,
    ) -> CircleDetectionResult:
        """Run the migrated circle detector for the current To C V2 flow."""

        return await self.circle_detector.detect_circles(
            image_path=image_path,
            use_ai=self.enable_vision,
            use_opencv=True,
            confidence_threshold=confidence_threshold,
        )

    async def prepare_lite_record(
        self,
        *,
        image_path: str,
        user_id: str,
        theme: str = "general",
        image_url: Optional[str] = None,
        image_storage_backend: Optional[str] = None,
        image_storage_key: Optional[str] = None,
        image_local_expires_at: Optional[str] = None,
        painting_intention: Optional[str] = None,
        painting_feeling: Optional[str] = None,
        three_circles: Optional[Dict[str, int]] = None,
    ) -> InterpretationRecord:
        """Create a minimal Lite record and persist normalized circle settings."""

        image_hash = self._hash_image(image_path)
        record = self.store.create_record(
            user_id=user_id,
            image_hash=image_hash,
            theme=theme,
        )
        record.image_url = image_url
        record.image_storage_backend = image_storage_backend
        record.image_storage_key = image_storage_key
        record.image_local_path = image_path
        record.image_local_expires_at = image_local_expires_at
        record.painting_intention = painting_intention
        record.painting_feeling = painting_feeling
        record.status = GenerationStatus.PROCESSING

        if three_circles:
            normalized = self._normalize_circle_payload(three_circles)
            record.three_circles = normalized
            record.three_circles_user_adjusted = True
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "manual",
                }
            )
        else:
            detection = await self.detect_three_circles(image_path=image_path)
            normalized = self._normalize_circle_payload(
                {
                    "inner_radius": int(round(detection.inner_radius * 100)),
                    "middle_radius": int(round(detection.middle_radius * 100)),
                }
            )
            record.three_circles = normalized
            record.three_circles_auto_detect = {
                "inner_radius": detection.inner_radius,
                "middle_radius": detection.middle_radius,
                "confidence": detection.confidence,
                "method": detection.method,
            }
            record.three_circles_adjust_history.append(
                {
                    "from": {"inner": 33, "middle": 66},
                    "to": normalized.copy(),
                    "source": "auto",
                }
            )

        record.update_progress(GenerationStage.DETECTING.value, 10)
        self.store.save(record)
        return record

    async def generate_lite_placeholder(
        self,
        *,
        image_path: str,
        user_id: str,
        theme: str = "general",
        image_url: Optional[str] = None,
        image_storage_backend: Optional[str] = None,
        image_storage_key: Optional[str] = None,
        image_local_expires_at: Optional[str] = None,
        painting_intention: Optional[str] = None,
        painting_feeling: Optional[str] = None,
        three_circles: Optional[Dict[str, int]] = None,
        check_existing: bool = True,
    ) -> InterpretationRecord:
        """Create a migrated Lite record with a placeholder report."""

        image_hash = self._hash_image(image_path)
        if check_existing:
            existing = self.store.find_existing_record(
                image_hash=image_hash,
                user_id=user_id,
                theme=theme,
            )
            if existing is not None:
                return existing

        record = await self.prepare_lite_record(
            image_path=image_path,
            user_id=user_id,
            theme=theme,
            image_url=image_url,
            image_storage_backend=image_storage_backend,
            image_storage_key=image_storage_key,
            image_local_expires_at=image_local_expires_at,
            painting_intention=painting_intention,
            painting_feeling=painting_feeling,
            three_circles=three_circles,
        )

        record.update_progress(GenerationStage.GENERATING.value, 70)
        lite_bundle = self.generation_runtime.generate_lite(self, record)
        record.layer_0_raw = lite_bundle.layer_0_raw
        record.layer_1_lite_draft = lite_bundle.layer_1_lite_draft
        record.layer_2_lite_final = lite_bundle.layer_2_lite_final

        if "lite" not in record.version_purchased:
            record.version_purchased.append("lite")

        record.status = GenerationStatus.COMPLETED
        record.update_progress(GenerationStage.COMPLETED.value, 100)
        self.store.save(record)
        return record

    def _hash_image(self, image_path: str) -> str:
        path = Path(image_path)
        if not path.exists():
            return f"missing:{path.name}"
        return sha256(path.read_bytes()).hexdigest()[:16]

    def _normalize_circle_payload(self, circle_payload: Dict[str, int]) -> Dict[str, int]:
        inner = int(circle_payload.get("inner_radius", 33))
        middle = int(circle_payload.get("middle_radius", 66))
        inner = max(10, min(inner, 90))
        middle = max(inner + 5, min(middle, 90))
        return {
            "inner_radius": inner,
            "middle_radius": middle,
        }

    def get_report(
        self,
        interpretation_id: str,
        version: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return the currently available report view for a migrated record."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        requested_version = version or self._resolve_best_available_version(record)

        if requested_version == "pro":
            report = record.get_pro_report()
            pro_draft = record.layer_3_pro_draft
            if report:
                return {
                    "version": "pro",
                    "title": PRO_REPORT_BLUEPRINT.structure_labels["report_title"],
                    "overall_impression": pro_draft.first_impression if pro_draft else None,
                    "structured": {
                        "prompt_preview": pro_draft.prompt_preview if pro_draft else "",
                        "prompt_schema_validation_issues": (
                            self._validate_pro_prompt_schema(pro_draft)
                            if pro_draft
                            else ["missing_layer_3_pro_draft"]
                        ),
                        "first_impression": pro_draft.first_impression if pro_draft else None,
                        "core_insight_table": pro_draft.core_insight_table if pro_draft else {},
                        "three_circles_detailed": pro_draft.three_circles_detailed if pro_draft else {},
                        "micro_analysis_detailed": pro_draft.micro_analysis_detailed if pro_draft else {},
                        "imbalance_confirmed": pro_draft.imbalance_confirmed if pro_draft else {},
                        "root_cause": pro_draft.root_cause if pro_draft else {},
                        "healing_suggestions": pro_draft.healing_suggestions if pro_draft else [],
                    },
                    "report": report,
                    "ai_qa_context": record.get_ai_qa_context(),
                    "can_upgrade": False,
                    "upgrade_price": None,
                }
            return {
                "version": "pro",
                "error": "pro report not generated yet",
                "can_upgrade": False,
                "upgrade_price": None,
            }

        if requested_version == "lite":
            lite_report = record.layer_2_lite_final
            report = record.get_lite_report()
            if report and lite_report:
                return {
                    "version": "lite",
                    "title": lite_report.title,
                    "overall_impression": lite_report.overall_impression,
                    "structured": {
                        "prompt_preview": (
                            record.layer_1_lite_draft.prompt_preview
                            if record.layer_1_lite_draft
                            else ""
                        ),
                        "prompt_schema_validation_issues": (
                            self._validate_lite_prompt_schema(record.layer_1_lite_draft)
                            if record.layer_1_lite_draft
                            else ["missing_layer_1_lite_draft"]
                        ),
                        "title": lite_report.title,
                        "overall_impression": lite_report.overall_impression,
                        "visual_elements_rendered": lite_report.visual_elements_rendered,
                        "emotion_portrait_rendered": lite_report.emotion_portrait_rendered,
                        "story": {
                            "base": lite_report.story.base.to_dict() if lite_report.story.base else None,
                            "contradiction": lite_report.story.contradiction.to_dict() if lite_report.story.contradiction else None,
                            "pattern": lite_report.story.pattern.to_dict() if lite_report.story.pattern else None,
                            "defense": lite_report.story.defense.to_dict() if lite_report.story.defense else None,
                            "block": lite_report.story.block.to_dict() if lite_report.story.block else None,
                            "light": lite_report.story.light.to_dict() if lite_report.story.light else None,
                        },
                        "theme_insights": lite_report.theme_insights.to_dict() if lite_report.theme_insights else None,
                        "three_awareness": [item.to_dict() for item in lite_report.three_awareness],
                        "six_insights_rendered": lite_report.six_insights_rendered,
                        "experiment_rendered": lite_report.experiment_rendered,
                        "pro_teaser": lite_report.pro_teaser,
                    },
                    "report": report,
                    "can_upgrade": record.can_upgrade_to_pro(),
                    "upgrade_price": (
                        self.get_upgrade_diff() if record.can_upgrade_to_pro() else None
                    ),
                }
            return {
                "version": "lite",
                "error": "lite report not generated yet",
                "can_upgrade": False,
                "upgrade_price": None,
            }

        return {
            "version": requested_version,
            "error": f"unsupported version: {requested_version}",
            "can_upgrade": False,
            "upgrade_price": None,
        }

    def _resolve_best_available_version(self, record: InterpretationRecord) -> str:
        if record.get_pro_report():
            return "pro"
        return "lite"

    def get_status(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a compact status snapshot for polling clients."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        return {
            "interpretation_id": record.interpretation_id,
            "status": record.status,
            "generation_stage": record.generation_stage,
            "generation_progress": record.generation_progress,
            "report_ready": record.layer_2_lite_final is not None,
            "version_purchased": record.version_purchased,
            "three_circles": record.three_circles or {},
            "auto_detected": record.three_circles_auto_detect is not None,
            "can_upgrade": record.can_upgrade_to_pro(),
        }

    def upgrade_to_pro(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Generate the migrated Pro placeholder report for an existing Lite record."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None

        if record.get_pro_report():
            return {
                "success": True,
                "interpretation_id": interpretation_id,
                "version": "pro",
                "enabled": True,
                "status": "completed",
                "message": PRO_REPORT_BLUEPRINT.status_messages["already_available"],
            }

        upgraded = self.store.upgrade_to_pro(
            interpretation_id,
            price_diff=self.get_upgrade_diff(),
        )
        if upgraded is None:
            return None

        upgraded.status = GenerationStatus.PROCESSING
        upgraded.update_progress(GenerationStage.GENERATING.value, 85)
        pro_bundle = self.generation_runtime.generate_pro(self, upgraded)
        upgraded.layer_3_pro_draft = pro_bundle.layer_3_pro_draft
        upgraded.layer_4_pro_final = pro_bundle.layer_4_pro_final
        upgraded.status = GenerationStatus.COMPLETED
        upgraded.update_progress(GenerationStage.COMPLETED.value, 100)
        self.store.save(upgraded)

        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": "completed",
            "message": PRO_REPORT_BLUEPRINT.status_messages["generated_success"],
        }

    def _build_lite_placeholder_report(self, record: InterpretationRecord) -> Layer2LiteFinal:
        layer1 = record.layer_1_lite_draft
        theme = record.theme or "general"
        circle_info = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        title = layer1.title if layer1 and layer1.title else self._build_lite_title(record, theme_label)
        overall_impression = (
            layer1.overall_impression
            if layer1 and layer1.overall_impression
            else self._build_lite_overall_impression(record, theme_label, circle_info)
        )
        visual_elements = (
            layer1.visual_elements
            if layer1 and layer1.visual_elements
            else self._build_lite_visual_elements(record, theme, circle_info)
        )
        emotion_portrait = (
            layer1.emotion_portrait
            if layer1 and layer1.emotion_portrait
            else self._build_lite_emotion_portrait(record, theme_label)
        )
        six_insights_rendered = self._render_lite_six_insights(layer1)
        experiment_rendered = self._render_lite_experiment_card(layer1)
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {title}",
                    "",
                    overall_impression,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_visual_elements"],
                    visual_elements,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_emotion_portrait"],
                    emotion_portrait,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_story"],
                    self._render_story_sections(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_theme_details"].format(theme_label=theme_label),
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_scene_label']}{layer1.theme_insights.scene if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_scene']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_impact_label']}{layer1.theme_insights.impact if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_impact']}",
                    "",
                    f"{LITE_REPORT_BLUEPRINT.structure_labels['theme_awareness_label']}{layer1.theme_insights.awareness if layer1 else LITE_REPORT_BLUEPRINT.narrative_templates['missing_theme_awareness']}",
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_six_insights"],
                    six_insights_rendered["base"],
                    "",
                    six_insights_rendered["contradiction"],
                    "",
                    six_insights_rendered["pattern"],
                    "",
                    six_insights_rendered["defense"],
                    "",
                    six_insights_rendered["block"],
                    "",
                    six_insights_rendered["light"],
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_three_awareness"],
                    LITE_REPORT_BLUEPRINT.structure_labels["section_awareness_invitation"],
                    self._render_awareness_lines(layer1),
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_experiment"],
                    experiment_rendered,
                    "",
                    LITE_REPORT_BLUEPRINT.structure_labels["section_pro_teaser"],
                    layer1.pro_teaser if layer1 and layer1.pro_teaser else DEFAULT_PRO_TEASER,
                ]
            ),
        )

        layer2 = Layer2LiteFinal(
            title=title,
            overall_impression=overall_impression,
            visual_elements_rendered=visual_elements,
            emotion_portrait_rendered=emotion_portrait,
            pro_teaser=(
                layer1.pro_teaser
                if layer1 and layer1.pro_teaser
                else DEFAULT_PRO_TEASER
            ),
            full_report_markdown=full_report_markdown,
            six_insights_rendered=six_insights_rendered,
            experiment_rendered=experiment_rendered,
        )
        if layer1:
            layer2.story = layer1.story
            layer2.theme_insights = layer1.theme_insights
            layer2.three_awareness = layer1.three_awareness

        return layer2

    def _build_layer0_placeholder(self, record: InterpretationRecord) -> Layer0Raw:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        layer = Layer0Raw()
        layer.imbalance_candidates = ["transition-overload"]
        layer.color_analysis = {
            "summary": LITE_REPORT_BLUEPRINT.structure_labels["layer0_color_summary"],
            "overall_saturation": 0.42,
            "black_ratio": 0.18,
            "red_ratio": 0.11,
        }
        layer.circle_colors = {
            "inner": {"focus": "self-protection"},
            "middle": {"focus": "relationship-adjustment"},
            "outer": {"focus": "external-expression"},
        }
        layer.three_circles.inner = {
            "radius_percent": circles["inner_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_inner_meaning"],
        }
        layer.three_circles.middle = {
            "radius_percent": circles["middle_radius"],
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_middle_meaning"],
        }
        layer.three_circles.outer = {
            "radius_percent": 100,
            "meaning": LITE_REPORT_BLUEPRINT.structure_labels["layer0_outer_meaning"],
        }
        layer.micro_analysis.adjacent = [
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_left"],
            LITE_REPORT_BLUEPRINT.structure_labels["layer0_adjacent_right"],
        ]
        layer.micro_analysis.wrap = [LITE_REPORT_BLUEPRINT.structure_labels["layer0_wrap"]]
        return layer

    def _build_layer1_placeholder(self, record: InterpretationRecord) -> Layer1LiteDraft:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(record.theme)
        lite_prompt_preview = self._build_lite_prompt_preview(record)
        layer = Layer1LiteDraft(
            title=self._build_lite_title(record, theme_label),
            overall_impression=self._build_lite_overall_impression(record, theme_label, circles),
            visual_elements=self._build_lite_visual_elements(record, record.theme or "general", circles),
            emotion_portrait=self._build_lite_emotion_portrait(record, theme_label),
            pro_teaser=DEFAULT_PRO_TEASER,
        )
        layer.story.base.content = LITE_REPORT_BLUEPRINT.story_content_templates["base"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.story.base.connector = LITE_REPORT_BLUEPRINT.story_connectors["base"]
        layer.story.contradiction.content = LITE_REPORT_BLUEPRINT.story_content_templates["contradiction"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.story.contradiction.connector = LITE_REPORT_BLUEPRINT.story_connectors["contradiction"]
        layer.story.pattern.content = LITE_REPORT_BLUEPRINT.story_content_templates["pattern"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.story.pattern.connector = LITE_REPORT_BLUEPRINT.story_connectors["pattern"]
        layer.story.defense.content = LITE_REPORT_BLUEPRINT.story_content_templates["defense"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.story.defense.connector = LITE_REPORT_BLUEPRINT.story_connectors["defense"]
        layer.story.block.content = LITE_REPORT_BLUEPRINT.story_content_templates["block"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.story.block.connector = LITE_REPORT_BLUEPRINT.story_connectors["block"]
        layer.story.light.content = LITE_REPORT_BLUEPRINT.story_content_templates["light"].format(
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.theme_insights.scene = render_lite_template_text(
            LITE_REPORT_BLUEPRINT.theme_insight_templates["scene"],
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.theme_insights.impact = render_lite_template_text(
            LITE_REPORT_BLUEPRINT.theme_insight_templates["impact"],
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.theme_insights.awareness = render_lite_template_text(
            LITE_REPORT_BLUEPRINT.theme_insight_templates["awareness"],
            theme_label=theme_label,
            feeling_hint=self._build_feeling_hint(record),
        )
        layer.three_awareness = [
            DailyAwareness(
                day=1,
                title=LITE_REPORT_BLUEPRINT.awareness_titles[0],
                content=render_lite_template_text(
                    LITE_REPORT_BLUEPRINT.awareness_content_templates[0],
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
            ),
            DailyAwareness(
                day=2,
                title=LITE_REPORT_BLUEPRINT.awareness_titles[1],
                content=render_lite_template_text(
                    LITE_REPORT_BLUEPRINT.awareness_content_templates[1],
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
            ),
            DailyAwareness(
                day=3,
                title=LITE_REPORT_BLUEPRINT.awareness_titles[2],
                content=render_lite_template_text(
                    LITE_REPORT_BLUEPRINT.awareness_content_templates[2],
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
            ),
        ]
        for key, template in LITE_REPORT_BLUEPRINT.six_insight_layer1_templates.items():
            getattr(layer.six_insights, key).update(
                {
                    "title": template.get("title", key),
                    "content": render_lite_template_text(
                        template.get("content", ""),
                        theme_label=theme_label,
                        feeling_hint=self._build_feeling_hint(record),
                    ),
                    "summary": render_lite_template_text(
                        template.get("summary", ""),
                        theme_label=theme_label,
                        feeling_hint=self._build_feeling_hint(record),
                    ),
                }
            )
        layer.experiment = {
            "title": LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"],
            "content": build_lite_experiment_content(
                theme_label=theme_label,
                title=layer.title,
            ),
        }
        layer.prompt_preview = lite_prompt_preview
        return layer

    def _build_pro_placeholder_draft(self, record: InterpretationRecord) -> Layer3ProDraft:
        theme = record.theme or "general"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_label = self._get_theme_label(theme)
        pro_prompt_preview = self._build_pro_prompt_preview(record)
        imbalance_profile = self._build_pro_imbalance_profile(record, theme_label, circles)
        lite_title = (
            record.layer_2_lite_final.title
            if record.layer_2_lite_final and record.layer_2_lite_final.title
            else self._build_lite_title(record, theme_label)
        )
        layer = Layer3ProDraft(
            first_impression=self._build_pro_first_impression(record, theme_label, lite_title),
            core_insight_table={
                "能量本质": self._build_pro_energy_essence(theme_label, circles),
                "核心失衡": imbalance_profile["summary"],
                "关键卡点": self._build_pro_block_point(record, imbalance_profile),
                "转化方向": PRO_REPORT_BLUEPRINT.narrative_templates["core_direction"].format(theme_label=theme_label),
                "疗愈核心": PRO_REPORT_BLUEPRINT.narrative_templates["core_healing"],
            },
            three_circles_detailed={
                "inner": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_inner"],
                    "reading": PRO_REPORT_BLUEPRINT.narrative_templates["circle_inner_reading"].format(
                        inner=circles["inner_radius"]
                    ),
                },
                "middle": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_middle"],
                    "reading": PRO_REPORT_BLUEPRINT.narrative_templates["circle_middle_reading"].format(
                        middle=circles["middle_radius"]
                    ),
                },
                "outer": {
                    "label": PRO_REPORT_BLUEPRINT.structure_labels["circle_outer"],
                    "reading": PRO_REPORT_BLUEPRINT.narrative_templates["circle_outer_reading"],
                },
            },
            micro_analysis_detailed={
                PRO_REPORT_BLUEPRINT.structure_labels["micro_rhythm"]: PRO_REPORT_BLUEPRINT.narrative_templates["micro_rhythm"],
                PRO_REPORT_BLUEPRINT.structure_labels["micro_relationship"]: PRO_REPORT_BLUEPRINT.narrative_templates["micro_relationship"],
                PRO_REPORT_BLUEPRINT.structure_labels["micro_action"]: PRO_REPORT_BLUEPRINT.narrative_templates["micro_action"],
            },
            imbalance_confirmed=imbalance_profile,
            root_cause={
                "surface": self._build_surface_root_cause(record),
                "deeper": PRO_REPORT_BLUEPRINT.narrative_templates["root_deeper"],
                "core": PRO_REPORT_BLUEPRINT.narrative_templates["root_core"],
            },
            healing_suggestions=self._build_pro_healing_suggestions(
                record,
                imbalance_profile=imbalance_profile,
                theme_label=theme_label,
            ),
        )
        layer.prompt_preview = pro_prompt_preview
        return layer

    def _build_pro_placeholder_report(self, record: InterpretationRecord) -> Layer4ProFinal:
        lite_report = record.layer_2_lite_final
        pro_draft = record.layer_3_pro_draft
        full_report_markdown = self._wrap_report_with_safety(
            record,
            "\n".join(
                [
                    f"# {PRO_REPORT_TITLE}",
                    "",
                    PRO_REPORT_INTRO,
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['first_impression']}",
                    pro_draft.first_impression if pro_draft else PRO_REPORT_BLUEPRINT.fallback_texts["missing_pro_increment"],
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['core_table']}",
                    self._render_pro_core_table(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['lite_base']}",
                    self._strip_safety_wrappers(lite_report.full_report_markdown) if lite_report else PRO_REPORT_BLUEPRINT.fallback_texts["missing_lite_base"],
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['circles']}",
                    self._render_pro_circle_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['micro']}",
                    self._render_pro_micro_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['imbalance']}",
                    self._render_pro_imbalance_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['root_cause']}",
                    self._render_pro_root_sections(pro_draft),
                    "",
                    f"## {PRO_REPORT_BLUEPRINT.section_titles['healing']}",
                    self._render_pro_healing_sections(pro_draft),
                ]
            ),
        )
        ai_qa_context = "\n".join(
            [
                f"theme={record.theme}",
                f"interpretation_id={record.interpretation_id}",
                f"lite_ready={record.layer_2_lite_final is not None}",
                "pro_placeholder=true",
            ]
        )

        return Layer4ProFinal(
            full_report_markdown=full_report_markdown,
            ai_qa_context=ai_qa_context,
        )

    def _get_theme_label(self, theme: Optional[str]) -> str:
        return LITE_REPORT_BLUEPRINT.theme_labels.get(theme or "general", theme or "整体")

    def _build_lite_title(self, record: InterpretationRecord, theme_label: str) -> str:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        inner = circles["inner_radius"]
        middle = circles["middle_radius"]
        if inner >= 42:
            return LITE_REPORT_BLUEPRINT.title_templates["inner_high"].format(theme_label=theme_label)
        if middle >= 74:
            return LITE_REPORT_BLUEPRINT.title_templates["middle_high"].format(theme_label=theme_label)
        if theme_label == "情绪":
            return LITE_REPORT_BLUEPRINT.title_templates["emotion"]
        if theme_label == "关系":
            return LITE_REPORT_BLUEPRINT.title_templates["relationship"]
        if theme_label == "事业":
            return LITE_REPORT_BLUEPRINT.title_templates["career"]
        return LITE_REPORT_BLUEPRINT.title_templates["default"]

    def _build_lite_overall_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circle_info: Dict[str, int],
    ) -> str:
        inner = circle_info["inner_radius"]
        middle = circle_info["middle_radius"]
        return (
            LITE_REPORT_BLUEPRINT.narrative_templates["overall_impression"].format(
                theme_label=theme_label,
                inner=inner,
                middle=middle,
            )
        )

    def _build_lite_visual_elements(
        self,
        record: InterpretationRecord,
        theme: str,
        circle_info: Dict[str, int],
    ) -> str:
        circle_pattern = self._describe_circle_pattern(circle_info)
        context_hint = self._build_user_context_hint(record)
        return (
            LITE_REPORT_BLUEPRINT.narrative_templates["visual_elements"].format(
                theme=theme,
                inner=circle_info["inner_radius"],
                middle=circle_info["middle_radius"],
                circle_pattern=circle_pattern,
                context_hint=context_hint,
            )
        ).strip()

    def _build_lite_emotion_portrait(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> str:
        feeling_hint = self._build_feeling_hint(record)
        return (
            LITE_REPORT_BLUEPRINT.narrative_templates["emotion_portrait"].format(
                theme_label=theme_label,
                feeling_hint=feeling_hint,
            )
        )

    def _build_pro_first_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        lite_title: str,
    ) -> str:
        context_hint = self._build_user_context_hint(record)
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        return (
            PRO_REPORT_BLUEPRINT.narrative_templates["first_impression"].format(
                lite_title=lite_title,
                lite_contradiction=lite_contradiction[:56] if lite_contradiction else "",
                context_hint=context_hint,
            )
        )

    def _build_pro_energy_essence(
        self,
        theme_label: str,
        circles: Dict[str, int],
    ) -> str:
        return (
            PRO_REPORT_BLUEPRINT.narrative_templates["energy_essence"].format(
                theme_label=theme_label,
                inner=circles["inner_radius"],
                middle=circles["middle_radius"],
            )
        )

    def _build_pro_block_point(
        self,
        record: InterpretationRecord,
        imbalance_profile: Optional[Dict[str, str]] = None,
    ) -> str:
        lite_block = (
            record.layer_1_lite_draft.story.block.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.block.content
            else ""
        )
        primary = imbalance_profile.get("primary", "") if imbalance_profile else ""
        return (
            PRO_REPORT_BLUEPRINT.narrative_templates["block_point"].format(
                lite_block=f"{lite_block[:70]} " if lite_block else "",
                primary=primary,
                feeling_hint=self._build_feeling_hint(record),
            )
        )

    def _render_lite_six_insights(
        self,
        layer1: Optional[Layer1LiteDraft],
    ) -> Dict[str, str]:
        rendered: Dict[str, str] = {}
        for key, value in LITE_REPORT_BLUEPRINT.six_insight_defaults.items():
            source = getattr(layer1.six_insights, key, {}) if layer1 else {}
            title = source.get("title") or value.get("title", key)
            content = source.get("content") or source.get("summary") or value.get("content", "")
            rendered[key] = f"【{title}】\n\n{content}"
        return rendered

    def _render_lite_experiment_card(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return (
                f"【{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('title', LITE_REPORT_BLUEPRINT.structure_labels['fallback_experiment_title'])}】\n\n"
                f"{LITE_REPORT_BLUEPRINT.fallback_experiment_card.get('content', '')}"
            ).strip()

        title = layer1.experiment.get("title", LITE_REPORT_BLUEPRINT.structure_labels["fallback_experiment_title"])
        content = layer1.experiment.get("content", "")
        return f"【{title}】\n\n{content}".strip()

    def _render_pro_core_table(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.core_insight_table:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_core_table"]

        rows = [
            *[
                (
                    label,
                    pro_draft.core_insight_table.get(key, "")
                    or pro_draft.core_insight_table.get(
                        {
                            "核心失衡": "当前失衡",
                            "关键卡点": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_block"],
                            "转化方向": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_direction"],
                            "核心失衡": PRO_REPORT_BLUEPRINT.structure_labels["core_table_fallback_summary"],
                        }.get(key, key),
                        "",
                    ),
                )
                for key, label in PRO_REPORT_BLUEPRINT.core_table_labels
            ],
        ]
        body = "\n".join(f"| {label} | {content} |" for label, content in rows if content)
        return "\n".join(
            [
                f"| {PRO_REPORT_BLUEPRINT.structure_labels['core_table_dimension']} | {PRO_REPORT_BLUEPRINT.structure_labels['core_table_content']} |",
                "| --- | --- |",
                body,
            ]
        ).strip()

    def _render_pro_circle_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.three_circles_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_circle_sections"]

        sections: list[str] = []
        order = ["inner", "middle", "outer"]
        for key in order:
            item = pro_draft.three_circles_detailed.get(key)
            if not item:
                continue
            label = item.get("label", key)
            reading = item.get("reading", "")
            if reading:
                sections.extend([f"**{label}**", "", reading, ""])
        return "\n".join(sections).strip()

    def _render_pro_micro_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.micro_analysis_detailed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_micro_sections"]

        sections: list[str] = []
        for label, content in pro_draft.micro_analysis_detailed.items():
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_root_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.root_cause:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_root_sections"]

        sections: list[str] = []
        for key in ["surface", "deeper", "core"]:
            content = pro_draft.root_cause.get(key, "")
            if not content:
                continue
            sections.extend([f"**{PRO_REPORT_BLUEPRINT.root_cause_labels.get(key, key)}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_imbalance_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.imbalance_confirmed:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_imbalance_sections"]

        sections: list[str] = []
        for key, label in PRO_REPORT_BLUEPRINT.imbalance_labels.items():
            content = pro_draft.imbalance_confirmed.get(key, "")
            if not content:
                continue
            sections.extend([f"**{label}**", "", content, ""])
        return "\n".join(sections).strip()

    def _render_pro_healing_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        if not pro_draft or not pro_draft.healing_suggestions:
            return PRO_REPORT_BLUEPRINT.fallback_texts["missing_healing_sections"]

        sections: list[str] = []
        for item in pro_draft.healing_suggestions:
            phase = item.get("phase", PRO_REPORT_BLUEPRINT.narrative_templates["healing_phase_fallback"])
            focus = item.get("focus", "")
            practice = item.get("practice", "")
            if not focus and not practice:
                continue
            sections.extend([f"**{phase}**", focus or PRO_REPORT_BLUEPRINT.narrative_templates["healing_focus_fallback"]])
            if practice:
                sections.extend([f"{PRO_REPORT_BLUEPRINT.structure_labels['healing_action_prefix']}{practice}", ""])
            else:
                sections.append("")
        return "\n".join(sections).strip()

    def _strip_safety_wrappers(self, content: str) -> str:
        cleaned = content
        protocol = SafetyProtocol()
        for disclaimer_type in ["basic", "with_crisis_hotline", "high_risk"]:
            disclaimer = protocol.get_disclaimer(disclaimer_type).strip()
            cleaned = cleaned.replace(disclaimer, "").strip()
        return cleaned

    def _build_user_context_hint(self, record: InterpretationRecord) -> str:
        intention = (record.painting_intention or "").strip()
        feeling = (record.painting_feeling or "").strip()
        parts: list[str] = []
        if intention:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates["user_context_from_intention"].format(
                    intention=intention,
                )
            )
        if feeling:
            parts.append(
                LITE_REPORT_BLUEPRINT.narrative_templates["user_context_from_feeling"].format(
                    feeling=feeling,
                )
            )
        return " ".join(parts)

    def _build_lite_prompt_preview(self, record: InterpretationRecord) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
        }
        return self.prompt_builder.build_lite(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self._build_theme_prompt_context(record),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def _build_theme_prompt_context(self, record: InterpretationRecord) -> str:
        theme_label = self._get_theme_label(record.theme)
        intention = (record.painting_intention or "").strip() or "未填写"
        feeling = (record.painting_feeling or "").strip() or "未填写"
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        return "\n".join(
            [
                f"- 当前主题：{theme_label}",
                f"- 创作前意图：{intention}",
                f"- 创作时感受：{feeling}",
                f"- 内圈半径：{circles.get('inner_radius', 33)}%",
                f"- 中圈半径：{circles.get('middle_radius', 66)}%",
            ]
        )

    def _build_pro_prompt_preview(self, record: InterpretationRecord) -> str:
        vision_payload = {
            "theme": record.theme,
            "painting_intention": record.painting_intention,
            "painting_feeling": record.painting_feeling,
            "three_circles": record.three_circles or {},
            "layer_0_raw": record.layer_0_raw.to_dict() if record.layer_0_raw else None,
            "layer_1_lite_draft": record.layer_1_lite_draft.to_dict() if record.layer_1_lite_draft else None,
        }
        return self.prompt_builder.build_pro(
            vision_data=json.dumps(vision_payload, ensure_ascii=False, indent=2),
            theme=record.theme or "general",
            theme_context=self._build_theme_prompt_context(record),
            extra_context={
                "theme_label": self._get_theme_label(record.theme),
            },
        )

    def _validate_lite_prompt_schema(self, layer: Layer1LiteDraft) -> list[str]:
        schema = self.prompt_builder.get_template("1.6", "lite").load_schema()
        required_fields = self._extract_required_prompt_fields(schema)
        values: Dict[str, Any] = {
            "title": layer.title,
            "overall_impression": layer.overall_impression,
            "visual_elements": layer.visual_elements,
            "emotion_portrait": layer.emotion_portrait,
            "story": {
                "base": layer.story.base.content if layer.story else "",
                "contradiction": layer.story.contradiction.content if layer.story else "",
                "pattern": layer.story.pattern.content if layer.story else "",
                "defense": layer.story.defense.content if layer.story else "",
                "block": layer.story.block.content if layer.story else "",
                "light": layer.story.light.content if layer.story else "",
            },
            "theme_scene": layer.theme_insights.scene if layer.theme_insights else "",
            "theme_impact": layer.theme_insights.impact if layer.theme_insights else "",
            "theme_awareness": layer.theme_insights.awareness if layer.theme_insights else "",
            "three_awareness": layer.three_awareness,
            "pro_teaser": layer.pro_teaser,
        }
        return self._collect_missing_required_fields(values, required_fields)

    def _validate_pro_prompt_schema(self, layer: Layer3ProDraft) -> list[str]:
        schema = self.prompt_builder.get_template("1.6", "pro").load_schema()
        required_fields = self._extract_required_prompt_fields(schema)
        values: Dict[str, Any] = {
            "first_impression": layer.first_impression,
            "core_insight_table": layer.core_insight_table,
            "three_circles_detailed": layer.three_circles_detailed,
            "micro_analysis_detailed": layer.micro_analysis_detailed,
            "imbalance_confirmed": layer.imbalance_confirmed,
            "root_cause": layer.root_cause,
            "healing_suggestions": layer.healing_suggestions,
        }
        return self._collect_missing_required_fields(values, required_fields)

    def _extract_required_prompt_fields(self, schema: Dict[str, Any]) -> list[str]:
        fields = schema.get("fields", []) if isinstance(schema, dict) else []
        required: list[str] = []
        for field in fields:
            if not isinstance(field, dict):
                continue
            if not field.get("required"):
                continue
            name = field.get("name")
            if isinstance(name, str) and name:
                required.append(name)
        return required

    def _collect_missing_required_fields(
        self,
        values: Dict[str, Any],
        required_fields: list[str],
    ) -> list[str]:
        missing: list[str] = []
        for field_name in required_fields:
            value = values.get(field_name)
            if self._is_missing_prompt_field(value):
                missing.append(field_name)
        return missing

    def _is_missing_prompt_field(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str):
            return not value.strip()
        if isinstance(value, (list, tuple, set, dict)):
            return len(value) == 0
        return False

    def _build_feeling_hint(self, record: InterpretationRecord) -> str:
        feeling = (record.painting_feeling or "").strip()
        if not feeling:
            return LITE_REPORT_BLUEPRINT.narrative_templates["feeling_hint_default"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["feeling_hint_from_feeling"].format(
            feeling=feeling,
        )

    def _build_surface_root_cause(self, record: InterpretationRecord) -> str:
        intention = (record.painting_intention or "").strip()
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
            else ""
        )
        if not intention:
            return (
                PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_without_intention"].format(
                    lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else ""
                )
            )
        return (
            PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_with_intention"].format(
                lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else "",
                intention=intention,
            )
        )

    def _build_pro_imbalance_profile(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
    ) -> Dict[str, str]:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        profile_key = self._select_pro_imbalance_type(
            record=record,
            inner=inner,
            middle=middle,
        )

        template = PRO_REPORT_BLUEPRINT.imbalance_profiles.get(
            profile_key,
            PRO_REPORT_BLUEPRINT.imbalance_profiles.get("energy-block", {}),
        )
        return {
            "type": profile_key,
            "primary": template.get("primary", "能量受阻型失衡"),
            "summary": render_template_text(
                template.get("summary", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
            "evidence": render_template_text(
                template.get("evidence", ""),
                inner=str(inner),
                middle=str(middle),
                theme_label=theme_label,
            ),
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

    def _select_pro_imbalance_type(
        self,
        *,
        record: InterpretationRecord,
        inner: int,
        middle: int,
    ) -> str:
        for rule in PRO_REPORT_BLUEPRINT.imbalance_selection_rules:
            if rule.inner_gte is not None and inner < rule.inner_gte:
                continue
            if rule.middle_gte is not None and middle < rule.middle_gte:
                continue
            if rule.theme_in and (record.theme or "general") not in set(rule.theme_in):
                continue
            return rule.type

        return "energy-block"

    def _build_pro_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        imbalance_profile: Dict[str, str],
        theme_label: str,
    ) -> list[Dict[str, str]]:
        primary = imbalance_profile.get("primary", "能量受阻型失衡")
        type_code = imbalance_profile.get("type", "energy-block")
        templates = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get(type_code) or PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get("energy-block", [])
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
        common_tail_template = PRO_REPORT_BLUEPRINT.healing_suggestion_templates.get("common_tail", {})
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

    def _describe_circle_pattern(self, circles: Dict[str, int]) -> str:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        if inner >= 40:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_inner_high"]
        if middle >= 72:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_middle_high"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_default"]

    def _render_story_sections(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_story_sections"]

        return "\n".join(
            sum(
                [
                    [heading, getattr(layer1.story, key).content, ""]
                    for key, heading in LITE_REPORT_BLUEPRINT.story_section_headings
                ],
                [],
            )[:-1]
        )

    def _render_awareness_lines(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.three_awareness:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_awareness_lines"]

        return "\n".join(
            f"### 第 {item.day} 天：{item.title}\n{item.content}"
            for item in layer1.three_awareness
        )

    def _render_experiment_text(self, layer1: Optional[Layer1LiteDraft]) -> str:
        if not layer1 or not layer1.experiment:
            return LITE_REPORT_BLUEPRINT.narrative_templates["missing_experiment_text"]

        return f"{layer1.experiment.get('title', '一个小实验')}：{layer1.experiment.get('content', '')}"

    def _wrap_report_with_safety(self, record: InterpretationRecord, content: str) -> str:
        safety = quick_safety_check(
            imbalance_type=(
                record.layer_0_raw.imbalance_candidates[0]
                if record.layer_0_raw and record.layer_0_raw.imbalance_candidates
                else None
            ),
            color_analysis=record.layer_0_raw.color_analysis if record.layer_0_raw else None,
            text_content=" ".join(
                part
                for part in [
                    record.painting_intention or "",
                    record.painting_feeling or "",
                    content,
                ]
                if part
            ),
        )
        return SafetyProtocol().wrap_output(content, safety.risk_level, context="toc")
