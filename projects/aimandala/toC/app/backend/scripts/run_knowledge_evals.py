"""Run knowledge workbench fixture evals for one build selector."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.knowledge_runtime.workbench import KnowledgeWorkbench  # noqa: E402


async def _run(build_selector: str, fixture_ids: list[str]) -> dict:
    return await KnowledgeWorkbench().run_evals(
        build_selector=build_selector,
        fixture_ids=fixture_ids or None,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--build-selector",
        required=True,
        help="Build selector: current or candidate:<build_id>",
    )
    parser.add_argument(
        "--fixture-id",
        action="append",
        default=[],
        help="Optional fixture id, can be repeated",
    )
    args = parser.parse_args()

    result = asyncio.run(_run(args.build_selector, args.fixture_id))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
