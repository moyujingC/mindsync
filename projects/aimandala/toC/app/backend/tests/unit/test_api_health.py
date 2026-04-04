"""Smoke tests for the migrated AI-Mandala To C backend API shell."""

import os
import sys
import shutil
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


def _reset_api_state():
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
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


def test_detect_circles_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "detect.png"
    image_path.write_bytes(b"mock-image")

    response = client.post(
        "/api/v2/detect-circles",
        json={
            "image_path": str(image_path),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["inner_radius"] == 0.33
    assert data["middle_radius"] == 0.66
    assert data["method"] == "default"
    assert data["geometry_suggestion"]["shape_type"] == "circle"


def test_upload_image_endpoint():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    response = client.post(
        "/api/v2/upload-image",
        files={
            "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["storage_backend"] == "local"
    assert data["storage_key"].endswith(".png")
    assert data["original_filename"] == "mandala-upload.png"
    assert data["content_type"] == "image/png"
    assert data["size_bytes"] == len(b"mock-upload-image")
    assert os.path.exists(data["image_path"])


def test_upload_image_endpoint_cleans_expired_temp_uploads():
    from app.api.main import app
    from app.core.uploads.storage import LocalUploadStorage

    _reset_api_state()
    uploads_dir = LocalUploadStorage().base_dir
    expired_file = uploads_dir / "expired-upload.png"
    fresh_file = uploads_dir / "fresh-upload.png"
    expired_file.write_bytes(b"expired")
    fresh_file.write_bytes(b"fresh")

    expired_at = (datetime.now() - timedelta(hours=30)).timestamp()
    fresh_at = (datetime.now() - timedelta(hours=2)).timestamp()
    os.utime(expired_file, (expired_at, expired_at))
    os.utime(fresh_file, (fresh_at, fresh_at))

    client = TestClient(app)
    response = client.post(
        "/api/v2/upload-image",
        files={
            "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
        },
    )

    assert response.status_code == 200
    assert not expired_file.exists()
    assert fresh_file.exists()


def test_upload_image_endpoint_returns_s3_dry_run_metadata():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "s3",
            "AIMANDALA_UPLOAD_S3_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_S3_REGION": "ap-southeast-1",
        },
        clear=False,
    ):
        response = client.post(
            "/api/v2/upload-image",
            files={
                "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["storage_backend"] == "s3"
    assert data["storage_key"].startswith("aimandala/uploads/")
    assert data["image_url"] == (
        f"https://demo-bucket.s3.ap-southeast-1.amazonaws.com/{data['storage_key']}"
    )
    assert os.path.exists(data["image_path"])


def test_upload_image_endpoint_returns_501_for_missing_remote_backend_config():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "s3",
            "AIMANDALA_UPLOAD_S3_BUCKET": "",
            "AIMANDALA_UPLOAD_S3_REGION": "",
        },
        clear=False,
    ):
        response = client.post(
            "/api/v2/upload-image",
            files={
                "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
            },
        )

    assert response.status_code == 501
    assert "Missing required upload storage config" in response.json()["detail"]


def test_detect_circles_endpoint_for_missing_file():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    response = client.post(
        "/api/v2/detect-circles",
        json={
            "image_path": "/tmp/aimandala-missing-detect-file.png",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["method"] == "default"
    assert data["debug_info"]["reason"] == "image_not_found"


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
    assert all(item["generation_progress"] == 100 for item in data)


def test_get_user_interpretations_endpoint_supports_filter_query(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    first_image = tmp_path / "history-ready.png"
    second_image = tmp_path / "history-pending.png"
    first_image.write_bytes(b"mock-image-1")
    second_image.write_bytes(b"mock-image-2")

    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-filter",
            "image_path": str(first_image),
        },
    )
    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-filter",
            "image_path": str(second_image),
        },
    )

    from app.api import routes_v2

    orchestrator = routes_v2.get_orchestrator()
    user_records = orchestrator.store.get_user_records("user-api-filter")
    assert len(user_records) >= 2
    pending_record = user_records[0]
    pending_record.generation_progress = 64
    pending_record.generation_stage = "generating_lite"
    pending_record.status = "processing"
    pending_record.layer_2_lite_final = None
    orchestrator.store.save(pending_record)

    ready_response = client.get("/api/v2/users/user-api-filter/interpretations?filter=ready")
    pending_response = client.get("/api/v2/users/user-api-filter/interpretations?filter=pending")

    assert ready_response.status_code == 200
    assert pending_response.status_code == 200
    ready_data = ready_response.json()
    pending_data = pending_response.json()
    assert ready_data
    assert pending_data
    assert all(item["generation_progress"] >= 100 for item in ready_data)
    assert all(item["generation_progress"] < 100 for item in pending_data)
    assert all(item["generation_stage"] == "completed" for item in ready_data)


def test_get_user_interpretations_endpoint_supports_theme_and_limit_query(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    first_image = tmp_path / "history-general.png"
    second_image = tmp_path / "history-career.png"
    third_image = tmp_path / "history-relationship.png"
    first_image.write_bytes(b"mock-image-1")
    second_image.write_bytes(b"mock-image-2")
    third_image.write_bytes(b"mock-image-3")

    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-theme-limit",
            "image_path": str(first_image),
            "theme": "general",
        },
    )
    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-theme-limit",
            "image_path": str(second_image),
            "theme": "career",
        },
    )
    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-theme-limit",
            "image_path": str(third_image),
            "theme": "career",
        },
    )

    theme_response = client.get(
        "/api/v2/users/user-api-theme-limit/interpretations?theme=career&limit=1"
    )

    assert theme_response.status_code == 200
    theme_data = theme_response.json()
    assert len(theme_data) == 1
    assert all(item["theme"] == "career" for item in theme_data)


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


def test_upgrade_placeholder_endpoint(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-upgrade.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-upgrade",
            "image_path": str(image_path),
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    response = client.post(f"/api/v2/interpretations/{interpretation_id}/upgrade")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["enabled"] is False
    assert data["status"] == "not_enabled"


def test_upgrade_placeholder_endpoint_404_for_unknown_record():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    response = client.post("/api/v2/interpretations/not-found/upgrade")

    assert response.status_code == 404
