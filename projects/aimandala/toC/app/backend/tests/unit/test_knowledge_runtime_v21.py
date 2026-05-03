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


def test_v21_narrative_service_builds_imbalance_narrative_basis():
    runtime = get_knowledge_runtime()

    basis = runtime.narrative_service.build_imbalance_narrative_basis(
        theme="wealth_career",
        imbalance_type="水多火灭",
        theme_label="财富事业",
    )

    assert basis["mode"] == "imbalance_basis"
    assert basis["imbalance_type"] == "水多火灭"
    assert basis["sections"]["summary"]["content"]
    assert "rule:imbalance:水多火灭" in basis["sections"]["summary"]["trace"]["rule_refs"]
    assert "财富事业" in basis["sections"]["summary"]["content"]


def test_v21_narrative_service_builds_theme_prompt_context():
    runtime = get_knowledge_runtime()

    context = runtime.narrative_service.build_theme_prompt_context(
        theme="wealth_career",
        theme_label="财富事业",
        painting_intention="想知道怎么更稳定地往前",
        painting_feeling="有点想冲，但也有点卡",
        inner_radius=35,
        middle_radius=67,
        dominant_element="土",
        dominant_percentage=42.5,
        secondary_element="金",
        secondary_percentage=21.25,
        inner_dominant="火",
        middle_dominant="木",
        outer_dominant="金",
        signal="transition-overload",
        element_distribution=[
            {"name": "土", "percentage": 42.5},
            {"name": "金", "percentage": 21.25},
            {"name": "火", "percentage": 18.0},
            {"name": "木", "percentage": 10.25},
            {"name": "水", "percentage": 8.0},
        ],
        element_states={
            "earth": {
                "element": "土",
                "proportion": 0.425,
                "state": "excess",
                "evidence_basis": ["weighted_distribution"],
            },
            "metal": {
                "element": "金",
                "proportion": 0.2125,
                "state": "balanced",
                "evidence_basis": ["weighted_distribution"],
            },
            "water": {
                "element": "水",
                "proportion": 0.08,
                "state": "deficient",
                "evidence_basis": ["weighted_distribution"],
            },
        },
        triad_states=[
            {
                "circle": "inner",
                "dominant_element": "火",
                "inferred_state": "active",
                "source_hit": "circles.inner",
            },
            {
                "circle": "middle",
                "dominant_element": "木",
                "inferred_state": "growing",
                "source_hit": "circles.middle",
            },
            {
                "circle": "outer",
                "dominant_element": "金",
                "inferred_state": "boundary",
                "source_hit": "circles.outer",
            },
        ],
        primary_candidates=[
            {
                "id": "水多火灭",
                "score": 0.76,
                "selected_for_primary": True,
            }
        ],
        synthetic_signal={
            "id": "transition-overload",
            "used": False,
            "reason": "toc_primary_candidate_available",
        },
        theme_projection={
            "theme": "wealth_career",
            "summary": "当前主题更聚焦金钱信念与价值感。",
        },
        fidelity_flags=["trace:toc_only_candidate_present"],
        fallback_summary={"used": False, "levels": [], "warnings": []},
    )

    assert "当前主题：财富事业" in context
    assert "创作前意图：想知道怎么更稳定地往前" in context
    assert "创作时感受：有点想冲，但也有点卡" in context
    assert "内圈半径：35%" in context
    assert "中圈半径：67%" in context
    assert "五行主导：土 42.50%，其次是 金 21.25%" in context
    assert "三圈主导：内圈火 / 中圈木 / 外圈金" in context
    assert "知识库失衡候选：过渡负荷" in context
    assert "V2知识主题：财富事业" in context
    assert "V2主题核心议题：金钱信念与匮乏感 / 事业成就与价值感" in context
    assert "五行分布：" in context
    assert "五行状态：" in context
    assert "土=excess" in context
    assert "水=deficient" in context
    assert "三元结构：" in context
    assert "inner:火(active)" in context
    assert "主候选：" in context
    assert "水多火灭" in context
    assert "合成信号：" in context
    assert "theme_projection：" in context
    assert "保真标记：" in context
    assert "trace:toc_only_candidate_present" in context
    assert "fallback摘要：" in context


def test_v21_narrative_service_exposes_helper_apis():
    runtime = get_knowledge_runtime()
    service = runtime.narrative_service

    assert service.get_theme_label("wealth_career", fallback_label="整体") == "财富事业"
    assert service.get_signal_label("transition-overload") == "过渡负荷"
    assert "过渡期" in service.describe_signal("transition-overload")
    assert service.get_element_theme_phrase("wealth_career", "金") == "自我价值与专业成就"
    assert service.get_element_core_keywords("wealth_career", "金") == "价值、专业、精准"
    assert (
        service.describe_circle_transition(
            inner_dominant="火",
            middle_dominant="木",
            outer_dominant="金",
        )
        == "三圈依次呈现出「火 -> 木 -> 金」的变化。"
    )
    assert service.clean_text_block("💡 第一行\n\n👉 第二行") == "第一行\n\n第二行"


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
        six_insight_templates={
            "base": {
                "title": "你的底色：先稳住中心的人",
                "content": "Base {theme_label}",
                "summary": "Base Summary",
            },
            "light": {
                "title": "你的光：你已经知道什么更适合自己",
                "content": "Light {theme_label}",
                "summary": "Light Summary",
            },
        },
        experiment_title="曼曼的疗愈仪式：给自己一个稳稳的小空间",
        experiment_content="今天先给自己十分钟，练习回到画里的节奏。",
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
    assert "把节奏调整到：先稳住节奏，再让变化分段落地" in projection["overall_impression"]
    assert "把节奏调整到「先稳住节奏，再让变化分段落地」" in projection["visual_elements"]
    assert "「金」想把事情重新带回现实" not in projection["visual_elements"]
    assert "内圈阅读；中圈阅读。" in projection["visual_elements"]
    assert projection["six_insights"]["base"]["title"] == "你的底色：先稳住中心的人：你当前的生命能量基调"
    assert projection["six_insights"]["base"]["content"] == projection["story_sections"]["base"]
    assert projection["six_insights"]["light"]["title"] == "你的光：你已经知道什么更适合自己：你独特的内在资源与转变可能"
    assert projection["experiment"]["title"] == "曼曼的疗愈仪式：给自己一个稳稳的小空间"
    assert "今天先给自己十分钟" in projection["experiment"]["content"]
    assert "先给自己一点安全、稳定、接纳" in projection["experiment"]["content"]
    assert projection["story_angles"]["base"] == "你当前的生命能量基调"
    assert projection["story_angles"]["light"] == "你独特的内在资源与转变可能"
    assert "站稳在内在的根基与安全感上" in projection["story_sections"]["base"]
    assert "内外节奏正在重新对齐" in projection["story_sections"]["pattern"]
    assert "过渡期" in projection["theme_insights"]["awareness"]
    assert "重新有把握了再动" in projection["emotion_portrait"]
    assert "过渡期" in projection["emotion_portrait"]
    assert len(projection["three_awareness"]) == 3
    assert projection["three_awareness"][0]["title"] == "先安顿自己"
    assert "默认 Pro 预告" in projection["pro_teaser"]


def test_v21_narrative_service_builds_lite_narrative_plan():
    runtime = get_knowledge_runtime()

    plan = runtime.narrative_service.build_lite_narrative_plan(
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
        six_insight_templates={
            "base": {
                "title": "你的底色：先稳住中心的人",
                "content": "Base {theme_label}",
                "summary": "Base Summary",
            },
            "light": {
                "title": "你的光：你已经知道什么更适合自己",
                "content": "Light {theme_label}",
                "summary": "Light Summary",
            },
        },
        experiment_title="曼曼的疗愈仪式：给自己一个稳稳的小空间",
        experiment_content="今天先给自己十分钟，练习回到画里的节奏。",
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

    assert plan["mode"] == "lite"
    assert plan["generation_mode"] == "evidence_first"
    evidence_summary = plan["evidence_trace_summary"]
    assert evidence_summary["direct_judgment_refs"]
    assert evidence_summary["color_analysis_refs"]
    assert evidence_summary["shape_analysis_refs"]
    assert evidence_summary["circle_relation_refs"]
    assert evidence_summary["tutorial_source_refs"]
    assert plan["sections"]["title"]["content"] == "General-Theme-Title"
    assert plan["sections"]["lite_healing_guidance"]["content"]["directions"]
    assert plan["sections"]["pro_report_entry"]["content"]["title"] == "另一份更深的独立报告"
    assert plan["legacy_projection"]["pro_teaser"]
    assert "signal:transition-overload" in plan["sections"]["overall_impression"]["trace"]["rule_refs"]


def test_v21_narrative_service_builds_pro_projection():
    runtime = get_knowledge_runtime()

    projection = runtime.narrative_service.build_pro_narrative_projection(
        theme="wealth_career",
        theme_label="财富事业",
        lite_title="慢慢亮起来的中心",
        lite_contradiction="一边想继续，一边又先收回来。",
        lite_block="快要出手前，总会先停一下。",
        intention="想知道怎么更稳定地往前",
        feeling_hint="这也和你最近画画时写下的感觉有关。",
        dominant_element="土",
        dominant_percentage=42.5,
        secondary_element="金",
        secondary_percentage=21.25,
        weakest_element="水",
        weakest_percentage=8.0,
        signal="transition-overload",
        primary_imbalance="恐惧压制行动",
        transition="三圈依次呈现出「火 -> 木 -> 金」的变化。",
        circles={
            "inner": {
                "meaning": "内圈代表核心自我",
                "radius_percent": 35,
                "dominant": "火",
                "colors": ["红色", "橙色"],
                "knowledge_reading": "内圈显示你还在确认内在安全感",
            },
            "middle": {
                "meaning": "中圈代表关系模式",
                "radius_percent": 67,
                "dominant": "木",
                "colors": ["绿色"],
                "knowledge_reading": "中圈说明你正在调整与外界的连接方式",
            },
            "outer": {
                "meaning": "外圈代表外部表达",
                "radius_percent": 100,
                "dominant": "金",
                "colors": ["白色"],
                "knowledge_reading": "外圈显示你开始重整边界和秩序",
            },
        },
        adjacent=["内外节奏正在重新对齐", "外部表达开始寻找新的边界"],
        wrap=["先把行动拆成可以承接的小步子"],
        narrative_templates={
            "core_direction": "先稳住中心感，再把能量逐步放回{theme_label}相关的关系、行动与表达，而不是一次性全部打开。",
            "core_healing": "通过边界、身体感受和稳定的小步行动，重建“我可以安全地往前走”的内在体验。",
            "micro_rhythm": "默认节奏描述。",
            "micro_relationship": "默认关系描述。",
            "micro_action": "默认行动描述。",
            "surface_root_without_intention": "{lite_contradiction}最近的外部任务与内部恢复节奏不一致。",
            "surface_root_with_intention": "{lite_contradiction}你原本希望“{intention}”，但现实推进方式和这个期待之间还存在落差。",
            "root_deeper": "默认 deeper。",
            "root_core": "默认 core。",
        },
        structure_labels={
            "micro_rhythm": "节奏关系",
            "micro_relationship": "关系模式",
            "micro_action": "行动模式",
        },
        circle_fallbacks={
            "inner": "内圈 fallback",
            "middle": "中圈 fallback",
            "outer": "外圈 fallback",
        },
        imbalance_projection={
            "contradiction": "明明很想往前，却又总在最后一步先收回来",
            "manifestation": "现实里会在快要行动时突然犹豫",
            "direction": "先把行动拆成能承接的小单位",
            "healing_core": "把承载感放在速度前面",
            "deeper_root": "更深一层是你还在确认自己能不能稳稳接住变化",
            "core_root": "核心根因是对失控的担心还没有真正放松",
        },
    )

    assert "再把下一步调整成「先把行动拆成能承接的小单位」" in projection["first_impression"]
    assert "Lite" not in projection["first_impression"]
    assert "《慢慢亮起来的中心》" not in projection["first_impression"]
    assert "行动节奏调整成「先把行动拆成能承接的小单位」" in projection["energy_essence"]
    assert "恐惧压制行动让你很难一边往前推进" in projection["block_point"]


def test_v21_narrative_service_builds_pro_narrative_plan():
    runtime = get_knowledge_runtime()

    plan = runtime.narrative_service.build_pro_narrative_plan(
        theme="wealth_career",
        theme_label="财富事业",
        lite_title="慢慢亮起来的中心",
        lite_contradiction="一边想继续，一边又先收回来。",
        lite_block="快要出手前，总会先停一下。",
        intention="想知道怎么更稳定地往前",
        feeling_hint="这也和你最近画画时写下的感觉有关。",
        dominant_element="土",
        dominant_percentage=42.5,
        secondary_element="金",
        secondary_percentage=21.25,
        weakest_element="水",
        weakest_percentage=8.0,
        signal="transition-overload",
        primary_imbalance="恐惧压制行动",
        transition="三圈依次呈现出「火 -> 木 -> 金」的变化。",
        circles={
            "inner": {
                "meaning": "内圈代表核心自我",
                "radius_percent": 35,
                "dominant": "火",
                "colors": ["红色", "橙色"],
                "knowledge_reading": "内圈显示你还在确认内在安全感",
            },
            "middle": {
                "meaning": "中圈代表关系模式",
                "radius_percent": 67,
                "dominant": "木",
                "colors": ["绿色"],
                "knowledge_reading": "中圈说明你正在调整与外界的连接方式",
            },
            "outer": {
                "meaning": "外圈代表外部表达",
                "radius_percent": 100,
                "dominant": "金",
                "colors": ["白色"],
                "knowledge_reading": "外圈显示你开始重整边界和秩序",
            },
        },
        adjacent=["内外节奏正在重新对齐", "外部表达开始寻找新的边界"],
        wrap=["先把行动拆成可以承接的小步子"],
        narrative_templates={
            "core_direction": "先稳住中心感，再把能量逐步放回{theme_label}相关的关系、行动与表达，而不是一次性全部打开。",
            "core_healing": "通过边界、身体感受和稳定的小步行动，重建“我可以安全地往前走”的内在体验。",
            "micro_rhythm": "默认节奏描述。",
            "micro_relationship": "默认关系描述。",
            "micro_action": "默认行动描述。",
            "surface_root_without_intention": "{lite_contradiction}最近的外部任务与内部恢复节奏不一致。",
            "surface_root_with_intention": "{lite_contradiction}你原本希望“{intention}”，但现实推进方式和这个期待之间还存在落差。",
            "root_deeper": "默认 deeper。",
            "root_core": "默认 core。",
        },
        structure_labels={
            "micro_rhythm": "节奏关系",
            "micro_relationship": "关系模式",
            "micro_action": "行动模式",
        },
        circle_fallbacks={
            "inner": "内圈 fallback",
            "middle": "中圈 fallback",
            "outer": "外圈 fallback",
        },
        imbalance_projection={
            "contradiction": "明明很想往前，却又总在最后一步先收回来",
            "manifestation": "现实里会在快要行动时突然犹豫",
            "direction": "先把行动拆成能承接的小单位",
            "healing_core": "把承载感放在速度前面",
            "deeper_root": "更深一层是你还在确认自己能不能稳稳接住变化",
            "core_root": "核心根因是对失控的担心还没有真正放松",
        },
    )

    assert plan["mode"] == "pro"
    assert plan["generation_mode"] == "evidence_first"
    evidence_summary = plan["evidence_trace_summary"]
    assert evidence_summary["direct_judgment_refs"]
    assert evidence_summary["color_analysis_refs"]
    assert evidence_summary["shape_analysis_refs"]
    assert evidence_summary["circle_relation_refs"]
    assert evidence_summary["tutorial_source_refs"]
    assert plan["sections"]["first_impression"]["content"]
    assert "Lite" not in plan["sections"]["first_impression"]["content"]
    assert "慢慢亮起来的中心" not in plan["sections"]["first_impression"]["content"]
    assert plan["sections"]["healing_suggestions"]["content"]
    assert plan["sections"]["core_insight_table"]["content"]["疗愈核心"]
    assert "signal:transition-overload" in plan["sections"]["block_point"]["trace"]["rule_refs"]
    assert "先把行动拆成能承接的小单位" in plan["legacy_projection"]["direction"]
    assert "把承载感放在速度前面" in plan["legacy_projection"]["healing_core"]
    assert "内圈代表核心自我这一层当前约占 35%" in plan["legacy_projection"]["circle_readings"]["inner"]
    assert plan["legacy_projection"]["micro_sections"]["节奏关系"].startswith("先看节奏")
    assert plan["legacy_projection"]["micro_sections"]["关系模式"].startswith("再往外看")
    assert plan["legacy_projection"]["micro_sections"]["行动模式"].startswith("落到行动上")
    assert "你原本希望“想知道怎么更稳定地往前”" in plan["legacy_projection"]["root_cause"]["surface"]
    assert plan["legacy_projection"]["root_cause"]["deeper"] == "更深一层是你还在确认自己能不能稳稳接住变化"
    assert plan["legacy_projection"]["root_cause"]["core"] == "核心根因是对失控的担心还没有真正放松"


def test_v21_narrative_plan_compresses_per_circle_depth_state():
    runtime = get_knowledge_runtime()
    method_trace = {
        "direct_judgment": {},
        "per_circle_color_analysis": {
            "inner": {
                "circle_label": "内圈",
                "dominant_element": "火",
                "dominant_color": "红色",
                "state_basis": {
                    "area_ratio": 0.1225,
                    "avg_brightness": 68.0,
                    "avg_saturation": 0.72,
                    "depth_state": "deep",
                    "fill_state": "dense",
                },
            },
            "middle": {
                "circle_label": "中圈",
                "dominant_element": "木",
                "dominant_color": "绿色",
                "state_basis": {
                    "area_ratio": 0.3264,
                    "avg_brightness": 142.0,
                    "avg_saturation": 0.44,
                    "depth_state": "middle",
                    "fill_state": "filled",
                },
            },
            "outer": {
                "circle_label": "外圈",
                "dominant_element": "金",
                "dominant_color": "白色",
                "state_basis": {
                    "area_ratio": 0.5511,
                    "avg_brightness": 210.0,
                    "avg_saturation": 0.08,
                    "depth_state": "light",
                    "fill_state": "mixed",
                },
            },
        },
        "shape_analysis": {},
        "circle_relation_analysis": {},
        "final_algorithm_basis": {},
    }

    lite_plan = runtime.narrative_service.build_lite_narrative_plan(
        theme="general",
        theme_label="全面解读",
        dominant_element="土",
        secondary_element="金",
        weakest_element="水",
        inner_dominant="火",
        middle_dominant="木",
        outer_dominant="金",
        interpretation_method_trace=method_trace,
    )
    pro_plan = runtime.narrative_service.build_pro_narrative_plan(
        theme="wealth_career",
        theme_label="财富事业",
        dominant_element="土",
        secondary_element="金",
        weakest_element="水",
        interpretation_method_trace=method_trace,
        circles={
            "inner": {"dominant": "火", "knowledge_reading": "内圈显示核心自我较热。"},
            "middle": {"dominant": "木", "knowledge_reading": "中圈显示关系正在伸展。"},
            "outer": {"dominant": "金", "knowledge_reading": "外圈显示边界开始变清楚。"},
        },
    )

    lite_summary = lite_plan["evidence_trace_summary"]["per_circle_color_summary"]
    lite_observation = lite_plan["evidence_trace_summary"]["per_circle_observation_summary"]
    pro_summary = pro_plan["evidence_trace_summary"]["per_circle_color_summary"]
    pro_observation = pro_plan["evidence_trace_summary"]["per_circle_observation_summary"]
    lite_visual = lite_plan["sections"]["visual_elements"]["content"]
    pro_circles = pro_plan["sections"]["three_circles_detailed"]["content"]

    assert "内圈" in lite_summary
    assert "中圈" in lite_summary
    assert "外圈" in lite_summary
    assert "偏深" in lite_summary
    assert "偏浅" in lite_summary
    assert "面积约" in lite_summary
    assert "红色" in lite_summary
    assert "内圈" in lite_observation
    assert "中圈" in lite_observation
    assert "外圈" in lite_observation
    assert "偏深" in lite_observation
    assert "偏浅" in lite_observation
    assert "面积约" in lite_observation
    assert "红色" not in lite_observation
    assert "逐圈深浅依据" not in lite_visual
    assert "#" not in lite_visual
    assert "。；" not in lite_visual
    assert "。。" not in lite_visual
    assert lite_observation in lite_visual
    assert "逐圈深浅依据" not in pro_circles["inner"]
    assert "红色" not in pro_circles["inner"]
    assert pro_observation not in pro_circles["inner"]
    assert pro_summary not in pro_circles["inner"]
    assert "内圈" in pro_circles["inner"]
    assert "偏深" in pro_circles["inner"]
    assert "中圈" not in pro_circles["inner"]
    assert "外圈" not in pro_circles["inner"]


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
    assert inner_high["six_insights"] == {}
    assert inner_high["experiment"] == {"title": "", "content": ""}


def test_v21_layer0_contains_structured_evidence(tmp_path):
    image_path = tmp_path / "knowledge-layer0.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (0, 255, 255), -1)
    cv2.circle(image, center, 90, (0, 200, 0), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.imwrite(str(image_path), image)

    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {
                "global_visual_summary": "内圈以红色为主，中圈偏绿色，外圈偏黄色。",
                "per_circle_summary": {
                    "inner": "内圈以红色为主。",
                    "middle": "中圈偏绿色。",
                    "outer": "外圈偏黄色。",
                },
                "confidence": 0.9,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="wealth_career",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

    assert layer0.input_package["image"]["image_ref"]
    assert not Path(layer0.input_package["image"]["image_ref"]).is_absolute()
    assert layer0.input_package["topic_input"] == {
        "topic": "wealth_career",
        "topic_label": "财富事业",
    }
    assert layer0.input_package["circle_config"]["inner_radius"] == 35
    assert layer0.input_package["circle_config"]["middle_radius"] == 67
    visual_basis = layer0.visual_analysis_basis
    assert "knowledge_hits" not in visual_basis
    assert "imbalance_trace" not in visual_basis
    assert "element_states" not in visual_basis
    assert "llm_color_observation" in visual_basis
    assert "program_color_measurement" in visual_basis
    assert "direct_judgment_hits" in visual_basis
    assert set(visual_basis["circles"]) == {"inner", "middle", "outer"}
    assert visual_basis["circle_band_metrics"]["inner"]["band_ratio"] == 0.35
    assert visual_basis["circle_band_metrics"]["middle"]["band_ratio"] == 0.32
    assert visual_basis["circle_band_metrics"]["outer"]["band_ratio"] == 0.33
    assert visual_basis["prompt_meta"]["prompt_version"] == "visual-analysis-basis.v1"
    assert "#" not in visual_basis["global_visual_summary"]
    assert "filled" not in visual_basis["global_visual_summary"]
    assert "middle" not in visual_basis["global_visual_summary"]
    catalog_ids = [
        item["judgment_id"] for item in visual_basis["direct_judgment_hits"]["catalog_items"]
    ]
    assert visual_basis["direct_judgment_hits"]["catalog_version"] == "merged-manual6-runtime9.v1"
    assert len(catalog_ids) == 10
    assert "large_yellow_mass" not in catalog_ids
    assert "outer_decorative_fragmented" in catalog_ids
    assert "heavy_dark_filled" in catalog_ids
    assert "light_pale_whitish" in catalog_ids
    for circle in visual_basis["circles"].values():
        assert circle["observation_summary"]
        assert set(circle) >= {
            "palette",
            "color_stats",
            "shape_features",
            "composition",
            "brushwork",
            "blocks",
        }
        assert circle["palette"]["canonical_color_labels"]
        assert 1 <= len(circle["blocks"]) <= 5
        for block in circle["blocks"]:
            assert set(block) >= {
                "llm_color_label",
                "program_color",
                "shape",
                "mass_ratio",
                "position",
                "edge_contour",
                "brushwork",
                "adjacent_relations",
                "white_source",
            }
            assert set(block["program_color"]) >= {"hex", "rgb"}
    assert layer0.visual_facts["input_package"] == layer0.input_package
    assert layer0.visual_facts["visual_analysis_basis"] == layer0.visual_analysis_basis
    assert layer0.visual_facts["dominant_element"] in {"木", "火", "土", "金", "水"}
    assert layer0.knowledge_hits["circle_readings"]["inner"]
    assert layer0.rule_evaluations["element_states"]
    assert layer0.rule_evaluations["triad_states"]
    assert layer0.rule_evaluations["imbalance_trace"]["all_candidates"]
    assert layer0.rule_evaluations["imbalance_trace"]["primary_candidates"]
    assert "used" in layer0.rule_evaluations["imbalance_trace"]["synthetic_signal"]
    method_trace = layer0.rule_evaluations["interpretation_method_trace"]
    assert set(method_trace) == {
        "direct_judgment",
        "per_circle_color_analysis",
        "shape_analysis",
        "circle_relation_analysis",
        "final_algorithm_basis",
    }
    assert set(method_trace["per_circle_color_analysis"]) == {"inner", "middle", "outer"}
    for circle_key, circle_analysis in method_trace["per_circle_color_analysis"].items():
        assert circle_analysis["circle"] == circle_key
        assert circle_analysis["dominant_element"] in {"木", "火", "土", "金", "水"}
        assert circle_analysis["colors"]
        assert circle_analysis["state_basis"]["source"] == "tutorial_color_area_depth"
    for element_state in layer0.rule_evaluations["element_states"]:
        assert element_state["tutorial_state"]["state"] in {"excess", "balanced", "deficient"}
        assert element_state["tutorial_state"]["thresholds"] == {
            "excess": 0.5,
            "deficient": 0.1,
        }
        assert "scoring_state" in element_state
    for triad_state in layer0.rule_evaluations["triad_states"]:
        assert triad_state["tutorial_state"] in {"excess", "balanced", "deficient", "unknown"}
        assert triad_state["source_hit"].startswith("circle:")
    assert layer0.visual_facts["interpretation_method_trace"] == method_trace
    assert layer0.theme_projection["theme_id"] == "wealth_career"
    assert isinstance(layer0.fidelity_flags, list)
    assert layer0.quality_flags == layer0.fidelity_flags
    assert "used" in layer0.fallback_summary


def test_v21_layer0_global_visual_summary_prefers_multimodal_then_program_confirmation():
    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            assert task == "vision"
            assert image_path
            return {
                "global_visual_summary": (
                    "内圈以蓝色为主并夹有白色镂空；"
                    "中圈以粉色为主并带有白色留空；"
                    "外圈以粉色、紫色和白色为主，紫色色块量感更重。"
                ),
                "per_circle_summary": {
                    "inner": "内圈以蓝色为主并夹有白色镂空。",
                    "middle": "中圈以粉色为主并带有白色留空。",
                    "outer": "外圈以粉色、紫色和白色为主，紫色色块量感更重。",
                },
                "per_circle_color_labels": {
                    "inner": ["蓝色", "白色"],
                    "middle": ["粉色", "白色"],
                    "outer": ["粉色", "紫色", "白色"],
                },
                "per_circle_color_roles": {
                    "inner": {
                        "primary_colors": ["蓝色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["蓝色"],
                                "shape": "莲花花瓣",
                                "color_pattern": "纯色",
                                "relative_position": "围绕中心向外展开",
                            }
                        ],
                    },
                    "middle": {
                        "primary_colors": ["粉色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["粉色"],
                                "shape": "花朵",
                                "color_pattern": "纯色",
                                "relative_position": "位于中圈主体区域",
                            }
                        ],
                    },
                    "outer": {
                        "primary_colors": ["粉色", "紫色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["粉色", "紫色"],
                                "shape": "外扩花瓣",
                                "color_pattern": "纯色",
                                "relative_position": "沿外圈向外扩展",
                            }
                        ],
                    },
                },
                "confidence": 0.93,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=_fixture_asset_path("sample01.jpg"),
        three_circles={"inner_radius": 46, "middle_radius": 72},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)
    visual_basis = layer0.visual_analysis_basis

    assert visual_basis["global_visual_summary"].startswith("内圈以蓝色为主")
    assert visual_basis["llm_color_observation"]["source"] == "llm_vision_then_program_confirmation"
    assert visual_basis["llm_color_observation"]["confidence"] == 0.93
    assert (
        visual_basis["prompt_meta"]["source"]
        == "llm_vision_then_program_confirmation"
    )
    assert (
        visual_basis["prompt_meta"]["confirmation_source"]
        == "program_segmented_block_measurement"
    )
    assert (
        visual_basis["program_color_measurement"]["source"]
        == "program_segmented_block_measurement"
    )
    assert visual_basis["prompt_meta"]["model_role"] == "multimodal_visual_observer"
    assert visual_basis["circles"]["inner"]["observation_summary"] == "主色为蓝色，能看到白色留白，显著图形包括蓝色莲花花瓣（纯色，围绕中心向外展开）。"
    assert visual_basis["circles"]["middle"]["observation_summary"] == "主色为粉色，能看到白色留白，显著图形包括粉色花朵（纯色，位于中圈主体区域）。"
    assert (
        visual_basis["circles"]["outer"]["observation_summary"]
        == "主色为粉色、紫色，能看到白色留白，显著图形包括粉色、紫色外扩花瓣（纯色，沿外圈向外扩展）。"
    )
    assert visual_basis["circles"]["inner"]["palette"]["canonical_color_labels"] == ["蓝色", "白色"]
    assert visual_basis["circles"]["middle"]["palette"]["canonical_color_labels"] == ["粉色", "白色"]
    assert visual_basis["circles"]["outer"]["palette"]["canonical_color_labels"] == ["粉色", "紫色", "白色"]
    assert visual_basis["circles"]["inner"]["palette"]["llm_color_roles"]["primary_colors"] == ["蓝色"]
    assert visual_basis["circles"]["outer"]["palette"]["llm_color_roles"]["shape_color_pairs"][0]["shape"] == "外扩花瓣"
    assert visual_basis["prompt_meta"]["validation_status"] == "passed"
    assert visual_basis["prompt_meta"]["validation_detail"]["circle_color_consistency"] is True


def test_v21_layer0_warns_when_vision_circle_colors_conflict_with_program_measurement(tmp_path):
    image_path = tmp_path / "knowledge-layer0-vision-conflict.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (220, 190, 230), -1)
    cv2.circle(image, center, 90, (235, 205, 235), -1)
    cv2.circle(image, center, 45, (235, 210, 180), -1)
    cv2.imwrite(str(image_path), image)

    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {
                "global_visual_summary": "内圈绿色，中圈咖色，外圈咖色。",
                "per_circle_summary": {
                    "inner": "内圈以绿色为主。",
                    "middle": "中圈以咖色为主。",
                    "outer": "外圈以咖色为主。",
                },
                "per_circle_color_labels": {
                    "inner": ["绿色"],
                    "middle": ["咖色"],
                    "outer": ["咖色"],
                },
                "per_circle_color_roles": {
                    "inner": {
                        "primary_colors": ["绿色"],
                        "accent_colors": [],
                        "white_presence": "none",
                        "shape_color_pairs": [
                            {
                                "colors": ["绿色"],
                                "shape": "团块",
                                "color_pattern": "纯色",
                                "relative_position": "位于内圈中心区域",
                            }
                        ],
                    },
                    "middle": {
                        "primary_colors": ["咖色"],
                        "accent_colors": [],
                        "white_presence": "none",
                        "shape_color_pairs": [
                            {
                                "colors": ["咖色"],
                                "shape": "团块",
                                "color_pattern": "纯色",
                                "relative_position": "位于中圈主体区域",
                            }
                        ],
                    },
                    "outer": {
                        "primary_colors": ["咖色"],
                        "accent_colors": [],
                        "white_presence": "none",
                        "shape_color_pairs": [
                            {
                                "colors": ["咖色"],
                                "shape": "团块",
                                "color_pattern": "纯色",
                                "relative_position": "位于外圈主体区域",
                            }
                        ],
                    },
                },
                "confidence": 0.91,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=_fixture_asset_path("sample01.jpg"),
        three_circles={"inner_radius": 46, "middle_radius": 72},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)
    visual_basis = layer0.visual_analysis_basis

    assert layer0.layer0_passed is True
    assert layer0.layer0_failure_reason == ""
    assert visual_basis["prompt_meta"]["source"] == "llm_vision_then_program_confirmation"
    assert visual_basis["prompt_meta"]["validation_status"] == "warning"
    assert visual_basis["prompt_meta"]["failure_reason"] == ""
    assert visual_basis["prompt_meta"]["validation_detail"]["circle_color_consistency"] is False
    assert visual_basis["prompt_meta"]["validation_detail"]["mismatched_circles"] == [
        "inner",
        "middle",
        "outer",
    ]
    assert visual_basis["global_visual_summary"] == "内圈绿色，中圈咖色，外圈咖色。"
    assert visual_basis["circles"]["inner"]["observation_summary"] == "主色为绿色，显著图形包括绿色团块（纯色，位于内圈中心区域）。"
    assert visual_basis["circles"]["middle"]["observation_summary"] == "主色为咖色，显著图形包括咖色团块（纯色，位于中圈主体区域）。"
    assert visual_basis["circles"]["outer"]["observation_summary"] == "主色为咖色，显著图形包括咖色团块（纯色，位于外圈主体区域）。"
    assert visual_basis["circles"]["inner"]["palette"]["canonical_color_labels"] == ["绿色"]
    assert visual_basis["circles"]["middle"]["palette"]["canonical_color_labels"] == ["咖色"]
    assert visual_basis["circles"]["outer"]["palette"]["canonical_color_labels"] == ["咖色"]
    assert visual_basis["llm_color_observation"]["source"] == "llm_vision_then_program_confirmation"
    assert visual_basis["program_color_measurement"]["source"] == "program_segmented_block_measurement"


def test_v21_layer0_uses_deterministic_visual_summary_when_vision_unavailable(
    tmp_path,
):
    image_path = tmp_path / "knowledge-layer0-vision-fallback.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (0, 255, 255), -1)
    cv2.circle(image, center, 90, (0, 200, 0), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.imwrite(str(image_path), image)

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = NoopLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)
    visual_basis = layer0.visual_analysis_basis

    assert layer0.layer0_passed is True
    assert layer0.layer0_failure_reason == ""
    assert layer0.layer0_failure_detail == {}
    assert layer0.input_package["image"]["image_ref"]
    assert visual_basis["prompt_meta"]["source"] == "deterministic_visual_observation"
    assert visual_basis["prompt_meta"]["failure_reason"] == ""
    assert visual_basis["prompt_meta"]["vision_unavailable"] is False
    assert visual_basis["program_color_measurement"]["source"] == "program_segmented_block_measurement"
    assert visual_basis["global_visual_summary"]
    assert visual_basis["llm_color_observation"]["source"] == "deterministic_visual_observation"
    assert visual_basis["llm_color_observation"]["summary"]
    assert visual_basis["direct_judgment_hits"]["hits"]
    assert layer0.visual_facts["visual_analysis_basis"] == visual_basis
    assert layer0.fallback_summary["used"] is False
    assert layer0.fallback_summary["levels"] == []
    assert layer0.fallback_summary["warnings"] == []
    for circle in visual_basis["circles"].values():
        assert circle["observation_summary"] != "未观察到足够依据"
        assert circle["shape_features"]["boundary_style"]
        assert circle["shape_features"]["boundary_style"] != "未观察到足够依据"
        assert circle["brushwork"]["stroke_quality"]
        assert circle["brushwork"]["stroke_quality"] != "未观察到足够依据"


def test_v21_layer0_requests_compact_multimodal_visual_prompt(tmp_path):
    image_path = tmp_path / "knowledge-layer0-vision-compact.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (200, 180, 220), -1)
    cv2.circle(image, center, 90, (220, 200, 210), -1)
    cv2.circle(image, center, 45, (170, 200, 220), -1)
    cv2.imwrite(str(image_path), image)

    captured: dict[str, object] = {}

    class FakeVisionLLMClient:
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            captured["task"] = task
            captured["prompt"] = prompt
            captured["schema"] = schema
            captured["image_path"] = image_path
            return {
                "global_visual_summary": "内圈蓝白，中圈粉白，外圈紫白。",
                "per_circle_summary": {
                    "inner": "内圈蓝白。",
                    "middle": "中圈粉白。",
                    "outer": "外圈紫白。",
                },
                "per_circle_color_labels": {
                    "inner": ["蓝色", "白色"],
                    "middle": ["粉色", "白色"],
                    "outer": ["紫色", "白色"],
                },
                "per_circle_color_roles": {
                    "inner": {
                        "primary_colors": ["蓝色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["蓝色"],
                                "shape": "莲花花瓣",
                                "color_pattern": "纯色",
                                "relative_position": "围绕中心向外展开",
                            }
                        ],
                    },
                    "middle": {
                        "primary_colors": ["粉色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["粉色"],
                                "shape": "花朵",
                                "color_pattern": "纯色",
                                "relative_position": "位于中圈主体区域",
                            }
                        ],
                    },
                    "outer": {
                        "primary_colors": ["紫色"],
                        "accent_colors": [],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["紫色"],
                                "shape": "花瓣",
                                "color_pattern": "纯色",
                                "relative_position": "沿外圈向外扩展",
                            }
                        ],
                    },
                },
                "confidence": 0.88,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    orchestrator._build_layer0_placeholder(record)

    prompt = str(captured.get("prompt") or "")
    assert captured["task"] == "vision"
    assert captured["image_path"] == str(image_path)
    assert "请分别写内圈、中圈、外圈各一句" in prompt
    assert "每句只写主要颜色、白色/留白、最显著形状" in prompt
    assert "主色" in prompt
    assert "点缀色" in prompt
    assert "white_presence" in prompt
    assert "shape_color_pairs" in prompt
    assert "不要把黑色线框单独当作轮廓色" in prompt
    assert "如果看到淡红或红到淡红的渐变，优先归为红色，不要轻易写成粉色" in prompt
    assert "如果更接近莲花花瓣，就直接写莲花花瓣" in prompt
    assert "黄色花朵如果整体纯黄色、靠近花蕊有留白，要明确写出来" in prompt
    assert "relative_position" in prompt
    assert "尝试描述色块之间的相对位置" in prompt
    assert "per_circle_color_labels" in json.dumps(captured["schema"], ensure_ascii=False)
    assert "per_circle_color_roles" in json.dumps(captured["schema"], ensure_ascii=False)
    assert "请同时给出每圈的颜色标签列表" in prompt
    assert "程序提色参考" not in prompt


def test_v21_layer0_can_build_circle_summaries_from_llm_roles_without_per_circle_summary():
    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            assert task == "vision"
            return {
                "global_visual_summary": "画面以红、黄、绿、白为主，整体对称。",
                "per_circle_color_labels": {
                    "inner": ["红色", "黄色", "白色"],
                    "middle": ["黄色", "红色", "绿色", "白色"],
                    "outer": ["绿色", "红色", "黄色", "白色"],
                },
                "per_circle_color_roles": {
                    "inner": {
                        "primary_colors": ["红色", "黄色"],
                        "accent_colors": ["白色"],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["红色"],
                                "shape": "莲花花瓣",
                                "color_pattern": "渐变色",
                                "relative_position": "围绕中心向外展开",
                            }
                        ],
                    },
                    "middle": {
                        "primary_colors": ["黄色", "红色"],
                        "accent_colors": ["绿色", "白色"],
                        "white_presence": "visible",
                        "shape_color_pairs": [
                            {
                                "colors": ["红色", "黄色"],
                                "shape": "花朵",
                                "color_pattern": "纯色",
                                "relative_position": "红色花瓣形边框里包着黄色花朵",
                            }
                        ],
                    },
                    "outer": {
                        "primary_colors": ["绿色", "红色"],
                        "accent_colors": ["黄色", "白色"],
                        "white_presence": "prominent",
                        "shape_color_pairs": [
                            {
                                "colors": ["绿色"],
                                "shape": "叶子",
                                "color_pattern": "纯色",
                                "relative_position": "沿外圈向外展开",
                            }
                        ],
                    },
                },
                "confidence": 0.9,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=_fixture_asset_path("sample02.jpg"),
        three_circles={"inner_radius": 33, "middle_radius": 66},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)
    visual_basis = layer0.visual_analysis_basis

    assert layer0.layer0_passed is True
    assert visual_basis["circles"]["inner"]["observation_summary"] == "主色为红色、黄色，点缀色为白色，能看到白色留白，显著图形包括红色莲花花瓣（渐变色，围绕中心向外展开）。"
    assert visual_basis["circles"]["middle"]["observation_summary"] == "主色为黄色、红色，点缀色为绿色、白色，能看到白色留白，显著图形包括红色、黄色花朵（纯色，红色花瓣形边框里包着黄色花朵）。"
    assert visual_basis["circles"]["outer"]["observation_summary"] == "主色为绿色、红色，点缀色为黄色、白色，白色留白很明显，显著图形包括绿色叶子（纯色，沿外圈向外展开）。"


def test_v21_layer0_input_package_image_ref_prefers_projects_relative_path():
    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {
                "global_visual_summary": "内圈蓝白，中圈粉白，外圈紫白。",
                "per_circle_summary": {
                    "inner": "内圈蓝白。",
                    "middle": "中圈粉白。",
                    "outer": "外圈紫白。",
                },
                "confidence": 0.9,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=_fixture_asset_path("sample01.jpg"),
        three_circles={"inner_radius": 46, "middle_radius": 72},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

    assert (
        layer0.input_package["image"]["image_ref"]
        == "projects/aimandala/fixtures/toc-mvp/assets/sample01.jpg"
    )


def test_v21_layer0_counts_white_as_normal_visual_blocks(tmp_path):
    image_path = tmp_path / "knowledge-layer0-white.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (235, 235, 235), -1)
    cv2.circle(image, center, 90, (255, 255, 255), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.circle(image, center, 90, (255, 255, 255), 18, -1)
    cv2.imwrite(str(image_path), image)

    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {
                "global_visual_summary": "内圈红白，中圈白色明显，外圈白色为主。",
                "per_circle_summary": {
                    "inner": "内圈红白。",
                    "middle": "中圈白色明显。",
                    "outer": "外圈白色为主。",
                },
                "confidence": 0.9,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

    all_blocks = [
        block
        for circle in layer0.visual_analysis_basis["circles"].values()
        for block in circle["blocks"]
    ]
    white_blocks = [block for block in all_blocks if block["llm_color_label"] == "白色"]

    assert white_blocks
    assert any(block["white_source"] != "none" for block in white_blocks)
    assert any(block["mass_ratio"] > 0 for block in white_blocks)
    assert any(
        "白色" in circle["palette"]["canonical_color_labels"]
        for circle in layer0.visual_analysis_basis["circles"].values()
    )


def test_v21_layer0_sample01_prefers_segmented_circle_blocks_and_calibrated_image_ref():
    class FakeVisionLLMClient(NoopLLMClient):
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            return {
                "global_visual_summary": "内圈蓝白，中圈粉白，外圈粉紫白。",
                "per_circle_summary": {
                    "inner": "内圈蓝白。",
                    "middle": "中圈粉白。",
                    "outer": "外圈粉紫白。",
                },
                "confidence": 0.93,
            }

    runtime = create_knowledge_runtime()
    runtime.layer0_assembler.llm_client = FakeVisionLLMClient()
    orchestrator = LayeredOrchestrator(enable_vision=False, knowledge_runtime=runtime)
    record = InterpretationRecord(
        theme="general",
        image_local_path=_fixture_asset_path("sample01.jpg"),
        painting_intention="",
        painting_feeling="",
        three_circles={"inner_radius": 46, "middle_radius": 72},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)
    input_package = layer0.input_package
    visual_basis = layer0.visual_analysis_basis

    assert (
        input_package["image"]["image_ref"]
        == "projects/aimandala/fixtures/toc-mvp/assets/sample01.jpg"
    )
    assert input_package["circle_config"]["source"] == "user_calibrated"

    inner = visual_basis["circles"]["inner"]
    middle = visual_basis["circles"]["middle"]
    outer = visual_basis["circles"]["outer"]

    assert set(inner["palette"]["canonical_color_labels"]) == {"蓝色", "白色"}
    assert set(middle["palette"]["canonical_color_labels"]) == {"粉色", "白色"}
    assert set(outer["palette"]["canonical_color_labels"]) == {"粉色", "紫色", "白色"}
    assert {block["llm_color_label"] for block in inner["blocks"]} == {"蓝色", "白色"}
    assert {block["llm_color_label"] for block in middle["blocks"]} == {"粉色", "白色"}
    assert {block["llm_color_label"] for block in outer["blocks"]} == {"粉色", "紫色", "白色"}

    assert "绿色" not in inner["palette"]["canonical_color_labels"]
    assert "咖色" not in middle["palette"]["canonical_color_labels"]
    assert "咖色" not in outer["palette"]["canonical_color_labels"]

    for circle in [inner, middle, outer]:
        assert 1 <= len(circle["blocks"]) <= 5
        for block in circle["blocks"]:
            assert set(block) >= {
                "llm_color_label",
                "program_color",
                "mass_ratio",
                "shape",
                "position",
                "edge_contour",
                "brushwork",
                "adjacent_relations",
                "white_source",
                "repeat_pattern",
                "repeat_count",
            }
            assert set(block["position"]) >= {
                "region_label",
                "anchor_band_position",
                "radial_role",
                "symmetry_hint",
            }
            assert not any(
                key in block["position"]
                for key in {"x_ratio", "y_ratio", "radius_ratio", "coordinate_summary"}
            )

    all_blocks = [
        block
        for circle in [inner, middle, outer]
        for block in circle["blocks"]
    ]
    white_blocks = [block for block in all_blocks if block["llm_color_label"] == "白色"]
    assert white_blocks
    assert any(block["white_source"] in {"paper_blank", "hollow_gap"} for block in white_blocks)
    assert any(
        isinstance(block.get("repeat_count"), (int, str))
        for block in all_blocks
    )


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
