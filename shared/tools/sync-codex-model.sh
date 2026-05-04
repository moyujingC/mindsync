#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "${SCRIPT_DIR}/relayhub-entry-sync-lib.sh"
PAPERCLIP_YAML="${PAPERCLIP_YAML_OVERRIDE:-${REPO_ROOT}/.paperclip.yaml}"
CODEX_CONFIG="${HOME}/.codex/config.toml"
CODEX_AUTH="${HOME}/.codex/auth.json"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-entry-paperclip-codex-local-server}"
RELAYHUB_INTERNAL_TOKEN="${RELAYHUB_INTERNAL_TOKEN:-}"
RELAYHUB_CODEX_BASE_URL="${RELAYHUB_CODEX_BASE_URL:-https://relayhub.jingshu.cc/claude/v1}"
RELAYHUB_CODEX_WIRE_API="${RELAYHUB_CODEX_WIRE_API:-responses}"
RELAYHUB_CODEX_PROVIDER_NAME="${RELAYHUB_CODEX_PROVIDER_NAME:-codex}"
RELAYHUB_CODEX_AUTH_KEY_NAME="${RELAYHUB_CODEX_AUTH_KEY_NAME:-OPENAI_API_KEY}"
PAPERCLIP_SYNC_SKIP_AGENT_PATCH="${PAPERCLIP_SYNC_SKIP_AGENT_PATCH:-0}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-codex-model.sh status
  shared/tools/sync-codex-model.sh sync

Commands:
  status  Show RelayHub binding, current local Codex client config, and current Paperclip codex_local agent config
  sync    Write RelayHub client config locally and align Paperclip codex_local agents to the RelayHub alias model

Notes:
  - Source of truth for model selection is RelayHub entry binding resolve
  - Source of truth for the relay token is RelayHub control-plane relay-config
  - The local Codex client should keep RelayHub URL + alias model + relay token only
  - Only runtime agents configured as codex_local in .paperclip.yaml are updated
  - Existing adapterConfig fields are preserved except model / modelReasoningEffort / apiKey
    and Codex CLI extraArgs needed for RelayHub API-key mode
  - This script is now an initialization / repair tool.
  - Steady-state Paperclip usage should point codex_local at RelayHub once,
    then switch model / api key / reasoning effort in RelayHub only.
  - Use PAPERCLIP_API_URL to point at a remote automation server
  - Use PAPERCLIP_API_TOKEN or PAPERCLIP_API_KEY when the remote instance requires auth
  - Set PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1 to update only the local Codex client files
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

read_codex_value() {
  local key="$1"
  ruby -e '
    path = ARGV[0]
    key = ARGV[1]
    unless File.exist?(path)
      exit 0
    end
    line = File.readlines(path, encoding: "UTF-8").find do |raw|
      stripped = raw.strip
      next false if stripped.empty? || stripped.start_with?("#", "[")
      stripped.start_with?("#{key} =")
    end
    if line
      value = line.split("=", 2)[1].to_s.split("#", 2)[0].strip
      value = value.gsub(/\A"|"\Z/, "")
      puts value
    end
  ' "$CODEX_CONFIG" "$key"
}

read_token_from_auth() {
  ruby -rjson -e '
    path = ARGV[0]
    key = ARGV[1]
    unless File.exist?(path)
      exit 0
    end
    payload = JSON.parse(File.read(path, encoding: "UTF-8"))
    value = payload[key]
    puts value.to_s if value.is_a?(String) && !value.empty?
  ' "$CODEX_AUTH" "$1"
}

iter_codex_agents() {
  ruby -e '
    require "yaml"
    content = File.read(ARGV[0], encoding: "UTF-8")
    data = YAML.safe_load(content)
    Array(data["agents"]).each do |agent|
      next unless agent["adapter"] == "codex_local"
      puts [agent["name"], agent["directory"]].join("\t")
    end
  ' "$PAPERCLIP_YAML"
}

company_id="$(read_yaml_value "company.id")"
host="$(read_yaml_value "company.host")"
port="$(read_yaml_value "company.port")"

if [[ -z "$company_id" ]]; then
  echo "Failed to read company.id from ${PAPERCLIP_YAML}" >&2
  exit 1
fi

if [[ -z "$PAPERCLIP_API_URL" ]]; then
  if [[ -z "$host" || -z "$port" ]]; then
    echo "Failed to read company.host / company.port from ${PAPERCLIP_YAML}" >&2
    exit 1
  fi
  api_url="http://${host}:${port}"
else
  api_url="$PAPERCLIP_API_URL"
fi

require_cmd ruby
require_cmd python3
require_cmd curl
require_cmd jq

current_model="$(read_codex_value "model")"
current_effort="$(read_codex_value "model_reasoning_effort")"
current_base_url="$(read_codex_value "base_url")"
current_wire_api="$(read_codex_value "wire_api")"
current_provider_name="$(read_codex_value "name")"
current_auth_key="$(read_token_from_auth "${RELAYHUB_CODEX_AUTH_KEY_NAME}")"

resolved_json="$(relayhub_fetch_entry_binding_json "${CONTROL_PLANE_BASE_URL}" "${ENTRY_ID}" "${RELAYHUB_INTERNAL_TOKEN}")"
relayhub_export_entry_binding_env "${resolved_json}"
relayhub_assert_api_key_present "${ENTRY_ID}" "${RESOLVED_MODEL_ID}" "${RESOLVED_API_KEY}"
resolved_alias="$(printf '%s' "${resolved_json}" | jq -r '.alias // empty')"
resolved_relay_token="$(printf '%s' "${resolved_json}" | jq -r '.relayToken // empty')"
target_model="${resolved_alias:-}"
target_effort="${RESOLVED_REASONING_EFFORT:-}"

if [[ -z "${target_model}" ]]; then
  echo "RelayHub entry ${ENTRY_ID} did not return an alias model." >&2
  exit 1
fi

if [[ -z "${resolved_relay_token}" ]]; then
  echo "RelayHub entry ${ENTRY_ID} did not return a relay token from relay-config.json." >&2
  exit 1
fi

load_runtime_agents() {
  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    runtime_agents_json="[]"
    return
  fi

  runtime_agents_json="$(
    if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
      curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" \
        "${api_url}/api/companies/${company_id}/agents" || {
        echo "Paperclip API unavailable at ${api_url}" >&2
        exit 1
      }
    else
      curl -fsS "${api_url}/api/companies/${company_id}/agents" || {
        echo "Paperclip API unavailable at ${api_url}" >&2
        exit 1
      }
    fi
  )"
}

api_curl() {
  if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
    curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" "$@"
    return
  fi
  curl -fsS "$@"
}

runtime_agent_id_by_name() {
  local agent_name="$1"
  ruby -rjson -e '
    agents = JSON.parse(STDIN.read)
    target = ARGV[0]
    match = agents.find { |agent| agent["name"] == target }
    puts(match ? match["id"] : "")
  ' "$agent_name" <<<"$runtime_agents_json"
}

write_local_codex_files() {
  mkdir -p "$(dirname "${CODEX_CONFIG}")"

  CODEX_CONFIG_PATH="${CODEX_CONFIG}" \
  TARGET_MODEL="${target_model}" \
  TARGET_EFFORT="${target_effort}" \
  TARGET_BASE_URL="${RELAYHUB_CODEX_BASE_URL}" \
  TARGET_WIRE_API="${RELAYHUB_CODEX_WIRE_API}" \
  TARGET_PROVIDER_NAME="${RELAYHUB_CODEX_PROVIDER_NAME}" \
  python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["CODEX_CONFIG_PATH"])
model = os.environ["TARGET_MODEL"]
effort = os.environ.get("TARGET_EFFORT", "").strip()
base_url = os.environ["TARGET_BASE_URL"]
wire_api = os.environ["TARGET_WIRE_API"]
provider_name = os.environ["TARGET_PROVIDER_NAME"]

if path.exists():
    lines = path.read_text(encoding="utf-8").splitlines()
else:
    lines = []

def update_root(lines, key, value, enabled=True):
    prefix = f"{key} ="
    found = False
    for idx, raw in enumerate(lines):
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("["):
            continue
        if stripped.startswith(prefix):
            found = True
            if enabled:
                lines[idx] = f'{key} = "{value}"'
            else:
                lines.pop(idx)
            break
    if enabled and not found:
        insert_at = 0
        while insert_at < len(lines) and lines[insert_at].strip().startswith("#"):
            insert_at += 1
        lines.insert(insert_at, f'{key} = "{value}"')

def ensure_section(lines, section_name):
    header = f"[model_providers.{section_name}]"
    for idx, raw in enumerate(lines):
        if raw.strip() == header:
            return idx
    if lines and lines[-1].strip():
        lines.append("")
    lines.append(header)
    return len(lines) - 1

def find_section_end(lines, start_idx):
    idx = start_idx + 1
    while idx < len(lines):
        stripped = lines[idx].strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            return idx
        idx += 1
    return len(lines)

def update_section_key(lines, section_name, key, value):
    start_idx = ensure_section(lines, section_name)
    end_idx = find_section_end(lines, start_idx)
    prefix = f"{key} ="
    for idx in range(start_idx + 1, end_idx):
        stripped = lines[idx].strip()
        if stripped.startswith(prefix):
            if isinstance(value, bool):
                lines[idx] = f"{key} = {'true' if value else 'false'}"
            else:
                lines[idx] = f'{key} = "{value}"' if isinstance(value, str) else f"{key} = {value}"
            return
    if isinstance(value, bool):
        lines.insert(end_idx, f"{key} = {'true' if value else 'false'}")
    else:
        lines.insert(end_idx, f'{key} = "{value}"' if isinstance(value, str) else f"{key} = {value}")

update_root(lines, "model_provider", provider_name)
update_root(lines, "model", model)
update_root(lines, "model_reasoning_effort", effort, enabled=bool(effort))
update_section_key(lines, provider_name, "name", provider_name)
update_section_key(lines, provider_name, "base_url", base_url)
update_section_key(lines, provider_name, "wire_api", wire_api)
update_section_key(lines, provider_name, "requires_openai_auth", True)

path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

  CODEX_AUTH_PATH="${CODEX_AUTH}" \
  AUTH_KEY_NAME="${RELAYHUB_CODEX_AUTH_KEY_NAME}" \
  RELAY_TOKEN="${resolved_relay_token}" \
  python3 - <<'PY'
import json
import os
from pathlib import Path

path = Path(os.environ["CODEX_AUTH_PATH"])
payload = {}
if path.exists():
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            payload = loaded
    except Exception:
        payload = {}

payload[os.environ["AUTH_KEY_NAME"]] = os.environ["RELAY_TOKEN"]
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

show_status() {
  echo "RelayHub entry binding"
  echo "  entry_id: ${ENTRY_ID}"
  echo "  alias: ${target_model}"
  echo "  relay_base_url: ${RELAYHUB_CODEX_BASE_URL}"
  echo "  wire_api: ${RELAYHUB_CODEX_WIRE_API}"
  echo "  default_model_entry_id: ${RESOLVED_MODEL_ID}"
  echo "  upstream_base_url: ${RESOLVED_BASE_URL}"
  echo "  upstream_model: ${RESOLVED_MODEL}"
  echo "  reasoning_effort: ${target_effort:-<unset>}"
  echo "  relay_token_present: yes"
  echo ""
  echo "Local Codex client files"
  echo "  config_path: ${CODEX_CONFIG}"
  echo "  auth_path: ${CODEX_AUTH}"
  echo "  current_model: ${current_model:-<unset>}"
  echo "  current_model_reasoning_effort: ${current_effort:-<unset>}"
  echo "  current_base_url: ${current_base_url:-<unset>}"
  echo "  current_wire_api: ${current_wire_api:-<unset>}"
  echo "  current_provider_name: ${current_provider_name:-<unset>}"
  if [[ -n "${current_auth_key}" ]]; then
    echo "  current_auth_key_present: yes"
  else
    echo "  current_auth_key_present: no"
  fi
  echo ""
  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo "Paperclip codex_local agents"
    echo "  skipped by PAPERCLIP_SYNC_SKIP_AGENT_PATCH=1"
    return
  fi
  echo "Paperclip codex_local agents"

  while IFS=$'\t' read -r agent_name _repo_dir; do
    [[ -z "$agent_name" ]] && continue
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "  ${agent_name}: runtime agent missing"
      continue
    fi

    payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    python3 - "$agent_name" <<'PY' <<<"$payload"
import json
import sys

agent_name = sys.argv[1]
payload = json.loads(sys.stdin.read())
adapter = payload.get("adapterType") or "<unknown>"
config = payload.get("adapterConfig") or {}
model = config.get("model", "<unset>")
effort = config.get("modelReasoningEffort", "<unset>")
print(f"  {agent_name}: adapter={adapter} model={model} modelReasoningEffort={effort}")
PY
  done < <(iter_codex_agents)
}

sync_models() {
  write_local_codex_files

  echo "Updated ${CODEX_CONFIG} -> model=${target_model}, base_url=${RELAYHUB_CODEX_BASE_URL}, wire_api=${RELAYHUB_CODEX_WIRE_API}"
  echo "Updated ${CODEX_AUTH} -> ${RELAYHUB_CODEX_AUTH_KEY_NAME}=<relay-token>"

  if [[ "${PAPERCLIP_SYNC_SKIP_AGENT_PATCH}" == "1" ]]; then
    echo ""
    echo "Skipped Paperclip runtime agent patch."
    return
  fi

  local updated=0

  while IFS=$'\t' read -r agent_name _repo_dir; do
    [[ -z "$agent_name" ]] && continue
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "Skipping ${agent_name}: runtime agent missing"
      continue
    fi

    current_payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    patch_payload="$(
      CURRENT_PAYLOAD="${current_payload}" TARGET_MODEL="${target_model}" TARGET_EFFORT="${target_effort:-}" RELAY_TOKEN="${resolved_relay_token}" TARGET_BASE_URL="${RELAYHUB_CODEX_BASE_URL}" TARGET_WIRE_API="${RELAYHUB_CODEX_WIRE_API}" python3 - <<'PY'
import json
import os

agent = json.loads(os.environ["CURRENT_PAYLOAD"])
adapter_config = dict(agent.get("adapterConfig") or {})
adapter_config["model"] = os.environ["TARGET_MODEL"]
adapter_config["apiKey"] = os.environ["RELAY_TOKEN"]
adapter_config["extraArgs"] = [
    "-c", "preferred_auth_method=\"apikey\"",
    "-c", "model_provider=\"codex\"",
    "-c", "model_providers.codex.name=\"codex\"",
    "-c", f"model_providers.codex.base_url=\"{os.environ['TARGET_BASE_URL']}\"",
    "-c", f"model_providers.codex.wire_api=\"{os.environ['TARGET_WIRE_API']}\"",
    "-c", "model_providers.codex.requires_openai_auth=true",
    "--skip-git-repo-check",
]

effort = os.environ.get("TARGET_EFFORT", "").strip()
if effort:
    adapter_config["modelReasoningEffort"] = effort
else:
    adapter_config.pop("modelReasoningEffort", None)

print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config,
}, ensure_ascii=False, separators=(",", ":")))
PY
    )"

    patch_headers=(-H 'Content-Type: application/json')
    if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
      patch_headers+=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
    fi

    curl -fsS -X PATCH "${patch_headers[@]}" "${api_url}/api/agents/${runtime_id}" \
      -d "$patch_payload" >/dev/null

    echo "Updated ${agent_name} -> model=${target_model}${target_effort:+, modelReasoningEffort=${target_effort}}"
    updated=$((updated + 1))
  done < <(iter_codex_agents)

  echo ""
  echo "Done. Updated ${updated} codex_local agent(s)."
}

load_runtime_agents

case "${1:-status}" in
  status)
    show_status
    ;;
  sync)
    sync_models
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
