"""Single-report follow-up context helpers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .contracts import ReportFollowupContext, ReportPersona, ReportSectionReference


class ReportFollowupContextStore:
    """File-backed store for one-report follow-up contexts.

    The store is intentionally report-scoped. It does not aggregate reports,
    create long-term memory, or infer a user profile.
    """

    def __init__(self, *, root_dir: Path | str = Path("data/report-followup-contexts")) -> None:
        self.root_dir = Path(root_dir)

    def write(self, context: ReportFollowupContext) -> Path:
        path = self._path_for_report(context.report_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(context.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def read(self, report_id: str) -> ReportFollowupContext | None:
        path = self._path_for_report(report_id)
        if not path.exists():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        sections = [
            ReportSectionReference(
                section_id=str(item.get("section_id") or ""),
                title=str(item.get("title") or ""),
                excerpt=str(item.get("excerpt") or ""),
            )
            for item in payload.get("report_sections", [])
            if isinstance(item, dict)
        ]
        return ReportFollowupContext(
            report_id=str(payload.get("report_id") or report_id),
            report_mode=str(payload.get("report_mode") or "lite"),
            theme=str(payload.get("theme") or "wealth"),
            theme_label=str(payload.get("theme_label") or "财富关系"),
            painting_intention=str(payload.get("painting_intention") or ""),
            painting_feeling=str(payload.get("painting_feeling") or ""),
            final_report_md=str(payload.get("final_report_md") or ""),
            final_report=payload.get("final_report") if isinstance(payload.get("final_report"), dict) else {},
            visual_draft=payload.get("visual_draft") if isinstance(payload.get("visual_draft"), dict) else None,
            report_sections=sections,
            recent_followup_turns=[
                {"role": str(item.get("role") or ""), "content": str(item.get("content") or "")}
                for item in payload.get("recent_followup_turns", [])
                if isinstance(item, dict)
            ],
            persona=_persona_from_payload(payload.get("persona")),
        )

    def _path_for_report(self, report_id: str) -> Path:
        safe_report_id = "".join(char for char in report_id if char.isalnum() or char in {"-", "_"})
        return self.root_dir / safe_report_id / "context.json"


def build_report_section_map(markdown: str, *, max_excerpt_chars: int = 320) -> list[ReportSectionReference]:
    normalized = markdown.replace("\r", "").strip()
    if not normalized:
        return []

    sections: list[ReportSectionReference] = []
    current_title = "完整报告"
    buffer: list[str] = []

    def push_section() -> None:
        body = _strip_markdown("\n".join(buffer)).strip()
        if not body:
            return
        section_index = len(sections) + 1
        sections.append(
            ReportSectionReference(
                section_id=f"section-{section_index}",
                title=current_title,
                excerpt=body[:max_excerpt_chars],
            )
        )

    for line in normalized.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            push_section()
            current_title = stripped.lstrip("#").strip() or current_title
            buffer = []
            continue
        if stripped == "---":
            continue
        buffer.append(line)
    push_section()
    return sections


def _strip_markdown(text: str) -> str:
    replacements = ["**", "__", "`", "*"]
    stripped = text
    for marker in replacements:
        stripped = stripped.replace(marker, "")
    return "\n".join(line.strip() for line in stripped.splitlines() if line.strip())


def _persona_from_payload(payload: Any) -> ReportPersona:
    if isinstance(payload, dict):
        return ReportPersona(
            persona_id=str(payload.get("persona_id") or "manman"),
            persona_version=str(payload.get("persona_version") or "manman-report-companion-v0.1"),
            display_name=str(payload.get("display_name") or "曼曼"),
            role_label=str(payload.get("role_label") or "AI 报告陪读 avatar"),
            scope=str(payload.get("scope") or "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问"),
            boundaries=[
                str(item)
                for item in payload.get("boundaries", [])
                if isinstance(item, str) and item.strip()
            ],
        )
    return ReportPersona()
