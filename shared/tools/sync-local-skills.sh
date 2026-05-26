#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_BASE="${REPO_ROOT}/projects/research-center/skills"
TARGET_BASE="${HOME}/.claude/skills"
MANAGED_PREFIX="mindsync-"

SKILLS=(
  "task-routing"
  "artifact-readiness-check"
  "handoff-packaging"
  "research-brief"
  "research-synthesis"
  "source-to-review"
  "knowledge-ingest"
  "insight-handoff"
  "product-framing-spec"
  "business-diagnosis"
  "architecture-boundary-plan"
  "qa-gate-review"
  "content-grounded-transform"
)

usage() {
  cat <<EOF
Usage:
  ${0} status
  ${0} list
  ${0} install
  ${0} remove

Commands:
  status   Show repo skills and local symlink status
  list     Show the skills managed by this script
  install  Symlink repo skills into ~/.claude/skills with prefix '${MANAGED_PREFIX}'
  remove   Remove only symlinks previously created by this script

Notes:
  - Repo skills remain the source of truth.
  - This script creates symlinks like ~/.claude/skills/${MANAGED_PREFIX}<skill-slug>
  - It does not modify Paperclip core or company-managed skill state.
EOF
}

ensure_target_base() {
  mkdir -p "${TARGET_BASE}"
}

target_for() {
  local skill="$1"
  printf '%s/%s%s\n' "${TARGET_BASE}" "${MANAGED_PREFIX}" "${skill}"
}

source_for() {
  local skill="$1"
  printf '%s/%s\n' "${SOURCE_BASE}" "${skill}"
}

list_skills() {
  printf 'Managed skills:\n'
  for skill in "${SKILLS[@]}"; do
    printf '  - %s\n' "${skill}"
  done
}

show_status() {
  ensure_target_base
  printf 'Source base: %s\n' "${SOURCE_BASE}"
  printf 'Target base: %s\n' "${TARGET_BASE}"
  printf '\n'
  for skill in "${SKILLS[@]}"; do
    local_src="$(source_for "${skill}")"
    local_dst="$(target_for "${skill}")"
    src_status="missing"
    dst_status="absent"
    if [[ -d "${local_src}" ]]; then
      src_status="ok"
    fi
    if [[ -L "${local_dst}" ]]; then
      dst_status="linked"
    elif [[ -e "${local_dst}" ]]; then
      dst_status="exists-nonlink"
    fi
    printf '%-28s source=%-7s target=%s\n' "${skill}" "${src_status}" "${dst_status}"
  done
}

install_skills() {
  ensure_target_base
  for skill in "${SKILLS[@]}"; do
    local_src="$(source_for "${skill}")"
    local_dst="$(target_for "${skill}")"
    if [[ ! -d "${local_src}" ]]; then
      printf 'Skipping %s: source missing at %s\n' "${skill}" "${local_src}" >&2
      continue
    fi
    if [[ -e "${local_dst}" && ! -L "${local_dst}" ]]; then
      printf 'Skipping %s: target exists and is not a symlink at %s\n' "${skill}" "${local_dst}" >&2
      continue
    fi
    ln -sfn "${local_src}" "${local_dst}"
    printf 'Linked %s -> %s\n' "${local_dst}" "${local_src}"
  done
}

remove_skills() {
  for skill in "${SKILLS[@]}"; do
    local_dst="$(target_for "${skill}")"
    if [[ -L "${local_dst}" ]]; then
      rm -f "${local_dst}"
      printf 'Removed %s\n' "${local_dst}"
    fi
  done
}

command="${1:-status}"
case "${command}" in
  status)
    show_status
    ;;
  list)
    list_skills
    ;;
  install)
    install_skills
    ;;
  remove)
    remove_skills
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
