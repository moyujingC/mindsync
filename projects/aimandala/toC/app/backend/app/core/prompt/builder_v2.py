"""Stage-based prompt builder for Aimandala report generation."""

from __future__ import annotations

from typing import Any
import json

from app.core.stage_process_contracts import validate_formal_stage_process_package


LITE_PROMPT_CONTRACT = """# 第13步 Lite 报告生成 Prompt

你是一名“三圈五行流派 Lite 报告写作者”。请根据给定的 Lite 写作输入和写作规范，生成一份用户可见的 Lite 解读报告。

底层方法必须遵循「三圈五行流派解读方法与步骤」的 stage 00-16。你不会接收完整知识库 Markdown，也不能重新检索或重做分析。本次输入里的 `stage_process_package` 已经包含第 00-12 步的过程交付物、命中的知识条目和 Lite 写作输入。

写作要求：
- 开头先命中用户当前状态。
- 保留画面依据区，并说明这些画面依据为什么重要。
- 先让用户感觉“这张画被看见了”，再进入三圈、五行、生克和主题解释。
- 使用三圈、五行、生克、失衡等术语时，要同时给出通俗解释。
- 围绕第 10 步核心主轴写，不重新选择主轴。
- 只使用输入中已有的证据和判断。
- 建议必须来自第 12 步疗愈方向。
- 语言要像解读师在认真对用户说话，不像字段拼接。
- 语言必须有疗愈感：先承接用户状态，再解释依据和建议。
- 建议要用邀请式语气，让用户觉得可以从一个小入口开始，而不是被要求立刻改变。
- 报告可以充实，不为了短而牺牲价值感。
- 必须生成 2 个可视化模块：画面依据摘要图、小步疗愈建议卡。
- 可视化模块只使用已有 stage 数据，不新增解读判断。

请只输出一个 JSON 对象，不要输出 Markdown，不要加代码块，不要补充说明。
"""


PRO_PROMPT_CONTRACT = """# 第14步 Pro 报告生成 Prompt

你是一名“三圈五行流派 Pro 报告写作者”。请根据给定的 Pro 写作输入和写作规范，生成一份用户可见的 Pro 解读报告。

Pro 报告不是 Lite 的加长版，而是完整深度解读。它要把画面依据、逐圈分析、五行生克、失衡候选、能量流动和疗愈方向组织成一条完整解释链。

底层方法必须遵循「三圈五行流派解读方法与步骤」的 stage 00-16。你不会接收完整知识库 Markdown，也不能重新检索或重做分析。本次输入里的 `stage_process_package` 已经包含第 00-12 步的过程交付物、命中的知识条目和 Pro 写作输入。

写作要求：
- 开头先命中本次画作最核心的状态。
- 保留画面依据区，说明依据如何支撑后续判断。
- 先整体命中，再逐圈推进，再把颜色、形状、五行生克和主题状态连成一条解释链。
- 按内圈、中圈、外圈整合分析，但不要写成机械流水账。
- 解释五行生克与失衡机制，并把专业术语翻译成现实状态。
- 展开能量流动诊断，说明哪里顺、哪里卡、哪里回流或跳跃。
- 给出根因链和阶段性调节路径。
- 所有核心判断都必须能回到前置 stage。
- 报告要信息充足、结构清楚、可反复阅读。
- 语言必须有疗愈感：即使分析机制和卡点，也要先承接，再深入，并给出可调整路径。
- 建议要用邀请式语气，不写成命令或压力清单。
- 必须生成 4 个可视化模块：画面依据深度图、能量流动诊断图、根因链图、阶段性调节路径图。
- 可视化模块只使用已有 stage 数据，不新增解读判断。

请只输出一个 JSON 对象，不要输出 Markdown，不要加代码块，不要补充说明。
"""


LITE_OUTPUT_CONTRACT = """输出 JSON 必须包含：
{
  "stage": "stage-13-lite-draft",
  "version": "lite",
  "title": "",
  "sections": [{"heading": "", "body": ""}],
  "visual_basis": [],
  "visual_modules": [
    {"id": "lite-visual-basis-summary", "title": "", "placement": "after_visual_basis", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""},
    {"id": "lite-small-step-healing-card", "title": "", "placement": "after_small_step_suggestion", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""}
  ],
  "term_explanations_used": [],
  "evidence_refs": [],
  "suggestion_boundaries": [],
  "qa_notes": []
}
"""


PRO_OUTPUT_CONTRACT = """输出 JSON 必须包含：
{
  "stage": "stage-14-pro-draft",
  "version": "pro",
  "title": "",
  "first_impression": "",
  "core_insight_table": {
    "能量本质": "",
    "核心失衡": "",
    "关键卡点": "",
    "转化方向": "",
    "疗愈核心": ""
  },
  "three_circles_detailed": {
    "inner": {"label": "内圈", "reading": ""},
    "middle": {"label": "中圈", "reading": ""},
    "outer": {"label": "外圈", "reading": ""}
  },
  "micro_analysis_detailed": {
    "节奏关系": "",
    "关系模式": "",
    "行动模式": ""
  },
  "imbalance_confirmed": {
    "type": "",
    "summary": "",
    "primary": "",
    "evidence": "",
    "energy_level": "",
    "psychological_level": "",
    "life_manifestation": ""
  },
  "root_cause": {
    "surface": "",
    "deeper": "",
    "core": ""
  },
  "healing_suggestions": [
    {"phase": "当前阶段", "focus": "", "practice": ""},
    {"phase": "接下来一段时间", "focus": "", "practice": ""},
    {"phase": "继续深化时", "focus": "", "practice": ""}
  ],
  "sections": [{"heading": "", "body": ""}],
  "visual_basis": [],
  "visual_modules": [
    {"id": "pro-visual-basis-depth", "title": "", "placement": "after_visual_basis", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""},
    {"id": "pro-energy-flow-diagnosis", "title": "", "placement": "after_energy_flow_diagnosis", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""},
    {"id": "pro-root-cause-chain", "title": "", "placement": "after_root_cause_chain", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""},
    {"id": "pro-phased-healing-path", "title": "", "placement": "after_phased_healing_plan", "purpose": "", "source_stage_refs": [], "image_prompt_brief": "", "caption": "", "fallback_text": ""}
  ],
  "mechanism_summary": "",
  "root_cause_chain": [],
  "healing_plan": [],
  "term_explanations_used": [],
  "evidence_refs": [],
  "suggestion_boundaries": [],
  "qa_notes": []
}
"""


class PromptBuilder:
    """Build report prompts directly from the stage process package."""

    def build_lite(
        self,
        *,
        vision_data: str,
        theme: str = "general",
        theme_context: str = "",
        stage_process_package: str = "",
        version: str = "stage-current",
        extra_context: dict[str, Any] | None = None,
    ) -> str:
        if not stage_process_package.strip():
            raise ValueError("stage_process_package is required for lite prompt generation")
        validate_formal_stage_process_package(self._parse_stage_package(stage_process_package))
        return self._build_prompt(
            prompt_contract=LITE_PROMPT_CONTRACT,
            output_contract=LITE_OUTPUT_CONTRACT,
            stage_process_package=stage_process_package,
            theme=theme,
            theme_context=theme_context,
            version=version,
            extra_context=extra_context,
        )

    def build_pro(
        self,
        *,
        vision_data: str,
        theme: str = "general",
        theme_context: str = "",
        stage_process_package: str = "",
        version: str = "stage-current",
        extra_context: dict[str, Any] | None = None,
    ) -> str:
        if not stage_process_package.strip():
            raise ValueError("stage_process_package is required for pro prompt generation")
        validate_formal_stage_process_package(self._parse_stage_package(stage_process_package))
        return self._build_prompt(
            prompt_contract=PRO_PROMPT_CONTRACT,
            output_contract=PRO_OUTPUT_CONTRACT,
            stage_process_package=stage_process_package,
            theme=theme,
            theme_context=theme_context,
            version=version,
            extra_context=extra_context,
        )

    def _build_prompt(
        self,
        *,
        prompt_contract: str,
        output_contract: str,
        stage_process_package: str,
        theme: str,
        theme_context: str,
        version: str,
        extra_context: dict[str, Any] | None,
    ) -> str:
        sections = [
            prompt_contract.strip(),
            f"Prompt contract version: {version}",
            f"Theme id: {theme}",
            "## 主题与用户输入",
            theme_context.strip() or "- 未提供额外主题上下文",
            "## Stage 过程交付物",
            stage_process_package.strip(),
            "## 输出格式",
            output_contract.strip(),
        ]
        if extra_context:
            sections.extend(["## 额外上下文", self._format_extra_context(extra_context)])
        return "\n\n".join(sections)

    def _format_extra_context(self, extra_context: dict[str, Any]) -> str:
        return "\n".join(f"- {key}: {value}" for key, value in sorted(extra_context.items()))

    def _parse_stage_package(self, value: str) -> dict[str, Any]:
        try:
            payload = json.loads(value)
        except json.JSONDecodeError as error:
            raise ValueError("formal stage_process_package must be valid JSON") from error
        if not isinstance(payload, dict):
            raise ValueError("formal stage_process_package must be a JSON object")
        return payload


def build_prompt(
    *,
    report_type: str,
    vision_data: str,
    theme: str = "general",
    theme_context: str = "",
    stage_process_package: str = "",
    version: str = "stage-current",
    extra_context: dict[str, Any] | None = None,
) -> str:
    builder = PromptBuilder()
    if report_type == "lite":
        return builder.build_lite(
            vision_data=vision_data,
            theme=theme,
            theme_context=theme_context,
            stage_process_package=stage_process_package,
            version=version,
            extra_context=extra_context,
        )
    return builder.build_pro(
        vision_data=vision_data,
        theme=theme,
        theme_context=theme_context,
        stage_process_package=stage_process_package,
        version=version,
        extra_context=extra_context,
    )
