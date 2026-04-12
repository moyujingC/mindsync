"""Repository for loading compiled knowledge runtime indexes."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .compiler import KnowledgePackCompiler
from .paths import resolve_knowledge_toc_root


def get_knowledge_toc_root() -> Path:
    """Return the To C workspace root for knowledge assets and builds."""

    return resolve_knowledge_toc_root(__file__)


def parse_build_selector(build_selector: str) -> tuple[str, str]:
    """Normalize a build selector into `(source, build_id)`."""

    normalized = (build_selector or "current").strip() or "current"
    if normalized == "current":
        return ("current", "current")
    if normalized.startswith("candidate:"):
        candidate_id = normalized.split(":", 1)[1].strip()
        if not candidate_id:
            raise ValueError("candidate build selector requires a build id")
        return ("candidate", candidate_id)
    raise ValueError(f"unsupported build selector: {build_selector}")


def resolve_build_dir(build_selector: str = "current") -> Path:
    """Resolve a build selector to its build directory."""

    source, build_id = parse_build_selector(build_selector)
    knowledge_root = get_knowledge_toc_root() / "data" / "knowledge" / "builds"
    if source == "current":
        return knowledge_root / "current"
    return knowledge_root / "candidates" / build_id


def resolve_build_index_path(build_selector: str = "current") -> Path:
    """Resolve a build selector to the expected `index.json` path."""

    return resolve_build_dir(build_selector) / "index.json"


class KnowledgeRepository:
    """Read-only repository backed by the compiled v2.1 index."""

    def __init__(
        self,
        *,
        build_selector: str = "current",
        index_path: Path | None = None,
        compiler: KnowledgePackCompiler | None = None,
    ) -> None:
        self.build_selector = build_selector
        self.index_path = index_path or resolve_build_index_path(build_selector)
        resolved_build_dir = self.index_path.parent
        self.compiler = compiler or KnowledgePackCompiler(build_dir=resolved_build_dir)
        self._index_cache: dict[str, Any] | None = None

    def load_index(self, *, force_reload: bool = False) -> dict[str, Any]:
        if self._index_cache is None or force_reload:
            if not self.index_path.exists():
                self.compiler.ensure_index()
            self._index_cache = json.loads(self.index_path.read_text(encoding="utf-8"))
        return self._index_cache

    def get_manifest(self) -> dict[str, Any]:
        return self.load_index().get("manifest", {})

    def get_assets(self, category: str) -> dict[str, Any]:
        return self.load_index().get("assets", {}).get(category, {})

    def get_asset(self, category: str, asset_id: str) -> dict[str, Any] | None:
        return self.get_assets(category).get(asset_id)

    def get_lookup(self, lookup_name: str) -> dict[str, Any]:
        return self.load_index().get("lookups", {}).get(lookup_name, {})

    def get_build_info(self) -> dict[str, Any]:
        index = self.load_index()
        source, build_id = parse_build_selector(self.build_selector)
        return {
            "build_selector": self.build_selector,
            "build_source": source,
            "build_id": build_id,
            "index_path": str(self.index_path),
            "pack_id": index.get("pack_id", ""),
            "schema_version": index.get("schema_version", ""),
            "generated_at": index.get("generated_at", ""),
        }

    def refresh(self) -> dict[str, Any]:
        self.compiler.build()
        return self.load_index(force_reload=True)
