#!/usr/bin/env python3
"""Validate generated mandala knowledge packs used by CI."""

from __future__ import annotations

import json
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.mandala_interpretation_agent.foundation_prompt_pack_builder import (  # noqa: E402
    FoundationPromptPackBuilder,
)
from app.core.mandala_interpretation_agent.topic_prompt_pack_registry import (  # noqa: E402
    TOPIC_PROMPT_PACK_CONFIGS,
)
from app.core.mandala_interpretation_agent.topic_prompt_pack_builder import (  # noqa: E402
    TopicPromptPackBuilder,
)


def main() -> int:
    builders = [
        ("foundation", FoundationPromptPackBuilder()),
        *[
            (
                config.topic_key,
                TopicPromptPackBuilder(config=config),
            )
            for config in TOPIC_PROMPT_PACK_CONFIGS
        ],
    ]

    results: list[dict[str, object]] = []
    for topic, builder in builders:
        pack = builder.build()
        manifest = pack.manifest
        if not pack.stable_prefix.strip():
            raise ValueError(f"{topic} prompt pack is empty")
        if not pack.files:
            raise ValueError(f"{topic} prompt pack has no source files")
        if not manifest.get("pack_hash"):
            raise ValueError(f"{topic} prompt pack manifest is missing pack_hash")
        results.append(
            {
                "topic": topic,
                "pack_id": pack.pack_id,
                "file_count": len(pack.files),
                "char_count": manifest.get("char_count", len(pack.stable_prefix)),
                "pack_hash": manifest.get("pack_hash"),
            }
        )

    print(json.dumps({"status": "ok", "packs": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
