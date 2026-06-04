"""Mandala interpretation agent MVP implementation."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from app.core.llm.runtime import LLMClient

from .contracts import MandalaAgentInput, MandalaAgentResult
from .foundation_prompt_pack_builder import FoundationPromptPackBuilder
from .prompt_loader import load_prompt_template
from .prompt_pack_builder import PromptPackBuilder
from .quality_gate import FORBIDDEN_METAPHOR_TERMS, run_quality_gate
from .topic_prompt_pack_builder import TopicPromptPackBuilder
from .topic_prompt_pack_registry import get_topic_config_for_theme


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
        topic_config = get_topic_config_for_theme(agent_input.user_context.theme)
        topic_label = topic_config.label
        prompt_pack_id = agent_input.prompt_pack_id or f"{topic_config.topic_key}-report-v1.0.0"
        prompt_pack = PromptPackBuilder(
            pack_id=prompt_pack_id,
            report_mode=agent_input.report_mode,
            topic_label=topic_label,
        ).build()
        foundation_prompt_pack = FoundationPromptPackBuilder().build()
        topic_prompt_pack = TopicPromptPackBuilder(config=topic_config).build()
        if agent_input.agent_variant == "single_pass_e2e":
            visual_draft = {
                "agent_variant": "single_pass_e2e",
                "mode": "internal_visual_reasoning",
                "reusable_visual_baseline": False,
                "production_role": "ab_experiment_only",
                "note": "单阶段端到端直出；视觉观察作为模型内部中间态完成，未生成独立视觉草稿。",
            }
            final_report_md = self._build_single_pass_final_report(
                agent_input=agent_input,
                prompt_pack=prompt_pack,
                foundation_prompt_pack=foundation_prompt_pack,
                topic_prompt_pack=topic_prompt_pack,
                topic_label=topic_label,
                disable_thinking=disable_thinking,
            )
        else:
            visual_draft = self._build_visual_draft(
                agent_input=agent_input,
                foundation_prompt_pack=foundation_prompt_pack,
                disable_thinking=disable_thinking,
            )
            visual_draft.setdefault("agent_variant", "two_pass_e2e")
            visual_draft.setdefault("reusable_visual_baseline", True)
            visual_draft.setdefault("production_role", "default_production")
            final_report_md = self._build_final_report(
                agent_input=agent_input,
                prompt_pack=prompt_pack,
                foundation_prompt_pack=foundation_prompt_pack,
                topic_prompt_pack=topic_prompt_pack,
                topic_label=topic_label,
                visual_draft=visual_draft,
                disable_thinking=disable_thinking,
            )
            final_report_md = self._rewrite_for_quality_if_needed(
                agent_input=agent_input,
                prompt_pack=prompt_pack,
                foundation_prompt_pack=foundation_prompt_pack,
                topic_prompt_pack=topic_prompt_pack,
                topic_label=topic_label,
                visual_draft=visual_draft,
                final_report_md=final_report_md,
                disable_thinking=disable_thinking,
            )
        report_id = f"mandala-e2e-{uuid4().hex[:12]}"
        final_report = {
            "report_id": report_id,
            "report_mode": agent_input.report_mode,
            "title": f"{topic_label}曼陀罗解读报告",
            "markdown": final_report_md,
            "persona": agent_input.persona.to_dict(),
        }
        quality_gate = run_quality_gate(
            visual_draft=visual_draft,
            prompt_pack_manifest=prompt_pack.manifest,
            final_report_md=final_report_md,
            final_report=final_report,
            topic_label=topic_label,
        )
        run_summary = {
            "agent_version": agent_input.agent_version,
            "agent_variant": agent_input.agent_variant,
            "reusable_visual_baseline": agent_input.agent_variant == "two_pass_e2e",
            "production_role": (
                "default_production"
                if agent_input.agent_variant == "two_pass_e2e"
                else "ab_experiment_only"
            ),
            "report_mode": agent_input.report_mode,
            "prompt_pack_id": prompt_pack.pack_id,
            "foundation_prompt_pack": foundation_prompt_pack.manifest,
            "topic_prompt_pack": topic_prompt_pack.manifest,
            "status": "complete" if quality_gate["passed"] else "failed_quality_gate",
            "prompt_cache": {
                "hit_tokens": int(getattr(self.llm_client, "last_prompt_cache_hit_tokens", 0) or 0),
                "miss_tokens": int(getattr(self.llm_client, "last_prompt_cache_miss_tokens", 0) or 0),
            },
            "model_trace": list(getattr(self.llm_client, "last_attempt_trace", [])),
            "report_id": report_id,
            "persona_id": agent_input.persona.persona_id,
            "persona_version": agent_input.persona.persona_version,
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
        foundation_prompt_pack,
        disable_thinking: bool | None,
    ) -> dict[str, Any]:
        prompt = "\n\n".join(
            [
                "# 本次视觉观察任务",
                load_prompt_template("vision/observe.md"),
            ]
        )
        visual_text = self.llm_client.generate_text(
            task="vision",
            system_prompt=foundation_prompt_pack.stable_prefix,
            user_prompt=prompt,
            image_paths=self._vision_image_paths(agent_input),
            disable_thinking=True if disable_thinking is None else disable_thinking,
        )
        if not visual_text or not visual_text.strip():
            raise RuntimeError("vision_model_failed: empty or invalid visual draft")
        if self._looks_structured_visual_draft(visual_text):
            rewrite_prompt = "\n\n".join(
                [
                    "上一轮输出仍然偏结构化或 JSON。",
                    "请先根据三圈标记图确认内圈、中圈、外圈边界，再重写原画观察。",
                    "每个视觉单元只能归属到一个圈层；已经写进内圈的元素，不要在中圈或外圈重复描述。",
                    "请不要输出 JSON、代码块或 visual.xxx 机器标签。",
                    "请把下面内容改写成详尽的自然语言 Markdown 视觉基准，保留全部可见画面信息、三圈观察、视觉单元、留白、相邻关系、圈内五行线索和三圈能量流动。",
                    "原始输出：",
                    visual_text.strip(),
                ]
            )
            rewritten = self.llm_client.generate_text(
                task="vision",
                system_prompt=foundation_prompt_pack.stable_prefix,
                user_prompt=rewrite_prompt,
                image_paths=self._vision_image_paths(agent_input),
                disable_thinking=True if disable_thinking is None else disable_thinking,
            )
            if rewritten and rewritten.strip():
                visual_text = rewritten
        if self._looks_cross_circle_five_element_leaked(visual_text):
            rewrite_prompt = "\n\n".join(
                [
                    "上一轮输出在三圈能量流动里出现了五行词或生克词。",
                    "请先根据三圈标记图确认内圈、中圈、外圈边界，再重写三圈观察。",
                    "每个视觉单元只能归属到一个圈层；不要在多个圈层重复描述同一个颜色+形状+位置的元素。",
                    "请重写为纯自然语言 Markdown 视觉基准。",
                    "要求：三圈能量流动只能写承接、堵塞、外散、内收、回压、贯通或失衡；不要出现水、火、木、金、土、相生、相克。",
                    "原始输出：",
                    visual_text.strip(),
                ]
            )
            rewritten = self.llm_client.generate_text(
                task="vision",
                system_prompt=foundation_prompt_pack.stable_prefix,
                user_prompt=rewrite_prompt,
                image_paths=self._vision_image_paths(agent_input),
                disable_thinking=True if disable_thinking is None else disable_thinking,
            )
            if rewritten and rewritten.strip():
                visual_text = rewritten
        return {
            "visual_draft_md": visual_text.strip(),
            "agent_variant": "two_pass_e2e",
            "reusable_visual_baseline": True,
            "production_role": "default_production",
        }

    def _rewrite_for_quality_if_needed(
        self,
        *,
        agent_input: MandalaAgentInput,
        prompt_pack,
        foundation_prompt_pack,
        topic_prompt_pack,
        topic_label: str,
        visual_draft: dict[str, Any],
        final_report_md: str,
        disable_thinking: bool | None,
    ) -> str:
        current_report_md = final_report_md
        for _ in range(4):
            provisional_report = {
                "report_id": "quality-precheck",
                "report_mode": agent_input.report_mode,
                "title": f"{topic_label}曼陀罗解读报告",
                "markdown": current_report_md,
            }
            quality_gate = run_quality_gate(
                visual_draft=visual_draft,
                prompt_pack_manifest=prompt_pack.manifest,
                final_report_md=current_report_md,
                final_report=provisional_report,
                topic_label=topic_label,
            )
            forbidden_terms = quality_gate.get("details", {}).get("forbidden_metaphor_terms") or []
            if quality_gate.get("passed") or not forbidden_terms:
                return current_report_md

            rewrite_prompt = "\n\n".join(
                [
                    "上一版报告没有通过质量门，因为出现了禁止的隐喻、空间化、角色化或物品化表达。",
                    "请在不改变画面依据、五行推导、核心卡点、7 天路径和整体结构的前提下，重写整份报告。",
                    "必须删除或替换这些词：" + "、".join(str(term) for term in forbidden_terms),
                    "注意：这不是建议，而是硬性质量门。最终报告中一个禁止词都不能保留，也不能新增禁止词。",
                    "替换规则：改成直接机制语言、身体感或现实动作。例如写报价、展示、接收反馈、收到支持、完成交换，不要写自然景观、物品或角色。",
                    "除非原画视觉草稿明确描述了某个图像元素，否则不要把用户或财富关系比作植物、容器、道路、桥、河、海、作品、礼物、舞台或角色。",
                    "禁止词全集：" + "、".join(FORBIDDEN_METAPHOR_TERMS),
                    "原始视觉草稿：",
                    json.dumps(visual_draft, ensure_ascii=False, indent=2),
                    "需要重写的报告：",
                    current_report_md,
                ]
            )
            rewritten = self.llm_client.generate_text(
                task="chat",
                system_prompt="\n\n".join(
                    [
                        foundation_prompt_pack.stable_prefix,
                        topic_prompt_pack.stable_prefix,
                        "# 报告生成稳定规则",
                        prompt_pack.stable_prefix,
                    ]
                ),
                user_prompt=rewrite_prompt,
                disable_thinking=False if disable_thinking is None else disable_thinking,
            )
            if not rewritten or not rewritten.strip():
                return current_report_md
            current_report_md = rewritten.strip()
        return current_report_md

    def _persona_narration_boundary(self, agent_input: MandalaAgentInput) -> str:
        persona = agent_input.persona
        return "\n".join(
            [
                "# 曼曼报告陪读叙事边界",
                f"{persona.display_name}的定位是{persona.role_label}，只陪用户读懂本次曼陀罗报告。",
                f"适用范围：{persona.scope}。",
                "报告可以使用“曼曼陪你一起读懂这幅画”这类轻量陪读语气，但不要让曼曼大量第一人称出场。",
                "不要自称心理咨询师、咨询师、治疗师、真实疗愈师或长期陪伴者。",
                "不要承诺治愈、改善、诊断、医疗建议、财务预测、投资建议或重大现实决策。",
                "如果提到追问，只能表达为基于本次画作和本次报告内容继续解释。",
            ]
        )

    def _build_final_report(
        self,
        *,
        agent_input: MandalaAgentInput,
        prompt_pack,
        foundation_prompt_pack,
        topic_prompt_pack,
        topic_label: str,
        visual_draft: dict[str, Any],
        disable_thinking: bool | None,
    ) -> str:
        user_prompt = "\n\n".join(
            [
                f"报告模式：{agent_input.report_mode}",
                f"用户主题：{topic_label}",
                f"用户意图：{agent_input.user_context.painting_intention}",
                f"用户感受：{agent_input.user_context.painting_feeling}",
                self._persona_narration_boundary(agent_input),
                "视觉草稿：",
                json.dumps(visual_draft, ensure_ascii=False, indent=2),
                f"请直接输出用户可读的{topic_label} Markdown 报告。",
            ]
        )
        text = self.llm_client.generate_text(
            task="chat",
            system_prompt="\n\n".join(
                [
                    foundation_prompt_pack.stable_prefix,
                    topic_prompt_pack.stable_prefix,
                    "# 报告生成稳定规则",
                    prompt_pack.stable_prefix,
                ]
            ),
            user_prompt=user_prompt,
            disable_thinking=False if disable_thinking is None else disable_thinking,
        )
        if not text or not text.strip():
            raise RuntimeError("chat_model_failed: empty final report")
        return text.strip()

    def _build_single_pass_final_report(
        self,
        *,
        agent_input: MandalaAgentInput,
        prompt_pack,
        foundation_prompt_pack,
        topic_prompt_pack,
        topic_label: str,
        disable_thinking: bool | None,
    ) -> str:
        system_prompt = "\n\n".join(
            [
                foundation_prompt_pack.stable_prefix,
                topic_prompt_pack.stable_prefix,
                prompt_pack.stable_prefix,
            ]
        )
        user_prompt = "\n\n".join(
            [
                "你正在执行方案 B：单阶段端到端直出。",
                f"请一次性查看用户原画作和三圈标记图，内部完成画面观察、圈内五行识别、圈内五行关系、三圈能量流动判断，再直接输出用户可读的{topic_label} Markdown 报告。",
                "不要输出 JSON，不要输出独立视觉草稿，不要泄漏内部推理过程。",
                f"报告模式：{agent_input.report_mode}",
                f"用户主题：{topic_label}",
                f"用户意图：{agent_input.user_context.painting_intention}",
                f"用户感受：{agent_input.user_context.painting_feeling}",
                self._persona_narration_boundary(agent_input),
            ]
        )
        text = self.llm_client.generate_text(
            task="vision",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_paths=self._vision_image_paths(agent_input),
            disable_thinking=False if disable_thinking is None else disable_thinking,
        )
        if not text or not text.strip():
            raise RuntimeError("single_pass_vision_model_failed: empty final report")
        return text.strip()

    def _vision_image_paths(self, agent_input: MandalaAgentInput) -> list[str]:
        paths = [agent_input.image.local_path]
        if agent_input.image.marked_local_path:
            paths.append(agent_input.image.marked_local_path)
        return paths

    def _looks_structured_visual_draft(self, text: str) -> bool:
        stripped = text.strip()
        if stripped.startswith("```"):
            return True
        if stripped.startswith("{") and stripped.endswith("}"):
            return True
        return "visual." in stripped[:2000]

    def _looks_cross_circle_five_element_leaked(self, text: str) -> bool:
        section = self._extract_markdown_section(text, "三圈能量流动")
        if not section:
            return False
        leaked_terms = ["相生", "相克", "水", "火", "木", "金", "土"]
        return any(term in section for term in leaked_terms)

    def _extract_markdown_section(self, markdown: str, heading: str) -> str:
        lines = markdown.splitlines()
        in_section = False
        section_lines: list[str] = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                normalized = stripped.lstrip("#").strip()
                if in_section:
                    break
                if normalized == heading:
                    in_section = True
                    continue
            if in_section:
                section_lines.append(line)
        return "\n".join(section_lines).strip()
