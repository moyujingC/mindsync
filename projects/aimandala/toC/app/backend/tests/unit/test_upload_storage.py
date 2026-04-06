"""Unit tests for upload storage strategy abstraction."""

import io
import os
import sys
import types
from datetime import datetime, timedelta
from unittest.mock import patch

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from fastapi import UploadFile
from starlette.datastructures import Headers

from app.core.uploads.storage import (
    build_storage_key,
    COSUploadConfig,
    COSUploadStorage,
    LocalUploadStorage,
    OSSUploadConfig,
    OSSUploadStorage,
    S3UploadConfig,
    S3UploadStorage,
    UnsupportedUploadStorage,
    _normalize_key_prefix,
    create_upload_storage_from_env,
    load_cos_upload_config_from_env,
    load_local_upload_retention_hours_from_env,
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
    assert stored.local_expires_at is not None
    assert storage.resolve_storage_path(stored.storage_key) == tmp_path / stored.storage_key


def test_local_upload_storage_rejects_nested_storage_key(tmp_path):
    storage = LocalUploadStorage(base_dir=tmp_path, retention_hours=24)

    try:
        storage.resolve_storage_path("../unsafe.png")
    except ValueError as error:
        assert "Invalid local storage key" in str(error)
    else:
        raise AssertionError("Expected nested storage key to be rejected")


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


def test_create_upload_storage_from_env_returns_cos_backend():
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
    ):
        storage = create_upload_storage_from_env()

    assert isinstance(storage, COSUploadStorage)
    assert storage.backend_name == "cos"
    assert storage.config == COSUploadConfig(
        secret_id="secret-id",
        secret_key="secret-key",
        bucket="demo-bucket",
        region="ap-shanghai",
        key_prefix="aimandala/uploads",
        public_base_url=None,
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


def test_load_cos_upload_config_from_env_requires_secret_bucket_and_region():
    with patch.dict(
        os.environ,
        {
            "AIMANDALA_UPLOAD_COS_SECRET_ID": "",
            "AIMANDALA_UPLOAD_COS_SECRET_KEY": "",
            "AIMANDALA_UPLOAD_COS_BUCKET": "",
            "AIMANDALA_UPLOAD_COS_REGION": "",
        },
        clear=False,
    ):
        try:
            load_cos_upload_config_from_env()
        except ValueError as error:
            assert "AIMANDALA_UPLOAD_COS_SECRET_ID" in str(error)
        else:
            raise AssertionError("Expected missing COS config to raise ValueError")


def test_load_local_upload_retention_hours_from_env_defaults_to_24():
    with patch.dict(os.environ, {}, clear=False):
        retention_hours = load_local_upload_retention_hours_from_env()

    assert retention_hours == 24


def test_load_local_upload_retention_hours_from_env_requires_positive_int():
    with patch.dict(
        os.environ,
        {"AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS": "0"},
        clear=False,
    ):
        try:
            load_local_upload_retention_hours_from_env()
        except ValueError as error:
            assert "positive integer" in str(error)
        else:
            raise AssertionError("Expected invalid local retention to raise ValueError")


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
    assert stored.local_expires_at is not None


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
    assert stored.local_expires_at is not None


def test_cos_upload_storage_returns_remote_metadata_and_keeps_local_path(tmp_path):
    upload_calls = []

    class FakeCosConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class FakeCosClient:
        def __init__(self, config):
            self.config = config

        def put_object(self, **kwargs):
            upload_calls.append(kwargs)

    fake_qcloud_module = types.SimpleNamespace(
        CosConfig=FakeCosConfig,
        CosS3Client=FakeCosClient,
    )
    storage = COSUploadStorage(
        COSUploadConfig(
            secret_id="secret-id",
            secret_key="secret-key",
            bucket="demo-bucket",
            region="ap-shanghai",
            key_prefix="mandala/uploads",
            public_base_url="https://cdn.example.com/assets",
        ),
        local_fallback=LocalUploadStorage(base_dir=tmp_path, retention_hours=24),
    )
    upload = UploadFile(
        filename="mandala.png",
        file=io.BytesIO(b"mock-upload-image"),
        headers=Headers({"content-type": "image/png"}),
    )

    import asyncio

    with patch.dict(sys.modules, {"qcloud_cos": fake_qcloud_module}):
        stored = asyncio.run(storage.save_upload(upload))

    assert stored.storage_backend == "cos"
    assert stored.storage_key.startswith("mandala/uploads/")
    assert stored.image_url == f"https://cdn.example.com/assets/{stored.storage_key}"
    assert os.path.exists(stored.image_path)
    assert stored.local_expires_at is not None
    assert len(upload_calls) == 1
    assert upload_calls[0]["Bucket"] == "demo-bucket"
    assert upload_calls[0]["Key"] == stored.storage_key
    assert upload_calls[0]["ContentType"] == "image/png"


def test_cos_upload_storage_requires_sdk(tmp_path):
    storage = COSUploadStorage(
        COSUploadConfig(
            secret_id="secret-id",
            secret_key="secret-key",
            bucket="demo-bucket",
            region="ap-shanghai",
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

    with patch.dict(sys.modules, {"qcloud_cos": None}):
        try:
            asyncio.run(storage.save_upload(upload))
        except NotImplementedError as error:
            assert "cos-python-sdk-v5" in str(error)
        else:
            raise AssertionError("Expected missing COS SDK to raise NotImplementedError")
