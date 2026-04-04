"""Upload storage strategy abstractions for migrated browser image uploads."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol, runtime_checkable
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
        )


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

        return StoredUpload(
            image_path=str(stored_path),
            storage_backend="local",
            storage_key=stored_filename,
            original_filename=file.filename or stored_filename,
            content_type=file.content_type,
            size_bytes=size_bytes,
        )


def create_upload_storage_from_env() -> UploadStorage:
    """Create the currently configured upload storage backend.

    Current supported modes:
    - `local`: store uploads under backend-local `data/uploads/`

    Reserved for future backends:
    - `s3`
    - `oss`
    """

    backend = os.getenv("AIMANDALA_UPLOAD_BACKEND", "local").strip().lower()

    if backend in {"", "local"}:
        return LocalUploadStorage()

    if backend == "s3":
        return S3UploadStorage(load_s3_upload_config_from_env())

    if backend == "oss":
        return OSSUploadStorage(load_oss_upload_config_from_env())

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
