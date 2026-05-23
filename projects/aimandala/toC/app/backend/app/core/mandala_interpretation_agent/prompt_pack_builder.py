"""Build versioned prompt packs for mandala end-to-end report generation."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROMPTS_ROOT = Path(__file__).with_name("prompt_packs")


@dataclass(frozen=True)
class PromptPack:
    pack_id: str
    manifest: dict[str, Any]
    files: list[tuple[str, str]]
    stable_prefix: str


class PromptPackBuilder:
    def __init__(self, *, pack_id: str = "wealth-report-v1.0.0") -> None:
        self.pack_id = pack_id

    def build(self) -> PromptPack:
        pack_dir = PROMPTS_ROOT / self.pack_id
        if not pack_dir.exists():
            raise FileNotFoundError(f"prompt pack not found: {pack_dir}")

        filenames = [
            "00-system.md",
            "10-mandala-manual.md",
            "20-wealth-topic-rules.md",
            "30-style-guide.md",
            "40-safety-boundary.md",
            "50-output-contract.md",
        ]
        files: list[tuple[str, str]] = []
        for filename in filenames:
            path = pack_dir / filename
            if not path.exists():
                raise FileNotFoundError(f"prompt pack file not found: {path}")
            files.append((filename, path.read_text(encoding="utf-8").strip()))

        stable_prefix = "\n\n".join(content for _, content in files).strip()
        manifest = {
            "pack_id": self.pack_id,
            "file_order": [name for name, _ in files],
            "pack_hash": hashlib.sha256(stable_prefix.encode("utf-8")).hexdigest(),
            "file_count": len(files),
        }
        return PromptPack(
            pack_id=self.pack_id,
            manifest=manifest,
            files=files,
            stable_prefix=stable_prefix,
        )


def write_prompt_pack_files() -> None:
    """Create a versioned prompt pack skeleton if it does not already exist."""
    pack_dir = PROMPTS_ROOT / "wealth-report-v1.0.0"
    pack_dir.mkdir(parents=True, exist_ok=True)
    files = {
        "00-system.md": "你是专业的曼陀罗解读写作者，负责把视觉草稿和稳定前缀写成财富议题报告。",
        "10-mandala-manual.md": "这里放完整手册原文的稳定锚定片段。",
        "20-wealth-topic-rules.md": "这里放财富议题 routing 规则的稳定片段。",
        "30-style-guide.md": "这里放报告语言风格指南。",
        "40-safety-boundary.md": "这里放安全边界与禁止内容。",
        "50-output-contract.md": "这里放输出合同和报告结构约束。",
    }
    for filename, content in files.items():
        path = pack_dir / filename
        if not path.exists():
            path.write_text(content + "\n", encoding="utf-8")
    manifest = {
        "pack_id": "wealth-report-v1.0.0",
        "file_order": list(files.keys()),
    }
    manifest_path = pack_dir / "manifest.json"
    if not manifest_path.exists():
        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
