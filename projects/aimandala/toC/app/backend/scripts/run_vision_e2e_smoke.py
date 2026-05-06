"""Run Aimandala vision-backed V2 API end-to-end smoke checks."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
REPO_ROOT = Path(__file__).resolve().parents[6]
DEFAULT_OUTPUT_DIR = AIMANDALA_ROOT / "docs" / "qa" / "model-evals" / "2026-05-06-vision-e2e-smoke"
DEFAULT_FIXTURE_IDS = [
    "toc-mvp-fixture-003",
    "toc-mvp-fixture-006",
    "toc-mvp-fixture-008",
]
DEFAULT_ENV_FILES = [
    BACKEND_ROOT / ".env.local",
    AIMANDALA_ROOT / ".env.local",
]

sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from scripts.run_vision_model_evals import load_fixtures  # noqa: E402


def _parse_env_file_line(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return None
    if stripped.startswith("export "):
        stripped = stripped[len("export ") :].strip()
    if "=" not in stripped:
        return None
    key, value = stripped.split("=", 1)
    key = key.strip()
    if not key:
        return None
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    return key, value


def load_env_file(path: Path, *, override: bool = False) -> list[str]:
    """Load simple KEY=VALUE env files without logging secret values."""
    if not path.exists():
        raise RuntimeError(f"Env file does not exist: {path}")
    loaded: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        parsed = _parse_env_file_line(line)
        if not parsed:
            continue
        key, value = parsed
        if override or key not in os.environ:
            os.environ[key] = value
        loaded.append(key)
    return loaded


def load_smoke_env(env_file: Path | None = None) -> list[str]:
    configured_path = env_file or (
        Path(os.environ["AIMANDALA_SMOKE_ENV_FILE"]).expanduser()
        if os.getenv("AIMANDALA_SMOKE_ENV_FILE")
        else None
    )
    if configured_path:
        return load_env_file(configured_path.expanduser())

    loaded: list[str] = []
    for default_path in DEFAULT_ENV_FILES:
        if default_path.exists():
            loaded.extend(load_env_file(default_path))
    return loaded


def _reset_api_state() -> None:
    from app.api import routes_v2

    routes_v2._orchestrator = None
    routes_v2._upload_storage = None
    routes_v2._knowledge_workbench = None
    routes_v2._miniapp_stub_store = None
    routes_v2._active_pro_upgrade_jobs.clear()
    shutil.rmtree(BACKEND_ROOT / "data", ignore_errors=True)


def _install_smoke_orchestrator() -> None:
    from app.api import routes_v2
    from app.core.analysis.circle_detector import CircleDetector
    from app.core.llm import LLMCircleDetectionBackend, create_llm_client_from_env
    from app.core.pipeline.generation_runtime import DeterministicReportGenerationRuntime
    from app.core.pipeline.orchestrator_v2 import LayeredOrchestrator

    llm_client = create_llm_client_from_env()
    routes_v2._orchestrator = LayeredOrchestrator(
        circle_detector=CircleDetector(detector_backend=LLMCircleDetectionBackend(llm_client)),
        generation_runtime=DeterministicReportGenerationRuntime(),
        report_chat_runtime=None,
        enable_vision=True,
    )


def configure_vision_env_from_existing_keys() -> None:
    os.environ.setdefault("AIMANDALA_LLM_BACKEND", "openai_compatible")
    os.environ.setdefault("AIMANDALA_LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    os.environ.setdefault("AIMANDALA_LLM_MODEL", "qwen-vl-max-latest")
    os.environ.setdefault("AIMANDALA_LLM_API_KEY", os.getenv("DASHSCOPE_API_KEY", ""))
    os.environ.setdefault("AIMANDALA_LLM_VISION_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    os.environ.setdefault("AIMANDALA_LLM_VISION_MODEL", "qwen-vl-max-latest")
    os.environ.setdefault("AIMANDALA_LLM_VISION_API_KEY", os.getenv("DASHSCOPE_API_KEY", ""))
    os.environ.setdefault("AIMANDALA_LLM_VISION_FALLBACK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    os.environ.setdefault("AIMANDALA_LLM_VISION_FALLBACK_MODEL", "ep-20260316095322-94wf5")
    os.environ.setdefault("AIMANDALA_LLM_VISION_FALLBACK_API_KEY", os.getenv("DOUBAO_API_KEY", ""))
    os.environ.setdefault("AIMANDALA_LLM_TIMEOUT_SECONDS", "45")
    os.environ.setdefault("AIMANDALA_LLM_MAX_RETRIES", "1")
    os.environ.setdefault("AIMANDALA_LLM_RETRY_BACKOFF_MS", "500")
    os.environ.setdefault("AIMANDALA_UPLOAD_BACKEND", "local")


def validate_vision_env() -> None:
    missing = [
        name
        for name in [
            "AIMANDALA_LLM_VISION_API_KEY",
            "AIMANDALA_LLM_VISION_FALLBACK_API_KEY",
        ]
        if not os.getenv(name, "").strip()
    ]
    if missing:
        raise RuntimeError(
            "Missing vision smoke API key env: " + ", ".join(missing)
        )


def _post_upload(client: TestClient, image_path: Path) -> dict[str, Any]:
    with image_path.open("rb") as image_file:
        response = client.post(
            "/api/v2/upload-image",
            files={
                "file": (
                    image_path.name,
                    image_file,
                    _guess_content_type(image_path),
                )
            },
        )
    response.raise_for_status()
    return response.json()


def _guess_content_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".png":
        return "image/png"
    return "application/octet-stream"


def _build_fixture_user_context(fixture: Any) -> dict[str, str]:
    """Use user-like context in smoke runs so QA evidence is not polluted by test meta text."""
    theme = getattr(fixture, "theme", None) or "general"
    if theme == "general":
        return {
            "painting_intention": "想更看清自己现在的状态，也想知道接下来怎么更稳地往前。",
            "painting_feeling": "先如实看看这张画带出来的感受，不急着下结论。",
        }
    return {
        "painting_intention": "想更看清自己在这个议题上的状态，也想知道接下来怎么更稳地往前。",
        "painting_feeling": "先如实看看这张画带出来的感受，不急着下结论。",
    }


def _wait_for_pro_report(
    client: TestClient,
    interpretation_id: str,
    *,
    attempts: int = 30,
    delay_seconds: float = 0.1,
) -> dict[str, Any] | None:
    last_payload: dict[str, Any] | None = None
    for _ in range(attempts):
        response = client.get(
            f"/api/v2/interpretations/{interpretation_id}/report",
            params={"version": "pro"},
        )
        response.raise_for_status()
        last_payload = response.json()
        if last_payload.get("version") == "pro" and not last_payload.get("error"):
            return last_payload
        time.sleep(delay_seconds)
    return last_payload


def _build_runtime_diagnostics(interpretation_id: str) -> dict[str, Any]:
    from app.api.routes_v2 import get_store

    record = get_store().load(interpretation_id)
    if record is None:
        return {"record_found": False}

    layer0 = record.layer_0_raw
    diagnostics: dict[str, Any] = {
        "record_found": True,
        "status": record.status,
        "generation_stage": record.generation_stage,
        "generation_progress": record.generation_progress,
        "lite_ready": record.layer_2_lite_final is not None,
        "pro_ready": record.layer_4_pro_final is not None,
    }
    if layer0 is not None:
        diagnostics["layer0"] = {
            "passed": layer0.layer0_passed,
            "failure_reason": layer0.layer0_failure_reason,
            "failure_detail": _sanitize_layer0_failure_detail(layer0.layer0_failure_detail),
            "fidelity_flags": layer0.fidelity_flags,
            "fallback_summary": layer0.fallback_summary,
            "visual_basis_source": (
                (layer0.visual_analysis_basis or {}).get("prompt_meta", {}).get("source")
                if isinstance(layer0.visual_analysis_basis, dict)
                else None
            ),
        }
    return diagnostics


def _sanitize_layer0_failure_detail(detail: Any) -> dict[str, Any]:
    if not isinstance(detail, dict):
        return {}
    sanitized = {
        key: value
        for key, value in detail.items()
        if key not in {"raw_response", "request_payload", "authorization", "api_key"}
    }
    attempt_trace = sanitized.get("llm_attempt_trace")
    if isinstance(attempt_trace, list):
        sanitized["llm_attempt_trace"] = [
            {
                "model": item.get("model"),
                "base_url": item.get("base_url"),
                "endpoint_url": item.get("endpoint_url"),
                "result": item.get("result"),
                "status": item.get("status"),
                "reason": item.get("reason"),
            }
            for item in attempt_trace
            if isinstance(item, dict)
        ]
    return sanitized


def run_fixture_smoke(client: TestClient, fixture: Any) -> dict[str, Any]:
    user_context = _build_fixture_user_context(fixture)
    upload = _post_upload(client, fixture.image_path)
    detect_response = client.post(
        "/api/v2/detect-circles",
        json={"image_path": upload["image_path"]},
    )
    detect_response.raise_for_status()
    detect = detect_response.json()

    create_response = client.post(
        "/api/v2/interpretations",
        json={
            "user_id": f"vision-e2e-smoke-{fixture.fixture_id}",
            "image_path": upload["image_path"],
            "image_url": upload.get("image_url"),
            "storage_backend": upload.get("storage_backend"),
            "storage_key": upload.get("storage_key"),
            "image_local_expires_at": upload.get("image_local_expires_at"),
            "theme": fixture.theme or "general",
            "painting_intention": user_context["painting_intention"],
            "painting_feeling": user_context["painting_feeling"],
        },
    )
    create_response.raise_for_status()
    create = create_response.json()
    interpretation_id = create["interpretation_id"]

    status_response = client.get(f"/api/v2/interpretations/{interpretation_id}/status")
    status_response.raise_for_status()
    status = status_response.json()

    lite_response = client.get(
        f"/api/v2/interpretations/{interpretation_id}/report",
        params={"version": "lite"},
    )
    lite_response.raise_for_status()
    lite_report = lite_response.json()

    order_response = client.post(
        "/api/v2/miniapp/orders",
        json={
            "interpretation_id": interpretation_id,
            "product_type": "pro",
            "channel": "miniapp",
            "debug_canonical_user_id": f"vision-e2e-smoke-{fixture.fixture_id}",
        },
    )
    order_response.raise_for_status()
    order = order_response.json()
    notify_response = client.post(
        "/api/v2/miniapp/payments/wechat/notify",
        json={
            "order_id": order["order_id"],
            "event": "paid",
        },
    )
    notify_response.raise_for_status()
    notify = notify_response.json()
    reconcile_response = client.post(f"/api/v2/miniapp/orders/{order['order_id']}/reconcile")
    reconcile_response.raise_for_status()
    reconcile = reconcile_response.json()
    pro_report = _wait_for_pro_report(client, interpretation_id)
    runtime_diagnostics = _build_runtime_diagnostics(interpretation_id)

    result = {
        "fixture_id": fixture.fixture_id,
        "image_asset": str(fixture.image_path.relative_to(AIMANDALA_ROOT)),
        "upload": upload,
        "detect": detect,
        "create": create,
        "status": status,
        "lite_report": lite_report,
        "pro_purchase": {
            "order": order,
            "notify": notify,
            "reconcile": reconcile,
        },
        "pro_report": pro_report,
        "runtime_diagnostics": runtime_diagnostics,
    }
    result["validation"] = validate_fixture_result(result)
    return result


def validate_fixture_result(result: dict[str, Any]) -> dict[str, Any]:
    failures: list[str] = []
    detect = result.get("detect") if isinstance(result.get("detect"), dict) else {}
    if detect.get("method") == "default":
        failures.append("detect_fallback_default")
    if detect.get("method") not in {"llm_vision", "llm_vision_estimated"}:
        failures.append("detect_method_not_llm_vision")

    lite_report = result.get("lite_report") if isinstance(result.get("lite_report"), dict) else {}
    lite_structured = lite_report.get("structured") if isinstance(lite_report.get("structured"), dict) else {}
    visual_basis = str(lite_structured.get("visual_basis") or "").strip()
    if lite_report.get("error"):
        failures.append("lite_report_error")
    if not visual_basis:
        failures.append("lite_visual_basis_missing")
    if not _visual_basis_mentions_layers(visual_basis):
        failures.append("lite_visual_basis_missing_layer_terms")
    if lite_structured.get("prompt_schema_validation_issues"):
        failures.append("lite_prompt_schema_validation_issues")

    pro_report = result.get("pro_report")
    if isinstance(pro_report, dict):
        pro_structured = pro_report.get("structured") if isinstance(pro_report.get("structured"), dict) else {}
        if pro_report.get("error"):
            failures.append("pro_report_error")
        if pro_report.get("version") != "pro":
            failures.append("pro_report_version_not_pro")
        if not pro_structured:
            failures.append("pro_structured_missing")
    else:
        failures.append("pro_report_missing")

    return {
        "ok": not failures,
        "failures": failures,
    }


def _visual_basis_mentions_layers(visual_basis: str) -> bool:
    layer_terms = ["内圈", "中圈", "外圈"]
    return sum(term in visual_basis for term in layer_terms) >= 2


def build_public_summary(results: list[dict[str, Any]]) -> dict[str, Any]:
    fixture_summaries = [_build_fixture_summary(result) for result in results]
    return {
        "ok": all(item.get("validation", {}).get("ok") for item in results),
        "mode": "vision_e2e_smoke",
        "fixture_count": len(results),
        "candidate": {
            "vision_model": os.getenv("AIMANDALA_LLM_VISION_MODEL", ""),
            "vision_base_url": os.getenv("AIMANDALA_LLM_VISION_BASE_URL", ""),
            "vision_fallback_model": os.getenv("AIMANDALA_LLM_VISION_FALLBACK_MODEL", ""),
            "vision_fallback_base_url": os.getenv("AIMANDALA_LLM_VISION_FALLBACK_BASE_URL", ""),
        },
        "fixtures": fixture_summaries,
    }


def _build_fixture_summary(result: dict[str, Any]) -> dict[str, Any]:
    lite_report = result.get("lite_report") if isinstance(result.get("lite_report"), dict) else {}
    lite_structured = lite_report.get("structured") if isinstance(lite_report.get("structured"), dict) else {}
    pro_report = result.get("pro_report") if isinstance(result.get("pro_report"), dict) else {}
    pro_structured = pro_report.get("structured") if isinstance(pro_report.get("structured"), dict) else {}
    detect = result.get("detect") if isinstance(result.get("detect"), dict) else {}
    upload = result.get("upload") if isinstance(result.get("upload"), dict) else {}
    return {
        "fixture_id": result.get("fixture_id"),
        "image_asset": result.get("image_asset"),
        "upload": {
            "storage_backend": upload.get("storage_backend"),
            "storage_key": upload.get("storage_key"),
            "content_type": upload.get("content_type"),
            "size_bytes": upload.get("size_bytes"),
        },
        "detect": {
            "method": detect.get("method"),
            "confidence": detect.get("confidence"),
            "inner_radius": detect.get("inner_radius"),
            "middle_radius": detect.get("middle_radius"),
            "debug_backend": (detect.get("debug_info") or {}).get("backend")
            if isinstance(detect.get("debug_info"), dict)
            else None,
        },
        "lite_report": {
            "version": lite_report.get("version"),
            "title": lite_report.get("title"),
            "error": lite_report.get("error"),
            "visual_basis": lite_structured.get("visual_basis"),
            "style_review_fields": _build_lite_style_review_fields(lite_structured),
            "prompt_schema_validation_issues": lite_structured.get("prompt_schema_validation_issues"),
        },
        "pro_report": {
            "version": pro_report.get("version"),
            "title": pro_report.get("title"),
            "error": pro_report.get("error"),
            "structured_keys": sorted(pro_structured.keys()),
            "style_review_fields": _build_pro_style_review_fields(pro_structured),
        }
        if pro_report
        else None,
        "validation": result.get("validation"),
        "runtime_diagnostics": result.get("runtime_diagnostics"),
    }


def _prepare_output_dir(output_dir: Path) -> None:
    """Ensure reruns do not mix stale evidence with current smoke results."""
    shutil.rmtree(output_dir, ignore_errors=True)
    output_dir.mkdir(parents=True, exist_ok=True)


def execute_smoke(
    fixture_ids: list[str],
    output_dir: Path,
    *,
    env_file: Path | None = None,
) -> dict[str, Any]:
    load_smoke_env(env_file)
    configure_vision_env_from_existing_keys()
    validate_vision_env()
    _reset_api_state()
    _install_smoke_orchestrator()

    from app.api.main import app

    fixtures = load_fixtures(fixture_ids)
    _prepare_output_dir(output_dir)
    client = TestClient(app)
    results = []
    for fixture in fixtures:
        result = run_fixture_smoke(client, fixture)
        output_path = output_dir / f"{fixture.fixture_id}.json"
        output_path.write_text(
            json.dumps(build_sanitized_fixture_result(result), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        results.append(result)

    summary = build_public_summary(results)
    (output_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return summary


def build_sanitized_fixture_result(result: dict[str, Any]) -> dict[str, Any]:
    lite_report = result.get("lite_report") if isinstance(result.get("lite_report"), dict) else {}
    lite_structured = lite_report.get("structured") if isinstance(lite_report.get("structured"), dict) else {}
    pro_report = result.get("pro_report") if isinstance(result.get("pro_report"), dict) else {}
    pro_structured = pro_report.get("structured") if isinstance(pro_report.get("structured"), dict) else {}
    create = result.get("create") if isinstance(result.get("create"), dict) else {}
    status = result.get("status") if isinstance(result.get("status"), dict) else {}
    return {
        "fixture_id": result.get("fixture_id"),
        "image_asset": result.get("image_asset"),
        "upload": _build_fixture_summary(result)["upload"],
        "detect": _build_fixture_summary(result)["detect"],
        "create": {
            "interpretation_id": create.get("interpretation_id"),
            "version": create.get("version"),
            "status": create.get("status"),
            "generation_stage": create.get("generation_stage"),
            "generation_progress": create.get("generation_progress"),
            "three_circles": create.get("three_circles"),
            "auto_detected": create.get("auto_detected"),
            "report_ready": create.get("report_ready"),
        },
        "status": {
            "interpretation_id": status.get("interpretation_id"),
            "status": status.get("status"),
            "generation_stage": status.get("generation_stage"),
            "generation_progress": status.get("generation_progress"),
            "report_ready": status.get("report_ready"),
            "version_purchased": status.get("version_purchased"),
            "three_circles": status.get("three_circles"),
            "auto_detected": status.get("auto_detected"),
        },
        "lite_report": {
            "version": lite_report.get("version"),
            "title": lite_report.get("title"),
            "overall_impression": lite_report.get("overall_impression"),
            "error": lite_report.get("error"),
            "visual_basis": lite_structured.get("visual_basis"),
            "style_review_fields": _build_lite_style_review_fields(lite_structured),
            "prompt_schema_validation_issues": lite_structured.get("prompt_schema_validation_issues"),
        },
        "pro_report": {
            "version": pro_report.get("version"),
            "title": pro_report.get("title"),
            "overall_impression": pro_report.get("overall_impression"),
            "error": pro_report.get("error"),
            "structured_keys": sorted(pro_structured.keys()),
            "style_review_fields": _build_pro_style_review_fields(pro_structured),
        }
        if pro_report
        else None,
        "validation": result.get("validation"),
        "runtime_diagnostics": result.get("runtime_diagnostics"),
    }


def _build_lite_style_review_fields(structured: dict[str, Any]) -> dict[str, Any]:
    """Keep enough structured fields for style review without copying raw report bodies."""
    return _compact_selected_fields(
        structured,
        [
            "emotion_portrait",
            "story",
            "theme_scene",
            "theme_impact",
            "theme_awareness",
            "three_awareness",
            "pro_teaser",
        ],
    )


def _build_pro_style_review_fields(structured: dict[str, Any]) -> dict[str, Any]:
    """Expose Pro interpretation shape for QA while omitting prompt/debug payloads."""
    return _compact_selected_fields(
        structured,
        [
            "deep_impression",
            "deep_structure_interpretation",
            "evidence_digest",
            "imbalance_diagnosis",
            "root_cause_chain",
            "healing_plan",
            "topic_context",
        ],
    )


def _compact_selected_fields(payload: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    compact: dict[str, Any] = {}
    for key in keys:
        if key in payload:
            compact[key] = payload[key]
    return compact


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture-id", action="append", default=[], help="Fixture id to run, can be repeated.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="Optional local env file with vision API keys. Values are loaded but never printed.",
    )
    args = parser.parse_args()

    fixture_ids = args.fixture_id or DEFAULT_FIXTURE_IDS
    try:
        summary = execute_smoke(fixture_ids, args.output_dir, env_file=args.env_file)
    except RuntimeError as error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "mode": "vision_e2e_smoke",
                    "error": str(error),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
