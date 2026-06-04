"""Build a compact knowledge pack from the healing knowledge base."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .runtime_paths import AIMANDALA_ROOT, BACKEND_ROOT, relative_to_known_root

HEALING_KB_ROOT = AIMANDALA_ROOT / "docs" / "疗愈体系知识库"
METHOD_SOURCE = (
    HEALING_KB_ROOT
    / "20-疗愈体系"
    / "20-流派层"
    / "10-曼陀罗"
    / "00-曼陀罗基础层解读流程.md"
)
KNOWLEDGE_PACK_ROOT = HEALING_KB_ROOT


class KnowledgePackBuilder:
    """Create a task-scoped pack without depending on old runtime pack folders."""

    def __init__(self, *, pack_root: Path | None = None, method_source: Path | None = None) -> None:
        self.pack_root = pack_root or KNOWLEDGE_PACK_ROOT
        self.method_source = method_source or METHOD_SOURCE

    def build(self, *, theme: str = "general") -> dict[str, Any]:
        normalized_theme = theme.strip() or "general"
        return {
            "pack_id": "mandala-interpretation-agent-compact",
            "method_source": self._relative_or_string(self.method_source),
            "knowledge_base_root": self._relative_or_string(self.pack_root),
            "theme": normalized_theme,
            "entries": {
                "report_generation": self._read_text(
                    "30-应用适配/10-aimandala/05-报告任务定义.md",
                    max_chars=4200,
                ),
                "runtime_index": self._read_text(
                    "60-运行时知识包/README.md",
                    max_chars=2600,
                ),
                "foundation_image_reading_schema": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/00-曼陀罗基础层解读流程.md",
                    max_chars=16000,
                ),
                "mandala_signal_index": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/01-画面信号总目录.md",
                    max_chars=2600,
                ),
                "circle_structure": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/30-跨圈能量解读/01-三圈结构法.md",
                    max_chars=3600,
                ),
                "visual_analysis": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/10-画面识别与描述/02-画面分析基础.md",
                    max_chars=3600,
                ),
                "shape_sensing": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/10-画面识别与描述/03-形状识别与感知.md",
                    max_chars=3000,
                ),
                "color_sensing": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/10-画面识别与描述/04-颜色识别与感知.md",
                    max_chars=3200,
                ),
                "combination_patterns": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/40-组合模式/12-高频组合模式.md",
                    max_chars=3200,
                ),
                "five_element_sensing": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/20-圈内五行解读/01-五行感知法.md",
                    max_chars=3200,
                ),
                "five_element_relations": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/20-圈内五行解读/02-五行相生相克解读法.md",
                    max_chars=3200,
                ),
                "five_element_imbalances": self._read_text(
                    "20-疗愈体系/20-流派层/10-曼陀罗/20-圈内五行解读/03-五行失衡类型.md",
                    max_chars=5200,
                ),
                "report_style_guide": self._read_text(
                    "30-应用适配/10-aimandala/07-报告语言风格指南.md",
                    max_chars=3600,
                ),
                "theme": self._theme_entry(normalized_theme),
            },
            "forbidden_inputs": [
                "full_markdown_truth_sources",
                "full_theme_knowledge_documents",
                "private_env_or_api_keys",
            ],
        }

    def _theme_entry(self, theme: str) -> dict[str, Any]:
        if theme != "wealth":
            return self._read_text(
                "20-疗愈体系/10-议题层/20-浮现机制/01-自我价值与配得感.md",
                max_chars=2600,
            )
        return {
            "wealth_framework": self._read_text(
                "20-疗愈体系/10-议题层/10-议题本体/30-现实/01-财富.md",
                max_chars=3200,
            ),
            "wealth_handbook": self._read_text(
                "20-疗愈体系/10-议题层/30-主议题报告包/10-财富关系/11-财富关系议题手册.md",
                max_chars=12000,
            ),
            "wealth_report_template": self._read_text(
                "30-应用适配/10-aimandala/06-财富关系议题解读报告模板.md",
                max_chars=3600,
            ),
            "wealth_signal_translation": self._read_text(
                "20-疗愈体系/10-议题层/30-主议题报告包/10-财富关系/10-财富关系翻译层/01-基础信号财富关系翻译总表.md",
                max_chars=16000,
            ),
            "wealth_report_routing_notes": self._read_text(
                "20-疗愈体系/10-议题层/30-主议题报告包/10-财富关系/10-财富关系翻译层/02-报告路由位置说明.md",
                max_chars=16000,
            ),
            "wealth_emergent_topic_translation": self._read_text(
                "20-疗愈体系/10-议题层/30-主议题报告包/10-财富关系/12-财富关系中的浮现议题回译规则.md",
                max_chars=24000,
            ),
            "wealth_next_exploration_mapping": self._read_text(
                "20-疗愈体系/10-议题层/30-主议题报告包/10-财富关系/13-下一次探索建议映射表.md",
                max_chars=6000,
            ),
        }

    def _read_text(self, relative_path: str, *, max_chars: int) -> dict[str, Any]:
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
        return relative_to_known_root(path)


def knowledge_pack_to_prompt_fragment(knowledge_pack: dict[str, Any]) -> str:
    safe_payload = {
        "pack_id": knowledge_pack.get("pack_id"),
        "method_source": knowledge_pack.get("method_source"),
        "theme": knowledge_pack.get("theme"),
        "entries": knowledge_pack.get("entries", {}),
        "forbidden_inputs": knowledge_pack.get("forbidden_inputs", []),
    }
    return json.dumps(safe_payload, ensure_ascii=False, indent=2)
