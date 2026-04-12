"""Smoke tests for the migrated AI-Mandala To C backend API shell."""

import json
import os
import sys
import shutil
import time
import types
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
    routes_v2._active_pro_upgrade_jobs.clear()
    shutil.rmtree(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
        ),
        ignore_errors=True,
    )


def _wait_for_pro_report(client: TestClient, interpretation_id: str, attempts: int = 20):
    last_response = None
    for _ in range(attempts):
        last_response = client.get(
            f"/api/v2/interpretations/{interpretation_id}/report",
            params={"version": "pro"},
        )
        assert last_response.status_code == 200
        payload = last_response.json()
        if payload.get("version") == "pro" and not payload.get("error"):
            return payload
        time.sleep(0.05)

    raise AssertionError(
        f"Pro report did not become ready in time: {last_response.json() if last_response else None}"
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


def test_local_dev_cors_allows_vite_ports():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    response = client.options(
        "/api/v2/pricing",
        headers={
            "Origin": "http://127.0.0.1:4174",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:4174"


def test_public_web_origins_are_allowed_for_runtime_api_calls():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    for origin in (
        "http://dev-web.jingshu.cc",
        "https://dev-web.jingshu.cc",
        "https://web.jingshu.cc",
        "http://101.43.98.40",
    ):
        response = client.options(
            "/api/v2/pricing",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )

        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin


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
    assert data["image_url"].endswith(f"/api/v2/uploads/{data['storage_key']}")
    assert data["image_local_expires_at"] is not None

    upload_response = client.get(data["image_url"])
    assert upload_response.status_code == 200
    assert upload_response.content == b"mock-upload-image"
    assert upload_response.headers["content-type"] == "image/png"


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


def test_get_uploaded_image_endpoint_404_for_missing_file():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    response = client.get("/api/v2/uploads/missing-upload.png")

    assert response.status_code == 404


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
    assert data["image_local_expires_at"] is not None


def test_upload_image_endpoint_returns_cos_metadata():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    upload_calls = []
    presigned_calls = []

    class FakeCosConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class FakeCosClient:
        def __init__(self, config):
            self.config = config

        def put_object(self, **kwargs):
            upload_calls.append(kwargs)

        def get_presigned_download_url(self, **kwargs):
            presigned_calls.append(kwargs)
            return (
                f"https://{self.config.kwargs.get('Domain') or 'demo-bucket.cos.ap-shanghai.myqcloud.com'}/"
                f"{kwargs['Key']}?sign=demo"
            )

    fake_qcloud_module = types.SimpleNamespace(
        CosConfig=FakeCosConfig,
        CosS3Client=FakeCosClient,
    )

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "cos",
            "AIMANDALA_UPLOAD_COS_SECRET_ID": "secret-id",
            "AIMANDALA_UPLOAD_COS_SECRET_KEY": "secret-key",
            "AIMANDALA_UPLOAD_COS_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_COS_REGION": "ap-shanghai",
            "AIMANDALA_UPLOAD_COS_PUBLIC_BASE_URL": "https://img.example.com/mandala",
            "AIMANDALA_COS_SIGNED_URL_TTL_SECONDS": "900",
        },
        clear=False,
    ), patch.dict(sys.modules, {"qcloud_cos": fake_qcloud_module}):
        response = client.post(
            "/api/v2/upload-image",
            files={
                "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["storage_backend"] == "cos"
    assert data["storage_key"].startswith("aimandala/uploads/")
    assert data["image_url"] == f"https://img.example.com/{data['storage_key']}?sign=demo"
    assert os.path.exists(data["image_path"])
    assert data["image_local_expires_at"] is not None
    assert len(upload_calls) == 1
    assert len(presigned_calls) == 1
    assert upload_calls[0]["Bucket"] == "demo-bucket"
    assert upload_calls[0]["Key"] == data["storage_key"]
    assert presigned_calls[0]["Expired"] == 900


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


def test_detect_circles_returns_501_for_invalid_prompt_runtime_config(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "detect.png"
    image_path.write_bytes(b"mock-image")

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_PROMPT_RUNTIME_BACKEND": "http",
            "AIMANDALA_PROMPT_RUNTIME_HTTP_URL": "",
        },
        clear=False,
    ):
        response = client.post(
            "/api/v2/detect-circles",
            json={
                "image_path": str(image_path),
            },
        )

    assert response.status_code == 501
    assert "AIMANDALA_PROMPT_RUNTIME_HTTP_URL" in response.json()["detail"]


def test_upload_image_endpoint_returns_501_when_cos_sdk_missing():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "cos",
            "AIMANDALA_UPLOAD_COS_SECRET_ID": "secret-id",
            "AIMANDALA_UPLOAD_COS_SECRET_KEY": "secret-key",
            "AIMANDALA_UPLOAD_COS_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_COS_REGION": "ap-shanghai",
        },
        clear=False,
    ), patch.dict(sys.modules, {"qcloud_cos": None}):
        response = client.post(
            "/api/v2/upload-image",
            files={
                "file": ("mandala-upload.png", b"mock-upload-image", "image/png"),
            },
        )

    assert response.status_code == 501
    assert "cos-python-sdk-v5" in response.json()["detail"]


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


def test_create_interpretation_persists_upload_metadata(tmp_path):
    from app.api.main import app
    from app.api import routes_v2

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-meta.png"
    image_path.write_bytes(b"mock-image")

    response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-meta",
            "image_path": str(image_path),
            "image_url": "https://img.example.com/mandala/demo.png",
            "storage_backend": "cos",
            "storage_key": "aimandala/uploads/demo.png",
            "image_local_expires_at": "2026-04-06T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    interpretation_id = response.json()["interpretation_id"]
    record = routes_v2.get_orchestrator().store.load(interpretation_id)
    assert record is not None
    assert record.image_url == "https://img.example.com/mandala/demo.png"
    assert record.image_storage_backend == "cos"
    assert record.image_storage_key == "aimandala/uploads/demo.png"
    assert record.image_local_expires_at == "2026-04-06T00:00:00+00:00"


def test_read_endpoints_refresh_cos_image_url_from_storage_key(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-cos-refresh.png"
    image_path.write_bytes(b"mock-image")
    presigned_calls = []

    class FakeCosConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class FakeCosClient:
        def __init__(self, config):
            self.config = config

        def get_presigned_download_url(self, **kwargs):
            presigned_calls.append(kwargs)
            return (
                f"https://{self.config.kwargs.get('Domain') or 'demo-bucket.cos.ap-shanghai.myqcloud.com'}/"
                f"{kwargs['Key']}?refresh=1"
            )

    fake_qcloud_module = types.SimpleNamespace(
        CosConfig=FakeCosConfig,
        CosS3Client=FakeCosClient,
    )

    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "cos",
            "AIMANDALA_UPLOAD_COS_SECRET_ID": "secret-id",
            "AIMANDALA_UPLOAD_COS_SECRET_KEY": "secret-key",
            "AIMANDALA_UPLOAD_COS_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_COS_REGION": "ap-shanghai",
            "AIMANDALA_UPLOAD_COS_PUBLIC_BASE_URL": "https://img.example.com/mandala",
            "AIMANDALA_COS_SIGNED_URL_TTL_SECONDS": "900",
        },
        clear=False,
    ), patch.dict(sys.modules, {"qcloud_cos": fake_qcloud_module}):
        create_response = client.post(
            "/api/v2/interpretations",
            json={
                "user_id": "user-api-read-refresh",
                "image_path": str(image_path),
                "storage_backend": "cos",
                "storage_key": "aimandala/uploads/demo.png",
                "image_url": "https://expired.example.com/demo.png",
                "image_local_expires_at": "2026-04-06T00:00:00+00:00",
            },
        )

        interpretation_id = create_response.json()["interpretation_id"]
        status_response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")
        report_response = client.get(f"/api/v2/interpretations/{interpretation_id}/report")
        history_response = client.get("/api/v2/users/user-api-read-refresh/interpretations")

    assert status_response.status_code == 200
    assert report_response.status_code == 200
    assert history_response.status_code == 200
    assert status_response.json()["image_url"] == "https://img.example.com/aimandala/uploads/demo.png?refresh=1"
    assert report_response.json()["image_url"] == "https://img.example.com/aimandala/uploads/demo.png?refresh=1"
    assert history_response.json()[0]["image_url"] == "https://img.example.com/aimandala/uploads/demo.png?refresh=1"
    assert all(call["Key"] == "aimandala/uploads/demo.png" for call in presigned_calls)


def test_read_endpoints_return_null_image_url_when_storage_identity_missing(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-missing-storage.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-missing-storage",
            "image_path": str(image_path),
            "image_url": "https://expired.example.com/demo.png",
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    status_response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")
    report_response = client.get(f"/api/v2/interpretations/{interpretation_id}/report")
    history_response = client.get("/api/v2/users/user-api-missing-storage/interpretations")

    assert status_response.status_code == 200
    assert report_response.status_code == 200
    assert history_response.status_code == 200
    assert status_response.json()["image_url"] is None
    assert report_response.json()["image_url"] is None
    assert history_response.json()[0]["image_url"] is None


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
            "theme": "intimate_relationship",
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


def test_get_user_interpretations_endpoint_keeps_pro_generating_records_in_pending(tmp_path):
    from app.api.main import app
    from app.api import routes_v2

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "history-pro-generating.png"
    image_path.write_bytes(b"mock-image-pro-generating")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-pro-pending",
            "image_path": str(image_path),
            "theme": "general",
        },
    )
    assert create_response.status_code == 200
    interpretation_id = create_response.json()["interpretation_id"]

    with patch.object(routes_v2, "_ensure_pro_upgrade_job", lambda _: None):
        upgrade_response = client.post(f"/api/v2/interpretations/{interpretation_id}/upgrade")
    assert upgrade_response.status_code == 200

    ready_response = client.get("/api/v2/users/user-api-pro-pending/interpretations?filter=ready")
    pending_response = client.get("/api/v2/users/user-api-pro-pending/interpretations?filter=pending")

    assert ready_response.status_code == 200
    assert pending_response.status_code == 200

    ready_data = ready_response.json()
    pending_data = pending_response.json()

    assert ready_data == []
    assert len(pending_data) == 1
    assert pending_data[0]["interpretation_id"] == interpretation_id
    assert pending_data[0]["version_purchased"] == ["lite", "pro"]
    assert pending_data[0]["generation_stage"] == "generating"
    assert pending_data[0]["generation_progress"] == 85


def test_get_user_interpretations_endpoint_supports_theme_and_limit_query(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    first_image = tmp_path / "history-general.png"
    second_image = tmp_path / "history-wealth-career.png"
    third_image = tmp_path / "history-intimate-relationship.png"
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
            "theme": "wealth_career",
        },
    )
    client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-theme-limit",
            "image_path": str(third_image),
            "theme": "wealth_career",
        },
    )

    theme_response = client.get(
        "/api/v2/users/user-api-theme-limit/interpretations?theme=wealth_career&limit=1"
    )

    assert theme_response.status_code == 200
    theme_data = theme_response.json()
    assert len(theme_data) == 1
    assert all(item["theme"] == "wealth_career" for item in theme_data)


def test_get_user_interpretations_endpoint_distinguishes_lite_and_lite_plus_pro(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    lite_image = tmp_path / "history-lite.png"
    pro_image = tmp_path / "history-pro.png"
    lite_image.write_bytes(b"mock-image-1")
    pro_image.write_bytes(b"mock-image-2")

    lite_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-history-version",
            "image_path": str(lite_image),
            "theme": "general",
        },
    )
    pro_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-history-version",
            "image_path": str(pro_image),
            "theme": "wealth_career",
        },
    )

    pro_interpretation_id = pro_response.json()["interpretation_id"]
    upgrade_response = client.post(f"/api/v2/interpretations/{pro_interpretation_id}/upgrade")
    assert upgrade_response.status_code == 200

    response = client.get("/api/v2/users/user-api-history-version/interpretations")

    assert response.status_code == 200
    data = response.json()
    versions_by_id = {
        item["interpretation_id"]: item["version_purchased"]
        for item in data
    }

    assert versions_by_id[lite_response.json()["interpretation_id"]] == ["lite"]
    assert versions_by_id[pro_interpretation_id] == ["lite", "pro"]


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
    assert data["title"] == "慢慢亮起来的中心"
    assert data["overall_impression"] is not None
    assert data["structured"]["title"] == "慢慢亮起来的中心"
    assert data["structured"]["prompt_schema_validation_issues"] == []
    assert "pro_teaser" in data["structured"]
    assert "六个核心洞察" in data["report"]
    assert "重要声明" in data["report"]
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
    assert data["success"] is True
    assert data["enabled"] is True
    assert data["status"] in {"processing", "completed"}

    report_data = _wait_for_pro_report(client, interpretation_id)
    assert report_data["version"] == "pro"
    assert report_data["error"] is None
    assert "一梳 Pro 版报告" in report_data["report"]
    assert "重要声明" in report_data["report"]


def test_get_report_endpoint_defaults_to_best_available_version_after_upgrade(tmp_path):
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-upgrade-default-report.png"
    image_path.write_bytes(b"mock-image")

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": "user-api-upgrade-default-report",
            "image_path": str(image_path),
        },
    )
    interpretation_id = create_response.json()["interpretation_id"]

    upgrade_response = client.post(f"/api/v2/interpretations/{interpretation_id}/upgrade")
    assert upgrade_response.status_code == 200

    _wait_for_pro_report(client, interpretation_id)

    default_report_response = client.get(
        f"/api/v2/interpretations/{interpretation_id}/report"
    )
    lite_report_response = client.get(
        f"/api/v2/interpretations/{interpretation_id}/report",
        params={"version": "lite"},
    )

    assert default_report_response.status_code == 200
    assert lite_report_response.status_code == 200

    default_report = default_report_response.json()
    lite_report = lite_report_response.json()

    assert default_report["version"] == "pro"
    assert default_report["structured"]["prompt_schema_validation_issues"] == []
    assert default_report["can_upgrade"] is False
    assert lite_report["version"] == "lite"
    assert lite_report["structured"]["prompt_schema_validation_issues"] == []
    assert lite_report["can_upgrade"] is False


def test_upgrade_placeholder_endpoint_404_for_unknown_record():
    from app.api.main import app

    _reset_api_state()
    client = TestClient(app)
    response = client.post("/api/v2/interpretations/not-found/upgrade")

    assert response.status_code == 404


def test_shared_llm_client_powers_detection_generation_and_report_chat(tmp_path):
    from app.api.main import app

    class FakeLLMClient:
        def generate_structured(self, *, task, prompt, schema, image_path=None):
            if task == "vision":
                return {
                    "inner_radius": 0.28,
                    "middle_radius": 0.61,
                    "confidence": 0.91,
                    "method": "fake_vision",
                    "summary": "识别到了比较清晰的内中圈边界",
                }
            if "first_impression" in json.dumps(schema, ensure_ascii=False):
                return {
                    "first_impression": "这张画在收与放之间保持了一种克制的张力。",
                    "core_insight_table": {
                        "能量本质": "先收住自己，再慢慢向外表达。",
                    },
                    "micro_analysis_detailed": {
                        "相邻关系": "内外之间有明显缓冲带。",
                    },
                    "root_cause": {
                        "核心牵引": "你在安全感不足时会先保护边界。",
                    },
                    "imbalance_confirmed": {
                        "primary": "边界收缩型",
                        "evidence": "内圈较紧，外圈表达更谨慎。",
                    },
                    "healing_suggestions": [
                        {"phase": "1-7天", "focus": "放慢", "practice": "每天留三分钟只看画面中心。"},
                    ],
                }
            return {
                "title": "来自真实 LLM 的 Lite 标题",
                "overall_impression": "这幅画先把自己轻轻收拢，再试着向外试探。",
                "visual_elements": "画面中心更凝聚，中圈保留了过渡空间。",
                "emotion_portrait": "你像是在保护自己，也在等待一个更稳的出口。",
                "story": {
                    "base": "你先把感受收回自己这里。",
                    "contradiction": "你想表达，但还在观察外界是否安全。",
                },
                "theme_scene": "当你需要先确认环境是否稳定时",
                "theme_impact": "你会放慢表达节奏，避免自己过早暴露。",
                "theme_awareness": "不是不想靠近，而是需要更稳的节奏。",
                "three_awareness": [
                    {"day": 1, "title": "先停一下", "content": "先看见自己在收紧什么。"},
                ],
                "pro_teaser": "如果继续进入 Pro，可以看到这份收缩背后的保护逻辑。",
            }

        def generate_text(self, *, task, system_prompt, user_prompt):
            assert task == "chat"
            assert "用户当前问题" in user_prompt
            return "基于这份报告来看，你现在最值得继续追问的是：你在什么时候开始先收住自己。"

    _reset_api_state()
    client = TestClient(app)
    image_path = tmp_path / "mandala-llm-powered.png"
    image_path.write_bytes(b"mock-image")

    with patch("app.api.routes_v2.create_llm_client_from_env", return_value=FakeLLMClient()):
        detect_response = client.post(
            "/api/v2/detect-circles",
            json={"image_path": str(image_path)},
        )
        assert detect_response.status_code == 200
        detect_data = detect_response.json()
        assert detect_data["method"] == "llm_vision"
        assert detect_data["inner_radius"] == 0.28
        assert detect_data["middle_radius"] == 0.61

        create_response = client.post(
            "/api/v2/interpretations",
            json={
                "user_id": "user-api-llm-shared",
                "image_path": str(image_path),
                "theme": "general",
            },
        )
        assert create_response.status_code == 200
        interpretation_id = create_response.json()["interpretation_id"]

        lite_report = client.get(f"/api/v2/interpretations/{interpretation_id}/report")
        assert lite_report.status_code == 200
        lite_data = lite_report.json()
        assert lite_data["title"] == "来自真实 LLM 的 Lite 标题"
        assert lite_data["overall_impression"] == "这幅画先把自己轻轻收拢，再试着向外试探。"

        upgrade_response = client.post(f"/api/v2/interpretations/{interpretation_id}/upgrade")
        assert upgrade_response.status_code == 200

        chat_response = client.post(
            f"/api/v2/interpretations/{interpretation_id}/chat",
            json={
                "message": "我为什么总觉得自己要先收住？",
                "history": [
                    {"role": "user", "content": "我最在意边界感。"},
                ],
            },
        )
        assert chat_response.status_code == 200
        chat_data = chat_response.json()
        assert chat_data["interpretation_id"] == interpretation_id
        assert "最值得继续追问" in chat_data["reply"]
