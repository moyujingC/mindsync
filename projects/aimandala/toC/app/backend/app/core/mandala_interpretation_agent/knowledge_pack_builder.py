"""Build a compact knowledge pack for the mandala interpretation agent."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


BACKEND_ROOT = Path(__file__).resolve().parents[3]
AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
METHOD_SOURCE = (
    AIMANDALA_ROOT
    / "docs"
    / "sources"
    / "知识库构建"
    / "三圈五行流派解读方法与步骤.md"
)
KNOWLEDGE_PACK_ROOT = AIMANDALA_ROOT / "toC" / "data" / "knowledge" / "packs" / "v2.2"


class KnowledgePackBuilder:
    """Create a small task-scoped knowledge pack without embedding full Markdown sources."""

    def __init__(self, *, pack_root: Path | None = None, method_source: Path | None = None) -> None:
        self.pack_root = pack_root or KNOWLEDGE_PACK_ROOT
        self.method_source = method_source or METHOD_SOURCE

    def build(self, *, theme: str = "general") -> dict[str, Any]:
        normalized_theme = theme.strip() or "general"
        return {
            "pack_id": "mandala-interpretation-agent-v1-compact",
            "method_source": self._relative_or_string(self.method_source),
            "runtime_pack_root": self._relative_or_string(self.pack_root),
            "theme": normalized_theme,
            "entries": {
                "circles": self._read_yaml_text("circles/three_circles.yaml", max_chars=3600),
                "five_elements": self._read_yaml_text("elements/five_elements.yaml", max_chars=2600),
                "color_meanings": self._read_yaml_text("elements/color_meanings.yaml", max_chars=3000),
                "direct_judgments": self._read_yaml_text("rules/direct_judgments.yaml", max_chars=2800),
                "imbalance_types": self._read_yaml_text("rules/imbalance_types.yaml", max_chars=2800),
                "theme": self._read_yaml_text(f"themes/{normalized_theme}.yaml", max_chars=2400),
                "healing": self._read_yaml_text(f"healing/{normalized_theme}.yaml", max_chars=2200),
                "narrative": self._read_yaml_text(f"narrative/{normalized_theme}.yaml", max_chars=2200),
            },
            "forbidden_inputs": [
                "full_markdown_truth_sources",
                "full_theme_knowledge_documents",
                "raw_legacy_container",
                "old_report_skeleton",
                "old_report_plan",
                "private_env_or_api_keys",
            ],
        }

    def _read_yaml_text(self, relative_path: str, *, max_chars: int) -> dict[str, Any]:
        path = self.pack_root / relative_path
        if not path.exists():
            return {"path": relative_path, "status": "missing", "text": ""}
        text = path.read_text(encoding="utf-8")
        clipped = text[:max_chars]
        return {
            "path": relative_path,
            "status": "loaded",
            "char_count": len(text),
            "truncated": len(text) > len(clipped),
            "text": clipped,
        }

    def _relative_or_string(self, path: Path) -> str:
        try:
            return str(path.relative_to(AIMANDALA_ROOT.parent.parent))
        except ValueError:
            return str(path)


def knowledge_pack_to_prompt_fragment(knowledge_pack: dict[str, Any]) -> str:
    safe_payload = {
        "pack_id": knowledge_pack.get("pack_id"),
        "method_source": knowledge_pack.get("method_source"),
        "theme": knowledge_pack.get("theme"),
        "entries": knowledge_pack.get("entries", {}),
        "forbidden_inputs": knowledge_pack.get("forbidden_inputs", []),
    }
    return json.dumps(safe_payload, ensure_ascii=False, indent=2)
