"""Artifact writer for mandala end-to-end report review outputs."""

from __future__ import annotations

import json
from pathlib import Path

from .contracts import MandalaAgentResult


class MandalaInterpretationArtifactStore:
    def __init__(self, output_dir: str | Path) -> None:
        self.output_dir = Path(output_dir)

    def write(self, result: MandalaAgentResult) -> list[Path]:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        files = {
            "agent_input.json": result.agent_input,
            "visual_draft.json": result.visual_draft,
            "prompt_pack_manifest.json": result.prompt_pack_manifest,
            "final_report.json": result.final_report,
            "quality_gate.json": result.quality_gate,
            "run_summary.json": result.run_summary,
        }
        written: list[Path] = []
        for name, payload in files.items():
            path = self.output_dir / name
            path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            written.append(path)

        markdown_files = {
            "visual_draft.md": json.dumps(result.visual_draft, ensure_ascii=False, indent=2),
            "final_report.md": result.final_report_md,
        }
        for name, content in markdown_files.items():
            path = self.output_dir / name
            path.write_text(content.strip() + "\n", encoding="utf-8")
            written.append(path)

        return written
