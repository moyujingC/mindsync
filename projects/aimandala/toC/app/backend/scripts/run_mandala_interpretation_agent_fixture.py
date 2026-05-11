"""Run the mandala interpretation agent against one fixture and write review artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "qa"
    / "model-evals"
    / "2026-05-11-mandala-interpretation-agent"
)

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env  # noqa: E402
from app.core.mandala_interpretation_agent.agent import MandalaInterpretationAgent  # noqa: E402
from app.core.mandala_interpretation_agent.artifact_store import MandalaInterpretationArtifactStore  # noqa: E402
from app.core.mandala_interpretation_agent.input_collector import load_fixture_agent_input  # noqa: E402
from app.core.mandala_interpretation_agent.knowledge_pack_builder import KnowledgePackBuilder  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture-id", default="toc-mvp-fixture-003")
    parser.add_argument("--report-mode", choices=["lite", "pro"], default="lite")
    parser.add_argument("--output-dir", default="")
    args = parser.parse_args()

    agent_input = load_fixture_agent_input(args.fixture_id, report_mode=args.report_mode)
    knowledge_pack = KnowledgePackBuilder().build(theme=agent_input.user_context.theme)
    llm_client = create_llm_client_from_env()
    output_dir = (
        Path(args.output_dir)
        if args.output_dir
        else DEFAULT_OUTPUT_ROOT / args.fixture_id / args.report_mode
    )
    try:
        result = MandalaInterpretationAgent(llm_client=llm_client).run(
            agent_input=agent_input,
            knowledge_pack=knowledge_pack,
        )
    except RuntimeError as error:
        print(
            json.dumps(
                {
                    "fixture_id": args.fixture_id,
                    "report_mode": args.report_mode,
                    "output_dir": str(output_dir),
                    "status": "failed",
                    "error": str(error),
                    "quality_gate_passed": False,
                    "files": [],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2
    written = MandalaInterpretationArtifactStore(output_dir).write(result)
    print(
        json.dumps(
            {
                "fixture_id": args.fixture_id,
                "report_mode": args.report_mode,
                "output_dir": str(output_dir),
                "quality_gate_passed": result.quality_gate["passed"],
                "files": [str(path) for path in written],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0 if result.quality_gate["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
