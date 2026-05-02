#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_BASE="${REPO_ROOT}/projects/research-center/skills"
MANAGED_PREFIX="mindsync-"
TARGETS=(
  "${HOME}/.claude/skills"
  "${HOME}/.codex/skills"
)

SKILLS=(
  "task-routing"
  "artifact-readiness-check"
  "handoff-packaging"
  "research-brief"
  "research-synthesis"
  "knowledge-ingest"
  "insight-handoff"
  "product-framing-spec"
  "business-diagnosis"
  "architecture-boundary-plan"
  "qa-gate-review"
  "content-grounded-transform"
  "ui-ux-console-design"
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
  install  Symlink repo skills into local IDE runtimes with prefix '${MANAGED_PREFIX}'
  remove   Remove only symlinks previously created by this script

Notes:
  - Repo skills remain the source of truth.
  - This script creates symlinks like:
      - ~/.claude/skills/${MANAGED_PREFIX}<skill-slug>
      - ~/.codex/skills/${MANAGED_PREFIX}<skill-slug>
  - It does not modify Paperclip core or company-managed skill state.
EOF
}

ensure_target_bases() {
  local target_base
  for target_base in "${TARGETS[@]}"; do
    mkdir -p "${target_base}"
  done
}

target_label() {
  local target_base="$1"
  local parent_dir
  parent_dir="$(basename "$(dirname "${target_base}")")"
  printf '%s' "${parent_dir}"
}

target_for() {
  local target_base="$1"
  local skill="$2"
  printf '%s/%s%s\n' "${target_base}" "${MANAGED_PREFIX}" "${skill}"
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
  ensure_target_bases
  printf 'Source base: %s\n' "${SOURCE_BASE}"
  printf 'Managed targets:\n'
  local target_base
  for target_base in "${TARGETS[@]}"; do
    printf '  - %s\n' "${target_base}"
  done
  printf '\n'
  for skill in "${SKILLS[@]}"; do
    local_src="$(source_for "${skill}")"
    src_status="missing"
    if [[ -d "${local_src}" ]]; then
      src_status="ok"
    fi
    printf '%-28s source=%-7s' "${skill}" "${src_status}"
    for target_base in "${TARGETS[@]}"; do
      local_dst="$(target_for "${target_base}" "${skill}")"
      dst_status="absent"
      if [[ -L "${local_dst}" ]]; then
        dst_status="linked"
      elif [[ -e "${local_dst}" ]]; then
        dst_status="exists-nonlink"
      fi
      printf ' target[%s]=%s' "$(target_label "${target_base}")" "${dst_status}"
    done
    printf '\n'
  done
}

install_skills() {
  ensure_target_bases
  for skill in "${SKILLS[@]}"; do
    local_src="$(source_for "${skill}")"
    if [[ ! -d "${local_src}" ]]; then
      printf 'Skipping %s: source missing at %s\n' "${skill}" "${local_src}" >&2
      continue
    fi
    local target_base
    for target_base in "${TARGETS[@]}"; do
      local_dst="$(target_for "${target_base}" "${skill}")"
      if [[ -e "${local_dst}" && ! -L "${local_dst}" ]]; then
        printf 'Skipping %s for %s: target exists and is not a symlink at %s\n' "${skill}" "${target_base}" "${local_dst}" >&2
        continue
      fi
      ln -sfn "${local_src}" "${local_dst}"
      printf 'Linked %s -> %s\n' "${local_dst}" "${local_src}"
    done
  done
}

remove_skills() {
  local target_base
  for skill in "${SKILLS[@]}"; do
    for target_base in "${TARGETS[@]}"; do
      local_dst="$(target_for "${target_base}" "${skill}")"
      if [[ -L "${local_dst}" ]]; then
        rm -f "${local_dst}"
        printf 'Removed %s\n' "${local_dst}"
      fi
    done
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
