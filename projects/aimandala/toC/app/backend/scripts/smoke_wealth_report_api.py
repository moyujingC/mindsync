"""Smoke-test the real upload -> wealth report API path."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_IMAGE_PATH = AIMANDALA_ROOT / "fixtures" / "toc-mvp" / "assets" / "IMG_5060.jpeg"
DEFAULT_SAVE_ROOT = AIMANDALA_ROOT / "docs" / "qa" / "model-evals"

sys.path.insert(0, str(BACKEND_ROOT))

from app.api.main import create_app  # noqa: E402
from app.core.llm.runtime import load_private_env_file  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--env-file",
        default="",
        help="Private env file to load before running the smoke test.",
    )
    parser.add_argument(
        "--image-path",
        default=str(DEFAULT_IMAGE_PATH),
        help="Local mandala image to upload through /api/uploads.",
    )
    parser.add_argument(
        "--mode",
        choices=["lite", "pro", "both"],
        default="both",
        help="Report mode to generate after upload.",
    )
    parser.add_argument(
        "--redeem-code",
        default="",
        help="Redeem code to use for both modes. If omitted, mode-specific defaults are used.",
    )
    parser.add_argument(
        "--redeem-config",
        default="REGRESSION-LITE:lite;REGRESSION-PRO:pro;REGRESSION-ALL:lite,pro",
        help=(
            "Temporary AIMANDALA_REDEEM_CODES value for smoke runs when the env file "
            "does not define one. Existing environment values are preserved."
        ),
    )
    parser.add_argument(
        "--lite-code",
        default="REGRESSION-LITE",
        help="Redeem code for Lite when --redeem-code is omitted.",
    )
    parser.add_argument(
        "--pro-code",
        default="REGRESSION-PRO",
        help="Redeem code for Pro when --redeem-code is omitted.",
    )
    parser.add_argument(
        "--intention",
        default="想看自己为什么对财富流动有紧张感。",
        help="Painting intention passed to /api/wealth-reports.",
    )
    parser.add_argument(
        "--feeling",
        default="有点紧，也有一点期待。",
        help="Painting feeling passed to /api/wealth-reports.",
    )
    parser.add_argument(
        "--save-dir",
        default="",
        help=(
            "Optional directory for saving API smoke artifacts. If omitted, "
            "the script only prints a summary."
        ),
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    load_private_env_file()
    if args.redeem_config.strip() and not os.getenv("AIMANDALA_REDEEM_CODES"):
        os.environ["AIMANDALA_REDEEM_CODES"] = args.redeem_config.strip()

    image_path = Path(args.image_path).expanduser()
    if not image_path.exists():
        raise FileNotFoundError(f"image not found: {image_path}")

    modes = ["lite", "pro"] if args.mode == "both" else [args.mode]
    client = TestClient(create_app())
    started_at = time.monotonic()
    upload_payload = _upload_image(client, image_path)
    save_dir = _resolve_save_dir(args.save_dir)
    results = []
    for mode in modes:
        results.append(
            _create_report(
                client,
                upload_payload=upload_payload,
                mode=mode,
                redeem_code=_redeem_code_for_mode(args, mode),
                intention=args.intention,
                feeling=args.feeling,
                save_dir=save_dir,
            )
        )

    payload = {
        "status": "complete",
        "duration_seconds": round(time.monotonic() - started_at, 2),
        "upload": {
            "storage_backend": upload_payload.get("storage_backend"),
            "storage_key": upload_payload.get("storage_key"),
            "size_bytes": upload_payload.get("size_bytes"),
            "image_path_exists": Path(upload_payload["image_path"]).exists(),
        },
        "reports": results,
    }
    if save_dir is not None:
        save_dir.mkdir(parents=True, exist_ok=True)
        (save_dir / "summary.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def _upload_image(client: TestClient, image_path: Path) -> dict:
    content_type = _content_type_for_image(image_path)
    with image_path.open("rb") as file:
        response = client.post(
            "/api/uploads",
            files={"file": (image_path.name, file, content_type)},
        )
    if response.status_code != 200:
        raise RuntimeError(f"upload failed: {response.status_code} {response.text}")
    payload = response.json()
    if not payload.get("success") or not payload.get("image_path"):
        raise RuntimeError(f"upload returned invalid payload: {payload}")
    return payload


def _create_report(
    client: TestClient,
    *,
    upload_payload: dict,
    mode: str,
    redeem_code: str,
    intention: str,
    feeling: str,
    save_dir: Path | None = None,
) -> dict:
    started_at = time.monotonic()
    request_payload = {
        "image_path": upload_payload["image_path"],
        "report_mode": mode,
        "redeem_code": redeem_code,
        "painting_intention": intention,
        "painting_feeling": feeling,
        "inner_radius": 35,
        "middle_radius": 65,
        "storage_backend": upload_payload.get("storage_backend", ""),
        "storage_key": upload_payload.get("storage_key", ""),
    }
    response = client.post(
        "/api/wealth-reports",
        json=request_payload,
    )
    duration_seconds = round(time.monotonic() - started_at, 2)
    if response.status_code != 200:
        raise RuntimeError(f"{mode} report failed: {response.status_code} {response.text}")
    payload = response.json()
    quality_gate = payload.get("quality_gate") or {}
    if not payload.get("success") or not quality_gate.get("passed"):
        raise RuntimeError(f"{mode} report quality failed: {quality_gate}")
    summary = {
        "mode": mode,
        "duration_seconds": duration_seconds,
        "report_id": payload.get("report_id"),
        "quality_gate_passed": quality_gate.get("passed"),
        "final_report_chars": len(payload.get("final_report_md") or ""),
        "output_dir": str(save_dir / mode) if save_dir is not None else "",
        "prompt_pack_id": (payload.get("prompt_pack_manifest") or {}).get("pack_id"),
        "model_trace": (payload.get("run_summary") or {}).get("model_trace", []),
    }
    if save_dir is not None:
        _write_report_artifacts(
            save_dir / mode,
            request_payload=request_payload,
            response_payload=payload,
            upload_payload=upload_payload,
            duration_seconds=duration_seconds,
        )
    return summary


def _write_report_artifacts(
    output_dir: Path,
    *,
    request_payload: dict,
    response_payload: dict,
    upload_payload: dict,
    duration_seconds: float,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    final_report_md = str(response_payload.get("final_report_md") or "")
    files = {
        "request.json": request_payload,
        "upload.json": upload_payload,
        "response.json": response_payload,
        "visual_draft.json": response_payload.get("visual_draft") or {},
        "prompt_pack_manifest.json": response_payload.get("prompt_pack_manifest") or {},
        "final_report.json": response_payload.get("final_report") or {},
        "quality_gate.json": response_payload.get("quality_gate") or {},
        "run_summary.json": response_payload.get("run_summary") or {},
        "report_summary.json": {
            "report_mode": response_payload.get("report_mode"),
            "report_id": response_payload.get("report_id"),
            "duration_seconds": duration_seconds,
            "prompt_pack_id": (response_payload.get("prompt_pack_manifest") or {}).get("pack_id"),
        },
    }
    for filename, payload in files.items():
        (output_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    (output_dir / "final_report.md").write_text(final_report_md, encoding="utf-8")


def _redeem_code_for_mode(args: argparse.Namespace, mode: str) -> str:
    if args.redeem_code.strip():
        return args.redeem_code.strip()
    return args.pro_code.strip() if mode == "pro" else args.lite_code.strip()


def _content_type_for_image(image_path: Path) -> str:
    suffix = image_path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".webp":
        return "image/webp"
    return "image/png"


def _resolve_save_dir(raw_save_dir: str) -> Path | None:
    if not raw_save_dir.strip():
        return None
    save_path = Path(raw_save_dir).expanduser()
    if save_path.is_absolute():
        return save_path
    if raw_save_dir.strip() == "auto":
        timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
        return DEFAULT_SAVE_ROOT / f"{timestamp}-wealth-api-smoke"
    return Path.cwd() / save_path


if __name__ == "__main__":
    raise SystemExit(main())
