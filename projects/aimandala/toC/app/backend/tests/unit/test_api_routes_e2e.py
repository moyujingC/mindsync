"""Tests for the end-to-end mandala wealth report API."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.main import create_app
from app.api import routes as api_routes


class StubRouteLLMClient:
    last_prompt_cache_hit_tokens = 0
    last_prompt_cache_miss_tokens = 0
    last_attempt_trace = [{"model": "stub", "status": "ok"}]

    def generate_structured(self, **kwargs):
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


def test_create_wealth_report_returns_new_contract(monkeypatch, tmp_path):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "MVP-LITE",
            "painting_intention": "想看财富卡点",
            "painting_feeling": "有点紧",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_mode"] == "lite"
    assert payload["final_report_md"]
    assert payload["visual_draft"]
    assert payload["prompt_pack_manifest"]["pack_id"] == "wealth-report-v1.0.0"
    assert payload["quality_gate"]["passed"] is True
    assert payload["run_summary"]["status"] == "complete"
