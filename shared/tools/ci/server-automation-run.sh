#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ROOT="${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-${PAPERCLIP_EXECUTION_WORKTREE_ROOT:-/opt/automation/worktrees}}"
API_BASE="${PAPERCLIP_API_BASE:-http://127.0.0.1:3100}"
API_KEY="${PAPERCLIP_API_KEY:-}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-}"
TASK_CLASS="${PAPERCLIP_TASK_CLASS:-automation-execution}"
EXECUTION_ROUTE="${PAPERCLIP_EXECUTION_ROUTE:-server_automation}"
GIT_USER_NAME="${PAPERCLIP_AUTOMATION_GIT_USER_NAME:-Paperclip Automation}"
GIT_USER_EMAIL="${PAPERCLIP_AUTOMATION_GIT_USER_EMAIL:-paperclip-automation@local}"
AUTO_FINALIZE="${PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE:-1}"

ISSUE_ID="${PAPERCLIP_ISSUE_ID:-}"
CWD_OVERRIDE="${PAPERCLIP_CWD:-}"
DESCRIPTION_OVERRIDE="${PAPERCLIP_ISSUE_DESCRIPTION:-}"
COMMIT_MESSAGE_OVERRIDE="${PAPERCLIP_AUTOMATION_COMMIT_MESSAGE:-}"
COMMAND=""

usage() {
  cat <<'EOF'
Usage:
  shared/tools/ci/server-automation-run.sh --issue-id <id> --cwd <path> --command "<cmd>"

Environment:
  PAPERCLIP_API_BASE
  PAPERCLIP_API_KEY
  PAPERCLIP_COMPANY_ID
  PAPERCLIP_ISSUE_ID
  PAPERCLIP_CWD
  PAPERCLIP_TASK_CLASS
  PAPERCLIP_EXECUTION_ROUTE
  PAPERCLIP_ISSUE_DESCRIPTION
  PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT / PAPERCLIP_EXECUTION_WORKTREE_ROOT
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=1
  PAPERCLIP_AUTOMATION_COMMIT_MESSAGE
  PAPERCLIP_AUTOMATION_GIT_USER_NAME
  PAPERCLIP_AUTOMATION_GIT_USER_EMAIL
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue-id)
      ISSUE_ID="${2:-}"
      shift 2
      ;;
    --cwd)
      CWD_OVERRIDE="${2:-}"
      shift 2
      ;;
    --command)
      COMMAND="${2:-}"
      shift 2
      ;;
    --task-class)
      TASK_CLASS="${2:-}"
      shift 2
      ;;
    --execution-route)
      EXECUTION_ROUTE="${2:-}"
      shift 2
      ;;
    --description)
      DESCRIPTION_OVERRIDE="${2:-}"
      shift 2
      ;;
    --commit-message)
      COMMIT_MESSAGE_OVERRIDE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ISSUE_ID" || -z "$CWD_OVERRIDE" || -z "$COMMAND" ]]; then
  echo "issue id, cwd, and command are required" >&2
  usage >&2
  exit 1
fi

if [[ -z "$COMPANY_ID" ]]; then
  echo "PAPERCLIP_COMPANY_ID is required" >&2
  exit 1
fi

node shared/tools/ci/server-automation-guard.mjs \
  --cwd "$CWD_OVERRIDE" \
  --expected-root "$EXPECTED_ROOT" \
  --task-class "$TASK_CLASS" \
  --execution-route "$EXECUTION_ROUTE" \
  --description "$DESCRIPTION_OVERRIDE"

(
  cd "$CWD_OVERRIDE"
  /usr/bin/env bash -lc "$COMMAND"
)

if [[ "$AUTO_FINALIZE" != "1" ]]; then
  exit 0
fi

if [[ -z "$API_KEY" ]]; then
  echo "PAPERCLIP_API_KEY is required when auto finalize is enabled" >&2
  exit 1
fi

COMMIT_MESSAGE="${COMMIT_MESSAGE_OVERRIDE:-chore(automation): finalize ${ISSUE_ID}}"

node shared/tools/ci/server-automation-finalizer.mjs \
  --issue-id "$ISSUE_ID" \
  --cwd "$CWD_OVERRIDE" \
  --company-id "$COMPANY_ID" \
  --api-base "$API_BASE" \
  --api-key "$API_KEY" \
  --commit-message "$COMMIT_MESSAGE" \
  --git-user-name "$GIT_USER_NAME" \
  --git-user-email "$GIT_USER_EMAIL"
