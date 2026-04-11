"""Contracts for the v2.1 knowledge runtime."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class FallbackLevel(str, Enum):
    """Normalized fallback levels for runtime knowledge queries."""

    NONE = "none"
    THEMED = "themed"
    GENERAL = "general"
    GENERATED = "generated"


@dataclass
class QueryResult:
    """Structured runtime query result with legacy compatibility fields."""

    value: Any = None
    entity_id: str = ""
    source_pack: str = "v2.1"
    fallback_level: str = FallbackLevel.NONE.value
    evidence: list[dict[str, Any]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    found: bool = True
    data: Any = None
    source: str = "primary"
    fallback_used: bool = False

    def __post_init__(self) -> None:
        if self.value is None and self.data is not None:
            self.value = self.data
        if self.data is None:
            self.data = self.value
        if self.fallback_level == FallbackLevel.NONE.value and self.fallback_used:
            self.fallback_level = self._fallback_level_from_source(self.source)
        self.fallback_used = self.fallback_used or (
            self.fallback_level != FallbackLevel.NONE.value
        )
        if not self.found and self.value is None and self.data is None:
            self.value = None
            self.data = None

    @classmethod
    def not_found(
        cls,
        message: str = "未找到",
        *,
        entity_id: str = "",
        warnings: list[str] | None = None,
    ) -> "QueryResult":
        return cls(
            value=message,
            data=message,
            entity_id=entity_id,
            found=False,
            source="none",
            fallback_level=FallbackLevel.GENERATED.value,
            fallback_used=True,
            warnings=warnings or [message],
        )

    @classmethod
    def from_generated(
        cls,
        value: Any,
        *,
        entity_id: str = "",
        evidence: list[dict[str, Any]] | None = None,
        warnings: list[str] | None = None,
    ) -> "QueryResult":
        return cls(
            value=value,
            data=value,
            entity_id=entity_id,
            fallback_level=FallbackLevel.GENERATED.value,
            source="generated",
            fallback_used=True,
            evidence=evidence or [],
            warnings=warnings or [],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "value": self.value,
            "entity_id": self.entity_id,
            "source_pack": self.source_pack,
            "fallback_level": self.fallback_level,
            "evidence": self.evidence,
            "warnings": self.warnings,
            "found": self.found,
            "data": self.data,
            "source": self.source,
            "fallback_used": self.fallback_used,
        }

    def _fallback_level_from_source(self, source: str) -> str:
        if source == "theme":
            return FallbackLevel.THEMED.value
        if source in {"fallback", "general"}:
            return FallbackLevel.GENERAL.value
        if source in {"generated", "none"}:
            return FallbackLevel.GENERATED.value
        return FallbackLevel.NONE.value

