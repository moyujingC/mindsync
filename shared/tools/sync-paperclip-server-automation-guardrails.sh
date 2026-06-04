#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
MODE="${1:-status}"

TARGET_ADAPTERS=("codex_local" "claude_local" "pi_local")
DEFAULT_WORKTREE_ROOT="${PAPERCLIP_EXECUTION_WORKTREE_ROOT:-/opt/automation/worktrees}"
DEFAULT_GIT_USER_NAME="${PAPERCLIP_AUTOMATION_GIT_USER_NAME:-Paperclip Automation}"
DEFAULT_GIT_USER_EMAIL="${PAPERCLIP_AUTOMATION_GIT_USER_EMAIL:-paperclip-automation@local}"
DEFAULT_AUTO_FINALIZE="${PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE:-1}"
DEFAULT_FREEZE="${PAPERCLIP_SERVER_AUTOMATION_FREEZE:-1}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-server-automation-guardrails.sh status
  shared/tools/sync-paperclip-server-automation-guardrails.sh sync

Commands:
  status  Show current runtime agent adapterConfig.env guardrail keys
  sync    Patch runtime agents with guardrail env defaults

Notes:
  - This script only manages adapterConfig.env defaults needed by server automation guardrails.
  - It does not force adapterConfig.command override because the current adapter CLI contract must be verified separately.
  - Target adapters: codex_local, claude_local, pi_local
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

iter_target_agents() {
  ruby -e '
    require "yaml"
    content = File.read(ARGV[0], encoding: "UTF-8")
    data = YAML.safe_load(content)
    target = %w[codex_local claude_local pi_local]
    Array(data["agents"]).each do |agent|
      next unless target.include?(agent["adapter"].to_s)
      puts [agent["name"], agent["adapter"]].join("\t")
    end
  ' "$PAPERCLIP_YAML"
}

api_curl() {
  if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
    curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" "$@"
    return
  fi
  curl -fsS "$@"
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

runtime_agents_json="$(
  api_curl "${api_url}/api/companies/${company_id}/agents" || {
    echo "Paperclip API unavailable at ${api_url}" >&2
    exit 1
  }
)"

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
  echo "Paperclip server automation guardrails"
  echo "  api_url: ${api_url}"
  echo "  company_id: ${company_id}"
  echo "  expected_root: ${DEFAULT_WORKTREE_ROOT}"
  echo ""

  while IFS=$'\t' read -r agent_name adapter_name; do
    [[ -z "$agent_name" ]] && continue
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "  ${agent_name}: runtime agent missing"
      continue
    fi

    payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    python3 - "$agent_name" "$adapter_name" <<'PY' <<<"$payload"
import json
import sys

agent_name = sys.argv[1]
adapter_name = sys.argv[2]
agent = json.loads(sys.stdin.read())
config = dict(agent.get("adapterConfig") or {})
env = dict(config.get("env") or {})

def value(key):
    entry = env.get(key) or {}
    return entry.get("value", "<unset>") if isinstance(entry, dict) else str(entry)

command = config.get("command", "<unset>")
print(f"  {agent_name}: adapter={adapter_name} command={command}")
print(f"    PAPERCLIP_EXECUTION_WORKTREE_ROOT={value('PAPERCLIP_EXECUTION_WORKTREE_ROOT')}")
print(f"    PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT={value('PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT')}")
print(f"    PAPERCLIP_AUTOMATION_GIT_USER_NAME={value('PAPERCLIP_AUTOMATION_GIT_USER_NAME')}")
print(f"    PAPERCLIP_AUTOMATION_GIT_USER_EMAIL={value('PAPERCLIP_AUTOMATION_GIT_USER_EMAIL')}")
print(f"    PAPERCLIP_SERVER_AUTOMATION_FREEZE={value('PAPERCLIP_SERVER_AUTOMATION_FREEZE')}")
print(f"    PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE={value('PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE')}")
PY
  done < <(iter_target_agents)
}

sync_guardrails() {
  local updated=0

  while IFS=$'\t' read -r agent_name adapter_name; do
    [[ -z "$agent_name" ]] && continue
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "Skipping ${agent_name}: runtime agent missing"
      continue
    fi

    current_payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    patch_payload="$(
      WORKTREE_ROOT="${DEFAULT_WORKTREE_ROOT}" \
      GIT_USER_NAME="${DEFAULT_GIT_USER_NAME}" \
      GIT_USER_EMAIL="${DEFAULT_GIT_USER_EMAIL}" \
      AUTO_FINALIZE="${DEFAULT_AUTO_FINALIZE}" \
      FREEZE="${DEFAULT_FREEZE}" \
      python3 - <<'PY' <<<"$current_payload"
import json
import os
import sys

agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})

env["PAPERCLIP_EXECUTION_WORKTREE_ROOT"] = {"type": "plain", "value": os.environ["WORKTREE_ROOT"]}
env["PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT"] = {"type": "plain", "value": os.environ["WORKTREE_ROOT"]}
env["PAPERCLIP_AUTOMATION_GIT_USER_NAME"] = {"type": "plain", "value": os.environ["GIT_USER_NAME"]}
env["PAPERCLIP_AUTOMATION_GIT_USER_EMAIL"] = {"type": "plain", "value": os.environ["GIT_USER_EMAIL"]}
env["PAPERCLIP_SERVER_AUTOMATION_FREEZE"] = {"type": "plain", "value": os.environ["FREEZE"]}
env["PAPERCLIP_SERVER_AUTOMATION_AUTO_FINALIZE"] = {"type": "plain", "value": os.environ["AUTO_FINALIZE"]}

adapter_config["env"] = env

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

    echo "Updated ${agent_name} (${adapter_name}) guardrail env"
    updated=$((updated + 1))
  done < <(iter_target_agents)

  echo ""
  echo "Done. Updated ${updated} runtime agent(s)."
  echo "Note: adapterConfig.command remains unchanged; wrapper override needs separate adapter contract verification."
}

case "$MODE" in
  status)
    show_status
    ;;
  sync)
    sync_guardrails
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
