"""Diff two knowledge workbench builds."""

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
    parser.add_argument("--base", default="current", help="Base build selector")
    parser.add_argument("--target", required=True, help="Target build selector")
    args = parser.parse_args()

    result = KnowledgeWorkbench().diff_builds(
        base_selector=args.base,
        target_selector=args.target,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
