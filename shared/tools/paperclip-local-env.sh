#!/usr/bin/env bash
set -euo pipefail

INSTANCE_ENV="${HOME}/.paperclip/instances/default/.env"
CACHE_DIR="${HOME}/.paperclip/instances/default/local-cli-cache"
DEFAULT_API_URL="http://127.0.0.1:3100"
DEFAULT_COMPANY_ID="be191a6e-7447-4821-a93d-9114214c4a64"

usage() {
  cat <<'EOF'
Usage:
  eval "$(/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh --base)"
  eval "$(/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh <agent-ref>)"

Examples:
  eval "$(/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh --base)"
  eval "$(/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh ceo)"
  eval "$(/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh 44c2d2c2-0b24-4e62-8397-b50ac1a72b2f)"

Notes:
  - --base only exports stable instance-level variables.
  - Passing an agent ref reuses a cached local-cli key when possible.
  - The cache is validated against /api/agents/me before reuse when the server is reachable.
  - Task / wake / approval variables are runtime-scoped and are intentionally not hard-coded here.
  - In manual local mode, PAPERCLIP_RUN_ID is only exported when already provided by a real Paperclip run.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -f "$INSTANCE_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$INSTANCE_ENV"
fi

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-$DEFAULT_API_URL}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID:-$DEFAULT_COMPANY_ID}"

mkdir -p "$CACHE_DIR"
chmod 700 "$CACHE_DIR"

print_base_exports() {
  cat <<EOF
export PAPERCLIP_API_URL='${PAPERCLIP_API_URL}'
export PAPERCLIP_COMPANY_ID='${PAPERCLIP_COMPANY_ID}'
export PAPERCLIP_WAKE_REASON='${PAPERCLIP_WAKE_REASON:-manual_local_cli}'
EOF
  if [[ -n "${PAPERCLIP_RUN_ID:-}" ]]; then
    cat <<EOF
export PAPERCLIP_RUN_ID='${PAPERCLIP_RUN_ID}'
EOF
  fi
}

sanitize_ref() {
  printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_'
}

cache_file_for_agent() {
  local ref="$1"
  printf '%s/%s.env\n' "$CACHE_DIR" "$(sanitize_ref "$ref")"
}

print_agent_exports_from_cache() {
  local cache_file="$1"
  # shellcheck disable=SC1090
  source "$cache_file"
  cat <<EOF
export PAPERCLIP_AGENT_ID='${PAPERCLIP_AGENT_ID}'
export PAPERCLIP_API_KEY='${PAPERCLIP_API_KEY}'
EOF
}

cache_is_usable() {
  local cache_file="$1"
  [[ -f "$cache_file" ]] || return 1

  # shellcheck disable=SC1090
  source "$cache_file"

  [[ -n "${PAPERCLIP_AGENT_ID:-}" && -n "${PAPERCLIP_API_KEY:-}" ]] || return 1

  local tmp status body
  tmp="$(mktemp)"
  status="$(
    curl -sS \
      -o "$tmp" \
      -w '%{http_code}' \
      -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
      "${PAPERCLIP_API_URL}/api/agents/me" 2>/dev/null || true
  )"

  if [[ "$status" == "200" ]]; then
    body="$(cat "$tmp")"
    rm -f "$tmp"
    if printf '%s' "$body" | grep -q "\"id\":\"${PAPERCLIP_AGENT_ID}\""; then
      return 0
    fi
    if printf '%s' "$body" | grep -q "\"id\": \"${PAPERCLIP_AGENT_ID}\""; then
      return 0
    fi
    return 1
  fi

  rm -f "$tmp"

  # If the server is temporarily unavailable, prefer reusing the cached key.
  if [[ -z "$status" || "$status" == "000" || "$status" == "5"* ]]; then
    echo "paperclip-local-env: server unreachable, reusing cached local-cli key" >&2
    return 0
  fi

  return 1
}

refresh_agent_cache() {
  local agent_ref="$1"
  local cache_file="$2"
  local exports

  exports="$(
    paperclipai agent local-cli "$agent_ref" \
      --company-id "$PAPERCLIP_COMPANY_ID" \
      --no-install-skills | awk '/^export / { print }'
  )"

  [[ -n "$exports" ]] || {
    echo "paperclip-local-env: failed to generate local-cli exports for ${agent_ref}" >&2
    exit 1
  }

  local agent_id api_key
  agent_id="$(printf '%s\n' "$exports" | sed -n "s/^export PAPERCLIP_AGENT_ID='\([^']*\)'/\1/p" | head -n1)"
  api_key="$(printf '%s\n' "$exports" | sed -n "s/^export PAPERCLIP_API_KEY='\([^']*\)'/\1/p" | head -n1)"

  [[ -n "$agent_id" && -n "$api_key" ]] || {
    echo "paperclip-local-env: missing agent exports in local-cli output for ${agent_ref}" >&2
    exit 1
  }

  cat > "$cache_file" <<EOF
PAPERCLIP_AGENT_ID='${agent_id}'
PAPERCLIP_API_KEY='${api_key}'
EOF
  chmod 600 "$cache_file"
  print_agent_exports_from_cache "$cache_file"
}

if [[ "${1:-}" == "" || "${1:-}" == "--base" ]]; then
  print_base_exports
  exit 0
fi

AGENT_REF="$1"
CACHE_FILE="$(cache_file_for_agent "$AGENT_REF")"

print_base_exports

if cache_is_usable "$CACHE_FILE"; then
  print_agent_exports_from_cache "$CACHE_FILE"
else
  refresh_agent_cache "$AGENT_REF" "$CACHE_FILE"
fi
