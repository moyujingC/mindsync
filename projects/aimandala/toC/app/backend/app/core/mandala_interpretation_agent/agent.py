"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from app.core.llm.runtime import LLMClient

from .contracts import MandalaAgentInput, MandalaAgentResult
from .prompt_loader import load_prompt_template
from .prompt_pack_builder import PromptPackBuilder
from .quality_gate import run_quality_gate


class MandalaInterpretationAgent:
    """Generate the end-to-end mandala report artifacts."""

    def __init__(self, *, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    def run(
        self,
        *,
        agent_input: MandalaAgentInput,
        knowledge_pack: dict[str, Any] | None = None,
        disable_thinking: bool | None = None,
    ) -> MandalaAgentResult:
        prompt_pack = PromptPackBuilder(pack_id=agent_input.prompt_pack_id).build()
        visual_draft = self._build_visual_draft(
            agent_input=agent_input,
            disable_thinking=disable_thinking,
        )
        final_report_md = self._build_final_report(
            agent_input=agent_input,
            prompt_pack=prompt_pack,
            visual_draft=visual_draft,
            disable_thinking=disable_thinking,
        )
        final_report = {
            "report_id": f"mandala-e2e-{uuid4().hex[:12]}",
            "report_mode": agent_input.report_mode,
            "title": "财富议题曼陀罗解读报告",
            "markdown": final_report_md,
        }
        quality_gate = run_quality_gate(
            visual_draft=visual_draft,
            prompt_pack_manifest=prompt_pack.manifest,
            final_report_md=final_report_md,
            final_report=final_report,
        )
        run_summary = {
            "agent_version": agent_input.agent_version,
            "report_mode": agent_input.report_mode,
            "prompt_pack_id": prompt_pack.pack_id,
            "status": "complete" if quality_gate["passed"] else "failed_quality_gate",
            "prompt_cache": {
                "hit_tokens": int(getattr(self.llm_client, "last_prompt_cache_hit_tokens", 0) or 0),
                "miss_tokens": int(getattr(self.llm_client, "last_prompt_cache_miss_tokens", 0) or 0),
            },
            "model_trace": list(getattr(self.llm_client, "last_attempt_trace", [])),
        }
        return MandalaAgentResult(
            agent_input=agent_input.to_dict(),
            visual_draft=visual_draft,
            prompt_pack_manifest=prompt_pack.manifest,
            final_report=final_report,
            final_report_md=final_report_md,
            quality_gate=quality_gate,
            run_summary=run_summary,
        )

    def _build_visual_draft(
        self,
        *,
        agent_input: MandalaAgentInput,
        disable_thinking: bool | None,
    ) -> dict[str, Any]:
        prompt = load_prompt_template("vision/observe.md")
        visual_payload = self.llm_client.generate_structured(
            task="vision",
            prompt=prompt,
            schema={},
            image_paths=self._vision_image_paths(agent_input),
            disable_thinking=True if disable_thinking is None else disable_thinking,
        )
        if not isinstance(visual_payload, dict) or not visual_payload:
            raise RuntimeError("vision_model_failed: empty or invalid visual draft")
        if "visual_observation" in visual_payload:
            return visual_payload
        if "foundation_image_reading" in visual_payload:
            return {"foundation_image_reading": visual_payload["foundation_image_reading"]}
        return {"visual_observation": visual_payload}

    def _build_final_report(
        self,
        *,
        agent_input: MandalaAgentInput,
        prompt_pack,
        visual_draft: dict[str, Any],
        disable_thinking: bool | None,
    ) -> str:
        user_prompt = "\n\n".join(
            [
                f"报告模式：{agent_input.report_mode}",
                f"用户主题：{agent_input.user_context.theme_label}",
                f"用户意图：{agent_input.user_context.painting_intention}",
                f"用户感受：{agent_input.user_context.painting_feeling}",
                "视觉草稿：",
                json.dumps(visual_draft, ensure_ascii=False, indent=2),
                "请直接输出用户可读的财富议题 Markdown 报告。",
            ]
        )
        text = self.llm_client.generate_text(
            task="chat",
            system_prompt=prompt_pack.stable_prefix,
            user_prompt=user_prompt,
            disable_thinking=False if disable_thinking is None else disable_thinking,
        )
        if not text or not text.strip():
            raise RuntimeError("chat_model_failed: empty final report")
        return text.strip()

    def _vision_image_paths(self, agent_input: MandalaAgentInput) -> list[str]:
        paths = [agent_input.image.local_path]
        if agent_input.image.marked_local_path:
            paths.append(agent_input.image.marked_local_path)
        return paths
