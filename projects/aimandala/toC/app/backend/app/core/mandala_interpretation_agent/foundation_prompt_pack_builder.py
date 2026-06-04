"""Load or build the stable foundation prompt pack for mandala visual reading."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .prompt_budget import build_prompt_budget_manifest
from .runtime_paths import AIMANDALA_ROOT, relative_to_known_root


MANDALA_FOUNDATION_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "20-流派层"
    / "10-曼陀罗"
)
COMPLETE_CASE_SOURCE_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "70-评估与案例"
    / "10-完整解读案例11例"
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
FOUNDATION_VISION_EXTERNAL_SOURCE_FILES = [
    (
        COMPLETE_CASE_SOURCE_ROOT,
        "90-来源原文/01-完整解读案例11例合并原文.md",
        "70-评估与案例/10-完整解读案例11例/90-来源原文/01-完整解读案例11例合并原文.md",
    ),
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
        raise FileNotFoundError(
            f"generated foundation prompt pack not found: {self.generated_root / self.pack_id}"
        )

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
        for root, relative_path, prompt_relative_path in FOUNDATION_VISION_EXTERNAL_SOURCE_FILES:
            path = root / relative_path
            if not path.exists():
                raise FileNotFoundError(f"foundation prompt source not found: {path}")
            text = path.read_text(encoding="utf-8").strip()
            if not text:
                continue
            files.append((prompt_relative_path, text))

        stable_prefix = "\n\n".join(
            [
                "# 曼陀罗基础层长上下文知识包",
                "以下内容来自疗愈体系知识库/20-疗愈体系/20-流派层/10-曼陀罗。",
                "完整案例原文来自疗愈体系知识库/70-评估与案例/10-完整解读案例11例，用于补充疗愈师实际看画与组织观察的范式。",
                "本知识包只用于 Vision Pass：观察原画、确认三圈、描述视觉事实、识别圈内五行线索、判断圈内五行生克线索、观察三圈能量流动。",
                "本阶段不要生成财富报告、心理结论、身体结论、关系结论或疗愈建议。",
                "来源文档中的目录、索引或示例只作为方法依据；不要照抄机器标签、ID、JSON、YAML、schema 或 stage 表述。",
                "五行只用于圈内元素观察和圈内元素关系判断，不用于圈与圈之间的跨圈判断。",
                "三圈能量流动只写承接、堵塞、外散、内收、回压、贯通或失衡，不写跨圈五行相生相克。",
                "三圈边界以三圈标记图为准；标记线本身不是画作内容。",
                "不要强行给重复图形报精确数量，除非数量非常清楚；优先描述元素类型、位置、相邻关系和留白切分。",
                "必须观察颜色填充是否均匀、是否有深浅变化、是否有笔触轻重差异。",
                "画作边界以内的纸面留白属于画面元素，需要说明它是否包围、隔开或切分其他视觉单元。",
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
        manifest["prompt_budget"] = build_prompt_budget_manifest(stable_prefix)
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
        manifest.setdefault("prompt_budget", build_prompt_budget_manifest(stable_prefix))
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
        return relative_to_known_root(path)
