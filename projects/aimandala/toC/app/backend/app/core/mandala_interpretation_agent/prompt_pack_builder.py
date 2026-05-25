"""Build versioned prompt packs for mandala end-to-end report generation."""

from __future__ import annotations

import hashlib
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
    def __init__(self, *, pack_id: str = "wealth-report-v1.0.0", report_mode: str = "lite") -> None:
        self.pack_id = pack_id
        self.report_mode = report_mode

    def build(self) -> PromptPack:
        pack_dir = PROMPTS_ROOT / self.pack_id
        if not pack_dir.exists():
            raise FileNotFoundError(f"prompt pack not found: {pack_dir}")

        filenames = [
            "00-output-instruction.md",
        ]
        if self.report_mode == "lite":
            filenames.append("01-lite-report-instruction.md")
        elif self.report_mode == "pro":
            filenames.append("02-pro-report-instruction.md")
        else:
            raise ValueError(f"unsupported report_mode for prompt pack: {self.report_mode}")
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
