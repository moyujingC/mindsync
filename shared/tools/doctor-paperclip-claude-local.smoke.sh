#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

AUTH_JSON="${TMP_DIR}/auth.json"
PAPERCLIP_YAML="${TMP_DIR}/paperclip.yaml"
SERVER_SCRIPT="${TMP_DIR}/server.py"
PORT_FILE="${TMP_DIR}/port"

cat >"${AUTH_JSON}" <<'JSON'
{
  "credentials": {}
}
JSON

cat >"${PAPERCLIP_YAML}" <<'YAML'
company:
  id: company-demo
  host: 127.0.0.1
  port: 9999
YAML

cat >"${SERVER_SCRIPT}" <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

AGENTS = [
    {
        "id": "agent-1",
        "name": "Architect",
        "adapterType": "claude_local",
        "adapterConfig": {
            "env": {
                "ANTHROPIC_BASE_URL": {"type": "plain", "value": "https://relayhub.jingshu.cc/claude/v1"},
                "ANTHROPIC_MODEL": {"type": "plain", "value": "relayhub-entry-paperclip-claude-local-mac"},
                "ANTHROPIC_AUTH_TOKEN": {"type": "plain", "value": "relayhub-token"},
                "ANTHROPIC_API_KEY": {"type": "plain", "value": "relayhub-token"}
            }
        }
    }
]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/companies/company-demo/agents":
            body = json.dumps(AGENTS).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *_args):
        return

server = HTTPServer(("127.0.0.1", 0), Handler)
print(server.server_port, flush=True)
server.serve_forever()
PY

python3 "${SERVER_SCRIPT}" >"${PORT_FILE}" &
SERVER_PID=$!

for _ in $(seq 1 50); do
  if [[ -s "${PORT_FILE}" ]]; then
    break
  fi
  sleep 0.1
done

PORT="$(cat "${PORT_FILE}")"
API_URL="http://127.0.0.1:${PORT}"

OUTPUT="$(
  HOME="${TMP_DIR}" \
  PAPERCLIP_YAML="${PAPERCLIP_YAML}" \
  PAPERCLIP_API_URL="${API_URL}" \
  PAPERCLIP_API_TOKEN="paperclip-test-token" \
  TARGET_AGENT_NAME="Architect" \
  bash "${REPO_ROOT}/shared/tools/doctor-paperclip-claude-local.sh" status
)"

grep -q '"effective_base_url": "https://relayhub.jingshu.cc/claude/v1"' <<<"${OUTPUT}"
grep -q '"effective_model": "relayhub-entry-paperclip-claude-local-mac"' <<<"${OUTPUT}"
grep -q '"effective_auth_mode": "relayhub_auth_token"' <<<"${OUTPUT}"
grep -q '"source_of_model": "relayhub_entry_alias"' <<<"${OUTPUT}"

printf 'doctor-paperclip-claude-local smoke ok\n'
