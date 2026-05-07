#!/usr/bin/env bash
set -euo pipefail

RUNNER_ROOT="${RUNNER_ROOT:-/opt/mindsync-ci/actions-runner}"
REPO_ROOT="${REPO_ROOT:-/opt/automation/app/mindsync}"
HEARTBEAT_REPO_ROOT="${HEARTBEAT_REPO_ROOT:-/opt/automation/app/mindsync-heartbeat}"
EXECUTION_WORKTREE_ROOT="${EXECUTION_WORKTREE_ROOT:-/opt/automation/worktrees}"
PAPERCLIP_HOME="${PAPERCLIP_HOME:-/data/paperclip}"
MIN_FREE_GB="${MIN_FREE_GB:-12}"
TEMP_RETENTION_DAYS="${TEMP_RETENTION_DAYS:-3}"
RUNNER_LOG_RETENTION_DAYS="${RUNNER_LOG_RETENTION_DAYS:-7}"
PAPERCLIP_LOG_RETENTION_DAYS="${PAPERCLIP_LOG_RETENTION_DAYS:-30}"
PAPERCLIP_LOG_GZIP_AFTER_DAYS="${PAPERCLIP_LOG_GZIP_AFTER_DAYS:-3}"
WORKTREE_RETENTION_DAYS="${WORKTREE_RETENTION_DAYS:-3}"
PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE:-}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:-}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID:-}"
PAPERCLIP_PROJECT_NAME="${PAPERCLIP_PROJECT_NAME:-一镜一梳}"
PAPERCLIP_ENGINEER_AGENT_ID="${PAPERCLIP_ENGINEER_AGENT_ID:-fd835fc1-7e14-487f-ba02-45eed5f6c221}"
PAPERCLIP_ESCALATION_USER_ID="${PAPERCLIP_ESCALATION_USER_ID:-}"
PAPERCLIP_ENGINEER_ESCALATE_MAX_FAILURE_COMMENTS="${PAPERCLIP_ENGINEER_ESCALATE_MAX_FAILURE_COMMENTS:-3}"
PAPERCLIP_ENGINEER_ESCALATE_MAX_AGE_MINUTES="${PAPERCLIP_ENGINEER_ESCALATE_MAX_AGE_MINUTES:-90}"
PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_AGE_THRESHOLD="${PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_AGE_THRESHOLD:-0}"
PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_PUBLIC_BLOCKER="${PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_PUBLIC_BLOCKER:-0}"
PAPERCLIP_ENGINEER_ESCALATE_APPLY="${PAPERCLIP_ENGINEER_ESCALATE_APPLY:-0}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/ci/automation-node-maintenance.sh

Environment overrides:
  RUNNER_ROOT
  REPO_ROOT
  HEARTBEAT_REPO_ROOT
  EXECUTION_WORKTREE_ROOT
  PAPERCLIP_HOME
  MIN_FREE_GB
  TEMP_RETENTION_DAYS
  RUNNER_LOG_RETENTION_DAYS
  PAPERCLIP_LOG_RETENTION_DAYS
  PAPERCLIP_LOG_GZIP_AFTER_DAYS
  WORKTREE_RETENTION_DAYS
  PAPERCLIP_API_BASE
  PAPERCLIP_API_KEY
  PAPERCLIP_COMPANY_ID
  PAPERCLIP_PROJECT_NAME
  PAPERCLIP_ENGINEER_AGENT_ID
  PAPERCLIP_ESCALATION_USER_ID
  PAPERCLIP_ENGINEER_ESCALATE_MAX_FAILURE_COMMENTS
  PAPERCLIP_ENGINEER_ESCALATE_MAX_AGE_MINUTES
  PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_AGE_THRESHOLD
  PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_PUBLIC_BLOCKER
  PAPERCLIP_ENGINEER_ESCALATE_APPLY
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

log() {
  printf '[automation-maintenance] %s\n' "$*"
}

git_status_short() {
  local repo_root="$1"
  git -C "${repo_root}" status --short --untracked-files=normal 2>/dev/null || return 1
}

ensure_clean_checkout_or_exit() {
  local repo_root="$1"
  local label="$2"
  local status_output

  if [[ ! -d "${repo_root}/.git" ]]; then
    log "Skip ${label} cleanliness check: ${repo_root} is not a git checkout"
    return 0
  fi

  status_output="$(git_status_short "${repo_root}")"
  if [[ -z "${status_output}" ]]; then
    log "${label} is clean: ${repo_root}"
    return 0
  fi

  log "Detected dirty checkout drift in ${label}: ${repo_root}"
  printf '%s\n' "${status_output}" >&2
  log "Refuse to continue maintenance: main mirror and heartbeat checkout are observe-only and must stay clean"
  exit 20
}

free_gb() {
  df -Pk / | awk 'NR==2 { print int($4 / 1024 / 1024) }'
}

classify_dirty_worktree() {
  local worktree_dir="$1"
  local status_output path code_residue=0

  status_output="$(git_status_short "$worktree_dir" || true)"
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line:3}"
    if [[ "$path" == *" -> "* ]]; then
      path="${path##* -> }"
    fi
    case "$path" in
      *.md|*.txt|projects/*/docs/*|company/*)
        ;;
      *)
        code_residue=1
        break
        ;;
    esac
  done <<<"$status_output"

  if [[ "$code_residue" -eq 1 ]]; then
    printf 'code_or_config_residue'
  else
    printf 'doc_or_delivery_residue'
  fi
}

cleanup_runner_temp() {
  if [[ -d "${RUNNER_ROOT}/_work/_temp" ]]; then
    find "${RUNNER_ROOT}/_work/_temp" -mindepth 1 -mtime +"${TEMP_RETENTION_DAYS}" -exec rm -rf {} +
  fi

  if [[ -d "${RUNNER_ROOT}/_diag" ]]; then
    find "${RUNNER_ROOT}/_diag" -type f -mtime +"${RUNNER_LOG_RETENTION_DAYS}" -delete
  fi
}

cleanup_git_worktrees() {
  if [[ -d "${REPO_ROOT}/.git" ]]; then
    git -C "${REPO_ROOT}" worktree prune --verbose || true
  fi

  if [[ -d "${EXECUTION_WORKTREE_ROOT}" ]]; then
    while IFS= read -r worktree_dir; do
      [[ -n "${worktree_dir}" ]] || continue
      if git -C "${worktree_dir}" status --short --untracked-files=normal 2>/dev/null | grep -q .; then
        log "Skip dirty worktree cleanup: ${worktree_dir} classification=$(classify_dirty_worktree "${worktree_dir}")"
        continue
      fi
      rm -rf "${worktree_dir}"
    done < <(find "${EXECUTION_WORKTREE_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${WORKTREE_RETENTION_DAYS}" | sort)
  fi
}

cleanup_package_caches() {
  if command -v npm >/dev/null 2>&1; then
    npm cache verify >/dev/null 2>&1 || true
    if (( $(free_gb) < MIN_FREE_GB )); then
      npm cache clean --force >/dev/null 2>&1 || true
    fi
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 -m pip cache info >/dev/null 2>&1 || true
    if (( $(free_gb) < MIN_FREE_GB )); then
      python3 -m pip cache purge >/dev/null 2>&1 || true
    fi
  fi
}

cleanup_paperclip_logs() {
  local log_dir
  log_dir="${PAPERCLIP_HOME}/instances/default/logs"

  if [[ -d "${log_dir}" ]]; then
    find "${log_dir}" -type f -name '*.log' -mtime +"${PAPERCLIP_LOG_GZIP_AFTER_DAYS}" -exec gzip -f {} +
    find "${log_dir}" -type f -name '*.gz' -mtime +"${PAPERCLIP_LOG_RETENTION_DAYS}" -delete
  fi
}

run_engineer_escalation_audit() {
  if [[ -z "${PAPERCLIP_API_BASE}" || -z "${PAPERCLIP_API_KEY}" || -z "${PAPERCLIP_COMPANY_ID}" ]]; then
    log "Skip Engineer escalation audit: PAPERCLIP_API_BASE / PAPERCLIP_API_KEY / PAPERCLIP_COMPANY_ID not fully configured"
    return 0
  fi

  local args=(
    "shared/tools/ci/escalate-engineer-stuck-issues.mjs"
    "--company-id" "${PAPERCLIP_COMPANY_ID}"
    "--project-name" "${PAPERCLIP_PROJECT_NAME}"
    "--engineer-agent-id" "${PAPERCLIP_ENGINEER_AGENT_ID}"
    "--max-failure-comments" "${PAPERCLIP_ENGINEER_ESCALATE_MAX_FAILURE_COMMENTS}"
    "--max-age-minutes" "${PAPERCLIP_ENGINEER_ESCALATE_MAX_AGE_MINUTES}"
  )

  if [[ -n "${PAPERCLIP_ESCALATION_USER_ID}" ]]; then
    args+=("--human-user-id" "${PAPERCLIP_ESCALATION_USER_ID}")
  fi
  if [[ "${PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_AGE_THRESHOLD}" == "1" ]]; then
    args+=("--include-age-threshold")
  fi
  if [[ "${PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_PUBLIC_BLOCKER}" == "1" ]]; then
    args+=("--include-public-blocker")
  fi
  if [[ "${PAPERCLIP_ENGINEER_ESCALATE_APPLY}" == "1" ]]; then
    args+=("--apply")
  fi

  log "Run Engineer escalation audit"
  (
    cd "${REPO_ROOT}"
    PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE}" \
    PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}" \
    node "${args[@]}"
  ) || log "Engineer escalation audit failed; continue maintenance"
}

main() {
  log "Free disk before cleanup: $(free_gb)G"
  ensure_clean_checkout_or_exit "${REPO_ROOT}" "main mirror checkout"
  ensure_clean_checkout_or_exit "${HEARTBEAT_REPO_ROOT}" "heartbeat checkout"
  cleanup_runner_temp
  cleanup_git_worktrees
  cleanup_package_caches
  cleanup_paperclip_logs
  run_engineer_escalation_audit
  log "Free disk after cleanup: $(free_gb)G"
}

main "$@"
