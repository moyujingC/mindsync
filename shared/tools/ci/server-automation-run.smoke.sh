#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

bash -n "$REPO_ROOT/shared/tools/ci/server-automation-run.sh"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

set +e
FREEZE_OUTPUT="$(
  cd "$REPO_ROOT"
  PAPERCLIP_COMPANY_ID=test-company \
  PAPERCLIP_SERVER_AUTOMATION_FREEZE=1 \
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=0 \
  bash "$REPO_ROOT/shared/tools/ci/server-automation-run.sh" \
    --issue-id test-issue \
    --cwd "$TMP_DIR" \
    --command 'printf should-not-run' \
    2>&1
)"
freeze_exit=$?
set -e

if [[ "$freeze_exit" -ne 78 ]]; then
  echo "server-automation-run freeze smoke failed: expected exit 78, got $freeze_exit" >&2
  echo "$FREEZE_OUTPUT" >&2
  exit 1
fi

if [[ "$FREEZE_OUTPUT" != *"Server automation writable execution is frozen"* ]]; then
  echo "server-automation-run freeze smoke failed: missing freeze message" >&2
  echo "$FREEZE_OUTPUT" >&2
  exit 1
fi

printf 'server-automation-run smoke ok\n'
