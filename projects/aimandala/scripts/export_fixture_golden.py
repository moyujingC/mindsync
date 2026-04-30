#!/usr/bin/env python3
"""Export one fixture as Batch F golden review assets."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "toC" / "app" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.knowledge_runtime.workbench import KnowledgeWorkbench


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture-id", required=True)
    parser.add_argument("--version", choices=["lite", "pro"], required=True)
    parser.add_argument("--build-selector", default="current")
    parser.add_argument(
        "--output-dir",
        default=str(PROJECT_ROOT / "fixtures" / "toc-mvp" / "golden"),
        help="Repo-relative or absolute output root. Default: fixtures/toc-mvp/golden",
    )
    return parser


async def _run(args: argparse.Namespace) -> dict[str, object]:
    workbench = KnowledgeWorkbench()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = (PROJECT_ROOT / output_dir).resolve()
    return await workbench.export_fixture_golden(
        fixture_id=args.fixture_id,
        build_selector=args.build_selector,
        version=args.version,
        output_dir=output_dir,
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    result = asyncio.run(_run(args))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
