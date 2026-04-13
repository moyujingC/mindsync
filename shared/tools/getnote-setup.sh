#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALLER="${HOME}/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py"
CODEX_SKILL_DIR="${HOME}/.codex/skills/getnote"
CLAUDE_SKILL_DIR="${HOME}/.claude/skills/getnote"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3100}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID:-be191a6e-7447-4821-a93d-9114214c4a64}"

RESEARCH_AGENT_ID="da3da98c-79a7-4990-b26d-3530d2711c2e"
CONTENT_AGENT_ID="2faf9d77-9454-44ec-97c2-dbd24d34a9e6"
ENGINEER_AGENT_ID="fd835fc1-7e14-487f-ba02-45eed5f6c221"

usage() {
  cat <<'EOF'
Usage:
  shared/tools/getnote-setup.sh status
  shared/tools/getnote-setup.sh install-local
  shared/tools/getnote-setup.sh sync-paperclip
  shared/tools/getnote-setup.sh all

Commands:
  status          Check local install state, Paperclip sync state, and GETNOTE_* env vars
  install-local   Install Get笔记 into ~/.codex/skills and ~/.claude/skills
  sync-paperclip  Import the local Get笔记 skill into Paperclip and assign it to target agents
  all             Run install-local, then sync-paperclip, then status

Notes:
  - Local source of truth for Paperclip import uses ~/.codex/skills/getnote.
  - If GETNOTE_API_KEY / GETNOTE_CLIENT_ID are set, this script also writes them into
    the target agents' adapterConfig.env as plain bindings.
  - If GETNOTE_OWNER_ID is unset, it is omitted from adapterConfig.env.
EOF
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing required command: ${cmd}" >&2
    exit 1
  }
}

python_json() {
  local script="$1"
  shift
  python3 -c "$script" "$@"
}

install_one() {
  local dest="$1"
  local target="${dest}/getnote"
  mkdir -p "$dest"
  if [[ -d "$target" ]]; then
    echo "Already installed: $target"
    return
  fi
  python3 "$INSTALLER" --repo iswalle/getnote-openclaw --path . --name getnote --dest "$dest"
}

get_company_skill_key() {
  local payload
  payload="$(curl -sS "${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/skills")"
  python_json '
import json, sys
locator = sys.argv[1]
items = json.loads(sys.stdin.read())
for item in items:
    if item.get("sourceType") == "local_path" and item.get("sourceLocator") == locator:
        print(item.get("key", ""))
        break
' "$CODEX_SKILL_DIR" <<<"$payload"
}

import_company_skill() {
  local key
  key="$(get_company_skill_key)"
  if [[ -n "$key" ]]; then
    echo "$key"
    return
  fi

  curl -sS -X POST "${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/skills/import" \
    -H 'Content-Type: application/json' \
    -d "{\"source\":\"${CODEX_SKILL_DIR}\"}" | \
    python_json '
import json, sys
payload = json.loads(sys.stdin.read())
print(payload["imported"][0]["key"])
'
}

sync_agent_skill() {
  local agent_id="$1"
  local skill_key="$2"
  curl -sS -X POST "${PAPERCLIP_API_URL}/api/agents/${agent_id}/skills/sync" \
    -H 'Content-Type: application/json' \
    -d "{\"desiredSkills\":[\"${skill_key}\"]}" >/dev/null
}

patch_agent_env() {
  local agent_id="$1"
  [[ -n "${GETNOTE_API_KEY:-}" && -n "${GETNOTE_CLIENT_ID:-}" ]] || return 0

  local current payload
  current="$(curl -sS "${PAPERCLIP_API_URL}/api/agents/${agent_id}")"
  payload="$(
    printf '%s' "$current" | \
    GETNOTE_API_KEY="${GETNOTE_API_KEY}" \
    GETNOTE_CLIENT_ID="${GETNOTE_CLIENT_ID}" \
    GETNOTE_OWNER_ID="${GETNOTE_OWNER_ID:-}" \
    python3 -c '
import json, os, sys
agent = json.loads(sys.stdin.read())
adapter_config = dict(agent.get("adapterConfig") or {})
env = dict(adapter_config.get("env") or {})
env["GETNOTE_API_KEY"] = {"type": "plain", "value": os.environ["GETNOTE_API_KEY"]}
env["GETNOTE_CLIENT_ID"] = {"type": "plain", "value": os.environ["GETNOTE_CLIENT_ID"]}
owner_id = os.environ.get("GETNOTE_OWNER_ID", "")
if owner_id:
    env["GETNOTE_OWNER_ID"] = {"type": "plain", "value": owner_id}
adapter_config["env"] = env
print(json.dumps({
    "replaceAdapterConfig": True,
    "adapterConfig": adapter_config
}, ensure_ascii=False, separators=(",", ":")))
'
  )"

  curl -sS -X PATCH "${PAPERCLIP_API_URL}/api/agents/${agent_id}" \
    -H 'Content-Type: application/json' \
    -d "$payload" >/dev/null
}

status_one_agent() {
  local name="$1"
  local agent_id="$2"
  local payload desired
  payload="$(curl -sS "${PAPERCLIP_API_URL}/api/agents/${agent_id}/skills")"
  desired="$(python_json '
import json, sys
data = json.loads(sys.stdin.read())
vals = [item for item in data.get("desiredSkills", []) if "get" in item.lower()]
print(",".join(vals))
' <<<"$payload")"
  if [[ -n "$desired" ]]; then
    printf '%-28s %s\n' "${name}" "paperclip-skill=${desired}"
  else
    printf '%-28s %s\n' "${name}" "paperclip-skill=missing"
  fi
}

show_status() {
  require_cmd python3
  printf 'Local skills\n'
  printf '  codex:   %s\n' "$(if [[ -d "$CODEX_SKILL_DIR" ]]; then echo installed; else echo missing; fi)"
  printf '  claude:  %s\n' "$(if [[ -d "$CLAUDE_SKILL_DIR" ]]; then echo installed; else echo missing; fi)"
  printf '\n'
  printf 'Getnote env\n'
  printf '  GETNOTE_API_KEY:    %s\n' "$(if [[ -n "${GETNOTE_API_KEY:-}" ]]; then echo present; else echo missing; fi)"
  printf '  GETNOTE_CLIENT_ID:  %s\n' "$(if [[ -n "${GETNOTE_CLIENT_ID:-}" ]]; then echo present; else echo missing; fi)"
  printf '  GETNOTE_OWNER_ID:   %s\n' "$(if [[ -n "${GETNOTE_OWNER_ID:-}" ]]; then echo present; else echo optional-missing; fi)"
  printf '\n'
  printf 'Paperclip agents\n'
  status_one_agent "Research & Knowledge Lead" "$RESEARCH_AGENT_ID"
  status_one_agent "Content Lead" "$CONTENT_AGENT_ID"
  status_one_agent "Engineer" "$ENGINEER_AGENT_ID"
}

install_local() {
  require_cmd python3
  install_one "${HOME}/.codex/skills"
  install_one "${HOME}/.claude/skills"
}

sync_paperclip() {
  require_cmd python3
  [[ -d "$CODEX_SKILL_DIR" ]] || {
    echo "Missing local Codex skill at ${CODEX_SKILL_DIR}. Run install-local first." >&2
    exit 1
  }

  local skill_key
  skill_key="$(import_company_skill)"
  echo "Paperclip company skill key: ${skill_key}"

  sync_agent_skill "$RESEARCH_AGENT_ID" "$skill_key"
  sync_agent_skill "$CONTENT_AGENT_ID" "$skill_key"
  sync_agent_skill "$ENGINEER_AGENT_ID" "$skill_key"

  patch_agent_env "$RESEARCH_AGENT_ID"
  patch_agent_env "$CONTENT_AGENT_ID"
  patch_agent_env "$ENGINEER_AGENT_ID"

  if [[ -n "${GETNOTE_API_KEY:-}" && -n "${GETNOTE_CLIENT_ID:-}" ]]; then
    echo "Patched GETNOTE_* env into target agents."
  else
    echo "GETNOTE_API_KEY / GETNOTE_CLIENT_ID not set. Skipped Paperclip agent env injection."
  fi
}

command="${1:-status}"
case "$command" in
  status)
    show_status
    ;;
  install-local)
    install_local
    ;;
  sync-paperclip)
    sync_paperclip
    ;;
  all)
    install_local
    sync_paperclip
    show_status
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
