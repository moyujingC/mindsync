"""Load or build the stable wealth prompt pack for report reasoning."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
WEALTH_TOPIC_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "10-议题层"
    / "30-主议题报告包"
    / "10-财富"
)
STRUCTURED_KB_ROOT = (
    AIMANDALA_ROOT / "docs" / "疗愈体系知识库" / "50-结构化知识单元"
)
APP_ADAPTATION_ROOT = (
    AIMANDALA_ROOT / "docs" / "疗愈体系知识库" / "30-应用适配" / "10-aimandala"
)
GENERATED_PROMPT_PACKS_ROOT = Path(__file__).with_name("generated_prompt_packs")


@dataclass(frozen=True)
class WealthPromptPack:
    pack_id: str
    manifest: dict[str, Any]
    files: list[tuple[str, str]]
    stable_prefix: str


class WealthPromptPackBuilder:
    """Load wealth-topic materials as a cache-friendly stable prompt prefix."""

    def __init__(
        self,
        *,
        pack_id: str = "wealth-reasoning-v1.0.0",
        wealth_root: Path | None = None,
        structured_root: Path | None = None,
        app_adaptation_root: Path | None = None,
        generated_root: Path | None = None,
        use_generated: bool = True,
    ) -> None:
        self.pack_id = pack_id
        self.wealth_root = wealth_root or WEALTH_TOPIC_ROOT
        self.structured_root = structured_root or STRUCTURED_KB_ROOT
        self.app_adaptation_root = app_adaptation_root or APP_ADAPTATION_ROOT
        self.generated_root = generated_root or GENERATED_PROMPT_PACKS_ROOT
        self.use_generated = use_generated

    def build(self) -> WealthPromptPack:
        if self.use_generated:
            generated_pack = self._load_generated_pack()
            if generated_pack is not None:
                return generated_pack
        files: list[tuple[str, str]] = []
        for path in self._collect_md_files(self.wealth_root):
            rel = path.relative_to(self.wealth_root).as_posix()
            files.append((f"10-议题层/30-主议题报告包/10-财富/{rel}", path.read_text(encoding="utf-8").strip()))
        for relative_path in [
            "10-aimandala-report-generation.yaml",
            "16-foundation-image-reading-schema.yaml",
            "20-wealth-issue-clauses.yaml",
            "30-wealth-evidence-links.yaml",
            "40-wealth-report-routing.yaml",
            "45-wealth-emergent-topic-translation.yaml",
        ]:
            path = self.structured_root / relative_path
            if path.exists():
                files.append((f"50-结构化知识单元/{relative_path}", path.read_text(encoding="utf-8").strip()))
        for relative_path in [
            "01-解读与个案沟通流程.md",
            "02-解读报告组织规范.md",
            "03-解读报告生成最小规则.md",
            "04-Lite-Pro报告分流与交付口径.md",
            "05-报告任务定义.md",
            "06-财富议题解读报告模板.md",
            "07-报告语言风格指南.md",
        ]:
            path = self.app_adaptation_root / relative_path
            if path.exists():
                files.append((f"30-应用适配/10-aimandala/{relative_path}", path.read_text(encoding="utf-8").strip()))

        stable_prefix = "\n\n".join(
            [
                "# 财富主题长上下文知识包",
                "以下内容用于财富议题报告生成与议题翻译，不用于视觉层基础识别。",
                "正式生产默认优先复用同一财富主题基准，保证多议题时可追溯、一致。",
                *[
                    f"## 来源文件：{relative_path}\n\n{text}"
                    for relative_path, text in files
                ],
            ]
        ).strip()
        manifest = {
            "pack_id": self.pack_id,
            "wealth_root": self._relative_or_string(self.wealth_root),
            "structured_root": self._relative_or_string(self.structured_root),
            "app_adaptation_root": self._relative_or_string(self.app_adaptation_root),
            "file_order": [name for name, _ in files],
            "file_count": len(files),
            "char_count": len(stable_prefix),
            "pack_hash": hashlib.sha256(stable_prefix.encode("utf-8")).hexdigest(),
            "build_mode": "source",
        }
        return WealthPromptPack(
            pack_id=self.pack_id,
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )

    def _load_generated_pack(self) -> WealthPromptPack | None:
        pack_dir = self.generated_root / self.pack_id
        prompt_path = pack_dir / "prompt.md"
        manifest_path = pack_dir / "manifest.json"
        if not prompt_path.exists() or not manifest_path.exists():
            return None
        stable_prefix = prompt_path.read_text(encoding="utf-8").strip()
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if not isinstance(manifest, dict):
            raise ValueError(f"generated prompt pack manifest must be an object: {manifest_path}")
        files = [
            (str(path), "")
            for path in manifest.get("file_order", [])
            if isinstance(path, str)
        ]
        return WealthPromptPack(
            pack_id=str(manifest.get("pack_id") or self.pack_id),
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )

    def _collect_md_files(self, root: Path) -> list[Path]:
        return [path for path in sorted(root.rglob("*.md")) if path.is_file()]

    def _relative_or_string(self, path: Path) -> str:
        try:
            return str(path.relative_to(AIMANDALA_ROOT.parents[1]))
        except ValueError:
            return str(path)
