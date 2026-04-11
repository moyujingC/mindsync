"""Compile YAML knowledge packs into JSON runtime indexes."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

from .validators import KnowledgePackValidator


class KnowledgeBuildError(RuntimeError):
    """Raised when the knowledge pack cannot be compiled."""


class KnowledgePackCompiler:
    """Compile the v2.1 YAML knowledge pack into a runtime index."""

    def __init__(
        self,
        *,
        pack_root: Path | None = None,
        build_dir: Path | None = None,
        validator: KnowledgePackValidator | None = None,
    ) -> None:
        toc_root = Path(__file__).resolve().parents[5]
        self.pack_root = pack_root or (toc_root / "data" / "knowledge" / "packs" / "v2.1")
        self.build_dir = build_dir or (toc_root / "data" / "knowledge" / "builds" / "current")
        self.validator = validator or KnowledgePackValidator()

    def ensure_index(self) -> Path:
        """Ensure the runtime index exists on disk."""

        self._ensure_pack_exists()
        index_path = self.build_dir / "index.json"
        if not index_path.exists() or self._needs_rebuild(index_path):
            return self.build()
        return index_path

    def build(self) -> Path:
        """Compile the pack and persist `index.json`."""

        self._ensure_pack_exists()
        manifest = self._load_yaml(self.pack_root / "manifest.yaml")
        self.validator.validate_manifest(manifest)
        assets_by_category = self._load_assets(manifest)
        self.validator.validate_references(manifest, assets_by_category)

        compiled = self._compile_index(manifest, assets_by_category)
        self.build_dir.mkdir(parents=True, exist_ok=True)
        index_path = self.build_dir / "index.json"
        index_path.write_text(
            json.dumps(compiled, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return index_path

    def _ensure_pack_exists(self) -> None:
        manifest_path = self.pack_root / "manifest.yaml"
        if manifest_path.exists():
            return

        from .adapters.legacy_v2_python_pack import LegacyV2PythonPackExporter

        exporter = LegacyV2PythonPackExporter(pack_root=self.pack_root)
        exporter.export()

    def _needs_rebuild(self, index_path: Path) -> bool:
        index_mtime = index_path.stat().st_mtime
        for path in self.pack_root.rglob("*.yaml"):
            if path.stat().st_mtime > index_mtime:
                return True
        return False

    def _load_assets(self, manifest: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        assets_by_category: dict[str, list[dict[str, Any]]] = {}
        entries = manifest.get("entries", {})
        for category, rel_paths in entries.items():
            category_assets: list[dict[str, Any]] = []
            for rel_path in rel_paths:
                asset_path = self.pack_root / rel_path
                if not asset_path.exists():
                    raise KnowledgeBuildError(f"missing asset file: {asset_path}")
                asset = self._load_yaml(asset_path)
                self.validator.validate_asset(
                    asset,
                    category=category,
                    label=str(asset_path.relative_to(self.pack_root)),
                )
                category_assets.append(asset)
            assets_by_category[category] = category_assets
        return assets_by_category

    def _compile_index(
        self,
        manifest: dict[str, Any],
        assets_by_category: dict[str, list[dict[str, Any]]],
    ) -> dict[str, Any]:
        lookups = {
            "themes": {},
            "theme_healing": {},
            "theme_narrative": {},
            "rules": {},
            "elements": {},
            "circles": {},
        }

        for asset in assets_by_category.get("themes", []):
            payload = asset.get("payload", {})
            theme_id = payload.get("theme_id")
            if theme_id:
                lookups["themes"][theme_id] = payload

        for asset in assets_by_category.get("healing", []):
            payload = asset.get("payload", {})
            theme_id = payload.get("theme_id") or asset.get("id")
            lookups["theme_healing"][theme_id] = payload

        for asset in assets_by_category.get("narrative", []):
            payload = asset.get("payload", {})
            theme_id = payload.get("theme_id") or asset.get("id")
            lookups["theme_narrative"][theme_id] = payload

        for asset in assets_by_category.get("rules", []):
            lookups["rules"][asset.get("id", "")] = asset.get("payload", {})

        for asset in assets_by_category.get("elements", []):
            lookups["elements"][asset.get("id", "")] = asset.get("payload", {})

        for asset in assets_by_category.get("circles", []):
            lookups["circles"][asset.get("id", "")] = asset.get("payload", {})

        return {
            "schema_version": manifest.get("schema_version", "v2.1"),
            "pack_id": manifest.get("pack_id", "aimandala-v2.1"),
            "generated_at": datetime.now().isoformat(),
            "manifest": manifest,
            "assets": {
                category: {
                    asset.get("id", f"{category}:{index}"): asset
                    for index, asset in enumerate(category_assets)
                }
                for category, category_assets in assets_by_category.items()
            },
            "lookups": lookups,
            "stats": {
                "category_counts": {
                    category: len(category_assets)
                    for category, category_assets in assets_by_category.items()
                },
                "theme_ids": sorted(lookups["themes"].keys()),
                "toc_supported_imbalances": sorted(
                    [
                        imbalance_id
                        for imbalance_id, definition in (
                            lookups["rules"].get("rule.imbalance_types", {}).get("imbalances", {})
                        ).items()
                        if definition.get("toc_supported")
                    ]
                ),
            },
        }

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(payload, dict):
            raise KnowledgeBuildError(f"invalid yaml payload in {path}")
        return payload
