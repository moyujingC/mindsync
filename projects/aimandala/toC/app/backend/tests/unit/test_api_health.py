"""Smoke tests for the migrated AI-Mandala To C backend API shell."""

import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


def test_health_endpoint():
    from app.api.main import app

    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "aimandala-toc-backend"


def test_pricing_endpoint():
    from app.api.main import app

    client = TestClient(app)
    response = client.get("/api/v2/pricing")

    assert response.status_code == 200
    data = response.json()
    assert data["lite"] == 9.9
    assert data["pro"] == 49.0
    assert data["upgrade_diff"] == 39.1


def test_create_interpretation_endpoint(tmp_path):
    from app.api.main import app

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
    assert data["generation_stage"] == "detecting"
    assert data["three_circles"]["inner_radius"] == 33
    assert data["three_circles"]["middle_radius"] == 66
    assert data["interpretation_id"]


def test_create_interpretation_requires_complete_manual_circles(tmp_path):
    from app.api.main import app

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


def test_get_interpretation_endpoint(tmp_path):
    from app.api.main import app

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
