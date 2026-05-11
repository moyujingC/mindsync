"""Artifact writer for mandala reading agent review outputs."""

from __future__ import annotations

import json
from pathlib import Path

from .contracts import MandalaAgentResult


class MandalaReadingArtifactStore:
    def __init__(self, output_dir: str | Path) -> None:
        self.output_dir = Path(output_dir)

    def write(self, result: MandalaAgentResult) -> list[Path]:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        files = {
            "agent_input.json": result.agent_input,
            "knowledge_pack.json": result.knowledge_pack,
            "agent_output.json": result.agent_output,
            "interpretation_artifacts.json": result.interpretation_artifacts,
            "stage_outputs.json": result.stage_outputs,
            "execution_trace.json": result.execution_trace,
            "final_report.json": result.final_report,
            "report_context_package.json": result.report_context_package,
            "quality_gate.json": result.quality_gate,
        }
        written: list[Path] = []
        for name, payload in files.items():
            path = self.output_dir / name
            path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            written.append(path)

        markdown_path = self.output_dir / "final_report.md"
        markdown_path.write_text(result.final_report_md + "\n", encoding="utf-8")
        written.append(markdown_path)
        return written
