#!/usr/bin/env python3
"""Validate a XiaoZhe ecommerce course public code root."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path


PUBLIC_CODE_REQUIRED_PATHS = [
    "agent-course-versions",
    "frontend/package.json",
    "ecommerce-backend",
    "requirements.txt",
    "docker-compose.infra.yml",
]

OPTIONAL_COURSE_PATHS = [
    "courses/story",
    "courses/basic",
]
RELEASE_VERSION_FILENAME = "release-version.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", type=Path, help="Public code root.")
    parser.add_argument(
        "--search-up",
        action="store_true",
        help="Search parent directories for a valid public code root.",
    )
    return parser.parse_args()


def missing_paths(root: Path) -> list[str]:
    return [relative for relative in PUBLIC_CODE_REQUIRED_PATHS if not (root / relative).exists()]


def release_layout(root: Path) -> str | None:
    if not [relative for relative in PUBLIC_CODE_REQUIRED_PATHS if not (root / relative).exists()]:
        return "public-code"
    return None


def agent_versions_root(root: Path) -> Path:
    return root / "agent-course-versions"


def frontend_root(root: Path) -> Path:
    return root / "frontend"


def optional_missing_paths(root: Path) -> list[str]:
    return [relative for relative in OPTIONAL_COURSE_PATHS if not (root / relative).exists()]


def read_release_version(root: Path) -> tuple[str | None, str | None]:
    path = root / RELEASE_VERSION_FILENAME
    if not path.exists():
        return None, f"缺少 {RELEASE_VERSION_FILENAME}；这通常是尚未加入发布身份的旧版代码仓。"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return None, f"{RELEASE_VERSION_FILENAME} 无法读取：{exc}"
    version = payload.get("releaseVersion") if isinstance(payload, dict) else None
    if not isinstance(version, str):
        return None, f"{RELEASE_VERSION_FILENAME} 缺少字符串字段 releaseVersion。"
    try:
        normalized = date.fromisoformat(version).isoformat()
    except ValueError:
        return None, f"releaseVersion={version!r} 不是 YYYY-MM-DD 发布日期。"
    if normalized != version:
        return None, f"releaseVersion={version!r} 不是零补齐的 YYYY-MM-DD 发布日期。"
    return version, None


def candidate_roots(start: Path) -> list[Path]:
    resolved = start.expanduser().resolve()
    if resolved.is_file():
        resolved = resolved.parent
    return [resolved, *resolved.parents]


def main() -> int:
    args = parse_args()
    roots = candidate_roots(args.root) if args.search_up else [args.root.expanduser().resolve()]

    for root in roots:
        missing = missing_paths(root)
        if not missing:
            layout = release_layout(root) or "unknown"
            print(f"[OK] course_code_root={root}")
            print("[OK] 包结构为 release-public-latest/云效代码仓形态，包含 agent-course-versions、frontend、ecommerce-backend、requirements.txt 和 compose 文件。")
            release_version, release_version_error = read_release_version(root)
            if release_version:
                print(f"[OK] release_version={release_version}")
            else:
                print(f"[INFO] release_version=unknown；{release_version_error}")
            optional_missing = optional_missing_paths(root)
            if optional_missing:
                print("[INFO] 未随公版代码仓提供完整课程正文: " + ", ".join(optional_missing))
                print("[INFO] 课程导读请使用 skill 内置 references/course_compact_map.md。")
            runbook_paths = [root / "doc" / "运行手册.md", root / "docs" / "运行手册.md"]
            if not any(path.exists() for path in runbook_paths):
                print("[INFO] 当前代码仓未找到 doc/运行手册.md；可能是旧版或不完整副本，请先更新云效/Codeup 代码仓。")
            return 0

    checked = roots[0]
    missing = missing_paths(checked)
    print(f"[ERROR] 不是合格的小哲电商云效课程代码仓根目录: {checked}")
    print("[ERROR] 缺少:")
    for item in missing:
        print(f"  - {item}")
    print("[FIX] 请提供云效代码仓根目录 release-public-latest（包含 agent-course-versions、frontend、ecommerce-backend、requirements.txt、docker-compose.infra.yml）。")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
