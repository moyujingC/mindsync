#!/bin/bash
# sync-paperclip-runtime-agents.sh - 对账并补建 Paperclip 运行时缺失的 agent 实体

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="$REPO_ROOT/.paperclip.yaml"
MODE="${1:-status}"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"

if [[ ! -f "$PAPERCLIP_YAML" ]]; then
  echo "❌ Error: .paperclip.yaml not found at $PAPERCLIP_YAML"
  exit 1
fi

if ! command -v ruby >/dev/null 2>&1; then
  echo "❌ Error: ruby is required"
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

if [[ -z "$PAPERCLIP_API_URL" ]]; then
  if [[ -z "$HOST" || -z "$PORT" ]]; then
    echo "❌ Error: failed to read company.host / company.port from $PAPERCLIP_YAML"
    exit 1
  fi
  PAPERCLIP_API_URL="http://${HOST}:${PORT}"
fi

if [[ -z "$COMPANY_ID" ]]; then
  echo "❌ Error: failed to read company.id from $PAPERCLIP_YAML"
  exit 1
fi

usage() {
  cat <<EOF
Usage: $0 {status|create-missing}

Modes:
  status          Compare .paperclip.yaml agents with Paperclip runtime agents
  create-missing  Create missing runtime agents from .paperclip.yaml

Env:
  PAPERCLIP_API_URL    Override API base URL (default from .paperclip.yaml)
  PAPERCLIP_API_TOKEN  Optional bearer token for authenticated instances
  PAPERCLIP_API_KEY    Fallback token variable name
EOF
}

if [[ "$MODE" != "status" && "$MODE" != "create-missing" ]]; then
  usage
  exit 1
fi

AUTH_HEADER_ARGS=()
if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
  AUTH_HEADER_ARGS=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
fi

api_curl() {
  if [[ "${#AUTH_HEADER_ARGS[@]}" -gt 0 ]]; then
    curl -fsS "${AUTH_HEADER_ARGS[@]}" "$@"
    return
  fi
  curl -fsS "$@"
}

RUNTIME_AGENTS_JSON="$(
  api_curl "${PAPERCLIP_API_URL}/api/companies/${COMPANY_ID}/agents"
)"

CONFIGURED_AGENTS_TSV="$(
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0])
    Array(data["agents"]).each do |agent|
      next unless agent.is_a?(Hash)
      puts [
        agent["name"],
        agent["role"],
        agent["adapter"],
        agent["directory"]
      ].map { |value| value.to_s.gsub("\t", " ") }.join("\t")
    end
  ' "$PAPERCLIP_YAML"
)"

FRONTMATTER_TSV="$(
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0])
    Array(data["agents"]).each do |agent|
      directory = agent["directory"].to_s
      next if directory.empty?
      path = File.join(ARGV[1], directory, "AGENTS.md")
      title = ""
      reports_to = ""
      if File.exist?(path)
        content = File.read(path)
        if content =~ /\A---\s*\n(.*?)\n---\s*\n/m
          frontmatter = YAML.safe_load($1) || {}
          title = frontmatter["title"].to_s
          reports_to = frontmatter["reportsTo"].to_s
        end
      end
      puts [
        agent["name"],
        title,
        reports_to
      ].map { |value| value.to_s.gsub("\t", " ") }.join("\t")
    end
  ' "$PAPERCLIP_YAML" "$REPO_ROOT"
)"

RUNTIME_STATUS="$(
  CONFIGURED_AGENTS_TSV="$CONFIGURED_AGENTS_TSV" \
  FRONTMATTER_TSV="$FRONTMATTER_TSV" \
  RUNTIME_AGENTS_JSON="$RUNTIME_AGENTS_JSON" \
  ruby <<'RUBY'
require "json"

configured = ENV.fetch("CONFIGURED_AGENTS_TSV", "").lines(chomp: true).map do |line|
  name, role, adapter, directory = line.split("\t", 4)
  { "name" => name.to_s, "configured_role" => role.to_s, "adapter" => adapter.to_s, "directory" => directory.to_s }
end

frontmatter_by_name = {}
ENV.fetch("FRONTMATTER_TSV", "").lines(chomp: true).each do |line|
  name, title, reports_to = line.split("\t", 3)
  frontmatter_by_name[name.to_s] = {
    "title" => title.to_s,
    "reports_to" => reports_to.to_s,
  }
end

runtime_agents = JSON.parse(ENV.fetch("RUNTIME_AGENTS_JSON", "[]"))
runtime_by_name = runtime_agents.each_with_object({}) { |agent, memo| memo[agent["name"]] = agent }

role_map = {
  "ceo" => "ceo",
  "idea_clarifier" => "general",
  "business" => "general",
  "product_spec" => "pm",
  "ui_ux" => "designer",
  "research_knowledge" => "researcher",
  "architect" => "cto",
  "engineer" => "engineer",
  "test_qa" => "qa",
  "content" => "cmo",
}

configured.each do |agent|
  frontmatter = frontmatter_by_name.fetch(agent["name"], {})
  runtime = runtime_by_name[agent["name"]]
  status = runtime ? "present" : "missing"
  puts [
    status,
    agent["name"],
    agent["configured_role"],
    role_map.fetch(agent["configured_role"], "general"),
    agent["adapter"],
    agent["directory"],
    frontmatter.fetch("title", ""),
    frontmatter.fetch("reports_to", ""),
    runtime ? runtime["id"].to_s : "",
    runtime ? (runtime["adapterType"] || runtime["adapter"] || runtime["adapter_type"]).to_s : "",
    runtime ? runtime["role"].to_s : "",
  ].join("\t")
end
RUBY
)"

echo "Paperclip Agent Runtime 对账"
echo "============================"
echo "Repo root:    $REPO_ROOT"
echo "API URL:      $PAPERCLIP_API_URL"
echo "Company ID:   $COMPANY_ID"
echo ""

missing_count=0

while IFS=$'\t' read -r status name configured_role mapped_role adapter directory title reports_to runtime_id runtime_adapter runtime_role; do
  [[ -z "$name" ]] && continue

  if [[ "$status" == "present" ]]; then
    echo "✅ $name | runtimeId=$runtime_id | adapter=$runtime_adapter | role=$runtime_role"
    continue
  fi

  missing_count=$((missing_count + 1))
  echo "⚠️  Missing runtime agent: $name | adapter=$adapter | mappedRole=$mapped_role | dir=$directory"
done <<<"$RUNTIME_STATUS"

if [[ "$MODE" == "status" ]]; then
  if [[ "$missing_count" -eq 0 ]]; then
    echo ""
    echo "已对齐：运行时 agent 数量与 .paperclip.yaml 一致。"
  else
  echo ""
  echo "发现 $missing_count 个缺失 agent。"
  echo "如需补建，可在 Paperclip 服务可用时执行："
  echo "  bash shared/tools/sync-paperclip-runtime-agents.sh create-missing"
  fi
  exit 0
fi

if [[ "$missing_count" -eq 0 ]]; then
  echo ""
  echo "无需补建。"
  exit 0
fi

CEO_RUNTIME_ID="$(
  RUNTIME_STATUS="$RUNTIME_STATUS" ruby <<'RUBY'
ENV.fetch("RUNTIME_STATUS", "").lines(chomp: true).each do |line|
  status, name, _configured_role, _mapped_role, _adapter, _directory, _title, _reports_to, runtime_id, *_rest = line.split("\t", 11)
  next unless status == "present" && name == "CEO"
  puts runtime_id.to_s
  break
end
RUBY
)"

if [[ -z "$CEO_RUNTIME_ID" ]]; then
  echo "❌ Error: runtime CEO agent not found; cannot assign reportsTo for child agents"
  exit 1
fi

while IFS=$'\t' read -r status name configured_role mapped_role adapter directory title reports_to runtime_id runtime_adapter runtime_role; do
  [[ -z "$name" ]] && continue
  [[ "$status" == "present" ]] && continue

  reports_to_id="null"
  if [[ "$name" != "CEO" ]]; then
    reports_to_id="\"${CEO_RUNTIME_ID}\""
  fi

  permissions_json="{}"
  if [[ "$name" == "CEO" ]]; then
    permissions_json='{"canCreateAgents":true}'
  fi

  payload="$(
    NAME="$name" \
    ROLE="$mapped_role" \
    TITLE="$title" \
    ADAPTER="$adapter" \
    REPORTS_TO_JSON="$reports_to_id" \
    PERMISSIONS_JSON="$permissions_json" \
    ruby <<'RUBY'
require "json"

payload = {
  name: ENV.fetch("NAME"),
  role: ENV.fetch("ROLE"),
  title: ENV.fetch("TITLE"),
  reportsTo: JSON.parse(ENV.fetch("REPORTS_TO_JSON")),
  adapterType: ENV.fetch("ADAPTER"),
  permissions: JSON.parse(ENV.fetch("PERMISSIONS_JSON")),
}

puts JSON.generate(payload)
RUBY
  )"

  echo ""
  echo "➕ Creating runtime agent: $name"
  api_curl \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$payload" \
    "${PAPERCLIP_API_URL}/api/companies/${COMPANY_ID}/agents" >/dev/null
done <<<"$RUNTIME_STATUS"

echo ""
echo "✅ Missing runtime agents created."
echo "后续建议按下面顺序继续同步："
echo "  bash shared/tools/sync-agents.sh import"
echo "  bash shared/tools/sync-paperclip-agent-skills.sh sync"
