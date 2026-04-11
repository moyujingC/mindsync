"""Build and drift checks for the v2.1 knowledge pack."""

from __future__ import annotations

import filecmp
import json
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from .adapters.legacy_v2_python_pack import LegacyV2PythonPackExporter
from .compiler import KnowledgePackCompiler
from .validators import KnowledgePackValidator


@dataclass
class KnowledgeDriftReport:
    """Comparison result between committed assets and freshly exported assets."""

    ok: bool
    differences: list[str] = field(default_factory=list)
    checked_paths: list[str] = field(default_factory=list)


def check_knowledge_pack_v21(
    *,
    expected_pack_root: Path | None = None,
    expected_build_dir: Path | None = None,
) -> KnowledgeDriftReport:
    """Check that committed YAML pack and JSON build match a fresh export."""

    toc_root = Path(__file__).resolve().parents[5]
    expected_pack_root = expected_pack_root or (
        toc_root / "data" / "knowledge" / "packs" / "v2.1"
    )
    expected_build_dir = expected_build_dir or (
        toc_root / "data" / "knowledge" / "builds" / "current"
    )

    with tempfile.TemporaryDirectory(prefix="aimandala-kb-check-") as tmp_dir:
        temp_root = Path(tmp_dir)
        temp_pack_root = temp_root / "packs" / "v2.1"
        temp_build_dir = temp_root / "builds" / "current"

        exporter = LegacyV2PythonPackExporter(pack_root=temp_pack_root)
        exporter.export()
        compiler = KnowledgePackCompiler(
            pack_root=temp_pack_root,
            build_dir=temp_build_dir,
            validator=KnowledgePackValidator(),
        )
        compiler.build()

        differences: list[str] = []
        checked_paths = [
            str(expected_pack_root),
            str(expected_build_dir / "index.json"),
        ]
        differences.extend(_compare_dirs(expected_pack_root, temp_pack_root))
        differences.extend(
            _compare_files(
                expected_build_dir / "index.json",
                temp_build_dir / "index.json",
            )
        )
        return KnowledgeDriftReport(
            ok=len(differences) == 0,
            differences=differences,
            checked_paths=checked_paths,
        )


def _compare_dirs(expected: Path, actual: Path) -> list[str]:
    differences: list[str] = []
    comparison = filecmp.dircmp(expected, actual)
    differences.extend(
        f"missing committed asset: {expected / name}" for name in comparison.right_only
    )
    differences.extend(
        f"unexpected committed asset: {expected / name}" for name in comparison.left_only
    )
    for name in comparison.diff_files:
        differences.append(f"asset drift: {expected / name}")
    for subdir in comparison.common_dirs:
        differences.extend(_compare_dirs(expected / subdir, actual / subdir))
    return differences


def _compare_files(expected: Path, actual: Path) -> list[str]:
    if not expected.exists():
        return [f"missing committed build artifact: {expected}"]
    if not actual.exists():
        return [f"missing generated build artifact: {actual}"]
    if expected.suffix == ".json" and actual.suffix == ".json":
        expected_payload = json.loads(expected.read_text(encoding="utf-8"))
        actual_payload = json.loads(actual.read_text(encoding="utf-8"))
        _strip_volatile_fields(expected_payload)
        _strip_volatile_fields(actual_payload)
        if expected_payload != actual_payload:
            return [f"build artifact drift: {expected}"]
        return []
    if expected.read_text(encoding="utf-8") != actual.read_text(encoding="utf-8"):
        return [f"build artifact drift: {expected}"]
    return []


def _strip_volatile_fields(payload: dict) -> None:
    payload.pop("generated_at", None)
