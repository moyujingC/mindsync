"""Generic generated prompt pack builder for topic report reasoning."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .prompt_budget import build_prompt_budget_manifest
from .runtime_paths import relative_to_known_root
from .topic_prompt_pack_registry import (
    APP_ADAPTATION_ROOT,
    GENERATED_PROMPT_PACKS_ROOT,
    TOPIC_REPORT_PACKS_ROOT,
    TopicPromptPackConfig,
)


@dataclass(frozen=True)
class TopicPromptPack:
    pack_id: str
    manifest: dict[str, Any]
    files: list[tuple[str, str]]
    stable_prefix: str


class TopicPromptPackBuilder:
    """Load one topic's materials as a cache-friendly stable prompt prefix."""

    def __init__(
        self,
        *,
        config: TopicPromptPackConfig,
        topic_root: Path | None = None,
        app_adaptation_root: Path | None = None,
        generated_root: Path | None = None,
        use_generated: bool = True,
    ) -> None:
        self.config = config
        self.pack_id = config.pack_id
        self.topic_root = topic_root or config.source_root
        self.app_adaptation_root = app_adaptation_root or APP_ADAPTATION_ROOT
        self.generated_root = generated_root or GENERATED_PROMPT_PACKS_ROOT
        self.use_generated = use_generated

    def build(self) -> TopicPromptPack:
        if self.use_generated:
            generated_pack = self._load_generated_pack()
            if generated_pack is not None:
                return generated_pack
        raise FileNotFoundError(
            f"generated topic prompt pack not found: {self.generated_root / self.pack_id}"
        )

    def build_from_sources(self) -> TopicPromptPack:
        if not self.topic_root.exists():
            raise FileNotFoundError(f"topic prompt source root not found: {self.topic_root}")

        files: list[tuple[str, str]] = []
        for path in self._collect_md_files(self.topic_root):
            rel = path.relative_to(self.topic_root).as_posix()
            files.append((
                f"10-议题层/30-主议题报告包/{self.config.source_dir_name}/{rel}",
                path.read_text(encoding="utf-8").strip(),
            ))
        for relative_path in self.config.app_adaptation_files:
            path = self.app_adaptation_root / relative_path
            if not path.exists():
                raise FileNotFoundError(f"report prompt source not found: {path}")
            files.append((
                f"30-应用适配/10-aimandala/{relative_path}",
                path.read_text(encoding="utf-8").strip(),
            ))

        stable_prefix = "\n\n".join(
            [
                f"# {self.config.label}议题长上下文知识包",
                f"以下内容用于{self.config.label}报告生成与议题翻译，不用于视觉层基础识别。",
                f"正式生产默认优先复用同一{self.config.label}基准，保证多议题时可追溯、一致。",
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
            "topic_key": self.config.topic_key,
            "topic_label": self.config.label,
            "topic_root": self._relative_or_string(self.topic_root),
            "app_adaptation_root": self._relative_or_string(self.app_adaptation_root),
            "file_order": [name for name, text in files if text],
            "file_count": len([text for _, text in files if text]),
            "char_count": len(stable_prefix),
            "pack_hash": hashlib.sha256(stable_prefix.encode("utf-8")).hexdigest(),
            "build_mode": "source",
        }
        manifest["prompt_budget"] = build_prompt_budget_manifest(stable_prefix)
        return TopicPromptPack(
            pack_id=self.pack_id,
            manifest=manifest,
            files=[(name, text) for name, text in files if text],
            stable_prefix=stable_prefix,
        )

    def _load_generated_pack(self) -> TopicPromptPack | None:
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
        return TopicPromptPack(
            pack_id=str(manifest.get("pack_id") or self.pack_id),
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )

    def _collect_md_files(self, root: Path) -> list[Path]:
        return [path for path in sorted(root.rglob("*.md")) if path.is_file()]

    def _relative_or_string(self, path: Path) -> str:
        return relative_to_known_root(path)
