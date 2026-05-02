#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

ARGS=("$@")
if [[ "${#ARGS[@]}" -eq 0 ]]; then
  ARGS=(--workspace-root "$WORKSPACE_ROOT")
fi

node "$SCRIPT_DIR/src/check-vscode-claude-code-env.mjs" "${ARGS[@]}"
