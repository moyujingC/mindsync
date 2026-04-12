"""Path helpers for locating the ToC workspace in local and container runtimes."""

from __future__ import annotations

from pathlib import Path


def resolve_knowledge_toc_root(from_file: str | Path) -> Path:
    """Locate the ToC root by walking parents until expected directories exist."""

    path = Path(from_file).resolve()
    for candidate in [path.parent, *path.parents]:
        if (candidate / "domain" / "knowledge" / "schemas").exists():
            return candidate
        if (candidate / "data" / "knowledge").exists():
            return candidate
    raise RuntimeError(f"unable to resolve knowledge ToC root from {path}")
