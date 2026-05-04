"""Migrated Lite/Pro prompt builder for the V2 report chain."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


class PromptTemplate:
    """Load prompt templates and schema files from disk."""

    def __init__(self, version: str = "1.6", report_type: str = "lite"):
        self.version = version
        self.report_type = report_type
        self._template_cache: str | None = None
        self._schema_cache: dict[str, Any] | None = None

    @property
    def _template_dir(self) -> Path:
        return Path(__file__).parent / "templates"

    @property
    def _schema_dir(self) -> Path:
        return Path(__file__).parent / "schemas"

    def load(self) -> str:
        if self._template_cache is None:
            template_path = self._template_dir / f"{self.report_type}_v{self.version}.md"
            if not template_path.exists():
                template_path = self._find_latest_template()
            if not template_path.exists():
                raise FileNotFoundError(f"模板文件不存在: {template_path}")
            self._template_cache = template_path.read_text(encoding="utf-8")
        return self._template_cache

    def load_schema(self) -> dict[str, Any]:
        if self._schema_cache is None:
            schema_path = self._schema_dir / f"{self.report_type}_v{self.version}.yaml"
            if schema_path.exists():
                self._schema_cache = yaml.safe_load(schema_path.read_text(encoding="utf-8")) or {}
            else:
                self._schema_cache = {}
        return self._schema_cache

    def _find_latest_template(self) -> Path:
        pattern = f"{self.report_type}_v*.md"
        templates = sorted(self._template_dir.glob(pattern))
        if not templates:
            raise FileNotFoundError(f"未找到 {self.report_type} 类型的模板文件")
        return templates[-1]

    def reload(self) -> None:
        self._template_cache = None
        self._schema_cache = None

    def build(self, context: dict[str, Any]) -> str:
        template = self.load()
        for key, value in context.items():
            template = template.replace(f"{{{{{key}}}}}", str(value))
        return template


class PromptBuilder:
    """Compatibility wrapper around template-based prompt files."""

    def __init__(self):
        self._template_cache: dict[str, PromptTemplate] = {}

    def get_template(self, version: str, report_type: str = "lite") -> PromptTemplate:
        key = f"{report_type}_{version}"
        if key not in self._template_cache:
            self._template_cache[key] = PromptTemplate(version=version, report_type=report_type)
        return self._template_cache[key]

    def build_lite(
        self,
        *,
        vision_data: str,
        theme: str = "general",
        theme_context: str = "",
        knowledge_skeleton: str = "",
        version: str = "1.6",
        extra_context: dict[str, Any] | None = None,
    ) -> str:
        template = self.get_template(version, "lite")
        context: dict[str, Any] = {
            "vision_data": vision_data,
            "theme": theme,
            "theme_context": theme_context,
            "knowledge_skeleton": knowledge_skeleton,
        }
        if extra_context:
            context.update(extra_context)
        return template.build(context)

    def build_pro(
        self,
        *,
        vision_data: str,
        theme: str = "general",
        theme_context: str = "",
        knowledge_skeleton: str = "",
        version: str = "1.6",
        extra_context: dict[str, Any] | None = None,
    ) -> str:
        template = self.get_template(version, "pro")
        context: dict[str, Any] = {
            "vision_data": vision_data,
            "theme": theme,
            "theme_context": theme_context,
            "knowledge_skeleton": knowledge_skeleton,
        }
        if extra_context:
            context.update(extra_context)
        return template.build(context)


def build_prompt(
    *,
    report_type: str,
    vision_data: str,
    theme: str = "general",
    theme_context: str = "",
    knowledge_skeleton: str = "",
    version: str = "1.6",
    extra_context: dict[str, Any] | None = None,
) -> str:
    builder = PromptBuilder()
    if report_type == "lite":
        return builder.build_lite(
            vision_data=vision_data,
            theme=theme,
            theme_context=theme_context,
            knowledge_skeleton=knowledge_skeleton,
            version=version,
            extra_context=extra_context,
        )
    return builder.build_pro(
        vision_data=vision_data,
        theme=theme,
        theme_context=theme_context,
        knowledge_skeleton=knowledge_skeleton,
        version=version,
        extra_context=extra_context,
    )
