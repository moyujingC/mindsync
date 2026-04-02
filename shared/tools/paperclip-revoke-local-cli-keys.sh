#!/usr/bin/env bash
set -euo pipefail

API_URL="${PAPERCLIP_API_URL:-http://127.0.0.1:3100}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-e53a86d4-299d-4a9c-8db5-6e82c77b76c8}"

usage() {
  cat <<'EOF'
Usage:
  /Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-revoke-local-cli-keys.sh <agent-id> [keep-count]

Examples:
  /Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-revoke-local-cli-keys.sh 1aa4c541-2aff-4d9f-8021-858363857325
  /Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-revoke-local-cli-keys.sh 1aa4c541-2aff-4d9f-8021-858363857325 1

Notes:
  - Only keys named `local-cli` are touched.
  - `keep-count` defaults to 1, meaning keep the newest local-cli key.
  - Set `keep-count` to 0 to revoke all local-cli keys for that agent.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "" ]]; then
  usage
  exit 0
fi

AGENT_ID="$1"
KEEP_COUNT="${2:-1}"

KEYS_JSON="$(curl -sS "${API_URL}/api/agents/${AGENT_ID}/keys?companyId=${COMPANY_ID}")"

KEY_IDS_TO_REVOKE="$(
  KEYS_JSON_PAYLOAD="$KEYS_JSON" python3 - "$KEEP_COUNT" <<'PY'
import json
import os
import sys

keep = int(sys.argv[1])
data = json.loads(os.environ["KEYS_JSON_PAYLOAD"])
items = [x for x in data if x.get("name") == "local-cli" and x.get("revokedAt") is None]
items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
for item in items[keep:]:
    print(item["id"])
PY
)"

if [[ -z "$KEY_IDS_TO_REVOKE" ]]; then
  echo "No local-cli keys to revoke for ${AGENT_ID}."
  exit 0
fi

while IFS= read -r key_id; do
  [[ -z "$key_id" ]] && continue
  curl -sS -X DELETE "${API_URL}/api/agents/${AGENT_ID}/keys/${key_id}?companyId=${COMPANY_ID}" >/dev/null
  echo "Revoked ${key_id}"
done <<< "$KEY_IDS_TO_REVOKE"
