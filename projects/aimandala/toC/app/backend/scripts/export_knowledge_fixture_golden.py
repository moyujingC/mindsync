"""Export one knowledge fixture as reviewable report/process artifacts."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.knowledge_runtime.workbench import KnowledgeWorkbench  # noqa: E402


async def _run(
    *,
    fixture_id: str,
    build_selector: str,
    version: str,
    output_dir: Path,
) -> dict:
    return await KnowledgeWorkbench().export_fixture_golden(
        fixture_id=fixture_id,
        build_selector=build_selector,
        version=version,
        output_dir=output_dir,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture-id", required=True)
    parser.add_argument("--build-selector", required=True)
    parser.add_argument("--version", choices=["lite", "pro"], required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    result = asyncio.run(
        _run(
            fixture_id=args.fixture_id,
            build_selector=args.build_selector,
            version=args.version,
            output_dir=Path(args.output_dir),
        )
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
