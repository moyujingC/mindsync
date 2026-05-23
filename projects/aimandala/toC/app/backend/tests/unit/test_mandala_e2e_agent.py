"""Tests for the end-to-end mandala interpretation agent."""

from __future__ import annotations

from pathlib import Path

from app.core.mandala_interpretation_agent import (
    MandalaAgentInput,
    MandalaImageInput,
    MandalaInterpretationAgent,
    MandalaOutputRequirements,
    MandalaUserContext,
)
from app.core.mandala_interpretation_agent.prompt_pack_builder import PromptPackBuilder


class StubE2ELLMClient:
    def __init__(self) -> None:
        self.last_prompt_cache_hit_tokens = 12
        self.last_prompt_cache_miss_tokens = 34
        self.last_attempt_trace = [{"model": "stub", "status": "ok"}]
        self.vision_calls: list[dict] = []
        self.text_calls: list[dict] = []

    def generate_structured(self, **kwargs):
        self.vision_calls.append(kwargs)
        return {
            "visual_observation": {
                "overall_observation": {
                    "first_impression": "画面整体偏向收束后再展开。",
                    "main_visual_content": "中心圆形、重复花瓣和外圈留白。",
                    "visual_atmosphere": "柔和但有边界。",
                    "visual_weight_and_rhythm": "中心较重，外圈较轻。",
                },
                "three_circle_observation": {
                    "inner": "内圈收束。",
                    "middle": "中圈重复展开。",
                    "outer": "外圈留白边界明显。",
                    "cross_circle_visual_connection": "从中心向外展开后又被边界收住。",
                },
                "circle_visual_units": {
                    "inner": {
                        "composition_description": "内圈一个蓝色圆形。",
                        "visual_units": [
                            {
                                "id": "inner-001",
                                "unit_name": "蓝色圆形",
                                "position": "内圈",
                                "source_type": "user_painted",
                                "color_description": "蓝色",
                                "shape_description": "圆形",
                                "texture_and_density": "集中。",
                                "spatial_relations": "位于中心。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "中心蓝色圆形。",
                            }
                        ],
                    },
                    "middle": {
                        "composition_description": "中圈粉色重复图案。",
                        "visual_units": [
                            {
                                "id": "middle-001",
                                "unit_name": "粉色花瓣",
                                "position": "中圈",
                                "source_type": "user_painted",
                                "color_description": "粉色",
                                "shape_description": "花瓣",
                                "texture_and_density": "重复。",
                                "spatial_relations": "围绕中心展开。",
                                "blank_space_role": "none",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "中圈粉色花瓣。",
                            }
                        ],
                    },
                    "outer": {
                        "composition_description": "外圈白色留白明显。",
                        "visual_units": [
                            {
                                "id": "outer-001",
                                "unit_name": "外圈留白",
                                "position": "外圈",
                                "source_type": "blank_space",
                                "color_description": "白色留白",
                                "shape_description": "边界状",
                                "texture_and_density": "清楚。",
                                "spatial_relations": "包围外圈。",
                                "blank_space_role": "形成边界。",
                                "energy_ratio_percent": 100,
                                "rich_visual_description": "外圈留白形成边界。",
                            }
                        ],
                    },
                },
            }
        }

    def generate_text(self, **kwargs):
        self.text_calls.append(kwargs)
        return (
            "# 财富议题曼陀罗解读报告\n\n"
            "## 整体感受\n"
            "这幅画先给人的感觉是先收住，再向外展开。\n\n"
            "## 三圈观察\n"
            "内圈较稳，中圈有重复，外圈留白形成边界。\n\n"
            "## 圈内解读\n"
            "画面里能看到五行识别的基础线索。\n\n"
            "## 跨圈衔接\n"
            "三圈之间是先展开后收束的结构。\n\n"
            "## 财富主线\n"
            "财富议题更像是先稳住承载，再进入交换。\n\n"
            "## 后续建议\n"
            "可以先做一个很小的价值表达动作。\n"
        )


def _agent_input(tmp_path: Path) -> MandalaAgentInput:
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")
    return MandalaAgentInput(
        report_mode="lite",
        image=MandalaImageInput(local_path=str(image_path)),
        user_context=MandalaUserContext(
            theme="wealth",
            theme_label="财富议题",
            painting_intention="想看财富卡点",
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


def test_end_to_end_agent_returns_new_contract(tmp_path):
    result = MandalaInterpretationAgent(llm_client=StubE2ELLMClient()).run(
        agent_input=_agent_input(tmp_path),
    )

    assert result.visual_draft["visual_observation"]["circle_visual_units"]["inner"]["visual_units"]
    assert result.prompt_pack_manifest["pack_id"] == "wealth-report-v1.0.0"
    assert result.final_report["report_mode"] == "lite"
    assert result.quality_gate["passed"] is True
    assert result.run_summary["status"] == "complete"


def test_prompt_pack_builder_uses_real_files():
    pack = PromptPackBuilder().build()

    assert pack.pack_id == "wealth-report-v1.0.0"
    assert pack.manifest["file_count"] == 6
    assert "财富议题的路由规则" in pack.stable_prefix
