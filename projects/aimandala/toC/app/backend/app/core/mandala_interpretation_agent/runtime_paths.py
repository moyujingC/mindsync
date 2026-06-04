"""Resolve filesystem roots for source checkout and container runtime layouts."""

from __future__ import annotations

from pathlib import Path


def _find_ancestor(start: Path, predicate) -> Path | None:
    for candidate in (start, *start.parents):
        if predicate(candidate):
            return candidate
    return None


CURRENT_FILE = Path(__file__).resolve()
MODULE_ROOT = CURRENT_FILE.parent
BACKEND_ROOT = _find_ancestor(
    CURRENT_FILE,
    lambda candidate: (candidate / "requirements.release.txt").exists()
    and (candidate / "app").is_dir(),
) or CURRENT_FILE.parents[3]
AIMANDALA_ROOT = _find_ancestor(
    CURRENT_FILE,
    lambda candidate: (candidate / "PROJECT.md").exists()
    and (candidate / "toC" / "app" / "backend").is_dir(),
) or BACKEND_ROOT
REPO_ROOT = _find_ancestor(
    AIMANDALA_ROOT,
    lambda candidate: (candidate / "AGENTS.md").exists() and (candidate / "company").is_dir(),
) or AIMANDALA_ROOT


def relative_to_known_root(path: Path) -> str:
    for base in (REPO_ROOT, AIMANDALA_ROOT, BACKEND_ROOT):
        try:
            return str(path.relative_to(base))
        except ValueError:
            continue
    return str(path)
