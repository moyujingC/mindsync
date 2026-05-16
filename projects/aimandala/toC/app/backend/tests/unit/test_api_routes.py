"""API tests for the native Aimandala report route."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.api.main import create_app


def _visual_observations() -> dict:
    return {
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
    }


def test_upload_image_saves_browser_file_and_returns_backend_readable_path(
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_UPLOAD_BACKEND", "local")
    monkeypatch.setenv("AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS", "24")

    client = TestClient(create_app())
    response = client.post(
        "/api/uploads",
        files={"file": ("mandala.png", b"fake-image", "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["storage_backend"] == "local"
    assert payload["storage_key"].endswith(".png")
    assert Path(payload["image_path"]).exists()
    assert Path(payload["image_path"]).read_bytes() == b"fake-image"
    Path(payload["image_path"]).unlink(missing_ok=True)


def test_create_lite_wealth_report_uses_native_agent_route(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    client = TestClient(create_app())
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "MVP-LITE",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["topic"] == "wealth"
    assert payload["report_mode"] == "lite"
    assert payload["selected_clause_ids"]
    assert "财富议题" in payload["final_report_md"]


def test_create_pro_wealth_report_returns_displayable_report(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "pro",
            "redeem_code": "MVP-PRO",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["report_mode"] == "pro"
    assert payload["final_report_md"]
    assert payload["final_report"]["report_mode"] == "pro"


def test_create_wealth_report_requires_llm_or_seeded_visual_observations(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.setenv("AIMANDALA_LLM_BACKEND", "noop")
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "redeem_code": "MVP-LITE",
            "painting_intention": "想看财富为什么卡住",
            "painting_feeling": "有点紧",
        },
    )

    assert response.status_code == 501
    assert "LLM runtime is not configured" in response.json()["detail"]


def test_create_wealth_report_rejects_missing_redeem_code(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "lite",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 402
    assert "兑换码" in response.json()["detail"]


def test_create_wealth_report_rejects_lite_code_for_pro(
    tmp_path: Path,
    monkeypatch,
):
    monkeypatch.setenv("AIMANDALA_REDEEM_CODES", "MVP-LITE:lite;MVP-PRO:pro")
    image_path = tmp_path / "mandala.jpg"
    image_path.write_bytes(b"fake-image")

    client = TestClient(create_app())
    response = client.post(
        "/api/wealth-reports",
        json={
            "image_path": str(image_path),
            "report_mode": "pro",
            "redeem_code": "MVP-LITE",
            "visual_observations": _visual_observations(),
        },
    )

    assert response.status_code == 402
    assert "不适用于 PRO 报告" in response.json()["detail"]
