"""Validation helpers for v2.1 knowledge packs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import jsonschema


class KnowledgeValidationError(ValueError):
    """Raised when a knowledge pack or asset fails validation."""


class KnowledgePackValidator:
    """Validate manifest and asset files with JSON Schema plus cross checks."""

    def __init__(self, schema_dir: Path | None = None) -> None:
        self.schema_dir = schema_dir or (
            Path(__file__).resolve().parents[5] / "domain" / "knowledge" / "schemas"
        )
        self._schema_cache: dict[str, dict[str, Any]] = {}

    def validate_manifest(self, manifest: dict[str, Any]) -> None:
        self._validate_against_schema(
            manifest,
            schema_name="knowledge_pack.schema.json",
            label="manifest",
        )

    def validate_asset(self, asset: dict[str, Any], *, category: str, label: str) -> None:
        self._validate_against_schema(
            asset,
            schema_name="asset.schema.json",
            label=label,
        )
        if category == "themes":
            self._validate_against_schema(
                asset,
                schema_name="theme.schema.json",
                label=label,
            )
        if category == "rules":
            self._validate_against_schema(
                asset,
                schema_name="rule.schema.json",
                label=label,
            )

    def validate_references(
        self,
        manifest: dict[str, Any],
        assets_by_category: dict[str, list[dict[str, Any]]],
    ) -> None:
        theme_ids = {
            asset.get("payload", {}).get("theme_id")
            for asset in assets_by_category.get("themes", [])
            if isinstance(asset.get("payload"), dict)
        }
        theme_ids.discard(None)
        healing_theme_ids = {
            asset.get("payload", {}).get("theme_id")
            for asset in assets_by_category.get("healing", [])
            if isinstance(asset.get("payload"), dict)
        }
        healing_theme_ids.discard(None)
        healing_issue_types_by_theme = {
            asset.get("payload", {}).get("theme_id"): set(
                (
                    asset.get("payload", {})
                    .get("healing_prescriptions", {})
                    .get("issue_types", {})
                    or {}
                ).keys()
            )
            for asset in assets_by_category.get("healing", [])
            if isinstance(asset.get("payload"), dict)
            and asset.get("payload", {}).get("theme_id")
        }
        narrative_theme_ids = {
            asset.get("payload", {}).get("theme_id")
            for asset in assets_by_category.get("narrative", [])
            if isinstance(asset.get("payload"), dict)
        }
        narrative_theme_ids.discard(None)

        imbalance_ids = set()
        toc_supported_imbalance_ids = set()
        warning_imbalance_ids = set()
        healing_issue_mappings: dict[str, dict[str, Any]] = {}
        for asset in assets_by_category.get("rules", []):
            payload = asset.get("payload", {})
            if not isinstance(payload, dict):
                continue
            if asset.get("id") == "rule.imbalance_types":
                imbalances = payload.get("imbalances") or {}
                imbalance_ids.update(imbalances.keys())
                toc_supported_imbalance_ids.update(
                    imbalance_id
                    for imbalance_id, definition in imbalances.items()
                    if definition.get("toc_supported")
                )
                warning_imbalance_ids.update(
                    imbalance_id
                    for imbalance_id, definition in imbalances.items()
                    if definition.get("warning")
                )
            if asset.get("id") == "rule.healing_issue_mappings":
                healing_issue_mappings = payload.get("mappings", {})

        missing_healing = sorted(theme_ids - healing_theme_ids)
        if missing_healing:
            raise KnowledgeValidationError(
                "themes missing healing assets: " + ", ".join(missing_healing)
            )

        missing_narrative = sorted(theme_ids - narrative_theme_ids)
        if missing_narrative:
            raise KnowledgeValidationError(
                "themes missing narrative assets: " + ", ".join(missing_narrative)
            )

        if not warning_imbalance_ids:
            raise KnowledgeValidationError(
                "rule.imbalance_types must include at least one high-risk warning path"
            )
        if not healing_issue_mappings:
            raise KnowledgeValidationError("rule.healing_issue_mappings is required")

        for asset in assets_by_category.get("healing", []):
            payload = asset.get("payload", {})
            theme_id = payload.get("theme_id")
            if theme_id and theme_id not in theme_ids:
                raise KnowledgeValidationError(
                    f"healing asset {asset.get('id')} references unknown theme {theme_id}"
                )

        for asset in assets_by_category.get("narrative", []):
            payload = asset.get("payload", {})
            theme_id = payload.get("theme_id")
            if theme_id and theme_id not in theme_ids:
                raise KnowledgeValidationError(
                    f"narrative asset {asset.get('id')} references unknown theme {theme_id}"
                )

        for asset in assets_by_category.get("rules", []):
            if asset.get("id") != "rule.theme_mappings":
                continue
            mappings = asset.get("payload", {}).get("mappings", {})
            for theme_id in theme_ids:
                if theme_id not in mappings:
                    raise KnowledgeValidationError(
                        f"rule.theme_mappings missing theme entry for {theme_id}"
                    )
            for theme_id, theme_mapping in mappings.items():
                if theme_id not in theme_ids:
                    raise KnowledgeValidationError(
                        f"rule.theme_mappings references unknown theme {theme_id}"
                    )
                for imbalance_id in theme_mapping.keys():
                    if imbalance_id not in imbalance_ids:
                        raise KnowledgeValidationError(
                            f"rule.theme_mappings references unknown imbalance {imbalance_id}"
                        )
                missing_supported = sorted(
                    toc_supported_imbalance_ids - set(theme_mapping.keys())
                )
                if missing_supported:
                    raise KnowledgeValidationError(
                        "rule.theme_mappings missing toc-supported imbalances for "
                        f"{theme_id}: {', '.join(missing_supported)}"
                    )

        for theme_id in theme_ids:
            theme_issue_mappings = healing_issue_mappings.get(theme_id)
            if theme_issue_mappings is None:
                raise KnowledgeValidationError(
                    f"rule.healing_issue_mappings missing theme entry for {theme_id}"
                )
            if not isinstance(theme_issue_mappings, dict):
                raise KnowledgeValidationError(
                    f"rule.healing_issue_mappings entry for {theme_id} must be an object"
                )

            missing_supported = sorted(
                toc_supported_imbalance_ids - set(theme_issue_mappings.keys())
            )
            if missing_supported:
                raise KnowledgeValidationError(
                    "rule.healing_issue_mappings missing toc-supported imbalances for "
                    f"{theme_id}: {', '.join(missing_supported)}"
                )

            known_issue_types = healing_issue_types_by_theme.get(theme_id, set())
            for imbalance_id, mapping in theme_issue_mappings.items():
                if imbalance_id not in imbalance_ids:
                    raise KnowledgeValidationError(
                        "rule.healing_issue_mappings references unknown imbalance "
                        f"{imbalance_id}"
                    )
                if not isinstance(mapping, dict):
                    raise KnowledgeValidationError(
                        "rule.healing_issue_mappings entry for "
                        f"{theme_id}:{imbalance_id} must be an object"
                    )
                issue_type = mapping.get("issue_type")
                if not isinstance(issue_type, str) or not issue_type.strip():
                    raise KnowledgeValidationError(
                        "rule.healing_issue_mappings entry for "
                        f"{theme_id}:{imbalance_id} must include issue_type"
                    )
                if issue_type not in known_issue_types:
                    raise KnowledgeValidationError(
                        "rule.healing_issue_mappings references unknown issue_type "
                        f"{issue_type} for theme {theme_id}"
                    )

        declared_entries = manifest.get("entries", {})
        for category, assets in assets_by_category.items():
            declared_count = len(declared_entries.get(category, []))
            if declared_count != len(assets):
                raise KnowledgeValidationError(
                    f"manifest entry count mismatch for {category}: declared={declared_count}, loaded={len(assets)}"
                )

    def _validate_against_schema(
        self,
        payload: dict[str, Any],
        *,
        schema_name: str,
        label: str,
    ) -> None:
        schema = self._load_schema(schema_name)
        validator = jsonschema.Draft202012Validator(schema)
        errors = sorted(validator.iter_errors(payload), key=lambda item: list(item.absolute_path))
        if not errors:
            return
        message = "; ".join(error.message for error in errors[:5])
        raise KnowledgeValidationError(f"{label} failed {schema_name}: {message}")

    def _load_schema(self, schema_name: str) -> dict[str, Any]:
        if schema_name not in self._schema_cache:
            schema_path = self.schema_dir / schema_name
            self._schema_cache[schema_name] = json.loads(
                schema_path.read_text(encoding="utf-8")
            )
        return self._schema_cache[schema_name]
