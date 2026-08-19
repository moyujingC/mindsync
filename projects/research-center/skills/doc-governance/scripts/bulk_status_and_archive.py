#!/usr/bin/env python3
"""
批量补齐文档状态字段，并将旧阶段文档归档。
支持 dry-run。
"""

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')

# 状态推断规则（按优先级）
def infer_status(file_path: Path) -> str:
    rel = file_path.relative_to(REPO_ROOT)
    parts = rel.parts
    filename = file_path.name.lower()
    name_without_ext = file_path.stem

    # 缓存 / 依赖 / 构建产物 目录（已在 main 中排除，这里再保险）
    if any(d in parts for d in ['node_modules', '.venv', '.pytest_cache', 'vendor', '__pycache__', 'dist', 'build']):
        return 'reference'

    # 入口文件：需要区分层级和语境
    if filename in {'readme.md', 'project.md', 'agents.md'}:
        # 外部资料包里的 README
        if any(d in parts for d in ['external', 'references', 'sources', 'courses', 'research']):
            return 'reference'
        # 运行记录 / 实验目录里的 README
        if any(d in parts for d in ['foundation-runs', 'runs', 'logs', 'outputs', 'fixtures']):
            return 'historical-reference'
        # 项目级 / 公司级入口
        return 'current'

    # 外部参考资料 / 镜像 / 剪辑 / 课程原文
    if any(d in parts for d in ['references', 'sources', 'external', 'clippings', '原始镜像', 'courses']):
        return 'reference'

    # 研究原始材料
    if 'research' in parts:
        return 'reference'

    # AI 自动输出 / 日报 / 历史记录 / 运行记录
    if any(d in parts for d in ['aiassistant', 'outputs', 'daily', 'logs', 'foundation-runs']):
        return 'historical-reference'

    # 一次性阶段文档（按 DOCS_GOVERNANCE 默认预算）
    if any(d in parts for d in ['delivery', 'qa', 'tasks', 'handoff', 'verification']):
        return 'historical-reference'

    # 临时笔记
    if 'notes' in parts:
        return 'working'

    # 决策
    if 'decisions' in parts:
        return 'current'

    # 规格
    if 'specs' in parts:
        return 'current'

    # 架构
    if 'architecture' in parts:
        return 'current'

    # 运维手册
    if 'runbooks' in parts:
        return 'current'

    # 知识库（非 sources）
    if 'kb' in parts:
        return 'current'

    # 内容素材
    if 'content' in parts:
        return 'working'

    # 模板
    if 'templates' in parts:
        return 'current'

    # 默认保守处理
    return 'working'


STATUS_PATTERN = re.compile(r'^\s*>?\s*(状态|status)\s*[：:]\s*(\S+)', re.MULTILINE)
METADATA_START_PATTERN = re.compile(r'^(\s*>\s)')


def has_status(content: str) -> bool:
    return bool(STATUS_PATTERN.search('\n'.join(content.splitlines()[:30])))


def add_status_to_content(content: str, status: str) -> str:
    """在文件开头合适位置插入状态声明"""
    lines = content.splitlines()

    # 如果第一行是 # 标题，在前面插入元数据块
    if lines and lines[0].startswith('# '):
        metadata = [
            f'> 状态：{status}',
            '> 版本：0.1.0',
            f'> source_of_truth：自动补齐',
        ]
        return '\n'.join(metadata) + '\n\n' + content

    # 如果文件已经有 > 引用的元数据块，在第一个 > 行后插入
    if lines and lines[0].strip().startswith('>'):
        # 找到元数据块结束位置
        insert_pos = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('>'):
                insert_pos = i + 1
            elif line.strip() == '':
                continue
            else:
                break

        new_lines = lines[:insert_pos] + [f'> 状态：{status}'] + lines[insert_pos:]
        return '\n'.join(new_lines)

    # 默认在文件最开头插入
    metadata = [
        f'> 状态：{status}',
        '',
    ]
    return '\n'.join(metadata) + '\n' + content


def main():
    parser = argparse.ArgumentParser(description='批量补齐文档状态字段')
    parser.add_argument('--execute', action='store_true', help='实际执行修改')
    args = parser.parse_args()

    sys.path.insert(0, str(REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'scripts'))
    from scan import should_scan_status_doc

    targets = []
    for md_path in REPO_ROOT.rglob('*.md'):
        # 排除 node_modules 和 vendor 目录
        if 'node_modules' in md_path.parts or 'vendor' in md_path.parts:
            continue
        if not should_scan_status_doc(md_path, REPO_ROOT):
            continue
        try:
            content = md_path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        if not has_status(content):
            status = infer_status(md_path)
            targets.append({
                'path': md_path,
                'rel': md_path.relative_to(REPO_ROOT),
                'status': status,
            })

    # 按状态分组
    by_status = {}
    for t in targets:
        by_status.setdefault(t['status'], []).append(t)

    print('=' * 60)
    print('状态补齐与归档' + ('（实际执行）' if args.execute else '（dry-run）'))
    print('=' * 60)
    print(f'\n待处理文档总数：{len(targets)}')
    print()
    for status, items in sorted(by_status.items()):
        print(f'{status}: {len(items)} 个')

    print()
    print('示例（每类前 5 个）：')
    for status, items in sorted(by_status.items()):
        print(f'\n[{status}]')
        for item in items[:5]:
            print(f'  {item["rel"]}')

    if not args.execute:
        print('\n这是 dry-run。如要执行，请加 --execute 参数。')
        return

    # 执行修改
    updated = 0
    for item in targets:
        content = item['path'].read_text(encoding='utf-8', errors='ignore')
        new_content = add_status_to_content(content, item['status'])
        if new_content != content:
            item['path'].write_text(new_content, encoding='utf-8')
            updated += 1

    print(f'\n已更新 {updated} 个文件')

    # 生成操作记录
    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = output_dir / '状态补齐与归档操作记录-2026-08-20.md'

    lines = [
        '# 状态补齐与归档操作记录',
        '',
        '> 日期：2026-08-20',
        '> 操作：批量补齐缺少状态字段的文档，并将旧阶段文档归档',
        '',
        '## 处理汇总',
        '',
        '| 状态 | 文件数 |',
        '|------|--------|',
    ]
    for status, items in sorted(by_status.items()):
        lines.append(f'| {status} | {len(items)} |')

    lines.extend([
        '',
        f'**总计**：{len(targets)} 个文件',
        f'**实际更新**：{updated} 个文件',
        '',
        '## 处理详情',
        '',
    ])

    for status, items in sorted(by_status.items()):
        lines.extend([
            f'### {status}',
            '',
        ])
        for item in items:
            lines.append(f'- {item["rel"]}')
        lines.append('')

    log_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'操作记录已保存：{log_path}')


if __name__ == '__main__':
    main()
