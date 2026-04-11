"""Compile one candidate knowledge build with quality metadata."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.knowledge_runtime.workbench import KnowledgeWorkbench  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-id", required=True, help="Candidate build id, e.g. 20260411-001")
    args = parser.parse_args()

    result = KnowledgeWorkbench().build_candidate(args.build_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
