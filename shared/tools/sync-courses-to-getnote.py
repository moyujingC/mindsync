#!/usr/bin/env python3
"""Sync projects/research-center/courses/ Markdown content to Get笔记.

All courses live under a single Get笔记 knowledge base named "研究中心课程目录".
Each course becomes a parent note (folder-like), and each Markdown chapter becomes
a child note under that parent.

Environment variables:
  GETNOTE_API_KEY    required, format gk_live_xxx
  GETNOTE_CLIENT_ID  required, format cli_xxx

Examples:
  dry-run discovery:
    python3 shared/tools/sync-courses-to-getnote.py --dry-run

  sync a single course (max 5 notes):
    python3 shared/tools/sync-courses-to-getnote.py --course "2026-07-19-Codex 与 LLM 量化交易实战课" --max-notes 5

  retry failed entries only:
    python3 shared/tools/sync-courses-to-getnote.py --retry-failed-only
"""

import argparse
import hashlib
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


BASE_URL = "https://openapi.biji.com"
SAVE_URL = f"{BASE_URL}/open/api/v1/resource/note/save"
KB_CREATE_URL = f"{BASE_URL}/open/api/v1/resource/knowledge/create"
KB_LIST_URL = f"{BASE_URL}/open/api/v1/resource/knowledge/list"
KB_ADD_URL = f"{BASE_URL}/open/api/v1/resource/knowledge/note/batch-add"

COURSES_ROOT = Path(__file__).resolve().parents[2] / "projects" / "research-center" / "courses"
META_DIR = COURSES_ROOT / "_getnote_sync"
MANIFEST_PATH = META_DIR / "manifest.json"
ROOT_KB_NAME = "研究中心课程目录"

SKIP_DIRS = {
    "_getnote_sync",
    ".git",
    ".github",
    ".claude",
    ".codex",
    ".obsidian",
    "node_modules",
    ".venv",
    "venv",
    "target",
    "dist",
    "build",
    "__pycache__",
    ".pytest_cache",
    "agent-course-versions",
}

TAGS = ["研究中心", "课程"]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def mtime_iso(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds")


def safe_slug(text: str) -> str:
    text = re.sub(r"[^\w\-一-鿿]+", "-", text, flags=re.UNICODE)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "course"


def course_slug_from_dir(name: str) -> str:
    # Strip leading YYYY-MM-DD- prefix if present.
    return re.sub(r"^\d{4}-\d{2}-\d{2}-", "", name)


def course_title_from_slug(slug: str) -> str:
    return slug.strip()


def get_headers():
    return {
        "Authorization": os.environ["GETNOTE_API_KEY"],
        "X-Client-ID": os.environ["GETNOTE_CLIENT_ID"],
        "Content-Type": "application/json",
    }


def request_json(url: str, method: str = "GET", data=None, timeout: int = 60):
    payload = None
    if data is not None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=get_headers(), method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as exc:
        try:
            body = json.loads(exc.read().decode("utf-8", errors="replace"))
        except Exception:
            body = {}
        return {"success": False, "http_status": exc.code, "error": body}


def retry_request(make_request, max_attempts: int = 5, retry_seconds: int = 65):
    last_error = None
    for attempt in range(max_attempts):
        body = make_request()
        if body.get("success"):
            return body
        error = body.get("error") or {}
        code = error.get("code") if isinstance(error, dict) else None
        http_status = body.get("http_status")
        last_error = body
        if code in (10202, 42900) or http_status == 429:
            if attempt < max_attempts - 1:
                sleep_with_log(retry_seconds)
                continue
        raise RuntimeError(json.dumps(body, ensure_ascii=False))
    raise RuntimeError(json.dumps(last_error, ensure_ascii=False))


def list_knowledge_bases(page: int = 1):
    url = f"{KB_LIST_URL}?{urllib.parse.urlencode({'page': page})}"
    return retry_request(lambda: request_json(url, method="GET"))


def find_knowledge_base(name: str):
    page = 1
    while True:
        body = list_knowledge_bases(page)
        data = body.get("data") or {}
        for topic in data.get("topics") or []:
            if topic.get("name") == name:
                return topic
        if not data.get("has_more"):
            return None
        page += 1


def create_knowledge_base(name: str, description: str = ""):
    data = {
        "name": name,
        "description": description,
        "cover": "",
    }
    body = retry_request(lambda: request_json(KB_CREATE_URL, method="POST", data=data), max_attempts=3, retry_seconds=180)
    return body.get("data") or {}


def ensure_root_knowledge_base(manifest: dict) -> str:
    kb_map = manifest.setdefault("kb_map", {})
    topic_id = kb_map.get("root")
    if topic_id:
        return topic_id

    existing = find_knowledge_base(ROOT_KB_NAME)
    if existing:
        topic_id = str(existing.get("topic_id") or "")
    else:
        created = create_knowledge_base(ROOT_KB_NAME, "知行工坊研究中心课程总目录")
        topic_id = str(created.get("topic_id") or "")

    if not topic_id:
        raise RuntimeError(f"Failed to create or find knowledge base: {ROOT_KB_NAME}")

    kb_map["root"] = topic_id
    return topic_id


def submit_plain_text_note(title: str, content: str, tags: list[str], parent_id: str = "0"):
    data = {
        "title": title,
        "content": content,
        "note_type": "plain_text",
        "tags": tags,
        "parent_id": int(parent_id) if parent_id and str(parent_id).isdigit() else 0,
    }
    body = retry_request(lambda: request_json(SAVE_URL, method="POST", data=data))
    note_id = str((body.get("data") or {}).get("note_id") or "")
    if not note_id or note_id == "0":
        raise RuntimeError(f"save response missing note_id: {json.dumps(body, ensure_ascii=False)}")
    return note_id


def batch_add_notes_to_kb(topic_id: str, note_ids: list[str]):
    # API supports max 20 per batch.
    for i in range(0, len(note_ids), 20):
        chunk = note_ids[i : i + 20]
        retry_request(lambda: request_json(KB_ADD_URL, method="POST", data={"topic_id": topic_id, "note_ids": chunk}))


def load_manifest(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_manifest(path: Path, manifest: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))


def sleep_with_log(seconds: float):
    if seconds <= 0:
        return
    print(f"  sleeping {round(seconds, 1)}s", flush=True)
    time.sleep(seconds)


def spacing_seconds(base_seconds: int, jitter_seconds: int):
    if base_seconds <= 0:
        return 0.0
    if jitter_seconds <= 0:
        return float(base_seconds)
    return float(base_seconds + random.uniform(0, jitter_seconds))


def discover_courses(root: Path):
    courses = []
    for item in sorted(root.iterdir()):
        if item.is_dir() and item.name not in SKIP_DIRS and not item.name.startswith("."):
            courses.append(item)
    return courses


def discover_chapters(course_dir: Path):
    chapters = []
    for path in sorted(course_dir.rglob("*.md")):
        # Skip any path component that is in the skip list.
        if any(part in SKIP_DIRS or part.startswith(".") for part in path.relative_to(course_dir).parts[:-1]):
            continue
        chapters.append(path)
    return chapters


def extract_first_h1(content: str) -> str | None:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return None


def build_note_title(rel_path: Path, content: str, course_title: str) -> str:
    h1 = extract_first_h1(content)
    if h1:
        return h1

    # Fallback: clean filename.
    name = rel_path.stem
    # Remove leading chapter number.
    name = re.sub(r"^\d+\｜", "", name)
    # Remove trailing course name and platform.
    name = re.sub(r"-" + re.escape(course_title) + r"-[^-]+$", "", name)
    name = re.sub(r"-[^-]+-[^-]+$", "", name)
    return name.strip() or rel_path.name


def build_note_content(rel_path: Path, raw_content: str, course_title: str) -> str:
    title = build_note_title(rel_path, raw_content, course_title)
    now = datetime.now().isoformat(timespec="seconds")
    meta = [
        f"# {title}",
        "",
        f"- 来源文件：`{rel_path}`",
        f"- 所属课程：{course_title}",
        f"- 同步时间：{now}",
        "",
    ]
    return "\n".join(meta) + raw_content


def build_course_parent_content(course_dir: Path, course_title: str) -> str:
    lines = [
        f"# {course_title}",
        "",
        f"- 课程目录：`{course_dir.name}`",
        f"- 同步时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "该笔记作为课程文件夹，下属笔记为该课程的章节内容。",
        "",
    ]
    return "\n".join(lines)


def ensure_course_parent_note(course_dir: Path, course_title: str, root_kb_id: str, manifest: dict, args):
    courses = manifest.setdefault("courses", {})
    slug = safe_slug(course_title)
    entry = courses.get(slug, {})

    file_hash = sha256_file(course_dir / "README.md") if (course_dir / "README.md").exists() else course_dir.name

    if (
        not args.retry_failed_only
        and entry.get("status") == "done"
        and entry.get("getnote_note_id")
    ):
        print(f"  Parent note exists: {course_title}")
        return entry["getnote_note_id"]

    if args.dry_run:
        print(f"  DRY-RUN parent: {course_title}")
        return "dry-run-parent-id"

    print(f"  Creating parent note: {course_title}")
    try:
        content = build_course_parent_content(course_dir, course_title)
        note_id = submit_plain_text_note(course_title, content, TAGS)
        entry = {
            **entry,
            "status": "done",
            "course_dir": course_dir.name,
            "getnote_note_id": note_id,
            "getnote_kb_id": root_kb_id,
            "note_title": course_title,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "error": None,
        }
        courses[slug] = entry
        save_manifest(MANIFEST_PATH, manifest)
        return note_id
    except Exception as exc:
        entry = {
            **entry,
            "status": "failed",
            "course_dir": course_dir.name,
            "note_title": course_title,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "error": str(exc),
        }
        courses[slug] = entry
        save_manifest(MANIFEST_PATH, manifest)
        raise


def sync_file(
    file_path: Path,
    rel_path: str,
    course_title: str,
    parent_note_id: str,
    root_kb_id: str,
    manifest: dict,
    args,
):
    files = manifest.setdefault("files", {})
    entry = files.get(rel_path, {})

    file_hash = sha256_file(file_path)
    file_mtime = mtime_iso(file_path)
    file_size = file_path.stat().st_size

    # Skip unchanged, successfully synced files.
    if (
        not args.retry_failed_only
        and entry.get("status") == "done"
        and entry.get("sha256") == file_hash
        and entry.get("getnote_note_id")
    ):
        print(f"  SKIP (unchanged): {rel_path}")
        return "skipped", entry

    if args.retry_failed_only and entry.get("status") not in {"failed"}:
        return "skipped", entry

    raw_content = file_path.read_text(encoding="utf-8", errors="replace")
    title = build_note_title(Path(rel_path), raw_content, course_title)
    content = build_note_content(Path(rel_path), raw_content, course_title)

    if args.dry_run:
        print(f"  DRY-RUN: {rel_path} -> '{title}'")
        return "dry_run", entry

    print(f"  SYNC: {rel_path} -> '{title}'", flush=True)

    try:
        note_id = submit_plain_text_note(title, content, TAGS, parent_id=parent_note_id)
        entry = {
            **entry,
            "status": "done",
            "sha256": file_hash,
            "mtime": file_mtime,
            "size": file_size,
            "getnote_note_id": note_id,
            "getnote_kb_id": root_kb_id,
            "getnote_parent_note_id": parent_note_id,
            "note_title": title,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "error": None,
        }
        files[rel_path] = entry
        save_manifest(MANIFEST_PATH, manifest)
        return "created", entry
    except Exception as exc:
        entry = {
            **entry,
            "status": "failed",
            "sha256": file_hash,
            "mtime": file_mtime,
            "size": file_size,
            "note_title": title,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "error": str(exc),
        }
        files[rel_path] = entry
        save_manifest(MANIFEST_PATH, manifest)
        print(f"    FAILED: {exc}", flush=True)
        return "failed", entry


def sync_course(course_dir: Path, root_kb_id: str, manifest: dict, args):
    dir_name = course_dir.name
    course_slug = course_slug_from_dir(dir_name)
    course_title = course_title_from_slug(course_slug)

    print(f"\nCourse: {course_title}")

    parent_note_id = ensure_course_parent_note(course_dir, course_title, root_kb_id, manifest, args)

    chapters = discover_chapters(course_dir)
    if args.max_notes is not None:
        chapters = chapters[: args.max_notes]

    created_note_ids = []
    results = {"created": 0, "skipped": 0, "failed": 0, "dry_run": 0}

    for chapter_path in chapters:
        rel_path = str(chapter_path.relative_to(COURSES_ROOT))
        status, entry = sync_file(
            chapter_path,
            rel_path,
            course_title,
            parent_note_id,
            root_kb_id,
            manifest,
            args,
        )
        results[status] += 1
        if status == "created":
            created_note_ids.append(entry["getnote_note_id"])

        if not args.dry_run and status == "created":
            save_manifest(MANIFEST_PATH, manifest)
            sleep_with_log(spacing_seconds(args.note_spacing_seconds, args.note_spacing_jitter_seconds))

    # Add parent note and chapter notes to the root KB.
    notes_to_add = created_note_ids[:]
    if not args.dry_run and parent_note_id and parent_note_id != "dry-run-parent-id":
        notes_to_add.insert(0, parent_note_id)

    if not args.dry_run and notes_to_add:
        print(f"  Adding {len(notes_to_add)} notes to KB '{ROOT_KB_NAME}'")
        batch_add_notes_to_kb(root_kb_id, notes_to_add)
        print(f"  Done.")

    return results


def sync_catalog(root_kb_id: str, manifest: dict, args):
    catalog_path = COURSES_ROOT / "README.md"
    if not catalog_path.exists():
        print("Catalog README.md not found, skipping.")
        return {"created": 0, "skipped": 0, "failed": 0, "dry_run": 0}

    print("\nCatalog: 研究中心课程目录")

    rel_path = str(catalog_path.relative_to(COURSES_ROOT))
    status, _ = sync_file(
        catalog_path,
        rel_path,
        "研究中心课程目录",
        "0",
        root_kb_id,
        manifest,
        args,
    )
    return {status: 1}


def main():
    parser = argparse.ArgumentParser(description="Sync research-center/courses Markdown to Get笔记")
    parser.add_argument("--dry-run", action="store_true", help="Discover files but do not call API")
    parser.add_argument("--course", help="Sync only one course directory by name")
    parser.add_argument("--max-notes", type=int, help="Maximum notes to create per course (excluding parent note)")
    parser.add_argument("--retry-failed-only", action="store_true", help="Only retry entries with status failed")
    parser.add_argument("--note-spacing-seconds", type=int, default=70, help="Base seconds between note creates")
    parser.add_argument("--note-spacing-jitter-seconds", type=int, default=30, help="Random jitter seconds")
    args = parser.parse_args()

    if not args.dry_run:
        for var in ("GETNOTE_API_KEY", "GETNOTE_CLIENT_ID"):
            if not os.environ.get(var):
                raise SystemExit(f"Environment variable {var} is required. Use --dry-run to skip.")

    META_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest(MANIFEST_PATH)

    started_at = datetime.now().isoformat(timespec="seconds")
    total = {"created": 0, "skipped": 0, "failed": 0, "dry_run": 0}

    courses = discover_courses(COURSES_ROOT)
    if args.course:
        courses = [c for c in courses if c.name == args.course]
        if not courses:
            raise SystemExit(f"Course not found: {args.course}")

    root_kb_id = ensure_root_knowledge_base(manifest) if not args.dry_run else "dry-run-root-kb-id"

    # Sync catalog first.
    catalog_results = sync_catalog(root_kb_id, manifest, args)
    for k in total:
        total[k] += catalog_results.get(k, 0)

    for course_dir in courses:
        course_results = sync_course(course_dir, root_kb_id, manifest, args)
        for k in total:
            total[k] += course_results.get(k, 0)

    finished_at = datetime.now().isoformat(timespec="seconds")
    manifest["last_run"] = {
        "started_at": started_at,
        "finished_at": finished_at,
        "notes_created": total["created"],
        "notes_skipped": total["skipped"],
        "notes_failed": total["failed"],
        "notes_dry_run": total["dry_run"],
        "courses_processed": len(courses),
    }
    save_manifest(MANIFEST_PATH, manifest)

    print("\n=== Summary ===")
    print(f"Courses processed: {len(courses)}")
    print(f"Notes created:     {total['created']}")
    print(f"Notes skipped:     {total['skipped']}")
    print(f"Notes failed:      {total['failed']}")
    if args.dry_run:
        print(f"Notes dry-run:     {total['dry_run']}")
    print(f"Started:  {started_at}")
    print(f"Finished: {finished_at}")


if __name__ == "__main__":
    main()
