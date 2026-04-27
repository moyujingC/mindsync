#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
USE_CLEAN_SETTINGS="${RELAYHUB_CLAUDE_CLEAN_SETTINGS:-1}"
USE_BARE_MODE="${RELAYHUB_CLAUDE_BARE_MODE:-auto}"
RELAY_BASE_URL="${RELAYHUB_DEV_RELAY_BASE_URL:-http://127.0.0.1:4319}"
RELAY_AUTH_TOKEN="${RELAYHUB_DEV_RELAY_AUTH_TOKEN:-relayhub-local-dev-relay}"
RELAY_MODEL="${RELAYHUB_CLAUDE_MODEL:-relayhub-task-claude-code}"

if ! command -v claude >/dev/null 2>&1; then
  echo "claude command not found" >&2
  exit 1
fi

unset CLAUDE_CODE_OAUTH_TOKEN
unset CLAUDE_CODE_TOKEN
unset ANTHROPIC_API_KEY_HELPER

claude_supports_bare_mode() {
  claude --help 2>/dev/null | grep -q -- '--bare'
}

export ANTHROPIC_BASE_URL="$RELAY_BASE_URL"
export ANTHROPIC_API_KEY="$RELAY_AUTH_TOKEN"
export ANTHROPIC_AUTH_TOKEN="$RELAY_AUTH_TOKEN"
export ANTHROPIC_MODEL="$RELAY_MODEL"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$RELAY_MODEL"
export ANTHROPIC_DEFAULT_SONNET_MODEL="$RELAY_MODEL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$RELAY_MODEL"
export RELAYHUB_DEV_RELAY_DIR="$SCRIPT_DIR"

CLAUDE_ARGS=("$@")
if [[ "$USE_CLEAN_SETTINGS" == "1" ]]; then
  CLAUDE_ARGS=(--setting-sources local "${CLAUDE_ARGS[@]}")
fi

if [[ "$USE_BARE_MODE" == "1" || "$USE_BARE_MODE" == "auto" ]]; then
  if claude_supports_bare_mode; then
    CLAUDE_ARGS=(--bare "${CLAUDE_ARGS[@]}")
  elif [[ "$USE_BARE_MODE" == "1" ]]; then
    echo "claude does not support --bare in the current version" >&2
    exit 1
  fi
fi

exec claude "${CLAUDE_ARGS[@]}"
