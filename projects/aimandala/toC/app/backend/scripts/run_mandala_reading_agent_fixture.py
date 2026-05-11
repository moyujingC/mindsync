"""Run the mandala reading agent against a toc-mvp fixture."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import (  # noqa: E402
    LLMClientConfig,
    LLMTaskConfig,
    NoopLLMClient,
    OpenAICompatibleLLMClient,
)
from app.core.reading_intelligence.agent import MandalaReadingAgent  # noqa: E402
from app.core.reading_intelligence.artifact_store import MandalaReadingArtifactStore  # noqa: E402
from app.core.reading_intelligence.input_collector import load_fixture_agent_input  # noqa: E402
from app.core.reading_intelligence.knowledge_pack_builder import KnowledgePackBuilder  # noqa: E402


class MandalaReadingLLMAdapter:
    """Adapt the shared LLM runtime to the reading agent's task-shaped calls."""

    def __init__(self, client: Any) -> None:
        self.client = client
        self.last_attempt_trace: list[dict[str, Any]] = []

    def generate_structured(self, **kwargs: Any) -> dict[str, Any]:
        image = kwargs.get("image") or {}
        result = self.client.generate_structured(
            task="vision",
            prompt=json.dumps(_json_prompt_payload(kwargs), ensure_ascii=False, indent=2),
            schema=_visual_observation_schema(),
            image_path=image.get("local_path") or None,
        )
        self.last_attempt_trace = getattr(self.client, "last_attempt_trace", [])
        if result is None:
            raise RuntimeError("vision model returned no structured result")
        return result

    def generate_text(self, **kwargs: Any) -> str:
        task = str(kwargs.get("task") or "chat")
        result = self.client.generate_text(
            task="chat",
            system_prompt=_system_prompt_for(task),
            user_prompt=json.dumps(_json_prompt_payload(kwargs), ensure_ascii=False, indent=2),
        )
        self.last_attempt_trace = getattr(self.client, "last_attempt_trace", [])
        if not result:
            raise RuntimeError(f"text model returned no result for task: {task}")
        return result


def run_fixture(
    *,
    fixture_id: str,
    report_mode: str,
    output_dir: str | Path,
    llm_client: Any | None = None,
) -> list[Path]:
    agent_input = load_fixture_agent_input(fixture_id, report_mode=report_mode)
    knowledge_pack = KnowledgePackBuilder().build(theme=agent_input.user_context.theme)
    client = llm_client or MandalaReadingLLMAdapter(_build_default_llm_client())
    result = MandalaReadingAgent(llm_client=client).run(
        agent_input=agent_input,
        knowledge_pack=knowledge_pack,
    )
    return MandalaReadingArtifactStore(output_dir).write(result)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture-id", required=True)
    parser.add_argument("--report-mode", choices=["lite", "pro"], default="lite")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args(argv)

    written = run_fixture(
        fixture_id=args.fixture_id,
        report_mode=args.report_mode,
        output_dir=args.output_dir,
    )
    for path in written:
        print(path)
    return 0


def _build_default_llm_client() -> Any:
    base_url = os.environ.get("AIMANDALA_LLM_BASE_URL", "").strip()
    api_key = os.environ.get("AIMANDALA_LLM_API_KEY", "").strip()
    model = os.environ.get("AIMANDALA_LLM_MODEL", "").strip()
    if not base_url or not api_key or not model:
        return NoopLLMClient()
    task_config = LLMTaskConfig(base_url=base_url, api_key=api_key, model=model)
    return OpenAICompatibleLLMClient(LLMClientConfig(default=task_config))


def _system_prompt_for(task: str) -> str:
    if task == "mandala_core_thesis":
        return (
            "你是曼陀罗解读智能体。"
            "只输出 JSON 对象，字段为 core_thesis、user_facing_framing、"
            "healing_direction、evidence_refs。"
        )
    return "你是曼陀罗解读智能体。输出面向用户阅读的中文报告，不泄漏内部 stage 标签。"


def _json_prompt_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in payload.items()
        if key not in {"knowledge_pack"} or isinstance(value, str)
    }


def _visual_observation_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["global_visual_summary", "circles", "evidence_summary", "uncertainties"],
        "properties": {
            "global_visual_summary": {"type": "string"},
            "circles": {"type": "object"},
            "evidence_summary": {"type": "array", "items": {"type": "string"}},
            "uncertainties": {"type": "array", "items": {"type": "string"}},
        },
    }


if __name__ == "__main__":
    raise SystemExit(main())
