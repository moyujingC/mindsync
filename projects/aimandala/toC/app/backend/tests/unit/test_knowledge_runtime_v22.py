"""Tests for the v2.2 Markdown-projected knowledge runtime candidate pack."""

import json
import os
import sys
from pathlib import Path

import yaml

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.knowledge_runtime.adapters.markdown_theme_pack_v22 import (  # noqa: E402
    MarkdownThemePackV22Exporter,
    MarkdownThemeSourceParser,
)
from app.core.knowledge_runtime.compiler import KnowledgePackCompiler  # noqa: E402
from app.core.knowledge_runtime.paths import resolve_knowledge_toc_root  # noqa: E402
from app.core.knowledge_runtime.validators import KnowledgePackValidator  # noqa: E402

PROJECT_ROOT = Path(__file__).resolve().parents[5]
THEME_SOURCE_DIR = PROJECT_ROOT / "docs" / "sources" / "知识库构建" / "主题知识"


def test_v22_markdown_theme_parser_reads_all_theme_truth_sources():
    sources = MarkdownThemeSourceParser(source_dir=THEME_SOURCE_DIR).parse_all()

    theme_ids = sorted(source.theme_id for source in sources)
    assert theme_ids == [
        "father_relationship",
        "general",
        "health_wellness",
        "intimate_relationship",
        "mother_relationship",
        "parent_child_relationship",
        "personal_growth",
        "wealth_career",
    ]

    father = next(source for source in sources if source.theme_id == "father_relationship")
    assert father.symbols["THEME_CONFIG"]["theme_name_cn"] == "与父亲的关系"
    assert "权威恐惧与自我价值" in father.symbols["THEME_CONFIG"]["core_issues"]
    assert "木" in father.symbols["COLOR_MEANINGS"]
    assert "水多火灭" in father.symbols["IMBALANCE_MAPPINGS"]
    assert "issue_types" in father.symbols["HEALING_PRESCRIPTIONS"]


def test_v22_exporter_projects_markdown_themes_and_compiles_candidate(tmp_path):
    pack_root = tmp_path / "packs" / "v2.2"
    build_dir = tmp_path / "builds" / "candidates" / "v2.2-theme-md"

    exporter = MarkdownThemePackV22Exporter(
        pack_root=pack_root,
        theme_source_dir=THEME_SOURCE_DIR,
    )
    export_result = exporter.export()

    compiler = KnowledgePackCompiler(
        pack_root=pack_root,
        build_dir=build_dir,
        validator=KnowledgePackValidator(),
    )
    index_path = compiler.build()

    assert export_result["theme_count"] == 8
    manifest = yaml.safe_load((pack_root / "manifest.yaml").read_text(encoding="utf-8"))
    assert manifest["pack_id"] == "aimandala-v2.2"
    assert manifest["schema_version"] == "v2.2"
    assert manifest["source"] == "markdown_theme_truth_sources"

    father_theme = yaml.safe_load(
        (pack_root / "themes" / "father_relationship.yaml").read_text(encoding="utf-8")
    )
    assert father_theme["version"] == "v2.2"
    assert father_theme["source"] == "markdown_truth_source"
    assert father_theme["payload"]["theme_name_cn"] == "与父亲的关系"
    assert "权威恐惧与自我价值" in father_theme["payload"]["core_issues"]
    assert father_theme["relations"]["source_markdown"].endswith("主题知识/父亲关系.md")

    father_healing = yaml.safe_load(
        (pack_root / "healing" / "father_relationship.yaml").read_text(encoding="utf-8")
    )
    assert father_healing["payload"]["healing_prescriptions"]["issue_types"]

    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["schema_version"] == "v2.2"
    assert index["pack_id"] == "aimandala-v2.2"
    assert index["lookups"]["themes"]["father_relationship"]["theme_name_cn"] == "与父亲的关系"
    assert index["stats"]["category_counts"]["themes"] == 8
    assert not any(
        item["kind"] in {"healing_issue_mapping_gap", "healing_issue_target_missing"}
        for item in index["stats"]["quality"]["fallback_hotspots"]
    )


def test_v22_script_paths_are_candidate_only():
    toc_root = resolve_knowledge_toc_root(__file__)

    assert (toc_root / "data" / "knowledge" / "packs" / "v2.2").name == "v2.2"
    assert (
        toc_root / "data" / "knowledge" / "builds" / "candidates" / "v2.2-theme-md"
    ).parent.name == "candidates"
