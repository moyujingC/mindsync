"""Baseline tests for the native mandala interpretation agent path."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent
from app.core.mandala_interpretation_agent.contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.knowledge_pack_builder import (
    KnowledgePackBuilder,
)
from app.core.mandala_interpretation_agent.quality_gate import run_quality_gate
from app.core.wealth_report import get_wealth_report_runtime


class StubMandalaLLMClient:
    def __init__(self) -> None:
        self.structured_calls: list[dict] = []
        self.text_calls: list[dict] = []
        self.last_attempt_trace = [{"model": "stub", "result": "ok"}]

    def generate_structured(self, **kwargs):
        self.structured_calls.append(kwargs)
        return {
            "global_visual_summary": "内圈收束，中圈有拉扯，外圈留白明显。",
            "circles": {
                "inner": {
                    "summary": "内圈收束。",
                    "visual_units": [
                        {
                            "id": "inner-001",
                            "position": "中心",
                            "color": "蓝色",
                            "shape": "圆形",
                            "visible_evidence": "内圈蓝色圆形。",
                        }
                    ],
                },
                "middle": {
                    "summary": "中圈有拉扯。",
                    "visual_units": [
                        {
                            "id": "middle-001",
                            "position": "中圈",
                            "color": "粉色",
                            "shape": "花瓣",
                            "visible_evidence": "中圈粉色花瓣。",
                        }
                    ],
                },
                "outer": {
                    "summary": "外圈留白明显。",
                    "visual_units": [
                        {
                            "id": "outer-001",
                            "position": "外圈",
                            "color": "白色",
                            "shape": "边界",
                            "visible_evidence": "外圈白色边界。",
                        }
                    ],
                },
            },
            "evidence_summary": ["内圈蓝色圆形", "中圈粉色花瓣", "外圈白色边界"],
            "uncertainties": [],
        }

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        if len(self.text_calls) == 1:
            return json.dumps(
                {
                    "core_thesis": "核心主轴是先稳住，再推进。",
                    "user_facing_framing": "先从能接住的小步开始。",
                    "healing_direction": "先确认承接，再逐步打开。",
                    "evidence_refs": ["inner-001", "middle-001", "outer-001"],
                },
                ensure_ascii=False,
            )
        return "先稳住，再推进。"


def _agent_input(tmp_path: Path, *, theme: str = "wealth") -> MandalaAgentInput:
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme=theme,
            theme_label="财富议题",
            painting_intention="想看财富为何总卡住",
            painting_feeling="有点紧",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def test_mandala_agent_produces_complete_path_artifacts(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    theme_entries = knowledge_pack["entries"]["theme"]
    assert theme_entries["wealth_emergent_topic_translation"]["status"] == "loaded"
    assert "emergent_topic: relationship" in theme_entries["wealth_emergent_topic_translation"]["text"]
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    assert result.agent_output["status"] == "complete"
    assert result.agent_input["user_context"]["theme"] == "wealth"
    assert result.knowledge_pack["theme"] == "wealth"
    assert result.stage_outputs["stage-06-per-circle-element-generation-control"]["theme"] == "wealth"
    assert result.stage_outputs["stage-12-healing-direction-and-report-branching"]["report_mode"] == "lite"
    theme_route = result.stage_outputs["stage-12-healing-direction-and-report-branching"]["theme_route"]
    assert theme_route["theme"] == "wealth"
    assert theme_route["selected_clause_ids"]
    assert theme_route["clauses"]
    assert result.report_context_package["theme_interpretation"]["route"]["selected_clause_ids"]
    assert result.final_report["summary"] == "核心主轴是先稳住，再推进。"
    assert result.quality_gate["passed"] is True
    assert "stage-" not in result.final_report_md

    report_prompt_payload = json.loads(
        llm_client.text_calls[-1]["user_prompt"].split("\n\n", 1)[1]
    )
    assert report_prompt_payload["writing_inputs"]["theme_route"]["selected_clause_ids"]


def test_mandala_agent_quality_gate_rejects_internal_leaks(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="这里泄漏了 stage-03 和 legacy。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "final_report_internal_text_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_empty_visual_evidence(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["stage-03-visual-evidence"]["circles"] = {}

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "missing_stage03_visual_units" in quality["failure_ids"]


def test_mandala_agent_quality_gate_rejects_financial_promises(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="这份报告提供投资建议和收益预测。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "final_report_internal_text_leak" in quality["failure_ids"]


def test_mandala_agent_quality_gate_allows_boundary_disclaimer(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="本报告用于个人觉察参考，不构成投资建议或心理诊断。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is True


def test_mandala_agent_quality_gate_accepts_raw_visual_observation(tmp_path):
    llm_client = StubMandalaLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="wealth")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )
    stage_outputs = deepcopy(result.stage_outputs)
    stage_outputs["stage-03-visual-evidence"]["circles"] = {
        "inner": {"summary": "", "visual_units": [], "raw_observation": {"center": "中心红色星形。"}},
        "middle": {"summary": "", "visual_units": [], "raw_observation": {"colors": "中圈绿色叶片。"}},
        "outer": {"summary": "", "visual_units": [], "raw_observation": {"boundary": "外圈边界闭合。"}},
    }

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is True


def test_wealth_runtime_routes_and_context():
    runtime = get_wealth_report_runtime()

    context = runtime.get_topic_context(report_mode="pro")
    route = runtime.route_visual_observations(
        {
            "outer_circle": "外圈红色很多，边界留白也多",
            "middle_circle": "中圈有断裂感",
            "inner_circle": "里圈偏收缩",
        },
        report_mode="lite",
    )

    assert context["topic"] == "wealth"
    assert context["topic_label"] == "财富议题"
    assert route.selected_clause_ids
    assert route.selected_module_ids
