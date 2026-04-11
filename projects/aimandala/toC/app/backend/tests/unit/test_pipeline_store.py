"""Unit tests for the pipeline interpretation store helpers."""

import errno
import json
import os
import sys
from pathlib import Path

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.pipeline.store import InterpretationStore


def test_interpretation_store_shares_io_lock_for_same_dir(tmp_path):
    storage_dir = tmp_path / "interpretations"

    store_a = InterpretationStore(storage_dir=str(storage_dir))
    store_b = InterpretationStore(storage_dir=str(storage_dir))

    assert store_a._io_lock is store_b._io_lock


def test_write_json_file_retries_on_transient_replace_failure(tmp_path, monkeypatch):
    storage_dir = tmp_path / "interpretations"
    store = InterpretationStore(storage_dir=str(storage_dir))
    file_path = storage_dir / "record.json"
    original_replace = Path.replace
    replace_calls = {"count": 0}

    def flaky_replace(self, target):
        replace_calls["count"] += 1
        if replace_calls["count"] == 1:
            raise FileNotFoundError(errno.ENOENT, "transient replace failure")
        return original_replace(self, target)

    monkeypatch.setattr(Path, "replace", flaky_replace)

    store._write_json_file(file_path, {"schema_version": "v2.1", "ok": True})

    assert replace_calls["count"] == 2
    assert json.loads(file_path.read_text(encoding="utf-8")) == {
        "schema_version": "v2.1",
        "ok": True,
    }
