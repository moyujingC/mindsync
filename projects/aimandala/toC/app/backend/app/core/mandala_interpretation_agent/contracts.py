"""Contracts for the mandala interpretation agent MVP."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal


REPORT_MODES = {"lite", "pro"}


STAGE_KEYS = [
    "input-context",
    "user-input-context",
    "circle-boundary-context",
    "foundation-image-reading",
    "theme-translation-route",
    "report-thesis-selection",
    "user-facing-framing",
    "report-branching-plan",
    "lite-report-draft",
    "pro-report-draft",
    "visual-assets",
    "final-report-assembly",
]


EXECUTION_BLOCKS = [
    {
        "block_id": "input-and-boundary",
        "stage_keys": STAGE_KEYS[0:3],
    },
    {
        "block_id": "foundation-image-reading",
        "stage_keys": STAGE_KEYS[3:4],
    },
    {
        "block_id": "theme-translation-and-thesis",
        "stage_keys": STAGE_KEYS[4:8],
    },
    {
        "block_id": "report-writing-and-assembly",
        "stage_keys": STAGE_KEYS[8:12],
    },
]


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
    theme: str = "general"
    theme_label: str = "全面解读"
    painting_intention: str = ""
    painting_feeling: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaOutputRequirements:
    language: str = "zh-CN"
    audience: str = "普通用户"
    tone: str = "温和、具体、有解读感"
    forbidden_terms: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class MandalaAgentInput:
    image: MandalaImageInput
    user_context: MandalaUserContext
    circle_boundaries: dict[str, Any]
    report_mode: Literal["lite", "pro"] = "lite"
    agent_version: str = "mandala-interpretation-agent-v1"
    knowledge_pack: dict[str, Any] = field(default_factory=dict)
    output_requirements: MandalaOutputRequirements = field(default_factory=MandalaOutputRequirements)

    def __post_init__(self) -> None:
        if self.report_mode not in REPORT_MODES:
            raise ValueError(f"unsupported report_mode: {self.report_mode}")

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_version": self.agent_version,
            "report_mode": self.report_mode,
            "image": self.image.to_dict(),
            "user_context": self.user_context.to_dict(),
            "circle_boundaries": self.circle_boundaries,
            "knowledge_pack": self.knowledge_pack,
            "output_requirements": self.output_requirements.to_dict(),
        }


@dataclass(frozen=True)
class MandalaAgentResult:
    agent_input: dict[str, Any]
    knowledge_pack: dict[str, Any]
    agent_output: dict[str, Any]
    interpretation_artifacts: dict[str, Any]
    stage_outputs: dict[str, Any]
    execution_trace: list[dict[str, Any]]
    final_report: dict[str, Any]
    final_report_md: str
    report_context_package: dict[str, Any]
    quality_gate: dict[str, Any]
