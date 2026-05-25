"""Load or build the stable foundation prompt pack for mandala visual reading."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
MANDALA_FOUNDATION_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "20-流派层"
    / "10-曼陀罗"
)
GENERATED_PROMPT_PACKS_ROOT = Path(__file__).with_name("generated_prompt_packs")
FOUNDATION_VISION_SOURCE_FILES = [
    "00-曼陀罗基础层解读流程.md",
    "10-画面识别与描述/README.md",
    "10-画面识别与描述/02-画面分析基础.md",
    "10-画面识别与描述/03-形状识别与感知.md",
    "10-画面识别与描述/04-颜色识别与感知.md",
    "20-圈内五行解读/README.md",
    "20-圈内五行解读/01-五行感知法.md",
    "20-圈内五行解读/02-五行相生相克解读法.md",
    "20-圈内五行解读/03-五行失衡类型.md",
    "20-圈内五行解读/五行生克/README.md",
    "20-圈内五行解读/五行生克/01-木生火.md",
    "20-圈内五行解读/五行生克/02-火生土.md",
    "20-圈内五行解读/五行生克/03-土生金.md",
    "20-圈内五行解读/五行生克/04-金生水.md",
    "20-圈内五行解读/五行生克/05-水生木.md",
    "20-圈内五行解读/五行生克/06-水克火.md",
    "20-圈内五行解读/五行生克/07-火克金.md",
    "20-圈内五行解读/五行生克/08-金克木.md",
    "20-圈内五行解读/五行生克/09-木克土.md",
    "20-圈内五行解读/五行生克/10-土克水.md",
    "30-跨圈能量解读/README.md",
    "30-跨圈能量解读/01-三圈结构法.md",
]


@dataclass(frozen=True)
class FoundationPromptPack:
    pack_id: str
    manifest: dict[str, Any]
    files: list[tuple[str, str]]
    stable_prefix: str


class FoundationPromptPackBuilder:
    """Load a generated cache-friendly prompt prefix for Vision Pass."""

    def __init__(
        self,
        *,
        pack_id: str = "foundation-vision-v1.0.0",
        mandala_root: Path | None = None,
        generated_root: Path | None = None,
        use_generated: bool = True,
    ) -> None:
        self.pack_id = pack_id
        self.mandala_root = mandala_root or MANDALA_FOUNDATION_ROOT
        self.generated_root = generated_root or GENERATED_PROMPT_PACKS_ROOT
        self.use_generated = use_generated

    def build(self) -> FoundationPromptPack:
        if self.use_generated:
            generated_pack = self._load_generated_pack()
            if generated_pack is not None:
                return generated_pack
        return self.build_from_sources()

    def build_from_sources(self) -> FoundationPromptPack:
        if not self.mandala_root.exists():
            raise FileNotFoundError(f"mandala foundation root not found: {self.mandala_root}")

        files: list[tuple[str, str]] = []
        for relative_path in FOUNDATION_VISION_SOURCE_FILES:
            path = self.mandala_root / relative_path
            if not path.exists():
                raise FileNotFoundError(f"foundation prompt source not found: {path}")
            text = path.read_text(encoding="utf-8").strip()
            if not text:
                continue
            files.append((f"10-曼陀罗/{relative_path}", text))

        stable_prefix = "\n\n".join(
            [
                "# 曼陀罗基础层长上下文知识包",
                "以下内容来自疗愈体系知识库/20-疗愈体系/20-流派层/10-曼陀罗。",
                "本知识包只用于 Vision Pass：观察原画、确认三圈、描述视觉事实、识别圈内五行线索、判断圈内五行生克线索、观察三圈能量流动。",
                "本阶段不要生成财富报告、心理结论、身体结论、关系结论或疗愈建议。",
                "来源文档中的目录、索引或示例只作为方法依据；不要照抄机器标签、ID、JSON、YAML、schema 或 stage 表述。",
                "输出时使用自然语言 Markdown，保留画面细节、位置关系、留白作用和后续解读可引用的视觉依据。",
                *[
                    f"## 来源文件：{relative_path}\n\n{text}"
                    for relative_path, text in files
                ],
            ]
        ).strip()
        manifest = {
            "pack_id": self.pack_id,
            "mandala_root": self._relative_or_string(self.mandala_root),
            "file_order": [name for name, _ in files],
            "file_count": len(files),
            "char_count": len(stable_prefix),
            "pack_hash": hashlib.sha256(stable_prefix.encode("utf-8")).hexdigest(),
            "build_mode": "source",
        }
        return FoundationPromptPack(
            pack_id=self.pack_id,
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )

    def _load_generated_pack(self) -> FoundationPromptPack | None:
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
        return FoundationPromptPack(
            pack_id=str(manifest.get("pack_id") or self.pack_id),
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )

    def _relative_or_string(self, path: Path) -> str:
        try:
            return str(path.relative_to(AIMANDALA_ROOT.parents[1]))
        except ValueError:
            return str(path)
