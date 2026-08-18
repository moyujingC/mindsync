#!/usr/bin/env python3
"""Show what changed from the previous lesson in the public code root."""

from __future__ import annotations

import argparse
import difflib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from check_release_root import agent_versions_root, missing_paths, optional_missing_paths, read_release_version


TEXT_SUFFIXES = {
    ".cfg",
    ".css",
    ".env",
    ".html",
    ".java",
    ".js",
    ".json",
    ".md",
    ".py",
    ".sql",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}
IGNORE_DIRS = {
    ".git",
    ".mvn",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
    "target",
}


@dataclass(frozen=True)
class FileDelta:
    status: str
    relative_path: Path
    old_path: Path | None
    new_path: Path | None
    added_lines: int = 0
    removed_lines: int = 0
    ranges: tuple[str, ...] = ()


def skill_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_lesson_delta_map() -> dict[str, dict[str, Any]]:
    path = skill_root() / "references" / "lesson_delta_map.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return {str(key).zfill(2): value for key, value in data.items() if isinstance(value, dict)}


def print_lesson_guide(lesson: int, guide: dict[str, Any], *, include_delta: bool = True) -> None:
    if not guide:
        return
    print("\n## 内置课程增量")
    title = guide.get("title")
    if title:
        print(f"- 本课定位: 第 {lesson:02d} 课，{title}")
    if include_delta and guide.get("delta"):
        print(f"- 能力变化: {guide['delta']}")
    focus = guide.get("focus")
    if isinstance(focus, list) and focus:
        print("- 建议先看: " + "、".join(f"`{item}`" for item in focus[:5]))
    observe = guide.get("observe")
    if isinstance(observe, list) and observe:
        print("- 观察信号: " + "、".join(str(item) for item in observe[:5]))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Public code root.")
    parser.add_argument("lesson", type=int, help="Current lesson number, 1-46.")
    parser.add_argument("--limit", type=int, default=12, help="Maximum changed files to print.")
    parser.add_argument("--ranges", type=int, default=3, help="Maximum line ranges per file.")
    return parser.parse_args()


def one_match(root: Path, pattern: str) -> Path | None:
    matches = sorted(root.glob(pattern))
    return matches[0] if matches else None


def is_text_path(path: Path) -> bool:
    if path.name in {".env", ".env.example"}:
        return True
    return path.suffix.lower() in TEXT_SUFFIXES


def iter_files(root: Path) -> dict[Path, Path]:
    files: dict[Path, Path] = {}
    if not root.exists():
        return files
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if any(part in IGNORE_DIRS for part in path.relative_to(root).parts):
            continue
        relative = path.relative_to(root)
        files[relative] = path
    return files


def read_lines(path: Path) -> list[str]:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        return []


def line_ranges(old_path: Path, new_path: Path, max_ranges: int) -> tuple[str, ...]:
    old_lines = read_lines(old_path)
    new_lines = read_lines(new_path)
    matcher = difflib.SequenceMatcher(a=old_lines, b=new_lines, autojunk=False)
    ranges: list[str] = []
    for tag, old_start, old_end, new_start, new_end in matcher.get_opcodes():
        if tag == "equal":
            continue
        if tag == "delete":
            ranges.append(f"上一课 L{old_start + 1}-L{old_end}")
        else:
            start = new_start + 1
            end = max(new_start + 1, new_end)
            ranges.append(f"本课 L{start}-L{end}")
        if len(ranges) >= max_ranges:
            break
    return tuple(ranges)


def count_changed_lines(old_path: Path, new_path: Path) -> tuple[int, int]:
    old_lines = read_lines(old_path)
    new_lines = read_lines(new_path)
    added = 0
    removed = 0
    for line in difflib.ndiff(old_lines, new_lines):
        if line.startswith("+ "):
            added += 1
        elif line.startswith("- "):
            removed += 1
    return added, removed


def topic_for_path(path: Path) -> str:
    text = path.as_posix()
    name = path.name
    if name == "agent_capabilities.json":
        return "调试后台能力开关和面板可见性"
    if text.endswith("README.md"):
        return "本课运行说明和学习目标"
    if "agents/" in text:
        return "Agent 编排、提示词边界或回答组装"
    if "api/" in text:
        return "HTTP 接口、请求/响应结构或调试字段"
    if "tools/" in text:
        return "Tool 定义、路由、执行或结果观察"
    if "integrations/" in text:
        return "电商后端调用封装"
    if "rag/" in text or "knowledge" in text:
        return "RAG 检索、引用、召回质量或知识材料"
    if "workflows/" in text:
        return "Workflow、HITL、恢复或幂等边界"
    if "state/" in text or "memory" in text:
        return "会话记忆、上下文状态或压缩"
    if "observability/" in text or "evals/" in text or "feedback/" in text:
        return "Trace、Eval、反馈或质量观察"
    if "cost/" in text:
        return "成本统计、轻重模型路由或预算治理"
    if name.startswith("scenario_"):
        return "场景验证脚本和预期观察信号"
    if "screenshots/" in text:
        return "配套截图，可用来对照调试后台表现"
    return "课程代码或材料变动"


def rank_delta(delta: FileDelta) -> tuple[int, int, str]:
    path = delta.relative_path.as_posix()
    if path.endswith("README.md"):
        group = 0
    elif path.endswith(".py"):
        group = 1
    elif path.endswith(".json"):
        group = 2
    elif "screenshots/" in path:
        group = 5
    else:
        group = 3
    magnitude = delta.added_lines + delta.removed_lines
    return (group, -magnitude, path)


def compare_dirs(old_dir: Path, new_dir: Path, max_ranges: int) -> list[FileDelta]:
    old_files = iter_files(old_dir)
    new_files = iter_files(new_dir)
    deltas: list[FileDelta] = []

    for relative in sorted(set(old_files) | set(new_files)):
        old_path = old_files.get(relative)
        new_path = new_files.get(relative)
        if old_path and not new_path:
            lines = len(read_lines(old_path)) if is_text_path(old_path) else 0
            deltas.append(FileDelta("deleted", relative, old_path, None, removed_lines=lines))
            continue
        if new_path and not old_path:
            lines = len(read_lines(new_path)) if is_text_path(new_path) else 0
            deltas.append(FileDelta("added", relative, None, new_path, added_lines=lines, ranges=("本课 L1",) if lines else ()))
            continue
        if not old_path or not new_path:
            continue
        if old_path.read_bytes() == new_path.read_bytes():
            continue
        if is_text_path(old_path) and is_text_path(new_path):
            added, removed = count_changed_lines(old_path, new_path)
            ranges = line_ranges(old_path, new_path, max_ranges)
            deltas.append(FileDelta("modified", relative, old_path, new_path, added, removed, ranges))
        else:
            deltas.append(FileDelta("modified", relative, old_path, new_path))

    return sorted(deltas, key=rank_delta)


def print_delta(root: Path, delta: FileDelta) -> None:
    current = delta.new_path or delta.old_path
    display = current.relative_to(root) if current else delta.relative_path
    counts = ""
    if delta.added_lines or delta.removed_lines:
        counts = f" (+{delta.added_lines}/-{delta.removed_lines})"
    print(f"- [{delta.status}] `{display}`{counts}")
    print(f"  - 看什么: {topic_for_path(delta.relative_path)}")
    if delta.ranges:
        print("  - 重点位置: " + ", ".join(delta.ranges))


def main() -> int:
    args = parse_args()
    root = args.root.expanduser().resolve()
    lesson_guides = load_lesson_delta_map()
    missing = missing_paths(root)
    if missing:
        print(f"[ERROR] 不是合格 release 根目录: {root}")
        print("[ERROR] 缺少: " + ", ".join(missing))
        return 2
    if not 1 <= args.lesson <= 46:
        print("[ERROR] lesson must be 1-46")
        return 2
    if args.lesson == 1:
        print("# 第 01 课新增点")
        print("- 第 01 课没有上一课可比较。请从 skill 内置精炼课程地图和当前代码仓的 `agent-course-versions/lesson-01-*` 开始。")
        print_lesson_guide(args.lesson, lesson_guides.get("01", {}), include_delta=False)
        return 0

    versions_root = agent_versions_root(root)
    current = one_match(versions_root, f"lesson-{args.lesson:02d}-*")
    previous = one_match(versions_root, f"lesson-{args.lesson - 1:02d}-*")
    story = one_match(root / "courses" / "story", f"{args.lesson:02d}-*.md")
    previous_story = one_match(root / "courses" / "story", f"{args.lesson - 1:02d}-*.md")
    optional_missing = optional_missing_paths(root)

    print(f"# 第 {args.lesson:02d} 课相对第 {args.lesson - 1:02d} 课的变化")
    print(f"\n- 课程代码仓根目录: `{root}`")
    print("- 包形态: 云效/Codeup 代码仓")
    release_version, _release_version_error = read_release_version(root)
    print(f"- 发布版本: `{release_version or '未知（旧版仓未提供 release-version.json）'}`")
    if story or previous_story:
        print(f"- 本课正文: `{story.relative_to(root) if story else '未找到'}`")
        print(f"- 上一课正文: `{previous_story.relative_to(root) if previous_story else '未找到'}`")
    elif optional_missing:
        print("- 课程正文: 未随包提供；相邻课导读以代码差异和 skill 内置精炼课程地图为准。")
    else:
        print("- 课程正文: 未找到，请检查课程文件是否完整。")
    print(f"- 本课代码/材料: `{current.relative_to(root) if current else '未找到'}`")
    print(f"- 上一课代码/材料: `{previous.relative_to(root) if previous else '未找到'}`")
    print_lesson_guide(args.lesson, lesson_guides.get(f"{args.lesson:02d}", {}))

    if not current or not previous:
        print("\n[WARN] 找不到相邻课目录，无法做代码差异。请先确认云效代码仓完整。")
        return 1

    current_scenarios = sorted(current.glob("scenario_*.json"))
    if args.lesson >= 42 and current_scenarios:
        runtime = versions_root / "lesson-41-final-rehearsal" / "backend"
        print("\n## 导读结论")
        guide = lesson_guides.get(f"{args.lesson:02d}", {})
        if guide.get("delta"):
            print(f"- {guide['delta']}")
        else:
            print("- 本课重点是场景材料和验证路径，通常复用第 41 课后端运行时代码。")
        print(f"- 运行时代码重点回看: `{runtime.relative_to(root)}`")
        print("\n## 建议先看")
        material_files = [p for p in sorted(current.rglob("*")) if p.is_file()]
        for path in material_files[: args.limit]:
            relative = path.relative_to(root)
            print(f"- `{relative}`")
            print(f"  - 看什么: {topic_for_path(path.relative_to(current))}")
        return 0

    deltas = compare_dirs(previous, current, max(1, args.ranges))
    if not deltas:
        print("\n## 导读结论")
        if optional_missing:
            print("- 相邻课代码目录没有检测到文本或资源差异；请以 skill 内置精炼课程地图和本课 README 为主。")
        else:
            print("- 相邻课代码目录没有检测到文本或资源差异；请以课程正文差异为主。")
        return 0

    print("\n## 导读结论")
    print(f"- 检测到 {len(deltas)} 个文件变动。优先看 README、核心 Python/JSON 文件，再看截图或辅助材料。")

    print("\n## 建议先看")
    for delta in deltas[: max(1, args.limit)]:
        print_delta(root, delta)

    if len(deltas) > args.limit:
        print(f"\n- 其余 {len(deltas) - args.limit} 个文件可在需要时继续展开。")

    print("\n## 阅读顺序")
    print("1. 先读本课 README，再结合 skill 内置精炼课程地图确认新增能力。")
    print("2. 再看上面列出的核心代码文件，关注重点位置。")
    print("3. 最后启动本课，在调试后台观察对应面板或字段。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
