#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
AUTH_JSON="${HOME}/.paperclip/auth.json"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-entry-paperclip-pi-local-server}"
PAPERCLIP_SYNC_SKIP_AGENT_PATCH="${PAPERCLIP_SYNC_SKIP_AGENT_PATCH:-0}"

PI_HOME="${PI_HOME:-/paperclip}"
PI_MODELS_PATH="${PI_MODELS_PATH:-${PI_HOME}/.pi/agent/models.json}"
PI_PROVIDER_ID="${PI_PROVIDER_ID:-relayhub-main}"
PI_PROVIDER_LABEL="${PI_PROVIDER_LABEL:-RelayHub Managed}"
PI_API_TYPE="${PI_API_TYPE:-openai-completions}"
PI_API_KEY_ENV_VAR="${PI_API_KEY_ENV_VAR:-OPENAI_API_KEY}"
PI_API_KEY_VALUE="${PI_API_KEY_VALUE:-}"
PI_MODEL_NAME="${PI_MODEL_NAME:-}"
PI_COMPAT_SUPPORTS_DEVELOPER_ROLE="${PI_COMPAT_SUPPORTS_DEVELOPER_ROLE:-false}"
PI_COMPAT_SUPPORTS_REASONING_EFFORT="${PI_COMPAT_SUPPORTS_REASONING_EFFORT:-false}"

PRIMARY_BASE_URL="${PRIMARY_BASE_URL:-}"
PRIMARY_MODEL="${PRIMARY_MODEL:-}"
PRIMARY_REASONING_EFFORT="${PRIMARY_REASONING_EFFORT:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-pi-model.sh status
  shared/tools/sync-paperclip-pi-model.sh sync

Commands:
  status  Show RelayHub binding, current pi models.json entry, and current Paperclip pi_local agent config
  sync    Write RelayHub binding into pi models.json and align Paperclip pi_local agent model

Env overrides:
  PAPERCLIP_API_URL
  PAPERCLIP_API_TOKEN / PAPERCLIP_API_KEY
  CONTROL_PLANE_BASE_URL
  ENTRY_ID
  PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1
  PI_HOME
  PI_MODELS_PATH
  PI_PROVIDER_ID
  PI_PROVIDER_LABEL
  PI_API_TYPE
  PI_API_KEY_ENV_VAR
  PI_API_KEY_VALUE
  PI_MODEL_NAME
  PI_COMPAT_SUPPORTS_DEVELOPER_ROLE
  PI_COMPAT_SUPPORTS_REASONING_EFFORT
EOF
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing required command: ${cmd}" >&2
    exit 1
  }
}

read_yaml_value() {
  local key_path="$1"
  ruby -e '
    require "yaml"
    content = File.read(ARGV[0], encoding: "UTF-8")
    data = YAML.safe_load(content)
    value = ARGV[1].split(".").reduce(data) { |acc, key| acc.is_a?(Hash) ? acc[key] : nil }
    puts value.to_s
  ' "$PAPERCLIP_YAML" "$key_path"
}

read_token_from_auth() {
  ruby -rjson -e '
    path = ARGV[0]
    api = ARGV[1]
    auth = JSON.parse(File.read(path))
    print auth.fetch("credentials").fetch(api).fetch("token")
  ' "$AUTH_JSON" "$1"
}

resolve_paperclip_api() {
  company_id="$(read_yaml_value "company.id")"
  host="$(read_yaml_value "company.host")"
  port="$(read_yaml_value "company.port")"

  if [[ -z "${company_id}" ]]; then
    echo "Failed to read company.id from ${PAPERCLIP_YAML}" >&2
    exit 1
  fi

  if [[ -z "${PAPERCLIP_API_URL}" ]]; then
    if [[ -z "${host}" || -z "${port}" ]]; then
      echo "Failed to read company.host / company.port from ${PAPERCLIP_YAML}" >&2
      exit 1
    fi
    api_url="http://${host}:${port}"
  else
    api_url="${PAPERCLIP_API_URL}"
  fi

  if [[ -z "${PAPERCLIP_API_TOKEN}" && -f "${AUTH_JSON}" ]]; then
    PAPERCLIP_API_TOKEN="$(read_token_from_auth "${api_url}" || true)"
  fi
}

api_curl() {
  if [[ -n "${PAPERCLIP_API_TOKEN}" ]]; then
    curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" "$@"
    return
  fi
  curl -fsS "$@"
}

read_binding_defaults() {
  local binding_json model_json model_id
  binding_json="$(curl -fsS "${CONTROL_PLANE_BASE_URL}/entry-bindings" | jq -c --arg entryId "${ENTRY_ID}" '.[] | select(.entryId == $entryId)')"
  if [[ -z "${binding_json}" || "${binding_json}" == "null" ]]; then
    echo "RelayHub entry binding not found for ${ENTRY_ID}" >&2
    exit 1
  fi

  model_id="$(printf '%s' "${binding_json}" | jq -r '.defaultModelEntryId // empty')"
  if [[ -z "${model_id}" ]]; then
    echo "RelayHub entry binding ${ENTRY_ID} has no defaultModelEntryId" >&2
    exit 1
  fi

  model_json="$(curl -fsS "${CONTROL_PLANE_BASE_URL}/models" | jq -c --arg modelId "${model_id}" '.[] | select(.id == $modelId)')"
  if [[ -z "${model_json}" || "${model_json}" == "null" ]]; then
    echo "RelayHub model ${model_id} not found" >&2
    exit 1
  fi

  PRIMARY_BASE_URL="$(printf '%s' "${model_json}" | jq -r '.baseUrl')"
  PRIMARY_MODEL="$(printf '%s' "${model_json}" | jq -r '.modelId')"
  PRIMARY_REASONING_EFFORT="$(printf '%s' "${model_json}" | jq -r '.reasoningEffort // empty')"
}

sync_models_file() {
  local provider_model
  provider_model="${PI_PROVIDER_ID}/${PRIMARY_MODEL}"

  mkdir -p "$(dirname "${PI_MODELS_PATH}")"

  PRIMARY_BASE_URL="${PRIMARY_BASE_URL}" \
  PRIMARY_MODEL="${PRIMARY_MODEL}" \
  PI_MODELS_PATH="${PI_MODELS_PATH}" \
  PI_PROVIDER_ID="${PI_PROVIDER_ID}" \
  PI_PROVIDER_LABEL="${PI_PROVIDER_LABEL}" \
  PI_API_TYPE="${PI_API_TYPE}" \
  PI_API_KEY_ENV_VAR="${PI_API_KEY_ENV_VAR}" \
  PI_API_KEY_VALUE="${PI_API_KEY_VALUE}" \
  PI_MODEL_NAME="${PI_MODEL_NAME}" \
  PI_COMPAT_SUPPORTS_DEVELOPER_ROLE="${PI_COMPAT_SUPPORTS_DEVELOPER_ROLE}" \
  PI_COMPAT_SUPPORTS_REASONING_EFFORT="${PI_COMPAT_SUPPORTS_REASONING_EFFORT}" \
  PRIMARY_REASONING_EFFORT="${PRIMARY_REASONING_EFFORT}" \
  python3 - <<'PY'
import json
import os
from pathlib import Path

path = Path(os.environ["PI_MODELS_PATH"])
if path.exists():
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        payload = {}
else:
    payload = {}

providers = payload.setdefault("providers", {})
if not isinstance(providers, dict):
    providers = {}
    payload["providers"] = providers

provider_id = os.environ["PI_PROVIDER_ID"]
model_id = os.environ["PRIMARY_MODEL"]
model_name = os.environ["PI_MODEL_NAME"].strip() or model_id
api_key_value = os.environ["PI_API_KEY_VALUE"].strip()

provider_payload = {
    "name": os.environ["PI_PROVIDER_LABEL"],
    "baseUrl": os.environ["PRIMARY_BASE_URL"],
    "api": os.environ["PI_API_TYPE"],
    "apiKey": api_key_value or os.environ["PI_API_KEY_ENV_VAR"],
    "authHeader": True,
    "compat": {
        "supportsDeveloperRole": os.environ["PI_COMPAT_SUPPORTS_DEVELOPER_ROLE"].lower() == "true",
        "supportsReasoningEffort": os.environ["PI_COMPAT_SUPPORTS_REASONING_EFFORT"].lower() == "true",
    },
    "models": [
        {
            "id": model_id,
            "name": model_name,
            "reasoning": bool(os.environ["PRIMARY_REASONING_EFFORT"].strip()),
            "input": ["text"],
        }
    ],
}

providers[provider_id] = provider_payload
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

  echo "Updated ${PI_MODELS_PATH} -> ${provider_model}"
}

load_runtime_agents() {
  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    runtime_agents_json="[]"
    return
  fi

  runtime_agents_json="$(
    api_curl "${api_url}/api/companies/${company_id}/agents" || {
      echo "Paperclip API unavailable at ${api_url}" >&2
      exit 1
    }
  )"
}

list_pi_agents() {
  jq -r '.[] | select(.adapterType=="pi_local") | [.id, .name] | @tsv' <<<"${runtime_agents_json}"
}

show_pi_models_status() {
  if [[ ! -f "${PI_MODELS_PATH}" ]]; then
    echo "pi models file missing: ${PI_MODELS_PATH}"
    return
  fi

  python3 - <<'PY' "${PI_MODELS_PATH}" "${PI_PROVIDER_ID}"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
provider_id = sys.argv[2]
payload = json.loads(path.read_text(encoding="utf-8"))
provider = ((payload.get("providers") or {}).get(provider_id) or {})
models = provider.get("models") or []
model = models[0] if models else {}
print(f"  provider: {provider_id}")
print(f"  baseUrl: {provider.get('baseUrl', '<unset>')}")
print(f"  api: {provider.get('api', '<unset>')}")
print(f"  model: {model.get('id', '<unset>')}")
print(f"  modelName: {model.get('name', '<unset>')}")
PY
}

show_runtime_status() {
  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Paperclip agent patch skipped by PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1"
    return
  fi

  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "${agent_id}" ]] && continue
    payload="$(api_curl "${api_url}/api/agents/${agent_id}")"
    python3 - "$agent_name" <<'PY' <<<"${payload}"
import json
import sys

agent_name = sys.argv[1]
payload = json.loads(sys.stdin.read())
config = payload.get("adapterConfig") or {}
env = config.get("env") or {}
home = ((env.get("HOME") or {}).get("value")) if isinstance(env.get("HOME"), dict) else None
print(f"  {agent_name}: model={config.get('model', '<unset>')} HOME={home or '<unset>'}")
PY
  done < <(list_pi_agents)
}

sync_runtime_agents() {
  local runtime_model updated agent_id agent_name current_payload patch_payload
  runtime_model="${PI_PROVIDER_ID}/${PRIMARY_MODEL}"
  updated=0

  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Skipped Paperclip pi_local agent patch."
    return
  fi

  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "${agent_id}" ]] && continue
    current_payload="$(api_curl "${api_url}/api/agents/${agent_id}")"
    patch_payload="$(
      RUNTIME_MODEL="${runtime_model}" PI_HOME="${PI_HOME}" python3 - <<'PY' <<<"${current_payload}"
import json
import os
import sys

agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})
env["HOME"] = {"type": "plain", "value": os.environ["PI_HOME"]}
adapter_config["env"] = env
adapter_config["model"] = os.environ["RUNTIME_MODEL"]

print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config,
}, ensure_ascii=False, separators=(",", ":")))
PY
    )"

    curl_headers=(-H "Content-Type: application/json")
    if [[ -n "${PAPERCLIP_API_TOKEN}" ]]; then
      curl_headers+=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
    fi

    curl -fsS -X PATCH "${curl_headers[@]}" "${api_url}/api/agents/${agent_id}" -d "${patch_payload}" >/dev/null
    echo "Updated ${agent_name} -> ${runtime_model}"
    updated=$((updated + 1))
  done < <(list_pi_agents)

  echo "Done. Updated ${updated} pi_local agent(s)."
}

show_status() {
  echo "RelayHub binding"
  echo "  entryId: ${ENTRY_ID}"
  echo "  baseUrl: ${PRIMARY_BASE_URL}"
  echo "  model: ${PRIMARY_MODEL}"
  echo "  reasoningEffort: ${PRIMARY_REASONING_EFFORT:-<unset>}"
  echo ""
  echo "pi models.json"
  show_pi_models_status
  echo ""
  echo "Paperclip pi_local agents"
  show_runtime_status
}

require_cmd ruby
require_cmd python3
require_cmd curl
require_cmd jq

read_binding_defaults
resolve_paperclip_api
load_runtime_agents

case "${1:-status}" in
  status)
    show_status
    ;;
  sync)
    sync_models_file
    sync_runtime_agents
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
