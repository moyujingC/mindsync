#!/usr/bin/env python3
"""
识别可精简/归档的文档候选。
只输出候选清单和理由，不执行任何删除/移动操作（dry-run）。
"""

import re
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')
TODAY = datetime(2026, 8, 19)  # 当前会话日期

# 高风险候选模式
CANDIDATE_PATTERNS = {
    # 一次性交付记录，按 DOCS_GOVERNANCE 14.8 默认应为 historical-reference
    '旧交付记录': {
        'dirs': ['delivery'],
        'min_age_days': 30,
        'reason': 'delivery/ 下的一次性实现/发布记录，默认不应长期占用 current',
    },
    # 已完成的任务计划
    '旧任务计划': {
        'dirs': ['tasks'],
        'min_age_days': 60,
        'reason': 'tasks/ 下已完成或超期的实施计划，默认预算为 working/historical-reference',
    },
    # 旧验收记录
    '旧验收记录': {
        'dirs': ['qa'],
        'min_age_days': 30,
        'reason': 'qa/ 下单轮验收记录默认应为 historical-reference，长期占用 current 需升级或降级',
    },
    # 临时笔记
    '临时笔记': {
        'dirs': ['notes'],
        'min_age_days': 60,
        'reason': 'notes/ 临时笔记，若未进入正式 spec/kb，可归档或删除',
    },
    # 研究阶段的原始材料/资料包
    '研究原始材料': {
        'filename_patterns': [
            r'详细资料包',
            r'原文\.md$',
            r'-OCR原文\.md$',
            r'-参考\.md$',
        ],
        'dirs': ['research', 'references', 'courses'],
        'min_age_days': 30,
        'reason': '原始摘录、OCR、参考原文通常是输入材料，长期保留会稀释 AI 上下文',
    },
}

# 排除项
EXCLUDE_DIRS = {
    'node_modules', '.git', '.pytest_cache', '__pycache__',
    'venv', '.venv', 'dist', 'build', '.claude', '.codex', '.workbuddy',
}

DATED_PATTERN = re.compile(r'^(\d{4})-(\d{2})-(\d{2})-')
STATUS_PATTERN = re.compile(r'^\s*>?\s*(状态|status)\s*[：:]\s*(\S+)', re.MULTILINE)


def should_exclude(path: Path) -> bool:
    return any(excl in path.parts for excl in EXCLUDE_DIRS)


def parse_date_from_filename(filename: str) -> datetime | None:
    m = DATED_PATTERN.match(filename)
    if not m:
        return None
    try:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def get_status(content: str) -> str | None:
    m = STATUS_PATTERN.search('\n'.join(content.splitlines()[:30]))
    return m.group(2) if m else None


def find_candidates() -> list[dict]:
    candidates = []

    for md_path in REPO_ROOT.rglob('*.md'):
        if should_exclude(md_path):
            continue

        rel = md_path.relative_to(REPO_ROOT)
        parts = rel.parts
        filename = md_path.name
        content = md_path.read_text(encoding='utf-8', errors='ignore')
        status = get_status(content)
        file_date = parse_date_from_filename(filename)
        age_days = (TODAY - file_date).days if file_date else None

        matched_reasons = []

        for rule_name, rule in CANDIDATE_PATTERNS.items():
            # 目录匹配
            if 'dirs' in rule and not any(d in parts for d in rule['dirs']):
                continue

            # 文件名模式匹配（如果存在）
            if 'filename_patterns' in rule:
                if not any(re.search(p, filename) for p in rule['filename_patterns']):
                    continue

            # 年龄匹配
            if 'min_age_days' in rule:
                if age_days is None or age_days < rule['min_age_days']:
                    continue

            matched_reasons.append((rule_name, rule['reason']))

        # 额外规则：带日期文件长期标为 current
        if file_date and status == 'current':
            # delivery/qa/tasks/notes 下的 dated current 文件是高风险
            if any(d in parts for d in ['delivery', 'qa', 'tasks', 'notes', 'handoff']):
                matched_reasons.append(
                    ('状态误用： dated current', '带日期的阶段文档长期标为 current，应降级为 historical-reference 或升级为无日期 canonical')
                )

        if matched_reasons:
            candidates.append({
                'file': str(rel),
                'size': md_path.stat().st_size,
                'status': status,
                'file_date': file_date.strftime('%Y-%m-%d') if file_date else None,
                'age_days': age_days,
                'reasons': matched_reasons,
            })

    # 按文件大小降序，优先处理占用上下文最多的
    candidates.sort(key=lambda x: x['size'], reverse=True)
    return candidates


def main():
    candidates = find_candidates()

    # 按规则聚合
    by_rule = {}
    total_size = 0
    for c in candidates:
        total_size += c['size']
        for rule_name, reason in c['reasons']:
            by_rule.setdefault(rule_name, {'count': 0, 'size': 0, 'reason': reason, 'files': []})
            by_rule[rule_name]['count'] += 1
            by_rule[rule_name]['size'] += c['size']
            by_rule[rule_name]['files'].append(c)

    # 输出 Markdown 报告
    report_lines = [
        '# 可精简/归档候选清单',
        '',
        f'> 状态：working',
        f'> 日期：{TODAY.strftime("%Y-%m-%d")}',
        f'> 范围：全仓库 markdown 文件',
        f'> 说明：本清单仅用于人工确认，不会自动执行删除/移动',
        '',
        '## 汇总',
        '',
        '| 候选类别 | 文件数 | 总大小 |',
        '|----------|--------|--------|',
    ]

    for rule_name in sorted(by_rule.keys()):
        info = by_rule[rule_name]
        report_lines.append(
            f'| {rule_name} | {info["count"]} | {info["size"] / 1024:.1f} KB |'
        )

    report_lines.extend([
        '',
        f'**候选总数**：{len(candidates)} 个文件',
        f'**总占用**：{total_size / 1024:.1f} KB',
        '',
        '## 候选详情（按类别）',
        '',
    ])

    for rule_name in sorted(by_rule.keys()):
        info = by_rule[rule_name]
        report_lines.extend([
            f'### {rule_name}',
            '',
            f'- 文件数：{info["count"]}',
            f'- 总大小：{info["size"] / 1024:.1f} KB',
            f'- 判断理由：{info["reason"]}',
            '',
            '| 文件 | 日期 | 状态 | 大小 | 建议操作 |',
            '|------|------|------|------|----------|',
        ])

        for c in info['files'][:50]:  # 每类最多列 50 个
            suggest = '归档' if 'delivery' in c['file'] or 'qa' in c['file'] or 'tasks' in c['file'] else '审查后删除/归档'
            status = c['status'] or '无'
            report_lines.append(
                f'| {c["file"]} | {c["file_date"] or "-"} | {status} | {c["size"] / 1024:.1f} KB | {suggest} |'
            )

        report_lines.append('')

    report_lines.extend([
        '',
        '## 下一步',
        '',
        '1. 审阅上表，勾选确认要处理的文件',
        '2. 对每个类别决定：删除 / 移入 archive/ / 仅降级状态',
        '3. 执行前确认这些文件不再被 PROJECT.md / README.md 作为默认入口引用',
        '',
        '---',
        '*本清单由 doc-governance skill 自动生成，dry-run，未修改任何文件*',
    ])

    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / '可精简候选清单-2026-08-19.md'
    output_path.write_text('\n'.join(report_lines), encoding='utf-8')

    print(f'候选清单已生成：{output_path}')
    print(f'候选总数：{len(candidates)}')
    print(f'总占用：{total_size / 1024:.1f} KB')
    for rule_name in sorted(by_rule.keys()):
        info = by_rule[rule_name]
        print(f'  {rule_name}: {info["count"]} 个, {info["size"] / 1024:.1f} KB')


if __name__ == '__main__':
    main()
