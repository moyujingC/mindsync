#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTROL_PLANE_BASE_URL="${RELAYHUB_CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
DEV_RELAY_DIR="$ROOT_DIR/dev-relay"
TASK_ID="${RELAYHUB_CLI_SMOKE_TASK_ID:-task-claude-code}"
FORCED_BIND_ENTRY_ID="${RELAYHUB_CLI_SMOKE_BIND_ENTRY_ID:-}"
PROMPT="${RELAYHUB_CLI_SMOKE_PROMPT:-Reply with exactly relayhub cli smoke ok}"

echo "[relayhub-cli] control-plane: $CONTROL_PLANE_BASE_URL"

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" \
      -H 'content-type: application/json' \
      --data "$body" \
      "$url"
  else
    curl -fsS -X "$method" "$url"
  fi
}

TASK_JSON="$(curl -fsS "$CONTROL_PLANE_BASE_URL/tasks" | jq -ec --arg taskId "$TASK_ID" '.[] | select(.id == $taskId)')"

if [[ -n "$FORCED_BIND_ENTRY_ID" ]]; then
  echo "[relayhub-cli] bind $TASK_ID -> $FORCED_BIND_ENTRY_ID"
  TASK_JSON="$(printf '%s\n' "$TASK_JSON" | jq -c --arg entryId "$FORCED_BIND_ENTRY_ID" '.defaultModelEntryId = $entryId')"
  TASK_JSON="$(curl_json PATCH "$CONTROL_PLANE_BASE_URL/tasks/$TASK_ID" "$TASK_JSON")"
fi

BOUND_ENTRY_ID="$(printf '%s\n' "$TASK_JSON" | jq -r '.defaultModelEntryId // empty')"
if [[ -z "$BOUND_ENTRY_ID" ]]; then
  echo "[relayhub-cli] fix next: $TASK_ID has no default model binding" >&2
  exit 1
fi

ENTRY_JSON="$(curl -fsS "$CONTROL_PLANE_BASE_URL/models" | jq -ec --arg entryId "$BOUND_ENTRY_ID" '.[] | select(.id == $entryId)')"
ENTRY_STATUS="$(printf '%s\n' "$ENTRY_JSON" | jq -r '.status')"
ENTRY_NAME="$(printf '%s\n' "$ENTRY_JSON" | jq -r '.name')"
ENTRY_MESSAGE="$(printf '%s\n' "$ENTRY_JSON" | jq -r '.lastTestMessage // .statusNote // ""')"

echo "[relayhub-cli] current binding: $BOUND_ENTRY_ID ($ENTRY_NAME)"
if [[ "$ENTRY_STATUS" != "active" ]]; then
  echo "[relayhub-cli] fix next: bound entry is not active (status=$ENTRY_STATUS)" >&2
  if [[ -n "$ENTRY_MESSAGE" ]]; then
    echo "[relayhub-cli] last message: $ENTRY_MESSAGE" >&2
  fi
  echo "[relayhub-cli] hint: test the entry in model library or set RELAYHUB_CLI_SMOKE_BIND_ENTRY_ID to an active entry" >&2
  exit 1
fi

echo "[relayhub-cli] run claude via local relay"
env -i \
  PATH="$PATH" \
  HOME="$HOME" \
  TERM="${TERM:-xterm-256color}" \
  RELAYHUB_CLAUDE_CLEAN_SETTINGS=1 \
  "$DEV_RELAY_DIR/run-claude-code-with-relay.sh" \
  -p "$PROMPT"
