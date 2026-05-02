#!/usr/bin/env bash
set -euo pipefail

relayhub_require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Missing required command: ${cmd}" >&2
    exit 1
  }
}

relayhub_fetch_entry_binding_json() {
  local base_url="$1"
  local entry_id="$2"
  local internal_token="${3:-${RELAYHUB_INTERNAL_TOKEN:-}}"

  if [[ -z "${internal_token}" ]]; then
    echo "RelayHub internal token missing. Set RELAYHUB_INTERNAL_TOKEN." >&2
    exit 1
  fi

  curl -fsS \
    -H "content-type: application/json" \
    -H "x-relayhub-internal-token: ${internal_token}" \
    "${base_url}/internal/resolve-entry-binding" \
    -d "{\"entryId\":\"${entry_id}\"}"
}

relayhub_export_entry_binding_env() {
  local payload="$1"

  RESOLVED_MODEL_ID="$(printf '%s' "${payload}" | jq -r '.resolvedModel.id')"
  RESOLVED_BASE_URL="$(printf '%s' "${payload}" | jq -r '.resolvedModel.baseUrl')"
  RESOLVED_MODEL="$(printf '%s' "${payload}" | jq -r '.resolvedModel.modelId')"
  RESOLVED_REASONING_EFFORT="$(printf '%s' "${payload}" | jq -r '.resolvedModel.reasoningEffort // empty')"
  RESOLVED_API_KEY="$(printf '%s' "${payload}" | jq -r '.resolvedModel.apiKey // empty')"
  RESOLVED_HAS_STORED_API_KEY="$(printf '%s' "${payload}" | jq -r '.resolvedModel.hasStoredApiKey')"

  export RESOLVED_MODEL_ID RESOLVED_BASE_URL RESOLVED_MODEL RESOLVED_REASONING_EFFORT RESOLVED_API_KEY RESOLVED_HAS_STORED_API_KEY
}

relayhub_assert_api_key_present() {
  local entry_id="$1"
  local model_id="$2"
  local api_key="$3"

  if [[ -n "${api_key}" ]]; then
    return
  fi

  echo "RelayHub entry ${entry_id} resolved model ${model_id}, but no API key is stored. Sync aborted and target files were not updated." >&2
  exit 1
}
