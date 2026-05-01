#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/paperclip-entry-sync-smoke.XXXXXX")"
cleanup() {
  if [[ -n "${server_pid:-}" ]]; then
    kill "${server_pid}" >/dev/null 2>&1 || true
    wait "${server_pid}" 2>/dev/null || true
  fi
  rm -rf "${tmpdir}"
}
trap cleanup EXIT

cat >"${tmpdir}/server.py" <<'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

MODELS = [
    {
        "id": "preset-deepseek-v3",
        "baseUrl": "https://api.deepseek.com/v1",
        "modelId": "deepseek-chat",
        "reasoningEffort": None,
    }
]

BINDINGS = [
    {
        "entryId": "entry-paperclip-pi-local-server",
        "defaultModelEntryId": "preset-deepseek-v3",
    },
    {
        "entryId": "entry-paperclip-hermes-local-server",
        "defaultModelEntryId": "preset-deepseek-v3",
    },
]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(MODELS).encode("utf-8"))
            return
        if self.path == "/entry-bindings":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(BINDINGS).encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *_args):
        return

server = HTTPServer(("127.0.0.1", 0), Handler)
print(server.server_port, flush=True)
server.serve_forever()
PY

python3 "${tmpdir}/server.py" >"${tmpdir}/port" &
server_pid=$!

for _ in $(seq 1 50); do
  if [[ -s "${tmpdir}/port" ]]; then
    break
  fi
  sleep 0.1
done

if [[ ! -s "${tmpdir}/port" ]]; then
  echo "smoke failed: control plane stub did not start" >&2
  exit 1
fi

port="$(cat "${tmpdir}/port")"
control_plane_url="http://127.0.0.1:${port}"

PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1 \
CONTROL_PLANE_BASE_URL="${control_plane_url}" \
ENTRY_ID="entry-paperclip-pi-local-server" \
PI_MODELS_PATH="${tmpdir}/pi-models.json" \
PI_PROVIDER_ID="relayhub-main" \
PI_PROVIDER_LABEL="RelayHub Managed" \
bash "${REPO_ROOT}/shared/tools/sync-paperclip-pi-model.sh" sync >/dev/null

PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1 \
CONTROL_PLANE_BASE_URL="${control_plane_url}" \
ENTRY_ID="entry-paperclip-hermes-local-server" \
HERMES_CONFIG_PATH="${tmpdir}/config.yaml" \
OPENAI_ENV_FILE="${tmpdir}/paperclip.env" \
SYNC_OPENAI_API_KEY="sk-smoke-key" \
bash "${REPO_ROOT}/shared/tools/sync-paperclip-hermes-model.sh" sync >/dev/null

python3 - <<'PY' "${tmpdir}/pi-models.json" "${tmpdir}/config.yaml" "${tmpdir}/paperclip.env"
import json
import sys
from pathlib import Path

import yaml

pi_path = Path(sys.argv[1])
hermes_path = Path(sys.argv[2])
env_path = Path(sys.argv[3])

pi_payload = json.loads(pi_path.read_text(encoding="utf-8"))
provider = pi_payload["providers"]["relayhub-main"]
assert provider["baseUrl"] == "https://api.deepseek.com/v1"
assert provider["api"] == "openai-completions"
assert provider["models"][0]["id"] == "deepseek-chat"

hermes_payload = yaml.safe_load(hermes_path.read_text(encoding="utf-8"))
assert hermes_payload["providers"]["main"]["base_url"] == "https://api.deepseek.com/v1"
assert hermes_payload["providers"]["main"]["model"] == "deepseek-chat"
assert hermes_payload["providers"]["main"]["api_key"] == "sk-smoke-key"
assert hermes_payload["auxiliary"]["compression"]["model"] == "deepseek-chat"

env_lines = env_path.read_text(encoding="utf-8")
assert "OPENAI_BASE_URL=https://api.deepseek.com/v1" in env_lines
assert "OPENAI_MODEL=deepseek-chat" in env_lines
assert "OPENAI_API_KEY=sk-smoke-key" in env_lines
PY

echo "paperclip-entry-sync smoke passed"
