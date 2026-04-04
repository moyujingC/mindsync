"""Unit tests for the minimal migrated V2 orchestrator shell."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.orchestrator_v2 import (
    GenerationStage,
    LayeredOrchestrator,
    PricingSnapshot,
)
from app.core.pipeline.store import InterpretationStore


def test_generation_stage_values():
    assert GenerationStage.PENDING == "pending"
    assert GenerationStage.DETECTING == "detecting"
    assert GenerationStage.ANALYZING == "analyzing"
    assert GenerationStage.GENERATING == "generating"
    assert GenerationStage.FINALIZING == "finalizing"
    assert GenerationStage.COMPLETED == "completed"
    assert GenerationStage.FAILED == "failed"


def test_pricing_snapshot_to_dict():
    snapshot = PricingSnapshot(lite=9.9, pro=49.0, upgrade_diff=39.1)

    assert snapshot.to_dict() == {
        "lite": 9.9,
        "pro": 49.0,
        "upgrade_diff": 39.1,
    }


def test_layered_orchestrator_exposes_fixed_pricing(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    orchestrator = LayeredOrchestrator(store=store, enable_vision=False)

    assert orchestrator.store is store
    assert orchestrator.enable_vision is False
    assert LayeredOrchestrator.get_supported_versions() == ("lite", "pro")
    assert LayeredOrchestrator.get_upgrade_diff() == 39.1

    pricing = LayeredOrchestrator.get_pricing()
    assert pricing.lite == 9.9
    assert pricing.pro == 49.0
    assert pricing.upgrade_diff == 39.1
