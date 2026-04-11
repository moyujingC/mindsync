"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.analysis.circle_detector import CircleDetectionResult, CircleDetector
try:
    from app.core.analysis.three_circle_colors import extract_colors_by_circles
except Exception:  # pragma: no cover - migration-time fallback
    extract_colors_by_circles = None

try:
    from app.core.knowledge import (
        KnowledgeQueryEngine,
    )
    from app.core.knowledge_runtime.runtime import get_knowledge_runtime
    from app.core.knowledge.three_circles import analyze_energy_flow
except Exception:  # pragma: no cover - migration-time fallback
    KnowledgeQueryEngine = None
    get_knowledge_runtime = None

    def analyze_energy_flow(inner_elements: list, middle_elements: list, outer_elements: list) -> Dict[str, Any]:
        return {}

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
    build_lite_experiment_content,
    render_lite_template_text,
    render_template_text,
)
from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_draft_assembler import ReportDraftAssembler
from .report_placeholder_assembler import ReportPlaceholderAssembler
from .report_prompt_preview import ReportPromptPreviewBuilder
from .report_section_renderer import ReportSectionRenderer
from .store import InterpretationStore, UnsupportedInterpretationSchemaError

ELEMENT_KEY_TO_CN = {
    "wood": "木",
    "fire": "火",
    "earth": "土",
    "metal": "金",
    "water": "水",
}

_UNSET = object()

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
        knowledge_engine: Any = _UNSET,
        store: Optional[InterpretationStore] = None,
        circle_detector: Optional[CircleDetector] = None,
        generation_runtime: Optional[ReportGenerationRuntime] = None,
        prompt_runtime: Optional[PromptRuntime] = None,
        report_chat_runtime: Optional[Any] = None,
        enable_vision: bool = True,
    ) -> None:
        self._knowledge_engine_explicit = knowledge_engine is not _UNSET
        self._knowledge_engine = (
            knowledge_engine if knowledge_engine is not _UNSET else None
        )
        self.store = store or InterpretationStore()
        self.circle_detector = circle_detector or CircleDetector()
        self.knowledge_runtime = (
            get_knowledge_runtime() if get_knowledge_runtime is not None else None
        )
        self._theme_summary_cache: Dict[str, Dict[str, Any]] = {}
        self._theme_element_profile_cache: Dict[tuple[str, str], Dict[str, Any]] = {}
        self._imbalance_projection_cache: Dict[
            tuple[str, str, str],
            Dict[str, Any],
        ] = {}
        self.layer0_assembler = (
            self.knowledge_runtime.layer0_assembler if self.knowledge_runtime else None
        )
        self.narrative_service = (
            self.knowledge_runtime.narrative_service if self.knowledge_runtime else None
        )
        if generation_runtime is not None:
            self.generation_runtime = generation_runtime
        elif prompt_runtime is not None:
            self.generation_runtime = PromptBackedReportGenerationRuntime(
                prompt_runtime=prompt_runtime,
            )
        else:
            self.generation_runtime = DeterministicReportGenerationRuntime()
        self.report_chat_runtime = report_chat_runtime
        self.enable_vision = enable_vision
        self.prompt_builder = PromptBuilder()
        self.report_contracts = ReportContractAssembler(self.prompt_builder)
        self.report_prompt_preview_builder = ReportPromptPreviewBuilder(
            prompt_builder=self.prompt_builder,
            get_narrative_service=lambda: self.narrative_service,
            get_theme_label=self._get_theme_label,
            get_record_theme=self._get_record_theme,
            get_layer0_view=self._get_layer0_view,
            get_layer0_element_distribution=self._get_layer0_element_distribution,
            get_primary_knowledge_signal=self._get_primary_knowledge_signal,
            get_signal_label=self._get_signal_label,
            get_knowledge_theme_summary=self.get_knowledge_theme_summary,
        )
        self.report_debug_builder = ReportDebugProfileBuilder(
            prompt_builder=self.prompt_builder,
            validator=self.report_contracts.validator,
        )
        self.report_section_renderer = ReportSectionRenderer()
        self.report_draft_assembler = ReportDraftAssembler(
            get_theme_label=self._get_theme_label,
            build_lite_prompt_preview=self._build_lite_prompt_preview,
            build_runtime_lite_narrative_projection=self._build_runtime_lite_narrative_projection,
            build_lite_story_sections=self._build_lite_story_sections,
            build_lite_theme_insights=self._build_lite_theme_insights,
            build_lite_title=self._build_lite_title,
            build_lite_overall_impression=self._build_lite_overall_impression,
            build_lite_visual_elements=self._build_lite_visual_elements,
            build_lite_emotion_portrait=self._build_lite_emotion_portrait,
            build_lite_pro_teaser=self._build_lite_pro_teaser,
            build_lite_three_awareness=self._build_lite_three_awareness,
            build_lite_six_insights_payload=self._build_lite_six_insights_payload,
            build_lite_experiment_payload=self._build_lite_experiment_payload,
            build_pro_prompt_preview=self._build_pro_prompt_preview,
            get_runtime_imbalance_projection=self._get_runtime_imbalance_projection,
            build_pro_imbalance_profile=self._build_pro_imbalance_profile,
            build_runtime_pro_narrative_projection=self._build_runtime_pro_narrative_projection,
            build_pro_first_impression=self._build_pro_first_impression,
            build_pro_energy_essence=self._build_pro_energy_essence,
            build_pro_block_point=self._build_pro_block_point,
            build_pro_direction=self._build_pro_direction,
            build_pro_healing_core=self._build_pro_healing_core,
            build_pro_circle_reading=self._build_pro_circle_reading,
            build_pro_micro_sections_from_knowledge=self._build_pro_micro_sections_from_knowledge,
            build_surface_root_cause=self._build_surface_root_cause,
            build_deeper_root_cause=self._build_deeper_root_cause,
            build_core_root_cause=self._build_core_root_cause,
            build_pro_healing_suggestions=self._build_pro_healing_suggestions,
        )
        self.report_placeholder_assembler = ReportPlaceholderAssembler(
            section_renderer=self.report_section_renderer,
            get_narrative_service=lambda: self.narrative_service,
            get_theme_label=self._get_theme_label,
            build_lite_title=self._build_lite_title,
            build_lite_overall_impression=self._build_lite_overall_impression,
            build_lite_visual_elements=self._build_lite_visual_elements,
            build_lite_emotion_portrait=self._build_lite_emotion_portrait,
            wrap_report_with_safety=self._wrap_report_with_safety,
            strip_safety_wrappers=self._strip_safety_wrappers,
        )

    @property
    def knowledge_engine(self) -> Optional[Any]:
        if (
            self._knowledge_engine is None
            and not self._knowledge_engine_explicit
            and KnowledgeQueryEngine is not None
        ):
            self._knowledge_engine = KnowledgeQueryEngine(version="toc")
        return self._knowledge_engine

    @knowledge_engine.setter
    def knowledge_engine(self, value: Optional[Any]) -> None:
        self._knowledge_engine = value
        self._knowledge_engine_explicit = True

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
        return self.report_contracts.build_report_payload(
            record=record,
            requested_version=requested_version,
            upgrade_diff=self.get_upgrade_diff(),
        )

    def answer_report_chat(
        self,
        interpretation_id: str,
        *,
        message: str,
        history: Optional[list[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate a follow-up reply grounded in the existing report."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None
        if self.report_chat_runtime is None:
            raise ValueError("report chat runtime is not configured")

        report_markdown = record.get_pro_report() or record.get_lite_report()
        if not report_markdown:
            raise ValueError("report is not ready")

        reply = self.report_chat_runtime.reply(
            report_markdown=report_markdown,
            ai_qa_context=record.get_ai_qa_context(),
            theme=record.theme,
            painting_intention=record.painting_intention,
            painting_feeling=record.painting_feeling,
            message=message,
            history=history,
        )
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("report chat runtime returned empty reply")

        return {
            "interpretation_id": interpretation_id,
            "reply": reply.strip(),
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

    def get_report_debug_profile(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a development-only profile of how the current report was produced."""

        record = self.store.load(interpretation_id)
        if record is None:
            return None
        knowledge_signal = self._get_primary_knowledge_signal(record)
        return self.report_debug_builder.build(
            record=record,
            theme_label=self._get_theme_label(record.theme),
            signal_label=(
                self._get_signal_label(knowledge_signal)
                if knowledge_signal
                else None
            ),
            theme_summary=self.get_knowledge_theme_summary(record.theme),
        )

    def upgrade_to_pro(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Generate the migrated Pro placeholder report for an existing Lite record."""

        started = self.start_pro_upgrade(interpretation_id)
        if started is None:
            return None
        if started["status"] == "completed":
            return started
        return self.complete_pro_upgrade(interpretation_id)

    def start_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Mark a Pro upgrade as started so the client can begin polling immediately."""

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

        if "pro" in record.version_purchased:
            upgraded = record
        else:
            upgraded = self.store.upgrade_to_pro(
                interpretation_id,
                price_diff=self.get_upgrade_diff(),
            )
            if upgraded is None:
                return None

        upgraded.status = GenerationStatus.PROCESSING
        upgraded.update_progress(GenerationStage.GENERATING.value, 85)
        self.store.save(upgraded)

        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": "processing",
            "message": "一梳 Pro 版正在生成中，请稍候查看。",
        }

    def complete_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Finish a previously started Pro upgrade."""

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

        if "pro" not in record.version_purchased:
            started = self.start_pro_upgrade(interpretation_id)
            if started is None:
                return None
            record = self.store.load(interpretation_id)
            if record is None:
                return None

        record.status = GenerationStatus.PROCESSING
        record.update_progress(GenerationStage.GENERATING.value, 85)
        self.store.save(record)
        pro_bundle = self.generation_runtime.generate_pro(self, record)
        record.layer_3_pro_draft = pro_bundle.layer_3_pro_draft
        record.layer_4_pro_final = pro_bundle.layer_4_pro_final
        record.status = GenerationStatus.COMPLETED
        record.update_progress(GenerationStage.COMPLETED.value, 100)
        self.store.save(record)

        return {
            "success": True,
            "interpretation_id": interpretation_id,
            "version": "pro",
            "enabled": True,
            "status": "completed",
            "message": PRO_REPORT_BLUEPRINT.status_messages["generated_success"],
        }

    def _build_lite_placeholder_report(self, record: InterpretationRecord) -> Layer2LiteFinal:
        return self.report_placeholder_assembler.build_lite(record)

    def _build_layer0_placeholder(self, record: InterpretationRecord) -> Layer0Raw:
        if self.layer0_assembler is not None:
            layer = self.layer0_assembler.build_from_record(
                record,
                extract_colors_by_circles=extract_colors_by_circles,
                analyze_energy_flow=analyze_energy_flow,
            )
            if layer is not None:
                return layer
            return self.layer0_assembler.build_fallback(record)

        return self._build_layer0_fallback(record)

    def _build_layer0_fallback(self, record: InterpretationRecord) -> Layer0Raw:
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
        return self.report_draft_assembler.build_lite(record)

    def _build_pro_placeholder_draft(self, record: InterpretationRecord) -> Layer3ProDraft:
        return self.report_draft_assembler.build_pro(record)

    def _build_runtime_pro_narrative_projection(
        self,
        record: InterpretationRecord,
        *,
        theme_label: str,
        lite_title: str,
        imbalance_profile: Dict[str, str],
        imbalance_projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if self.narrative_service is None:
            return {}

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else dominant
        weakest = distribution[-1] if distribution else {"name": "水", "percentage": 0.0}
        lite_contradiction = (
            record.layer_1_lite_draft.story.contradiction.content
            if record.layer_1_lite_draft and record.layer_1_lite_draft.story.contradiction.content
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
            projection = self.narrative_service.build_pro_narrative_projection(
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
                    "inner": PRO_REPORT_BLUEPRINT.narrative_templates["circle_inner_reading"].format(
                        inner=(record.three_circles or {}).get("inner_radius", 33)
                    ),
                    "middle": PRO_REPORT_BLUEPRINT.narrative_templates["circle_middle_reading"].format(
                        middle=(record.three_circles or {}).get("middle_radius", 66)
                    ),
                    "outer": PRO_REPORT_BLUEPRINT.narrative_templates["circle_outer_reading"],
                },
                imbalance_projection=imbalance_projection,
            )
        except Exception:
            return {}

        return projection if isinstance(projection, dict) else {}

    def _build_pro_placeholder_report(self, record: InterpretationRecord) -> Layer4ProFinal:
        return self.report_placeholder_assembler.build_pro(record)

    def _get_theme_label(self, theme: Optional[str]) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "get_theme_label",
        ):
            try:
                runtime_label = self.narrative_service.get_theme_label(
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
        return LITE_REPORT_BLUEPRINT.theme_labels.get(theme or "general", theme or "整体")

    def _build_lite_title(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_title = self._get_projection_text(runtime_projection, "title")
        if isinstance(runtime_title, str) and runtime_title.strip():
            return runtime_title.strip()

        return self._build_lite_title_fallback(record, theme_label)

    def _build_lite_title_fallback(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> str:
        circles = record.three_circles or {"inner_radius": 33, "middle_radius": 66}
        theme_key = self._get_record_theme(record)
        inner = circles["inner_radius"]
        middle = circles["middle_radius"]
        if inner >= 42:
            return LITE_REPORT_BLUEPRINT.title_templates["inner_high"].format(theme_label=theme_label)
        if middle >= 74:
            return LITE_REPORT_BLUEPRINT.title_templates["middle_high"].format(theme_label=theme_label)
        if theme_key in LITE_REPORT_BLUEPRINT.title_templates:
            return LITE_REPORT_BLUEPRINT.title_templates[theme_key]
        return LITE_REPORT_BLUEPRINT.title_templates["default"]

    def _build_lite_overall_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circle_info: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_lite_visual_elements(
        self,
        record: InterpretationRecord,
        theme: str,
        circle_info: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            self._get_theme_label(theme),
            projection=projection,
        )
        runtime_visual = self._get_projection_text(
            runtime_projection,
            "visual_elements",
        )
        if isinstance(runtime_visual, str) and runtime_visual.strip():
            return runtime_visual.strip()

        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        secondary = distribution[1] if len(distribution) > 1 else {"name": "金", "percentage": 0.0}
        inner = layer0.three_circles.inner
        middle = layer0.three_circles.middle
        outer = layer0.three_circles.outer
        circle_pattern = self._describe_circle_pattern(circle_info)
        lines = [
            f"从三圈颜色聚合来看，五行里以「{dominant['name']}」({dominant['percentage']:.2f}%) 和「{secondary['name']}」({secondary['percentage']:.2f}%) 最突出。",
            f"内圈主导为「{inner.get('dominant', '未识别')}」，中圈主导为「{middle.get('dominant', '未识别')}」，外圈主导为「{outer.get('dominant', '未识别')}」。{circle_pattern}",
        ]
        reading_segments = [
            inner.get("knowledge_reading", ""),
            middle.get("knowledge_reading", ""),
            outer.get("knowledge_reading", ""),
        ]
        reading_text = "；".join(segment for segment in reading_segments if isinstance(segment, str) and segment.strip())
        if reading_text:
            lines.append(reading_text + "。")
        return " ".join(lines).strip()

    def _build_runtime_lite_narrative_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> Dict[str, Any]:
        if self.narrative_service is None:
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
            projection = self.narrative_service.build_lite_narrative_projection(
                theme=self._get_record_theme(record),
                theme_label=theme_label,
                inner_radius=int((record.three_circles or {}).get("inner_radius", 33)),
                middle_radius=int((record.three_circles or {}).get("middle_radius", 66)),
                title_templates=dict(LITE_REPORT_BLUEPRINT.title_templates),
                six_insight_templates=dict(LITE_REPORT_BLUEPRINT.six_insight_layer1_templates),
                experiment_title=LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"],
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
                middle_dominant=layer0.three_circles.middle.get("dominant", secondary["name"]),
                outer_dominant=layer0.three_circles.outer.get("dominant", secondary["name"]),
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

        return projection if isinstance(projection, dict) else {}

    def _resolve_runtime_lite_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if isinstance(projection, dict):
            return projection
        return self._build_runtime_lite_narrative_projection(record, theme_label)

    def _get_projection_text(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> str:
        if not isinstance(projection, dict):
            return ""
        value = projection.get(key)
        if isinstance(value, str):
            return value
        return ""

    def _get_projection_mapping(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> Dict[str, Any]:
        if not isinstance(projection, dict):
            return {}
        value = projection.get(key)
        return value if isinstance(value, dict) else {}

    def _get_projection_list(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> list[Any]:
        if not isinstance(projection, dict):
            return []
        value = projection.get(key)
        return value if isinstance(value, list) else []

    def _build_lite_emotion_portrait(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_lite_story_sections(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
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
            pattern = f"从圈间关系看，{adjacent[0]}。所以你的推进方式往往不是一下子冲出去，而是先在内部整合，等感觉对了才继续往前。"
        else:
            pattern = "你的模式更像先在内部整合，再决定往外投入多少能量。"
        defense = (
            f"当外圈更偏向「{outer_dominant}」时，你会更倾向用清晰、距离感或判断标准保护自己。"
            f"这不是冷下来，而是在替现在的自己筛选什么值得继续打开。"
        )
        block_parts = [
            f"当前最容易卡住你的，是主导能量和现实节奏还没完全接上。"
        ]
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

    def _build_lite_theme_insights(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
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
        impact = (
            f"这会让你在面对关键事情时，更在意稳不稳、清不清楚、承不承受得住，而不是先求快。"
        )
        if weakest.get("percentage", 0.0) < 12:
            impact += f" 当「{weakest['name']}」相关的{weakest_theme}资源偏少时，你也会更需要一点缓冲和回收。"
        awareness = (
            f"这幅画提醒你的，不是逼自己立刻变得更强，而是看见：只要先把内在安顿好，后面的行动会自然长出来。"
        )
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

    def _build_lite_three_awareness(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_lite_six_insights_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        story_sections: Dict[str, str],
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Dict[str, str]]:
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
            normalized: Dict[str, Dict[str, str]] = {}
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

        story_angles = self._get_projection_mapping(
            runtime_projection,
            "story_angles",
        )
        payloads: Dict[str, Dict[str, str]] = {}
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
                "content": story_content or render_lite_template_text(
                    template.get("content", ""),
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
                "summary": story_content or render_lite_template_text(
                    template.get("summary", ""),
                    theme_label=theme_label,
                    feeling_hint=self._build_feeling_hint(record),
                ),
            }
        return payloads

    def _build_lite_experiment_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        title: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )
        runtime_experiment = self._get_projection_mapping(
            runtime_projection,
            "experiment",
        )
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

        content = build_lite_experiment_content(
            theme_label=theme_label,
            title=title,
        )
        layer0 = self._get_layer0_view(record)
        distribution = self._get_layer0_element_distribution(layer0)
        dominant = distribution[0] if distribution else {"name": "土", "percentage": 0.0}
        dominant_keywords = self._get_element_core_keywords(self._get_record_theme(record), dominant["name"])
        content = (
            f"{content}\n补充观察：如果今天只顺着这幅画练习一件事，可以试着把「{dominant['name']}」的品质带进生活里，例如先给自己一点{dominant_keywords}。"
        ).strip()
        return {
            "title": LITE_REPORT_BLUEPRINT.structure_labels["experiment_title"],
            "content": content,
        }

    def _build_lite_pro_teaser(
        self,
        record: InterpretationRecord,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        runtime_projection = self._resolve_runtime_lite_projection(
            record,
            self._get_theme_label(record.theme),
            projection=projection,
        )
        runtime_teaser = self._get_projection_text(
            runtime_projection,
            "pro_teaser",
        )
        if isinstance(runtime_teaser, str) and runtime_teaser.strip():
            return runtime_teaser.strip()

        raw_teaser = ""
        if self.narrative_service is not None:
            try:
                raw_teaser = self.narrative_service.get_pro_upgrade_teaser(
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

    def _build_pro_first_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        lite_title: str,
        projection: Optional[Dict[str, Any]] = None,
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
            f"所以 Lite 里那份《{lite_title}》并不是一种空泛的安慰，而是真实反映了这张画正在处理的事：先把自己安顿住，再决定如何向外表达。"
        )
        if lite_contradiction:
            contradiction = lite_contradiction[:96].strip()
            if contradiction and contradiction[-1] not in "。！？":
                contradiction += "。"
            parts.append(contradiction)
        if signal_text:
            parts.append(signal_text)
        return " ".join(parts)

    def _build_pro_energy_essence(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_pro_block_point(
        self,
        record: InterpretationRecord,
        imbalance_profile: Optional[Dict[str, str]] = None,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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
            weakest_theme = self._get_element_theme_phrase(self._get_record_theme(record), weakest["name"])
            parts.append(
                f"再加上「{weakest['name']}」相关的{weakest_theme}资源暂时偏少，所以你在快要真正启动时更容易先想缓一缓。"
            )
        if signal_text:
            parts.append(signal_text)
        parts.append(self._build_feeling_hint(record))
        return " ".join(part for part in parts if part).strip()

    def _build_pro_direction(
        self,
        record: InterpretationRecord,
        theme_label: str,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_pro_healing_core(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_deeper_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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

    def _build_core_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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

    def _get_runtime_imbalance_projection(self, record: InterpretationRecord) -> Dict[str, Any]:
        if not self.narrative_service:
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
            result = self.narrative_service.build_imbalance_projection(
                theme=theme_key,
                imbalance_type=imbalance_type,
                theme_label=theme_label,
            )
        except Exception:
            result = {}
        projection = result if isinstance(result, dict) else {}
        self._imbalance_projection_cache[cache_key] = projection
        return projection

    def _build_pro_circle_reading(
        self,
        record: InterpretationRecord,
        circle_key: str,
        fallback_text: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        runtime_circle_readings = self._get_projection_mapping(
            projection,
            "circle_readings",
        )
        runtime_circle_reading = str(runtime_circle_readings.get(circle_key) or "").strip()
        if runtime_circle_reading:
            return runtime_circle_reading

        layer0 = self._get_layer0_view(record)
        circle = getattr(layer0.three_circles, circle_key, {}) if hasattr(layer0.three_circles, circle_key) else {}
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

    def _build_pro_micro_sections_from_knowledge(
        self,
        record: InterpretationRecord,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
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

    def _render_lite_six_insights(
        self,
        layer1: Optional[Layer1LiteDraft],
    ) -> Dict[str, str]:
        return self.report_section_renderer.render_lite_six_insights(layer1)

    def _render_lite_experiment_card(self, layer1: Optional[Layer1LiteDraft]) -> str:
        return self.report_section_renderer.render_lite_experiment_card(layer1)

    def _render_pro_core_table(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_core_table(pro_draft)

    def _render_pro_circle_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_circle_sections(pro_draft)

    def _render_pro_micro_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_micro_sections(pro_draft)

    def _render_pro_root_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_root_sections(pro_draft)

    def _render_pro_imbalance_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_imbalance_sections(pro_draft)

    def _render_pro_healing_sections(self, pro_draft: Optional[Layer3ProDraft]) -> str:
        return self.report_section_renderer.render_pro_healing_sections(pro_draft)

    def _strip_safety_wrappers(self, content: str) -> str:
        cleaned = content
        protocol = SafetyProtocol()
        for disclaimer_type in ["basic", "with_crisis_hotline", "high_risk"]:
            disclaimer = protocol.get_disclaimer(disclaimer_type).strip()
            cleaned = cleaned.replace(disclaimer, "").strip()
        return cleaned

    def _get_record_theme(self, record: InterpretationRecord) -> str:
        return getattr(record, "theme", None) or "general"

    def _get_layer0_view(self, record: InterpretationRecord) -> Layer0Raw:
        layer0 = getattr(record, "layer_0_raw", None)
        if isinstance(layer0, Layer0Raw):
            return layer0
        try:
            return self._build_layer0_fallback(record)
        except Exception:
            return Layer0Raw()

    def _get_layer0_element_distribution(self, layer0: Layer0Raw) -> list[Dict[str, Any]]:
        source = {
            "wood": getattr(layer0.five_elements, "wood", {}),
            "fire": getattr(layer0.five_elements, "fire", {}),
            "earth": getattr(layer0.five_elements, "earth", {}),
            "metal": getattr(layer0.five_elements, "metal", {}),
            "water": getattr(layer0.five_elements, "water", {}),
        }
        distribution: list[Dict[str, Any]] = []
        for key, item in source.items():
            raw_item = item if isinstance(item, dict) else {}
            try:
                percentage = float(raw_item.get("percentage", 0.0) or 0.0)
            except (TypeError, ValueError):
                percentage = 0.0
            distribution.append(
                {
                    "key": key,
                    "name": raw_item.get("element_cn") or ELEMENT_KEY_TO_CN.get(key, key),
                    "percentage": round(percentage, 2),
                    "areas": raw_item.get("areas", []) if isinstance(raw_item.get("areas", []), list) else [],
                }
            )
        return sorted(distribution, key=lambda item: item["percentage"], reverse=True)

    def _get_primary_knowledge_signal(self, record: InterpretationRecord) -> str:
        layer0 = self._get_layer0_view(record)
        candidates = getattr(layer0, "imbalance_candidates", []) or []
        for item in candidates:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return ""

    def _get_signal_label(self, signal: str) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "get_signal_label",
        ):
            try:
                runtime_label = self.narrative_service.get_signal_label(signal)
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

    def _describe_signal(self, signal: str) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "describe_signal",
        ):
            try:
                runtime_description = self.narrative_service.describe_signal(signal)
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

    def _get_element_theme_phrase(self, theme: Optional[str], element_name: str) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "get_element_theme_phrase",
        ):
            try:
                runtime_phrase = self.narrative_service.get_element_theme_phrase(
                    theme or "general",
                    element_name,
                )
            except Exception:
                runtime_phrase = ""
            if isinstance(runtime_phrase, str) and runtime_phrase.strip():
                return runtime_phrase.strip()

        profile = self._get_theme_element_profile(theme, element_name)
        psychological_theme = profile.get("psychological_theme")
        if isinstance(psychological_theme, str) and psychological_theme.strip():
            return psychological_theme.strip()
        core_concept = profile.get("core_concept")
        if isinstance(core_concept, str) and core_concept.strip():
            return core_concept.strip()
        return f"{element_name}元素的状态"

    def _get_element_core_keywords(self, theme: Optional[str], element_name: str) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "get_element_core_keywords",
        ):
            try:
                runtime_keywords = self.narrative_service.get_element_core_keywords(
                    theme or "general",
                    element_name,
                )
            except Exception:
                runtime_keywords = ""
            if isinstance(runtime_keywords, str) and runtime_keywords.strip():
                return runtime_keywords.strip()

        profile = self._get_theme_element_profile(theme, element_name)
        keywords = profile.get("keywords")
        if isinstance(keywords, list) and keywords:
            filtered = [str(item).strip() for item in keywords if isinstance(item, str) and item.strip()]
            if filtered:
                return "、".join(filtered[:3])
        return self._get_element_theme_phrase(theme, element_name)

    def _get_theme_element_profile(
        self,
        theme: Optional[str],
        element_name: str,
    ) -> Dict[str, Any]:
        theme_key = (theme or "general").strip() or "general"
        cache_key = (theme_key, element_name)
        cached = self._theme_element_profile_cache.get(cache_key)
        if cached is not None:
            return cached

        profile: Dict[str, Any] = {}
        if self.knowledge_runtime is not None:
            try:
                result = self.knowledge_runtime.theme_service.get_element_meaning(
                    theme_key,
                    element_name,
                )
            except Exception:
                result = {}
            if isinstance(result, dict):
                profile = result

        self._theme_element_profile_cache[cache_key] = profile
        return profile

    def _describe_circle_transition(self, layer0: Layer0Raw) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "describe_circle_transition",
        ):
            try:
                runtime_transition = self.narrative_service.describe_circle_transition(
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

    def _clean_knowledge_text_block(self, content: str) -> str:
        if self.narrative_service is not None and hasattr(
            self.narrative_service,
            "clean_text_block",
        ):
            try:
                runtime_cleaned = self.narrative_service.clean_text_block(content)
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

    def _build_user_context_hint(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_user_context_hint(record)

    def _build_lite_prompt_preview(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_lite_prompt_preview(record)

    def _build_theme_prompt_context(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_theme_prompt_context(record)

    def get_knowledge_theme_summary(self, theme: Optional[str]) -> Dict[str, Any]:
        theme_key = (theme or "general").strip() or "general"
        cached = self._theme_summary_cache.get(theme_key)
        if cached is not None:
            return cached

        summary: Dict[str, Any] = {}
        if self.knowledge_runtime is not None:
            try:
                result = self.knowledge_runtime.theme_service.get_theme_summary(theme_key)
            except Exception:
                result = {}
            if isinstance(result, dict) and result:
                summary = result

        self._theme_summary_cache[theme_key] = summary
        return summary

    def _build_pro_prompt_preview(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_pro_prompt_preview(record)

    def _build_feeling_hint(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_feeling_hint(record)

    def _build_surface_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
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
            base = (
                PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_without_intention"].format(
                    lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else ""
                )
            )
            if mapped_manifestation:
                base = f"{base} 更落到现实里看，它常会表现成：{mapped_manifestation}。"
            return f"{base} {signal_text}".strip() if signal_text else base
        base = (
            PRO_REPORT_BLUEPRINT.narrative_templates["surface_root_with_intention"].format(
                lite_contradiction=f"{lite_contradiction[:72]} " if lite_contradiction else "",
                intention=intention,
            )
        )
        if mapped_manifestation:
            base = f"{base} 现实层面也常会表现成：{mapped_manifestation}。"
        return f"{base} {signal_text}".strip() if signal_text else base

    def _map_knowledge_signal_to_profile(self, signal: str) -> str:
        direct_profiles = set(PRO_REPORT_BLUEPRINT.imbalance_profiles.keys())
        if signal in direct_profiles:
            return signal
        mapping = {
            "transition-overload": "energy-block",
        }
        return mapping.get(signal, "")

    def _build_pro_imbalance_profile(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        profile_key = self._select_pro_imbalance_type(
            record=record,
            inner=inner,
            middle=middle,
        )
        signal = self._get_primary_knowledge_signal(record)
        runtime_profile = self._build_runtime_imbalance_profile(
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
            summary = f"{summary} 同时，Layer 0 的知识候选更接近「{signal_label}」，说明这不是单点问题，而更像阶段性的能量转折。"
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

    def _build_runtime_imbalance_profile(
        self,
        record: InterpretationRecord,
        *,
        profile_key: str,
        signal: str,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        if not signal or not self.narrative_service:
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

    def _select_pro_imbalance_type(
        self,
        *,
        record: InterpretationRecord,
        inner: int,
        middle: int,
    ) -> str:
        signal = self._get_primary_knowledge_signal(record)
        mapped_signal = self._map_knowledge_signal_to_profile(signal)
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

    def _build_pro_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        imbalance_profile: Dict[str, str],
        theme_label: str,
    ) -> list[Dict[str, str]]:
        primary = imbalance_profile.get("primary", "能量受阻型失衡")
        runtime_rendered = self._build_runtime_healing_suggestions(
            record,
            primary=primary,
            theme_label=theme_label,
        )
        if runtime_rendered:
            return runtime_rendered

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

    def _build_runtime_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        primary: str,
        theme_label: str,
    ) -> list[Dict[str, str]]:
        if not self.knowledge_runtime:
            return []

        imbalance_type = self._get_primary_knowledge_signal(record)
        if not imbalance_type:
            return []

        healing_result = self.knowledge_runtime.healing_service.get_healing_plan(
            imbalance_type,
            self._get_record_theme(record),
        )
        payload = healing_result.value if isinstance(healing_result.value, dict) else {}
        if not payload:
            return []

        issue_type = str(payload.get("issue_type") or "").strip()
        symptoms = str(payload.get("symptoms") or "").strip()
        mandala_prescription = str(payload.get("mandala_prescription") or "").strip()
        daily_practice = str(payload.get("daily_practice") or "").strip()
        cognitive_upgrade = str(payload.get("cognitive_upgrade") or "").strip()

        if not any([issue_type, symptoms, mandala_prescription, daily_practice, cognitive_upgrade]):
            return []

        phase_one_focus = symptoms or f"这次更需要先看见「{issue_type or primary}」在你当下的具体表现。"
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

    def _describe_circle_pattern(self, circles: Dict[str, int]) -> str:
        inner = circles.get("inner_radius", 33)
        middle = circles.get("middle_radius", 66)
        if inner >= 40:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_inner_high"]
        if middle >= 72:
            return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_middle_high"]
        return LITE_REPORT_BLUEPRINT.narrative_templates["circle_pattern_default"]

    def _render_story_sections(self, layer1: Optional[Layer1LiteDraft]) -> str:
        return self.report_section_renderer.render_story_sections(layer1)

    def _render_awareness_lines(self, layer1: Optional[Layer1LiteDraft]) -> str:
        return self.report_section_renderer.render_awareness_lines(layer1)

    def _render_experiment_text(self, layer1: Optional[Layer1LiteDraft]) -> str:
        return self.report_section_renderer.render_experiment_text(layer1)

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
