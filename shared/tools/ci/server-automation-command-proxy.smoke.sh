#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

bash -n "$REPO_ROOT/shared/tools/ci/server-automation-command-proxy.sh"

cat >"$TMP_DIR/server.py" <<'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/issues/test-issue"):
            body = {
                "id": "test-issue",
                "description": "task_class: automation-execution\nexecution_route: server_automation\n",
            }
            encoded = json.dumps(body).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        return

HTTPServer(("127.0.0.1", 18080), Handler).serve_forever()
PY

python3 "$TMP_DIR/server.py" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true; rm -rf "$TMP_DIR"' EXIT
sleep 1

mkdir -p "$TMP_DIR/worktree"
OUTPUT="$(
  cd "$TMP_DIR/worktree"
  PAPERCLIP_REAL_COMMAND=/bin/sh \
  PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE=passive \
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=0 \
  PAPERCLIP_TASK_ID=test-issue \
  PAPERCLIP_COMPANY_ID=test-company \
  PAPERCLIP_API_KEY=test-token \
  PAPERCLIP_API_URL=http://127.0.0.1:18080 \
  PAPERCLIP_EXECUTION_WORKTREE_ROOT="$TMP_DIR" \
  PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT="$TMP_DIR" \
  bash "$REPO_ROOT/shared/tools/ci/server-automation-command-proxy.sh" -lc 'printf passive-ok' <<<"stdin-smoke"
)"

if [[ "$OUTPUT" != *"passive-ok"* ]]; then
  echo "passive metadata resolution smoke failed" >&2
  exit 1
fi

set +e
node "$REPO_ROOT/shared/tools/ci/server-automation-guard.mjs" \
  --cwd /opt/automation/app/mindsync \
  --expected-root "$TMP_DIR/worktree-root" \
  >/tmp/server-automation-guard-observe-only.out 2>/tmp/server-automation-guard-observe-only.err
observe_only_exit=$?
set -e

if [[ "$observe_only_exit" -eq 0 ]]; then
  echo "observe-only guard smoke failed: guard should reject shared checkout" >&2
  exit 1
fi

WORKTREE_ROOT="$TMP_DIR/worktree-root"
mkdir -p "$WORKTREE_ROOT/MIN-1"
OUTPUT="$(
  cd "$TMP_DIR"
  PAPERCLIP_REAL_COMMAND=/bin/sh \
  PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE=passive \
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=0 \
  PAPERCLIP_TASK_ID=test-issue \
  PAPERCLIP_COMPANY_ID=test-company \
  PAPERCLIP_API_KEY=test-token \
  PAPERCLIP_API_URL=http://127.0.0.1:18080 \
  PAPERCLIP_EXECUTION_WORKTREE_ROOT="$WORKTREE_ROOT" \
  PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT="$WORKTREE_ROOT" \
  PAPERCLIP_WORKSPACE_CWD="$WORKTREE_ROOT/MIN-1" \
  PAPERCLIP_WORKSPACE_WORKTREE_PATH="$WORKTREE_ROOT/MIN-1" \
  bash "$REPO_ROOT/shared/tools/ci/server-automation-command-proxy.sh" -lc 'pwd' <<<"stdin-smoke"
)"

if [[ "$OUTPUT" != *"$WORKTREE_ROOT/MIN-1"* ]]; then
  echo "server automation worktree re-exec smoke failed" >&2
  exit 1
fi

set +e
FREEZE_OUTPUT="$(
  cd "$TMP_DIR"
  PAPERCLIP_REAL_COMMAND=/bin/sh \
  PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE=passive \
  PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE=0 \
  PAPERCLIP_SERVER_AUTOMATION_FREEZE=1 \
  PAPERCLIP_TASK_ID=test-issue \
  PAPERCLIP_COMPANY_ID=test-company \
  PAPERCLIP_API_KEY=test-token \
  PAPERCLIP_API_URL=http://127.0.0.1:18080 \
  PAPERCLIP_EXECUTION_WORKTREE_ROOT="$WORKTREE_ROOT" \
  PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT="$WORKTREE_ROOT" \
  PAPERCLIP_WORKSPACE_CWD="$WORKTREE_ROOT/MIN-1" \
  PAPERCLIP_WORKSPACE_WORKTREE_PATH="$WORKTREE_ROOT/MIN-1" \
  bash "$REPO_ROOT/shared/tools/ci/server-automation-command-proxy.sh" -lc 'printf should-not-run' <<<"stdin-smoke" 2>&1
)"
freeze_exit=$?
set -e

if [[ "$freeze_exit" -ne 78 ]]; then
  echo "server automation freeze smoke failed: expected exit 78, got $freeze_exit" >&2
  echo "$FREEZE_OUTPUT" >&2
  exit 1
fi

if [[ "$FREEZE_OUTPUT" != *"Server automation writable execution is frozen"* ]]; then
  echo "server automation freeze smoke failed: missing freeze message" >&2
  echo "$FREEZE_OUTPUT" >&2
  exit 1
fi

printf 'server-automation-command-proxy smoke ok\n'
