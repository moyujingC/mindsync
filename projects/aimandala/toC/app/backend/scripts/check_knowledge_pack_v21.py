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
        for item in report.warnings:
            print(f"- warning: {item}")
        high_risk_paths = report.quality_stats.get("high_risk_warning_paths", [])
        if high_risk_paths:
            print(f"- high-risk warning paths: {len(high_risk_paths)}")
        return 0

    print("knowledge pack v2.1 check failed")
    for path in report.checked_paths:
        print(f"- checked: {path}")
    for item in report.differences:
        print(f"- {item}")
    for item in report.warnings:
        print(f"- warning: {item}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
