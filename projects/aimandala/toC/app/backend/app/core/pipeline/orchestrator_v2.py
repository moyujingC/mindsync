"""Minimal V2 orchestrator skeleton for the AI-Mandala To C migration."""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

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
        enable_vision: bool = True,
    ) -> None:
        self.knowledge_engine = knowledge_engine
        self.store = store or InterpretationStore()
        self.enable_vision = enable_vision

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

