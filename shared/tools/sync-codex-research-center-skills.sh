#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_BASE="${REPO_ROOT}/projects/research-center/skills"
TARGET_BASE="${HOME}/.codex/skills"

SKILLS=(
  "ai-service-reference-ingest"
  "experience-to-system-synthesis"
  "prompt-pack-rebuild"
  "system-refactor-from-synthesis"
)

usage() {
  cat <<EOF
Usage:
  ${0} status
  ${0} install

Commands:
  status   Show Codex skill symlink status
  install  Symlink repo skills into ~/.codex/skills

Notes:
  - Repo skills remain the source of truth.
  - Restart or reload Codex after install if the / skill menu does not refresh.
EOF
}

ensure_target_base() {
  mkdir -p "${TARGET_BASE}"
}

show_status() {
  ensure_target_base
  for skill in "${SKILLS[@]}"; do
    src="${SOURCE_BASE}/${skill}"
    dst="${TARGET_BASE}/${skill}"
    src_status="missing"
    dst_status="absent"
    if [[ -d "${src}" ]]; then
      src_status="ok"
    fi
    if [[ -L "${dst}" ]]; then
      dst_status="linked"
    elif [[ -e "${dst}" ]]; then
      dst_status="exists-nonlink"
    fi
    printf '%-28s source=%-7s target=%s\n' "${skill}" "${src_status}" "${dst_status}"
  done
}

install_skills() {
  ensure_target_base
  for skill in "${SKILLS[@]}"; do
    src="${SOURCE_BASE}/${skill}"
    dst="${TARGET_BASE}/${skill}"
    if [[ ! -d "${src}" ]]; then
      printf 'Skipping %s: source missing at %s\n' "${skill}" "${src}" >&2
      continue
    fi
    if [[ -e "${dst}" && ! -L "${dst}" ]]; then
      printf 'Skipping %s: target exists and is not a symlink at %s\n' "${skill}" "${dst}" >&2
      continue
    fi
    ln -sfn "${src}" "${dst}"
    printf 'Linked %s -> %s\n' "${dst}" "${src}"
  done
}

case "${1:-status}" in
  status)
    show_status
    ;;
  install)
    install_skills
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
