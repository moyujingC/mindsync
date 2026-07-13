#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import re
from collections import OrderedDict
from pathlib import Path

import yaml


TODAY = "2026-07-13"
ROOT = Path("projects/xinran-jobhunt/jd-database")
JOBS_DIR = ROOT / "jobs"
INDEX_FILE = ROOT / "index.yaml"

TRACK_LABELS = {
    "ai-pm": "AI 产品经理",
    "ai-consulting": "AI 转型咨询顾问",
    "fde": "FDE",
}

ORDERED_FRONTMATTER = [
    ("job_id", ""),
    ("captured_at", ""),
    ("source_platform", ""),
    ("source_type", "screenshot"),
    ("status", "applied"),
    ("application_status", "applied"),
    ("recruitment_status", "open"),
    ("applied_at", TODAY),
    ("company", ""),
    ("role_title", ""),
    ("department", ""),
    ("city", ""),
    ("work_mode", ""),
    ("salary_range", ""),
    ("experience_requirement", ""),
    ("education_requirement", ""),
    ("primary_track", ""),
    ("secondary_track", ""),
    ("match_score", 0),
    ("boss_competitiveness_available", False),
    ("keywords", []),
    ("must_have", []),
    ("nice_to_have", []),
    ("risks", []),
]


def yaml_dump(data: object) -> str:
    if isinstance(data, OrderedDict):
        data = dict(data)
    return yaml.safe_dump(
        data,
        allow_unicode=True,
        sort_keys=False,
        width=1000,
        default_flow_style=False,
    ).strip()


def load_markdown_job(path: Path) -> tuple[dict, str]:
    text = path.read_text()
    if not text.startswith("---\n"):
        raise ValueError(f"{path} 缺少 frontmatter")
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        raise ValueError(f"{path} frontmatter 格式异常")
    frontmatter = yaml.safe_load(parts[1]) or {}
    body = parts[2].lstrip("\n")
    return frontmatter, body


def normalize_scalar(value: object, fallback: object) -> object:
    if value is None:
        return fallback
    if isinstance(fallback, bool):
        return bool(value)
    if isinstance(fallback, int):
        try:
            return int(value)
        except Exception:
            return fallback
    if isinstance(fallback, str):
        return str(value)
    return value


def normalize_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    return [str(value)]


def normalize_frontmatter(frontmatter: dict, body: str) -> OrderedDict:
    normalized: OrderedDict[str, object] = OrderedDict()
    has_boss = "## BOSS 竞争力分析" in body

    for key, fallback in ORDERED_FRONTMATTER:
        if key in {"keywords", "must_have", "nice_to_have", "risks"}:
            value = normalize_list(frontmatter.get(key, fallback))
        elif key == "boss_competitiveness_available":
            value = has_boss
        elif key == "status":
            value = "applied"
        elif key == "application_status":
            existing = frontmatter.get(key)
            value = str(existing) if existing else "applied"
        elif key == "recruitment_status":
            existing = frontmatter.get(key)
            value = str(existing) if existing else "open"
        elif key == "applied_at":
            existing = frontmatter.get(key)
            value = str(existing) if existing else TODAY
        else:
            value = normalize_scalar(frontmatter.get(key, fallback), fallback)
        normalized[key] = value

    for key in sorted(frontmatter.keys()):
        if key not in normalized:
            normalized[key] = frontmatter[key]

    return normalized


def track_label(track: str) -> str:
    return TRACK_LABELS.get(track, track or "")


def summary_block(frontmatter: OrderedDict) -> str:
    recruitment_label_map = {
        "open": "招聘中",
        "paused": "暂停招聘",
        "closed": "停止招聘",
    }
    lines = [
        "# 岗位摘要",
        "",
        f'- 公司：{frontmatter["company"]}',
        f'- 岗位：{frontmatter["role_title"]}',
        f'- 城市：{frontmatter["city"]}',
        f'- 薪资：{frontmatter["salary_range"]}',
        f'- 主轨道：{track_label(str(frontmatter["primary_track"]))}',
    ]
    secondary = str(frontmatter["secondary_track"]).strip()
    if secondary:
        lines.append(f"- 次轨道：{track_label(secondary)}")
    lines.append(f'- 匹配分：{frontmatter["match_score"]}/100')
    recruitment_status = str(frontmatter["recruitment_status"]).strip()
    lines.append(f'- 招聘状态：{recruitment_label_map.get(recruitment_status, recruitment_status or "招聘中")}')
    lines.append(f'- 投递状态：已投递（{frontmatter["applied_at"]}）')
    return "\n".join(lines) + "\n"


def replace_or_prepend_summary(body: str, frontmatter: OrderedDict) -> str:
    summary = summary_block(frontmatter)
    pattern = re.compile(r"^# 岗位摘要\s*?\n.*?(?=^## |\Z)", re.S | re.M)
    if pattern.search(body):
        return pattern.sub(summary + "\n", body, count=1).lstrip("\n")
    return summary + "\n" + body.lstrip("\n")


def append_if_missing(body: str, heading: str, content: str) -> str:
    if heading in body:
        return body
    return body.rstrip() + "\n\n" + content.strip() + "\n"


def insert_before_first_existing_heading(body: str, heading: str, content: str, before_headings: list[str]) -> str:
    if heading in body:
        return body

    insertion = content.strip() + "\n\n"
    positions = [body.find(item) for item in before_headings if body.find(item) != -1]
    if not positions:
        return body.rstrip() + "\n\n" + content.strip() + "\n"

    index = min(positions)
    prefix = body[:index].rstrip()
    suffix = body[index:].lstrip("\n")
    return f"{prefix}\n\n{insertion}{suffix}"


def bullet_section(title: str, items: list[str]) -> str:
    lines = [title, ""]
    if items:
        lines.extend(f"- {item}" for item in items)
    else:
        lines.append("- ")
    return "\n".join(lines)


def build_keywords_section(frontmatter: OrderedDict) -> str:
    keywords = "、".join(frontmatter["keywords"][:8])
    return "\n".join(
        [
            "## 关键词提炼",
            "",
            f"- 业务关键词：{keywords}",
            "- AI 关键词：",
            "- 工具关键词：",
            "- 行业关键词：",
        ]
    )


def build_match_section(frontmatter: OrderedDict, has_boss: bool) -> str:
    lines = [
        "## 匹配判断",
        "",
        "### 匹配点",
        "",
        "- ",
        "",
        "### 缺口",
        "",
        "- ",
        "",
        "### 风险",
        "",
    ]
    if frontmatter["risks"]:
        lines.extend(f"- {item}" for item in frontmatter["risks"])
    else:
        lines.append("- ")
    if has_boss:
        lines.extend(
            [
                "",
                "### 平台算法偏差观察（有 BOSS 分析时必写）",
                "",
                "- 平台低估的点：",
                "- 可能被算法忽略的真实优势：",
                '- 这更像“简历表达问题”还是“岗位混合画像问题”：',
            ]
        )
    return "\n".join(lines)


def top_keywords(frontmatter: OrderedDict, limit: int = 4) -> str:
    keywords = [str(item) for item in frontmatter["keywords"] if str(item).strip()]
    return "、".join(keywords[:limit]) if keywords else "AI 产品落地、业务场景拆解、跨团队协作"


def build_application_message_section(frontmatter: OrderedDict) -> str:
    role = str(frontmatter["role_title"]).strip() or "这个岗位"
    company = str(frontmatter["company"]).strip() or "贵公司"
    keyword_text = top_keywords(frontmatter, 3)
    primary_track = track_label(str(frontmatter["primary_track"])) or "AI 产品 / 方案落地方向"
    return "\n".join(
        [
            "## 投递消息建议",
            "",
            "把投递时发给平台 / HR / 招聘方的首条消息写在这里，默认控制在 80-150 字，可直接复制发送。",
            "",
            "### 可直接发送版本",
            "",
            f"- 你好，我关注到 `{role}` 这条岗位。我过往经历覆盖 {primary_track}、AI 工作流和业务问题拆解，对 {keyword_text} 这类要求有持续实践。如果你们希望找一位能把 AI 能力转成具体产品 / 方案并推进落地的人，我希望进一步沟通。",
            "",
            "### 可替换变量",
            "",
            f"- 你的岗位理解：{role} / {keyword_text}",
            "- 你最该强调的相关经验：AI 工作流、Agent / 知识库、业务流程拆解、跨团队推进",
            f"- 如果对方是 HR / 直属负责人，语气要怎么调整：对 HR 强调方向匹配和可沟通；对负责人强调你能围绕 {company} 的业务场景拆需求、做方案并推动落地",
        ]
    )


def build_gap_section(frontmatter: OrderedDict) -> str:
    must_haves = frontmatter["must_have"][:3]
    risks = frontmatter["risks"][:2]
    required_abilities = must_haves or ["把岗位要求转成可交付方案的能力", "围绕业务场景验证 AI 产品价值的能力", "跨业务、产品、技术多方推进的能力"]
    required_evidence = risks or ["更具体的项目证据和量化结果", "能说明从需求、方案到落地闭环的案例"]
    return "\n".join(
        [
            "## 提高匹配度需要补足的能力",
            "",
            "如果要认真应聘这个岗位，并把匹配度继续往上拉，需要补哪些能力、证据或表达，按轻重缓急写清楚。",
            "",
            "### 需要补足的能力",
            "",
            *[f"- {item}" for item in required_abilities],
            "",
            "### 需要补足的证据",
            "",
            *[f"- {item}" for item in required_evidence],
            "",
            "### 建议补足方式",
            "",
            "- 面试前把现有 AI 项目整理成一条“业务问题 → 方案设计 → 工具 / 模型选择 → 落地结果”的闭环案例",
            "- 针对岗位关键词补一页速记，重点准备业务场景、指标、边界和协作对象",
            "- 暂不为了单条 JD 发明新经历，只补真实项目中已经发生过、但简历表达不足的证据",
        ]
    )


def build_resume_advice_section(frontmatter: OrderedDict) -> str:
    keyword_text = top_keywords(frontmatter)
    return "\n".join(
        [
            "## 简历优化建议",
            "",
            "只写针对这个岗位最值得改的简历点，区分“立刻可改的表达”和“需要真实补证据后再改的内容”。",
            "",
            "### 立刻可优化的表达",
            "",
            f"- 在相关项目里显式补出 `{keyword_text}` 等岗位关键词",
            "- 把个人 AI 工具使用表达升级为“业务场景拆解 + 工作流 / 产品方案 + 落地推进”的描述",
            "- 强调跨团队沟通、需求拆解、原型验证和持续迭代，减少泛泛的兴趣或学习表述",
            "",
            "### 需要新增证据后再写进简历的内容",
            "",
            "- 只有真实做过或能现场讲清的技术 / 行业模块，才写进简历",
            "- 若岗位强调特定行业、平台或模型能力，需要先补对应案例、指标或作品集证据",
            "- 若岗位要求强工程 / 强算法 / 强行业经验，先准备解释边界，不直接包装成已有硬经验",
            "",
            "### 不建议为了这条岗位硬改的内容",
            "",
            "- 不要因为单条 JD 改动在线简历母版主定位",
            "- 不要把未实际承担过的研发、算法、行业专家职责写成既有经验",
            "- 不要牺牲当前 AI 产品 / AI 咨询 / FDE 三条主线的一致性",
        ]
    )


def build_market_signal_section() -> str:
    return "\n".join(
        [
            "## 市场信号",
            "",
            "- 这个岗位反映出的岗位趋势：",
            "- 这个岗位对候选人的主要筛选逻辑：",
            "- 这条样本后续应归入哪类观察桶：",
        ]
    )


def build_no_action_section() -> str:
    return "\n".join(
        [
            "## 暂不执行的动作",
            "",
            "- 当前阶段不直接改简历",
            "- 当前阶段不为单个岗位单独定制投递版本",
            "- 当前阶段已按你的要求标记为已投递并收入口径统一的 JD 数据库",
        ]
    )


def normalize_body(frontmatter: OrderedDict, body: str) -> str:
    updated = replace_or_prepend_summary(body, frontmatter)
    has_boss = "## BOSS 竞争力分析" in updated
    updated = append_if_missing(updated, "## 职责拆解", bullet_section("## 职责拆解", frontmatter["must_have"]))
    updated = append_if_missing(updated, "## 任职要求拆解", bullet_section("## 任职要求拆解", frontmatter["nice_to_have"]))
    updated = append_if_missing(updated, "## 关键词提炼", build_keywords_section(frontmatter))
    updated = append_if_missing(updated, "## 匹配判断", build_match_section(frontmatter, has_boss))
    updated = insert_before_first_existing_heading(
        updated,
        "## 投递消息建议",
        build_application_message_section(frontmatter),
        ["## 市场信号", "## 暂不执行的动作"],
    )
    updated = insert_before_first_existing_heading(
        updated,
        "## 提高匹配度需要补足的能力",
        build_gap_section(frontmatter),
        ["## 简历优化建议", "## 市场信号", "## 暂不执行的动作"],
    )
    updated = insert_before_first_existing_heading(
        updated,
        "## 简历优化建议",
        build_resume_advice_section(frontmatter),
        ["## 市场信号", "## 暂不执行的动作"],
    )
    updated = append_if_missing(updated, "## 市场信号", build_market_signal_section())
    updated = append_if_missing(updated, "## 暂不执行的动作", build_no_action_section())
    return updated.rstrip() + "\n"


def render_job(frontmatter: OrderedDict, body: str) -> str:
    return f"---\n{yaml_dump(dict(frontmatter))}\n---\n\n{body}"


def normalize_index(index_data: dict) -> dict:
    normalized = copy.deepcopy(index_data)
    normalized["last_updated"] = TODAY
    jobs: list[dict] = []
    for item in normalized.get("jobs", []):
        updated = OrderedDict()
        for key in [
            "job_id",
            "captured_at",
            "company",
            "role_title",
            "city",
            "source_platform",
            "status",
            "applied_at",
            "primary_track",
            "match_score",
            "file",
            "keywords",
        ]:
            if key == "status":
                updated[key] = "applied"
            elif key == "applied_at":
                updated[key] = str(item.get("applied_at") or TODAY)
            elif key == "keywords":
                updated[key] = normalize_list(item.get(key, []))
            elif key == "match_score":
                updated[key] = normalize_scalar(item.get(key, 0), 0)
            else:
                updated[key] = normalize_scalar(item.get(key, ""), "")
        for extra_key in sorted(item.keys()):
            if extra_key not in updated:
                updated[extra_key] = item[extra_key]
        jobs.append(dict(updated))
    normalized["jobs"] = jobs
    return normalized


def write_if_changed(path: Path, new_text: str, write: bool) -> bool:
    old_text = path.read_text()
    if old_text == new_text:
        return False
    if write:
        path.write_text(new_text)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="统一 JD 数据库文档字段和索引状态。")
    parser.add_argument("--write", action="store_true", help="写回文件。默认只检查是否会有变更。")
    args = parser.parse_args()

    changed_files: list[str] = []

    for path in sorted(JOBS_DIR.glob("*.md")):
        if path.name == "README.md":
            continue
        frontmatter, body = load_markdown_job(path)
        normalized_frontmatter = normalize_frontmatter(frontmatter, body)
        normalized_body = normalize_body(normalized_frontmatter, body)
        rendered = render_job(normalized_frontmatter, normalized_body)
        if write_if_changed(path, rendered, args.write):
            changed_files.append(str(path))

    index_data = yaml.safe_load(INDEX_FILE.read_text())
    normalized_index = normalize_index(index_data)
    rendered_index = yaml_dump(normalized_index) + "\n"
    if write_if_changed(INDEX_FILE, rendered_index, args.write):
        changed_files.append(str(INDEX_FILE))

    if changed_files:
        action = "已写回" if args.write else "待更新"
        print(f"{action} {len(changed_files)} 个文件：")
        for item in changed_files:
            print(item)
        return 0 if args.write else 1

    print("无需更新。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
