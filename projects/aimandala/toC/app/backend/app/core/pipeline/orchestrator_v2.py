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
    LITE_REPORT_BLUEPRINT,
    PRO_REPORT_BLUEPRINT,
)
from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_draft_assembler import ReportDraftAssembler
from .report_knowledge_adapter import ReportKnowledgeAdapter
from .report_lite_narrative_builder import ReportLiteNarrativeBuilder
from .report_placeholder_assembler import ReportPlaceholderAssembler
from .report_projection_resolver import ReportProjectionResolver
from .report_pro_narrative_builder import ReportProNarrativeBuilder
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
        self.report_knowledge_adapter = ReportKnowledgeAdapter(
            get_narrative_service=lambda: self.narrative_service,
            get_knowledge_runtime=lambda: self.knowledge_runtime,
            get_layer0_view=self._get_layer0_view,
        )
        self.report_projection_resolver = ReportProjectionResolver(
            get_narrative_service=lambda: self.narrative_service,
            get_record_theme=self._get_record_theme,
            get_layer0_view=self._get_layer0_view,
            get_layer0_element_distribution=self._get_layer0_element_distribution,
            describe_circle_transition=self._describe_circle_transition,
            get_primary_knowledge_signal=self._get_primary_knowledge_signal,
            build_feeling_hint=self._build_feeling_hint,
            build_lite_title_fallback=self._build_lite_title_fallback,
            get_theme_label=self._get_theme_label,
            describe_circle_pattern=self._describe_circle_pattern,
        )
        self.report_lite_narrative_builder = ReportLiteNarrativeBuilder(
            get_record_theme=self._get_record_theme,
            get_layer0_view=self._get_layer0_view,
            get_layer0_element_distribution=self._get_layer0_element_distribution,
            get_element_theme_phrase=self._get_element_theme_phrase,
            get_element_core_keywords=self._get_element_core_keywords,
            describe_circle_transition=self._describe_circle_transition,
            describe_signal=self._describe_signal,
            get_primary_knowledge_signal=self._get_primary_knowledge_signal,
            resolve_runtime_lite_projection=self._resolve_runtime_lite_projection,
            get_projection_text=self._get_projection_text,
            get_projection_mapping=self._get_projection_mapping,
            get_projection_list=self._get_projection_list,
            build_feeling_hint=self._build_feeling_hint,
            get_narrative_service=lambda: self.narrative_service,
            clean_knowledge_text_block=self._clean_knowledge_text_block,
            get_theme_label=self._get_theme_label,
        )
        self.report_pro_narrative_builder = ReportProNarrativeBuilder(
            get_record_theme=self._get_record_theme,
            get_layer0_view=self._get_layer0_view,
            get_layer0_element_distribution=self._get_layer0_element_distribution,
            describe_circle_transition=self._describe_circle_transition,
            describe_signal=self._describe_signal,
            get_primary_knowledge_signal=self._get_primary_knowledge_signal,
            get_signal_label=self._get_signal_label,
            get_element_theme_phrase=self._get_element_theme_phrase,
            get_projection_text=self._get_projection_text,
            get_projection_mapping=self._get_projection_mapping,
            get_runtime_imbalance_projection=self._get_runtime_imbalance_projection,
            build_feeling_hint=self._build_feeling_hint,
            get_knowledge_runtime=lambda: self.knowledge_runtime,
        )
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
        return self.report_projection_resolver.build_runtime_pro_narrative_projection(
            record,
            theme_label=theme_label,
            lite_title=lite_title,
            imbalance_profile=imbalance_profile,
            imbalance_projection=imbalance_projection,
        )

    def _build_pro_placeholder_report(self, record: InterpretationRecord) -> Layer4ProFinal:
        return self.report_placeholder_assembler.build_pro(record)

    def _get_theme_label(self, theme: Optional[str]) -> str:
        return self.report_knowledge_adapter.get_theme_label(theme)

    def _build_lite_title(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_lite_narrative_builder.build_title(
            record,
            theme_label,
            projection=projection,
        )

    def _build_lite_title_fallback(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> str:
        return self.report_lite_narrative_builder.build_title_fallback(
            record,
            theme_label,
        )

    def _build_lite_overall_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circle_info: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_lite_narrative_builder.build_overall_impression(
            record,
            theme_label,
            circle_info,
            projection=projection,
        )

    def _build_lite_visual_elements(
        self,
        record: InterpretationRecord,
        theme: str,
        circle_info: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_lite_narrative_builder.build_visual_elements(
            record,
            theme,
            circle_info,
            projection=projection,
        )

    def _build_runtime_lite_narrative_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
    ) -> Dict[str, Any]:
        return self.report_projection_resolver.build_runtime_lite_narrative_projection(
            record,
            theme_label,
        )

    def _resolve_runtime_lite_projection(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return self.report_projection_resolver.resolve_runtime_lite_projection(
            record,
            theme_label,
            projection=projection,
        )

    def _get_projection_text(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> str:
        return self.report_projection_resolver.get_projection_text(projection, key)

    def _get_projection_mapping(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> Dict[str, Any]:
        return self.report_projection_resolver.get_projection_mapping(
            projection,
            key,
        )

    def _get_projection_list(
        self,
        projection: Optional[Dict[str, Any]],
        key: str,
    ) -> list[Any]:
        return self.report_projection_resolver.get_projection_list(projection, key)

    def _build_lite_emotion_portrait(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_lite_narrative_builder.build_emotion_portrait(
            record,
            theme_label,
            projection=projection,
        )

    def _build_lite_story_sections(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_lite_narrative_builder.build_story_sections(
            record,
            theme_label,
            projection=projection,
        )

    def _build_lite_theme_insights(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_lite_narrative_builder.build_theme_insights(
            record,
            theme_label,
            projection=projection,
        )

    def _build_lite_three_awareness(
        self,
        record: InterpretationRecord,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> list[DailyAwareness]:
        return self.report_lite_narrative_builder.build_three_awareness(
            record,
            theme_label,
            projection=projection,
        )

    def _build_lite_six_insights_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        story_sections: Dict[str, str],
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Dict[str, str]]:
        return self.report_lite_narrative_builder.build_six_insights_payload(
            record,
            theme_label,
            story_sections,
            projection=projection,
        )

    def _build_lite_experiment_payload(
        self,
        record: InterpretationRecord,
        theme_label: str,
        title: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_lite_narrative_builder.build_experiment_payload(
            record,
            theme_label,
            title,
            projection=projection,
        )

    def _build_lite_pro_teaser(
        self,
        record: InterpretationRecord,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_lite_narrative_builder.build_pro_teaser(
            record,
            projection=projection,
        )

    def _build_pro_first_impression(
        self,
        record: InterpretationRecord,
        theme_label: str,
        lite_title: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_first_impression(
            record,
            theme_label,
            lite_title,
            projection=projection,
        )

    def _build_pro_energy_essence(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_energy_essence(
            record,
            theme_label,
            circles,
            projection=projection,
        )

    def _build_pro_block_point(
        self,
        record: InterpretationRecord,
        imbalance_profile: Optional[Dict[str, str]] = None,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_block_point(
            record,
            imbalance_profile=imbalance_profile,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _build_pro_direction(
        self,
        record: InterpretationRecord,
        theme_label: str,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_direction(
            record,
            theme_label,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _build_pro_healing_core(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_healing_core(
            record,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _build_deeper_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_deeper_root_cause(
            record,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _build_core_root_cause(
        self,
        record: InterpretationRecord,
        narrative_projection: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_core_root_cause(
            record,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _get_runtime_imbalance_projection(self, record: InterpretationRecord) -> Dict[str, Any]:
        return self.report_projection_resolver.get_runtime_imbalance_projection(record)

    def _build_pro_circle_reading(
        self,
        record: InterpretationRecord,
        circle_key: str,
        fallback_text: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> str:
        return self.report_pro_narrative_builder.build_circle_reading(
            record,
            circle_key,
            fallback_text,
            projection=projection,
        )

    def _build_pro_micro_sections_from_knowledge(
        self,
        record: InterpretationRecord,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_pro_narrative_builder.build_micro_sections_from_knowledge(
            record,
            projection=projection,
        )

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
        return self.report_knowledge_adapter.get_primary_knowledge_signal(record)

    def _get_signal_label(self, signal: str) -> str:
        return self.report_knowledge_adapter.get_signal_label(signal)

    def _describe_signal(self, signal: str) -> str:
        return self.report_knowledge_adapter.describe_signal(signal)

    def _get_element_theme_phrase(self, theme: Optional[str], element_name: str) -> str:
        return self.report_knowledge_adapter.get_element_theme_phrase(
            theme,
            element_name,
        )

    def _get_element_core_keywords(self, theme: Optional[str], element_name: str) -> str:
        return self.report_knowledge_adapter.get_element_core_keywords(
            theme,
            element_name,
        )

    def _get_theme_element_profile(
        self,
        theme: Optional[str],
        element_name: str,
    ) -> Dict[str, Any]:
        return self.report_knowledge_adapter.get_theme_element_profile(
            theme,
            element_name,
        )

    def _describe_circle_transition(self, layer0: Layer0Raw) -> str:
        return self.report_knowledge_adapter.describe_circle_transition(layer0)

    def _clean_knowledge_text_block(self, content: str) -> str:
        return self.report_knowledge_adapter.clean_knowledge_text_block(content)

    def _build_user_context_hint(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_user_context_hint(record)

    def _build_lite_prompt_preview(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_lite_prompt_preview(record)

    def _build_theme_prompt_context(self, record: InterpretationRecord) -> str:
        return self.report_prompt_preview_builder.build_theme_prompt_context(record)

    def get_knowledge_theme_summary(self, theme: Optional[str]) -> Dict[str, Any]:
        return self.report_knowledge_adapter.get_knowledge_theme_summary(theme)

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
        return self.report_pro_narrative_builder.build_surface_root_cause(
            record,
            narrative_projection=narrative_projection,
            projection=projection,
        )

    def _map_knowledge_signal_to_profile(self, signal: str) -> str:
        return self.report_pro_narrative_builder.map_knowledge_signal_to_profile(
            signal,
        )

    def _build_pro_imbalance_profile(
        self,
        record: InterpretationRecord,
        theme_label: str,
        circles: Dict[str, int],
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_pro_narrative_builder.build_pro_imbalance_profile(
            record,
            theme_label,
            circles,
            projection=projection,
        )

    def _build_runtime_imbalance_profile(
        self,
        record: InterpretationRecord,
        *,
        profile_key: str,
        signal: str,
        theme_label: str,
        projection: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        return self.report_pro_narrative_builder.build_runtime_imbalance_profile(
            record,
            profile_key=profile_key,
            signal=signal,
            theme_label=theme_label,
            projection=projection,
        )

    def _select_pro_imbalance_type(
        self,
        *,
        record: InterpretationRecord,
        inner: int,
        middle: int,
    ) -> str:
        return self.report_pro_narrative_builder.select_pro_imbalance_type(
            record=record,
            inner=inner,
            middle=middle,
        )

    def _build_pro_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        imbalance_profile: Dict[str, str],
        theme_label: str,
    ) -> list[Dict[str, str]]:
        return self.report_pro_narrative_builder.build_pro_healing_suggestions(
            record,
            imbalance_profile=imbalance_profile,
            theme_label=theme_label,
        )

    def _build_runtime_healing_suggestions(
        self,
        record: InterpretationRecord,
        *,
        primary: str,
        theme_label: str,
    ) -> list[Dict[str, str]]:
        return self.report_pro_narrative_builder.build_runtime_healing_suggestions(
            record,
            primary=primary,
            theme_label=theme_label,
        )

    def _describe_circle_pattern(self, circles: Dict[str, int]) -> str:
        return self.report_lite_narrative_builder.describe_circle_pattern(circles)

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
