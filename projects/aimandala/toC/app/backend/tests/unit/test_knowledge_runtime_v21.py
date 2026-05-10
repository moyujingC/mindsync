"""Tests for the v2.1 knowledge runtime, pack assets, and legacy record handling."""

import json
import os
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
import yaml
from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.knowledge import KnowledgeQueryEngine
from app.core.knowledge_runtime.adapters.legacy_v2_python_pack import (
    LegacyV2PythonPackExporter,
)
from app.core.knowledge_runtime.checks import check_knowledge_pack_v21
from app.core.knowledge_runtime.compiler import KnowledgePackCompiler
from app.core.knowledge_runtime.paths import resolve_knowledge_toc_root
from app.core.knowledge_runtime.repository import KnowledgeRepository
from app.core.knowledge_runtime.runtime import create_knowledge_runtime, get_knowledge_runtime
from app.core.knowledge_runtime.validators import KnowledgePackValidator
from app.core.llm.runtime import NoopLLMClient
from app.core.pipeline.data_models import InterpretationRecord
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.store import InterpretationStore, UnsupportedInterpretationSchemaError

PROJECT_ROOT = Path(__file__).resolve().parents[5]


def _fixture_asset_path(name: str) -> str:
    return str(PROJECT_ROOT / "fixtures" / "toc-mvp" / "assets" / name)


def _reset_api_state():
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
    routes_v2._knowledge_workbench = None
    routes_v2._active_pro_upgrade_jobs.clear()
    shutil.rmtree(
        Path(__file__).resolve().parents[2] / "data",
        ignore_errors=True,
    )


def test_v21_exporter_and_compiler_generate_pack_and_index(tmp_path):
    pack_root = tmp_path / "packs" / "v2.1"
    build_dir = tmp_path / "builds" / "current"

    exporter = LegacyV2PythonPackExporter(pack_root=pack_root)
    exporter.export()

    validator = KnowledgePackValidator()
    compiler = KnowledgePackCompiler(
        pack_root=pack_root,
        build_dir=build_dir,
        validator=validator,
    )
    index_path = compiler.build()

    assert (pack_root / "manifest.yaml").exists()
    assert index_path.exists()

    manifest = yaml.safe_load((pack_root / "manifest.yaml").read_text(encoding="utf-8"))
    assert manifest["schema_version"] == "v2.1"
    assert "themes/wealth_career.yaml" in manifest["entries"]["themes"]
    assert "narrative/intimate_relationship.yaml" in manifest["entries"]["narrative"]
    assert "rules/direct_judgments.yaml" in manifest["entries"]["rules"]

    wealth_theme = yaml.safe_load(
        (pack_root / "themes" / "wealth_career.yaml").read_text(encoding="utf-8")
    )
    assert wealth_theme["payload"]["theme_name_cn"] == "财富事业"
    assert "事业成就与价值感" in wealth_theme["payload"]["core_issues"]

    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["schema_version"] == "v2.1"
    assert "general" in index["stats"]["theme_ids"]
    assert "wealth_career" in index["stats"]["theme_ids"]
    assert "intimate_relationship" in index["stats"]["theme_ids"]
    assert index["assets"]["rules"]["rule.imbalance_types"]["payload"]["imbalances"]["水多火灭"]["warning"]
    assert "rule.direct_judgments" in index["assets"]["rules"]
    assert (
        index["assets"]["rules"]["rule.direct_judgments"]["payload"]["source_of_truth"]["path"]
        == "projects/aimandala/docs/sources/知识库构建/直断法高命中模式.md"
    )
    assert "rule.healing_issue_mappings" in index["assets"]["rules"]
    quality = index["stats"]["quality"]
    assert quality["theme_mapping_coverage"]["general"]["mapped_count"] == len(
        index["stats"]["toc_supported_imbalances"]
    )
    assert quality["healing_lookup_coverage"]["general"]["fallback_risk"] == "low"
    assert quality["healing_lookup_coverage"]["general"]["mapped_count"] == len(
        index["stats"]["toc_supported_imbalances"]
    )
    assert any(
        item["imbalance_id"] == "水多火灭"
        for item in quality["high_risk_warning_paths"]
    )
    assert not any(
        item["kind"] in {"healing_issue_mapping_gap", "healing_issue_target_missing"}
        for item in quality["fallback_hotspots"]
    )


def test_v21_check_reports_clean_state():
    report = check_knowledge_pack_v21()

    assert report.ok is True
    assert report.differences == []
    assert any("packs/v2.1" in path for path in report.checked_paths)
    assert report.warnings == []
    assert not any(
        item["kind"] in {"healing_issue_mapping_gap", "healing_issue_target_missing"}
        for item in report.fallback_hotspots
    )


def test_v21_runtime_paths_resolve_in_local_and_container_layouts(tmp_path):
    local_file = tmp_path / "toC" / "app" / "backend" / "app" / "core" / "knowledge_runtime" / "validators.py"
    container_file = tmp_path / "app" / "backend" / "app" / "core" / "knowledge_runtime" / "validators.py"

    for toc_root, source_file, create_data_root in (
        (local_file.parents[5], local_file, True),
        (container_file.parents[4], container_file, False),
    ):
        if create_data_root:
            (toc_root / "data" / "knowledge" / "packs" / "v2.1").mkdir(
                parents=True,
                exist_ok=True,
            )
        schema_dir = toc_root / "domain" / "knowledge" / "schemas"
        schema_dir.mkdir(parents=True, exist_ok=True)
        (schema_dir / "knowledge_pack.schema.json").write_text("{}", encoding="utf-8")

        assert resolve_knowledge_toc_root(source_file) == toc_root


def test_v21_compiler_rebuilds_when_pack_changes(tmp_path):
    pack_root = tmp_path / "packs" / "v2.1"
    build_dir = tmp_path / "builds" / "current"

    exporter = LegacyV2PythonPackExporter(pack_root=pack_root)
    exporter.export()

    compiler = KnowledgePackCompiler(
        pack_root=pack_root,
        build_dir=build_dir,
        validator=KnowledgePackValidator(),
    )
    index_path = compiler.build()
    original = index_path.read_text(encoding="utf-8")

    general_theme = pack_root / "themes" / "general.yaml"
    payload = yaml.safe_load(general_theme.read_text(encoding="utf-8"))
    payload["payload"]["description"] = "updated by rebuild test"
    general_theme.write_text(
        yaml.safe_dump(payload, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )

    compiler.ensure_index()
    rebuilt = index_path.read_text(encoding="utf-8")

    assert original != rebuilt
    assert "updated by rebuild test" in rebuilt


def test_v21_query_engine_returns_structured_query_result():
    runtime = get_knowledge_runtime()
    repository = runtime.repository
    assert isinstance(repository, KnowledgeRepository)
    assert repository.get_manifest()["schema_version"] == "v2.1"

    engine = KnowledgeQueryEngine(version="toc")
    circle_result = engine.get_circle_interpretation("内圈", "火", theme="general")
    imbalance_result = engine.get_imbalance_detail("水多火灭")

    assert circle_result.found is True
    assert circle_result.entity_id == "circle.内圈"
    assert circle_result.source_pack == "v2.1"
    assert circle_result.fallback_level == "none"
    assert circle_result.evidence[0]["source_path"] == "circles/three_circles.yaml"

    assert imbalance_result.found is True
    assert imbalance_result.entity_id == "imbalance.水多火灭"
    assert imbalance_result.value["warning"]
    assert imbalance_result.evidence[0]["source_path"] == "rules/imbalance_types.yaml"


def test_v21_query_engine_exposes_transition_overload_as_supported_imbalance():
    engine = KnowledgeQueryEngine(version="toc")

    result = engine.get_imbalance_detail("transition-overload")

    assert result.found is True
    assert result.fallback_level == "none"
    assert result.entity_id == "imbalance.transition-overload"
    assert result.value["type"] == "transition-overload"
    assert result.value["warning"] is None
    assert result.evidence[0]["source_path"] == "rules/imbalance_types.yaml"


def test_v21_healing_plan_uses_structured_issue_mapping():
    engine = KnowledgeQueryEngine(version="toc")

    result = engine.get_healing_plan("水多火灭", theme="wealth_career")

    assert result.found is True
    assert result.fallback_level == "none"
    assert result.value["issue_type"] == "财富焦虑"
    assert result.value["imbalance"] == "水多火灭"
    evidence_paths = [item["source_path"] for item in result.evidence]
    assert "rules/healing_issue_mappings.yaml" in evidence_paths
    assert "healing/wealth_career.yaml" in evidence_paths
    assert result.warnings == []


def test_v21_healing_plan_resolves_transition_overload_for_wealth_career():
    engine = KnowledgeQueryEngine(version="toc")

    result = engine.get_healing_plan("transition-overload", theme="wealth_career")

    assert result.found is True
    assert result.fallback_level == "none"
    assert result.value["issue_type"] == "事业停滞"
    assert result.value["imbalance"] == "transition-overload"
    evidence_paths = [item["source_path"] for item in result.evidence]
    assert "rules/healing_issue_mappings.yaml" in evidence_paths
    assert "healing/wealth_career.yaml" in evidence_paths
    assert result.warnings == []


def test_v21_healing_plan_resolves_transition_overload_for_intimate_relationship():
    engine = KnowledgeQueryEngine(version="toc")

    result = engine.get_healing_plan("transition-overload", theme="intimate_relationship")

    assert result.found is True
    assert result.fallback_level == "none"
    assert result.value["issue_type"] == "沟通障碍"
    assert result.value["imbalance"] == "transition-overload"
    evidence_paths = [item["source_path"] for item in result.evidence]
    assert "rules/healing_issue_mappings.yaml" in evidence_paths
    assert "healing/intimate_relationship.yaml" in evidence_paths
    assert result.warnings == []


def test_v21_theme_color_interpretation_supports_theme_circle_schema():
    runtime = get_knowledge_runtime()

    middle = runtime.theme_service.get_theme_color_interpretation(
        "wealth_career",
        "金",
        "中白",
        "middle",
    )
    middle_cn = runtime.theme_service.get_theme_color_interpretation(
        "wealth_career",
        "金",
        "中白",
        "中圈",
    )

    assert middle["interpretation"] == "当下财务规划良好，既有纪律性也懂得变通"
    assert middle["manifestation"] == "能够制定并执行财务计划，同时保持开放的心态"
    assert middle["healing"] == "在保持纪律的基础上，培养更多的灵活性，提升财务决策的智慧"
    assert middle_cn == middle



def test_v21_narrative_service_exposes_stage_safe_helpers():
    runtime = create_knowledge_runtime(build_selector="current", llm_client=NoopLLMClient())

    narrative = runtime.narrative_service.query_narrative("wealth_career")
    assert narrative.found is True
    assert narrative.entity_id == "narrative.wealth_career"
    assert runtime.narrative_service.get_theme_label("wealth_career") == "财富事业"
    assert runtime.narrative_service.get_signal_label("transition-overload") == "过渡负荷"
    assert "过渡期" in runtime.narrative_service.describe_signal("transition-overload")
    assert runtime.narrative_service.get_element_theme_phrase("wealth_career", "金") == "自我价值与专业成就"
    assert runtime.narrative_service.get_element_core_keywords("wealth_career", "金") == "价值、专业、精准"


def test_v21_narrative_service_builds_ai_qa_context_without_report_plan_generation():
    runtime = create_knowledge_runtime(build_selector="current", llm_client=NoopLLMClient())
    pro_draft = type(
        "ProDraft",
        (),
        {
            "first_impression": "你正在重新整理推进节奏。",
            "core_insight_table": {"能量本质": "先稳住再向外"},
            "healing_suggestions": [{"practice": "今天只完成一个低压力动作。"}],
        },
    )()

    context = runtime.narrative_service.build_ai_qa_context(
        record_theme="wealth_career",
        interpretation_id="interp-1",
        lite_title="看见此刻的自己",
        lite_overall_impression="你正在确认下一步怎么更稳。",
        pro_draft=pro_draft,
    )

    assert "主题名称：财富事业" in context
    assert "Lite 标题：看见此刻的自己" in context
    assert "第一眼直觉：你正在重新整理推进节奏。" in context
    assert "可执行建议：今天只完成一个低压力动作。" in context


def test_v21_imbalance_service_separates_tutorial_state_from_scoring_state():
    runtime = get_knowledge_runtime()

    trace = runtime.imbalance_service.evaluate_imbalance_trace(
        color_analysis={
            "wood": {"element": "木", "proportion": 0.42},
            "fire": {"element": "火", "proportion": 0.08},
            "earth": {"element": "土", "proportion": 0.20},
            "metal": {"element": "金", "proportion": 0.18},
            "water": {"element": "水", "proportion": 0.12},
        },
        circle_elements={"inner": "木", "middle": "木", "outer": "土"},
        version="toc",
    )

    states = {item["element"]: item for item in trace["element_states"]}

    assert states["木"]["tutorial_state"]["state"] == "balanced"
    assert states["木"]["scoring_state"]["state"] == "excess"
    assert states["火"]["tutorial_state"]["state"] == "deficient"
    assert states["火"]["scoring_state"]["state"] == "deficient"
    assert states["木"]["tutorial_state"]["evidence_basis"]["proportion_source"] == (
        "tutorial_weighted_element_distribution"
    )
    assert states["木"]["scoring_state"]["evidence_basis"]["proportion_source"] == (
        "runtime_weighted_element_distribution"
    )


def test_v21_imbalance_service_emits_full_trace_but_filters_primary_candidates():
    runtime = get_knowledge_runtime()

    trace = runtime.imbalance_service.evaluate_imbalance_trace(
        color_analysis={
            "water": {"element": "水", "proportion": 0.42},
            "fire": {"element": "火", "proportion": 0.08},
            "wood": {"element": "木", "proportion": 0.20},
            "earth": {"element": "土", "proportion": 0.18},
            "metal": {"element": "金", "proportion": 0.12},
        },
        circle_elements={"inner": "水", "middle": "水", "outer": "土"},
        version="toc",
    )

    all_candidates = trace["imbalance_trace"]["all_candidates"]
    primary_ids = [item["id"] for item in trace["imbalance_trace"]["primary_candidates"]]

    assert len(all_candidates) == 20
    assert "水多火灭" in primary_ids
    assert all(item["score"] >= 0.0 for item in all_candidates)
    assert any(not item["toc_supported"] for item in all_candidates)
    assert all(item["toc_supported"] for item in trace["imbalance_trace"]["primary_candidates"])
    assert trace["imbalance_trace"]["synthetic_signal"]["used"] is False


def test_v21_imbalance_service_uses_transition_signal_only_when_no_primary_candidate():
    runtime = get_knowledge_runtime()

    trace = runtime.imbalance_service.evaluate_imbalance_trace(
        color_analysis={
            "wood": {"element": "木", "proportion": 0.22},
            "fire": {"element": "火", "proportion": 0.21},
            "earth": {"element": "土", "proportion": 0.19},
            "metal": {"element": "金", "proportion": 0.18},
            "water": {"element": "水", "proportion": 0.20},
        },
        circle_elements={"inner": "木", "middle": "火", "outer": "水"},
        version="toc",
    )

    primary_ids = [item["id"] for item in trace["imbalance_trace"]["primary_candidates"]]

    assert primary_ids == ["transition-overload"]
    assert trace["imbalance_trace"]["synthetic_signal"]["used"] is True
    assert trace["imbalance_trace"]["synthetic_signal"]["id"] == "transition-overload"


def test_store_rejects_legacy_schema_record(tmp_path):
    store = InterpretationStore(storage_dir=str(tmp_path / "interpretations"))
    legacy_id = "legacy-record"
    legacy_path = Path(store.storage_dir) / f"{legacy_id}.json"
    legacy_path.write_text(
        json.dumps(
            {
                "interpretation_id": legacy_id,
                "user_id": "user-legacy",
                "theme": "general",
                "created_at": "2026-04-11T00:00:00",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    try:
        store.load(legacy_id)
    except UnsupportedInterpretationSchemaError as error:
        assert "unsupported interpretation schema" in str(error)
    else:  # pragma: no cover - defensive assertion
        raise AssertionError("expected UnsupportedInterpretationSchemaError")


def test_api_returns_410_for_legacy_record():
    from app.api.main import app

    _reset_api_state()
    data_dir = Path(__file__).resolve().parents[2] / "data" / "interpretations"
    data_dir.mkdir(parents=True, exist_ok=True)
    legacy_id = "legacy-route-record"
    (data_dir / f"{legacy_id}.json").write_text(
        json.dumps(
            {
                "interpretation_id": legacy_id,
                "user_id": "legacy-user",
                "theme": "general",
                "created_at": "2026-04-11T00:00:00",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    client = TestClient(app)
    response = client.get(f"/api/v2/interpretations/{legacy_id}")

    assert response.status_code == 410
    assert "unsupported interpretation schema" in response.json()["detail"]

