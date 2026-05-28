"""Load or build the stable intimate relationship prompt pack for report reasoning."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .prompt_budget import build_prompt_budget_manifest


AIMANDALA_ROOT = Path(__file__).resolve().parents[6]
INTIMATE_RELATIONSHIP_TOPIC_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "10-议题层"
    / "30-主议题报告包"
    / "20-亲密关系"
)
APP_ADAPTATION_ROOT = (
    AIMANDALA_ROOT / "docs" / "疗愈体系知识库" / "30-应用适配" / "10-aimandala"
)
GENERATED_PROMPT_PACKS_ROOT = Path(__file__).with_name("generated_prompt_packs")
APP_ADAPTATION_SOURCE_FILES = [
    "01-解读与个案沟通流程.md",
    "02-解读报告组织规范.md",
    "03-解读报告生成最小规则.md",
    "04-Lite-Pro报告分流与交付口径.md",
    "05-报告任务定义.md",
    "06b-亲密关系议题解读报告模板.md",
    "07-报告语言风格指南.md",
]


@dataclass(frozen=True)
class IntimateRelationshipPromptPack:
    pack_id: str
    manifest: dict[str, Any]
    files: list[tuple[str, str]]
    stable_prefix: str


class IntimateRelationshipPromptPackBuilder:
    """Load intimate-relationship materials as a cache-friendly stable prompt prefix."""

    def __init__(
        self,
        *,
        pack_id: str = "intimate-relationship-reasoning-v1.0.0",
        topic_root: Path | None = None,
        app_adaptation_root: Path | None = None,
        generated_root: Path | None = None,
        use_generated: bool = True,
    ) -> None:
        self.pack_id = pack_id
        self.topic_root = topic_root or INTIMATE_RELATIONSHIP_TOPIC_ROOT
        self.app_adaptation_root = app_adaptation_root or APP_ADAPTATION_ROOT
        self.generated_root = generated_root or GENERATED_PROMPT_PACKS_ROOT
        self.use_generated = use_generated

    def build(self) -> IntimateRelationshipPromptPack:
        if self.use_generated:
            generated_pack = self._load_generated_pack()
            if generated_pack is not None:
                return generated_pack
        raise FileNotFoundError(
            f"generated intimate relationship prompt pack not found: "
            f"{self.generated_root / self.pack_id}"
        )

    def build_from_sources(self) -> IntimateRelationshipPromptPack:
        if not self.topic_root.exists():
            raise FileNotFoundError(
                f"intimate relationship prompt source root not found: {self.topic_root}"
            )

        files: list[tuple[str, str]] = []
        for path in self._collect_md_files(self.topic_root):
            rel = path.relative_to(self.topic_root).as_posix()
            files.append((
                f"10-议题层/30-主议题报告包/20-亲密关系/{rel}",
                path.read_text(encoding="utf-8").strip(),
            ))
        for relative_path in APP_ADAPTATION_SOURCE_FILES:
            path = self.app_adaptation_root / relative_path
            if not path.exists():
                raise FileNotFoundError(f"report prompt source not found: {path}")
            files.append((
                f"30-应用适配/10-aimandala/{relative_path}",
                path.read_text(encoding="utf-8").strip(),
            ))

        stable_prefix = "\n\n".join(
            [
                "# 亲密关系议题长上下文知识包",
                "以下内容用于亲密关系报告生成与议题翻译，不用于视觉层基础识别。",
                "正式生产默认优先复用同一亲密关系基准，保证多议题时可追溯、一致。",
                "本知识包由 Markdown 源文档在部署期生成；运行时不读取 YAML 结构化知识单元。",
                *[
                    f"## 来源文件：{relative_path}\n\n{text}"
                    for relative_path, text in files
                    if text
                ],
            ]
        ).strip()
        manifest = {
            "pack_id": self.pack_id,
            "topic_root": self._relative_or_string(self.topic_root),
            "app_adaptation_root": self._relative_or_string(self.app_adaptation_root),
            "file_order": [name for name, text in files if text],
            "file_count": len([text for _, text in files if text]),
            "char_count": len(stable_prefix),
            "pack_hash": hashlib.sha256(stable_prefix.encode("utf-8")).hexdigest(),
            "build_mode": "source",
        }
        manifest["prompt_budget"] = build_prompt_budget_manifest(stable_prefix)
        return IntimateRelationshipPromptPack(
            pack_id=self.pack_id,
            manifest=manifest,
            files=[(name, text) for name, text in files if text],
            stable_prefix=stable_prefix,
        )

    def _load_generated_pack(self) -> IntimateRelationshipPromptPack | None:
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
        return IntimateRelationshipPromptPack(
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
