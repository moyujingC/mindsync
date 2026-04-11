"""Check that committed v2.1 knowledge assets match a fresh export/build."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.knowledge_runtime.checks import check_knowledge_pack_v21  # noqa: E402


def main() -> int:
    report = check_knowledge_pack_v21()
    if report.ok:
        print("knowledge pack v2.1 check passed")
        for path in report.checked_paths:
            print(f"- checked: {path}")
        return 0

    print("knowledge pack v2.1 check failed")
    for path in report.checked_paths:
        print(f"- checked: {path}")
    for item in report.differences:
        print(f"- {item}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
