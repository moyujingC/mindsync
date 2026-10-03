#!/usr/bin/env python3
"""
Clone or update HA7CH School source code into the references directory.

Usage:
    python3 clone_ha7ch_school.py         # perform clone/update
    python3 clone_ha7ch_school.py --dry-run  # only print what would happen
"""

import argparse
import os
import subprocess
import sys

REPO_URL = "https://github.com/HA7CH/ha7ch-school.git"
REFERENCES_DIR = "/Users/xinran/Downloads/dev/mindsync/projects/ai-service-studio/references"
TARGET_DIR = os.path.join(REFERENCES_DIR, "ha7ch-school")


def run(cmd, cwd=None, check=True):
    print(f"$ {' '.join(cmd)}")
    if args.dry_run:
        return None
    result = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if check and result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result


def main():
    parser = argparse.ArgumentParser(description="Clone or update HA7CH School source")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without executing")
    global args
    args = parser.parse_args()

    if not os.path.isdir(REFERENCES_DIR):
        print(f"References directory does not exist: {REFERENCES_DIR}")
        sys.exit(1)

    if os.path.isdir(os.path.join(TARGET_DIR, ".git")):
        print(f"[UPDATE] Existing repo found at {TARGET_DIR}")
        print(f"         Will run: git pull origin master")
        if args.dry_run:
            print("Dry run: skipping git pull")
            return
        run(["git", "pull", "origin", "master"], cwd=TARGET_DIR)
        print(f"Updated: {TARGET_DIR}")
    elif os.path.exists(TARGET_DIR):
        print(f"[CONFLICT] Path exists but is not a git repo: {TARGET_DIR}")
        print("Please remove or rename it manually, then re-run.")
        sys.exit(1)
    else:
        print(f"[CLONE] Will clone {REPO_URL}")
        print(f"        into {TARGET_DIR}")
        if args.dry_run:
            print("Dry run: skipping git clone")
            return
        run(["git", "clone", REPO_URL, TARGET_DIR], cwd=REFERENCES_DIR)
        print(f"Cloned: {TARGET_DIR}")


if __name__ == "__main__":
    main()
