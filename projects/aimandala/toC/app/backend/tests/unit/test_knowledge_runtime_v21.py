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
from app.core.knowledge_runtime.repository import KnowledgeRepository
from app.core.knowledge_runtime.runtime import get_knowledge_runtime
from app.core.knowledge_runtime.validators import KnowledgePackValidator
from app.core.pipeline.data_models import InterpretationRecord
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.store import InterpretationStore, UnsupportedInterpretationSchemaError


def _reset_api_state():
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
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


def test_v21_narrative_service_builds_imbalance_projection():
    runtime = get_knowledge_runtime()

    projection = runtime.narrative_service.build_imbalance_projection(
        theme="wealth_career",
        imbalance_type="水多火灭",
        theme_label="财富事业",
    )

    assert "水多火灭" in projection["summary"]
    assert "恐惧压制行动" in projection["summary"]
    assert "72小时决策" in projection["direction"]
    assert "财富是能量的流动" in projection["healing_core"]
    assert "水多火灭" in projection["deeper_root"]
    assert "财富焦虑" in projection["core_root"]


def test_v21_narrative_service_builds_lite_projection():
    runtime = get_knowledge_runtime()

    projection = runtime.narrative_service.build_lite_narrative_projection(
        theme="general",
        theme_label="通用解读",
        inner_radius=35,
        middle_radius=67,
        title_templates={
            "inner_high": "{theme_label}里的守心者",
            "middle_high": "{theme_label}中的重连者",
            "default": "慢慢亮起来的中心",
            "general": "General-Theme-Title",
        },
        dominant_element="土",
        dominant_percentage=42.5,
        secondary_element="金",
        secondary_percentage=21.25,
        weakest_element="水",
        weakest_percentage=8.0,
        inner_dominant="火",
        middle_dominant="木",
        outer_dominant="金",
        circle_pattern="这说明你更像先稳住自己，再慢慢把外部秩序整理出来。",
        circle_readings=["内圈阅读", "中圈阅读", "外圈阅读"],
        transition="三圈依次呈现出「火 -> 木 -> 金」的变化。",
        adjacent=["内外节奏正在重新对齐"],
        signal="transition-overload",
        feeling_hint="这也和你最近画画时写下的感觉有关。",
        default_pro_teaser="默认 Pro 预告",
    )

    assert projection["title"] == "General-Theme-Title"
    assert "以「土」为主的底色" in projection["overall_impression"]
    assert "42.50%" in projection["visual_elements"]
    assert "内圈主导为「火」" in projection["visual_elements"]
    assert "内圈阅读；中圈阅读；外圈阅读。" in projection["visual_elements"]
    assert projection["story_angles"]["base"] == "你当前的生命能量基调"
    assert projection["story_angles"]["light"] == "你独特的内在资源与转变可能"
    assert "你的底色更接近「土」" in projection["story_sections"]["base"]
    assert "内外节奏正在重新对齐" in projection["story_sections"]["pattern"]
    assert "过渡期" in projection["theme_insights"]["awareness"]
    assert "重新整理自己" in projection["emotion_portrait"]
    assert "过渡期" in projection["emotion_portrait"]
    assert len(projection["three_awareness"]) == 3
    assert projection["three_awareness"][0]["title"] == "先安顿自己"
    assert "默认 Pro 预告" in projection["pro_teaser"]


def test_v21_narrative_service_builds_lite_title_variants():
    runtime = get_knowledge_runtime()

    inner_high = runtime.narrative_service.build_lite_narrative_projection(
        theme="general",
        theme_label="通用解读",
        inner_radius=42,
        middle_radius=66,
        title_templates={
            "inner_high": "{theme_label}里的守心者",
            "middle_high": "{theme_label}中的重连者",
            "default": "慢慢亮起来的中心",
        },
    )
    middle_high = runtime.narrative_service.build_lite_narrative_projection(
        theme="general",
        theme_label="通用解读",
        inner_radius=35,
        middle_radius=74,
        title_templates={
            "inner_high": "{theme_label}里的守心者",
            "middle_high": "{theme_label}中的重连者",
            "default": "慢慢亮起来的中心",
        },
    )

    assert inner_high["title"] == "通用解读里的守心者"
    assert middle_high["title"] == "通用解读中的重连者"


def test_v21_layer0_contains_structured_evidence(tmp_path):
    image_path = tmp_path / "knowledge-layer0.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (0, 255, 255), -1)
    cv2.circle(image, center, 90, (0, 200, 0), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.imwrite(str(image_path), image)

    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

    assert layer0.visual_facts["dominant_element"] in {"木", "火", "土", "金", "水"}
    assert layer0.knowledge_hits["circle_readings"]["inner"]
    assert layer0.rule_evaluations["imbalance_candidates"]
    assert layer0.theme_projection["theme_id"] == "wealth_career"
    assert isinstance(layer0.quality_flags, list)
    assert "used" in layer0.fallback_summary


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
