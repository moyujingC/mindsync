"""Write mandala reading agent artifacts for review."""

from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

from .contracts import MandalaAgentResult


class MandalaReadingArtifactStore:
    """Persist the MVP artifact set expected by QA and handoff docs."""

    def __init__(self, output_dir: str | Path) -> None:
        self.output_dir = Path(output_dir)

    def write(self, result: MandalaAgentResult) -> list[Path]:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        artifacts: dict[str, Any] = {
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
        for filename, payload in artifacts.items():
            path = self.output_dir / filename
            path.write_text(
                json.dumps(_json_safe(payload), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            written.append(path)

        markdown_path = self.output_dir / "final_report.md"
        markdown_path.write_text(result.final_report_md, encoding="utf-8")
        written.append(markdown_path)
        return written


def _json_safe(payload: Any) -> Any:
    if is_dataclass(payload):
        return asdict(payload)
    if isinstance(payload, dict):
        return {str(key): _json_safe(value) for key, value in payload.items()}
    if isinstance(payload, list):
        return [_json_safe(item) for item in payload]
    if isinstance(payload, tuple):
        return [_json_safe(item) for item in payload]
    return payload
