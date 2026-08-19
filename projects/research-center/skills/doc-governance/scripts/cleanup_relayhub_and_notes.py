#!/usr/bin/env python3
"""
清理 RelayHub 项目和临时笔记。
支持 dry-run 和实际执行两种模式。
"""

import argparse
import shutil
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')

# 要删除的路径（目录或文件）
TARGETS = [
    # RelayHub 项目工作区
    REPO_ROOT / 'projects' / 'relayhub',
    # RelayHub 公司侧入口
    REPO_ROOT / 'company' / 'projects' / 'RelayHub',
    # 临时笔记
    REPO_ROOT / 'projects' / 'content-matrix' / 'notes' / '2026-06-07-AI知识卡片教程整理.md',
    REPO_ROOT / 'projects' / 'content-matrix' / 'notes' / '2026-06-07-AI知识卡片提示词生成器.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-journey-engine-capability-registry-task-manager-discussion.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-external-architecture-feedback-triage.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-platform-architecture-blueprint-discussion.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-platform-positioning-and-boundaries-discussion.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-06-ui-restart-worktree-handoff.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-platform-mvp-and-evolution-plan-discussion.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-capability-registry-minimum-draft.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-architecture-handoff.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-pro-report-chat-minimum-boundary.md',
    REPO_ROOT / 'projects' / 'aimandala' / 'notes' / '2026-04-05-current-mvp-execution-brief.md',
]


def collect_stats(targets: list[Path]) -> list[dict]:
    """收集每个目标的信息"""
    stats = []
    for target in targets:
        if not target.exists():
            stats.append({
                'path': target,
                'rel': target.relative_to(REPO_ROOT),
                'exists': False,
                'is_dir': False,
                'file_count': 0,
                'size': 0,
            })
            continue

        is_dir = target.is_dir()
        if is_dir:
            files = list(target.rglob('*')) if target.exists() else []
            file_count = sum(1 for f in files if f.is_file())
            size = sum(f.stat().st_size for f in files if f.is_file())
        else:
            file_count = 1
            size = target.stat().st_size

        stats.append({
            'path': target,
            'rel': target.relative_to(REPO_ROOT),
            'exists': True,
            'is_dir': is_dir,
            'file_count': file_count,
            'size': size,
        })
    return stats


def scan_references(target_slugs: list[str]) -> list[dict]:
    """扫描 markdown 和 yaml 文件中对目标 slug 的引用"""
    refs = []
    patterns = [slug.lower() for slug in target_slugs]

    for file_path in REPO_ROOT.rglob('*'):
        if not file_path.is_file():
            continue
        if file_path.suffix not in {'.md', '.yaml', '.yml'}:
            continue
        if '.git' in file_path.parts:
            continue

        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        content_lower = content.lower()
        matched = []
        for slug in target_slugs:
            if slug.lower() in content_lower:
                matched.append(slug)

        if matched:
            refs.append({
                'file': file_path.relative_to(REPO_ROOT),
                'matches': matched,
            })

    return refs


def delete_targets(targets: list[Path]) -> list[dict]:
    """执行删除"""
    results = []
    for target in targets:
        if not target.exists():
            results.append({'path': target, 'status': 'not_found'})
            continue
        try:
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
            results.append({'path': target, 'status': 'deleted'})
        except Exception as e:
            results.append({'path': target, 'status': f'error: {e}'})
    return results


def main():
    parser = argparse.ArgumentParser(description='清理 RelayHub 项目和临时笔记')
    parser.add_argument('--execute', action='store_true', help='实际执行删除，否则为 dry-run')
    args = parser.parse_args()

    stats = collect_stats(TARGETS)

    # 输出汇总
    print('=' * 60)
    print('清理操作' + ('（实际执行）' if args.execute else '（dry-run）'))
    print('=' * 60)
    print()

    total_files = 0
    total_size = 0
    for s in stats:
        if s['exists']:
            total_files += s['file_count']
            total_size += s['size']
            print(f"{'[DIR] ' if s['is_dir'] else '[FILE]'} {s['rel']}")
            print(f"       文件数：{s['file_count']}，大小：{s['size'] / 1024:.1f} KB")
        else:
            print(f"[MISSING] {s['rel']}")
    print()
    print(f'总计：{len([s for s in stats if s["exists"]])} 个目标，{total_files} 个文件，{total_size / 1024:.1f} KB')
    print()

    if not args.execute:
        print('这是 dry-run。如要执行，请加 --execute 参数。')
        return

    # 实际删除
    print('开始删除...')
    results = delete_targets(TARGETS)
    for r in results:
        status = r['status']
        rel = r['path'].relative_to(REPO_ROOT)
        print(f'  {status}: {rel}')
    print()

    # 生成操作记录
    output_dir = REPO_ROOT / 'projects' / 'research-center' / 'skills' / 'doc-governance' / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = output_dir / f'清理操作记录-{datetime.now().strftime("%Y-%m-%d")}.md'

    lines = [
        '# 文档清理操作记录',
        '',
        f'> 日期：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
        f'> 操作：彻底删除 RelayHub 项目 + 12 个临时笔记',
        '',
        '## 删除目标',
        '',
        '| 目标 | 类型 | 文件数 | 大小（KB） | 状态 |',
        '|------|------|--------|------------|------|',
    ]

    for s in stats:
        type_str = '目录' if s['is_dir'] else '文件'
        size_kb = f'{s["size"] / 1024:.1f}' if s['exists'] else '-'
        status = '已删除' if any(r['path'] == s['path'] and r['status'] == 'deleted' for r in results) else '不存在'
        lines.append(f'| {s["rel"]} | {type_str} | {s["file_count"]} | {size_kb} | {status} |')

    lines.extend([
        '',
        f'**总计**：{total_files} 个文件，{total_size / 1024:.1f} KB',
        '',
        '## 后续步骤',
        '',
        '- [ ] 扫描引用 RelayHub 的文档',
        '- [ ] 决定是否删除/修改这些引用',
        '- [ ] 更新 company/项目注册表.yaml',
        '',
    ])

    log_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'操作记录已保存：{log_path}')


if __name__ == '__main__':
    main()
