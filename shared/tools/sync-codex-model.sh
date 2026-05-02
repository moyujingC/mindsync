#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "${SCRIPT_DIR}/relayhub-entry-sync-lib.sh"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
CODEX_CONFIG="${HOME}/.codex/config.toml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-entry-paperclip-codex-local-server}"
RELAYHUB_INTERNAL_TOKEN="${RELAYHUB_INTERNAL_TOKEN:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-codex-model.sh status
  shared/tools/sync-codex-model.sh sync

Commands:
  status  Show the local Codex model and current Paperclip codex_local agent model config
  sync    Update Paperclip codex_local agents to use the local Codex client model

Notes:
  - Source of truth for model selection and api key is RelayHub internal entry binding resolve
  - Only runtime agents configured as codex_local in .paperclip.yaml are updated
  - Existing adapterConfig fields are preserved; only model / modelReasoningEffort are aligned
  - This script is now an initialization / repair tool.
  - Steady-state Paperclip usage should point codex_local at RelayHub once,
    then switch model / api key / reasoning effort in RelayHub only.
  - Use PAPERCLIP_API_URL to point at a remote automation server
  - Use PAPERCLIP_API_TOKEN or PAPERCLIP_API_KEY when the remote instance requires auth
  - When using DeepSeek, also update the provider base_url / auth in extraArgs or local Codex config
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
      warn "Codex config not found at #{path}"
      exit 2
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

local_model="$(read_codex_value "model")"
local_effort="$(read_codex_value "model_reasoning_effort")"

resolved_json="$(relayhub_fetch_entry_binding_json "${CONTROL_PLANE_BASE_URL}" "${ENTRY_ID}" "${RELAYHUB_INTERNAL_TOKEN}")"
relayhub_export_entry_binding_env "${resolved_json}"
relayhub_assert_api_key_present "${ENTRY_ID}" "${RESOLVED_MODEL_ID}" "${RESOLVED_API_KEY}"
local_model="${RESOLVED_MODEL}"
if [[ -n "${RESOLVED_REASONING_EFFORT}" ]]; then
  local_effort="${RESOLVED_REASONING_EFFORT}"
fi

if [[ -z "${local_model}" ]]; then
  echo "Could not read model from ${CODEX_CONFIG}" >&2
  exit 1
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

show_status() {
  echo "Local Codex config"
  echo "  model: ${local_model}"
  echo "  model_reasoning_effort: ${local_effort:-<unset>}"
  echo ""
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
      LOCAL_MODEL="${local_model}" LOCAL_EFFORT="${local_effort:-}" RESOLVED_API_KEY="${RESOLVED_API_KEY}" python3 - <<'PY' <<<"$current_payload"
import json
import os
import sys

agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
adapter_config["model"] = os.environ["LOCAL_MODEL"]
adapter_config["apiKey"] = os.environ["RESOLVED_API_KEY"]

extra_args = list(adapter_config.get("extraArgs") or [])
replacements = {
    'model_providers.codex.base_url="https://code.ppchat.vip/v1"': 'model_providers.codex.base_url="https://api.deepseek.com"',
}
adapter_config["extraArgs"] = [replacements.get(item, item) for item in extra_args]
if not any(item.startswith("model_providers.codex.api_key=") for item in adapter_config["extraArgs"]):
    adapter_config["extraArgs"].append(f'model_providers.codex.api_key="{os.environ["RESOLVED_API_KEY"]}"')

effort = os.environ.get("LOCAL_EFFORT", "").strip()
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

    echo "Updated ${agent_name} -> model=${local_model}${local_effort:+, modelReasoningEffort=${local_effort}}"
    updated=$((updated + 1))
  done < <(iter_codex_agents)

  echo ""
  echo "Done. Updated ${updated} codex_local agent(s)."
}

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
