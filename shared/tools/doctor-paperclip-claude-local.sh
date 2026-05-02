#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="${PAPERCLIP_YAML:-${REPO_ROOT}/.paperclip.yaml}"
AUTH_JSON="${HOME}/.paperclip/auth.json"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
TARGET_AGENT_NAME="${TARGET_AGENT_NAME:-}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/doctor-paperclip-claude-local.sh

Env overrides:
  PAPERCLIP_API_URL
  PAPERCLIP_API_TOKEN / PAPERCLIP_API_KEY
  TARGET_AGENT_NAME

Output fields:
  effective_base_url
  effective_model
  effective_auth_mode
  source_of_model
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

  if [[ -z "${PAPERCLIP_API_URL}" ]]; then
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

resolve_target_agent() {
  local agents_json
  agents_json="$(api_curl "${api_url}/api/companies/${company_id}/agents")"

  if [[ -n "${TARGET_AGENT_NAME}" ]]; then
    target_agent_json="$(jq --arg name "${TARGET_AGENT_NAME}" -c '.[] | select(.name==$name and .adapterType=="claude_local")' <<<"${agents_json}" | head -n 1)"
  else
    target_agent_json="$(jq -c '.[] | select(.adapterType=="claude_local")' <<<"${agents_json}" | head -n 1)"
  fi

  if [[ -z "${target_agent_json}" ]]; then
    echo "No claude_local runtime agent found." >&2
    exit 1
  fi
}

render_doctor_output() {
  TARGET_AGENT_JSON="${target_agent_json}" python3 - <<'PY'
import json
import os

agent = json.loads(os.environ["TARGET_AGENT_JSON"])
config = agent.get("adapterConfig") or {}
env = config.get("env") or {}

def env_value(key):
    value = env.get(key)
    if isinstance(value, dict):
        return value.get("value")
    return value

effective_base_url = env_value("ANTHROPIC_BASE_URL") or ""
effective_model = env_value("ANTHROPIC_MODEL") or ""
has_auth_token = bool(env_value("ANTHROPIC_AUTH_TOKEN"))
has_api_key = bool(env_value("ANTHROPIC_API_KEY"))

if has_auth_token:
    effective_auth_mode = "relayhub_auth_token"
elif has_api_key:
    effective_auth_mode = "api_key_only"
else:
    effective_auth_mode = "missing"

if effective_model.startswith("relayhub-entry-"):
    source_of_model = "relayhub_entry_alias"
elif effective_model:
    source_of_model = "direct_model_name"
else:
    source_of_model = "unset"

payload = {
    "agent_name": agent.get("name"),
    "effective_base_url": effective_base_url or None,
    "effective_model": effective_model or None,
    "effective_auth_mode": effective_auth_mode,
    "source_of_model": source_of_model,
    "has_direct_deepseek_residue": effective_model.startswith("deepseek-"),
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
}

case "${1:-status}" in
  status|doctor)
    require_cmd ruby
    require_cmd python3
    require_cmd curl
    require_cmd jq
    resolve_paperclip_api
    resolve_target_agent
    render_doctor_output
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
