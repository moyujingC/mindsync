#!/usr/bin/env python3
"""
文档治理扫描脚本
用于快速发现文档系统中的冗余、重复、矛盾和状态问题。
"""

import re
import sys
from pathlib import Path
from typing import Optional

# 扫描范围（排除项）
EXCLUDE_DIRS = {
    'node_modules', '.git', '.pytest_cache', '__pycache__',
    'venv', '.venv', 'dist', 'build', '.claude/worktrees'
}

# 冗余关键词（需检查）
REDUNDANCY_KEYWORDS = [
    r'讨论中', r'考虑中', r'待定', r'备选方案',
    r'TODO', r'计划中', r'未完成',
]

# 状态字段模式
STATUS_PATTERN = re.compile(r'^\s*(状态|status)[：:]\s*(\S+)', re.MULTILINE)

# 链接模式
LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+\.md)\)')


def should_exclude(path: Path) -> bool:
    """判断是否应该排除"""
    parts = path.parts
    for excl in EXCLUDE_DIRS:
        if excl in parts:
            return True
    return False


def scan_redundancy(file_path: Path) -> list[dict]:
    """扫描冗余问题"""
    issues = []
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        lines = content.split('\n')

        # 检查关键词
        for keyword in REDUNDANCY_KEYWORDS:
            pattern = re.compile(keyword)
            matches = [(i+1, line.strip()) for i, line in enumerate(lines) if pattern.search(line)]
            if matches:
                for line_no, line_text in matches[:3]:  # 只取前3个
                    issues.append({
                        'type': 'redundancy',
                        'keyword': keyword,
                        'line': line_no,
                        'text': line_text[:100]
                    })

        # 检查修改记录堆叠（连续多行以 --- 或 === 或 变更 开头）
        change_count = 0
        for line in lines:
            if re.match(r'^[-=]{3,}|变更记录|修改历史|changelog', line, re.IGNORECASE):
                change_count += 1
        if change_count > 5:
            issues.append({
                'type': 'redundancy',
                'keyword': '过多修改记录',
                'line': 0,
                'text': f'发现 {change_count} 条修改记录，建议归档'
            })

    except Exception as e:
        pass
    return issues


def scan_status(file_path: Path) -> list[dict]:
    """扫描状态问题"""
    issues = []
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')

        # 检查是否缺少状态字段
        status_match = STATUS_PATTERN.search(content)
        if not status_match:
            issues.append({
                'type': 'status',
                'keyword': '缺少状态字段',
                'line': 0,
                'text': '文档缺少状态声明（状态：xxx）'
            })

        # 检查 long-term current 误用
        if status_match:
            status = status_match.group(2)
            file_name = file_path.name.lower()

            # 周计划、交付记录不应该是 current
            if status == 'current':
                if any(kw in file_name for kw in ['周', 'week', '交付', 'delivery', '执行', 'execution']):
                    issues.append({
                        'type': 'status',
                        'keyword': '状态误用',
                        'line': 0,
                        'text': f'一次性文档不应长期为 current，当前值：{status}'
                    })

    except Exception as e:
        pass
    return issues


def scan_links(file_path: Path, base_path: Path) -> list[dict]:
    """扫描失效链接"""
    issues = []
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')

        for match in LINK_PATTERN.finditer(content):
            link_text = match.group(1)
            link_target = match.group(2)

            # 只检查相对链接
            if link_target.startswith('http') or link_target.startswith('#'):
                continue

            # 解析相对路径
            link_path = (file_path.parent / link_target).resolve()

            # 检查文件是否存在
            if not link_path.exists():
                issues.append({
                    'type': 'broken_link',
                    'keyword': '失效链接',
                    'line': 0,
                    'text': f'[{link_text}]({link_target}) -> 文件不存在'
                })

    except Exception as e:
        pass
    return issues


def scan_file(file_path: Path, base_path: Path) -> list[dict]:
    """扫描单个文件"""
    issues = []
    issues.extend(scan_redundancy(file_path))
    issues.extend(scan_status(file_path))
    issues.extend(scan_links(file_path, base_path))
    return issues


def scan_directory(directory: Path, recursive: bool = True) -> dict:
    """扫描目录"""
    results = {
        'files_scanned': 0,
        'total_issues': 0,
        'by_type': {
            'redundancy': [],
            'status': [],
            'broken_link': []
        }
    }

    pattern = '**/*.md' if recursive else '*.md'
    for file_path in directory.glob(pattern):
        if should_exclude(file_path):
            continue

        results['files_scanned'] += 1
        issues = scan_file(file_path, directory)

        for issue in issues:
            results['by_type'][issue['type']].append({
                'file': str(file_path.relative_to(directory)),
                **issue
            })
            results['total_issues'] += 1

    return results


def main():
    base_path = Path('/Users/xinran/Downloads/dev/mindsync')

    print("=" * 60)
    print("文档治理扫描报告")
    print("=" * 60)
    print(f"扫描目录：{base_path}")
    print()

    results = scan_directory(base_path)

    print(f"扫描文件数：{results['files_scanned']}")
    print(f"发现问题数：{results['total_issues']}")
    print()

    for issue_type, issues in results['by_type'].items():
        if issues:
            print(f"### {issue_type.upper()}")
            print(f"数量：{len(issues)}")
            print()

            for issue in issues[:10]:  # 只显示前10个
                print(f"- [{issue['file']}]")
                if issue['line'] > 0:
                    print(f"  行 {issue['line']}：{issue['text']}")
                else:
                    print(f"  {issue['text']}")
            print()

    if results['total_issues'] == 0:
        print("未发现问题，文档系统健康。")
    else:
        print("=" * 60)
        print("建议：使用 /mindsync-doc-governance 进行完整检查和修复")

    return 0 if results['total_issues'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())