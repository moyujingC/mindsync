"""Run the end-to-end mandala report fixture and write review artifacts."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AIMANDALA_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT_ROOT = (
    AIMANDALA_ROOT
    / "docs"
    / "qa"
    / "model-evals"
    / "2026-05-23-mandala-e2e-report-fixture"
)
DEFAULT_IMAGE_PATH = AIMANDALA_ROOT / "fixtures" / "toc-mvp" / "assets" / "IMG_5060.jpeg"
DEFAULT_MARKED_IMAGE_PATH = DEFAULT_IMAGE_PATH

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.llm.runtime import create_llm_client_from_env, load_private_env_file  # noqa: E402
from app.core.mandala_interpretation_agent.prompt_pack_builder import (  # noqa: E402
    PromptPackBuilder,
)
from app.core.mandala_interpretation_agent.topic_prompt_pack_registry import (  # noqa: E402
    get_topic_config_for_theme,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", default="", help="Private env file to load before running.")
    parser.add_argument("--image-path", default=str(DEFAULT_IMAGE_PATH), help="Mandala image path.")
    parser.add_argument(
        "--marked-image-path",
        default=str(DEFAULT_MARKED_IMAGE_PATH),
        help="Marked circle image path.",
    )
    parser.add_argument("--report-mode", choices=["lite", "pro", "both"], default="both")
    parser.add_argument("--save-dir", default="", help="Output directory for artifacts.")
    parser.add_argument(
        "--intention",
        default="按财富议题解读这幅曼陀罗画作。",
        help="User intention passed to the reasoning pass.",
    )
    parser.add_argument(
        "--feeling",
        default="有点紧，也有一点期待。",
        help="User feeling passed to the reasoning pass.",
    )
    parser.add_argument(
        "--theme",
        default="wealth",
        help="Theme/topic for the report (e.g. wealth, intimate_relationship, father_relationship).",
    )
    parser.add_argument(
        "--thinking-mode",
        choices=["default", "on", "off"],
        default="off",
        help="Control the reasoning pass thinking flag.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.env_file.strip():
        os.environ["AIMANDALA_ENV_FILE"] = args.env_file.strip()
    load_private_env_file()

    image_path = Path(args.image_path).expanduser()
    marked_image_path = Path(args.marked_image_path).expanduser()
    if not image_path.exists():
        raise FileNotFoundError(f"image not found: {image_path}")
    if not marked_image_path.exists():
        raise FileNotFoundError(f"marked image not found: {marked_image_path}")

    topic_config = get_topic_config_for_theme(args.theme)
    builder = PromptPackBuilder(
        pack_id=f"{topic_config.topic_key}-report-v1.0.0",
        report_mode="lite",
        topic_label=topic_config.label,
    )
    prompt_pack = builder.build()
    prompt_pack_manifest_path = _resolve_output_dir(args.save_dir) / "prompt_pack_manifest.json"
    output_dir = _resolve_output_dir(args.save_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    prompt_pack_manifest_path.write_text(
        json.dumps(prompt_pack.manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    client = create_llm_client_from_env()
    if client.__class__.__name__ == "NoopLLMClient":
        raise RuntimeError("no real LLM client is configured")

    report_modes = ["lite", "pro"] if args.report_mode == "both" else [args.report_mode]
    report_summaries = []
    for mode in report_modes:
        result = _run_one_mode(
            client=client,
            prompt_pack=prompt_pack,
            image_path=image_path,
            marked_image_path=marked_image_path,
            report_mode=mode,
            topic_label=topic_config.label,
            intention=args.intention,
            feeling=args.feeling,
            thinking_mode=args.thinking_mode,
        )
        mode_dir = output_dir / mode
        mode_dir.mkdir(parents=True, exist_ok=True)
        _write_artifacts(mode_dir, result)
        report_summaries.append(
            {
                "report_mode": mode,
                "output_dir": str(mode_dir),
                "status": result["quality_gate"]["passed"] and "complete" or "failed",
                "prompt_cache": result["prompt_cache"],
            }
        )

    summary = {
        "status": "complete" if all(item["status"] == "complete" for item in report_summaries) else "failed",
        "prompt_pack_id": prompt_pack.pack_id,
        "prompt_pack_manifest": prompt_pack.manifest,
        "reports": report_summaries,
    }
    (output_dir / "run_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["status"] == "complete" else 2


def _run_one_mode(
    *,
    client,
    prompt_pack,
    image_path: Path,
    marked_image_path: Path,
    report_mode: str,
    topic_label: str,
    intention: str,
    feeling: str,
    thinking_mode: str,
) -> dict:
    visual_draft = _generate_visual_draft(
        client=client,
        image_path=image_path,
        marked_image_path=marked_image_path,
        intention=intention,
        feeling=feeling,
        thinking_mode=thinking_mode,
    )
    final_report = _generate_final_report(
        client=client,
        prompt_pack=prompt_pack,
        visual_draft=visual_draft,
        report_mode=report_mode,
        topic_label=topic_label,
        intention=intention,
        feeling=feeling,
        thinking_mode=thinking_mode,
    )
    quality_gate = _run_quality_gate(final_report_md=final_report)
    return {
        "agent_input": {
            "image_path": str(image_path),
            "marked_image_path": str(marked_image_path),
            "report_mode": report_mode,
            "painting_intention": intention,
            "painting_feeling": feeling,
        },
        "visual_draft": visual_draft,
        "prompt_pack_manifest": prompt_pack.manifest,
        "final_report": {"markdown": final_report, "report_mode": report_mode},
        "final_report_md": final_report,
        "quality_gate": quality_gate,
        "prompt_cache": {
            "hit_tokens": int(getattr(client, "last_prompt_cache_hit_tokens", 0) or 0),
            "miss_tokens": int(getattr(client, "last_prompt_cache_miss_tokens", 0) or 0),
        },
        "model_trace": list(getattr(client, "last_attempt_trace", [])),
    }


def _generate_visual_draft(*, client, image_path: Path, marked_image_path: Path, intention: str, feeling: str, thinking_mode: str) -> dict:
    prompt = (
        "请只根据图片，输出一份轻量视觉草稿，结构化但保持自然语言感。"
        "要求包含：整体观察、三圈观察、主要视觉单元、留白与相邻关系。"
        "不要输出财富结论、心理诊断或五行生克。"
        f"\n\n用户意图：{intention}\n用户感受：{feeling}"
    )
    messages = client._build_messages(  # type: ignore[attr-defined]
        system_prompt="你是一位曼陀罗画面观察助手，只做视觉观察。",
        user_prompt=prompt,
        image_paths=[str(image_path), str(marked_image_path)],
    )
    disable_thinking = None if thinking_mode == "default" else (thinking_mode == "off")
    raw = client._request_chat_completion(  # type: ignore[attr-defined]
        task_config=client.config.resolve_task_config("vision"),  # type: ignore[attr-defined]
        fallback_task_config=client.config.resolve_fallback_task_config("vision"),  # type: ignore[attr-defined]
        messages=messages,
        expect_json=False,
        disable_thinking=True if disable_thinking is None else disable_thinking,
    )
    return {
        "markdown": raw or "",
        "source_images": [str(image_path), str(marked_image_path)],
    }


def _generate_final_report(*, client, prompt_pack, visual_draft: dict, report_mode: str, topic_label: str, intention: str, feeling: str, thinking_mode: str) -> str:
    user_prompt = "\n\n".join(
        [
            f"报告模式：{report_mode}",
            f"用户意图：{intention}",
            f"用户感受：{feeling}",
            "视觉草稿：",
            visual_draft["markdown"],
            f"请依据上述稳定前缀和视觉草稿，直接生成用户可见的{topic_label} Markdown 报告。",
        ]
    )
    raw = client.generate_text(
        task="chat",
        system_prompt=prompt_pack.stable_prefix,
        user_prompt=user_prompt,
        disable_thinking=(False if thinking_mode == "on" else True),
    )
    return raw or ""


def _run_quality_gate(*, final_report_md: str) -> dict:
    forbidden = [
        "stage-",
        "placeholder",
        "legacy",
    ]
    leaked = [term for term in forbidden if term in final_report_md]
    return {
        "passed": not leaked and bool(final_report_md.strip()),
        "leaked_terms": leaked,
    }


def _write_artifacts(output_dir: Path, result: dict) -> None:
    files = {
        "agent_input.json": result["agent_input"],
        "visual_draft.json": result["visual_draft"],
        "prompt_pack_manifest.json": result["prompt_pack_manifest"],
        "final_report.json": result["final_report"],
        "quality_gate.json": result["quality_gate"],
        "run_summary.json": {
            "prompt_cache": result["prompt_cache"],
            "model_trace": result["model_trace"],
        },
    }
    for filename, payload in files.items():
        (output_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    (output_dir / "visual_draft.md").write_text(result["visual_draft"]["markdown"] + "\n", encoding="utf-8")
    (output_dir / "final_report.md").write_text(result["final_report_md"] + "\n", encoding="utf-8")


def _resolve_output_dir(raw_save_dir: str) -> Path:
    if raw_save_dir.strip():
        return Path(raw_save_dir).expanduser()
    return DEFAULT_OUTPUT_ROOT


if __name__ == "__main__":
    raise SystemExit(main())
