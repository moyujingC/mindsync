#!/usr/bin/env python3
import argparse
import json
import os
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


SAVE_URL = "https://openapi.biji.com/open/api/v1/resource/note/save"
PROGRESS_URL = "https://openapi.biji.com/open/api/v1/resource/note/task/progress"
DETAIL_URL = "https://openapi.biji.com/open/api/v1/resource/note/detail"
KB_ADD_URL = "https://openapi.biji.com/open/api/v1/resource/knowledge/note/batch-add"


def safe_slug(text: str) -> str:
    text = re.sub(r"[^\w\-\u4e00-\u9fff]+", "-", text, flags=re.UNICODE)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "note"


def get_headers():
    return {
        "Authorization": os.environ["GETNOTE_API_KEY"],
        "X-Client-ID": os.environ["GETNOTE_CLIENT_ID"],
        "Content-Type": "application/json",
    }


def request_json(url: str, method: str = "GET", data=None, timeout: int = 60):
    payload = None
    headers = get_headers()
    if data is not None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def load_links(args):
    raw_links = []
    if args.links_file:
        raw_links.extend(Path(args.links_file).expanduser().read_text().splitlines())
    raw_links.extend(args.link or [])

    links = []
    seen = set()
    for raw in raw_links:
        value = raw.strip()
        if not value or value.startswith("#"):
            continue
        if value not in seen:
            seen.add(value)
            links.append(value)
    return links


def detect_platform(url: str):
    lower = url.lower()
    if "xiaohongshu.com" in lower:
        return "小红书"
    if "douyin.com" in lower or "iesdouyin.com" in lower or "v.douyin.com" in lower:
        return "抖音"
    return "社媒"


def submit_link_note(title: str, link_url: str, tags: list[str], retry_429_seconds: int, max_attempts: int):
    payload = {
        "title": title,
        "note_type": "link",
        "link_url": link_url,
        "tags": tags,
        "parent_id": 0,
    }
    for attempt in range(max_attempts):
        try:
            body = request_json(SAVE_URL, method="POST", data=payload)
            if not body.get("success"):
                raise RuntimeError(json.dumps(body, ensure_ascii=False))
            tasks = ((body.get("data") or {}).get("tasks") or [])
            if not tasks:
                raise RuntimeError(f"save response missing tasks: {json.dumps(body, ensure_ascii=False)}")
            return tasks[0]["task_id"]
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < max_attempts - 1:
                time.sleep(retry_429_seconds)
                continue
            raise RuntimeError(f"HTTP Error {exc.code}: {exc.reason}")
        except RuntimeError as exc:
            if "10202" in str(exc) and attempt < max_attempts - 1:
                time.sleep(retry_429_seconds)
                continue
            raise


def poll_task(task_id: str, sleep_seconds: int, max_attempts: int):
    for _ in range(max_attempts):
        body = request_json(PROGRESS_URL, method="POST", data={"task_id": task_id})
        if not body.get("success"):
            raise RuntimeError(json.dumps(body, ensure_ascii=False))
        data = body.get("data") or {}
        status = data.get("status")
        if status == "success":
            note_id = str(data.get("note_id") or "")
            if note_id and note_id != "0":
                return note_id
        if status == "failed":
            raise RuntimeError(data.get("error_msg") or f"task failed: {task_id}")
        time.sleep(sleep_seconds)
    raise RuntimeError(f"task timeout: {task_id}")


def fetch_detail(note_id: str):
    url = f"{DETAIL_URL}?{urllib.parse.urlencode({'id': note_id})}"
    body = request_json(url, method="GET")
    if not body.get("success"):
        raise RuntimeError(json.dumps(body, ensure_ascii=False))
    return (body.get("data") or {}).get("note") or {}


def add_to_knowledge_base(topic_id: str, note_id: str):
    body = request_json(KB_ADD_URL, method="POST", data={"topic_id": topic_id, "note_ids": [note_id]})
    if not body.get("success"):
        raise RuntimeError(json.dumps(body, ensure_ascii=False))


def write_markdown(md_path: Path, original_link: str, detail: dict, getnote_note_id: str, platform: str):
    md_path.parent.mkdir(parents=True, exist_ok=True)
    web_page = detail.get("web_page") or {}
    content = detail.get("content") or ""
    web_content = web_page.get("content") or ""
    excerpt = web_page.get("excerpt") or ""
    topics = detail.get("topics") or []
    tags = detail.get("tags") or []
    title = detail.get("title") or original_link
    lines = [
        f"# {title}",
        "",
        f"- 平台：`{platform}`",
        f"- 原链接：{original_link}",
        f"- Get笔记 Note ID：`{getnote_note_id}`",
        f"- 知识库：{', '.join(topic.get('name', '') for topic in topics if topic.get('name'))}",
        f"- 标签：{', '.join(tag.get('name', '') for tag in tags if tag.get('name'))}",
        "",
        "## Get笔记总结",
        "",
        content or "_无总结内容_",
        "",
        "## 原文摘录",
        "",
        excerpt or "_无摘录_",
        "",
        "## 抓取正文",
        "",
        web_content or "_无正文内容_",
        "",
    ]
    md_path.write_text("\n".join(lines))


def load_manifest(path: Path):
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_manifest(path: Path, manifest: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))


def sleep_with_log(seconds: float):
    if seconds <= 0:
        return
    print(f"  sleeping {round(seconds, 1)}s: before next link submission", flush=True)
    time.sleep(seconds)


def spacing_seconds(base_seconds: int, jitter_seconds: int):
    if base_seconds <= 0:
        return 0.0
    if jitter_seconds <= 0:
        return float(base_seconds)
    return float(base_seconds + random.uniform(0, jitter_seconds))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic-id", required=True)
    parser.add_argument("--link", action="append", default=[])
    parser.add_argument("--links-file")
    parser.add_argument("--output-dir")
    parser.add_argument("--manifest-path")
    parser.add_argument("--retry-failed-only", action="store_true")
    parser.add_argument("--poll-seconds", type=int, default=10)
    parser.add_argument("--poll-max-attempts", type=int, default=240)
    parser.add_argument("--retry-429-seconds", type=int, default=180)
    parser.add_argument("--save-max-attempts", type=int, default=6)
    parser.add_argument("--note-spacing-seconds", type=int, default=180)
    parser.add_argument("--note-spacing-jitter-seconds", type=int, default=120)
    parser.add_argument("--tag", action="append", default=[])
    args = parser.parse_args()

    links = load_links(args)
    if not links:
        raise SystemExit("No links provided. Use --link or --links-file.")

    base_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else Path.cwd() / "_social_import_from_getnote"
    export_dir = base_dir / "markdown"
    manifest_path = Path(args.manifest_path).expanduser().resolve() if args.manifest_path else base_dir / "manifest.json"
    manifest = load_manifest(manifest_path)

    for index, link_url in enumerate(links, start=1):
        entry = manifest.get(link_url, {})
        print(f"[{index}/{len(links)}] {link_url}")
        if args.retry_failed_only and entry and entry.get("status") not in {"failed", "submitted"}:
            continue
        if entry.get("status") == "done" and entry.get("getnote_note_id"):
            continue

        platform = detect_platform(link_url)
        title = entry.get("title") or f"{platform}链接导入"
        tags = [platform, "社媒导入", *args.tag]
        try:
            task_id = entry.get("task_id") or submit_link_note(
                title=title,
                link_url=link_url,
                tags=tags,
                retry_429_seconds=args.retry_429_seconds,
                max_attempts=args.save_max_attempts,
            )
            manifest[link_url] = {
                **entry,
                "title": title,
                "platform": platform,
                "status": "submitted",
                "task_id": task_id,
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            save_manifest(manifest_path, manifest)

            getnote_note_id = entry.get("getnote_note_id") or poll_task(task_id, args.poll_seconds, args.poll_max_attempts)
            detail = fetch_detail(getnote_note_id)
            resolved_title = detail.get("title") or title
            md_name = safe_slug(resolved_title) + ".md"
            md_path = export_dir / md_name
            write_markdown(md_path, link_url, detail, getnote_note_id, platform)
            add_to_knowledge_base(args.topic_id, getnote_note_id)

            manifest[link_url] = {
                **manifest[link_url],
                "status": "done",
                "title": resolved_title,
                "getnote_note_id": getnote_note_id,
                "knowledge_base_added": True,
                "markdown_path": str(md_path),
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            save_manifest(manifest_path, manifest)
        except Exception as exc:
            manifest[link_url] = {
                **entry,
                "title": title,
                "platform": platform,
                "status": "failed",
                "error": str(exc),
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            save_manifest(manifest_path, manifest)
            print(f"  FAILED: {exc}", flush=True)
        finally:
            sleep_with_log(spacing_seconds(args.note_spacing_seconds, args.note_spacing_jitter_seconds))


if __name__ == "__main__":
    main()
