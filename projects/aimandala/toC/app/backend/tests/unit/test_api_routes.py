"""API tests for the native Aimandala report route."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.api.main import create_app


def test_create_wealth_report_uses_native_agent_route(tmp_path: Path):
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
            "visual_observations": {
                "global_visual_summary": "内圈收束，中圈有拉扯，外圈红色和留白明显。",
                "circles": {
                    "inner": {
                        "summary": "内圈蓝色圆形，整体收束。",
                        "visual_units": [
                            {
                                "id": "inner-001",
                                "position": "内圈",
                                "color": "蓝色",
                                "shape": "圆形",
                                "visible_evidence": "内圈蓝色圆形。",
                            }
                        ],
                    },
                    "middle": {
                        "summary": "中圈粉色花瓣，有拉扯感。",
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
                        "summary": "外圈红色很多，也有留白。",
                        "visual_units": [
                            {
                                "id": "outer-001",
                                "position": "外圈",
                                "color": "红色",
                                "shape": "边界",
                                "visible_evidence": "外圈红色边界和留白。",
                            }
                        ],
                    },
                },
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["topic"] == "wealth"
    assert payload["report_mode"] == "lite"
    assert payload["selected_clause_ids"]
    assert "财富议题" in payload["final_report_md"]
