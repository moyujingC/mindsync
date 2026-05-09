"""Export a v2.2 YAML pack with theme assets projected from Markdown truth sources."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from app.core.knowledge.themes import get_pro_upgrade_teaser

from .legacy_v2_python_pack import LegacyV2PythonPackExporter


THEME_SOURCE_DIR = "projects/aimandala/docs/sources/知识库构建/主题知识"
THEME_SYMBOLS = (
    "THEME_CONFIG",
    "COLOR_MEANINGS",
    "INTERACTIONS",
    "INSIGHT_TEMPLATES",
    "IMBALANCE_MAPPINGS",
    "HEALING_PRESCRIPTIONS",
)


@dataclass(frozen=True)
class MarkdownThemeSource:
    """One parsed theme Markdown truth source."""

    path: Path
    relative_path: str
    symbols: dict[str, dict[str, Any]]

    @property
    def theme_id(self) -> str:
        theme_config = self.symbols["THEME_CONFIG"]
        theme_id = theme_config.get("theme_id")
        if not isinstance(theme_id, str) or not theme_id.strip():
            raise ValueError(f"{self.relative_path} missing THEME_CONFIG.theme_id")
        return theme_id


class MarkdownThemeSourceParser:
    """Parse the migrated V2 theme Markdown files into structured objects."""

    _SECTION_RE = re.compile(r"^## `(?P<symbol>[A-Z_]+)`\s*$", re.MULTILINE)

    def __init__(self, *, source_dir: Path) -> None:
        self.source_dir = source_dir

    def parse_all(self) -> list[MarkdownThemeSource]:
        sources = [self.parse(path) for path in sorted(self.source_dir.glob("*.md"))]
        if not sources:
            raise ValueError(f"no theme Markdown sources found in {self.source_dir}")
        return sources

    def parse(self, path: Path) -> MarkdownThemeSource:
        text = path.read_text(encoding="utf-8")
        relative_path = self._to_repo_relative_path(path)
        symbols = {symbol: self._extract_symbol(text, symbol, relative_path) for symbol in THEME_SYMBOLS}
        return MarkdownThemeSource(
            path=path,
            relative_path=relative_path,
            symbols=symbols,
        )

    def _extract_symbol(self, text: str, symbol: str, relative_path: str) -> dict[str, Any]:
        section_match = re.search(rf"^## `{re.escape(symbol)}`\s*$", text, flags=re.MULTILINE)
        if section_match is None:
            raise ValueError(f"{relative_path} missing section ## `{symbol}`")

        section_start = section_match.end()
        next_section = self._SECTION_RE.search(text, section_start)
        section = text[section_start : next_section.start() if next_section else len(text)]
        json_match = re.search(r"```json\s*(?P<body>.*?)\s*```", section, flags=re.DOTALL)
        if json_match is None:
            return {}

        payload = json.loads(json_match.group("body"))
        if not isinstance(payload, dict):
            raise ValueError(f"{relative_path} section {symbol} must contain a JSON object")
        return payload

    def _to_repo_relative_path(self, path: Path) -> str:
        resolved = path.resolve()
        for parent in [resolved, *resolved.parents]:
            if parent.name == "mindsync":
                return str(resolved.relative_to(parent))
        return str(path)


@dataclass
class MarkdownThemePackV22Exporter:
    """Build v2.2 by reusing v2.1 compatible assets and replacing theme assets."""

    pack_root: Path | None = None
    theme_source_dir: Path | None = None

    def __post_init__(self) -> None:
        toc_root = Path(__file__).resolve().parents[6]
        project_root = toc_root.parent
        if self.pack_root is None:
            self.pack_root = toc_root / "data" / "knowledge" / "packs" / "v2.2"
        if self.theme_source_dir is None:
            self.theme_source_dir = project_root / "docs" / "sources" / "知识库构建" / "主题知识"

    def export(self) -> dict[str, Any]:
        assert self.pack_root is not None
        assert self.theme_source_dir is not None

        base_exporter = LegacyV2PythonPackExporter(pack_root=self.pack_root)
        base_exporter.export()

        theme_sources = MarkdownThemeSourceParser(source_dir=self.theme_source_dir).parse_all()
        self._write_theme_assets(theme_sources)
        self._upgrade_asset_versions()

        manifest = self._load_yaml(self.pack_root / "manifest.yaml")
        manifest.update(
            {
                "pack_id": "aimandala-v2.2",
                "schema_version": "v2.2",
                "status": "candidate",
                "source": "markdown_theme_truth_sources",
                "description": (
                    "Candidate runtime projection: theme/healing/narrative assets are "
                    "projected from Markdown truth sources; non-theme assets keep the "
                    "v2.1-compatible runtime shape."
                ),
                "truth_sources": {
                    "themes": THEME_SOURCE_DIR,
                    "non_theme_assets": "legacy_v2_python_runtime_projection",
                },
            }
        )
        self._write_yaml(self.pack_root / "manifest.yaml", manifest)
        return {
            "pack_root": str(self.pack_root),
            "theme_source_dir": str(self.theme_source_dir),
            "theme_count": len(theme_sources),
            "manifest": manifest,
        }

    def _write_theme_assets(self, theme_sources: list[MarkdownThemeSource]) -> None:
        assert self.pack_root is not None
        seen_theme_ids: set[str] = set()
        for source in theme_sources:
            theme_id = source.theme_id
            if theme_id in seen_theme_ids:
                raise ValueError(f"duplicate theme_id in Markdown sources: {theme_id}")
            seen_theme_ids.add(theme_id)

            source_meta = {
                "source_markdown": source.relative_path,
                "source_symbols": list(THEME_SYMBOLS),
            }
            theme_config = source.symbols["THEME_CONFIG"]
            theme_payload = {
                **theme_config,
                "theme_id": theme_config.get("theme_id", theme_id),
                "color_meanings": source.symbols["COLOR_MEANINGS"],
                "interactions": source.symbols["INTERACTIONS"],
                "imbalance_mappings": source.symbols["IMBALANCE_MAPPINGS"],
            }
            self._write_yaml(
                self.pack_root / "themes" / f"{theme_id}.yaml",
                self._asset(
                    asset_id=f"theme.{theme_id}",
                    asset_type="theme",
                    payload=theme_payload,
                    relations={
                        **source_meta,
                        "healing_asset": f"healing.{theme_id}",
                        "narrative_asset": f"narrative.{theme_id}",
                    },
                ),
            )

            self._write_yaml(
                self.pack_root / "healing" / f"{theme_id}.yaml",
                self._asset(
                    asset_id=f"healing.{theme_id}",
                    asset_type="healing",
                    payload={
                        "theme_id": theme_id,
                        "healing_prescriptions": source.symbols["HEALING_PRESCRIPTIONS"],
                        "healing_template": theme_config.get("healing_template", {}),
                    },
                    relations={**source_meta, "theme": f"theme.{theme_id}"},
                ),
            )

            self._write_yaml(
                self.pack_root / "narrative" / f"{theme_id}.yaml",
                self._asset(
                    asset_id=f"narrative.{theme_id}",
                    asset_type="narrative",
                    payload={
                        "theme_id": theme_id,
                        "insight_templates": source.symbols["INSIGHT_TEMPLATES"],
                        "pro_upgrade_teaser": get_pro_upgrade_teaser(theme_id),
                    },
                    relations={**source_meta, "theme": f"theme.{theme_id}"},
                ),
            )

    def _upgrade_asset_versions(self) -> None:
        assert self.pack_root is not None
        for path in self.pack_root.rglob("*.yaml"):
            if path.name == "manifest.yaml":
                continue
            payload = self._load_yaml(path)
            if isinstance(payload, dict) and "version" in payload:
                payload["version"] = "v2.2"
                self._write_yaml(path, payload)

    def _asset(
        self,
        *,
        asset_id: str,
        asset_type: str,
        payload: dict[str, Any],
        relations: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "id": asset_id,
            "type": asset_type,
            "version": "v2.2",
            "status": "active",
            "source": "markdown_truth_source",
            "review_status": "projected",
            "payload": payload,
            "relations": relations,
        }

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        payload = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError(f"{path} must contain a YAML object")
        return payload

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
