"""Smoke tests for the migrated AI-Mandala To C backend API shell."""

import os
import sys
import shutil

from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


def _reset_api_state():
    from app.api import routes_v2

    routes_v2._orchestrator = None
    shutil.rmtree(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
        ),
        ignore_errors=True,
    )


def test_health_endpoint():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "aimandala-toc-backend"


def test_pricing_endpoint():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    response = client.get("/api/v2/pricing")

    assert response.status_code == 200
    data = response.json()
    assert data["lite"] == 9.9
    assert data["pro"] == 49.0
    assert data["upgrade_diff"] == 39.1


def test_create_interpretation_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"mock-image")

    response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-1",
            "image_path": str(image_path),
            "theme": "general",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["version"] == "lite"
    assert data["auto_detected"] is True
    assert data["existing"] is False
    assert data["generation_stage"] == "completed"
    assert data["report_ready"] is True
    assert data["three_circles"]["inner_radius"] == 33
    assert data["three_circles"]["middle_radius"] == 66
    assert data["interpretation_id"]


def test_create_interpretation_requires_complete_manual_circles(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"mock-image")

    response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-2",
            "image_path": str(image_path),
            "inner_radius": 40,
        },
    )

    assert response.status_code == 400
    assert "must be provided together" in response.json()["detail"]


def test_create_interpretation_returns_existing_for_same_user_image_theme(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"mock-image")

    first = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-existing",
            "image_path": str(image_path),
            "theme": "general",
        },
    )
    second = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-existing",
            "image_path": str(image_path),
            "theme": "general",
        },
    )

    assert first.status_code == 200
    assert second.status_code == 200
    first_data = first.json()
    second_data = second.json()
    assert second_data["existing"] is True
    assert second_data["interpretation_id"] == first_data["interpretation_id"]


def test_get_interpretation_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-3",
            "image_path": str(image_path),
            "theme": "growth",
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    response = client.get(f"/api/v2/interpretations/{interpretation_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["interpretation_id"] == interpretation_id
    assert data["user_id"] == "user-api-3"
    assert data["theme"] == "growth"
    assert data["auto_detected"] is True


def test_get_user_interpretations_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    first_image = tmp_path / "mandala-1.png"
    second_image = tmp_path / "mandala-2.png"
    first_image.write_bytes(b"mock-image-1")
    second_image.write_bytes(b"mock-image-2")

    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-4",
            "image_path": str(first_image),
        },
    )
    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-4",
            "image_path": str(second_image),
            "theme": "relationships",
        },
    )

    response = client.get("/api/v2/users/user-api-4/interpretations")

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(item["user_id"] == "user-api-4" for item in data)


def test_get_interpretation_status_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-status.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-status",
            "image_path": str(image_path),
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")

    assert response.status_code == 200
    data = response.json()
    assert data["interpretation_id"] == interpretation_id
    assert data["generation_stage"] == "completed"
    assert data["generation_progress"] == 100
    assert data["report_ready"] is True


def test_get_report_endpoint_returns_placeholder(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-5",
            "image_path": str(image_path),
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    response = client.get(f"/api/v2/interpretations/{interpretation_id}/report")

    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "lite"
    assert data["title"] == "一镜 Lite 版占位报告"
    assert data["overall_impression"] is not None
    assert data["structured"]["title"] == "一镜 Lite 版占位报告"
    assert "pro_teaser" in data["structured"]
    assert "一镜 Lite 版占位报告" in data["report"]
    assert data["error"] is None


def test_get_report_endpoint_404_for_unknown_record():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    response = client.get("/api/v2/interpretations/not-found/report")

    assert response.status_code == 404
