#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import yaml


ROOT = Path("projects/xinran-jobhunt/jd-database")
INDEX_FILE = ROOT / "index.yaml"
JOBS_DIR = ROOT / "jobs"
REQUIRED_FRONTMATTER = {
    "job_id",
    "captured_at",
    "source_platform",
    "source_type",
    "status",
    "applied_at",
    "company",
    "role_title",
    "department",
    "city",
    "work_mode",
    "salary_range",
    "experience_requirement",
    "education_requirement",
    "primary_track",
    "secondary_track",
    "match_score",
    "boss_competitiveness_available",
    "keywords",
    "must_have",
    "nice_to_have",
    "risks",
}


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def load_job(path: Path) -> dict:
    text = path.read_text()
    if not text.startswith("---\n"):
        raise ValueError(f"{path} 缺少 frontmatter")
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        raise ValueError(f"{path} frontmatter 格式异常")
    return yaml.safe_load(parts[1]) or {}


def main() -> int:
    index = yaml.safe_load(INDEX_FILE.read_text()) or {}
    seen_ids: set[str] = set()
    indexed_files: dict[str, str] = {}

    for item in index.get("jobs", []):
        job_id = item.get("job_id", "")
        rel_file = item.get("file", "")
        full_path = ROOT / rel_file

        if not job_id:
            return fail(f"index.yaml 存在空 job_id: {rel_file}")
        if job_id in seen_ids:
            return fail(f"index.yaml 出现重复 job_id: {job_id}")
        if item.get("status") != "applied":
            return fail(f"{job_id} 状态不是 applied")
        if not item.get("applied_at"):
            return fail(f"{job_id} 缺少 applied_at")
        if not full_path.exists():
            return fail(f"index.yaml 引用文件不存在: {rel_file}")

        seen_ids.add(job_id)
        indexed_files[rel_file] = job_id

    for path in sorted(JOBS_DIR.glob("*.md")):
        if path.name == "README.md":
            continue
        rel_file = str(path.relative_to(ROOT))
        if rel_file not in indexed_files:
            return fail(f"jobs 中存在未被 index.yaml 收录的文件: {rel_file}")

        frontmatter = load_job(path)
        missing = REQUIRED_FRONTMATTER - set(frontmatter.keys())
        if missing:
            return fail(f"{rel_file} 缺少字段: {', '.join(sorted(missing))}")
        if frontmatter.get("job_id") != indexed_files[rel_file]:
            return fail(f"{rel_file} 的 job_id 与 index.yaml 不一致")
        if frontmatter.get("status") != "applied":
            return fail(f"{rel_file} 状态不是 applied")
        if not frontmatter.get("applied_at"):
            return fail(f"{rel_file} 缺少 applied_at")

    print("[OK] index.yaml 与 jobs 结构一致，且全部为已投递状态。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
