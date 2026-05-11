"""Unit tests for the mandala reading intelligence MVP path."""

import json
import os
import sys
from pathlib import Path

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.reading_intelligence.agent import MandalaReadingAgent
from app.core.reading_intelligence.artifact_store import MandalaReadingArtifactStore
from app.core.reading_intelligence.contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.reading_intelligence.input_collector import load_fixture_agent_input
from app.core.reading_intelligence.knowledge_pack_builder import KnowledgePackBuilder
from app.core.reading_intelligence.quality_gate import run_quality_gate


class FakeReadingLLMClient:
    def __init__(self):
        self.structured_calls = []
        self.text_calls = []
        self.last_attempt_trace = [{"model": "fake-model", "result": "response"}]

    def generate_structured(self, **kwargs):
        self.structured_calls.append(kwargs)
        return {
            "global_visual_summary": "内圈有蓝色中心，中圈有粉色花瓣，外圈有白色留白。",
            "circles": {
                "inner": {
                    "summary": "蓝色中心稳定。",
                    "visual_units": [
                        {
                            "id": "inner-001",
                            "position": "中心",
                            "color": "蓝色",
                            "shape": "圆形",
                            "visible_evidence": "中心蓝色圆形清晰。",
                        }
                    ],
                },
                "middle": {
                    "summary": "粉色花瓣向外展开。",
                    "visual_units": [
                        {
                            "id": "middle-001",
                            "position": "中圈",
                            "color": "粉色",
                            "shape": "花瓣",
                            "visible_evidence": "中圈粉色花瓣排列。",
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
                            "visible_evidence": "外圈白色留白形成边界。",
                        }
                    ],
                },
            },
            "evidence_summary": ["中心蓝色圆形", "中圈粉色花瓣", "外圈白色留白"],
            "uncertainties": [],
        }

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        if len(self.text_calls) == 1:
            return json.dumps(
                {
                    "core_thesis": "这幅画呈现出先稳定自身、再谨慎向外表达的状态。",
                    "user_facing_framing": "你可以先从已经稳定的部分出发。",
                    "healing_direction": "从小范围表达开始，逐步增加外部连接。",
                    "evidence_refs": ["inner-001", "middle-001", "outer-001"],
                },
                ensure_ascii=False,
            )
        return "这幅曼陀罗的中心给人一种稳定感，中圈开始向外伸展，外圈留白说明你仍在为自己保留边界。接下来可以先确认让你安心的支点，再尝试把感受说得更具体。"


def _agent_input(tmp_path: Path) -> MandalaAgentInput:
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme="general",
            theme_label="全面解读",
            painting_intention="想了解当下状态",
            painting_feeling="平静",
        ),
        circle_boundaries={
            "inner_radius": 35,
            "middle_radius": 65,
            "radius_unit": "normalized_percent",
            "source": "manual",
        },
        output_requirements=MandalaOutputRequirements(),
    )


def test_mandala_reading_agent_outputs_required_artifacts(tmp_path):
    llm_client = FakeReadingLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="general")
    result = MandalaReadingAgent(llm_client=llm_client).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=knowledge_pack,
    )

    assert result.agent_output["status"] == "complete"
    assert sorted(result.stage_outputs.keys()) == [
        "stage-00-input-context",
        "stage-01-user-input-context",
        "stage-02-circle-boundary-decision",
        "stage-03-visual-evidence",
        "stage-04-direct-judgment-high-hit-check",
        "stage-05-per-circle-color-shape-element-sensing",
        "stage-06-per-circle-element-generation-control",
        "stage-07-per-circle-imbalance-patterns",
        "stage-08-energy-flow-diagnosis",
        "stage-09-evidence-consolidation",
        "stage-10-core-thesis-selection",
        "stage-11-user-facing-framing",
        "stage-12-healing-direction-and-report-branching",
        "stage-13-lite-report-draft",
        "stage-14-pro-report-draft",
        "stage-15-visual-assets",
        "stage-16-final-report-assembly",
    ]
    assert [block["block_id"] for block in result.execution_trace] == [
        "block-1-input-and-boundary",
        "block-2-visual-and-direct-check",
        "block-3-circle-rule-reasoning",
        "block-4-thesis-and-writing-input",
        "block-5-report-and-quality",
    ]
    assert "final_report" in result.report_context_package
    assert result.quality_gate["passed"] is True
    assert "stage-" not in result.final_report_md
    assert len(llm_client.structured_calls) == 1
    assert len(llm_client.text_calls) == 2


def test_artifact_store_writes_review_files(tmp_path):
    result = MandalaReadingAgent(llm_client=FakeReadingLLMClient()).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=KnowledgePackBuilder().build(theme="general"),
    )

    written = MandalaReadingArtifactStore(tmp_path / "out").write(result)

    assert sorted(path.name for path in written) == [
        "agent_input.json",
        "agent_output.json",
        "execution_trace.json",
        "final_report.json",
        "final_report.md",
        "interpretation_artifacts.json",
        "knowledge_pack.json",
        "quality_gate.json",
        "report_context_package.json",
        "stage_outputs.json",
    ]
    final_report = json.loads((tmp_path / "out" / "final_report.json").read_text())
    assert final_report["report_mode"] == "lite"


def test_quality_gate_blocks_internal_label_leak(tmp_path):
    result = MandalaReadingAgent(llm_client=FakeReadingLLMClient()).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=KnowledgePackBuilder().build(theme="general"),
    )

    quality = run_quality_gate(
        stage_outputs=result.stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md="这里泄漏了 stage-03 和 placeholder。",
        report_context_package=result.report_context_package,
    )

    assert quality["passed"] is False
    assert "final_report_internal_text_leak" in quality["failure_ids"]


def test_fixture_input_collector_loads_toc_fixture_003():
    fixture_input = load_fixture_agent_input("toc-mvp-fixture-003", report_mode="lite")

    assert fixture_input.report_mode == "lite"
    assert fixture_input.user_context.theme == "general"
    assert fixture_input.user_context.painting_feeling == "保持不变"
    assert fixture_input.image.local_path.endswith("IMG_5062.jpeg")
