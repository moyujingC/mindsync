"""Contracts for the end-to-end mandala interpretation agent."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal


REPORT_MODES = {"lite", "pro"}
PUBLIC_REPORT_MODES = {"lite"}
AGENT_VARIANTS = {"two_pass_e2e", "single_pass_e2e"}


@dataclass(frozen=True)
class MandalaImageInput:
    local_path: str
    marked_local_path: str = ""
    storage_backend: str = ""
    storage_key: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaUserContext:
    theme: str = "wealth"
    theme_label: str = "财富关系"
    painting_intention: str = ""
    painting_feeling: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaOutputRequirements:
    language: str = "zh-CN"
    audience: str = "普通用户"
    tone: str = "像疗愈师带用户看画"
    forbidden_terms: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ReportPersona:
    persona_id: str = "manman"
    persona_version: str = "manman-report-companion-v0.1"
    display_name: str = "曼曼"
    role_label: str = "AI 报告陪读 avatar"
    scope: str = "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问"
    boundaries: list[str] = field(
        default_factory=lambda: [
            "不是心理咨询师",
            "不是真实疗愈师",
            "不提供长期陪伴",
            "不提供医疗建议、心理诊断、财务建议或重大现实决策",
            "只基于本次画作和本次报告内容陪用户理解",
        ]
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaAgentInput:
    image: MandalaImageInput
    user_context: MandalaUserContext
    circle_boundaries: dict[str, Any]
    report_mode: Literal["lite", "pro"] = "lite"
    agent_version: str = "mandala-e2e-agent-v1"
    prompt_pack_id: str = ""
    agent_variant: str = "two_pass_e2e"
    output_requirements: MandalaOutputRequirements = field(default_factory=MandalaOutputRequirements)
    persona: ReportPersona = field(default_factory=ReportPersona)

    def __post_init__(self) -> None:
        if self.report_mode not in REPORT_MODES:
            raise ValueError(f"unsupported report_mode: {self.report_mode}")
        if self.agent_variant not in AGENT_VARIANTS:
            raise ValueError(f"unsupported agent_variant: {self.agent_variant}")

    def is_public_mode(self) -> bool:
        return self.report_mode in PUBLIC_REPORT_MODES

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_version": self.agent_version,
            "report_mode": self.report_mode,
            "image": self.image.to_dict(),
            "user_context": self.user_context.to_dict(),
            "circle_boundaries": self.circle_boundaries,
            "prompt_pack_id": self.prompt_pack_id,
            "agent_variant": self.agent_variant,
            "output_requirements": self.output_requirements.to_dict(),
            "persona": self.persona.to_dict(),
        }


@dataclass(frozen=True)
class ReportFollowupContext:
    report_id: str
    report_mode: Literal["lite", "pro"] | str
    theme: str = "wealth"
    theme_label: str = "财富关系"
    painting_intention: str = ""
    painting_feeling: str = ""
    final_report_md: str = ""
    final_report: dict[str, Any] = field(default_factory=dict)
    visual_draft: dict[str, Any] | None = None
    recent_followup_turns: list[dict[str, str]] = field(default_factory=list)
    persona: ReportPersona = field(default_factory=ReportPersona)

    def to_dict(self) -> dict[str, Any]:
        return {
            "report_id": self.report_id,
            "report_mode": self.report_mode,
            "theme": self.theme,
            "theme_label": self.theme_label,
            "painting_intention": self.painting_intention,
            "painting_feeling": self.painting_feeling,
            "final_report_md": self.final_report_md,
            "final_report": self.final_report,
            "visual_draft": self.visual_draft,
            "recent_followup_turns": self.recent_followup_turns,
            "persona": self.persona.to_dict(),
        }


@dataclass(frozen=True)
class ReportFollowupInput:
    context: ReportFollowupContext
    question: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "context": self.context.to_dict(),
            "question": self.question,
        }


@dataclass(frozen=True)
class ReportFollowupResult:
    report_id: str
    answer_md: str
    referenced_report_sections: list[dict[str, str]]
    safety: dict[str, Any]
    out_of_scope: bool
    persona: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaAgentResult:
    agent_input: dict[str, Any]
    visual_draft: dict[str, Any]
    prompt_pack_manifest: dict[str, Any]
    final_report: dict[str, Any]
    final_report_md: str
    quality_gate: dict[str, Any]
    run_summary: dict[str, Any]
