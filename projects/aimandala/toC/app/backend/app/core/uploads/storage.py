"""Upload storage strategy abstractions for migrated browser image uploads."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Protocol, runtime_checkable
from urllib.parse import urlsplit
from uuid import uuid4

from fastapi import UploadFile


@dataclass(frozen=True)
class StoredUpload:
    """Normalized metadata returned after persisting an uploaded image."""

    image_path: str
    storage_backend: str
    storage_key: str
    original_filename: str
    content_type: str | None
    size_bytes: int
    image_url: str | None = None
    local_expires_at: str | None = None


@dataclass(frozen=True)
class S3UploadConfig:
    """Configuration required by a future S3-backed upload backend."""

    bucket: str
    region: str
    key_prefix: str


@dataclass(frozen=True)
class OSSUploadConfig:
    """Configuration required by a future OSS-backed upload backend."""

    bucket: str
    endpoint: str
    key_prefix: str


@dataclass(frozen=True)
class COSUploadConfig:
    """Configuration required by a Tencent COS-backed upload backend."""

    secret_id: str
    secret_key: str
    bucket: str
    region: str
    key_prefix: str
    public_base_url: str | None = None
    signed_url_ttl_seconds: int = 900


@runtime_checkable
class UploadStorage(Protocol):
    """Contract for upload backends that can persist browser image uploads."""

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        """Persist an upload and return normalized metadata."""


class UnsupportedUploadStorage:
    """Placeholder strategy used when a configured backend is not implemented yet."""

    def __init__(self, backend_name: str, *, detail: str | None = None) -> None:
        self.backend_name = backend_name
        self.detail = detail or f"Upload storage backend '{self.backend_name}' is not implemented yet"

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        await file.close()
        raise NotImplementedError(self.detail)


class S3UploadStorage(UnsupportedUploadStorage):
    """Dry-run S3-backed strategy.

    Current behavior:
    1. persist upload locally so existing migration-time `image_path` flows still work
    2. emit stable S3-shaped `storage_key` and `image_url` metadata
    3. avoid introducing cloud SDK/runtime dependencies before the contract settles
    """

    def __init__(
        self,
        config: S3UploadConfig,
        *,
        local_fallback: LocalUploadStorage | None = None,
    ) -> None:
        self.config = config
        self.local_fallback = local_fallback or LocalUploadStorage()
        super().__init__("s3")

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        stored = await self.local_fallback.save_upload(file)
        storage_key = build_storage_key(self.config.key_prefix, stored.storage_key)
        image_url = (
            f"https://{self.config.bucket}.s3.{self.config.region}.amazonaws.com/"
            f"{storage_key}"
        )

        return StoredUpload(
            image_path=stored.image_path,
            storage_backend="s3",
            storage_key=storage_key,
            original_filename=stored.original_filename,
            content_type=stored.content_type,
            size_bytes=stored.size_bytes,
            image_url=image_url,
            local_expires_at=stored.local_expires_at,
        )


class OSSUploadStorage(UnsupportedUploadStorage):
    """Dry-run OSS-backed strategy with local fallback persistence."""

    def __init__(
        self,
        config: OSSUploadConfig,
        *,
        local_fallback: LocalUploadStorage | None = None,
    ) -> None:
        self.config = config
        self.local_fallback = local_fallback or LocalUploadStorage()
        super().__init__("oss")

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        stored = await self.local_fallback.save_upload(file)
        storage_key = build_storage_key(self.config.key_prefix, stored.storage_key)
        image_url = f"https://{self.config.bucket}.{self.config.endpoint}/{storage_key}"

        return StoredUpload(
            image_path=stored.image_path,
            storage_backend="oss",
            storage_key=storage_key,
            original_filename=stored.original_filename,
            content_type=stored.content_type,
            size_bytes=stored.size_bytes,
            image_url=image_url,
            local_expires_at=stored.local_expires_at,
        )


class COSUploadStorage:
    """Tencent COS-backed strategy with local fallback persistence.

    The migration-time browser flow still depends on a local `image_path` so
    the existing detect/create/report chain can read the uploaded file without
    first teaching every downstream step how to fetch remote objects.
    """

    def __init__(
        self,
        config: COSUploadConfig,
        *,
        local_fallback: LocalUploadStorage | None = None,
    ) -> None:
        self.config = config
        self.local_fallback = local_fallback or LocalUploadStorage()
        self.backend_name = "cos"

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        stored = await self.local_fallback.save_upload(file)
        storage_key = build_storage_key(self.config.key_prefix, stored.storage_key)
        self._upload_file_to_cos(
            file_path=stored.image_path,
            storage_key=storage_key,
            content_type=stored.content_type,
        )

        return StoredUpload(
            image_path=stored.image_path,
            storage_backend="cos",
            storage_key=storage_key,
            original_filename=stored.original_filename,
            content_type=stored.content_type,
            size_bytes=stored.size_bytes,
            image_url=self.build_temporary_url(storage_key),
            local_expires_at=stored.local_expires_at,
        )

    def build_temporary_url(self, storage_key: str) -> str:
        client = self._create_cos_client()
        return client.get_presigned_download_url(
            Bucket=self.config.bucket,
            Key=storage_key,
            Expired=self.config.signed_url_ttl_seconds,
        )

    def _upload_file_to_cos(self, *, file_path: str, storage_key: str, content_type: str | None) -> None:
        client = self._create_cos_client()
        with Path(file_path).open("rb") as content:
            client.put_object(
                Bucket=self.config.bucket,
                Body=content.read(),
                Key=storage_key,
                ContentType=content_type or "application/octet-stream",
            )

    def _create_cos_client(self) -> Any:
        try:
            from qcloud_cos import CosConfig, CosS3Client  # type: ignore
        except ImportError as error:
            raise NotImplementedError(
                "COS backend requires `cos-python-sdk-v5`; install it before enabling AIMANDALA_UPLOAD_BACKEND=cos"
            ) from error

        cos_config = CosConfig(
            Region=self.config.region,
            SecretId=self.config.secret_id,
            SecretKey=self.config.secret_key,
            Domain=self._resolve_cos_domain(),
        )
        return CosS3Client(cos_config)

    def _resolve_cos_domain(self) -> str | None:
        if not self.config.public_base_url:
            return None
        parsed = urlsplit(self.config.public_base_url.rstrip("/"))
        return parsed.netloc or parsed.path or None

class LocalUploadStorage:
    """Local filesystem-backed upload storage for migration-time browser uploads.

    This strategy intentionally keeps behavior small and explicit:
    1. persist uploads under backend-local `data/uploads/`
    2. opportunistically clean expired files
    3. return a stable `image_path` that existing V2 APIs can already consume
    """

    def __init__(
        self,
        *,
        base_dir: str | Path | None = None,
        retention_hours: int = 24,
    ) -> None:
        if base_dir is None:
            project_root = Path(__file__).resolve().parent.parent.parent.parent
            base_dir = project_root / "data" / "uploads"

        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.retention_hours = retention_hours

    def cleanup_expired(self) -> int:
        """Delete expired temporary uploads from local storage."""

        cutoff = datetime.now(timezone.utc) - timedelta(hours=self.retention_hours)
        deleted = 0

        for path in self.base_dir.iterdir():
            if not path.is_file():
                continue

            modified_at = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
            if modified_at >= cutoff:
                continue

            path.unlink(missing_ok=True)
            deleted += 1

        return deleted

    async def save_upload(self, file: UploadFile) -> StoredUpload:
        """Persist a FastAPI upload and return normalized storage metadata."""

        self.cleanup_expired()

        suffix = Path(file.filename or "").suffix or ".png"
        stored_filename = f"{uuid4().hex}{suffix}"
        stored_path = self.base_dir / stored_filename

        size_bytes = 0
        with stored_path.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                size_bytes += len(chunk)
                buffer.write(chunk)

        await file.close()
        local_expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=self.retention_hours)
        ).isoformat()

        return StoredUpload(
            image_path=str(stored_path),
            storage_backend="local",
            storage_key=stored_filename,
            original_filename=file.filename or stored_filename,
            content_type=file.content_type,
            size_bytes=size_bytes,
            local_expires_at=local_expires_at,
        )

    def resolve_storage_path(self, storage_key: str) -> Path:
        """Resolve a local storage key back to its on-disk upload path."""

        normalized = Path(storage_key).name
        if normalized != storage_key:
            raise ValueError("Invalid local storage key")

        return self.base_dir / normalized


def create_upload_storage_from_env() -> UploadStorage:
    """Create the currently configured upload storage backend.

    Local development still defaults to `local`. Formal release environments
    should set `AIMANDALA_UPLOAD_BACKEND=cos` explicitly so remote object
    metadata becomes the long-lived source of truth while local files remain a
    runtime cache/fallback only.
    """

    backend = os.getenv("AIMANDALA_UPLOAD_BACKEND", "local").strip().lower()
    retention_hours = load_local_upload_retention_hours_from_env()

    if backend in {"", "local"}:
        return LocalUploadStorage(retention_hours=retention_hours)

    if backend == "s3":
        return S3UploadStorage(
            load_s3_upload_config_from_env(),
            local_fallback=LocalUploadStorage(retention_hours=retention_hours),
        )

    if backend == "oss":
        return OSSUploadStorage(
            load_oss_upload_config_from_env(),
            local_fallback=LocalUploadStorage(retention_hours=retention_hours),
        )

    if backend == "cos":
        return COSUploadStorage(
            load_cos_upload_config_from_env(),
            local_fallback=LocalUploadStorage(retention_hours=retention_hours),
        )

    return UnsupportedUploadStorage(backend)


def load_s3_upload_config_from_env() -> S3UploadConfig:
    """Load required S3 upload config from environment."""

    return S3UploadConfig(
        bucket=_read_required_env("AIMANDALA_UPLOAD_S3_BUCKET"),
        region=_read_required_env("AIMANDALA_UPLOAD_S3_REGION"),
        key_prefix=_normalize_key_prefix(
            os.getenv("AIMANDALA_UPLOAD_S3_KEY_PREFIX", "aimandala/uploads")
        ),
    )


def load_oss_upload_config_from_env() -> OSSUploadConfig:
    """Load required OSS upload config from environment."""

    return OSSUploadConfig(
        bucket=_read_required_env("AIMANDALA_UPLOAD_OSS_BUCKET"),
        endpoint=_read_required_env("AIMANDALA_UPLOAD_OSS_ENDPOINT"),
        key_prefix=_normalize_key_prefix(
            os.getenv("AIMANDALA_UPLOAD_OSS_KEY_PREFIX", "aimandala/uploads")
        ),
    )


def load_cos_upload_config_from_env() -> COSUploadConfig:
    """Load required Tencent COS upload config from environment."""

    public_base_url = os.getenv("AIMANDALA_UPLOAD_COS_PUBLIC_BASE_URL", "").strip() or None
    return COSUploadConfig(
        secret_id=_read_required_env("AIMANDALA_UPLOAD_COS_SECRET_ID"),
        secret_key=_read_required_env("AIMANDALA_UPLOAD_COS_SECRET_KEY"),
        bucket=_read_required_env("AIMANDALA_UPLOAD_COS_BUCKET"),
        region=_read_required_env("AIMANDALA_UPLOAD_COS_REGION"),
        key_prefix=_normalize_key_prefix(
            os.getenv("AIMANDALA_UPLOAD_COS_KEY_PREFIX", "aimandala/uploads")
        ),
        public_base_url=public_base_url.rstrip("/") if public_base_url else None,
        signed_url_ttl_seconds=load_cos_signed_url_ttl_seconds_from_env(),
    )


def _read_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if value:
        return value

    raise ValueError(f"Missing required upload storage config: {name}")


def _normalize_key_prefix(value: str) -> str:
    normalized = value.strip().strip("/")
    return normalized or "aimandala/uploads"


def build_storage_key(key_prefix: str, filename: str) -> str:
    return f"{_normalize_key_prefix(key_prefix)}/{filename.lstrip('/')}"


def load_cos_signed_url_ttl_seconds_from_env() -> int:
    """Load COS signed URL ttl in seconds."""

    raw_value = os.getenv("AIMANDALA_COS_SIGNED_URL_TTL_SECONDS", "900").strip()
    try:
        ttl_seconds = int(raw_value)
    except ValueError as error:
        raise ValueError(
            "AIMANDALA_COS_SIGNED_URL_TTL_SECONDS must be a positive integer"
        ) from error

    if ttl_seconds <= 0:
        raise ValueError(
            "AIMANDALA_COS_SIGNED_URL_TTL_SECONDS must be a positive integer"
        )
    return ttl_seconds


def load_local_upload_retention_hours_from_env() -> int:
    """Load local temporary upload retention hours from environment."""

    raw_value = os.getenv("AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS", "24").strip()
    try:
        retention_hours = int(raw_value)
    except ValueError as error:
        raise ValueError(
            "AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS must be a positive integer"
        ) from error

    if retention_hours <= 0:
        raise ValueError(
            "AIMANDALA_UPLOAD_LOCAL_RETENTION_HOURS must be a positive integer"
        )
    return retention_hours
