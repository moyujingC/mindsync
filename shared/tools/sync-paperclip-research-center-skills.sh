#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GENERIC_SYNC_SCRIPT="$REPO_ROOT/shared/tools/sync-paperclip-agent-skills.sh"
RESEARCH_BINDINGS_FILE="$REPO_ROOT/company/paperclip-research-center-skill-bindings.yaml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
MODE="${1:-sync}"

usage() {
  cat <<EOF
Usage: $0 {scan|status|sync}

Modes:
  scan    Scan Paperclip project workspaces and import repo-local research-center skills into company skills
  status  Show the current research-center skill attachment status for mapped agents
  sync    Run scan first, then sync the mapped research-center skills onto agents
EOF
}

if [[ "$MODE" != "scan" && "$MODE" != "status" && "$MODE" != "sync" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$RESEARCH_BINDINGS_FILE" ]]; then
  echo "❌ Error: research-center skill bindings file not found at $RESEARCH_BINDINGS_FILE" >&2
  exit 1
fi

if [[ ! -f "$GENERIC_SYNC_SCRIPT" ]]; then
  echo "❌ Error: generic sync script not found at $GENERIC_SYNC_SCRIPT" >&2
  exit 1
fi

if [[ -z "$PAPERCLIP_API_URL" || -z "$PAPERCLIP_COMPANY_ID" || -z "$PAPERCLIP_API_TOKEN" ]]; then
  echo "❌ Error: PAPERCLIP_API_URL, PAPERCLIP_COMPANY_ID, and PAPERCLIP_API_TOKEN are required." >&2
  exit 1
fi

if [[ "$MODE" == "scan" || "$MODE" == "sync" ]]; then
  curl -fsS -X POST \
    -H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/skills/scan-projects" \
    -d '{}' >/dev/null
  echo "✅ Scanned project workspaces and refreshed company-local research-center skills."
fi

if [[ "$MODE" == "scan" ]]; then
  exit 0
fi

PAPERCLIP_API_URL="$PAPERCLIP_API_URL" \
PAPERCLIP_COMPANY_ID="$PAPERCLIP_COMPANY_ID" \
PAPERCLIP_API_TOKEN="$PAPERCLIP_API_TOKEN" \
PAPERCLIP_API_KEY="$PAPERCLIP_API_TOKEN" \
PAPERCLIP_SKILL_BINDINGS_FILE="$RESEARCH_BINDINGS_FILE" \
bash "$GENERIC_SYNC_SCRIPT" "$([[ "$MODE" == "status" ]] && echo status || echo sync)"
