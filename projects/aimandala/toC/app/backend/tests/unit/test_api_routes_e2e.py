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
        return (
            "## 整体画面\n"
            "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
            "## 三圈观察\n"
            "内圈、 中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
            "## 主要视觉单元\n"
            "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
        )

    def generate_text(self, **kwargs):
        if kwargs.get("task") == "vision":
            if "上一轮输出仍然偏结构化" in kwargs.get("user_prompt", ""):
                return (
                    "## 整体画面\n"
                    "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
                    "## 三圈观察\n"
                    "内圈、中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
                    "## 主要视觉单元\n"
                    "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
                )
            return (
                "## 整体画面\n"
                "画面整体偏向收束后再展开，中心稳定，外圈留白清楚。\n\n"
                "## 三圈观察\n"
                "内圈、中圈、外圈之间有层次，但中圈与外圈之间的空白让节奏出现了停顿。\n\n"
                "## 主要视觉单元\n"
                "内圈蓝色中心，中圈粉色和紫色重复单元，外圈留白与紫色矩形构成主要视觉结构。\n"
            )
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
            "agent_variant": "two_pass_e2e",
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


def test_create_app_loads_redeem_codes_before_route_authorization(
    monkeypatch,
    tmp_path,
):
    env_file = tmp_path / "aimandala.env"
    env_file.write_text(
        "\n".join(
            [
                "AIMANDALA_REDEEM_CODES=ENV-LITE:lite",
                "AIMANDALA_LLM_API_KEY=env-key",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("AIMANDALA_ENV_FILE", str(env_file))
    monkeypatch.delenv("AIMANDALA_REDEEM_CODES", raising=False)
    monkeypatch.delenv("AIMANDALA_LLM_API_KEY", raising=False)
    monkeypatch.setattr(api_routes, "create_llm_client_from_env", lambda: StubRouteLLMClient())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "ENV-LITE",
        },
    )

    assert response.status_code == 200
