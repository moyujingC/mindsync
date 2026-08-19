#!/usr/bin/env python3
"""
清理 RelayHub 删除后的残留引用和配置。
"""

import re
import shutil
from pathlib import Path

REPO_ROOT = Path('/Users/xinran/Downloads/dev/mindsync')

CI_FILE = REPO_ROOT / '.github' / 'workflows' / 'relayhub-ci-deploy.yml'

PAPERCLIP_FILE = REPO_ROOT / '.paperclip.yaml'

MD_FILES = {
    'company/项目与仓库映射.md': {
        'remove_sections': [
            (r'### RelayHub\n', r'(?=### |## \d+\.|## [^#])'),
        ],
        'remove_links': [
            r'\[company/projects/RelayHub/PROJECT\.md\]\(../company/projects/RelayHub/PROJECT\.md\)\n',
            r'- 项目工作区：\n\s+- \[projects/relayhub\]\(projects/relayhub\)\n',
            r'- 项目入口：\n\s+- \[projects/relayhub/PROJECT\.md\]\(../projects/relayhub/PROJECT\.md\)\n',
            r'- 历史来源仓库：\n\s+- 无，直接在 Monorepo 内启动\n',
        ],
    },
    'company/2026-05-06-日期文档缺状态-人工复核批次.md': {
        'remove_sections': [
            (r'### 4\.2 RelayHub\n', r'(?=### 4\.3)'),
        ],
        'remove_lines_matching': [
            r'.*projects/relayhub/.*\.md.*\n',
        ],
    },
    'projects/aimandala/docs/decisions/2026-05-05-mvp-模型选型决策.md': {
        'remove_lines_matching': [
            r'- \[projects/relayhub/specs/2026-04-16-RelayHub-v1-架构与产品定义\.md\]\(../../../relayhub/specs/2026-04-16-RelayHub-v1-架构与产品定义\.md\)\n',
        ],
    },
}


def remove_yaml_block(content: str, key: str, block_id: str) -> tuple[str, bool]:
    """从 YAML 中移除指定 id 的列表项块"""
    lines = content.split('\n')
    result = []
    i = 0
    removed = False
    n = len(lines)

    while i < n:
        line = lines[i]
        stripped = line.lstrip()
        # 检查是否是目标列表项开头
        if stripped.startswith(f'- id: "{block_id}"') or stripped.startswith(f'- id: {block_id}'):
            removed = True
            # 跳过整个块，直到下一个同层级或更高层级的列表项
            current_indent = len(line) - len(stripped)
            i += 1
            while i < n:
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                if next_stripped == '':
                    # 保留空行，但跳过块内空行
                    # 判断下一条是否还是块内内容
                    peek = i + 1
                    if peek < n:
                        peek_stripped = lines[peek].lstrip()
                        if peek_stripped and (len(lines[peek]) - len(peek_stripped)) <= current_indent:
                            break
                    i += 1
                    continue
                next_indent = len(next_line) - len(next_stripped)
                if next_stripped.startswith('- ') and next_indent <= current_indent:
                    break
                i += 1
            continue
        result.append(line)
        i += 1

    return '\n'.join(result), removed


def remove_yaml_goal(content: str, title: str) -> tuple[str, bool]:
    """从 goals 中移除指定 title 的 goal"""
    pattern = re.compile(
        rf'(\n  - id: "[^"]+"\n    title: "{re.escape(title)}"\n    projects:\n      - "relayhub"\n)',
        re.MULTILINE
    )
    new_content = pattern.sub('\n', content)
    return new_content, new_content != content


def edit_paperclip():
    content = PAPERCLIP_FILE.read_text(encoding='utf-8')

    # 移除 RelayHub goal
    content, goal_removed = remove_yaml_goal(content, 'RelayHub能力建设')

    # 移除 RelayHub project
    content, project_removed = remove_yaml_block(content, 'projects', 'relayhub')

    if goal_removed or project_removed:
        PAPERCLIP_FILE.write_text(content, encoding='utf-8')
        print(f'已更新 .paperclip.yaml（goal removed: {goal_removed}, project removed: {project_removed}）')
    else:
        print('.paperclip.yaml 中未找到 RelayHub 配置')


def edit_markdown(rel_path: str, config: dict):
    file_path = REPO_ROOT / rel_path
    content = file_path.read_text(encoding='utf-8')
    original = content

    # 按节删除
    for start_pattern, end_pattern in config.get('remove_sections', []):
        pattern = re.compile(
            f'({start_pattern})(.*?)({end_pattern})',
            re.DOTALL
        )
        content = pattern.sub(lambda m: m.group(3) if end_pattern.startswith('(?=') else '', content)

    # 按链接/行模式删除
    for pattern in config.get('remove_links', []) + config.get('remove_lines_matching', []):
        content = re.sub(pattern, '', content, flags=re.MULTILINE)

    if content != original:
        file_path.write_text(content, encoding='utf-8')
        print(f'已更新 {rel_path}')
    else:
        print(f'{rel_path} 无变化')


def main():
    # 1. 删除 CI 工作流
    if CI_FILE.exists():
        CI_FILE.unlink()
        print(f'已删除 {CI_FILE.relative_to(REPO_ROOT)}')
    else:
        print('CI 文件不存在')

    # 2. 编辑 .paperclip.yaml
    edit_paperclip()

    # 3. 编辑 markdown 文件
    for rel_path, config in MD_FILES.items():
        edit_markdown(rel_path, config)

    print()
    print('清理完成。建议重新运行 scan.py 验证失效链接。')


if __name__ == '__main__':
    main()
