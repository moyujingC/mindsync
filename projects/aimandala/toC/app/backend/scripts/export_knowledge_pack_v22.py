"""Export the v2.2 candidate YAML pack from Markdown theme truth sources."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.knowledge_runtime.adapters.markdown_theme_pack_v22 import (  # noqa: E402
    MarkdownThemePackV22Exporter,
)
from app.core.knowledge_runtime.compiler import KnowledgePackCompiler  # noqa: E402
from app.core.knowledge_runtime.paths import resolve_knowledge_toc_root  # noqa: E402
from app.core.knowledge_runtime.validators import KnowledgePackValidator  # noqa: E402


def main() -> int:
    toc_root = resolve_knowledge_toc_root(__file__)
    pack_root = toc_root / "data" / "knowledge" / "packs" / "v2.2"
    build_dir = toc_root / "data" / "knowledge" / "builds" / "candidates" / "v2.2-theme-md"

    exporter = MarkdownThemePackV22Exporter(pack_root=pack_root)
    export_result = exporter.export()

    validator = KnowledgePackValidator()
    compiler = KnowledgePackCompiler(
        pack_root=pack_root,
        build_dir=build_dir,
        validator=validator,
    )
    index_path = compiler.build()

    report = {
        "pack_root": export_result["pack_root"],
        "theme_source_dir": export_result["theme_source_dir"],
        "theme_count": export_result["theme_count"],
        "index_path": str(index_path),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
