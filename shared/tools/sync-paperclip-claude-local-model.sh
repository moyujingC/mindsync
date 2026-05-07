#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "${SCRIPT_DIR}/relayhub-entry-sync-lib.sh"
AUTH_JSON="${HOME}/.paperclip/auth.json"
API_BASE="${PAPERCLIP_API_URL:-http://vm-0-11-opencloudos.tail176582.ts.net:3100}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-be191a6e-7447-4821-a93d-9114214c4a64}"
CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://127.0.0.1:4318}"
ENTRY_ID="${ENTRY_ID:-entry-paperclip-claude-local-server}"
RELAYHUB_INTERNAL_TOKEN="${RELAYHUB_INTERNAL_TOKEN:-}"
USE_CONTROL_PLANE_BINDING="${USE_CONTROL_PLANE_BINDING:-0}"

PRIMARY_BASE_URL="${PRIMARY_BASE_URL:-https://relayhub.jingshu.cc/claude}"
PRIMARY_MODEL="${PRIMARY_MODEL:-relayhub-entry-paperclip-claude-local-server}"
RELAYHUB_RELAY_TOKEN="${RELAYHUB_RELAY_TOKEN:-relayhub-release-claude}"
BACKUP_BASE_URL="${BACKUP_BASE_URL:-https://relayhub.jingshu.cc/claude}"
BACKUP_MODEL="${BACKUP_MODEL:-relayhub-entry-paperclip-claude-local-server}"

read_token() {
  ruby -rjson -e '
    path = ARGV[0]
    key = ARGV[1]
    auth = JSON.parse(File.read(path))
    print auth.fetch("credentials").fetch(key).fetch("token")
  ' "$AUTH_JSON" "$API_BASE"
}

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-claude-local-model.sh status
  shared/tools/sync-paperclip-claude-local-model.sh sync

Env overrides:
  PAPERCLIP_API_URL
  PAPERCLIP_COMPANY_ID
  CONTROL_PLANE_BASE_URL
  RELAYHUB_INTERNAL_TOKEN
  USE_CONTROL_PLANE_BINDING
  ENTRY_ID
  PRIMARY_BASE_URL
  PRIMARY_MODEL
  RELAYHUB_RELAY_TOKEN
  BACKUP_BASE_URL
  BACKUP_MODEL

Notes:
  - This script is now an initialization / repair tool.
  - Default claude_local mode is Claude Code API-key mode via RelayHub:
    ANTHROPIC_BASE_URL=https://relayhub.jingshu.cc/claude and
    ANTHROPIC_MODEL=relayhub-entry-paperclip-claude-local-server.
  - Set USE_CONTROL_PLANE_BINDING=1 only when the RelayHub entry binding is
    known to resolve to a Claude Code-compatible Anthropic base URL and model.
  - Steady-state Paperclip usage should point claude_local at RelayHub once,
    then switch model / api key / reasoning effort in RelayHub only.
EOF
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing required command: ${cmd}" >&2
    exit 1
  }
}

require_cmd ruby
require_cmd python3
require_cmd curl
require_cmd jq

read_binding_defaults() {
  if [[ "${USE_CONTROL_PLANE_BINDING}" != "1" ]]; then
    RESOLVED_MODEL_ID="${ENTRY_ID}"
    RESOLVED_BASE_URL="${PRIMARY_BASE_URL}"
    RESOLVED_MODEL="${PRIMARY_MODEL}"
    RESOLVED_REASONING_EFFORT=""
    RESOLVED_API_KEY="${RELAYHUB_RELAY_TOKEN}"
    RESOLVED_HAS_STORED_API_KEY="true"
    export RESOLVED_MODEL_ID RESOLVED_BASE_URL RESOLVED_MODEL RESOLVED_REASONING_EFFORT RESOLVED_API_KEY RESOLVED_HAS_STORED_API_KEY
    return
  fi

  local resolved_json
  resolved_json="$(relayhub_fetch_entry_binding_json "${CONTROL_PLANE_BASE_URL}" "${ENTRY_ID}" "${RELAYHUB_INTERNAL_TOKEN}")"
  relayhub_export_entry_binding_env "${resolved_json}"
  relayhub_assert_api_key_present "${ENTRY_ID}" "${RESOLVED_MODEL_ID}" "${RESOLVED_API_KEY}"
  PRIMARY_BASE_URL="${RESOLVED_BASE_URL}"
  PRIMARY_MODEL="${RESOLVED_MODEL}"
}

TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-$(read_token)}}"
read_binding_defaults

api_curl() {
  curl -fsS -H "Authorization: Bearer ${TOKEN}" "$@"
}

list_claude_agents() {
  api_curl "${API_BASE}/api/companies/${COMPANY_ID}/agents" \
    | jq -r '.[] | select(.adapterType=="claude_local") | [.id, .name] | @tsv'
}

show_status() {
  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "$agent_id" ]] && continue
    api_curl "${API_BASE}/api/agents/${agent_id}" \
      | jq --arg name "$agent_name" '{
          name: $name,
          baseUrl: (.adapterConfig.env.ANTHROPIC_BASE_URL.value // null),
          model: (.adapterConfig.env.ANTHROPIC_MODEL.value // null),
          opus: (.adapterConfig.env.ANTHROPIC_DEFAULT_OPUS_MODEL.value // null),
          sonnet: (.adapterConfig.env.ANTHROPIC_DEFAULT_SONNET_MODEL.value // null),
          haiku: (.adapterConfig.env.ANTHROPIC_DEFAULT_HAIKU_MODEL.value // null),
          backup: (.adapterConfig.paperclipModelRouting.backup // null)
        }'
  done < <(list_claude_agents)
}

sync_agents() {
  while IFS=$'\t' read -r agent_id agent_name; do
    [[ -z "$agent_id" ]] && continue
    current_payload="$(api_curl "${API_BASE}/api/agents/${agent_id}")"
    patch_payload="$(
      CURRENT_PAYLOAD="$current_payload" python3 - <<'PY'
import json
import os
import sys

agent = json.loads(os.environ["CURRENT_PAYLOAD"])
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})

def plain(value: str) -> dict:
    return {"type": "plain", "value": value}

primary_base_url = os.environ["PRIMARY_BASE_URL"]
primary_model = os.environ["PRIMARY_MODEL"]
backup_base_url = os.environ["BACKUP_BASE_URL"]
backup_model = os.environ["BACKUP_MODEL"]
resolved_api_key = os.environ["RESOLVED_API_KEY"]

env["ANTHROPIC_BASE_URL"] = plain(primary_base_url)
env["ANTHROPIC_MODEL"] = plain(primary_model)
env["ANTHROPIC_API_KEY"] = plain(resolved_api_key)
env["ANTHROPIC_AUTH_TOKEN"] = plain(resolved_api_key)
env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = plain(primary_model)
env.setdefault("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", plain("1"))

adapter_config["env"] = env
adapter_config["model"] = primary_model
adapter_config["paperclipModelRouting"] = {
    "primary": {
        "provider": "RelayHub Claude Code",
        "baseUrl": primary_base_url,
        "model": primary_model,
        "authMode": "api_key",
    },
    "backup": {
        "provider": "RelayHub Claude Code",
        "baseUrl": backup_base_url,
        "model": backup_model,
        "note": "备用口径，当前未声明为自动回退。",
    },
    "note": "Claude Code uses ANTHROPIC_API_KEY/ANTHROPIC_AUTH_TOKEN; no interactive Claude login is required.",
}

print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config,
}, ensure_ascii=False, separators=(",", ":")))
PY
    )"

    api_curl -X PATCH \
      -H "Content-Type: application/json" \
      "${API_BASE}/api/agents/${agent_id}" \
      -d "$patch_payload" >/dev/null

    echo "Updated ${agent_name} -> ${PRIMARY_BASE_URL} / ${PRIMARY_MODEL}"
  done < <(list_claude_agents)
}

case "${1:-status}" in
  status)
    show_status
    ;;
  sync)
    export PRIMARY_BASE_URL PRIMARY_MODEL BACKUP_BASE_URL BACKUP_MODEL RESOLVED_API_KEY
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
