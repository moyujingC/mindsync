#!/usr/bin/env python3
"""Validate Aimandala fixture manifest and descriptor files.

This script intentionally uses a tiny YAML-like parser so it can run in the
current repo without adding a PyYAML dependency.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "fixtures" / "manifest.yaml"


@dataclass
class ManifestEntry:
    fixture_id: str
    path: str
    scope: str | None
    kind: str | None


def _read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def parse_manifest(path: Path) -> list[ManifestEntry]:
    entries: list[ManifestEntry] = []
    current: dict[str, str | None] | None = None

    for raw_line in _read_lines(path):
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped == "fixtures:":
            continue

        if stripped.startswith("- id:"):
            if current is not None:
                entries.append(
                    ManifestEntry(
                        fixture_id=str(current.get("id") or ""),
                        path=str(current.get("path") or ""),
                        scope=current.get("scope"),
                        kind=current.get("kind"),
                    )
                )
            current = {"id": stripped.split(":", 1)[1].strip()}
            continue

        if current is None:
            continue

        if ":" not in stripped:
            continue

        key, value = stripped.split(":", 1)
        value = value.strip()
        if key == "purpose":
            continue
        if key in {"path", "scope", "kind"}:
            current[key] = value

    if current is not None:
        entries.append(
            ManifestEntry(
                fixture_id=str(current.get("id") or ""),
                path=str(current.get("path") or ""),
                scope=current.get("scope"),
                kind=current.get("kind"),
            )
        )

    return entries


def parse_descriptor(path: Path) -> dict[str, object]:
    data: dict[str, object] = {}
    current_list_key: str | None = None
    current_block_key: str | None = None
    current_block: dict[str, str] | None = None

    for raw_line in _read_lines(path):
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        indent = len(line) - len(line.lstrip(" "))

        if stripped.startswith("- "):
            item = stripped[2:].strip()
            if current_list_key is None:
                continue
            data.setdefault(current_list_key, [])
            assert isinstance(data[current_list_key], list)
            data[current_list_key].append(item)
            continue

        if ":" not in stripped:
            continue

        key, value = stripped.split(":", 1)
        key = key.strip()
        value = value.strip()

        if indent == 0:
            current_list_key = None
            current_block_key = None
            current_block = None

            if value:
                data[key] = value
            else:
                if key in {"coverage", "expected_observations", "review_entrypoints"}:
                    data[key] = []
                    current_list_key = key
                else:
                    block: dict[str, str] = {}
                    data[key] = block
                    current_block_key = key
                    current_block = block
            continue

        if current_block_key and current_block is not None and value:
            current_block[key] = value

    return data


def validate() -> list[str]:
    errors: list[str] = []

    if not MANIFEST_PATH.exists():
        return [f"missing manifest: {MANIFEST_PATH}"]

    entries = parse_manifest(MANIFEST_PATH)
    if not entries:
        return [f"manifest has no fixture entries: {MANIFEST_PATH}"]

    seen_ids: set[str] = set()
    for entry in entries:
        if not entry.fixture_id:
            errors.append("manifest entry missing id")
            continue
        if entry.fixture_id in seen_ids:
            errors.append(f"duplicate fixture id: {entry.fixture_id}")
        seen_ids.add(entry.fixture_id)

        if not entry.path:
            errors.append(f"{entry.fixture_id}: missing path in manifest")
            continue

        descriptor_path = Path(entry.path)
        if not descriptor_path.exists():
            errors.append(f"{entry.fixture_id}: descriptor missing at {descriptor_path}")
            continue

        descriptor = parse_descriptor(descriptor_path)
        if descriptor.get("id") != entry.fixture_id:
            errors.append(
                f"{entry.fixture_id}: descriptor id mismatch ({descriptor.get('id')})"
            )

        if entry.kind and descriptor.get("fixture_type") != entry.kind:
            errors.append(
                f"{entry.fixture_id}: fixture_type {descriptor.get('fixture_type')} "
                f"!= manifest kind {entry.kind}"
            )

        required_scalar_keys = ["status", "owner", "scope", "theme", "fixture_type"]
        for key in required_scalar_keys:
            if not descriptor.get(key):
                errors.append(f"{entry.fixture_id}: missing required key `{key}`")

        for key in ["coverage", "expected_observations", "review_entrypoints"]:
            value = descriptor.get(key)
            if not isinstance(value, list) or len(value) == 0:
                errors.append(f"{entry.fixture_id}: `{key}` must be a non-empty list")

        asset_ref = descriptor.get("asset_ref")
        if not isinstance(asset_ref, dict) or not asset_ref.get("kind"):
            errors.append(f"{entry.fixture_id}: asset_ref.kind is required")

    return errors


def main() -> int:
    errors = validate()
    if errors:
      print("fixture validation failed:")
      for error in errors:
          print(f"- {error}")
      return 1

    print(f"fixture validation passed: {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
