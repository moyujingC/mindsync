#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AUTH_JSON="${HOME}/.paperclip/auth.json"
API_BASE="${PAPERCLIP_API_URL:-http://vm-0-11-opencloudos.tail176582.ts.net:3100}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-be191a6e-7447-4821-a93d-9114214c4a64}"

PRIMARY_BASE_URL="${PRIMARY_BASE_URL:-https://api.deepseek.com/anthropic}"
PRIMARY_MODEL="${PRIMARY_MODEL:-deepseek-v4-pro}"
BACKUP_BASE_URL="${BACKUP_BASE_URL:-https://api.deepseek.com/anthropic}"
BACKUP_MODEL="${BACKUP_MODEL:-deepseek-v4-flash}"

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
  PRIMARY_BASE_URL
  PRIMARY_MODEL
  BACKUP_BASE_URL
  BACKUP_MODEL
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

TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-$(read_token)}}"

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

env["ANTHROPIC_BASE_URL"] = plain(primary_base_url)
env["ANTHROPIC_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = plain(primary_model)
env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = plain(primary_model)
env.setdefault("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", plain("1"))

adapter_config["env"] = env
adapter_config["paperclipModelRouting"] = {
    "primary": {
        "provider": "DeepSeek",
        "baseUrl": primary_base_url,
        "model": primary_model,
    },
    "backup": {
        "provider": "DeepSeek",
        "baseUrl": backup_base_url,
        "model": backup_model,
        "note": "备用口径，当前未声明为自动回退。",
    },
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
    export PRIMARY_BASE_URL PRIMARY_MODEL BACKUP_BASE_URL BACKUP_MODEL
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
