#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTROL_PLANE_DIR="$ROOT_DIR/control-plane"
DEV_RELAY_DIR="$ROOT_DIR/dev-relay"
DATA_DIR="${RELAYHUB_CONTROL_PLANE_DATA_DIR:-$CONTROL_PLANE_DIR/data}"
CONTROL_PLANE_BASE_URL="${RELAYHUB_CONTROL_PLANE_BASE_URL:-https://relayhub.jingshu.cc/api/control-plane}"
DEV_RELAY_BASE_URL="${RELAYHUB_DEV_RELAY_BASE_URL:-https://relayhub.jingshu.cc/claude}"
AITECHFLUX_API_KEY="${AITECHFLUX_API_KEY:-${AITechFlux_API_KEY:-${AITECHEFLUX_API_KEY:-}}}"
AITECHFLUX_FIRST_MODEL="${AITECHFLUX_FIRST_MODEL:-高性能低价模型}"
CONTROL_GROUP_ENTRY_ID="${CONTROL_GROUP_ENTRY_ID:-preset-ppchat-relay}"

if [[ -z "$AITECHFLUX_API_KEY" ]]; then
  echo "AITECHFLUX_API_KEY is required" >&2
  exit 1
fi

echo "[relayhub] data dir: $DATA_DIR"
echo "[relayhub] control-plane: $CONTROL_PLANE_BASE_URL"
echo "[relayhub] dev-relay: $DEV_RELAY_BASE_URL"

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" \
      -H 'content-type: application/json' \
      --data "$body" \
      "$url"
  else
    curl -sS -X "$method" "$url"
  fi
}

echo "[relayhub] health check"
curl -sS "$CONTROL_PLANE_BASE_URL/health" | jq .
curl -sS "$DEV_RELAY_BASE_URL/health" | jq .

echo "[relayhub] patch AITechFlux api key"
curl_json PATCH "$CONTROL_PLANE_BASE_URL/models/preset-aitechflux-relay" "$(jq -n \
  --arg name "AITechFlux 中转" \
  --arg providerLabel "AITechFlux" \
  --arg kind "relay-api" \
  --arg baseUrl "https://aitechflux.com/v1" \
  --arg modelId "claude-sonnet" \
  --arg apiKey "$AITECHFLUX_API_KEY" \
  '{
    name: $name,
    providerLabel: $providerLabel,
    kind: $kind,
    baseUrl: $baseUrl,
    modelId: $modelId,
    apiKey: $apiKey
  }')" | jq .

echo "[relayhub] fetch AITechFlux catalog"
CATALOG_JSON="$(curl -sS "$CONTROL_PLANE_BASE_URL/models/preset-aitechflux-relay/catalog")"
printf '%s\n' "$CATALOG_JSON" | jq .

SELECTED_MODEL="$(
  printf '%s\n' "$CATALOG_JSON" | jq -r --arg preferred "$AITECHFLUX_FIRST_MODEL" '
    if any(.items[]; .id == $preferred) then
      $preferred
    else
      .items[0].id
    end
  '
)"

echo "[relayhub] selected model: $SELECTED_MODEL"

echo "[relayhub] patch selected modelId"
curl_json PATCH "$CONTROL_PLANE_BASE_URL/models/preset-aitechflux-relay" "$(jq -n \
  --arg name "AITechFlux 中转" \
  --arg providerLabel "AITechFlux" \
  --arg kind "relay-api" \
  --arg baseUrl "https://aitechflux.com/v1" \
  --arg modelId "$SELECTED_MODEL" \
  '{
    name: $name,
    providerLabel: $providerLabel,
    kind: $kind,
    baseUrl: $baseUrl,
    modelId: $modelId
  }')" | jq .

echo "[relayhub] test AITechFlux entry"
AIT_TEST_JSON="$(curl_json POST "$CONTROL_PLANE_BASE_URL/models/preset-aitechflux-relay/test")"
printf '%s\n' "$AIT_TEST_JSON" | jq .

AIT_STATUS="$(printf '%s\n' "$AIT_TEST_JSON" | jq -r '.status')"
if [[ "$AIT_STATUS" != "active" ]]; then
  echo "[relayhub] AITechFlux did not become active" >&2
  exit 1
fi

echo "[relayhub] read current task"
TASK_JSON="$(curl -sS "$CONTROL_PLANE_BASE_URL/tasks" | jq -c '.[] | select(.id == "task-claude-code")')"
printf '%s\n' "$TASK_JSON" | jq .

echo "[relayhub] bind task-claude-code -> preset-aitechflux-relay"
curl_json PATCH "$CONTROL_PLANE_BASE_URL/tasks/task-claude-code" "$(printf '%s\n' "$TASK_JSON" | jq -c '.defaultModelEntryId = "preset-aitechflux-relay"')" | jq .

echo "[relayhub] relay request with AITechFlux binding"
AIT_RELAY_JSON="$(curl_json POST "$DEV_RELAY_BASE_URL/v1/messages" "$(jq -n '
  {
    model: "relayhub-task-claude-code",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Reply with exactly: relayhub smoke ok"
          }
        ]
      }
    ]
  }'
)")"
printf '%s\n' "$AIT_RELAY_JSON" | jq .

echo "[relayhub] activate control-group entry if needed"
CONTROL_ENTRY_JSON="$(curl -sS "$CONTROL_PLANE_BASE_URL/models" | jq -c --arg entryId "$CONTROL_GROUP_ENTRY_ID" '.[] | select(.id == $entryId)')"
printf '%s\n' "$CONTROL_ENTRY_JSON" | jq .

CONTROL_ENTRY_STATUS="$(printf '%s\n' "$CONTROL_ENTRY_JSON" | jq -r '.status')"
if [[ "$CONTROL_ENTRY_STATUS" != "active" ]]; then
  curl_json POST "$CONTROL_PLANE_BASE_URL/models/$CONTROL_GROUP_ENTRY_ID/test" | jq .
fi

echo "[relayhub] switch task-claude-code -> $CONTROL_GROUP_ENTRY_ID"
curl_json PATCH "$CONTROL_PLANE_BASE_URL/tasks/task-claude-code" "$(printf '%s\n' "$TASK_JSON" | jq -c --arg entryId "$CONTROL_GROUP_ENTRY_ID" '.defaultModelEntryId = $entryId')" | jq .

echo "[relayhub] relay request after control-group switch"
CONTROL_RELAY_JSON="$(curl_json POST "$DEV_RELAY_BASE_URL/chat/completions" "$(jq -n '
  {
    model: "relayhub-task-claude-code",
    messages: [
      {
        role: "user",
        content: "Say relayhub control switch"
      }
    ]
  }'
)")"
printf '%s\n' "$CONTROL_RELAY_JSON" | jq .

echo "[relayhub] final task state"
curl -sS "$CONTROL_PLANE_BASE_URL/tasks" | jq '.[] | select(.id == "task-claude-code")'

echo "[relayhub] smoke complete"
