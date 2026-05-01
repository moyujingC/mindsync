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

printf 'server-automation-command-proxy smoke ok\n'
