"""Inspect a compiled knowledge runtime build selector."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.knowledge_runtime.repository import resolve_pack_root  # noqa: E402
from app.core.knowledge_runtime.runtime import create_knowledge_runtime  # noqa: E402
from app.core.llm.runtime import NoopLLMClient  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-selector", default="current")
    args = parser.parse_args()

    runtime = create_knowledge_runtime(
        build_selector=args.build_selector,
        llm_client=NoopLLMClient(),
    )
    index = runtime.repository.load_index()
    quality = index.get("stats", {}).get("quality", {})
    report = {
        "build_info": runtime.repository.get_build_info(),
        "pack_root": str(resolve_pack_root(args.build_selector)),
        "theme_ids": index.get("stats", {}).get("theme_ids", []),
        "category_counts": index.get("stats", {}).get("category_counts", {}),
        "fallback_hotspot_count": len(quality.get("fallback_hotspots", [])),
        "high_risk_warning_count": len(quality.get("high_risk_warning_paths", [])),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
