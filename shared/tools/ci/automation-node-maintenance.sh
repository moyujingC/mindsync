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
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

log() {
  printf '[automation-maintenance] %s\n' "$*"
}

free_gb() {
  df -Pk / | awk 'NR==2 { print int($4 / 1024 / 1024) }'
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

  if [[ -d "${HEARTBEAT_REPO_ROOT}/.git" ]]; then
    git -C "${HEARTBEAT_REPO_ROOT}" fetch origin --prune || true
    git -C "${HEARTBEAT_REPO_ROOT}" reset --hard origin/main || true
    git -C "${HEARTBEAT_REPO_ROOT}" clean -fd || true
  fi

  if [[ -d "${EXECUTION_WORKTREE_ROOT}" ]]; then
    find "${EXECUTION_WORKTREE_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${WORKTREE_RETENTION_DAYS}" -exec rm -rf {} +
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

main() {
  log "Free disk before cleanup: $(free_gb)G"
  cleanup_runner_temp
  cleanup_git_worktrees
  cleanup_package_caches
  cleanup_paperclip_logs
  log "Free disk after cleanup: $(free_gb)G"
}

main "$@"
