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
from app.core.knowledge_runtime.runtime import get_knowledge_runtime
from app.core.knowledge_runtime.validators import KnowledgePackValidator
from app.core.pipeline.data_models import InterpretationRecord
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
from app.core.pipeline.store import InterpretationStore, UnsupportedInterpretationSchemaError


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
    assert "以「土」为主的底色" in projection["overall_impression"]
    assert "42.50%" in projection["visual_elements"]
    assert "内圈主导为「火」" in projection["visual_elements"]
    assert "内圈阅读；中圈阅读；外圈阅读。" in projection["visual_elements"]
    assert projection["six_insights"]["base"]["title"] == "你的底色：先稳住中心的人：你当前的生命能量基调"
    assert projection["six_insights"]["base"]["content"] == projection["story_sections"]["base"]
    assert projection["six_insights"]["light"]["title"] == "你的光：你已经知道什么更适合自己：你独特的内在资源与转变可能"
    assert projection["experiment"]["title"] == "曼曼的疗愈仪式：给自己一个稳稳的小空间"
    assert "今天先给自己十分钟" in projection["experiment"]["content"]
    assert "先给自己一点安全、稳定、接纳" in projection["experiment"]["content"]
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

    assert "「土」和「金」共同撑起了整张画的骨架" in projection["first_impression"]
    assert "Lite" not in projection["first_impression"]
    assert "《慢慢亮起来的中心》" not in projection["first_impression"]
    assert "42.50%" in projection["energy_essence"]
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
    assert "内圈代表核心自我当前约占 35%" in plan["legacy_projection"]["circle_readings"]["inner"]
    assert plan["legacy_projection"]["micro_sections"]["节奏关系"].startswith("圈间节奏首先显示")
    assert plan["legacy_projection"]["micro_sections"]["关系模式"].startswith("继续往外看")
    assert plan["legacy_projection"]["micro_sections"]["行动模式"].startswith("当前最明显的行动提示是")
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

    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

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
