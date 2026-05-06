#!/usr/bin/env python3
"""
文档治理扫描脚本
用于快速发现文档系统中的冗余、重复、矛盾和状态问题。
"""

import argparse
import re
import sys
from pathlib import Path

ROOT_GOVERNANCE_FILES = {
    'AGENTS.md', 'COMPANY.md', 'DOCS_GOVERNANCE.md',
    'MONOREPO.md', 'CLAUDE.md'
}

FORMAL_PROJECT_DIRS = {
    'specs', 'architecture', 'tasks', 'qa', 'delivery',
    'handoff', 'verification', 'research', 'content',
    'decisions', 'runbooks', 'templates', 'kb'
}

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
STATUS_PATTERN = re.compile(r'^\s*>?\s*(状态|status)\s*[：:]\s*(\S+)', re.MULTILINE)

# 链接模式
LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+\.md)\)')


def should_exclude(path: Path) -> bool:
    """判断是否应该排除"""
    parts = path.parts
    for excl in EXCLUDE_DIRS:
        if excl in parts:
            return True
    return False


def is_formal_doc(file_path: Path, repo_root: Path) -> bool:
    """按当前治理规则判断是否属于应检查元数据的第一方正式文档"""
    try:
        rel = file_path.relative_to(repo_root)
    except ValueError:
        return False

    parts = rel.parts
    if not parts:
        return False

    if len(parts) == 1:
        return file_path.name in ROOT_GOVERNANCE_FILES

    if parts[0] == 'company':
        return True

    if parts[0] == 'shared':
        return True

    if parts[0] == 'projects':
        if file_path.name in {'PROJECT.md', 'README.md', 'AGENTS.md'}:
            return True
        return any(part in FORMAL_PROJECT_DIRS for part in parts)

    return False


def read_content(file_path: Path) -> str:
    return file_path.read_text(encoding='utf-8', errors='ignore')


def iter_non_fenced_lines(content: str):
    """返回不在 fenced code block 内的行"""
    in_fence = False
    for i, line in enumerate(content.splitlines(), 1):
        if line.strip().startswith('```'):
            in_fence = not in_fence
            continue
        if not in_fence:
            yield i, line


def scan_redundancy(file_path: Path) -> list[dict]:
    """扫描冗余问题"""
    issues = []
    try:
        content = read_content(file_path)
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
        content = read_content(file_path)

        # 检查是否缺少状态字段
        status_match = STATUS_PATTERN.search('\n'.join(content.splitlines()[:15]))
        if not status_match:
            issues.append({
                'type': 'status',
                'keyword': '缺少状态字段',
                'line': 0,
                'text': '文档缺少状态声明（状态：xxx）'
            })

        # 检查 long-term current 误用
        if status_match:
            status = status_match.group(2).lower()
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


def scan_formal_status(file_path: Path, repo_root: Path) -> list[dict]:
    if not is_formal_doc(file_path, repo_root):
        return []
    return scan_status(file_path)


def resolve_link_target(file_path: Path, repo_root: Path, link_target: str) -> tuple[Path | None, str | None]:
    """解析 markdown 链接，支持相对路径和 repo-relative 路径"""
    if link_target.startswith(('/', '/Users/', '/home/')):
        abs_path = Path(link_target)
        if abs_path.exists():
            return abs_path, 'absolute'
        return None, 'absolute'

    relative_path = (file_path.parent / link_target).resolve()
    if relative_path.exists():
        return relative_path, 'relative'

    repo_relative_path = (repo_root / link_target).resolve()
    if repo_relative_path.exists():
        return repo_relative_path, 'repo-relative'

    return None, None


def scan_links(file_path: Path, repo_root: Path) -> list[dict]:
    """扫描失效链接，并区分 repo-relative / absolute style 问题"""
    issues = []
    try:
        content = read_content(file_path)

        for line_no, line in iter_non_fenced_lines(content):
            for match in LINK_PATTERN.finditer(line):
                link_text = match.group(1)
                link_target = match.group(2)

                if link_target.startswith('http') or link_target.startswith('#'):
                    continue

                resolved_path, mode = resolve_link_target(file_path, repo_root, link_target)

                if resolved_path is None:
                    issues.append({
                        'type': 'broken_link',
                        'keyword': '失效链接',
                        'line': line_no,
                        'text': f'[{link_text}]({link_target}) -> 文件不存在'
                    })
                    continue

                if mode == 'repo-relative':
                    issues.append({
                        'type': 'link_style',
                        'keyword': 'repo-relative 正文链接',
                        'line': line_no,
                        'text': f'[{link_text}]({link_target}) -> 可解析，但建议改为相对链接'
                    })
                elif mode == 'absolute':
                    issues.append({
                        'type': 'link_style',
                        'keyword': '绝对路径正文链接',
                        'line': line_no,
                        'text': f'[{link_text}]({link_target}) -> 可解析，但不应在正式文档中使用绝对路径'
                    })

    except Exception as e:
        pass
    return issues


def scan_file(file_path: Path, repo_root: Path) -> list[dict]:
    """扫描单个文件"""
    issues = []
    issues.extend(scan_redundancy(file_path))
    issues.extend(scan_formal_status(file_path, repo_root))
    issues.extend(scan_links(file_path, repo_root))
    return issues


def scan_directory(directory: Path, recursive: bool = True) -> dict:
    """扫描目录"""
    results = {
        'files_scanned': 0,
        'total_issues': 0,
        'by_type': {
            'redundancy': [],
            'status': [],
            'broken_link': [],
            'link_style': []
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


def parse_args():
    parser = argparse.ArgumentParser(description='文档治理扫描脚本')
    parser.add_argument(
        'path',
        nargs='?',
        default='.',
        help='待扫描目录，默认当前工作目录'
    )
    return parser.parse_args()


def main():
    args = parse_args()
    base_path = Path(args.path).resolve()

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
