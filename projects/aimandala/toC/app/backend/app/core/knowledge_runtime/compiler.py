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

        quality_stats = self._build_quality_stats(lookups)

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
                "quality": quality_stats,
            },
        }

    def _build_quality_stats(self, lookups: dict[str, Any]) -> dict[str, Any]:
        theme_ids = sorted(lookups["themes"].keys())
        theme_healing = lookups["theme_healing"]
        theme_narrative = lookups["theme_narrative"]
        imbalance_definitions = (
            lookups["rules"].get("rule.imbalance_types", {}).get("imbalances", {})
        )
        healing_issue_mappings = (
            lookups["rules"].get("rule.healing_issue_mappings", {}).get("mappings", {})
        )
        toc_supported_imbalances = sorted(
            imbalance_id
            for imbalance_id, definition in imbalance_definitions.items()
            if definition.get("toc_supported")
        )
        theme_mappings = lookups["rules"].get("rule.theme_mappings", {}).get("mappings", {})

        theme_asset_coverage: dict[str, dict[str, Any]] = {}
        theme_mapping_coverage: dict[str, dict[str, Any]] = {}
        healing_lookup_coverage: dict[str, dict[str, Any]] = {}
        fallback_hotspots: list[dict[str, Any]] = []

        for theme_id in theme_ids:
            has_healing = theme_id in theme_healing
            has_narrative = theme_id in theme_narrative
            theme_asset_coverage[theme_id] = {
                "has_healing": has_healing,
                "has_narrative": has_narrative,
            }

            if not has_healing:
                fallback_hotspots.append(
                    {
                        "kind": "missing_healing_asset",
                        "theme_id": theme_id,
                        "severity": "high",
                    }
                )
            if not has_narrative:
                fallback_hotspots.append(
                    {
                        "kind": "missing_narrative_asset",
                        "theme_id": theme_id,
                        "severity": "high",
                    }
                )

            theme_mapping = theme_mappings.get(theme_id, {})
            missing_supported = [
                imbalance_id
                for imbalance_id in toc_supported_imbalances
                if imbalance_id not in theme_mapping
            ]
            theme_mapping_coverage[theme_id] = {
                "mapped_count": len(toc_supported_imbalances) - len(missing_supported),
                "toc_supported_total": len(toc_supported_imbalances),
                "missing": missing_supported,
            }
            if missing_supported:
                fallback_hotspots.append(
                    {
                        "kind": "theme_mapping_gap",
                        "theme_id": theme_id,
                        "severity": "high",
                        "missing_count": len(missing_supported),
                        "missing_sample": missing_supported[:3],
                    }
                )

            issue_types = set(
                (
                    theme_healing.get(theme_id, {})
                    .get("healing_prescriptions", {})
                    .get("issue_types", {})
                ).keys()
            )
            healing_issue_mapping = healing_issue_mappings.get(theme_id, {})
            missing_healing_mappings = [
                imbalance_id
                for imbalance_id in toc_supported_imbalances
                if imbalance_id not in healing_issue_mapping
            ]
            invalid_issue_targets = []
            for imbalance_id, mapping in healing_issue_mapping.items():
                issue_type = mapping.get("issue_type") if isinstance(mapping, dict) else None
                if issue_type not in issue_types:
                    invalid_issue_targets.append(
                        {
                            "imbalance_id": imbalance_id,
                            "issue_type": issue_type or "",
                        }
                    )
            healing_lookup_coverage[theme_id] = {
                "mapped_count": len(toc_supported_imbalances) - len(missing_healing_mappings),
                "toc_supported_total": len(toc_supported_imbalances),
                "missing_mapping_sample": missing_healing_mappings[:3],
                "invalid_issue_targets": invalid_issue_targets[:3],
                "fallback_risk": (
                    "high"
                    if missing_healing_mappings or invalid_issue_targets
                    else "low"
                ),
            }
            if missing_healing_mappings:
                fallback_hotspots.append(
                    {
                        "kind": "healing_issue_mapping_gap",
                        "theme_id": theme_id,
                        "severity": "high",
                        "missing_count": len(missing_healing_mappings),
                        "toc_supported_total": len(toc_supported_imbalances),
                        "missing_issue_sample": healing_lookup_coverage[theme_id][
                            "missing_mapping_sample"
                        ],
                    }
                )
            if invalid_issue_targets:
                fallback_hotspots.append(
                    {
                        "kind": "healing_issue_target_missing",
                        "theme_id": theme_id,
                        "severity": "high",
                        "missing_count": len(invalid_issue_targets),
                        "invalid_issue_sample": invalid_issue_targets[:3],
                    }
                )

        high_risk_warning_paths = []
        for imbalance_id, definition in imbalance_definitions.items():
            warning = str(definition.get("warning") or "").strip()
            if not warning:
                continue
            mapped_themes = sorted(
                theme_id
                for theme_id in theme_ids
                if imbalance_id in theme_mappings.get(theme_id, {})
            )
            high_risk_warning_paths.append(
                {
                    "imbalance_id": imbalance_id,
                    "warning": warning,
                    "toc_supported": bool(definition.get("toc_supported")),
                    "mapped_theme_count": len(mapped_themes),
                    "mapped_theme_sample": mapped_themes[:3],
                }
            )

        return {
            "theme_asset_coverage": theme_asset_coverage,
            "theme_mapping_coverage": theme_mapping_coverage,
            "healing_lookup_coverage": healing_lookup_coverage,
            "high_risk_warning_paths": high_risk_warning_paths,
            "fallback_hotspots": fallback_hotspots,
        }

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(payload, dict):
            raise KnowledgeBuildError(f"invalid yaml payload in {path}")
        return payload
