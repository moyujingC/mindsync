#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTROL_PLANE_BASE_URL="${RELAYHUB_CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
DEV_RELAY_DIR="$ROOT_DIR/dev-relay"
PROMPT="${RELAYHUB_CLI_SMOKE_PROMPT:-Reply with exactly relayhub cli smoke ok}"

echo "[relayhub-cli] control-plane: $CONTROL_PLANE_BASE_URL"

echo "[relayhub-cli] ensure task-claude-code -> preset-aitechflux-relay"
curl -sS "$CONTROL_PLANE_BASE_URL/tasks" \
  | jq -c '.[] | select(.id == "task-claude-code") | .defaultModelEntryId = "preset-aitechflux-relay"' \
  | curl -sS -X PATCH -H 'content-type: application/json' --data @- "$CONTROL_PLANE_BASE_URL/tasks/task-claude-code" \
  | jq .

echo "[relayhub-cli] run claude via local relay"
env -i \
  PATH="$PATH" \
  HOME="$HOME" \
  TERM="${TERM:-xterm-256color}" \
  RELAYHUB_CLAUDE_CLEAN_SETTINGS=1 \
  "$DEV_RELAY_DIR/run-claude-code-with-relay.sh" \
  --bare \
  -p "$PROMPT"
