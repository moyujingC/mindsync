#!/usr/bin/env python3
"""
修复 Markdown 链接风格问题。
把 repo-relative 和绝对路径链接改为相对路径。
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')
LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')


def relative_to(from_file: Path, to_file: Path) -> str:
    """计算从 from_file 到 to_file 的相对路径"""
    try:
        rel = to_file.relative_to(from_file.parent)
        return './' + str(rel)
    except ValueError:
        pass

    rel = Path(from_file).parent
    for parent in [rel, *rel.parents]:
        try:
            r = to_file.relative_to(parent)
            depth = len(rel.parts) - len(parent.parts)
            return '../' * depth + str(r)
        except ValueError:
            continue
    return str(to_file)


def fix_link_style(source_file: Path, link_text: str, link_target: str) -> tuple[str, str]:
    """
    修复链接风格。
    返回 (新链接, action)
    action: fixed_relative / unchanged
    """
    # 绝对路径
    if link_target.startswith('/Users/') or link_target.startswith('/home/'):
        abs_path = Path(link_target)
        if abs_path.exists():
            new_target = relative_to(source_file, abs_path)
            return f'[{link_text}]({new_target})', 'fixed_relative'
        return f'[{link_text}]({link_target})', 'unchanged'

    # repo-relative（以仓库根目录开头，但没有 ./ 或 ../）
    if not link_target.startswith(('./', '../', '/', 'http', '#')):
        repo_path = REPO_ROOT / link_target
        if repo_path.exists():
            new_target = relative_to(source_file, repo_path)
            return f'[{link_text}]({new_target})', 'fixed_relative'

    return f'[{link_text}]({link_target})', 'unchanged'


def main():
    import argparse
    parser = argparse.ArgumentParser(description='修复 Markdown 链接风格问题')
    parser.add_argument('--execute', action='store_true', help='实际执行修改')
    args = parser.parse_args()

    sys.path.insert(0, str(REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'scripts'))
    from scan import scan_directory, find_repo_root

    root = find_repo_root(Path.cwd())
    results = scan_directory(root)
    style_issues = results['by_type']['link_style']

    # 按文件分组
    by_file = {}
    for issue in style_issues:
        by_file.setdefault(issue['file'], []).append(issue)

    stats = {'fixed_relative': 0, 'unchanged': 0, 'files': 0}
    changes = []

    for rel_path, issues in by_file.items():
        source_file = root / rel_path
        try:
            content = source_file.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        original_content = content
        file_changes = []

        for issue in sorted(issues, key=lambda x: -x['line']):
            line_no = issue['line']
            line_text = issue.get('text', '')

            m = LINK_PATTERN.search(line_text)
            if not m:
                continue
            link_text = m.group(1)
            link_target = m.group(2)
            original_link = m.group(0)

            new_str, action = fix_link_style(source_file, link_text, link_target)
            stats[action] += 1

            if action != 'unchanged':
                file_changes.append({
                    'line': line_no,
                    'old': original_link,
                    'new': new_str,
                })

                lines = content.splitlines()
                if 1 <= line_no <= len(lines):
                    lines[line_no - 1] = lines[line_no - 1].replace(original_link, new_str, 1)
                    content = '\n'.join(lines)

        if content != original_content:
            stats['files'] += 1
            changes.append({
                'file': rel_path,
                'changes': file_changes,
            })
            if args.execute:
                source_file.write_text(content, encoding='utf-8')

    total = len(style_issues)
    fixed = stats['fixed_relative']
    files_changed = stats['files']

    print('=' * 60)
    print('链接风格修复' + ('（实际执行）' if args.execute else '（dry-run）'))
    print('=' * 60)
    print(f'\n总问题数：{total}')
    print(f'修复为相对路径：{fixed}')
    print(f'涉及文件：{files_changed}')

    print('\n示例（前 10 个修改）：')
    count = 0
    for change in changes:
        for c in change['changes']:
            if count >= 10:
                break
            print(f'\n[{change["file"]}: 行 {c["line"]}]')
            print(f'  原：{c["old"][:100]}')
            print(f'  新：{c["new"][:100]}')
            count += 1
        if count >= 10:
            break

    if not args.execute:
        print('\n这是 dry-run。如要执行，请加 --execute 参数。')
        return

    # 生成操作记录
    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = output_dir / '链接风格修复操作记录-2026-08-20.md'

    lines = [
        '# 链接风格修复操作记录',
        '',
        '> 日期：2026-08-20',
        '> 操作：把 repo-relative 和绝对路径 Markdown 链接改为相对路径',
        '',
        '## 汇总',
        '',
        f'- 总问题数：{total}',
        f'- 修复为相对路径：{fixed}',
        f'- 涉及文件：{files_changed}',
        '',
        '## 修改详情',
        '',
    ]

    for change in changes:
        lines.append(f'### {change["file"]}')
        lines.append('')
        lines.append('```markdown')
        for c in change['changes']:
            lines.append(f'- 行 {c["line"]}: `{c["old"][:80]}` -> `{c["new"][:80]}`')
        lines.append('```')
        lines.append('')

    log_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\n操作记录已保存：{log_path}')


if __name__ == '__main__':
    main()
