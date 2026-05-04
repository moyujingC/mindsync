#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "${SCRIPT_DIR}/relayhub-entry-sync-lib.sh"
PAPERCLIP_YAML="${PAPERCLIP_YAML:-${REPO_ROOT}/.paperclip.yaml}"
AUTH_JSON="${HOME}/.paperclip/auth.json"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-}"
RELAYHUB_INTERNAL_TOKEN="${RELAYHUB_INTERNAL_TOKEN:-}"
PAPERCLIP_SYNC_SKIP_AGENT_PATCH="${PAPERCLIP_SYNC_SKIP_AGENT_PATCH:-0}"
RELAYHUB_PUBLIC_BASE_URL="${RELAYHUB_PUBLIC_BASE_URL:-https://relayhub.jingshu.cc/claude/v1}"
RELAYHUB_ACCESS_TOKEN="${RELAYHUB_ACCESS_TOKEN:-}"

PRIMARY_BASE_URL="${PRIMARY_BASE_URL:-${RELAYHUB_PUBLIC_BASE_URL}}"
PRIMARY_MODEL="${PRIMARY_MODEL:-}"
PRIMARY_REASONING_EFFORT="${PRIMARY_REASONING_EFFORT:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-claude-local-model.sh status
  shared/tools/sync-paperclip-claude-local-model.sh sync

Commands:
  status  Show RelayHub binding and current Paperclip claude_local runtime model config
  sync    Align Paperclip claude_local runtime agents to RelayHub entry aliases

Env overrides:
  PAPERCLIP_API_URL
  PAPERCLIP_API_TOKEN / PAPERCLIP_API_KEY
  CONTROL_PLANE_BASE_URL
  RELAYHUB_INTERNAL_TOKEN
  RELAYHUB_PUBLIC_BASE_URL
  RELAYHUB_ACCESS_TOKEN
  ENTRY_ID
  PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1

Notes:
  - This script is now an initialization / repair tool.
  - Steady-state claude_local should point to RelayHub entry aliases, not direct upstream model names.
  - Real upstream provider / model / api key should be changed in RelayHub, not in Paperclip runtime agent config.
EOF
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing required command: ${cmd}" >&2
    exit 1
  }
}

default_entry_id_for_host() {
  printf '%s\n' "entry-paperclip-claude-local-server"
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

resolve_entry_id() {
  if [[ -n "${ENTRY_ID}" ]]; then
    return
  fi
  ENTRY_ID="$(default_entry_id_for_host)"
}

api_curl() {
  if [[ -n "${PAPERCLIP_API_TOKEN}" ]]; then
    curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" "$@"
    return
  fi
  curl -fsS "$@"
}

resolve_relay_access_token() {
  if [[ -n "${RELAYHUB_ACCESS_TOKEN}" ]]; then
    return
  fi

  if [[ -f "${AUTH_JSON}" ]]; then
    RELAYHUB_ACCESS_TOKEN="$(read_token_from_auth "${api_url}" || true)"
  fi
}

read_binding_defaults() {
  local resolved_json
  resolved_json="$(relayhub_fetch_entry_binding_json "${CONTROL_PLANE_BASE_URL}" "${ENTRY_ID}" "${RELAYHUB_INTERNAL_TOKEN}")"
  relayhub_export_entry_binding_env "${resolved_json}"
  PRIMARY_MODEL="$(printf '%s' "${resolved_json}" | jq -r '.alias')"
  PRIMARY_REASONING_EFFORT="${RESOLVED_REASONING_EFFORT}"
  if [[ -z "${PRIMARY_MODEL}" || "${PRIMARY_MODEL}" == "null" ]]; then
    echo "RelayHub entry ${ENTRY_ID} is missing alias. Sync aborted." >&2
    exit 1
  fi
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

list_claude_agents() {
  jq -r '.[] | select(.adapterType=="claude_local") | [.id, .name] | @tsv' <<<"${runtime_agents_json}"
}

show_status() {
  echo "RelayHub binding"
  echo "  entry_id: ${ENTRY_ID}"
  echo "  relay_base_url: ${PRIMARY_BASE_URL}"
  echo "  relay_model: ${PRIMARY_MODEL}"
  echo "  resolved_model_id: ${RESOLVED_MODEL}"
  echo "  resolved_model_entry: ${RESOLVED_MODEL_ID}"
  echo "  reasoning_effort: ${PRIMARY_REASONING_EFFORT:-<unset>}"
  echo ""

  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Paperclip agent patch skipped by PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1"
    return
  fi

  echo "Paperclip claude_local agents"
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

def env_value(key):
    value = env.get(key)
    if isinstance(value, dict):
        return value.get("value")
    return value

print(f"  {agent_name}:")
print(f"    baseUrl={env_value('ANTHROPIC_BASE_URL') or '<unset>'}")
print(f"    model={env_value('ANTHROPIC_MODEL') or '<unset>'}")
print(f"    authToken={env_value('ANTHROPIC_AUTH_TOKEN') or '<unset>'}")
print(f"    apiKey={env_value('ANTHROPIC_API_KEY') or '<unset>'}")
print(f"    opus={env_value('ANTHROPIC_DEFAULT_OPUS_MODEL') or '<unset>'}")
print(f"    sonnet={env_value('ANTHROPIC_DEFAULT_SONNET_MODEL') or '<unset>'}")
print(f"    haiku={env_value('ANTHROPIC_DEFAULT_HAIKU_MODEL') or '<unset>'}")
PY
  done < <(list_claude_agents)
}

sync_agents() {
  local updated=0

  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Skipped Paperclip claude_local agent patch."
    return
  fi

  if [[ -z "${RELAYHUB_ACCESS_TOKEN}" ]]; then
    echo "RelayHub access token missing. Set RELAYHUB_ACCESS_TOKEN or ensure Paperclip auth token is reusable." >&2
    exit 1
  fi

  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "${agent_id}" ]] && continue
    current_payload="$(api_curl "${api_url}/api/agents/${agent_id}")"
    patch_payload="$(
      PRIMARY_BASE_URL="${PRIMARY_BASE_URL}" \
      PRIMARY_MODEL="${PRIMARY_MODEL}" \
      RELAYHUB_ACCESS_TOKEN="${RELAYHUB_ACCESS_TOKEN}" \
      PRIMARY_REASONING_EFFORT="${PRIMARY_REASONING_EFFORT}" \
      python3 - <<'PY' <<<"${current_payload}"
import json
import os
import sys

agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})

def plain(value: str) -> dict:
    return {"type": "plain", "value": value}

primary_base_url = os.environ["PRIMARY_BASE_URL"]
primary_model = os.environ["PRIMARY_MODEL"]
relayhub_access_token = os.environ["RELAYHUB_ACCESS_TOKEN"]

env["ANTHROPIC_BASE_URL"] = plain(primary_base_url)
env["ANTHROPIC_MODEL"] = plain(primary_model)
env["ANTHROPIC_API_KEY"] = plain(relayhub_access_token)
env["ANTHROPIC_AUTH_TOKEN"] = plain(relayhub_access_token)
env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = plain(primary_model)
env.setdefault("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", plain("1"))

adapter_config["env"] = env
adapter_config["paperclipModelRouting"] = {
    "primary": {
        "provider": "RelayHub",
        "baseUrl": primary_base_url,
        "model": primary_model,
        "source": "relayhub-entry-alias",
    }
}

print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config,
}, ensure_ascii=False, separators=(",", ":")))
PY
    )"

    patch_headers=(-H 'Content-Type: application/json')
    if [[ -n "${PAPERCLIP_API_TOKEN}" ]]; then
      patch_headers+=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
    fi

    curl -fsS -X PATCH "${patch_headers[@]}" "${api_url}/api/agents/${agent_id}" \
      -d "${patch_payload}" >/dev/null

    echo "Updated ${agent_name} -> ${PRIMARY_BASE_URL} / ${PRIMARY_MODEL}"
    updated=$((updated + 1))
  done < <(list_claude_agents)

  echo ""
  echo "Done. Updated ${updated} claude_local agent(s)."
}

resolve_paperclip_api
resolve_entry_id
resolve_relay_access_token

require_cmd ruby
require_cmd python3
require_cmd curl
require_cmd jq

read_binding_defaults
load_runtime_agents

case "${1:-status}" in
  status)
    show_status
    ;;
  sync)
    sync_agents
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
