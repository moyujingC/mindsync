#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USE_CLEAN_SETTINGS="${RELAYHUB_CLAUDE_CLEAN_SETTINGS:-1}"

if ! command -v claude >/dev/null 2>&1; then
  echo "claude command not found" >&2
  exit 1
fi

export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-http://127.0.0.1:4319}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-${ANTHROPIC_AUTH_TOKEN:-relayhub-local-dev-relay}}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-$ANTHROPIC_API_KEY}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-relayhub-task-claude-code}"
export ANTHROPIC_DEFAULT_OPUS_MODEL="${ANTHROPIC_DEFAULT_OPUS_MODEL:-$ANTHROPIC_MODEL}"
export ANTHROPIC_DEFAULT_SONNET_MODEL="${ANTHROPIC_DEFAULT_SONNET_MODEL:-$ANTHROPIC_MODEL}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="${ANTHROPIC_DEFAULT_HAIKU_MODEL:-$ANTHROPIC_MODEL}"
export RELAYHUB_DEV_RELAY_DIR="$SCRIPT_DIR"

CLAUDE_ARGS=("$@")
if [[ "$USE_CLEAN_SETTINGS" == "1" ]]; then
  CLAUDE_ARGS=(--setting-sources local "${CLAUDE_ARGS[@]}")
fi

exec claude "${CLAUDE_ARGS[@]}"
