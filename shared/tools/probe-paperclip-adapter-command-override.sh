#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="${REPO_ROOT}/.paperclip.yaml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/probe-paperclip-adapter-command-override.sh

Output:
  Prints a runtime command-override compatibility matrix for codex_local / claude_local / pi_local.

Notes:
  - This is a non-mutating probe. It only reads runtime agent configs.
  - Compatibility conclusions come from Paperclip adapter execute.ts inspection plus current runtime config readback.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

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

require_cmd ruby
require_cmd python3
require_cmd curl

company_id="$(read_yaml_value "company.id")"
host="$(read_yaml_value "company.host")"
port="$(read_yaml_value "company.port")"

if [[ -z "$PAPERCLIP_API_URL" ]]; then
  api_url="http://${host}:${port}"
else
  api_url="$PAPERCLIP_API_URL"
fi

api_curl() {
  if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
    curl -fsS -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" "$@"
    return
  fi
  curl -fsS "$@"
}

payload="$(api_curl "${api_url}/api/companies/${company_id}/agents")"
PAYLOAD_JSON="$payload" python3 - <<'PY'
import json, sys
import os

agents = json.loads(os.environ["PAYLOAD_JSON"])
target = {"codex_local", "claude_local", "pi_local"}

matrix = {
    "codex_local": {
        "command_override": "yes(binary_only)",
        "args_preserved": "yes(extraArgs_adapter_append)",
        "stdin_preserved": "yes(prompt_via_stdin)",
        "cwd_source": "runtime_workspace",
        "recommendation": "phase2_candidate",
    },
    "claude_local": {
        "command_override": "yes(binary_only)",
        "args_preserved": "yes(extraArgs_adapter_append)",
        "stdin_preserved": "yes(prompt_via_stdin)",
        "cwd_source": "runtime_workspace",
        "recommendation": "probe_only_defer_rollout",
    },
    "pi_local": {
        "command_override": "yes(binary_only)",
        "args_preserved": "yes(extraArgs_adapter_append)",
        "stdin_preserved": "yes(prompt_via_stdin)",
        "cwd_source": "runtime_workspace",
        "recommendation": "probe_only_no_default_rollout",
    },
}

print("adapter\tagent\tcurrent_command\textra_args\tcommand_override\targs_preserved\tstdin_preserved\tcwd_source\trecommendation")
for agent in agents:
    adapter = agent.get("adapterType")
    if adapter not in target:
        continue
    cfg = agent.get("adapterConfig") or {}
    cmd = cfg.get("command")
    extra = cfg.get("extraArgs") or []
    info = matrix[adapter]
    print(
        f"{adapter}\t{agent.get('name')}\t{cmd or '<default>'}\t{json.dumps(extra, ensure_ascii=False)}\t{info['command_override']}\t{info['args_preserved']}\t{info['stdin_preserved']}\t{info['cwd_source']}\t{info['recommendation']}"
    )
PY
