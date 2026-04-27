#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# This example script is a local helper template.
# Source it in your own shell if you want your current session to match RelayHub's Claude Code relay defaults.
# It intentionally does not edit .vscode/settings.json for you.

export RELAYHUB_DEV_RELAY_BASE_URL="${RELAYHUB_DEV_RELAY_BASE_URL:-http://127.0.0.1:4319}"
export RELAYHUB_DEV_RELAY_AUTH_TOKEN="${RELAYHUB_DEV_RELAY_AUTH_TOKEN:-relayhub-local-dev-relay}"
export RELAYHUB_CLAUDE_MODEL="${RELAYHUB_CLAUDE_MODEL:-relayhub-task-claude-code}"

export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-$RELAYHUB_DEV_RELAY_BASE_URL}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-$RELAYHUB_DEV_RELAY_AUTH_TOKEN}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-$RELAYHUB_DEV_RELAY_AUTH_TOKEN}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-$RELAYHUB_CLAUDE_MODEL}"
export ANTHROPIC_DEFAULT_OPUS_MODEL="${ANTHROPIC_DEFAULT_OPUS_MODEL:-$RELAYHUB_CLAUDE_MODEL}"
export ANTHROPIC_DEFAULT_SONNET_MODEL="${ANTHROPIC_DEFAULT_SONNET_MODEL:-$RELAYHUB_CLAUDE_MODEL}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="${ANTHROPIC_DEFAULT_HAIKU_MODEL:-$RELAYHUB_CLAUDE_MODEL}"
export RELAYHUB_DEV_RELAY_DIR="${RELAYHUB_DEV_RELAY_DIR:-$SCRIPT_DIR}"

unset CLAUDE_CODE_OAUTH_TOKEN
unset CLAUDE_CODE_TOKEN
unset ANTHROPIC_API_KEY_HELPER

cat <<'EOF'
RelayHub Claude Code relay env is now set for the current shell.

Recommended next steps:
1. Run: bash projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh
2. Copy values from vscode-settings.template.json into your local .vscode/settings.json if VS Code still does not inherit them.
3. If background Claude Code still behaves differently, inspect ~/.claude/settings.json and stale ANTHROPIC_* values.
EOF
