"""Smoke tests for the stage-based V2 knowledge package."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.knowledge import KnowledgeQueryEngine, get_theme_summary, list_themes
from app.core.knowledge_runtime.services.direct_judgment_service import DirectJudgmentService
from app.core.pipeline.data_models import InterpretationRecord, StageProcessPackage
from app.core.pipeline import orchestrator_v2 as orchestrator_module
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator


def test_v2_knowledge_package_exposes_themes():
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


def test_orchestrator_initializes_v2_knowledge_engine_and_builds_stage_prompt_context():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    assert orchestrator.knowledge_engine is not None

    package = orchestrator.stage_package_assembler.build(record, target_report="lite")
    payload = package.payload

    assert payload["process_contract"]["generation_mode"] == "stage_based_runtime"
    assert payload["stage-06-per-circle-element-generation-control"]["theme_summary"]["theme_name"] == "财富事业"
    assert "金钱信念与匮乏感" in payload["stage-06-per-circle-element-generation-control"]["theme_summary"]["core_issues"]


def test_orchestrator_lazily_initializes_compat_knowledge_engine(monkeypatch):
    created_versions = []

    class StubKnowledgeQueryEngine:
        def __init__(self, version="toc"):
            created_versions.append(version)

    monkeypatch.setattr(orchestrator_module, "KnowledgeQueryEngine", StubKnowledgeQueryEngine)
    orchestrator = LayeredOrchestrator(enable_vision=False)

    assert created_versions == []
    assert isinstance(orchestrator.knowledge_engine, StubKnowledgeQueryEngine)
    assert created_versions == ["toc"]
    assert orchestrator.knowledge_engine is orchestrator.knowledge_engine


def test_orchestrator_explicit_none_keeps_compat_knowledge_engine_disabled(monkeypatch):
    created_versions = []

    class StubKnowledgeQueryEngine:
        def __init__(self, version="toc"):
            created_versions.append(version)

    monkeypatch.setattr(orchestrator_module, "KnowledgeQueryEngine", StubKnowledgeQueryEngine)
    orchestrator = LayeredOrchestrator(knowledge_engine=None, enable_vision=False)

    assert orchestrator.knowledge_engine is None
    assert created_versions == []


def test_orchestrator_stage_prompt_context_uses_runtime_even_without_compat_engine():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    orchestrator.knowledge_engine = None
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    package = orchestrator.stage_package_assembler.build(record, target_report="lite")
    payload = package.payload

    assert payload["stage-01-user-input-context"]["theme_label"] == "财富事业"
    assert payload["stage-06-per-circle-element-generation-control"]["theme_summary"]["theme_name"] == "财富事业"


def test_stage_package_marks_missing_visual_evidence_incomplete():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    package = orchestrator.stage_package_assembler.build(record, target_report="lite")
    payload = package.payload

    assert payload["process_contract"]["package_status"] == "incomplete"
    assert "stage-03-visual-evidence" in payload["process_contract"]["incomplete_stages"]
    assert "pending_stage_runtime_replacement" not in str(payload)


def test_stage_package_couples_stage_05_to_07_to_runtime_knowledge_refs():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="wealth_career",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )
    record.stage_process_package = StageProcessPackage(
        payload={
            "process_contract": {
                "generation_mode": "stage_based_runtime",
                "target_report": "lite",
                "package_status": "placeholder",
            },
            "stage-03-visual-evidence": {
                "status": "complete",
                "global_visual_summary": "内圈红色集中，中圈绿色放射，外圈黄色包裹。",
                "circles": {
                    "inner": {
                        "visual_units": [
                            {
                                "color": "红色",
                                "shade": "bright",
                                "shape": "圆形",
                                "area_ratio": 0.36,
                                "description": "中心有红色圆形色块。",
                            }
                        ]
                    },
                    "middle": {
                        "visual_units": [
                            {
                                "color": "绿色",
                                "shade": "medium",
                                "shape": "条状",
                                "area_ratio": 0.34,
                                "description": "中圈绿色条状向外排列。",
                            }
                        ]
                    },
                    "outer": {
                        "visual_units": [
                            {
                                "color": "黄色",
                                "shade": "medium",
                                "shape": "包裹",
                                "area_ratio": 0.30,
                                "description": "外圈黄色形成包裹边界。",
                            }
                        ]
                    },
                },
                "evidence_refs": ["stage-03.visual.inner.0"],
            },
            "stage-04-direct-judgment-high-hit-check": {
                "status": "complete",
                "matches": [],
                "conflicts": [],
                "knowledge_refs": [],
            },
        }
    )

    package = orchestrator.stage_package_assembler.build(record, target_report="lite")
    payload = package.payload

    assert payload["process_contract"]["package_status"] == "formal"
    assert payload["process_contract"]["knowledge_ref_count"] >= 3
    for stage_key in [
        "stage-05-per-circle-color-shape-element-sensing",
        "stage-06-per-circle-element-generation-control",
        "stage-07-per-circle-imbalance-patterns",
    ]:
        refs = payload[stage_key]["knowledge_refs"]
        assert refs
        assert all("三圈五行流派解读方法与步骤.md" not in ref for ref in refs)
    assert payload["stage-12-healing-direction-and-report-branching"]["lite_writing_input"]


def test_direct_judgment_service_reads_runtime_rules():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    service = DirectJudgmentService(orchestrator.knowledge_runtime.repository)

    judgments = service.list_judgments()
    program_matches = service.match_programmatically(
        {
            "circles": {
                "outer": {
                    "visual_units": [
                        {
                            "id": "outer-red-001",
                            "color": "红色",
                            "area_ratio": 0.46,
                            "description": "外圈有成片红色填色区域。",
                        }
                    ]
                }
            }
        }
    )

    assert any(item["id"] == "direct_judgment.outer_red_mass" for item in judgments)
    assert program_matches
    assert program_matches[0]["knowledge_refs"] == ["direct_judgment.outer_red_mass"]
    assert program_matches[0]["visual_unit_refs"] == ["outer-red-001"]


def test_report_knowledge_adapter_element_meaning_uses_runtime_service():
    orchestrator = LayeredOrchestrator(enable_vision=False)

    phrase = orchestrator.report_knowledge_adapter.get_element_theme_phrase("wealth_career", "金")
    keywords = orchestrator.report_knowledge_adapter.get_element_core_keywords("wealth_career", "金")

    assert phrase == "自我价值与专业成就"
    assert keywords == "价值、专业、精准"


def test_primary_knowledge_signal_reads_stage_candidates():
    orchestrator = LayeredOrchestrator(enable_vision=False)
    record = InterpretationRecord(
        theme="general",
        stage_process_package=StageProcessPackage(
            payload={
                "stage-07-per-circle-imbalance-patterns": {
                    "candidates": [{"id": "transition-overload"}],
                }
            }
        ),
    )

    assert orchestrator.report_knowledge_adapter.get_primary_knowledge_signal(record) == "transition-overload"
    assert orchestrator.report_knowledge_adapter.get_signal_label("transition-overload") == "过渡负荷"
