"""Knowledge-first generation runtime for migrated Lite/Pro report production."""

from __future__ import annotations

import json
from typing import Any

from app.core.llm.runtime import LLMClient, NoopLLMClient

from .data_models import (
    DailyAwareness,
    InterpretationRecord,
    Layer1LiteDraft,
    Layer3ProDraft,
    StoryNode,
    ThemeInsights,
)
from .report_generation_contracts import (
    LiteGenerationBundle,
    ProGenerationBundle,
    ReportGenerationContext,
    StageProcessPackageBlockedError,
)
from app.core.stage_process_contracts import validate_formal_stage_process_package


KNOWN_ENDPOINT_MODEL_RESOLUTIONS = {}


def _block_unless_formal(stage_process_package: Any) -> None:
    try:
        validate_formal_stage_process_package(stage_process_package.payload)
    except ValueError as error:
        raise StageProcessPackageBlockedError(
            "incomplete_stage_process_package",
            stage_process_package=stage_process_package,
            detail={"error": str(error)},
        ) from error


def _ensure_visual_stages(
    generation_context: ReportGenerationContext,
    record: InterpretationRecord,
) -> None:
    if record.stage_process_package is not None:
        payload = record.stage_process_package.payload
        if isinstance(payload, dict):
            stage03 = payload.get("stage-03-visual-evidence", {})
            stage04 = payload.get("stage-04-direct-judgment-high-hit-check", {})
            if (
                isinstance(stage03, dict)
                and stage03.get("status") == "complete"
                and isinstance(stage04, dict)
                and stage04.get("status") == "complete"
            ):
                return
    runtime = getattr(generation_context, "stage_vision_runtime", None)
    if runtime is None or record.image_local_path is None:
        return
    base_package = generation_context.stage_package_assembler.build(
        record,
        target_report="lite",
    )
    record.stage_process_package = base_package
    stage03 = runtime.generate_stage03(
        image_path=record.image_local_path,
        theme=record.theme or "general",
        three_circles=record.three_circles or {"inner_radius": 33, "middle_radius": 66},
    )
    base_package.payload["stage-03-visual-evidence"] = stage03
    if stage03.get("status") == "complete":
        base_package.payload["stage-04-direct-judgment-high-hit-check"] = (
            runtime.generate_stage04(
                image_path=record.image_local_path,
                stage03=stage03,
            )
        )


class DeterministicReportGenerationRuntime:
    """Knowledge-first runtime for Lite/Pro generation."""

    def generate_lite(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        _ensure_visual_stages(generation_context, record)
        stage_process_package = generation_context.stage_package_assembler.build(
            record,
            target_report="lite",
        )
        record.stage_process_package = stage_process_package
        _block_unless_formal(stage_process_package)
        layer_1_lite_draft = generation_context._build_layer1_placeholder(record)
        record.layer_1_lite_draft = layer_1_lite_draft
        layer_2_lite_final = generation_context._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            stage_process_package=stage_process_package,
            layer_1_lite_draft=layer_1_lite_draft,
            layer_2_lite_final=layer_2_lite_final,
        )

    def generate_pro(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        if record.stage_process_package is not None:
            _block_unless_formal(record.stage_process_package)
        layer_3_pro_draft = generation_context._build_pro_placeholder_draft(record)
        record.layer_3_pro_draft = layer_3_pro_draft
        layer_4_pro_final = generation_context._build_pro_placeholder_report(record)
        return ProGenerationBundle(
            layer_3_pro_draft=layer_3_pro_draft,
            layer_4_pro_final=layer_4_pro_final,
        )


class LLMReportGenerationRuntime:
    """LLM-backed runtime that blocks when chat generation is unavailable."""

    LITE_REQUIRED_FIELDS = [
        "title",
        "overall_impression",
        "visual_elements",
        "emotion_portrait",
        "story",
        "theme_scene",
        "theme_impact",
        "theme_awareness",
        "three_awareness",
        "pro_teaser",
    ]
    PRO_REQUIRED_FIELDS = [
        "first_impression",
        "core_insight_table",
        "three_circles_detailed",
        "micro_analysis_detailed",
        "imbalance_confirmed",
        "root_cause",
        "healing_suggestions",
    ]

    def __init__(self, *, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or NoopLLMClient()

    def generate_lite(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> LiteGenerationBundle:
        _ensure_visual_stages(generation_context, record)
        stage_process_package = generation_context.stage_package_assembler.build(
            record,
            target_report="lite",
        )
        record.stage_process_package = stage_process_package
        _block_unless_formal(stage_process_package)
        deterministic_draft = generation_context._build_layer1_placeholder(record)
        record.layer_1_lite_draft = deterministic_draft

        lite_payload = self._run_chat_generation(
            prompt=str(getattr(deterministic_draft, "prompt_preview", "") or ""),
            report_mode="lite",
            required_fields=self.LITE_REQUIRED_FIELDS,
            record=record,
        )
        layer_1_lite_draft = self._apply_lite_payload(
            deterministic_draft,
            lite_payload,
        )
        record.layer_1_lite_draft = layer_1_lite_draft
        layer_2_lite_final = generation_context._build_lite_placeholder_report(record)
        return LiteGenerationBundle(
            stage_process_package=stage_process_package,
            layer_1_lite_draft=layer_1_lite_draft,
            layer_2_lite_final=layer_2_lite_final,
        )

    def generate_pro(
        self,
        generation_context: ReportGenerationContext,
        record: InterpretationRecord,
    ) -> ProGenerationBundle:
        record.stage_process_package = generation_context.stage_package_assembler.build(
            record,
            target_report="pro",
        )
        _block_unless_formal(record.stage_process_package)
        deterministic_draft = generation_context._build_pro_placeholder_draft(record)
        record.layer_3_pro_draft = deterministic_draft

        pro_payload = self._run_chat_generation(
            prompt=str(getattr(deterministic_draft, "prompt_preview", "") or ""),
            report_mode="pro",
            required_fields=self.PRO_REQUIRED_FIELDS,
            record=record,
        )
        layer_3_pro_draft = self._apply_pro_payload(
            deterministic_draft,
            pro_payload,
        )
        record.layer_3_pro_draft = layer_3_pro_draft
        layer_4_pro_final = generation_context._build_pro_placeholder_report(record)
        return ProGenerationBundle(
            layer_3_pro_draft=layer_3_pro_draft,
            layer_4_pro_final=layer_4_pro_final,
        )

    def _run_chat_generation(
        self,
        *,
        prompt: str,
        report_mode: str,
        required_fields: list[str],
        record: InterpretationRecord,
    ) -> dict[str, Any]:
        user_prompt = prompt.strip()
        if not user_prompt:
            error = f"chat_generation_failed_blocking:{report_mode}:missing_prompt_preview"
            self._write_chat_trace(record, report_mode=report_mode, error=error)
            raise RuntimeError(error)

        system_prompt = (
            "你是一名严格遵循合同结构的曼陀罗报告生成助手。"
            "你会基于给定 prompt 生成结构化报告内容。"
            "只允许输出一个 JSON 对象，不要输出代码块或额外说明。"
        )
        raw = self.llm_client.generate_text(
            task="chat",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        if not isinstance(raw, str) or not raw.strip():
            error = f"chat_generation_failed_blocking:{report_mode}:empty_response"
            self._write_chat_trace(record, report_mode=report_mode, error=error)
            raise RuntimeError(error)

        parsed = self._parse_json_payload(raw)
        if not isinstance(parsed, dict):
            error = f"chat_generation_failed_blocking:{report_mode}:non_json_response"
            self._write_chat_trace(record, report_mode=report_mode, error=error)
            raise RuntimeError(error)

        payload = self._extract_report_payload(parsed, report_mode=report_mode)
        if not isinstance(payload, dict):
            error = f"chat_generation_failed_blocking:{report_mode}:invalid_payload"
            self._write_chat_trace(record, report_mode=report_mode, error=error)
            raise RuntimeError(error)

        missing_fields = [
            field_name
            for field_name in required_fields
            if self._is_missing(payload.get(field_name))
        ]
        if missing_fields:
            error = (
                "chat_generation_failed_blocking:"
                f"{report_mode}:missing_fields:{','.join(missing_fields)}"
            )
            self._write_chat_trace(record, report_mode=report_mode, error=error)
            raise RuntimeError(error)

        self._write_chat_trace(record, report_mode=report_mode, error=None)
        return payload

    def _apply_lite_payload(
        self,
        fallback_layer: Layer1LiteDraft,
        payload: dict[str, Any],
    ) -> Layer1LiteDraft:
        layer = fallback_layer
        layer.title = self._as_text(payload.get("title"), fallback=layer.title)
        layer.overall_impression = self._as_text(
            payload.get("overall_impression"),
            fallback=layer.overall_impression,
        )
        layer.visual_elements = self._as_text(
            payload.get("visual_elements"),
            fallback=layer.visual_elements,
        )
        layer.emotion_portrait = self._as_text(
            payload.get("emotion_portrait"),
            fallback=layer.emotion_portrait,
        )

        story_payload = payload.get("story")
        if isinstance(story_payload, dict):
            layer.story.base = StoryNode(
                content=self._as_text(
                    story_payload.get("base"),
                    fallback=layer.story.base.content,
                )
            )
            layer.story.contradiction = StoryNode(
                content=self._as_text(
                    story_payload.get("contradiction"),
                    fallback=layer.story.contradiction.content,
                )
            )
            layer.story.pattern = StoryNode(
                content=self._as_text(
                    story_payload.get("pattern"),
                    fallback=layer.story.pattern.content,
                )
            )
            layer.story.defense = StoryNode(
                content=self._as_text(
                    story_payload.get("defense"),
                    fallback=layer.story.defense.content,
                )
            )
            layer.story.block = StoryNode(
                content=self._as_text(
                    story_payload.get("block"),
                    fallback=layer.story.block.content,
                )
            )
            layer.story.light = StoryNode(
                content=self._as_text(
                    story_payload.get("light"),
                    fallback=layer.story.light.content,
                )
            )

        layer.theme_insights = ThemeInsights(
            scene=self._as_text(
                payload.get("theme_scene"),
                fallback=layer.theme_insights.scene,
            ),
            impact=self._as_text(
                payload.get("theme_impact"),
                fallback=layer.theme_insights.impact,
            ),
            awareness=self._as_text(
                payload.get("theme_awareness"),
                fallback=layer.theme_insights.awareness,
            ),
        )
        layer.three_awareness = self._build_awareness_items(
            payload.get("three_awareness"),
            fallback=layer.three_awareness,
        )
        layer.pro_teaser = self._as_text(
            payload.get("pro_teaser"),
            fallback=layer.pro_teaser,
        )
        return layer

    def _apply_pro_payload(
        self,
        fallback_layer: Layer3ProDraft,
        payload: dict[str, Any],
    ) -> Layer3ProDraft:
        layer = fallback_layer
        layer.first_impression = self._as_text(
            payload.get("first_impression"),
            fallback=layer.first_impression,
        )
        layer.core_insight_table = self._as_dict_of_text(
            payload.get("core_insight_table"),
            fallback=layer.core_insight_table,
        )
        layer.three_circles_detailed = self._as_nested_dict(
            payload.get("three_circles_detailed"),
            fallback=layer.three_circles_detailed,
        )
        layer.micro_analysis_detailed = self._as_dict_of_text(
            payload.get("micro_analysis_detailed"),
            fallback=layer.micro_analysis_detailed,
        )
        layer.imbalance_confirmed = self._as_nested_dict(
            payload.get("imbalance_confirmed"),
            fallback=layer.imbalance_confirmed,
        )
        layer.root_cause = self._as_dict_of_text(
            payload.get("root_cause"),
            fallback=layer.root_cause,
        )
        layer.healing_suggestions = self._build_healing_suggestions(
            payload.get("healing_suggestions"),
            fallback=layer.healing_suggestions,
        )
        return layer

    def _build_awareness_items(
        self,
        value: Any,
        *,
        fallback: list[Any],
    ) -> list[DailyAwareness]:
        if not isinstance(value, list):
            return fallback
        items: list[DailyAwareness] = []
        for index, item in enumerate(value, start=1):
            if not isinstance(item, dict):
                continue
            title = self._as_text(item.get("title"))
            content = self._as_text(item.get("content"))
            if not title and not content:
                continue
            raw_day = item.get("day")
            day = int(raw_day) if isinstance(raw_day, int) else index
            items.append(
                DailyAwareness(
                    day=day,
                    title=title,
                    content=content,
                )
            )
        return items or fallback

    def _build_healing_suggestions(
        self,
        value: Any,
        *,
        fallback: list[dict[str, Any]],
    ) -> list[dict[str, str]]:
        if not isinstance(value, list):
            return fallback
        items: list[dict[str, str]] = []
        for item in value:
            if not isinstance(item, dict):
                continue
            phase = self._as_text(item.get("phase"))
            focus = self._as_text(item.get("focus"))
            practice = self._as_text(item.get("practice"))
            if not phase and not focus and not practice:
                continue
            items.append(
                {
                    "phase": phase,
                    "focus": focus,
                    "practice": practice,
                }
            )
        return items or fallback

    def _extract_report_payload(
        self,
        payload: dict[str, Any],
        *,
        report_mode: str,
    ) -> dict[str, Any] | None:
        direct_keys = (
            self.LITE_REQUIRED_FIELDS
            if report_mode == "lite"
            else self.PRO_REQUIRED_FIELDS
        )
        if any(key in payload for key in direct_keys):
            return payload
        nested = payload.get(report_mode)
        if isinstance(nested, dict):
            return nested
        nested = payload.get("draft")
        if isinstance(nested, dict):
            return nested
        nested = payload.get("structured")
        if isinstance(nested, dict):
            return nested
        return payload if payload else None

    def _write_chat_trace(
        self,
        record: InterpretationRecord,
        *,
        report_mode: str,
        error: str | None,
    ) -> None:
        if record.stage_process_package is None:
            return
        payload = record.stage_process_package.payload
        process_contract = (
            payload.get("process_contract")
            if isinstance(payload.get("process_contract"), dict)
            else {}
        )
        model_trace = (
            process_contract.get("model_trace")
            if isinstance(process_contract.get("model_trace"), dict)
            else {}
        )
        chat_by_mode = (
            model_trace.get("chat_by_mode")
            if isinstance(model_trace.get("chat_by_mode"), dict)
            else {}
        )
        chat_by_mode[report_mode] = {
            "report_mode": report_mode,
            "endpoint_id": self._resolve_llm_endpoint_id(task="chat"),
            "resolved_model": self._resolve_llm_model(task="chat"),
            "source": "llm_chat_generation" if error is None else "chat_generation_failed_blocking",
            "prompt_version": "stage-current",
            "error": error or "",
        }
        model_trace["chat_by_mode"] = chat_by_mode
        process_contract["model_trace"] = model_trace
        payload["process_contract"] = process_contract

    def _resolve_llm_model(self, *, task: str) -> str:
        config = getattr(self.llm_client, "config", None)
        if config is None or not hasattr(config, "resolve_task_config"):
            return ""
        try:
            task_config = config.resolve_task_config(task)
        except Exception:
            return ""
        model = str(getattr(task_config, "model", "") or "").strip()
        return KNOWN_ENDPOINT_MODEL_RESOLUTIONS.get(model, model)

    def _resolve_llm_endpoint_id(self, *, task: str) -> str:
        config = getattr(self.llm_client, "config", None)
        if config is None or not hasattr(config, "resolve_task_config"):
            return ""
        try:
            task_config = config.resolve_task_config(task)
        except Exception:
            return ""
        model = str(getattr(task_config, "model", "") or "").strip()
        return model if model.startswith("ep-") else ""

    def _parse_json_payload(self, raw: str) -> dict[str, Any] | None:
        candidate = raw.strip()
        if candidate.startswith("```"):
            candidate = self._strip_code_fence(candidate)
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            extracted = self._extract_json_object(candidate)
            if not extracted:
                return None
            try:
                parsed = json.loads(extracted)
            except json.JSONDecodeError:
                return None
        return parsed if isinstance(parsed, dict) else None

    def _strip_code_fence(self, text: str) -> str:
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()

    def _extract_json_object(self, text: str) -> str:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return ""
        return text[start : end + 1]

    def _is_missing(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str):
            return not value.strip()
        if isinstance(value, (list, tuple, dict, set)):
            return len(value) == 0
        return False

    def _as_text(self, value: Any, *, fallback: str = "") -> str:
        if isinstance(value, str):
            return value.strip() or fallback
        return fallback

    def _as_dict_of_text(
        self,
        value: Any,
        *,
        fallback: dict[str, Any],
    ) -> dict[str, str]:
        if not isinstance(value, dict):
            return fallback
        result: dict[str, str] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                continue
            text = self._as_text(item)
            if text:
                result[key] = text
        return result or fallback

    def _as_nested_dict(
        self,
        value: Any,
        *,
        fallback: dict[str, Any],
    ) -> dict[str, Any]:
        if not isinstance(value, dict):
            return fallback
        result: dict[str, Any] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                continue
            if isinstance(item, dict):
                result[key] = {
                    inner_key: inner_value
                    for inner_key, inner_value in item.items()
                    if isinstance(inner_key, str)
                }
            elif isinstance(item, list):
                result[key] = [entry for entry in item]
            elif isinstance(item, str):
                result[key] = item.strip()
            else:
                result[key] = item
        return result or fallback
