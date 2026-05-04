#!/bin/bash
# sync-agents.sh - 在 mindsync 源码与当前 Paperclip 运行时之间同步已有 Agent 的 instructions

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="$REPO_ROOT/.paperclip.yaml"
PAPERCLIP_INSTANCE="${PAPERCLIP_INSTANCE:-default}"

if [[ ! -f "$PAPERCLIP_YAML" ]]; then
  echo "❌ Error: .paperclip.yaml not found at $PAPERCLIP_YAML"
  exit 1
fi

read_config_value() {
  local key_path="$1"
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0])
    value = ARGV[1].split(".").reduce(data) { |acc, key| acc.is_a?(Hash) ? acc[key] : nil }
    puts value.to_s
  ' "$PAPERCLIP_YAML" "$key_path"
}

COMPANY_ID="$(read_config_value "company.id")"
HOST="$(read_config_value "company.host")"
PORT="$(read_config_value "company.port")"

if [[ -z "$COMPANY_ID" || -z "$HOST" || -z "$PORT" ]]; then
  echo "❌ Error: failed to read company.id / host / port from $PAPERCLIP_YAML"
  exit 1
fi

API_URL="http://${HOST}:${PORT}"
PAPERCLIP_BASE="${HOME}/.paperclip/instances/${PAPERCLIP_INSTANCE}/companies/${COMPANY_ID}/agents"
RUNTIME_AGENTS_JSON="$(curl -fsS "$API_URL/api/companies/$COMPANY_ID/agents")"

runtime_agent_id_by_name() {
  local agent_name="$1"
  ruby -rjson -e '
    agents = JSON.parse(STDIN.read)
    target = ARGV[0]
    match = agents.find { |agent| agent["name"] == target }
    puts(match ? match["id"] : "")
  ' "$agent_name" <<<"$RUNTIME_AGENTS_JSON"
}

iter_configured_agents() {
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0])
    Array(data["agents"]).each do |agent|
      name = agent["name"]
      directory = agent["directory"]
      next if name.to_s.empty? || directory.to_s.empty?
      puts [name, directory].join("\t")
    end
  ' "$PAPERCLIP_YAML"
}

sync_dir() {
  local src_dir="$1"
  local dest_dir="$2"

  mkdir -p "$dest_dir"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$src_dir/" "$dest_dir/"
    return
  fi

  find "$dest_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -R "$src_dir"/. "$dest_dir"/
}

export_to_mindsync() {
  echo "📤 Exporting agent instructions from Paperclip runtime to mindsync..."
  echo ""

  while IFS=$'\t' read -r agent_name repo_dir; do
    [[ -z "$agent_name" || -z "$repo_dir" ]] && continue

    local runtime_id
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"

    if [[ -z "$runtime_id" ]]; then
      echo "  ⚠️  Runtime agent not found: $agent_name"
      continue
    fi

    local src_dir="$PAPERCLIP_BASE/$runtime_id/instructions"
    local dest_dir="$REPO_ROOT/$repo_dir"

    if [[ ! -d "$src_dir" ]]; then
      echo "  ⚠️  Runtime instructions missing: $agent_name ($runtime_id)"
      continue
    fi

    echo "  📁 $agent_name: runtime → $repo_dir"
    sync_dir "$src_dir" "$dest_dir"
  done < <(iter_configured_agents)

  echo ""
  echo "✅ Export complete!"
}

import_from_mindsync() {
  echo "📥 Importing agent instructions from mindsync to Paperclip runtime..."
  echo ""

  if [[ ! -d "$PAPERCLIP_BASE" ]]; then
    echo "❌ Error: Paperclip agents directory not found at $PAPERCLIP_BASE"
    exit 1
  fi

  while IFS=$'\t' read -r agent_name repo_dir; do
    [[ -z "$agent_name" || -z "$repo_dir" ]] && continue

    local runtime_id
    runtime_id="$(runtime_agent_id_by_name "$agent_name")"

    if [[ -z "$runtime_id" ]]; then
      echo "  ⚠️  Runtime agent not found: $agent_name"
      continue
    fi

    local src_dir="$REPO_ROOT/$repo_dir"
    local dest_dir="$PAPERCLIP_BASE/$runtime_id/instructions"

    if [[ ! -d "$src_dir" ]]; then
      echo "  ⚠️  Repo instructions missing: $repo_dir"
      continue
    fi

    echo "  📁 $agent_name: $repo_dir → runtime"
    sync_dir "$src_dir" "$dest_dir"
  done < <(iter_configured_agents)

  echo ""
  echo "✅ Import complete!"
}

show_status() {
  echo "📊 Agent Instruction Sync Status"
  echo "================================"
  echo ""
  echo "Repo root:        $REPO_ROOT"
  echo "Paperclip base:   $PAPERCLIP_BASE"
  echo "API URL:          $API_URL"
  echo ""
  echo "Configured agents:"

  while IFS=$'\t' read -r agent_name repo_dir; do
    [[ -z "$agent_name" || -z "$repo_dir" ]] && continue

    runtime_id="$(runtime_agent_id_by_name "$agent_name")"
    repo_exists="❌"
    runtime_exists="❌"

    [[ -d "$REPO_ROOT/$repo_dir" ]] && repo_exists="✅"
    [[ -n "$runtime_id" && -d "$PAPERCLIP_BASE/$runtime_id/instructions" ]] && runtime_exists="✅"

    printf "  %s: repo %s | runtime %s | runtimeId %s\n" \
      "$agent_name" "$repo_exists" "$runtime_exists" "${runtime_id:-<missing>}"
  done < <(iter_configured_agents)

  echo ""
  echo "Note: this script only syncs instructions for agents that already exist in runtime."
  echo "If .paperclip.yaml has a new agent that is missing in Paperclip runtime,"
  echo "run shared/tools/sync-paperclip-runtime-agents.sh first."
}

case "${1:-status}" in
  export|e)
    export_to_mindsync
    ;;
  import|i)
    import_from_mindsync
    ;;
  status|s)
    show_status
    ;;
  *)
    echo "Usage: $0 {export|import|status}"
    echo ""
    echo "Commands:"
    echo "  export   Export runtime instructions into repo agent directories"
    echo "  import   Import repo agent directories into runtime instructions"
    echo "  status   Show current repo/runtime mapping status"
    exit 1
    ;;
esac
