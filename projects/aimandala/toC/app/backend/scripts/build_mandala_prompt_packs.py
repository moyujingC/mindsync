#!/usr/bin/env python3
"""Build deploy-time prompt packs for the mandala interpretation agent."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.mandala_interpretation_agent.foundation_prompt_pack_builder import (  # noqa: E402
    FoundationPromptPackBuilder,
)
from app.core.mandala_interpretation_agent.wealth_prompt_pack_builder import (  # noqa: E402
    WealthPromptPackBuilder,
)


GENERATED_ROOT = (
    BACKEND_ROOT
    / "app"
    / "core"
    / "mandala_interpretation_agent"
    / "generated_prompt_packs"
)

PACK_BUILDERS = {
    "foundation": FoundationPromptPackBuilder,
    "wealth": WealthPromptPackBuilder,
    "wealth-relationship": WealthPromptPackBuilder,
    "all": None,
}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build generated prompt packs used by MandalaInterpretationAgent.",
    )
    parser.add_argument(
        "--output-root",
        default=str(GENERATED_ROOT),
        help="Directory where generated prompt pack folders are written.",
    )
    parser.add_argument(
        "--topic",
        choices=sorted(PACK_BUILDERS),
        default="all",
        help="Prompt pack topic to rebuild.",
    )
    parser.add_argument(
        "--report-path",
        default="",
        help="Optional Markdown report path for the prompt pack rebuild result.",
    )
    args = parser.parse_args()

    output_root = Path(args.output_root)
    pack_builders = _pack_builders_for_topic(args.topic)
    packs = [builder(use_generated=False).build_from_sources() for builder in pack_builders]
    report_entries: list[dict[str, Any]] = []
    for pack in packs:
        pack_dir = output_root / pack.pack_id
        pack_dir.mkdir(parents=True, exist_ok=True)
        prompt_path = pack_dir / "prompt.md"
        manifest_path = pack_dir / "manifest.json"
        manifest = dict(pack.manifest)
        manifest["build_mode"] = "generated"
        prompt_path.write_text(pack.stable_prefix + "\n", encoding="utf-8")
        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        report_entries.append(
            {
                "pack_id": pack.pack_id,
                "build_mode": manifest["build_mode"],
                "output_dir": str(pack_dir),
                "file_count": manifest["file_count"],
                "char_count": manifest["char_count"],
                "pack_hash": manifest["pack_hash"],
                "file_order": manifest["file_order"],
                "prompt_budget": manifest.get("prompt_budget", {}),
            }
        )
        print(
            f"built {pack.pack_id}: {manifest['file_count']} files, "
            f"{manifest['char_count']} chars, {manifest['pack_hash']}"
        )
    report = _build_report(topic=args.topic, output_root=output_root, entries=report_entries)
    if args.report_path:
        report_path = Path(args.report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report + "\n", encoding="utf-8")
        print(f"report: {report_path}")
    else:
        print(report)
    return 0


def _pack_builders_for_topic(topic: str):
    if topic == "all":
        return [FoundationPromptPackBuilder, WealthPromptPackBuilder]
    builder = PACK_BUILDERS[topic]
    if builder is None:
        raise ValueError(f"unsupported topic: {topic}")
    return [builder]


def _build_report(*, topic: str, output_root: Path, entries: list[dict[str, Any]]) -> str:
    lines = [
        "# Prompt Pack Rebuild Report",
        "",
        f"- build_time_utc: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"- topic: {topic}",
        f"- output_root: {output_root}",
        f"- pack_count: {len(entries)}",
        "",
        "## Packs",
    ]
    for entry in entries:
        budget = entry.get("prompt_budget") or {}
        lines.extend(
            [
                "",
                f"### {entry['pack_id']}",
                "",
                f"- build_mode: {entry['build_mode']}",
                f"- output_dir: {entry['output_dir']}",
                f"- source_file_count: {entry['file_count']}",
                f"- char_count: {entry['char_count']}",
                f"- pack_hash: {entry['pack_hash']}",
                "- prompt_cache_budget:",
                f"  - estimator: {budget.get('estimator', 'unknown')}",
                f"  - estimated_tokens: {budget.get('estimated_tokens', 0)}",
                f"  - context_limit_tokens: {budget.get('context_limit_tokens', 0)}",
                f"  - remaining_tokens: {budget.get('remaining_tokens', 0)}",
                f"  - usage_percent: {budget.get('usage_percent', 0)}",
                f"  - warning_level: {budget.get('warning_level', 'unknown')}",
                "- source_files:",
            ]
        )
        lines.extend(f"  - {source}" for source in entry["file_order"])
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
