#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "${SCRIPT_DIR}/relayhub-entry-sync-lib.sh"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
AUTH_JSON="${HOME}/.paperclip/auth.json"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-entry-paperclip-hermes-local-server}"
RELAYHUB_INTERNAL_TOKEN="${RELAYHUB_INTERNAL_TOKEN:-}"
PAPERCLIP_SYNC_SKIP_AGENT_PATCH="${PAPERCLIP_SYNC_SKIP_AGENT_PATCH:-0}"

HERMES_HOME="${HERMES_HOME:-/paperclip}"
HERMES_CONFIG_PATH="${HERMES_CONFIG_PATH:-${HERMES_HOME}/.hermes/config.yaml}"
OPENAI_ENV_FILE="${OPENAI_ENV_FILE:-}"
HERMES_COMPRESSION_PROVIDER="${HERMES_COMPRESSION_PROVIDER:-custom}"

PRIMARY_BASE_URL="${PRIMARY_BASE_URL:-}"
PRIMARY_MODEL="${PRIMARY_MODEL:-}"
PRIMARY_REASONING_EFFORT="${PRIMARY_REASONING_EFFORT:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-hermes-model.sh status
  shared/tools/sync-paperclip-hermes-model.sh sync

Commands:
  status  Show RelayHub binding, current Hermes config, and current Paperclip hermes_local agent config
  sync    Write RelayHub binding into Hermes config.yaml and optional OPENAI env file, then align hermes_local agent config

Env overrides:
  PAPERCLIP_API_URL
  PAPERCLIP_API_TOKEN / PAPERCLIP_API_KEY
  CONTROL_PLANE_BASE_URL
  RELAYHUB_INTERNAL_TOKEN
  ENTRY_ID
  PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1
  HERMES_HOME
  HERMES_CONFIG_PATH
  OPENAI_ENV_FILE
  HERMES_COMPRESSION_PROVIDER
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
  local resolved_json
  resolved_json="$(relayhub_fetch_entry_binding_json "${CONTROL_PLANE_BASE_URL}" "${ENTRY_ID}" "${RELAYHUB_INTERNAL_TOKEN}")"
  relayhub_export_entry_binding_env "${resolved_json}"
  relayhub_assert_api_key_present "${ENTRY_ID}" "${RESOLVED_MODEL_ID}" "${RESOLVED_API_KEY}"
  PRIMARY_BASE_URL="${RESOLVED_BASE_URL}"
  PRIMARY_MODEL="${RESOLVED_MODEL}"
  PRIMARY_REASONING_EFFORT="${RESOLVED_REASONING_EFFORT}"
}

sync_openai_env_file() {
  [[ -z "${OPENAI_ENV_FILE}" ]] && return

  mkdir -p "$(dirname "${OPENAI_ENV_FILE}")"

  PRIMARY_BASE_URL="${PRIMARY_BASE_URL}" \
  PRIMARY_MODEL="${PRIMARY_MODEL}" \
  OPENAI_ENV_FILE="${OPENAI_ENV_FILE}" \
  EFFECTIVE_API_KEY="${RESOLVED_API_KEY}" \
  python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["OPENAI_ENV_FILE"])
lines = []
existing = {}
if path.exists():
    lines = path.read_text(encoding="utf-8").splitlines()

for raw in lines:
    if "=" in raw and not raw.lstrip().startswith("#"):
        key, value = raw.split("=", 1)
        existing[key.strip()] = value

existing["OPENAI_BASE_URL"] = os.environ["PRIMARY_BASE_URL"]
existing["OPENAI_MODEL"] = os.environ["PRIMARY_MODEL"]
if os.environ["EFFECTIVE_API_KEY"].strip():
    existing["OPENAI_API_KEY"] = os.environ["EFFECTIVE_API_KEY"]

ordered_keys = []
for raw in lines:
    if "=" not in raw or raw.lstrip().startswith("#"):
        continue
    key = raw.split("=", 1)[0].strip()
    if key not in ordered_keys:
        ordered_keys.append(key)

for key in ("OPENAI_BASE_URL", "OPENAI_MODEL", "OPENAI_API_KEY"):
    if key in existing and key not in ordered_keys:
        ordered_keys.append(key)

output = [f"{key}={existing[key]}" for key in ordered_keys if key in existing]
path.write_text("\n".join(output) + "\n", encoding="utf-8")
PY

  echo "Updated ${OPENAI_ENV_FILE}"
}

sync_hermes_config() {
  mkdir -p "$(dirname "${HERMES_CONFIG_PATH}")"

  PRIMARY_BASE_URL="${PRIMARY_BASE_URL}" \
  PRIMARY_MODEL="${PRIMARY_MODEL}" \
  HERMES_CONFIG_PATH="${HERMES_CONFIG_PATH}" \
  EFFECTIVE_API_KEY="${RESOLVED_API_KEY}" \
  HERMES_COMPRESSION_PROVIDER="${HERMES_COMPRESSION_PROVIDER}" \
  ruby -e '
    require "yaml"

    path = ARGV[0]
    config =
      if File.exist?(path)
        loaded = YAML.safe_load(File.read(path, encoding: "UTF-8")) || {}
        loaded.is_a?(Hash) ? loaded : {}
      else
        {}
      end

    config["default_provider"] = "main"
    config["providers"] ||= {}
    config["providers"]["main"] ||= {}
    config["providers"]["main"]["base_url"] = ENV.fetch("PRIMARY_BASE_URL")
    config["providers"]["main"]["model"] = ENV.fetch("PRIMARY_MODEL")
    api_key = ENV.fetch("EFFECTIVE_API_KEY", "").strip
    config["providers"]["main"]["api_key"] = api_key unless api_key.empty?

    config["auxiliary"] ||= {}
    config["auxiliary"]["compression"] ||= {}
    config["auxiliary"]["compression"]["provider"] = ENV.fetch("HERMES_COMPRESSION_PROVIDER")
    config["auxiliary"]["compression"]["base_url"] = ENV.fetch("PRIMARY_BASE_URL")
    config["auxiliary"]["compression"]["model"] = ENV.fetch("PRIMARY_MODEL")
    config["auxiliary"]["compression"]["api_key"] = api_key unless api_key.empty?

    File.write(path, YAML.dump(config))
  ' "${HERMES_CONFIG_PATH}"

  echo "Updated ${HERMES_CONFIG_PATH}"
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

list_hermes_agents() {
  jq -r '.[] | select(.adapterType=="hermes_local") | [.id, .name] | @tsv' <<<"${runtime_agents_json}"
}

show_hermes_config_status() {
  if [[ ! -f "${HERMES_CONFIG_PATH}" ]]; then
    echo "Hermes config missing: ${HERMES_CONFIG_PATH}"
    return
  fi

  ruby -e '
    require "yaml"
    data = YAML.safe_load(File.read(ARGV[0], encoding: "UTF-8")) || {}
    main = data.dig("providers", "main") || {}
    compression = data.dig("auxiliary", "compression") || {}
    puts "  baseUrl: #{main["base_url"] || "<unset>"}"
    puts "  model: #{main["model"] || "<unset>"}"
    puts "  compressionProvider: #{compression["provider"] || "<unset>"}"
    puts "  compressionModel: #{compression["model"] || "<unset>"}"
  ' "${HERMES_CONFIG_PATH}"
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

def env_value(name: str) -> str:
    item = env.get(name)
    if isinstance(item, dict):
        return item.get("value") or "<unset>"
    return "<unset>"

print(
    f"  {agent_name}: model={config.get('model', '<unset>')} "
    f"OPENAI_BASE_URL={env_value('OPENAI_BASE_URL')} "
    f"OPENAI_MODEL={env_value('OPENAI_MODEL')}"
)
PY
  done < <(list_hermes_agents)
}

sync_runtime_agents() {
  local updated agent_id agent_name current_payload patch_payload
  updated=0

  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Skipped Paperclip hermes_local agent patch."
    return
  fi

  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "${agent_id}" ]] && continue
    current_payload="$(api_curl "${api_url}/api/agents/${agent_id}")"
    patch_payload="$(
      PRIMARY_BASE_URL="${PRIMARY_BASE_URL}" PRIMARY_MODEL="${PRIMARY_MODEL}" EFFECTIVE_API_KEY="${RESOLVED_API_KEY}" python3 - <<'PY' <<<"${current_payload}"
import json
import os
import sys

agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})

def plain(value: str) -> dict:
    return {"type": "plain", "value": value}

env["OPENAI_BASE_URL"] = plain(os.environ["PRIMARY_BASE_URL"])
env["OPENAI_MODEL"] = plain(os.environ["PRIMARY_MODEL"])
api_key = os.environ.get("EFFECTIVE_API_KEY", "").strip()
if api_key:
    env["OPENAI_API_KEY"] = plain(api_key)

adapter_config["env"] = env
adapter_config["model"] = os.environ["PRIMARY_MODEL"]

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
    echo "Updated ${agent_name} -> ${PRIMARY_BASE_URL} / ${PRIMARY_MODEL}"
    updated=$((updated + 1))
  done < <(list_hermes_agents)

  echo "Done. Updated ${updated} hermes_local agent(s)."
}

show_status() {
  echo "RelayHub binding"
  echo "  entryId: ${ENTRY_ID}"
  echo "  baseUrl: ${PRIMARY_BASE_URL}"
  echo "  model: ${PRIMARY_MODEL}"
  echo "  reasoningEffort: ${PRIMARY_REASONING_EFFORT:-<unset>}"
  echo ""
  echo "Hermes config"
  show_hermes_config_status
  if [[ -n "${OPENAI_ENV_FILE}" ]]; then
    echo ""
    echo "OPENAI env file"
    if [[ -f "${OPENAI_ENV_FILE}" ]]; then
      sed 's/^/  /' "${OPENAI_ENV_FILE}"
    else
      echo "  missing: ${OPENAI_ENV_FILE}"
    fi
  fi
  echo ""
  echo "Paperclip hermes_local agents"
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
    sync_openai_env_file
    sync_hermes_config
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
