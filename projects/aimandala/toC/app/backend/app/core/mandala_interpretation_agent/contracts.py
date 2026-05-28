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
class MandalaAgentInput:
    image: MandalaImageInput
    user_context: MandalaUserContext
    circle_boundaries: dict[str, Any]
    report_mode: Literal["lite", "pro"] = "lite"
    agent_version: str = "mandala-e2e-agent-v1"
    prompt_pack_id: str = "topic-report-v1.0.0"
    agent_variant: str = "two_pass_e2e"
    output_requirements: MandalaOutputRequirements = field(default_factory=MandalaOutputRequirements)

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
        }


@dataclass(frozen=True)
class MandalaAgentResult:
    agent_input: dict[str, Any]
    visual_draft: dict[str, Any]
    prompt_pack_manifest: dict[str, Any]
    final_report: dict[str, Any]
    final_report_md: str
    quality_gate: dict[str, Any]
    run_summary: dict[str, Any]
