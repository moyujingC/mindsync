#!/usr/bin/env python3
"""Verify fixture 003: existing interpretation reuse semantics."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "toC" / "app" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))


def reset_api_state(*, temp_root: Path | None = None) -> None:
    from app.api import routes_v2
    from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator
    from app.core.pipeline.store import InterpretationStore

    routes_v2._active_pro_upgrade_jobs.clear()
    routes_v2._upload_storage = None
    routes_v2._knowledge_workbench = None
    routes_v2._miniapp_stub_store = None
    routes_v2._orchestrator = None

    if temp_root is not None:
        store = InterpretationStore(storage_dir=str(temp_root / "interpretations"))
        routes_v2._orchestrator = LayeredOrchestrator(
            store=store,
            enable_vision=False,
        )


def main() -> int:
    from app.api.main import app

    with tempfile.TemporaryDirectory(prefix="aimandala-fixture-003-") as temp_dir:
        reset_api_state(temp_root=Path(temp_dir))
        client = TestClient(app)

        image_path = PROJECT_ROOT / "fixtures" / "toc-mvp" / "assets" / "IMG_5062.jpeg"
        payload = {
            "user_id": "qa-fixture-user-003",
            "image_path": str(image_path),
            "theme": "general",
            "painting_intention": "再次验证相同输入是否复用",
            "painting_feeling": "保持不变",
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
                    "sample_id": "toc-mvp-fixture-003",
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
