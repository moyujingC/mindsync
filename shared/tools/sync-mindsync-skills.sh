#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESEARCH_SYNC_SCRIPT="$REPO_ROOT/shared/tools/sync-paperclip-research-center-skills.sh"
GETNOTE_SYNC_SCRIPT="$REPO_ROOT/shared/tools/getnote-setup.sh"
MODE="${1:-sync}"

usage() {
  cat <<EOF
Usage: $0 {status|sync}

Modes:
  status  Show both research-center skill mapping status and Get笔记 runtime status
  sync    Refresh research-center repo skills and Get笔记 skill bindings for Paperclip agents

Required env:
  PAPERCLIP_API_URL
  PAPERCLIP_COMPANY_ID
  PAPERCLIP_API_TOKEN (or PAPERCLIP_API_KEY)
EOF
}

if [[ "$MODE" != "status" && "$MODE" != "sync" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$RESEARCH_SYNC_SCRIPT" ]]; then
  echo "❌ Error: missing research-center sync script at $RESEARCH_SYNC_SCRIPT" >&2
  exit 1
fi

if [[ ! -f "$GETNOTE_SYNC_SCRIPT" ]]; then
  echo "❌ Error: missing getnote sync script at $GETNOTE_SYNC_SCRIPT" >&2
  exit 1
fi

if [[ "$MODE" == "status" ]]; then
  echo "== Research-center skills =="
  bash "$RESEARCH_SYNC_SCRIPT" status
  echo ""
  echo "== Get笔记 =="
  bash "$GETNOTE_SYNC_SCRIPT" status
  exit 0
fi

echo "== Research-center skills =="
bash "$RESEARCH_SYNC_SCRIPT" sync
echo ""
echo "== Get笔记 =="
bash "$GETNOTE_SYNC_SCRIPT" sync-paperclip
