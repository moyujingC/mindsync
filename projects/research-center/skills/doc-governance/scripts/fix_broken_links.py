#!/usr/bin/env python3
"""
批量修复失效 Markdown 链接。
策略：
1. 若目标在仓库中存在（任意位置），重新计算相对路径
2. 若不存在，将链接降级为纯文本（保留显示文字）
支持 dry-run。
"""

import argparse
import re
import sys
import urllib.parse
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')

LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
EXCLUDE_DIRS = {'node_modules', '.git', '.pytest_cache', '.venv', '__pycache__', 'dist', 'build'}


def should_exclude(path: Path) -> bool:
    return any(excl in path.parts for excl in EXCLUDE_DIRS)


def build_file_index() -> dict[str, list[Path]]:
    """预先构建文件名到路径的索引"""
    index = {}
    for file_path in REPO_ROOT.rglob('*.md'):
        if should_exclude(file_path):
            continue
        if not file_path.is_file():
            continue
        index.setdefault(file_path.name, []).append(file_path)
    return index


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


def encode_link_target(target: str) -> str:
    """对 Markdown 链接目标进行 URL 编码（保留 / 和常见路径分隔符）"""
    parts = target.split('/')
    encoded_parts = [urllib.parse.quote(part, safe='') for part in parts]
    return '/'.join(encoded_parts)


def fix_link(source_file: Path, link_text: str, link_target: str, file_index: dict) -> tuple[str, str]:
    """
    尝试修复一个失效链接。
    返回 (新链接或文本, action)
    action: fixed_path / downgraded_to_text / unchanged
    """
    if link_target.startswith('http') or link_target.startswith('#'):
        return f'[{link_text}]({link_target})', 'unchanged'

    # 绝对路径
    if link_target.startswith('/Users/') or link_target.startswith('/home/'):
        abs_path = Path(link_target)
        if abs_path.exists():
            new_target = encode_link_target(relative_to(source_file, abs_path))
            return f'[{link_text}]({new_target})', 'fixed_path'
        return link_text, 'downgraded_to_text'

    # 相对路径
    resolved = (source_file.parent / link_target).resolve()
    if resolved.exists():
        return f'[{link_text}]({link_target})', 'unchanged'

    # 按文件名在索引中查找
    target_path = Path(link_target)
    filename = target_path.name
    if filename and filename in file_index:
        candidates = file_index[filename]
        # 优先选择与源文件同项目/同目录层级的
        source_parts = source_file.relative_to(REPO_ROOT).parts
        best = candidates[0]
        if len(candidates) > 1 and source_parts:
            for cand in candidates:
                cand_parts = cand.relative_to(REPO_ROOT).parts
                # 找最长公共前缀
                common = 0
                for a, b in zip(source_parts, cand_parts):
                    if a == b:
                        common += 1
                    else:
                        break
                # 简单启发：候选路径中是否包含目标路径的目录部分
                target_dirs = set(target_path.parts[:-1])
                cand_dirs = set(cand_parts)
                if target_dirs.issubset(cand_dirs):
                    best = cand
                    break
        new_target = encode_link_target(relative_to(source_file, best))
        return f'[{link_text}]({new_target})', 'fixed_path'

    # 找不到，降级为纯文本
    return link_text, 'downgraded_to_text'


def main():
    parser = argparse.ArgumentParser(description='批量修复失效 Markdown 链接')
    parser.add_argument('--execute', action='store_true', help='实际执行修改')
    args = parser.parse_args()

    sys.path.insert(0, str(REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'scripts'))
    from scan import scan_directory, find_repo_root

    root = find_repo_root(Path.cwd())
    results = scan_directory(root)
    broken_links = results['by_type']['broken_link']

    print('正在构建文件索引...')
    file_index = build_file_index()
    print(f'索引完成，共 {len(file_index)} 个唯一文件名\n')

    # 按文件分组
    by_file = {}
    for issue in broken_links:
        by_file.setdefault(issue['file'], []).append(issue)

    stats = {'fixed_path': 0, 'downgraded_to_text': 0, 'unchanged': 0, 'files': 0}
    changes = []

    for rel_path, issues in by_file.items():
        source_file = root / rel_path
        try:
            content = source_file.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        original_content = content
        file_changes = []

        # 从后往前替换，避免位置偏移
        for issue in sorted(issues, key=lambda x: -x['line']):
            line_no = issue['line']
            line_text = issue.get('text', '')

            # 解析链接（从 scan.py 输出中提取真正的 markdown 链接）
            m = LINK_PATTERN.search(line_text)
            if not m:
                continue
            link_text = m.group(1)
            link_target = m.group(2)
            original_link = m.group(0)

            new_str, action = fix_link(source_file, link_text, link_target, file_index)
            stats[action] += 1

            if action != 'unchanged':
                file_changes.append({
                    'line': line_no,
                    'old': original_link,
                    'new': new_str,
                    'action': action,
                })

                # 替换这一行中的原始链接
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

    total = len(broken_links)
    fixed = stats['fixed_path']
    downgraded = stats['downgraded_to_text']
    files_changed = stats['files']

    print('=' * 60)
    print('失效链接修复' + ('（实际执行）' if args.execute else '（dry-run）'))
    print('=' * 60)
    print(f'\n总失效链接：{total}')
    print(f'可修复路径：{fixed}')
    print(f'降级为文本：{downgraded}')
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
            print(f'  操作：{c["action"]}')
            count += 1
        if count >= 10:
            break

    if not args.execute:
        print('\n这是 dry-run。如要执行，请加 --execute 参数。')
        return

    # 生成操作记录
    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = output_dir / '失效链接修复操作记录-2026-08-20.md'

    lines = [
        '# 失效链接修复操作记录',
        '',
        '> 日期：2026-08-20',
        '> 操作：批量修复失效 Markdown 链接',
        '',
        '## 汇总',
        '',
        f'- 总失效链接：{total}',
        f'- 可修复路径：{fixed}',
        f'- 降级为文本：{downgraded}',
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
            lines.append(f'- 行 {c["line"]}: `{c["old"][:80]}` -> `{c["new"][:80]}` ({c["action"]})')
        lines.append('```')
        lines.append('')

    log_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\n操作记录已保存：{log_path}')


if __name__ == '__main__':
    main()
