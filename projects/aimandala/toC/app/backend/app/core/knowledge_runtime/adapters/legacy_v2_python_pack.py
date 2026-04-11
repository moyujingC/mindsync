"""Export the legacy Python V2 knowledge modules into a v2.1 YAML pack."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from app.core.knowledge.color_meanings import (
    COLOR_ALIASES,
    COLOR_ELEMENT_MAPPING,
    COLOR_MEANINGS,
    SPECIAL_COLORS,
)
from app.core.knowledge.five_elements import (
    ELEMENT_PROPERTIES,
    FIVE_ELEMENTS,
    FIVE_ELEMENTS_RELATIONS,
    GENERATING_RELATIONS,
    GENERATION_BECOMES_RESTRAINT,
    OVER_RESTRAINING_RELATIONS,
    RESTRAINING_RELATIONS,
    REVERSE_RESTRAINING_RELATIONS,
)
from app.core.knowledge.imbalance_types import (
    IMBALANCE_CATEGORIES,
    IMBALANCE_TYPES,
    TOB_EXCLUSIVE_TYPES,
    TOC_IMBALANCE_TYPES,
)
from app.core.knowledge.themes import (
    HEALING_PRESCRIPTIONS,
    IMBALANCE_MAPPINGS,
    INSIGHT_TEMPLATES,
    THEME_COLOR_MEANINGS,
    THEME_CONFIGS,
    THEME_INTERACTIONS,
    get_pro_upgrade_teaser,
)
from app.core.knowledge.three_circles import (
    CIRCLE_COHERENCE_PATTERNS,
    CIRCLE_ENERGY_FLOW,
    ENERGY_FLOW_PATHS,
    ENERGY_FLOW_QUALITY,
    THREE_CIRCLES,
)


def _asset(
    *,
    asset_id: str,
    asset_type: str,
    payload: dict[str, Any],
    relations: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "id": asset_id,
        "type": asset_type,
        "version": "v2.1",
        "status": "active",
        "source": "legacy_v2_python",
        "review_status": "migrated",
        "payload": payload,
        "relations": relations or {},
    }


@dataclass
class LegacyV2PythonPackExporter:
    """One-time exporter from the current Python V2 knowledge modules."""

    pack_root: Path | None = None

    def __post_init__(self) -> None:
        if self.pack_root is None:
            self.pack_root = (
                Path(__file__).resolve().parents[6] / "data" / "knowledge" / "packs" / "v2.1"
            )

    def export(self) -> dict[str, Any]:
        assert self.pack_root is not None
        self._ensure_dirs()
        entries = self._write_assets()
        manifest = {
            "pack_id": "aimandala-v2.1",
            "schema_version": "v2.1",
            "status": "active",
            "source": "legacy_v2_python",
            "description": "Exported from current Python V2 knowledge modules for the v2.1 runtime",
            "entries": entries,
        }
        self._write_yaml(self.pack_root / "manifest.yaml", manifest)
        return {"pack_root": str(self.pack_root), "manifest": manifest}

    def _ensure_dirs(self) -> None:
        for category in ["elements", "circles", "themes", "rules", "healing", "narrative"]:
            (self.pack_root / category).mkdir(parents=True, exist_ok=True)

    def _write_assets(self) -> dict[str, list[str]]:
        entries: dict[str, list[str]] = {
            "elements": [],
            "circles": [],
            "themes": [],
            "rules": [],
            "healing": [],
            "narrative": [],
        }

        element_assets = {
            "elements/five_elements.yaml": _asset(
                asset_id="element.five_elements",
                asset_type="element",
                payload={
                    "five_elements": FIVE_ELEMENTS,
                    "element_properties": ELEMENT_PROPERTIES,
                    "relations": {
                        "five_elements_relations": FIVE_ELEMENTS_RELATIONS,
                        "generating_relations": GENERATING_RELATIONS,
                        "restraining_relations": RESTRAINING_RELATIONS,
                        "over_restraining_relations": OVER_RESTRAINING_RELATIONS,
                        "reverse_restraining_relations": REVERSE_RESTRAINING_RELATIONS,
                        "generation_becomes_restraint": GENERATION_BECOMES_RESTRAINT,
                    },
                },
            ),
            "elements/color_meanings.yaml": _asset(
                asset_id="element.color_meanings",
                asset_type="element",
                payload={
                    "color_meanings": COLOR_MEANINGS,
                    "color_aliases": COLOR_ALIASES,
                    "color_element_mapping": COLOR_ELEMENT_MAPPING,
                    "special_colors": SPECIAL_COLORS,
                },
            ),
        }
        for rel_path, payload in element_assets.items():
            self._write_yaml(self.pack_root / rel_path, payload)
            entries["elements"].append(rel_path)

        circle_asset = _asset(
            asset_id="circle.three_circles",
            asset_type="circle",
            payload={
                "three_circles": THREE_CIRCLES,
                "coherence_patterns": CIRCLE_COHERENCE_PATTERNS,
                "energy_flow": CIRCLE_ENERGY_FLOW,
                "energy_flow_paths": ENERGY_FLOW_PATHS,
                "energy_flow_quality": ENERGY_FLOW_QUALITY,
            },
        )
        self._write_yaml(self.pack_root / "circles/three_circles.yaml", circle_asset)
        entries["circles"].append("circles/three_circles.yaml")

        for theme_id in sorted(THEME_CONFIGS.keys()):
            theme_payload = {
                **THEME_CONFIGS.get(theme_id, {}),
                "theme_id": THEME_CONFIGS.get(theme_id, {}).get("theme_id", theme_id),
                "color_meanings": THEME_COLOR_MEANINGS.get(theme_id, {}),
                "interactions": THEME_INTERACTIONS.get(theme_id, {}),
                "imbalance_mappings": IMBALANCE_MAPPINGS.get(theme_id, {}),
            }
            theme_asset = _asset(
                asset_id=f"theme.{theme_id}",
                asset_type="theme",
                payload=theme_payload,
                relations={
                    "healing_asset": f"healing.{theme_id}",
                    "narrative_asset": f"narrative.{theme_id}",
                },
            )
            theme_rel_path = f"themes/{theme_id}.yaml"
            self._write_yaml(self.pack_root / theme_rel_path, theme_asset)
            entries["themes"].append(theme_rel_path)

            healing_asset = _asset(
                asset_id=f"healing.{theme_id}",
                asset_type="healing",
                payload={
                    "theme_id": theme_id,
                    "healing_prescriptions": HEALING_PRESCRIPTIONS.get(theme_id, {}),
                    "healing_template": THEME_CONFIGS.get(theme_id, {}).get("healing_template", {}),
                },
                relations={"theme": f"theme.{theme_id}"},
            )
            healing_rel_path = f"healing/{theme_id}.yaml"
            self._write_yaml(self.pack_root / healing_rel_path, healing_asset)
            entries["healing"].append(healing_rel_path)

            narrative_asset = _asset(
                asset_id=f"narrative.{theme_id}",
                asset_type="narrative",
                payload={
                    "theme_id": theme_id,
                    "insight_templates": INSIGHT_TEMPLATES.get(theme_id, {}),
                    "pro_upgrade_teaser": get_pro_upgrade_teaser(theme_id),
                },
                relations={"theme": f"theme.{theme_id}"},
            )
            narrative_rel_path = f"narrative/{theme_id}.yaml"
            self._write_yaml(self.pack_root / narrative_rel_path, narrative_asset)
            entries["narrative"].append(narrative_rel_path)

        rules_assets = {
            "rules/imbalance_types.yaml": _asset(
                asset_id="rule.imbalance_types",
                asset_type="rule",
                payload={
                    "imbalances": IMBALANCE_TYPES,
                    "toc_supported": TOC_IMBALANCE_TYPES,
                    "tob_exclusive": TOB_EXCLUSIVE_TYPES,
                    "categories": IMBALANCE_CATEGORIES,
                },
            ),
            "rules/theme_mappings.yaml": _asset(
                asset_id="rule.theme_mappings",
                asset_type="rule",
                payload={"mappings": IMBALANCE_MAPPINGS},
            ),
            "healing/templates.yaml": _asset(
                asset_id="healing.templates",
                asset_type="healing",
                payload={
                    "templates": {
                        "standard": {
                            "phases": ["觉察", "接纳", "转化", "巩固"],
                            "duration_days": 21,
                            "daily_practice": ["绘画", "书写", "冥想"],
                        },
                        "intensive": {
                            "phases": ["危机干预", "稳定化", "深度工作", "整合"],
                            "duration_days": 40,
                            "daily_practice": ["绘画", "书写", "冥想", "身体练习"],
                        },
                    }
                },
            ),
        }
        for rel_path, payload in rules_assets.items():
            self._write_yaml(self.pack_root / rel_path, payload)
            if rel_path.startswith("rules/"):
                entries["rules"].append(rel_path)
            else:
                entries["healing"].append(rel_path)

        entries["elements"].sort()
        entries["circles"].sort()
        entries["themes"].sort()
        entries["rules"].sort()
        entries["healing"].sort()
        entries["narrative"].sort()
        return entries

    def _write_yaml(self, path: Path, payload: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            yaml.safe_dump(
                payload,
                allow_unicode=True,
                sort_keys=False,
                default_flow_style=False,
            ),
            encoding="utf-8",
        )

