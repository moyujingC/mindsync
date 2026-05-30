"""Quality gate for the end-to-end mandala interpretation agent."""

from __future__ import annotations

from typing import Any


FORBIDDEN_FINAL_REPORT_TERMS = [
    "stage-",
    "placeholder",
    "legacy",
    "quality_gate",
]

FORBIDDEN_METAPHOR_TERMS = [
    "礼物",
    "花园",
    "堡垒",
    "围墙",
    "城墙",
    "城门",
    "宫殿",
    "宇宙",
    "旅程",
    "邀请函",
    "工匠",
    "认证员",
    "园丁",
    "守门人",
    "宝藏",
    "商人",
    "独木桥",
    "桥",
    "推门",
    "大舞台",
    "海洋",
    "小池塘",
    "河",
    "清泉",
    "大海",
    "画布",
    "考卷",
    "钻石",
    "原石",
    "审判锤",
    "钱宝宝",
    "容器",
    "通道",
    "出口",
    "路标",
    "道路",
    "直道",
    "院子",
    "围栏",
    "工具箱",
    "瓶口",
    "芬芳",
]

FORBIDDEN_FINANCIAL_PROMISE_TERMS = [
    "财务预测",
    "收益预测",
    "投资建议",
]

FORBIDDEN_DIAGNOSTIC_TERMS = [
    "心理诊断",
    "医疗建议",
]

FORBIDDEN_PERSONA_OVERREACH_TERMS = [
    "我是你的心理咨询师",
    "我是你的咨询师",
    "我是你的治疗师",
    "我是你的疗愈师",
    "作为你的心理咨询师",
    "作为你的咨询师",
    "作为你的治疗师",
    "作为你的疗愈师",
    "我会一直陪着你",
    "一直陪着你",
    "长期陪伴你",
    "持续陪伴你",
    "只有曼曼懂你",
    "你离不开我",
    "你只要相信曼曼",
    "不要告诉别人，只和我说",
    "不要告诉你的朋友",
    "不要告诉你的家人",
    "不用找专业人士",
    "我会治愈你",
    "保证改善",
    "根治",
    "疗愈成功",
    "彻底好起来",
]

CROSS_CIRCLE_FIVE_ELEMENT_TERMS = [
    "五行",
    "相生",
    "相克",
    "生克",
    "金生水",
    "水生木",
    "木生火",
    "火生土",
    "土生金",
    "金克木",
    "木克土",
    "土克水",
    "水克火",
    "火克金",
]


def run_quality_gate(
    *,
    visual_draft: dict[str, Any],
    prompt_pack_manifest: dict[str, Any],
    final_report_md: str,
    final_report: dict[str, Any],
    topic_label: str = "财富关系",
) -> dict[str, Any]:
    failure_ids: list[str] = []

    if not isinstance(visual_draft, dict) or not visual_draft:
        failure_ids.append("missing_visual_draft")
    visual_draft_md = (
        str(visual_draft.get("visual_draft_md") or "")
        if isinstance(visual_draft, dict)
        else ""
    )
    cross_circle_leaked_terms = _cross_circle_five_element_terms(visual_draft_md)
    if cross_circle_leaked_terms:
        failure_ids.append("visual_draft_cross_circle_five_element_leak")

    if not isinstance(prompt_pack_manifest, dict) or not prompt_pack_manifest:
        failure_ids.append("missing_prompt_pack_manifest")

    if not final_report_md.strip():
        failure_ids.append("empty_final_report")

    leaked_terms = [
        term
        for term in FORBIDDEN_FINAL_REPORT_TERMS
        if term.lower() in final_report_md.lower()
    ]
    leaked_terms.extend(
        term
        for term in FORBIDDEN_FINANCIAL_PROMISE_TERMS
        if term.lower() in final_report_md.lower()
    )
    leaked_terms.extend(
        term for term in FORBIDDEN_DIAGNOSTIC_TERMS if term.lower() in final_report_md.lower()
    )
    metaphor_terms = [
        term for term in FORBIDDEN_METAPHOR_TERMS if term.lower() in final_report_md.lower()
    ]
    persona_overreach_terms = _persona_overreach_terms(final_report_md, final_report)
    leaked_terms.extend(metaphor_terms)
    if leaked_terms:
        failure_ids.append("final_report_internal_text_leak")
    if metaphor_terms:
        failure_ids.append("final_report_over_metaphor")
    if persona_overreach_terms:
        failure_ids.append("final_report_persona_boundary_overreach")

    if topic_label and topic_label not in final_report_md:
        failure_ids.append("missing_topic_label")

    if not final_report.get("report_id"):
        failure_ids.append("missing_report_id")

    return {
        "passed": not failure_ids,
        "failure_ids": failure_ids,
        "details": {
            "leaked_terms": leaked_terms,
            "forbidden_metaphor_terms": metaphor_terms,
            "persona_overreach_terms": persona_overreach_terms,
            "cross_circle_leaked_terms": cross_circle_leaked_terms,
        },
    }


def _persona_overreach_terms(final_report_md: str, final_report: dict[str, Any]) -> list[str]:
    persona = final_report.get("persona") if isinstance(final_report, dict) else None
    persona_text = ""
    if isinstance(persona, dict):
        persona_text = "\n".join(str(value) for value in persona.values())
    text = f"{final_report_md}\n{persona_text}".lower()
    return [term for term in FORBIDDEN_PERSONA_OVERREACH_TERMS if term.lower() in text]


def _cross_circle_five_element_terms(markdown: str) -> list[str]:
    section = _extract_markdown_section(markdown, "三圈能量流动")
    if not section:
        return []
    return [term for term in CROSS_CIRCLE_FIVE_ELEMENT_TERMS if term in section]


def _extract_markdown_section(markdown: str, heading: str) -> str:
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
