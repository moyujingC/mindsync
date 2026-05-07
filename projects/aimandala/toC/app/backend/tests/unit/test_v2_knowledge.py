"""Smoke tests for the migrated V2 knowledge package."""

import os
import sys

import cv2
import numpy as np

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.knowledge import KnowledgeQueryEngine, get_theme_summary, list_themes
from app.core.pipeline.data_models import InterpretationRecord
from app.core.pipeline import orchestrator_v2 as orchestrator_module
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator


def test_v2_knowledge_package_exposes_legacy_themes():
    themes = list_themes()

    assert "general" in themes
    assert "wealth_career" in themes
    assert "intimate_relationship" in themes

    summary = get_theme_summary("wealth_career")
    assert summary["name"] == "财富事业"
    assert "事业成就与价值感" in summary["core_issues"]


def test_v2_knowledge_query_engine_can_answer_basic_queries():
    engine = KnowledgeQueryEngine(version="toc")

    color_result = engine.get_color_meaning("红色", theme="general")
    circle_result = engine.get_circle_interpretation("内圈", "火", theme="general")
    trace = engine.evaluate_imbalance_trace(
        {
            "water": {"element": "水", "proportion": 0.42},
            "fire": {"element": "火", "proportion": 0.08},
            "wood": {"element": "木", "proportion": 0.20},
            "earth": {"element": "土", "proportion": 0.18},
            "metal": {"element": "金", "proportion": 0.12},
        },
        {"inner": "水", "middle": "水", "outer": "土"},
    )

    assert color_result.found is True
    assert circle_result.found is True
    assert trace["imbalance_trace"]["primary_candidates"]
    assert len(trace["imbalance_trace"]["all_candidates"]) == 20


def test_orchestrator_initializes_v2_knowledge_engine_and_builds_theme_context():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    assert orchestrator.knowledge_engine is not None

    context = orchestrator._build_theme_prompt_context(record)

    assert "当前主题：财富事业" in context
    assert "V2知识主题：财富事业" in context
    assert "V2主题核心议题：金钱信念与匮乏感 / 事业成就与价值感" in context


def test_orchestrator_lazily_initializes_compat_knowledge_engine(monkeypatch):
    created_versions = []

    class StubKnowledgeQueryEngine:
        def __init__(self, version="toc"):
            created_versions.append(version)

    monkeypatch.setattr(
        orchestrator_module,
        "KnowledgeQueryEngine",
        StubKnowledgeQueryEngine,
    )

    orchestrator = LayeredOrchestrator(enable_vision=False)

    assert created_versions == []
    assert isinstance(orchestrator.knowledge_engine, StubKnowledgeQueryEngine)
    assert created_versions == ["toc"]
    assert orchestrator.knowledge_engine is orchestrator.knowledge_engine
    assert created_versions == ["toc"]


def test_orchestrator_explicit_none_keeps_compat_knowledge_engine_disabled(monkeypatch):
    created_versions = []

    class StubKnowledgeQueryEngine:
        def __init__(self, version="toc"):
            created_versions.append(version)

    monkeypatch.setattr(
        orchestrator_module,
        "KnowledgeQueryEngine",
        StubKnowledgeQueryEngine,
    )

    orchestrator = LayeredOrchestrator(
        knowledge_engine=None,
        enable_vision=False,
    )

    assert orchestrator.knowledge_engine is None
    assert created_versions == []


def test_orchestrator_theme_context_uses_runtime_even_without_legacy_engine():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.knowledge_engine = None
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    context = orchestrator._build_theme_prompt_context(record)

    assert "当前主题：财富事业" in context
    assert "V2知识主题：财富事业" in context
    assert "V2主题核心议题：金钱信念与匮乏感 / 事业成就与价值感" in context


def test_orchestrator_element_meaning_uses_runtime_service():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    phrase = orchestrator._get_element_theme_phrase("wealth_career", "金")
    keywords = orchestrator._get_element_core_keywords("wealth_career", "金")

    assert phrase == "自我价值与专业成就"
    assert keywords == "价值、专业、精准"


def test_orchestrator_builds_knowledge_backed_layer0_for_valid_image(tmp_path):
    image_path = tmp_path / "knowledge-layer0.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (0, 255, 255), -1)
    cv2.circle(image, center, 90, (0, 200, 0), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.imwrite(str(image_path), image)

    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="general",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    layer0 = orchestrator._build_layer0_placeholder(record)

    assert layer0.circle_colors is not None
    assert layer0.circle_colors["inner"]["dominant_element"] == "fire"
    assert layer0.circle_colors["middle"]["dominant_element"] == "wood"
    assert layer0.circle_colors["outer"]["dominant_element"] == "earth"
    assert layer0.five_elements.fire["percentage"] > 0
    assert layer0.three_circles.inner["knowledge_reading"]
    assert layer0.color_analysis["element_distribution"]["fire"]["element"] == "火"
    rule_evaluations = layer0.rule_evaluations
    assert isinstance(rule_evaluations, dict)
    assert layer0.visual_analysis_basis["prompt_meta"]["source"]
    imbalance_trace = rule_evaluations.get("imbalance_trace", {})
    assert isinstance(imbalance_trace, dict)
    assert layer0.imbalance_candidates
    primary_candidates = imbalance_trace.get("primary_candidates") or [
        {"id": item} for item in layer0.imbalance_candidates
    ]
    assert layer0.imbalance_candidates == [item["id"] for item in primary_candidates]
    assert "used" in layer0.fallback_summary
    assert len(layer0.imbalance_candidates) >= 1


def test_lite_and_pro_texts_use_knowledge_backed_layer0(tmp_path):
    image_path = tmp_path / "knowledge-report.png"
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    center = (150, 150)
    cv2.circle(image, center, 130, (0, 255, 255), -1)
    cv2.circle(image, center, 90, (0, 200, 0), -1)
    cv2.circle(image, center, 45, (0, 0, 255), -1)
    cv2.imwrite(str(image_path), image)

    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="general",
        image_local_path=str(image_path),
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    record.layer_0_raw = orchestrator._build_layer0_placeholder(record)
    record.layer_0_raw.imbalance_candidates = ["transition-overload"]
    imbalance_trace = record.layer_0_raw.rule_evaluations.setdefault("imbalance_trace", {})
    imbalance_trace["primary_candidates"] = [
        {
            "id": "transition-overload",
            "category": "synthetic",
            "toc_supported": True,
            "score": 1.0,
            "selected_for_primary": True,
            "reason_codes": ["manual_override"],
        }
    ]
    imbalance_trace["synthetic_signal"] = {
        "id": "transition-overload",
        "used": True,
        "reason": "manual_override",
    }

    context = orchestrator._build_theme_prompt_context(record)
    layer1 = orchestrator._build_layer1_placeholder(record)
    record.layer_1_lite_draft = layer1
    record.layer_2_lite_final = orchestrator._build_lite_placeholder_report(record)
    layer3 = orchestrator._build_pro_placeholder_draft(record)

    assert "五行主导：" in context
    assert "三圈主导：" in context
    assert "知识库失衡候选：过渡负荷" in context
    assert "从逐圈观察看" in layer1.visual_elements
    assert "内圈主要呈现" in layer1.visual_elements
    assert "核心自我这一层" in layer3.three_circles_detailed["inner"]["reading"]
    assert "内圈主要呈现" in layer3.three_circles_detailed["inner"]["reading"]
    assert "能量不是散的" in layer3.micro_analysis_detailed["节奏关系"]
    assert "最先浮出来的是两股力量" in layer1.visual_elements
    assert "最里面这一层" in layer1.visual_elements
    assert "中间这一层" in layer1.visual_elements
    assert "过渡期" in layer1.emotion_portrait
    assert "给人的主感觉更偏" in layer3.three_circles_detailed["inner"]["reading"]
    assert layer3.three_circles_detailed["inner"]["reading"]
    assert "先看节奏" in layer3.micro_analysis_detailed["节奏关系"]
    assert "承接" in layer3.micro_analysis_detailed["节奏关系"]
    assert "过渡负荷" in layer3.imbalance_confirmed["summary"]
    assert "阶段迁移" in layer3.imbalance_confirmed["summary"]
