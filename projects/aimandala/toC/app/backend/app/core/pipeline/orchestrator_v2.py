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

    def analyze_energy_flow(
        inner_elements: list,
        middle_elements: list,
        outer_elements: list,
    ) -> Dict[str, Any]:
        return {}

from .data_models import InterpretationRecord
from .generation_runtime import (
    DeterministicReportGenerationRuntime,
    PromptBackedReportGenerationRuntime,
)
from .prompt_runtime import PromptRuntime
from .report_generation_contracts import ReportGenerationRuntime
from .report_pipeline_components import install_report_pipeline_components
from .report_pipeline_stage_config import ReportPipelineStageConfig
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
        pro=39.0,
        # Kept only for legacy V2 response compatibility. Product semantics remain
        # "independent purchase" unless a later decision explicitly changes them.
        upgrade_diff=39.1,
    )

    def __init__(
        self,
        knowledge_engine: Any = _UNSET,
        knowledge_runtime: Any = _UNSET,
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
        self._knowledge_runtime_explicit = knowledge_runtime is not _UNSET
        if knowledge_runtime is _UNSET:
            self.knowledge_runtime = (
                get_knowledge_runtime() if get_knowledge_runtime is not None else None
            )
        else:
            self.knowledge_runtime = knowledge_runtime
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
        install_report_pipeline_components(
            self,
            extract_colors_by_circles=extract_colors_by_circles,
            analyze_energy_flow=analyze_energy_flow,
            stages=ReportPipelineStageConfig(
                detecting=GenerationStage.DETECTING.value,
                generating=GenerationStage.GENERATING.value,
                processing=GenerationStage.GENERATING.value,
                completed=GenerationStage.COMPLETED.value,
            ),
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
        """Compatibility entrypoint that now runs the formal Lite generation path."""
        result = await self.insight_agent.generate_lite_report(
            self,
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
            check_existing=check_existing,
        )
        return result.record

    def _hash_image(self, image_path: str) -> str:
        return self.report_lite_record_workflow.hash_image(image_path)

    def _normalize_circle_payload(self, circle_payload: Dict[str, int]) -> Dict[str, int]:
        return self.report_lite_record_workflow.normalize_circle_payload(circle_payload)

    def get_report(
        self,
        interpretation_id: str,
        version: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return the best available formal report view for one record."""
        return self.insight_agent.get_report(
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
        result = self.insight_agent.answer_report_question(
            interpretation_id,
            message=message,
            history=history,
        )
        return result.to_dict() if result is not None else None

    def get_status(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a compact status snapshot for polling clients."""
        return self.report_lifecycle_manager.get_status(interpretation_id)

    def get_report_debug_profile(self, interpretation_id: str) -> Optional[Dict[str, Any]]:
        """Return a development-only profile of how the current report was produced."""
        return self.insight_agent.get_report_debug_profile(
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
        result = self.insight_agent.generate_pro_report(
            self,
            interpretation_id,
        )
        return result.status_payload if result is not None else None

    def fulfill_direct_pro_purchase(
        self,
        interpretation_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Generate Pro after a direct Pro purchase without using upgrade semantics."""
        return self.report_lifecycle_manager.fulfill_direct_pro_purchase(
            self,
            interpretation_id,
        )
