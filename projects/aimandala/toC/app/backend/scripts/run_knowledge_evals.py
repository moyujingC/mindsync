#!/usr/bin/env python3
"""Run lightweight knowledge-pack evals for CI."""

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
from app.core.mandala_interpretation_agent.topic_prompt_pack_builder import (  # noqa: E402
    TopicPromptPackBuilder,
)
from app.core.mandala_interpretation_agent.topic_prompt_pack_registry import (  # noqa: E402
    TOPIC_CONFIG_BY_KEY,
    TOPIC_PROMPT_PACK_CONFIGS,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--build-selector",
        choices=["current", "all"],
        default="current",
        help="Compatibility option for the CI workflow.",
    )
    args = parser.parse_args()

    packs = [FoundationPromptPackBuilder().build()]
    packs.extend(TopicPromptPackBuilder(config=config).build() for config in TOPIC_PROMPT_PACK_CONFIGS)

    required_topic_keys = {"wealth-relationship", "intimate-relationship"}
    missing_topics = sorted(required_topic_keys - set(TOPIC_CONFIG_BY_KEY))
    if missing_topics:
        raise ValueError(f"missing required topic configs: {', '.join(missing_topics)}")

    evals = []
    for pack in packs:
        prompt = pack.stable_prefix
        if len(prompt) < 1000:
            raise ValueError(f"{pack.pack_id} prompt pack is unexpectedly small")
        evals.append(
            {
                "pack_id": pack.pack_id,
                "has_file_order": bool(pack.manifest.get("file_order")),
                "has_budget": bool(pack.manifest.get("prompt_budget")),
                "stable_prefix_chars": len(prompt),
            }
        )

    print(
        json.dumps(
            {
                "status": "ok",
                "build_selector": args.build_selector,
                "eval_count": len(evals),
                "evals": evals,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
