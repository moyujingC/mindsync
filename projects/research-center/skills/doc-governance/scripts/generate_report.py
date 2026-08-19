#!/usr/bin/env python3
"""
生成完整文档治理报告。
基于 scan.py 的扫描逻辑，聚合结果并按严重度/目录分层输出。
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# 把 scan.py 所在目录加入路径，复用其扫描函数
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from scan import scan_directory, find_repo_root


def severity_for_issue(issue: dict) -> str:
    """根据问题类型和上下文判定严重度"""
    t = issue['type']
    keyword = issue.get('keyword', '')
    text = issue.get('text', '')

    if t == 'broken_link':
        # 根治理文档或 PROJECT.md 中的失效链接影响更大
        file = issue.get('file', '')
        if file.endswith('PROJECT.md') or file.endswith('README.md') or file in {
            'AGENTS.md', 'COMPANY.md', 'DOCS_GOVERNANCE.md', 'MONOREPO.md', 'CLAUDE.md'
        }:
            return '高'
        return '中'

    if t == 'status':
        if keyword == '状态误用':
            return '高'
        if keyword == '缺少状态字段':
            # 根治理文档 / PROJECT.md 缺少状态更严重
            file = issue.get('file', '')
            if file.endswith('PROJECT.md') or file.endswith('README.md') or file in {
                'AGENTS.md', 'COMPANY.md', 'DOCS_GOVERNANCE.md', 'MONOREPO.md', 'CLAUDE.md'
            }:
                return '高'
            return '低'

    if t == 'link_style':
        return '低'

    if t == 'redundancy':
        return '中'

    return '低'


def project_for_file(file_path: str, repo_root: Path) -> str:
    """根据相对路径判断所属项目/目录"""
    parts = Path(file_path).parts
    if not parts:
        return '仓库根目录'

    if parts[0] == 'company':
        return 'company/'
    if parts[0] == 'shared':
        return 'shared/'
    if parts[0] == 'projects' and len(parts) > 1:
        return f'projects/{parts[1]}/'

    return parts[0]


def generate_report(base_dir: Path, output_path: Path) -> dict:
    """执行扫描并生成 markdown 报告"""
    results = scan_directory(base_dir)

    # 补充严重度和项目信息
    all_issues = []
    for issue_type, items in results['by_type'].items():
        for item in items:
            item['severity'] = severity_for_issue(item)
            item['project'] = project_for_file(item['file'], find_repo_root(base_dir))
            all_issues.append(item)

    # 按严重度和类型聚合
    severity_counts = {'高': 0, '中': 0, '低': 0}
    type_counts = {}
    project_counts = {}
    for issue in all_issues:
        severity_counts[issue['severity']] += 1
        type_counts.setdefault(issue['type'], 0)
        type_counts[issue['type']] += 1
        project_counts.setdefault(issue['project'], 0)
        project_counts[issue['project']] += 1

    high_issues = [i for i in all_issues if i['severity'] == '高']
    medium_issues = [i for i in all_issues if i['severity'] == '中']

    today = datetime.now().strftime('%Y-%m-%d')

    lines = [
        '# 文档治理报告',
        '',
        f'> 状态：working',
        f'> 日期：{today}',
        f'> 范围：全仓库（{base_dir}）',
        f'> 检查类型：all（冗余 / 重复 / 矛盾 / 状态 / 可发现性）',
        f'> owner：doc-governance skill',
        f'> version：0.1.0',
        '',
        '## 执行摘要',
        '',
        '| 指标 | 数值 |',
        '|------|------|',
        f'| 检查文件数 | {results["files_scanned"]} |',
        f'| 发现问题数 | {results["total_issues"]} |',
        f'| 高严重度 | {severity_counts["高"]} |',
        f'| 中严重度 | {severity_counts["中"]} |',
        f'| 低严重度 | {severity_counts["低"]} |',
        f'| 已修复 | 0 |',
        f'| 待处理 | {results["total_issues"]} |',
        '',
        '## 问题汇总',
        '',
        '### 按类型分布',
        '',
        '| 类型 | 数量 | 高 | 中 | 低 |',
        '|------|------|----|----|----|',
    ]

    type_name_map = {
        'redundancy': '冗余',
        'status': '状态',
        'broken_link': '失效链接',
        'link_style': '链接风格'
    }

    for t, name in type_name_map.items():
        count = type_counts.get(t, 0)
        high = sum(1 for i in all_issues if i['type'] == t and i['severity'] == '高')
        med = sum(1 for i in all_issues if i['type'] == t and i['severity'] == '中')
        low = sum(1 for i in all_issues if i['type'] == t and i['severity'] == '低')
        lines.append(f'| {name} | {count} | {high} | {med} | {low} |')

    lines.extend([
        '',
        '### 按项目/目录分布（Top 15）',
        '',
        '| 项目/目录 | 问题数 |',
        '|-----------|--------|',
    ])

    for project, count in sorted(project_counts.items(), key=lambda x: -x[1])[:15]:
        lines.append(f'| {project} | {count} |')

    lines.extend([
        '',
        '## 高严重度问题详情',
        '',
        '这些问题会直接影响 AI 对文档系统的信任，建议优先修复。',
        '',
    ])

    for idx, issue in enumerate(high_issues[:30], 1):
        lines.extend([
            f'### {idx}. [{issue["type"].upper()}] {issue["file"]}',
            '',
            f'**严重度**：{issue["severity"]}',
            '',
            f'**问题描述**：{issue["text"]}',
            '',
            f'**位置**：行 {issue["line"]}' if issue['line'] > 0 else '**位置**：文档头部',
            '',
            '**修复建议**：',
            '> 根据 DOCS_GOVERNANCE.md 对应章节修复。',
            '',
        ])

    lines.extend([
        '',
        '## 中严重度问题样例（Top 20）',
        '',
    ])

    for idx, issue in enumerate(medium_issues[:20], 1):
        lines.extend([
            f'### {idx}. [{issue["type"].upper()}] {issue["file"]}',
            '',
            f'- 严重度：{issue["severity"]}',
            f'- 问题：{issue["text"]}',
            f'- 位置：行 {issue["line"]}' if issue['line'] > 0 else '- 位置：文档头部',
            '',
        ])

    lines.extend([
        '',
        '## 可执行操作',
        '',
        '### 批次 A：高严重度状态误用与入口失效链接',
        '',
        '- [ ] 修复根治理文件和 PROJECT.md 中的失效链接',
        '- [ ] 修正长期标为 current 的一次性交付/周计划文档',
        '',
        '### 批次 B：状态字段补齐',
        '',
        f'- [ ] 为 {type_counts.get("status", 0)} 份缺少状态字段的正式文档补齐元数据',
        '- [ ] 优先补齐 PROJECT.md、README.md、根治理文档',
        '',
        '### 批次 C：链接治理',
        '',
        f'- [ ] 修复 {type_counts.get("broken_link", 0)} 个失效链接',
        f'- [ ] 将 {type_counts.get("link_style", 0)} 个 repo-relative/绝对路径链接改为相对路径',
        '',
        '### 批次 D：冗余清理',
        '',
        f'- [ ] 审查 {type_counts.get("redundancy", 0)} 处冗余关键词/过程堆叠',
        '',
        '## 已修复项',
        '',
        '| 文件 | 问题 | 修复方式 | 日期 |',
        '|------|------|----------|------|',
        '| - | - | - | - |',
        '',
        '## 待处理项',
        '',
        '| 文件 | 问题 | 严重度 | 优先级 |',
        '|------|------|--------|--------|',
    ])

    for issue in high_issues[:10]:
        lines.append(f'| {issue["file"]} | {issue["text"][:50]} | {issue["severity"]} | 高 |')

    lines.extend([
        '',
        '## 下一阶段计划',
        '',
        '- [ ] 用户确认后执行批次 A 修复',
        '- [ ] 补齐高优先级文档的状态字段',
        '- [ ] 修复核心入口文件中的失效链接',
        '- [ ] 下一轮治理时复查本报告中的待处理项',
        '',
        '## 备注',
        '',
        '- 本报告由 doc-governance skill 自动生成，基于 scan.py 扫描结果。',
        '- 外部参考资料（external/、vendor/、第三方镜像）已按 DOCS_GOVERNANCE.md 排除在治理基线外。',
        '- 详细 JSON 数据可配合本报告用于进一步自动化处理。',
        '',
        '---',
        '',
        '*本报告由 doc-governance skill 自动生成*',
        '',
    ])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text('\n'.join(lines), encoding='utf-8')

    # 同时输出一份 JSON 便于后续处理
    json_path = output_path.with_suffix('.json')
    json_path.write_text(json.dumps({
        'meta': {
            'date': today,
            'scope': str(base_dir),
            'files_scanned': results['files_scanned'],
            'total_issues': results['total_issues'],
        },
        'summary': {
            'severity': severity_counts,
            'by_type': type_counts,
            'by_project': project_counts,
        },
        'issues': all_issues,
    }, ensure_ascii=False, indent=2), encoding='utf-8')

    return {
        'report_path': output_path,
        'json_path': json_path,
        'results': results,
        'severity_counts': severity_counts,
        'all_issues': all_issues,
    }


if __name__ == '__main__':
    repo_root = find_repo_root(Path.cwd())
    output_dir = repo_root / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_path = output_dir / f'治理报告-{datetime.now().strftime("%Y-%m-%d")}.md'

    result = generate_report(repo_root, output_path)
    print(f'报告已生成：{result["report_path"]}')
    print(f'JSON 数据：{result["json_path"]}')
    print(f'扫描文件数：{result["results"]["files_scanned"]}')
    print(f'发现问题数：{result["results"]["total_issues"]}')
    print(f'严重度分布：{result["severity_counts"]}')
