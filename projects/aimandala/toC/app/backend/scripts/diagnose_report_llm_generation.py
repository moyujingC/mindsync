"""Diagnose LLM-backed Lite/Pro report generation without running the full export."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import tempfile
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.knowledge_runtime.runtime import create_knowledge_runtime  # noqa: E402
from app.core.knowledge_runtime.workbench import KnowledgeWorkbench  # noqa: E402
from app.core.llm.runtime import create_llm_client_from_env  # noqa: E402
from app.core.pipeline.generation_runtime import LLMReportGenerationRuntime  # noqa: E402
from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator  # noqa: E402
from app.core.pipeline.store import InterpretationStore  # noqa: E402

MAX_PROMPT_PREVIEW_CHARS = 2000


async def _run(args: argparse.Namespace) -> dict[str, Any]:
    workbench = KnowledgeWorkbench()
    fixture = workbench.load_fixture(args.fixture_id)
    input_payload = fixture.get("input", {}) if isinstance(fixture.get("input"), dict) else {}

    llm_client = create_llm_client_from_env()
    runtime = create_knowledge_runtime(
        build_selector=args.build_selector,
        llm_client=llm_client,
    )

    with tempfile.TemporaryDirectory(prefix="aimandala-llm-diag-") as temp_dir:
        store = InterpretationStore(storage_dir=str(Path(temp_dir) / "interpretations"))
        orchestrator = LayeredOrchestrator(
            store=store,
            knowledge_runtime=runtime,
            enable_vision=False,
        )
        record = await orchestrator.prepare_lite_record(
            image_path=str(workbench._resolve_path(input_payload.get("image_path"))),
            user_id=str(input_payload.get("user_profile") or f"{fixture.get('id')}-user"),
            theme=str(fixture.get("theme") or input_payload.get("theme") or "general"),
            painting_intention=workbench._resolve_fixture_user_intention(fixture),
            painting_feeling=workbench._resolve_fixture_user_feeling(fixture),
            three_circles=workbench._build_three_circle_override(input_payload),
        )
        generation_runtime = LLMReportGenerationRuntime(llm_client=llm_client)
        required_fields = (
            LLMReportGenerationRuntime.LITE_REQUIRED_FIELDS
            if args.version == "lite"
            else LLMReportGenerationRuntime.PRO_REQUIRED_FIELDS
        )
        result: dict[str, Any] = {
            "fixture_id": args.fixture_id,
            "build_selector": args.build_selector,
            "version": args.version,
            "pack_id": runtime.repository.load_index().get("pack_id"),
            "schema_version": runtime.repository.load_index().get("schema_version"),
            "required_fields": required_fields,
            "llm_client": type(llm_client).__name__,
            "llm_config": _safe_llm_config(llm_client),
            "record_meta": _record_meta(record),
        }
        if args.plan_only:
            record.layer_0_raw = orchestrator._build_layer0_placeholder(record)
            if args.version == "lite":
                draft = orchestrator._build_layer1_placeholder(record)
                record.layer_1_lite_draft = draft
            else:
                record.layer_1_lite_draft = orchestrator._build_layer1_placeholder(record)
                record.layer_2_lite_final = orchestrator._build_lite_placeholder_report(record)
                draft = orchestrator._build_pro_placeholder_draft(record)
                record.layer_3_pro_draft = draft
            prompt = str(getattr(draft, "prompt_preview", "") or "")
            result["prompt_chars"] = len(prompt)
            result["prompt_preview"] = prompt[:MAX_PROMPT_PREVIEW_CHARS]
            result["status"] = "plan_only"
            return result

        try:
            if args.version == "lite":
                bundle = generation_runtime.generate_lite(orchestrator, record)
                payload = _layer1_payload(bundle.layer_1_lite_draft)
            else:
                lite_bundle = generation_runtime.generate_lite(orchestrator, record)
                payload = _layer1_payload(lite_bundle.layer_1_lite_draft)
                record.layer_2_lite_final = lite_bundle.layer_2_lite_final
                pro_bundle = generation_runtime.generate_pro(orchestrator, record)
                payload = _layer3_payload(pro_bundle.layer_3_pro_draft)
        except Exception as error:  # noqa: BLE001 - diagnostic script
            result["status"] = "failed"
            result["error"] = str(error)
            result["last_error_detail"] = getattr(llm_client, "last_error_detail", {})
            result["last_attempt_trace"] = getattr(llm_client, "last_attempt_trace", [])
            result["chat_trace"] = _extract_chat_trace(record, args.version)
            result.update(_prompt_diagnostics(record, args.version))
            result["layer0_failure_reason"] = getattr(record.layer_0_raw, "layer0_failure_reason", "") if record.layer_0_raw else ""
            result["layer0_failure_detail"] = getattr(record.layer_0_raw, "layer0_failure_detail", {}) if record.layer_0_raw else {}
            return result

        result["status"] = "ok"
        result["payload_keys"] = sorted(payload.keys())
        result["missing_fields"] = [
            field for field in required_fields if generation_runtime._is_missing(payload.get(field))
        ]
        result["last_attempt_trace"] = getattr(llm_client, "last_attempt_trace", [])
        result["chat_trace"] = _extract_chat_trace(record, args.version)
        result["payload_excerpt"] = json.dumps(payload, ensure_ascii=False)[:1200]
        result.update(_prompt_diagnostics(record, args.version))
        return result


def _safe_llm_config(llm_client: Any) -> dict[str, Any]:
    config = getattr(llm_client, "config", None)
    if config is None:
        return {}
    default = getattr(config, "default", None)
    chat = getattr(config, "chat", None)
    return {
        "default_base_url": getattr(default, "base_url", ""),
        "default_model": getattr(default, "model", ""),
        "chat_base_url": getattr(chat, "base_url", "") if chat else "",
        "chat_model": getattr(chat, "model", "") if chat else "",
        "timeout_seconds": getattr(config, "timeout_seconds", None),
        "max_retries": getattr(config, "max_retries", None),
    }


def _record_meta(record: Any) -> dict[str, Any]:
    return {
        "interpretation_id": getattr(record, "interpretation_id", ""),
        "theme": getattr(record, "theme", ""),
        "status": getattr(record, "status", ""),
        "user_id": getattr(record, "user_id", ""),
        "image_hash": getattr(record, "image_hash", ""),
        "three_circles": getattr(record, "three_circles", {}),
    }


def _layer1_payload(draft: Any) -> dict[str, Any]:
    if draft is None:
        return {}
    story = getattr(draft, "story", None)
    return {
        "title": getattr(draft, "title", ""),
        "overall_impression": getattr(draft, "overall_impression", ""),
        "visual_elements": getattr(draft, "visual_elements", ""),
        "emotion_portrait": getattr(draft, "emotion_portrait", ""),
        "story": {
            "base": getattr(getattr(story, "base", None), "content", ""),
            "contradiction": getattr(getattr(story, "contradiction", None), "content", ""),
            "pattern": getattr(getattr(story, "pattern", None), "content", ""),
            "defense": getattr(getattr(story, "defense", None), "content", ""),
            "block": getattr(getattr(story, "block", None), "content", ""),
            "light": getattr(getattr(story, "light", None), "content", ""),
        },
        "theme_scene": getattr(getattr(draft, "theme_insights", None), "scene", ""),
        "theme_impact": getattr(getattr(draft, "theme_insights", None), "impact", ""),
        "theme_awareness": getattr(getattr(draft, "theme_insights", None), "awareness", ""),
        "three_awareness": [
            {
                "day": getattr(item, "day", 0),
                "title": getattr(item, "title", ""),
                "content": getattr(item, "content", ""),
            }
            for item in getattr(draft, "three_awareness", []) or []
        ],
        "pro_teaser": getattr(draft, "pro_teaser", ""),
    }


def _layer3_payload(draft: Any) -> dict[str, Any]:
    if draft is None:
        return {}
    return {
        "first_impression": getattr(draft, "first_impression", ""),
        "core_insight_table": getattr(draft, "core_insight_table", {}),
        "three_circles_detailed": getattr(draft, "three_circles_detailed", {}),
        "micro_analysis_detailed": getattr(draft, "micro_analysis_detailed", {}),
        "imbalance_confirmed": getattr(draft, "imbalance_confirmed", {}),
        "root_cause": getattr(draft, "root_cause", {}),
        "healing_suggestions": getattr(draft, "healing_suggestions", []),
    }


def _extract_prompt_preview(record: Any, version: str) -> str:
    if version == "lite":
        draft = getattr(record, "layer_1_lite_draft", None)
    else:
        draft = getattr(record, "layer_3_pro_draft", None)
    return str(getattr(draft, "prompt_preview", "") or "")


def _prompt_diagnostics(record: Any, version: str) -> dict[str, Any]:
    prompt = _extract_prompt_preview(record, version)
    return {
        "prompt_chars": len(prompt),
        "prompt_preview": prompt[:MAX_PROMPT_PREVIEW_CHARS],
        "prompt_preview_truncated": len(prompt) > MAX_PROMPT_PREVIEW_CHARS,
    }


def _extract_chat_trace(record: Any, version: str) -> dict[str, Any]:
    layer0 = getattr(record, "layer_0_raw", None)
    projection = getattr(layer0, "theme_projection", {}) if layer0 is not None else {}
    if not isinstance(projection, dict):
        return {}
    model_trace = projection.get("model_trace", {})
    if not isinstance(model_trace, dict):
        return {}
    by_mode = model_trace.get("chat_by_mode", {})
    if not isinstance(by_mode, dict):
        return {}
    trace = by_mode.get(version, {})
    return trace if isinstance(trace, dict) else {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture-id", required=True)
    parser.add_argument("--build-selector", required=True)
    parser.add_argument("--version", choices=["lite", "pro"], required=True)
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--output-path")
    args = parser.parse_args()

    result = asyncio.run(_run(args))
    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output_path:
        path = Path(args.output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0 if result.get("status") in {"ok", "plan_only"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
