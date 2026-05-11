"""Unit tests for the mandala interpretation agent MVP path."""

import json
import os
import sys
from pathlib import Path

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent
from app.core.mandala_interpretation_agent.artifact_store import MandalaInterpretationArtifactStore
from app.core.mandala_interpretation_agent.contracts import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.input_collector import load_fixture_agent_input
from app.core.mandala_interpretation_agent.knowledge_pack_builder import KnowledgePackBuilder
from app.core.mandala_interpretation_agent.quality_gate import run_quality_gate
from app.core.llm.runtime import NoopLLMClient

import scripts.run_mandala_interpretation_agent_fixture as runner


class FakeInterpretationLLMClient:
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


def test_mandala_interpretation_agent_outputs_required_artifacts(tmp_path):
    llm_client = FakeInterpretationLLMClient()
    knowledge_pack = KnowledgePackBuilder().build(theme="general")
    result = MandalaInterpretationAgent(llm_client=llm_client).run(
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
    result = MandalaInterpretationAgent(llm_client=FakeInterpretationLLMClient()).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=KnowledgePackBuilder().build(theme="general"),
    )

    written = MandalaInterpretationArtifactStore(tmp_path / "out").write(result)

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
    result = MandalaInterpretationAgent(llm_client=FakeInterpretationLLMClient()).run(
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


def test_agent_normalizes_model_circle_summary_shape(tmp_path):
    class SummaryShapeClient(FakeInterpretationLLMClient):
        def generate_structured(self, **kwargs):
            self.structured_calls.append(kwargs)
            return {
                "global_visual_summary": "三圈清晰。",
                "circles": {
                    "inner_circle": {
                        "color_distribution": ["橙色", "黄色", "蓝色"],
                        "pattern": "中心多层同心圆",
                        "shape": "圆形",
                    },
                    "middle_circle": {
                        "color_distribution": ["紫色", "粉色"],
                        "pattern": "花瓣状结构",
                        "shape": "环形",
                    },
                    "outer_circle": {
                        "color_distribution": ["绿色", "米色"],
                        "pattern": "叶片与几何图案",
                        "shape": "外环",
                    },
                },
                "evidence_summary": ["三圈颜色自然过渡"],
                "uncertainties": [],
            }

    result = MandalaInterpretationAgent(llm_client=SummaryShapeClient()).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=KnowledgePackBuilder().build(theme="general"),
    )

    stage03 = result.stage_outputs["stage-03-visual-evidence"]
    assert sorted(stage03["circles"].keys()) == ["inner", "middle", "outer"]
    assert stage03["circles"]["inner"]["visual_units"][0]["id"] == "inner-001"
    assert stage03["circles"]["middle"]["visual_units"][0]["color"] == "紫色、粉色"
    assert result.stage_outputs["stage-09-evidence-consolidation"]["evidence_map"]
    assert result.quality_gate["passed"] is True


def test_quality_gate_blocks_empty_stage03_visual_units(tmp_path):
    result = MandalaInterpretationAgent(llm_client=FakeInterpretationLLMClient()).run(
        agent_input=_agent_input(tmp_path),
        knowledge_pack=KnowledgePackBuilder().build(theme="general"),
    )
    stage_outputs = dict(result.stage_outputs)
    stage_outputs["stage-03-visual-evidence"] = {
        "stage": "stage-03-visual-evidence",
        "status": "complete",
        "circles": {"inner": {}, "middle": {}, "outer": {}},
    }

    quality = run_quality_gate(
        stage_outputs=stage_outputs,
        execution_trace=result.execution_trace,
        final_report_md=result.final_report_md,
        report_context_package={**result.report_context_package, "evidence_map": []},
    )

    assert quality["passed"] is False
    assert "missing_stage03_visual_units" in quality["failure_ids"]
    assert "empty_evidence_map" in quality["failure_ids"]


def test_fixture_input_collector_loads_toc_fixture_003():
    fixture_input = load_fixture_agent_input("toc-mvp-fixture-003", report_mode="lite")

    assert fixture_input.report_mode == "lite"
    assert fixture_input.user_context.theme == "general"
    assert fixture_input.user_context.painting_feeling == "保持不变"
    assert fixture_input.image.local_path.endswith("IMG_5062.jpeg")


def test_fixture_runner_reports_model_failure_without_writing_fake_report(
    monkeypatch,
    tmp_path,
    capsys,
):
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "run_mandala_interpretation_agent_fixture.py",
            "--fixture-id",
            "toc-mvp-fixture-003",
            "--output-dir",
            str(tmp_path / "out"),
        ],
    )
    monkeypatch.setattr(runner, "create_llm_client_from_env", lambda: NoopLLMClient())

    exit_code = runner.main()

    captured = json.loads(capsys.readouterr().out)
    assert exit_code == 2
    assert captured["status"] == "failed"
    assert captured["quality_gate_passed"] is False
    assert captured["files"] == []
    assert not (tmp_path / "out" / "final_report.md").exists()
