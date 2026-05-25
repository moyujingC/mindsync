#!/usr/bin/env python3
"""Build deploy-time prompt packs for the mandala interpretation agent."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build generated prompt packs used by MandalaInterpretationAgent.",
    )
    parser.add_argument(
        "--output-root",
        default=str(GENERATED_ROOT),
        help="Directory where generated prompt pack folders are written.",
    )
    args = parser.parse_args()

    output_root = Path(args.output_root)
    packs = [
        FoundationPromptPackBuilder(use_generated=False).build_from_sources(),
        WealthPromptPackBuilder(use_generated=False).build(),
    ]
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
        print(
            f"built {pack.pack_id}: {manifest['file_count']} files, "
            f"{manifest['char_count']} chars, {manifest['pack_hash']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
