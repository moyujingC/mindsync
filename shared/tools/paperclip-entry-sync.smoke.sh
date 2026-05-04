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
        "id": "preset-deepseek-v4",
        "baseUrl": "https://api.deepseek.com/v1",
        "modelId": "deepseek-chat",
        "reasoningEffort": None,
    }
    ,
    {
        "id": "preset-ppchat-relay",
        "baseUrl": "https://code.ppchat.vip/v1",
        "modelId": "gpt-5",
        "reasoningEffort": "high",
    }
]

BINDINGS = [
    {
        "entryId": "entry-paperclip-pi-local-server",
        "defaultModelEntryId": "preset-deepseek-v4",
    },
    {
        "entryId": "entry-paperclip-hermes-local-server",
        "defaultModelEntryId": "preset-deepseek-v4",
    },
    {
        "entryId": "entry-paperclip-codex-local-server",
        "defaultModelEntryId": "preset-ppchat-relay",
    },
]

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/internal/resolve-entry-binding":
            if self.headers.get("x-relayhub-internal-token") != "relayhub-smoke-token":
                self.send_response(401)
                self.end_headers()
                return
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            entry_id = payload.get("entryId")
            if entry_id == "entry-paperclip-pi-local-server":
                response = {
                    "entryId": entry_id,
                    "defaultModelEntryId": "preset-deepseek-v4",
                    "fallbackModelEntryId": None,
                    "resolvedModel": {
                        "id": "preset-deepseek-v4",
                        "baseUrl": "https://api.deepseek.com/v1",
                        "modelId": "deepseek-chat",
                        "reasoningEffort": None,
                        "apiKey": "sk-pi-smoke",
                        "hasStoredApiKey": True,
                    },
                }
            elif entry_id == "entry-paperclip-hermes-local-server":
                response = {
                    "entryId": entry_id,
                    "defaultModelEntryId": "preset-deepseek-v4",
                    "fallbackModelEntryId": None,
                    "alias": "relayhub-entry-paperclip-hermes-local-server",
                    "relayToken": "relayhub-hermes-smoke-token",
                    "resolvedModel": {
                        "id": "preset-deepseek-v4",
                        "baseUrl": "https://api.deepseek.com/v1",
                        "modelId": "deepseek-chat",
                        "reasoningEffort": None,
                        "apiKey": "sk-hermes-smoke",
                        "hasStoredApiKey": True,
                    },
                }
            elif entry_id == "entry-paperclip-codex-local-server":
                response = {
                    "entryId": entry_id,
                    "defaultModelEntryId": "preset-ppchat-relay",
                    "fallbackModelEntryId": None,
                    "alias": "relayhub-entry-paperclip-codex-local-server",
                    "relayToken": "relayhub-codex-smoke-token",
                    "resolvedModel": {
                        "id": "preset-ppchat-relay",
                        "baseUrl": "https://code.ppchat.vip/v1",
                        "modelId": "gpt-5",
                        "reasoningEffort": "high",
                        "apiKey": "sk-codex-upstream-smoke",
                        "hasStoredApiKey": True,
                    },
                }
            else:
                self.send_response(404)
                self.end_headers()
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
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
RELAYHUB_INTERNAL_TOKEN="relayhub-smoke-token" \
ENTRY_ID="entry-paperclip-pi-local-server" \
PI_MODELS_PATH="${tmpdir}/pi-models.json" \
PI_PROVIDER_ID="relayhub-main" \
PI_PROVIDER_LABEL="RelayHub Managed" \
bash "${REPO_ROOT}/shared/tools/sync-paperclip-pi-model.sh" sync >/dev/null

PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1 \
CONTROL_PLANE_BASE_URL="${control_plane_url}" \
RELAYHUB_INTERNAL_TOKEN="relayhub-smoke-token" \
ENTRY_ID="entry-paperclip-hermes-local-server" \
HERMES_CONFIG_PATH="${tmpdir}/config.yaml" \
OPENAI_ENV_FILE="${tmpdir}/paperclip.env" \
bash "${REPO_ROOT}/shared/tools/sync-paperclip-hermes-model.sh" sync >/dev/null

cat >"${tmpdir}/agents.json" <<'JSON'
[
  {
    "id": "agent-engineer",
    "name": "Engineer",
    "adapterType": "codex_local",
    "adapterConfig": {
      "model": "old-model",
      "modelReasoningEffort": "medium",
      "apiKey": "old-key",
      "extraArgs": [
        "model_providers.codex.base_url=\"https://api.deepseek.com\""
      ]
    }
  }
]
JSON

cat >"${tmpdir}/paperclip_api.py" <<'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import sys

agents_path = Path(sys.argv[1])
patches_path = Path(sys.argv[2])

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/companies/test-company/agents":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(agents_path.read_bytes())
            return
        if self.path == "/api/agents/agent-engineer":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            payload = json.loads(agents_path.read_text(encoding="utf-8"))[0]
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

    def do_PATCH(self):
        if self.path == "/api/agents/agent-engineer":
            length = int(self.headers.get("Content-Length", "0"))
            payload = self.rfile.read(length).decode("utf-8")
            patches_path.write_text(payload, encoding="utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(payload.encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *_args):
        return

server = HTTPServer(("127.0.0.1", 0), Handler)
print(server.server_port, flush=True)
server.serve_forever()
PY

python3 "${tmpdir}/paperclip_api.py" "${tmpdir}/agents.json" "${tmpdir}/agent-patch.json" >"${tmpdir}/paperclip_port" &
paperclip_pid=$!

for _ in $(seq 1 50); do
  if [[ -s "${tmpdir}/paperclip_port" ]]; then
    break
  fi
  sleep 0.1
done

if [[ ! -s "${tmpdir}/paperclip_port" ]]; then
  echo "smoke failed: paperclip api stub did not start" >&2
  exit 1
fi

paperclip_port="$(cat "${tmpdir}/paperclip_port")"

cat >"${tmpdir}/paperclip.yaml" <<'YAML'
company:
  id: "test-company"
  host: "127.0.0.1"
  port: 1
agents:
  - name: "Engineer"
    adapter: "codex_local"
    directory: "agents/engineer"
YAML

HOME="${tmpdir}" \
PAPERCLIP_YAML_OVERRIDE="${tmpdir}/paperclip.yaml" \
CONTROL_PLANE_BASE_URL="${control_plane_url}" \
RELAYHUB_INTERNAL_TOKEN="relayhub-smoke-token" \
PAPERCLIP_API_URL="http://127.0.0.1:${paperclip_port}" \
ENTRY_ID="entry-paperclip-codex-local-server" \
bash "${REPO_ROOT}/shared/tools/sync-codex-model.sh" sync >/dev/null

kill "${paperclip_pid}" >/dev/null 2>&1 || true
wait "${paperclip_pid}" 2>/dev/null || true
unset paperclip_pid

python3 - <<'PY' "${tmpdir}/pi-models.json" "${tmpdir}/config.yaml" "${tmpdir}/paperclip.env" "${tmpdir}/.codex/config.toml" "${tmpdir}/.codex/auth.json" "${tmpdir}/agent-patch.json"
import json
import sys
from pathlib import Path

import yaml

pi_path = Path(sys.argv[1])
hermes_path = Path(sys.argv[2])
env_path = Path(sys.argv[3])
codex_config_path = Path(sys.argv[4])
codex_auth_path = Path(sys.argv[5])
agent_patch_path = Path(sys.argv[6])

pi_payload = json.loads(pi_path.read_text(encoding="utf-8"))
provider = pi_payload["providers"]["relayhub-main"]
assert provider["baseUrl"] == "https://api.deepseek.com/v1"
assert provider["api"] == "openai-completions"
assert provider["apiKey"] == "sk-pi-smoke"
assert provider["models"][0]["id"] == "deepseek-chat"

hermes_payload = yaml.safe_load(hermes_path.read_text(encoding="utf-8"))
assert hermes_payload["providers"]["main"]["base_url"] == "https://api.deepseek.com/v1"
assert hermes_payload["providers"]["main"]["model"] == "deepseek-chat"
assert hermes_payload["providers"]["main"]["api_key"] == "sk-hermes-smoke"
assert hermes_payload["auxiliary"]["compression"]["model"] == "deepseek-chat"

env_lines = env_path.read_text(encoding="utf-8")
assert "OPENAI_BASE_URL=https://api.deepseek.com/v1" in env_lines
assert "OPENAI_MODEL=deepseek-chat" in env_lines
assert "OPENAI_API_KEY=sk-hermes-smoke" in env_lines

codex_config = codex_config_path.read_text(encoding="utf-8")
assert 'model = "relayhub-entry-paperclip-codex-local-server"' in codex_config
assert 'base_url = "https://relayhub.jingshu.cc/claude/v1"' in codex_config
assert 'wire_api = "responses"' in codex_config
assert 'model_reasoning_effort = "high"' in codex_config

codex_auth = json.loads(codex_auth_path.read_text(encoding="utf-8"))
assert codex_auth["OPENAI_API_KEY"] == "relayhub-codex-smoke-token"

agent_patch = json.loads(agent_patch_path.read_text(encoding="utf-8"))
adapter_config = agent_patch["adapterConfig"]
assert adapter_config["model"] == "relayhub-entry-paperclip-codex-local-server"
assert adapter_config["apiKey"] == "relayhub-codex-smoke-token"
assert adapter_config["modelReasoningEffort"] == "high"
assert adapter_config["extraArgs"] == ['model_providers.codex.base_url="https://api.deepseek.com"']
PY

echo "paperclip-entry-sync smoke passed"
