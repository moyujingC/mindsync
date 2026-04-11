"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

from dataclasses import dataclass
from enum import Enum
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

from .data_models import InterpretationRecord
from .generation_runtime import (
    DeterministicReportGenerationRuntime,
    PromptBackedReportGenerationRuntime,
    ReportGenerationRuntime,
)
from .prompt_runtime import PromptRuntime
from .report_contracts import ReportContractAssembler
from .report_debug_profile import ReportDebugProfileBuilder
from .report_draft_assembler import ReportDraftAssembler
from .report_interaction_support import ReportInteractionSupport
from .report_knowledge_adapter import ReportKnowledgeAdapter
from .report_layer0_support import ReportLayer0Support
from .report_lifecycle import ReportLifecycleManager
from .report_lite_record_workflow import ReportLiteRecordWorkflow
from .report_lite_narrative_builder import ReportLiteNarrativeBuilder
from .report_placeholder_assembler import ReportPlaceholderAssembler
from .report_projection_resolver import ReportProjectionResolver
from .report_pro_narrative_builder import ReportProNarrativeBuilder
from .report_prompt_preview import ReportPromptPreviewBuilder
from .report_safety_wrapper import ReportSafetyWrapper
from .report_section_renderer import ReportSectionRenderer
from .store import InterpretationStore

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
        self.report_layer0_support = ReportLayer0Support(
            get_layer0_assembler=lambda: self.layer0_assembler,
            extract_colors_by_circles=extract_colors_by_circles,
            analyze_energy_flow=analyze_energy_flow,
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
        self.report_section_renderer = ReportSectionRenderer()
        self.report_knowledge_adapter = ReportKnowledgeAdapter(
            get_narrative_service=lambda: self.narrative_service,
            get_knowledge_runtime=lambda: self.knowledge_runtime,
            get_layer0_view=self.report_layer0_support.get_layer0_view,
        )
        self.report_prompt_preview_builder = ReportPromptPreviewBuilder(
            prompt_builder=self.prompt_builder,
            get_narrative_service=lambda: self.narrative_service,
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
            get_record_theme=self.report_layer0_support.get_record_theme,
            get_layer0_view=self.report_layer0_support.get_layer0_view,
            get_layer0_element_distribution=(
                self.report_layer0_support.get_layer0_element_distribution
            ),
            get_primary_knowledge_signal=(
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            get_signal_label=self.report_knowledge_adapter.get_signal_label,
            get_knowledge_theme_summary=(
                self.report_knowledge_adapter.get_knowledge_theme_summary
            ),
        )
        self.report_debug_builder = ReportDebugProfileBuilder(
            prompt_builder=self.prompt_builder,
            validator=self.report_contracts.validator,
        )
        self.report_interaction_support = ReportInteractionSupport(
            store=self.store,
            report_debug_builder=self.report_debug_builder,
            get_report_chat_runtime=lambda: self.report_chat_runtime,
            get_primary_knowledge_signal=(
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
            get_signal_label=self.report_knowledge_adapter.get_signal_label,
            get_knowledge_theme_summary=(
                self.report_knowledge_adapter.get_knowledge_theme_summary
            ),
        )
        self.report_safety_wrapper = ReportSafetyWrapper()
        self.report_lifecycle_manager = ReportLifecycleManager(
            store=self.store,
            report_contracts=self.report_contracts,
            generation_runtime=self.generation_runtime,
            get_upgrade_diff=self.get_upgrade_diff,
            processing_stage=GenerationStage.GENERATING.value,
            completed_stage=GenerationStage.COMPLETED.value,
        )
        self.report_lite_record_workflow = ReportLiteRecordWorkflow(
            store=self.store,
            generation_runtime=self.generation_runtime,
            detecting_stage=GenerationStage.DETECTING.value,
            generating_stage=GenerationStage.GENERATING.value,
            completed_stage=GenerationStage.COMPLETED.value,
        )
        self.report_projection_resolver = ReportProjectionResolver(
            get_narrative_service=lambda: self.narrative_service,
            get_record_theme=self.report_layer0_support.get_record_theme,
            get_layer0_view=self.report_layer0_support.get_layer0_view,
            get_layer0_element_distribution=(
                self.report_layer0_support.get_layer0_element_distribution
            ),
            describe_circle_transition=(
                self.report_knowledge_adapter.describe_circle_transition
            ),
            get_primary_knowledge_signal=(
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            build_feeling_hint=self.report_prompt_preview_builder.build_feeling_hint,
            build_lite_title_fallback=lambda record, theme_label: (
                self.report_lite_narrative_builder.build_title_fallback(
                    record,
                    theme_label,
                )
            ),
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
            describe_circle_pattern=lambda circles: (
                self.report_lite_narrative_builder.describe_circle_pattern(circles)
            ),
        )
        self.report_lite_narrative_builder = ReportLiteNarrativeBuilder(
            get_record_theme=self.report_layer0_support.get_record_theme,
            get_layer0_view=self.report_layer0_support.get_layer0_view,
            get_layer0_element_distribution=(
                self.report_layer0_support.get_layer0_element_distribution
            ),
            get_element_theme_phrase=(
                self.report_knowledge_adapter.get_element_theme_phrase
            ),
            get_element_core_keywords=(
                self.report_knowledge_adapter.get_element_core_keywords
            ),
            describe_circle_transition=(
                self.report_knowledge_adapter.describe_circle_transition
            ),
            describe_signal=self.report_knowledge_adapter.describe_signal,
            get_primary_knowledge_signal=(
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            resolve_runtime_lite_projection=(
                self.report_projection_resolver.resolve_runtime_lite_projection
            ),
            get_projection_text=self.report_projection_resolver.get_projection_text,
            get_projection_mapping=self.report_projection_resolver.get_projection_mapping,
            get_projection_list=self.report_projection_resolver.get_projection_list,
            build_feeling_hint=self.report_prompt_preview_builder.build_feeling_hint,
            get_narrative_service=lambda: self.narrative_service,
            clean_knowledge_text_block=(
                self.report_knowledge_adapter.clean_knowledge_text_block
            ),
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
        )
        self.report_pro_narrative_builder = ReportProNarrativeBuilder(
            get_record_theme=self.report_layer0_support.get_record_theme,
            get_layer0_view=self.report_layer0_support.get_layer0_view,
            get_layer0_element_distribution=(
                self.report_layer0_support.get_layer0_element_distribution
            ),
            describe_circle_transition=(
                self.report_knowledge_adapter.describe_circle_transition
            ),
            describe_signal=self.report_knowledge_adapter.describe_signal,
            get_primary_knowledge_signal=(
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            get_signal_label=self.report_knowledge_adapter.get_signal_label,
            get_element_theme_phrase=(
                self.report_knowledge_adapter.get_element_theme_phrase
            ),
            get_projection_text=self.report_projection_resolver.get_projection_text,
            get_projection_mapping=self.report_projection_resolver.get_projection_mapping,
            get_runtime_imbalance_projection=(
                self.report_projection_resolver.get_runtime_imbalance_projection
            ),
            build_feeling_hint=self.report_prompt_preview_builder.build_feeling_hint,
            get_knowledge_runtime=lambda: self.knowledge_runtime,
        )
        self.report_draft_assembler = ReportDraftAssembler(
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
            build_lite_prompt_preview=(
                self.report_prompt_preview_builder.build_lite_prompt_preview
            ),
            build_runtime_lite_narrative_projection=(
                self.report_projection_resolver.build_runtime_lite_narrative_projection
            ),
            build_lite_story_sections=(
                self.report_lite_narrative_builder.build_story_sections
            ),
            build_lite_theme_insights=(
                self.report_lite_narrative_builder.build_theme_insights
            ),
            build_lite_title=self.report_lite_narrative_builder.build_title,
            build_lite_overall_impression=(
                self.report_lite_narrative_builder.build_overall_impression
            ),
            build_lite_visual_elements=(
                self.report_lite_narrative_builder.build_visual_elements
            ),
            build_lite_emotion_portrait=(
                self.report_lite_narrative_builder.build_emotion_portrait
            ),
            build_lite_pro_teaser=self.report_lite_narrative_builder.build_pro_teaser,
            build_lite_three_awareness=(
                self.report_lite_narrative_builder.build_three_awareness
            ),
            build_lite_six_insights_payload=(
                self.report_lite_narrative_builder.build_six_insights_payload
            ),
            build_lite_experiment_payload=(
                self.report_lite_narrative_builder.build_experiment_payload
            ),
            build_pro_prompt_preview=(
                self.report_prompt_preview_builder.build_pro_prompt_preview
            ),
            get_runtime_imbalance_projection=(
                self.report_projection_resolver.get_runtime_imbalance_projection
            ),
            build_pro_imbalance_profile=(
                self.report_pro_narrative_builder.build_pro_imbalance_profile
            ),
            build_runtime_pro_narrative_projection=(
                self.report_projection_resolver.build_runtime_pro_narrative_projection
            ),
            build_pro_first_impression=(
                self.report_pro_narrative_builder.build_first_impression
            ),
            build_pro_energy_essence=(
                self.report_pro_narrative_builder.build_energy_essence
            ),
            build_pro_block_point=self.report_pro_narrative_builder.build_block_point,
            build_pro_direction=self.report_pro_narrative_builder.build_direction,
            build_pro_healing_core=(
                self.report_pro_narrative_builder.build_healing_core
            ),
            build_pro_circle_reading=(
                self.report_pro_narrative_builder.build_circle_reading
            ),
            build_pro_micro_sections_from_knowledge=(
                self.report_pro_narrative_builder.build_micro_sections_from_knowledge
            ),
            build_surface_root_cause=(
                self.report_pro_narrative_builder.build_surface_root_cause
            ),
            build_deeper_root_cause=(
                self.report_pro_narrative_builder.build_deeper_root_cause
            ),
            build_core_root_cause=(
                self.report_pro_narrative_builder.build_core_root_cause
            ),
            build_pro_healing_suggestions=(
                self.report_pro_narrative_builder.build_pro_healing_suggestions
            ),
        )
        self.report_placeholder_assembler = ReportPlaceholderAssembler(
            section_renderer=self.report_section_renderer,
            get_narrative_service=lambda: self.narrative_service,
            get_theme_label=self.report_knowledge_adapter.get_theme_label,
            build_lite_title=self.report_lite_narrative_builder.build_title,
            build_lite_overall_impression=(
                self.report_lite_narrative_builder.build_overall_impression
            ),
            build_lite_visual_elements=(
                self.report_lite_narrative_builder.build_visual_elements
            ),
            build_lite_emotion_portrait=(
                self.report_lite_narrative_builder.build_emotion_portrait
            ),
            wrap_report_with_safety=self.report_safety_wrapper.wrap_report,
            strip_safety_wrappers=self.report_safety_wrapper.strip_wrappers,
        )
        legacy_bindings = {
            "_build_lite_placeholder_report": self.report_placeholder_assembler.build_lite,
            "_build_layer0_placeholder": self.report_layer0_support.build_placeholder,
            "_build_layer0_fallback": self.report_layer0_support.build_fallback,
            "_build_layer1_placeholder": self.report_draft_assembler.build_lite,
            "_build_pro_placeholder_draft": self.report_draft_assembler.build_pro,
            "_build_runtime_pro_narrative_projection": (
                self.report_projection_resolver.build_runtime_pro_narrative_projection
            ),
            "_build_pro_placeholder_report": self.report_placeholder_assembler.build_pro,
            "_get_theme_label": self.report_knowledge_adapter.get_theme_label,
            "_build_lite_title": self.report_lite_narrative_builder.build_title,
            "_build_lite_title_fallback": (
                self.report_lite_narrative_builder.build_title_fallback
            ),
            "_build_lite_overall_impression": (
                self.report_lite_narrative_builder.build_overall_impression
            ),
            "_build_lite_visual_elements": (
                self.report_lite_narrative_builder.build_visual_elements
            ),
            "_build_runtime_lite_narrative_projection": (
                self.report_projection_resolver.build_runtime_lite_narrative_projection
            ),
            "_resolve_runtime_lite_projection": (
                self.report_projection_resolver.resolve_runtime_lite_projection
            ),
            "_get_projection_text": self.report_projection_resolver.get_projection_text,
            "_get_projection_mapping": (
                self.report_projection_resolver.get_projection_mapping
            ),
            "_get_projection_list": self.report_projection_resolver.get_projection_list,
            "_build_lite_emotion_portrait": (
                self.report_lite_narrative_builder.build_emotion_portrait
            ),
            "_build_lite_story_sections": (
                self.report_lite_narrative_builder.build_story_sections
            ),
            "_build_lite_theme_insights": (
                self.report_lite_narrative_builder.build_theme_insights
            ),
            "_build_lite_three_awareness": (
                self.report_lite_narrative_builder.build_three_awareness
            ),
            "_build_lite_six_insights_payload": (
                self.report_lite_narrative_builder.build_six_insights_payload
            ),
            "_build_lite_experiment_payload": (
                self.report_lite_narrative_builder.build_experiment_payload
            ),
            "_build_lite_pro_teaser": (
                self.report_lite_narrative_builder.build_pro_teaser
            ),
            "_build_pro_first_impression": (
                self.report_pro_narrative_builder.build_first_impression
            ),
            "_build_pro_energy_essence": (
                self.report_pro_narrative_builder.build_energy_essence
            ),
            "_build_pro_block_point": (
                self.report_pro_narrative_builder.build_block_point
            ),
            "_build_pro_direction": self.report_pro_narrative_builder.build_direction,
            "_build_pro_healing_core": (
                self.report_pro_narrative_builder.build_healing_core
            ),
            "_build_deeper_root_cause": (
                self.report_pro_narrative_builder.build_deeper_root_cause
            ),
            "_build_core_root_cause": (
                self.report_pro_narrative_builder.build_core_root_cause
            ),
            "_get_runtime_imbalance_projection": (
                self.report_projection_resolver.get_runtime_imbalance_projection
            ),
            "_build_pro_circle_reading": (
                self.report_pro_narrative_builder.build_circle_reading
            ),
            "_build_pro_micro_sections_from_knowledge": (
                self.report_pro_narrative_builder.build_micro_sections_from_knowledge
            ),
            "_render_lite_six_insights": (
                self.report_section_renderer.render_lite_six_insights
            ),
            "_render_lite_experiment_card": (
                self.report_section_renderer.render_lite_experiment_card
            ),
            "_render_pro_core_table": self.report_section_renderer.render_pro_core_table,
            "_render_pro_circle_sections": (
                self.report_section_renderer.render_pro_circle_sections
            ),
            "_render_pro_micro_sections": (
                self.report_section_renderer.render_pro_micro_sections
            ),
            "_render_pro_root_sections": (
                self.report_section_renderer.render_pro_root_sections
            ),
            "_render_pro_imbalance_sections": (
                self.report_section_renderer.render_pro_imbalance_sections
            ),
            "_render_pro_healing_sections": (
                self.report_section_renderer.render_pro_healing_sections
            ),
            "_get_record_theme": self.report_layer0_support.get_record_theme,
            "_get_layer0_view": self.report_layer0_support.get_layer0_view,
            "_get_layer0_element_distribution": (
                self.report_layer0_support.get_layer0_element_distribution
            ),
            "_get_primary_knowledge_signal": (
                self.report_knowledge_adapter.get_primary_knowledge_signal
            ),
            "_get_signal_label": self.report_knowledge_adapter.get_signal_label,
            "_describe_signal": self.report_knowledge_adapter.describe_signal,
            "_get_element_theme_phrase": (
                self.report_knowledge_adapter.get_element_theme_phrase
            ),
            "_get_element_core_keywords": (
                self.report_knowledge_adapter.get_element_core_keywords
            ),
            "_get_theme_element_profile": (
                self.report_knowledge_adapter.get_theme_element_profile
            ),
            "_describe_circle_transition": (
                self.report_knowledge_adapter.describe_circle_transition
            ),
            "_clean_knowledge_text_block": (
                self.report_knowledge_adapter.clean_knowledge_text_block
            ),
            "_build_user_context_hint": (
                self.report_prompt_preview_builder.build_user_context_hint
            ),
            "_build_lite_prompt_preview": (
                self.report_prompt_preview_builder.build_lite_prompt_preview
            ),
            "_build_theme_prompt_context": (
                self.report_prompt_preview_builder.build_theme_prompt_context
            ),
            "get_knowledge_theme_summary": (
                self.report_knowledge_adapter.get_knowledge_theme_summary
            ),
            "_build_pro_prompt_preview": (
                self.report_prompt_preview_builder.build_pro_prompt_preview
            ),
            "_build_feeling_hint": self.report_prompt_preview_builder.build_feeling_hint,
            "_build_surface_root_cause": (
                self.report_pro_narrative_builder.build_surface_root_cause
            ),
            "_map_knowledge_signal_to_profile": (
                self.report_pro_narrative_builder.map_knowledge_signal_to_profile
            ),
            "_build_pro_imbalance_profile": (
                self.report_pro_narrative_builder.build_pro_imbalance_profile
            ),
            "_build_runtime_imbalance_profile": (
                self.report_pro_narrative_builder.build_runtime_imbalance_profile
            ),
            "_select_pro_imbalance_type": (
                self.report_pro_narrative_builder.select_pro_imbalance_type
            ),
            "_build_pro_healing_suggestions": (
                self.report_pro_narrative_builder.build_pro_healing_suggestions
            ),
            "_build_runtime_healing_suggestions": (
                self.report_pro_narrative_builder.build_runtime_healing_suggestions
            ),
            "_describe_circle_pattern": (
                self.report_lite_narrative_builder.describe_circle_pattern
            ),
            "_render_story_sections": self.report_section_renderer.render_story_sections,
            "_render_awareness_lines": self.report_section_renderer.render_awareness_lines,
            "_render_experiment_text": self.report_section_renderer.render_experiment_text,
        }
        for name, method in legacy_bindings.items():
            setattr(self, name, method)

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
        return await self.report_lite_record_workflow.prepare_record(
            detect_three_circles=self.detect_three_circles,
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
        return await self.report_lite_record_workflow.generate_placeholder(
            self,
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
            check_existing=check_existing,
        )

    def _hash_image(self, image_path: str) -> str:
        return self.report_lite_record_workflow.hash_image(image_path)

    def _normalize_circle_payload(self, circle_payload: Dict[str, int]) -> Dict[str, int]:
        return self.report_lite_record_workflow.normalize_circle_payload(circle_payload)

    def get_report(
        self,
        interpretation_id: str,
        version: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return the currently available report view for a migrated record."""
        return self.report_lifecycle_manager.get_report(
            interpretation_id,
            version=version,
        )

    def answer_report_chat(
        self,
        interpretation_id: str,
        *,
        message: str,
        history: Optional[list[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate a follow-up reply grounded in the existing report."""
        return self.report_interaction_support.answer_report_chat(
            interpretation_id,
            message=message,
            history=history,
        )

    def get_status(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a compact status snapshot for polling clients."""
        return self.report_lifecycle_manager.get_status(interpretation_id)

    def get_report_debug_profile(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a development-only profile of how the current report was produced."""
        return self.report_interaction_support.get_report_debug_profile(
            interpretation_id,
        )

    def upgrade_to_pro(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Generate the migrated Pro placeholder report for an existing Lite record."""
        return self.report_lifecycle_manager.upgrade_to_pro(self, interpretation_id)

    def start_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Mark a Pro upgrade as started so the client can begin polling immediately."""
        return self.report_lifecycle_manager.start_pro_upgrade(interpretation_id)

    def complete_pro_upgrade(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Finish a previously started Pro upgrade."""
        return self.report_lifecycle_manager.complete_pro_upgrade(
            self,
            interpretation_id,
        )
