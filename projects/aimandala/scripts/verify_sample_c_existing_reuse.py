#!/usr/bin/env python3
"""Verify fixture sample C: existing interpretation reuse semantics."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "toC" / "app" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def reset_api_state() -> None:
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
    shutil.rmtree(BACKEND_ROOT / "data", ignore_errors=True)


def main() -> int:
    from app.api.main import app

    reset_api_state()
    client = TestClient(app)

    with tempfile.TemporaryDirectory(prefix="aimandala-sample-c-") as temp_dir:
        image_path = Path(temp_dir) / "sample-c-existing.png"
        image_path.write_bytes(b"mock-image-existing")

        payload = {
            "user_id": "qa-fixture-user-c",
            "image_path": str(image_path),
            "theme": "general",
        }

        first = client.post("/api/v2/interpretations", json=payload)
        second = client.post("/api/v2/interpretations", json=payload)

        if first.status_code != 200 or second.status_code != 200:
            print(
                json.dumps(
                    {
                        "ok": False,
                        "first_status": first.status_code,
                        "second_status": second.status_code,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 1

        first_data = first.json()
        second_data = second.json()
        ok = (
            second_data.get("existing") is True
            and second_data.get("interpretation_id") == first_data.get("interpretation_id")
        )

        print(
            json.dumps(
                {
                    "ok": ok,
                    "sample_id": "toc-mvp-sample-c-existing-reuse",
                    "first_interpretation_id": first_data.get("interpretation_id"),
                    "second_interpretation_id": second_data.get("interpretation_id"),
                    "second_existing": second_data.get("existing"),
                    "theme": second_data.get("theme"),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
