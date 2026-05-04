#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


GETNOTE_SAVE_URL = "https://openapi.biji.com/open/api/v1/resource/note/save"
RATE_LIMIT_CODES = {10202}
MEMBERSHIP_CODES = {10201}


def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout or "command failed").strip())
    return result.stdout


def file_duration_seconds(path: Path) -> float:
    stdout = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ]
    )
    return float(json.loads(stdout)["format"]["duration"])


def safe_stem(name: str) -> str:
    cleaned = re.sub(r"[^\w\-\u4e00-\u9fff]+", "-", name, flags=re.UNICODE)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned or "video"


def extract_audio(video_path: Path, audio_path: Path):
    if audio_path.exists():
        return
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "libmp3lame",
            "-q:a",
            "2",
            str(audio_path),
        ]
    )


def transcribe_audio(audio_path: Path, temp_dir: Path, model: str, language: str) -> dict:
    json_path = temp_dir / f"{audio_path.stem}.json"
    if not json_path.exists():
        temp_dir.mkdir(parents=True, exist_ok=True)
        run(
            [
                "whisper",
                str(audio_path),
                "--model",
                model,
                "--language",
                language,
                "--output_format",
                "json",
                "--output_dir",
                str(temp_dir),
            ]
        )
    return json.loads(json_path.read_text())


def markdown_from_transcript(video_path: Path, audio_path: Path, duration: float, data: dict, note_id: str | None):
    title = video_path.stem
    transcript = (data.get("text") or "").strip()
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"# {title}",
        "",
        f"- 原视频：`{video_path}`",
        f"- 音频文件：`{audio_path}`",
        f"- 时长：`{duration:.1f}` 秒",
        f"- 生成时间：`{generated_at}`",
    ]
    if note_id:
        lines.append(f"- Get笔记 Note ID：`{note_id}`")
    lines.extend(
        [
            "",
            "## 完整转写",
            "",
            transcript if transcript else "_无转写内容_",
            "",
        ]
    )

    segments = data.get("segments") or []
    if segments:
        lines.extend(["## 分段", ""])
        for seg in segments:
            start = int(seg.get("start", 0))
            mm, ss = divmod(start, 60)
            text = (seg.get("text") or "").strip()
            lines.append(f"- `{mm:02d}:{ss:02d}` {text}")
        lines.append("")

    return "\n".join(lines)


def save_getnote(title: str, content: str, tags: list[str], max_retries: int = 5) -> str | None:
    api_key = os.environ.get("GETNOTE_API_KEY")
    client_id = os.environ.get("GETNOTE_CLIENT_ID")
    if not api_key or not client_id:
        return None

    payload = json.dumps(
        {
            "title": title,
            "content": content,
            "note_type": "plain_text",
            "tags": tags,
            "parent_id": 0,
        }
    ).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": api_key,
        "X-Client-ID": client_id,
    }

    last_error = None
    for attempt in range(max_retries):
        req = urllib.request.Request(GETNOTE_SAVE_URL, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            last_error = raw or str(exc)
            try:
                parsed = json.loads(raw)
            except Exception:
                parsed = None
            if parsed:
                code = ((parsed.get("error") or {}).get("code"))
                if code in RATE_LIMIT_CODES and attempt < max_retries - 1:
                    time.sleep(65)
                    continue
                if code in MEMBERSHIP_CODES:
                    raise RuntimeError("Get笔记当前账号未开通 API 所需会员能力。")
            raise RuntimeError(last_error)
        except Exception as exc:
            last_error = str(exc)
            if attempt < max_retries - 1:
                time.sleep(5)
                continue
            raise

        if body.get("success"):
            data = body.get("data") or {}
            note_id = data.get("note_id")
            if note_id is not None:
                return str(note_id)
            return None

        err = body.get("error") or {}
        code = err.get("code")
        last_error = json.dumps(body, ensure_ascii=False)
        if code in RATE_LIMIT_CODES and attempt < max_retries - 1:
            time.sleep(65)
            continue
        raise RuntimeError(last_error)

    raise RuntimeError(last_error or "保存到 Get笔记 失败")


def process_video(video_path: Path, args, manifest: dict):
    stem = safe_stem(video_path.stem)
    audio_path = args.audio_dir / f"{stem}.mp3"
    md_path = args.markdown_dir / f"{stem}.md"
    temp_dir = args.meta_dir / "whisper-json"

    if md_path.exists() and manifest.get(video_path.name, {}).get("status") == "done":
        return

    duration = file_duration_seconds(video_path)
    extract_audio(video_path, audio_path)
    data = transcribe_audio(audio_path, temp_dir, args.model, args.language)

    note_id = manifest.get(video_path.name, {}).get("getnote_note_id")
    markdown = markdown_from_transcript(video_path, audio_path, duration, data, note_id)

    if args.save_getnote and not note_id:
        note_id = save_getnote(video_path.stem, markdown, args.tags)
        markdown = markdown_from_transcript(video_path, audio_path, duration, data, note_id)

    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(markdown)

    manifest[video_path.name] = {
        "status": "done",
        "video_path": str(video_path),
        "audio_path": str(audio_path),
        "markdown_path": str(md_path),
        "getnote_note_id": note_id,
        "duration_seconds": duration,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }


def main():
    parser = argparse.ArgumentParser(description="Import local videos to Get笔记 and Markdown transcripts.")
    parser.add_argument("root", help="Video folder root")
    parser.add_argument("--model", default="small")
    parser.add_argument("--language", default="zh")
    parser.add_argument("--no-save-getnote", action="store_true")
    parser.add_argument(
        "--tags",
        default="小红书,亚慧AI产品经理,视频转写,2026",
        help="Comma-separated Get笔记 tags",
    )
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    args.root = root
    args.audio_dir = root / "_audio"
    args.markdown_dir = root / "_markdown"
    args.meta_dir = root / "_meta"
    args.log_dir = root / "_logs"
    args.tags = [tag.strip() for tag in args.tags.split(",") if tag.strip()]
    args.save_getnote = not args.no_save_getnote

    args.audio_dir.mkdir(parents=True, exist_ok=True)
    args.markdown_dir.mkdir(parents=True, exist_ok=True)
    args.meta_dir.mkdir(parents=True, exist_ok=True)
    args.log_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = args.meta_dir / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
    else:
        manifest = {}

    videos = sorted(root.glob("*.mp4"))
    if not videos:
        print("No mp4 files found.", file=sys.stderr)
        return 1

    failures = []
    for idx, video_path in enumerate(videos, start=1):
        print(f"[{idx}/{len(videos)}] {video_path.name}")
        try:
            process_video(video_path, args, manifest)
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
        except Exception as exc:
            failures.append((video_path.name, str(exc)))
            manifest[video_path.name] = {
                "status": "failed",
                "video_path": str(video_path),
                "error": str(exc),
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
            print(f"  FAILED: {exc}", file=sys.stderr)

    if failures:
        print("\nFailures:", file=sys.stderr)
        for name, error in failures:
            print(f"- {name}: {error}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
