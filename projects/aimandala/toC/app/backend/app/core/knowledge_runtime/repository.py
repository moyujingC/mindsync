"""Repository for loading compiled knowledge runtime indexes."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .compiler import KnowledgePackCompiler


class KnowledgeRepository:
    """Read-only repository backed by the compiled v2.1 index."""

    def __init__(
        self,
        *,
        index_path: Path | None = None,
        compiler: KnowledgePackCompiler | None = None,
    ) -> None:
        toc_root = Path(__file__).resolve().parents[5]
        self.index_path = index_path or (
            toc_root / "data" / "knowledge" / "builds" / "current" / "index.json"
        )
        self.compiler = compiler or KnowledgePackCompiler()
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

    def refresh(self) -> dict[str, Any]:
        self.compiler.build()
        return self.load_index(force_reload=True)

