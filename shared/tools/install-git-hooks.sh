#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hooks_dir="${repo_root}/.githooks"

if [[ ! -d "${hooks_dir}" ]]; then
  echo "missing hooks directory: ${hooks_dir}" >&2
  exit 1
fi

find "${hooks_dir}" -type f -exec chmod +x {} \;
git config core.hooksPath "${hooks_dir}"

echo "hooksPath set to ${hooks_dir}"
