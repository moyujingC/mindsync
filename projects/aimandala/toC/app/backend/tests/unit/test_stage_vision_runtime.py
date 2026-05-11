"""Unit tests for stage-03/04 vision runtime components."""

import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.stage_vision_runtime import StageVisionRuntime


class FakeVisionClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []
        self.last_attempt_trace = [{"model": "fake-vision", "result": "response"}]

    def generate_structured(self, **kwargs):
        self.calls.append(kwargs)
        return self.responses.pop(0)


def test_stage_03_runner_normalizes_visual_units(tmp_path):
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"fake-image")
    client = FakeVisionClient(
        [
            {
                "stage": "stage-03-visual-evidence",
                "global_summary": "内圈红色集中，中圈绿色放射，外圈黄色包裹。",
                "circles": {
                    "inner": {
                        "summary": "内圈中心有红色圆形。",
                        "visual_units": [
                            {
                                "id": "inner-001",
                                "position": "中心",
                                "color": {"main": "红色", "depth": "深", "saturation": "高"},
                                "shape": {"type": "圆形", "arrangement": "集中"},
                                "area_ratio": "0.36",
                                "visible_evidence": "内圈中心有红色圆形填色。",
                            }
                        ],
                    },
                    "middle": {"summary": "", "visual_units": []},
                    "outer": {"summary": "", "visual_units": []},
                },
                "evidence_summary": ["内圈中心红色圆形集中。"],
                "uncertainties": [],
            }
        ]
    )
    runtime = StageVisionRuntime(llm_client=client, direct_judgment_service=None)

    stage03 = runtime.generate_stage03(
        image_path=str(image_path),
        theme="general",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    unit = stage03["circles"]["inner"]["visual_units"][0]
    assert stage03["status"] == "complete"
    assert stage03["global_visual_summary"] == "内圈红色集中，中圈绿色放射，外圈黄色包裹。"
    assert unit["id"] == "inner-001"
    assert unit["color"] == "红色"
    assert unit["shape"] == "圆形"
    assert unit["area_ratio"] == 0.36
    assert unit["description"] == "内圈中心有红色圆形填色。"
    assert client.calls[0]["task"] == "vision"
    assert client.calls[0]["image_path"] == str(image_path)


def test_stage_03_runner_rejects_empty_visual_units(tmp_path):
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"fake-image")
    client = FakeVisionClient(
        [
            {
                "stage": "stage-03-visual-evidence",
                "global_summary": "只有文字，没有可用单元。",
                "circles": {
                    "inner": {"visual_units": []},
                    "middle": {"visual_units": []},
                    "outer": {"visual_units": []},
                },
            }
        ]
    )
    runtime = StageVisionRuntime(llm_client=client, direct_judgment_service=None)

    stage03 = runtime.generate_stage03(
        image_path=str(image_path),
        theme="general",
        three_circles={"inner_radius": 35, "middle_radius": 67},
    )

    assert stage03["status"] == "failed"
    assert stage03["failure_reason"] == "empty_visual_units"


def test_stage_04_runner_cross_validates_program_and_vision_hits(tmp_path):
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"fake-image")

    class DirectJudgmentStub:
        def list_judgments(self):
            return [
                {
                    "id": "direct_judgment.outer_red_mass",
                    "name": "外圈红色多",
                    "evidence_requirements": ["外圈存在成片红色"],
                }
            ]

        def match_programmatically(self, stage03):
            return [
                {
                    "mode": "外圈红色多",
                    "mode_id": "direct_judgment.outer_red_mass",
                    "hit_strength": "full_hit",
                    "visual_unit_refs": ["outer-001"],
                    "visible_evidence": ["外圈存在成片红色。"],
                    "knowledge_refs": ["direct_judgment.outer_red_mass"],
                }
            ]

    client = FakeVisionClient(
        [
            {
                "stage": "stage-04-direct-judgment-high-hit-check",
                "hits": [
                    {
                        "mode": "外圈红色多",
                        "hit_strength": "full_hit",
                        "vision_hit": True,
                        "program_hit": True,
                        "cross_validation": "consistent",
                        "visual_unit_refs": ["outer-001"],
                        "visible_evidence": ["外圈存在成片红色。"],
                        "knowledge_refs": ["direct_judgment.outer_red_mass"],
                        "reasoning": "视觉与程序都确认外圈红色成片。",
                    }
                ],
                "non_hits": [],
                "uncertain_items": [],
                "conflicts": [],
                "summary": "命中外圈红色多。",
            }
        ]
    )
    runtime = StageVisionRuntime(
        llm_client=client,
        direct_judgment_service=DirectJudgmentStub(),
    )

    stage04 = runtime.generate_stage04(
        image_path=str(image_path),
        stage03={
            "status": "complete",
            "circles": {
                "outer": {
                    "visual_units": [
                        {
                            "id": "outer-001",
                            "color": "红色",
                            "shape": "块状",
                            "area_ratio": 0.46,
                            "description": "外圈存在成片红色。",
                        }
                    ]
                }
            },
        },
    )

    assert stage04["status"] == "complete"
    assert stage04["hits"][0]["cross_validation"] == "consistent"
    assert stage04["knowledge_refs"] == ["direct_judgment.outer_red_mass"]
