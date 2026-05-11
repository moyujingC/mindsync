#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
GUARD_SCRIPT="${REPO_ROOT}/shared/tools/ci/server-automation-guard.mjs"
FINALIZER_SCRIPT="${REPO_ROOT}/shared/tools/ci/server-automation-finalizer.mjs"

EXPECTED_ROOT="${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-${PAPERCLIP_EXECUTION_WORKTREE_ROOT:-/opt/automation/worktrees}}"
TASK_CLASS="${PAPERCLIP_TASK_CLASS:-}"
EXECUTION_ROUTE="${PAPERCLIP_EXECUTION_ROUTE:-}"
DESCRIPTION_OVERRIDE="${PAPERCLIP_ISSUE_DESCRIPTION:-}"
REAL_COMMAND="${PAPERCLIP_REAL_COMMAND:-}"
AUTO_FINALIZE="${PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE:-0}"
PROXY_MODE="${PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE:-passive}"
FREEZE_SERVER_AUTOMATION="${PAPERCLIP_SERVER_AUTOMATION_FREEZE:-0}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-}"
API_BASE="${PAPERCLIP_API_BASE:-${PAPERCLIP_API_URL:-http://127.0.0.1:3100}}"
API_KEY="${PAPERCLIP_API_KEY:-}"
ISSUE_ID="${PAPERCLIP_ISSUE_ID:-${PAPERCLIP_TASK_ID:-}}"
COMMIT_MESSAGE="${PAPERCLIP_AUTOMATION_COMMIT_MESSAGE:-}"
GIT_USER_NAME="${PAPERCLIP_AUTOMATION_GIT_USER_NAME:-Paperclip Automation}"
GIT_USER_EMAIL="${PAPERCLIP_AUTOMATION_GIT_USER_EMAIL:-paperclip-automation@local}"
WORKSPACE_CWD="${PAPERCLIP_WORKSPACE_CWD:-}"
WORKSPACE_WORKTREE_PATH="${PAPERCLIP_WORKSPACE_WORKTREE_PATH:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/ci/server-automation-command-proxy.sh [adapter args...]

Environment:
  PAPERCLIP_REAL_COMMAND                  Required. Real adapter binary, e.g. codex / claude / pi
  PAPERCLIP_TASK_CLASS                    Optional task_class override
  PAPERCLIP_EXECUTION_ROUTE               Optional execution_route override
  PAPERCLIP_ISSUE_DESCRIPTION             Optional issue metadata block
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=1
  PAPERCLIP_SERVER_AUTOMATION_FREEZE=1        Refuse server-side writable execution
  PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE  passive (default) or enforce
  PAPERCLIP_ISSUE_ID
  PAPERCLIP_TASK_ID
  PAPERCLIP_API_BASE
  PAPERCLIP_API_URL
  PAPERCLIP_API_KEY
  PAPERCLIP_COMPANY_ID
  PAPERCLIP_AUTOMATION_COMMIT_MESSAGE
  PAPERCLIP_AUTOMATION_GIT_USER_NAME
  PAPERCLIP_AUTOMATION_GIT_USER_EMAIL
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -z "$REAL_COMMAND" ]]; then
  echo "PAPERCLIP_REAL_COMMAND is required" >&2
  exit 1
fi

if [[ ! -f "$GUARD_SCRIPT" ]]; then
  echo "Missing guard script: $GUARD_SCRIPT" >&2
  exit 1
fi

if [[ ! -f "$FINALIZER_SCRIPT" ]]; then
  echo "Missing finalizer script: $FINALIZER_SCRIPT" >&2
  exit 1
fi

cwd="$(pwd)"
execution_cwd="$cwd"

normalize_path() {
  printf '%s' "${1%/}"
}

path_equals_or_within() {
  local pathname normalized_pathname normalized_root
  pathname="${1:-}"
  normalized_pathname="$(normalize_path "$pathname")"
  normalized_root="$(normalize_path "${2:-}")"
  [[ -n "$normalized_pathname" && -n "$normalized_root" ]] || return 1
  [[ "$normalized_pathname" == "$normalized_root" || "$normalized_pathname" == "$normalized_root"/* ]]
}

resolve_issue_metadata() {
  if [[ -z "$ISSUE_ID" || -z "$COMPANY_ID" || -z "$API_KEY" ]]; then
    return 0
  fi

  local issue_url="${API_BASE%/}/api/issues/${ISSUE_ID}?companyId=${COMPANY_ID}"
  local issue_payload
  if ! issue_payload="$(curl -fsS -H "Authorization: Bearer ${API_KEY}" "$issue_url")"; then
    return 0
  fi

  local resolved
  if ! resolved="$(
    ISSUE_PAYLOAD="$issue_payload" python3 - <<'PY'
import json
import os

issue = json.loads(os.environ["ISSUE_PAYLOAD"])
description = str(issue.get("description") or "")
metadata = {}
for raw_line in description.splitlines():
    if ":" not in raw_line:
        continue
    key, value = raw_line.split(":", 1)
    key = key.strip()
    value = value.strip()
    if key in {"task_class", "execution_route"}:
        metadata[key] = value

print(issue.get("id") or "")
print(metadata.get("task_class", ""))
print(metadata.get("execution_route", ""))
print(description)
PY
  )"; then
    return 0
  fi

  local resolved_issue_id resolved_task_class resolved_execution_route resolved_description
  resolved_issue_id="$(printf '%s\n' "$resolved" | sed -n '1p')"
  resolved_task_class="$(printf '%s\n' "$resolved" | sed -n '2p')"
  resolved_execution_route="$(printf '%s\n' "$resolved" | sed -n '3p')"
  resolved_description="$(printf '%s\n' "$resolved" | tail -n +4)"

  if [[ -n "$resolved_issue_id" ]]; then
    ISSUE_ID="$resolved_issue_id"
  fi
  if [[ -z "$TASK_CLASS" && -n "$resolved_task_class" ]]; then
    TASK_CLASS="$resolved_task_class"
  fi
  if [[ -z "$EXECUTION_ROUTE" && -n "$resolved_execution_route" ]]; then
    EXECUTION_ROUTE="$resolved_execution_route"
  fi
  if [[ -z "$DESCRIPTION_OVERRIDE" && -n "$resolved_description" ]]; then
    DESCRIPTION_OVERRIDE="$resolved_description"
  fi
}

pick_execution_cwd() {
  local candidate
  if [[ "$EXECUTION_ROUTE" != "server_automation" && "$TASK_CLASS" != "automation-execution" ]]; then
    execution_cwd="$cwd"
    return 0
  fi

  for candidate in "$WORKSPACE_WORKTREE_PATH" "$WORKSPACE_CWD" "$cwd"; do
    [[ -n "$candidate" ]] || continue
    if path_equals_or_within "$candidate" "$EXPECTED_ROOT"; then
      execution_cwd="$candidate"
      return 0
    fi
  done

  execution_cwd="$cwd"
}

run_guard() {
  node "$GUARD_SCRIPT" \
    --cwd "$1" \
    --expected-root "$EXPECTED_ROOT" \
    --task-class "$TASK_CLASS" \
    --execution-route "$EXECUTION_ROUTE" \
    --description "$DESCRIPTION_OVERRIDE"
}

if [[ "$PROXY_MODE" == "passive" ]]; then
  resolve_issue_metadata
fi

if [[ "$FREEZE_SERVER_AUTOMATION" == "1" || "$FREEZE_SERVER_AUTOMATION" == "true" ]]; then
  if [[ "$EXECUTION_ROUTE" == "server_automation" || "$TASK_CLASS" == "automation-execution" ]]; then
    echo "Server automation writable execution is frozen by PAPERCLIP_SERVER_AUTOMATION_FREEZE=${FREEZE_SERVER_AUTOMATION}" >&2
    exit 78
  fi
fi

pick_execution_cwd

if [[ "$EXECUTION_ROUTE" == "server_automation" || "$TASK_CLASS" == "automation-execution" ]]; then
  run_guard "$execution_cwd"
else
  run_guard "$cwd"
fi

tmp_stdin="$(mktemp)"
trap 'rm -f "$tmp_stdin"' EXIT
cat >"$tmp_stdin"

set +e
(
  cd "$execution_cwd"
  "$REAL_COMMAND" "$@" <"$tmp_stdin"
)
command_exit=$?
set -e

if [[ "$command_exit" -ne 0 ]]; then
  exit "$command_exit"
fi

if [[ "$AUTO_FINALIZE" != "1" ]]; then
  exit 0
fi

if [[ "$TASK_CLASS" != "automation-execution" || "$EXECUTION_ROUTE" != "server_automation" ]]; then
  exit 0
fi

if [[ -z "$ISSUE_ID" || -z "$COMPANY_ID" || -z "$API_KEY" ]]; then
  echo "Auto finalize requires PAPERCLIP_ISSUE_ID, PAPERCLIP_COMPANY_ID, and PAPERCLIP_API_KEY" >&2
  exit 1
fi

finalize_message="${COMMIT_MESSAGE:-chore(automation): finalize ${ISSUE_ID}}"

node "$FINALIZER_SCRIPT" \
  --issue-id "$ISSUE_ID" \
  --cwd "$execution_cwd" \
  --company-id "$COMPANY_ID" \
  --api-base "$API_BASE" \
  --api-key "$API_KEY" \
  --commit-message "$finalize_message" \
  --git-user-name "$GIT_USER_NAME" \
  --git-user-email "$GIT_USER_EMAIL"
