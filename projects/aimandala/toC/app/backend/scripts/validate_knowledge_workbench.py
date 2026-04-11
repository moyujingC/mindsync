"""Validate the knowledge pack and local fixture manifest for the v2.2 workbench."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.knowledge_runtime.workbench import KnowledgeWorkbench  # noqa: E402


def main() -> int:
    result = KnowledgeWorkbench().validate()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
