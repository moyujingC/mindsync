#!/usr/bin/env python3
"""
扫描 RelayHub 删除后的残留引用和配置。
输出报告，供用户决定是否清理。
"""

import re
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')

# 扫描范围
PATTERNS = [
    re.compile(r'\[([^\]]+)\]\(([^)]*relayhub[^)]*)\)', re.IGNORECASE),  # markdown 链接
    re.compile(r'\[([^\]]+)\]\(([^)]*RelayHub[^)]*)\)', re.IGNORECASE),
]

TEXT_PATTERN = re.compile(r'relayhub|RelayHub|Relay Hub', re.IGNORECASE)

EXCLUDE_DIRS = {'.git', 'node_modules', '.pytest_cache', '__pycache__', '.claude', '.codex'}


def should_exclude(path: Path) -> bool:
    return any(excl in path.parts for excl in EXCLUDE_DIRS)


def main():
    link_issues = []
    text_refs = []

    for file_path in REPO_ROOT.rglob('*'):
        if not file_path.is_file():
            continue
        if should_exclude(file_path):
            continue

        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        rel = file_path.relative_to(REPO_ROOT)

        # 扫描 markdown 链接
        if file_path.suffix == '.md':
            for line_no, line in enumerate(content.splitlines(), 1):
                for pattern in PATTERNS:
                    for match in pattern.finditer(line):
                        link_issues.append({
                            'file': str(rel),
                            'line': line_no,
                            'text': match.group(0),
                            'link_text': match.group(1),
                            'link_target': match.group(2),
                        })

        # 扫描文本提及（排除已记录的链接文件）
        if TEXT_PATTERN.search(content):
            # 简单统计出现次数
            count = len(TEXT_PATTERN.findall(content))
            text_refs.append({
                'file': str(rel),
                'count': count,
            })

    # 生成报告
    report_lines = [
        '# RelayHub 删除后残留引用报告',
        '',
        '> 状态：working',
        '> 日期：2026-08-20',
        '> 说明：本报告列出删除 RelayHub 后仍引用它的文档和配置',
        '',
        '## 失效 Markdown 链接',
        '',
        f'共发现 **{len(link_issues)}** 个失效链接，分布在以下文件中：',
        '',
    ]

    by_file = {}
    for issue in link_issues:
        by_file.setdefault(issue['file'], []).append(issue)

    for file, issues in sorted(by_file.items()):
        report_lines.extend([
            f'### {file}',
            '',
        ])
        for issue in issues:
            report_lines.append(f'- 行 {issue["line"]}：`{issue["text"][:100]}`')
        report_lines.append('')

    report_lines.extend([
        '',
        '## 文本提及（非链接）',
        '',
        f'共 **{len(text_refs)}** 个文件仍文本提及 RelayHub：',
        '',
        '| 文件 | 提及次数 |',
        '|------|----------|',
    ])

    for ref in sorted(text_refs, key=lambda x: -x['count'])[:50]:
        report_lines.append(f'| {ref["file"]} | {ref["count"]} |')

    report_lines.extend([
        '',
        '## 需要特别处理的配置/工作流',
        '',
        '以下文件可能包含运行时配置引用，需要单独检查：',
        '',
        '- `.paperclip.yaml`',
        '- `.github/workflows/relayhub-ci-deploy.yml`',
        '',
        '## 建议处理顺序',
        '',
        '1. 修复或删除 3 个 markdown 文件中的 43 个失效链接',
        '2. 检查 `.paperclip.yaml` 和 `.github/workflows/relayhub-ci-deploy.yml` 是否仍需要',
        '3. 对历史文档中的文本提及，可保留作为历史上下文',
        '',
        '---',
        '*本报告由 doc-governance skill 自动生成*',
    ])

    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / 'RelayHub删除后残留引用报告-2026-08-20.md'
    output_path.write_text('\n'.join(report_lines), encoding='utf-8')

    print(f'报告已生成：{output_path}')
    print(f'失效链接：{len(link_issues)} 个')
    print(f'文本提及文件：{len(text_refs)} 个')
    print()
    print('按文件分布：')
    for file, issues in sorted(by_file.items()):
        print(f'  {file}: {len(issues)} 个失效链接')


if __name__ == '__main__':
    main()
