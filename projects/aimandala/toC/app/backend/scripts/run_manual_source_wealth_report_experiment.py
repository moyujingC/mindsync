"""Run a direct-manual wealth report experiment with a single vision model call.

This script is intentionally isolated from the production mandala interpretation
pipeline. It sends the full mandala manual source plus one image to the real
vision-capable LLM and writes the raw prompt and report artifacts to docs/qa.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any


BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_IMAGE_PATH = AIMANDALA_ROOT / "fixtures" / "toc-mvp" / "assets" / "IMG_5060.jpeg"
DEFAULT_MANUAL_PATH = (
    AIMANDALA_ROOT
    / "docs"
    / "疗愈体系知识库"
    / "20-疗愈体系"
    / "20-流派层"
    / "10-曼陀罗"
    / "90-来源原文"
    / "01-曼陀罗解读手册原文.md"
)
DEFAULT_SAVE_ROOT = AIMANDALA_ROOT / "docs" / "qa" / "model-evals"
DEFAULT_INTENTION = "按财富议题解读这幅曼陀罗画作。"

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", default="", help="Private env file to load before running.")
    parser.add_argument(
        "--image-path",
        default=str(DEFAULT_IMAGE_PATH),
        help="Mandala image to send to the vision model.",
    )
    parser.add_argument(
        "--manual-path",
        default=str(DEFAULT_MANUAL_PATH),
        help="Full mandala manual source to attach as context.",
    )
    parser.add_argument(
        "--save-dir",
        default="",
        help="Directory for evaluation artifacts. Defaults to a dated folder under docs/qa/model-evals.",
    )
    parser.add_argument(
        "--intention",
        default=DEFAULT_INTENTION,
        help="Short task statement for the report.",
    )
    parser.add_argument(
        "--thinking-mode",
        choices=["default", "on", "off"],
        default="default",
        help="Control the model thinking flag for this experiment.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    load_private_env_file()

    image_path = Path(args.image_path).expanduser()
    manual_path = Path(args.manual_path).expanduser()
    if not image_path.exists():
        raise FileNotFoundError(f"image not found: {image_path}")
    if not manual_path.exists():
        raise FileNotFoundError(f"manual not found: {manual_path}")

    client = create_llm_client_from_env()
    if client.__class__.__name__ == "NoopLLMClient":
        raise RuntimeError("no real LLM client is configured")

    manual_text = manual_path.read_text(encoding="utf-8")
    prompt_text = _build_prompt(manual_text=manual_text, intention=args.intention)
    save_dir = _resolve_save_dir(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    started_at = time.monotonic()
    request_payload = {
        "image_path": str(image_path),
        "manual_path": str(manual_path),
        "thinking_mode": args.thinking_mode,
        "model_task": "vision",
        "intention": args.intention,
    }
    response_text = _call_vision_text(
        client=client,
        image_path=str(image_path),
        prompt=prompt_text,
        thinking_mode=args.thinking_mode,
    )
    duration_seconds = round(time.monotonic() - started_at, 2)
    report_payload = {
        "status": "complete" if response_text else "failed",
        "duration_seconds": duration_seconds,
        "model_trace": getattr(client, "last_attempt_trace", []),
        "error_detail": getattr(client, "last_error_detail", {}),
        "response_chars": len(response_text or ""),
        "image_path": str(image_path),
        "manual_path": str(manual_path),
    }

    (save_dir / "prompt.md").write_text(prompt_text, encoding="utf-8")
    (save_dir / "request.json").write_text(
        json.dumps(request_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (save_dir / "response.md").write_text(response_text or "", encoding="utf-8")
    (save_dir / "response.json").write_text(
        json.dumps(report_payload | {"response_text": response_text or ""}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (save_dir / "summary.json").write_text(
        json.dumps(report_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "save_dir": str(save_dir),
                "duration_seconds": duration_seconds,
                **report_payload,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def _build_prompt(*, manual_text: str, intention: str) -> str:
    return f"""你是专业的曼陀罗解读写作者。请只根据我提供的画作和这份完整手册原文，按财富议题写一份可直接交付给用户的解读报告。

要求：
1. 输出只要 Markdown 正文。
2. 报告要像疗愈师带着用户看画，不要像检测报告。
3. 先看整体，再看三圈，再看圈内元素和关系，再收束到财富议题。
4. 不要输出内部流程、stage、schema、prompt、质量门之类的内容。
5. 不要输出财务预测、投资建议、诊断或治疗建议。
6. 尽量保留手册里的语言气质和表达方式，不要把它改写成抽象的通用心理报告。

用户的解读意图：
{intention}

完整手册原文：
{manual_text}
"""


def _call_vision_text(
    *,
    client: Any,
    image_path: str,
    prompt: str,
    thinking_mode: str,
) -> str | None:
    if not hasattr(client, "_build_messages") or not hasattr(client, "_request_chat_completion"):
        raise RuntimeError("current llm client does not expose the required multimodal helpers")

    messages = client._build_messages(  # type: ignore[attr-defined]
        system_prompt="你只需要按要求写出完整的中文 Markdown 报告。",
        user_prompt=prompt,
        image_paths=[image_path],
    )
    disable_thinking = None
    if thinking_mode == "on":
        disable_thinking = False
    elif thinking_mode == "off":
        disable_thinking = True

    task_config = client.config.resolve_task_config("vision")  # type: ignore[attr-defined]
    fallback_task_config = client.config.resolve_fallback_task_config("vision")  # type: ignore[attr-defined]
    raw = client._request_chat_completion(  # type: ignore[attr-defined]
        task_config=task_config,
        fallback_task_config=fallback_task_config,
        messages=messages,
        expect_json=False,
        disable_thinking=True if disable_thinking is None else disable_thinking,
    )
    return raw.strip() if raw and raw.strip() else None


def _resolve_save_dir(raw_save_dir: str) -> Path:
    if raw_save_dir.strip():
        return Path(raw_save_dir).expanduser()
    timestamp = datetime.now().strftime("%Y-%m-%d")
    return DEFAULT_SAVE_ROOT / f"{timestamp}-manual-source-wealth-report-experiment"


if __name__ == "__main__":
    raise SystemExit(main())
