#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
MODE="${1:-status}"
TARGET_AGENT_NAMES_RAW="${PAPERCLIP_COMMAND_OVERRIDE_TARGETS:-Engineer}"

DEFAULT_PROXY_COMMAND="${REPO_ROOT}/shared/tools/ci/server-automation-command-proxy.sh"
DEFAULT_WORKTREE_ROOT="${PAPERCLIP_EXECUTION_WORKTREE_ROOT:-/opt/automation/worktrees}"
IFS=',' read -r -a TARGET_AGENT_NAMES <<<"$TARGET_AGENT_NAMES_RAW"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/sync-paperclip-server-automation-command-override.sh status
  shared/tools/sync-paperclip-server-automation-command-override.sh dry-run
  shared/tools/sync-paperclip-server-automation-command-override.sh sync
  shared/tools/sync-paperclip-server-automation-command-override.sh rollback

Commands:
  status    Show current runtime command override state for target agents
  dry-run   Print the PATCH payload that would be applied
  sync      Apply runtime command override to target agents
  rollback  Remove runtime command override and helper env keys from target agents

Notes:
  - Current default target: Engineer
  - To target more agents, set PAPERCLIP_COMMAND_OVERRIDE_TARGETS, e.g. Engineer,Test / QA
  - This script only overrides adapterConfig.command plus helper env for proxy pass-through.
  - It does not fabricate task_class / execution_route metadata.
  - This script preserves existing adapterConfig.extraArgs/model/instructions fields
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

if [[ -z "$PAPERCLIP_API_URL" ]]; then
  api_url="http://${host}:${port}"
else
  api_url="$PAPERCLIP_API_URL"
fi

require_cmd ruby
require_cmd python3
require_cmd curl

runtime_agents_json="$(api_curl "${api_url}/api/companies/${company_id}/agents")"

runtime_agent_id_by_name() {
  local agent_name="$1"
  ruby -rjson -e '
    agents = JSON.parse(STDIN.read)
    target = ARGV[0]
    match = agents.find { |agent| agent["name"] == target }
    puts(match ? match["id"] : "")
  ' "$agent_name" <<<"$runtime_agents_json"
}

build_patch_payload() {
  local current_payload="$1"
  local mode="$2"
  local proxy_command="$3"
  python3 - "$mode" "$proxy_command" <<'PY' <<<"$current_payload"
import json, sys

mode = sys.argv[1]
proxy_command = sys.argv[2]
agent = json.loads(sys.stdin.read())
adapter = agent.get("adapterType")
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})

default_real_command = {
    "codex_local": "codex",
    "claude_local": "claude",
    "pi_local": "pi",
}.get(adapter, "")

if mode == "rollback":
    adapter_config.pop("command", None)
    env.pop("PAPERCLIP_REAL_COMMAND", None)
    env.pop("PAPERCLIP_EXECUTION_WORKTREE_ROOT", None)
    env.pop("PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT", None)
    env.pop("PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE", None)
    adapter_config["env"] = env
else:
    adapter_config["command"] = proxy_command
    env["PAPERCLIP_REAL_COMMAND"] = {"type": "plain", "value": default_real_command}
    env["PAPERCLIP_EXECUTION_WORKTREE_ROOT"] = {"type": "plain", "value": "/opt/automation/worktrees"}
    env["PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT"] = {"type": "plain", "value": "/opt/automation/worktrees"}
    env["PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE"] = {"type": "plain", "value": "passive"}
    adapter_config["env"] = env

print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config,
}, ensure_ascii=False, separators=(",", ":")))
PY
}

show_status() {
  for agent_name in "${TARGET_AGENT_NAMES[@]}"; do
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "${agent_name}: runtime agent missing"
      continue
    fi
    payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    python3 - "$agent_name" <<'PY' <<<"$payload"
import json, sys

name = sys.argv[1]
agent = json.loads(sys.stdin.read())
cfg = dict(agent.get("adapterConfig") or {})
env = dict(cfg.get("env") or {})
def value(key):
    entry = env.get(key) or {}
    return entry.get("value", "<unset>") if isinstance(entry, dict) else str(entry)
print(f"{name}: command={cfg.get('command', '<default>')} real={value('PAPERCLIP_REAL_COMMAND')} proxy_mode={value('PAPERCLIP_SERVER_AUTOMATION_PROXY_MODE')}")
PY
  done
}

apply_mode() {
  local dry_run="$1"
  local patch_mode="$2"
  local updated=0
  local patch_headers=(-H 'Content-Type: application/json')
  if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
    patch_headers+=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
  fi

  for agent_name in "${TARGET_AGENT_NAMES[@]}"; do
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    if [[ -z "$runtime_id" ]]; then
      echo "Skipping ${agent_name}: runtime agent missing"
      continue
    fi
    current_payload="$(api_curl "${api_url}/api/agents/${runtime_id}")"
    patch_payload="$(build_patch_payload "$current_payload" "$patch_mode" "$DEFAULT_PROXY_COMMAND")"
    if [[ "$dry_run" == "1" ]]; then
      echo "== ${agent_name} =="
      echo "$patch_payload"
      continue
    fi
    curl -fsS -X PATCH "${patch_headers[@]}" "${api_url}/api/agents/${runtime_id}" -d "$patch_payload" >/dev/null
    echo "Updated ${agent_name}"
    updated=$((updated + 1))
  done

  if [[ "$dry_run" != "1" ]]; then
    echo ""
    echo "Done. Updated ${updated} runtime agent(s)."
  fi
}

case "$MODE" in
  status)
    show_status
    ;;
  dry-run)
    apply_mode 1 sync
    ;;
  sync)
    apply_mode 0 sync
    ;;
  rollback)
    apply_mode 0 rollback
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
