"""Unit tests for upload storage strategy abstraction."""

import io
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import patch

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from fastapi import UploadFile
from starlette.datastructures import Headers

from app.core.uploads.storage import (
    build_storage_key,
    LocalUploadStorage,
    OSSUploadConfig,
    OSSUploadStorage,
    S3UploadConfig,
    S3UploadStorage,
    UnsupportedUploadStorage,
    _normalize_key_prefix,
    create_upload_storage_from_env,
    load_oss_upload_config_from_env,
    load_s3_upload_config_from_env,
)


def test_local_upload_storage_persists_file(tmp_path):
    storage = LocalUploadStorage(base_dir=tmp_path, retention_hours=24)
    upload = UploadFile(
        filename="mandala.png",
        file=io.BytesIO(b"mock-upload-image"),
        headers=Headers({"content-type": "image/png"}),
    )

    import asyncio

    stored = asyncio.run(storage.save_upload(upload))

    assert stored is not None
    assert stored.storage_backend == "local"
    assert stored.storage_key.endswith(".png")
    assert stored.original_filename == "mandala.png"
    assert stored.content_type == "image/png"
    assert stored.size_bytes > 0
    assert os.path.exists(stored.image_path)


def test_local_upload_storage_cleanup_expired_files(tmp_path):
    storage = LocalUploadStorage(base_dir=tmp_path, retention_hours=24)
    expired = tmp_path / "expired.png"
    fresh = tmp_path / "fresh.png"
    expired.write_bytes(b"expired")
    fresh.write_bytes(b"fresh")

    expired_at = (datetime.now() - timedelta(hours=30)).timestamp()
    fresh_at = (datetime.now() - timedelta(hours=2)).timestamp()
    os.utime(expired, (expired_at, expired_at))
    os.utime(fresh, (fresh_at, fresh_at))

    deleted = storage.cleanup_expired()

    assert deleted == 1
    assert not expired.exists()
    assert fresh.exists()


def test_create_upload_storage_from_env_defaults_to_local():
    with patch.dict(os.environ, {}, clear=False):
        storage = create_upload_storage_from_env()

    assert isinstance(storage, LocalUploadStorage)


def test_create_upload_storage_from_env_returns_placeholder_for_future_backend():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "s3",
            "AIMANDALA_UPLOAD_S3_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_S3_REGION": "ap-southeast-1",
        },
        clear=False,
    ):
        storage = create_upload_storage_from_env()

    assert isinstance(storage, S3UploadStorage)
    assert storage.backend_name == "s3"
    assert storage.config == S3UploadConfig(
        bucket="demo-bucket",
        region="ap-southeast-1",
        key_prefix="aimandala/uploads",
    )


def test_create_upload_storage_from_env_returns_oss_placeholder():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_BACKEND": "oss",
            "AIMANDALA_UPLOAD_OSS_BUCKET": "demo-bucket",
            "AIMANDALA_UPLOAD_OSS_ENDPOINT": "oss-cn-hangzhou.aliyuncs.com",
        },
        clear=False,
    ):
        storage = create_upload_storage_from_env()

    assert isinstance(storage, OSSUploadStorage)
    assert storage.backend_name == "oss"
    assert storage.config == OSSUploadConfig(
        bucket="demo-bucket",
        endpoint="oss-cn-hangzhou.aliyuncs.com",
        key_prefix="aimandala/uploads",
    )


def test_create_upload_storage_from_env_returns_generic_placeholder_for_unknown_backend():
    with patch.dict(os.environ, {"AIMANDALA_UPLOAD_BACKEND": "custom"}, clear=False):
        storage = create_upload_storage_from_env()

    assert isinstance(storage, UnsupportedUploadStorage)
    assert storage.backend_name == "custom"


def test_load_s3_upload_config_from_env_requires_bucket_and_region():
    with patch.dict(
        os.environ,
        {"AIMANDALA_UPLOAD_S3_BUCKET": "", "AIMANDALA_UPLOAD_S3_REGION": ""},
        clear=False,
    ):
        try:
            load_s3_upload_config_from_env()
        except ValueError as error:
            assert "AIMANDALA_UPLOAD_S3_BUCKET" in str(error)
        else:
            raise AssertionError("Expected missing S3 config to raise ValueError")


def test_load_oss_upload_config_from_env_requires_bucket_and_endpoint():
    with patch.dict(
        os.environ,
        {"AIMANDALA_UPLOAD_OSS_BUCKET": "", "AIMANDALA_UPLOAD_OSS_ENDPOINT": ""},
        clear=False,
    ):
        try:
            load_oss_upload_config_from_env()
        except ValueError as error:
            assert "AIMANDALA_UPLOAD_OSS_BUCKET" in str(error)
        else:
            raise AssertionError("Expected missing OSS config to raise ValueError")


def test_key_prefix_normalization_strips_extra_slashes():
    assert _normalize_key_prefix(" /custom/prefix/ ") == "custom/prefix"
    assert _normalize_key_prefix("///") == "aimandala/uploads"


def test_build_storage_key_respects_normalized_prefix():
    assert build_storage_key(" /custom/prefix/ ", "file.png") == "custom/prefix/file.png"


def test_s3_upload_storage_dry_run_returns_remote_metadata(tmp_path):
    storage = S3UploadStorage(
        S3UploadConfig(
            bucket="demo-bucket",
            region="ap-southeast-1",
            key_prefix="mandala/uploads",
        ),
        local_fallback=LocalUploadStorage(base_dir=tmp_path, retention_hours=24),
    )
    upload = UploadFile(
        filename="mandala.png",
        file=io.BytesIO(b"mock-upload-image"),
        headers=Headers({"content-type": "image/png"}),
    )

    import asyncio

    stored = asyncio.run(storage.save_upload(upload))

    assert stored.storage_backend == "s3"
    assert stored.storage_key.startswith("mandala/uploads/")
    assert stored.image_url == (
        f"https://demo-bucket.s3.ap-southeast-1.amazonaws.com/{stored.storage_key}"
    )
    assert os.path.exists(stored.image_path)


def test_oss_upload_storage_dry_run_returns_remote_metadata(tmp_path):
    storage = OSSUploadStorage(
        OSSUploadConfig(
            bucket="demo-bucket",
            endpoint="oss-cn-hangzhou.aliyuncs.com",
            key_prefix="mandala/uploads",
        ),
        local_fallback=LocalUploadStorage(base_dir=tmp_path, retention_hours=24),
    )
    upload = UploadFile(
        filename="mandala.png",
        file=io.BytesIO(b"mock-upload-image"),
        headers=Headers({"content-type": "image/png"}),
    )

    import asyncio

    stored = asyncio.run(storage.save_upload(upload))

    assert stored.storage_backend == "oss"
    assert stored.storage_key.startswith("mandala/uploads/")
    assert stored.image_url == (
        f"https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/{stored.storage_key}"
    )
    assert os.path.exists(stored.image_path)
