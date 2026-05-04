#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_PATH="${ROOT_DIR}/shared/tools/paperclip-local-env.sh"

fail() {
  echo "paperclip-local-env.smoke: $*" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  if [[ "$haystack" != *"$needle"* ]]; then
    fail "expected output to contain: $needle"
  fi
}

make_temp_home() {
  mktemp -d "${TMPDIR:-/tmp}/paperclip-local-env-smoke.XXXXXX"
}

test_falls_back_to_context_profile_when_instance_env_missing() {
  local temp_home output
  temp_home="$(make_temp_home)"
  mkdir -p "${temp_home}/.paperclip"
  cat > "${temp_home}/.paperclip/context.json" <<'EOF'
{
  "version": 1,
  "currentProfile": "default",
  "profiles": {
    "default": {
      "apiBase": "http://example-remote:3100",
      "companyId": "company-from-context"
    }
  }
}
EOF

  output="$(HOME="${temp_home}" "${SCRIPT_PATH}" --base)"
  assert_contains "$output" "export PAPERCLIP_API_URL='http://example-remote:3100'"
  assert_contains "$output" "export PAPERCLIP_COMPANY_ID='company-from-context'"

  rm -rf "${temp_home}"
}

test_instance_env_overrides_context_profile() {
  local temp_home output
  temp_home="$(make_temp_home)"
  mkdir -p "${temp_home}/.paperclip/instances/default"
  cat > "${temp_home}/.paperclip/instances/default/.env" <<'EOF'
PAPERCLIP_API_URL='http://instance-env:3100'
PAPERCLIP_COMPANY_ID='company-from-env'
EOF
  mkdir -p "${temp_home}/.paperclip"
  cat > "${temp_home}/.paperclip/context.json" <<'EOF'
{
  "version": 1,
  "currentProfile": "default",
  "profiles": {
    "default": {
      "apiBase": "http://context-should-not-win:3100",
      "companyId": "context-should-not-win"
    }
  }
}
EOF

  output="$(HOME="${temp_home}" "${SCRIPT_PATH}" --base)"
  assert_contains "$output" "export PAPERCLIP_API_URL='http://instance-env:3100'"
  assert_contains "$output" "export PAPERCLIP_COMPANY_ID='company-from-env'"

  rm -rf "${temp_home}"
}

test_defaults_remain_when_no_env_or_context_exists() {
  local temp_home output
  temp_home="$(make_temp_home)"
  mkdir -p "${temp_home}/.paperclip"

  output="$(HOME="${temp_home}" "${SCRIPT_PATH}" --base)"
  assert_contains "$output" "export PAPERCLIP_API_URL='http://127.0.0.1:3100'"
  assert_contains "$output" "export PAPERCLIP_COMPANY_ID='be191a6e-7447-4821-a93d-9114214c4a64'"

  rm -rf "${temp_home}"
}

test_falls_back_to_context_profile_when_instance_env_missing
test_instance_env_overrides_context_profile
test_defaults_remain_when_no_env_or_context_exists

echo "paperclip-local-env smoke passed"
