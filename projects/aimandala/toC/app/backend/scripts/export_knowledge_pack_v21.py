"""Export the current Python V2 knowledge modules into the v2.1 YAML pack."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.knowledge_runtime.adapters.legacy_v2_python_pack import (  # noqa: E402
    LegacyV2PythonPackExporter,
)
from app.core.knowledge_runtime.compiler import KnowledgePackCompiler  # noqa: E402
from app.core.knowledge_runtime.validators import KnowledgePackValidator  # noqa: E402


def main() -> int:
    exporter = LegacyV2PythonPackExporter()
    export_result = exporter.export()

    validator = KnowledgePackValidator()
    compiler = KnowledgePackCompiler(validator=validator)
    index_path = compiler.build()

    report = {
        "pack_root": export_result["pack_root"],
        "index_path": str(index_path),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
