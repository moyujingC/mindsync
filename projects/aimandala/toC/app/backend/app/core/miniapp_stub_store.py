"""Local stub state storage for miniapp batch-D API contracts."""

import errno
import hashlib
import json
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4


@dataclass
class MiniappOrderRecord:
    order_id: str
    interpretation_id: str
    product_type: str
    channel: str
    purchase_state: str
    payable_amount: float
    currency: str
    version_granted: list[str] | None
    latest_purchase_updated_at: str | None
    wechat_pay_payload: dict[str, Any] | None
    open_id: str | None = None
    debug_canonical_user_id: str | None = None
    payment_reference: str | None = None
    raw_payload: dict[str, Any] | None = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "interpretation_id": self.interpretation_id,
            "product_type": self.product_type,
            "channel": self.channel,
            "purchase_state": self.purchase_state,
            "payable_amount": self.payable_amount,
            "currency": self.currency,
            "version_granted": self.version_granted,
            "latest_purchase_updated_at": self.latest_purchase_updated_at,
            "wechat_pay_payload": self.wechat_pay_payload,
            "open_id": self.open_id,
            "debug_canonical_user_id": self.debug_canonical_user_id,
            "payment_reference": self.payment_reference,
            "raw_payload": self.raw_payload,
        }


class MiniappStubStore:
    ATOMIC_WRITE_RETRIES = 1
    RETRYABLE_WRITE_ERRNOS = {errno.ENOENT, errno.EINVAL}
    _shared_io_locks: Dict[str, threading.RLock] = {}
    _shared_io_locks_guard = threading.Lock()

    def __init__(self, storage_dir: str | None = None):
        if storage_dir is None:
            project_root = Path(__file__).parent.parent
            storage_dir = project_root / "data" / "miniapp_stub"
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._cache: Dict[str, MiniappOrderRecord] = {}
        self._io_lock = self._get_shared_io_lock(self.storage_dir)

    @classmethod
    def _get_shared_io_lock(cls, storage_dir: Path) -> threading.RLock:
        key = str(storage_dir.expanduser().resolve())
        with cls._shared_io_locks_guard:
            existing = cls._shared_io_locks.get(key)
            if existing is not None:
                return existing
            lock = threading.RLock()
            cls._shared_io_locks[key] = lock
            return lock

    def _get_order_file_path(self, order_id: str) -> Path:
        return self.storage_dir / f"{order_id}.json"

    def save_order(self, record: MiniappOrderRecord) -> None:
        self._cache[record.order_id] = record
        self._write_json_file(self._get_order_file_path(record.order_id), record.to_dict())

    def load_order(self, order_id: str) -> Optional[MiniappOrderRecord]:
        if order_id in self._cache:
            return self._cache[order_id]

        file_path = self._get_order_file_path(order_id)
        if not file_path.exists():
            return None

        data = self._read_json_file(file_path)
        record = MiniappOrderRecord(
            order_id=data["order_id"],
            interpretation_id=data["interpretation_id"],
            product_type=data["product_type"],
            channel=data["channel"],
            purchase_state=data["purchase_state"],
            payable_amount=data["payable_amount"],
            currency=data["currency"],
            version_granted=data.get("version_granted"),
            latest_purchase_updated_at=data.get("latest_purchase_updated_at"),
            wechat_pay_payload=data.get("wechat_pay_payload"),
            open_id=data.get("open_id"),
            debug_canonical_user_id=data.get("debug_canonical_user_id"),
            payment_reference=data.get("payment_reference"),
            raw_payload=data.get("raw_payload"),
        )
        self._cache[order_id] = record
        return record

    def create_order(
        self,
        *,
        interpretation_id: str,
        product_type: str,
        channel: str,
        payable_amount: float,
        currency: str,
        wechat_pay_payload: dict[str, Any],
        open_id: str | None = None,
        debug_canonical_user_id: str | None = None,
    ) -> MiniappOrderRecord:
        timestamp = datetime.now().isoformat()
        record = MiniappOrderRecord(
            order_id=f"miniapp-order-{uuid4().hex[:12]}",
            interpretation_id=interpretation_id,
            product_type=product_type,
            channel=channel,
            purchase_state="pending",
            payable_amount=payable_amount,
            currency=currency,
            version_granted=None,
            latest_purchase_updated_at=timestamp,
            wechat_pay_payload=wechat_pay_payload,
            open_id=open_id,
            debug_canonical_user_id=debug_canonical_user_id,
        )
        self.save_order(record)
        return record

    def update_order_state(
        self,
        order_id: str,
        *,
        purchase_state: str,
        version_granted: list[str] | None = None,
        payment_reference: str | None = None,
        raw_payload: dict[str, Any] | None = None,
    ) -> Optional[MiniappOrderRecord]:
        record = self.load_order(order_id)
        if record is None:
            return None
        record.purchase_state = purchase_state
        if version_granted is not None:
            record.version_granted = version_granted
        record.payment_reference = payment_reference
        record.raw_payload = raw_payload
        record.latest_purchase_updated_at = datetime.now().isoformat()
        self.save_order(record)
        return record

    @staticmethod
    def build_stub_open_id(code: str) -> str:
        digest = hashlib.sha1(code.encode("utf-8")).hexdigest()[:12]
        return f"stub-openid-{digest}"

    @staticmethod
    def build_session_id(open_id: str, canonical_user_id: str) -> str:
        payload = f"{open_id}:{canonical_user_id}".encode("utf-8")
        digest = hashlib.sha1(payload).hexdigest()[:16]
        return f"miniapp-session-{digest}"

    def _read_json_file(self, file_path: Path) -> Dict[str, Any]:
        with self._io_lock:
            return json.loads(file_path.read_text(encoding="utf-8"))

    def _write_json_file(self, file_path: Path, data: Dict[str, Any]) -> None:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        serialized = json.dumps(data, ensure_ascii=False, indent=2)
        attempts = self.ATOMIC_WRITE_RETRIES + 1

        with self._io_lock:
            for attempt in range(attempts):
                temp_path = file_path.with_suffix(f"{file_path.suffix}.tmp")
                try:
                    temp_path.write_text(serialized, encoding="utf-8")
                    temp_path.replace(file_path)
                    return
                except OSError as error:
                    if temp_path.exists():
                        temp_path.unlink(missing_ok=True)
                    if (
                        error.errno not in self.RETRYABLE_WRITE_ERRNOS
                        or attempt >= attempts - 1
                    ):
                        raise
