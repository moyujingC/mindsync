#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PAPERCLIP_YAML="$REPO_ROOT/.paperclip.yaml"
BINDINGS_FILE="${PAPERCLIP_SKILL_BINDINGS_FILE:-$REPO_ROOT/company/paperclip-agent-skill-bindings.yaml}"
MODE="${1:-status}"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-}"
PAPERCLIP_API_TOKEN="${PAPERCLIP_API_TOKEN:-${PAPERCLIP_API_KEY:-}}"
PAPERCLIP_COMPANY_ID_OVERRIDE="${PAPERCLIP_COMPANY_ID:-}"

usage() {
  cat <<EOF
Usage: $0 {status|sync}

Modes:
  status  Compare the bindings manifest with current Paperclip company skills and agent desiredSkills
  sync    Restore managed agent desiredSkills from the bindings manifest without removing unmanaged skills

Env:
  PAPERCLIP_API_URL            Override API base URL (default from .paperclip.yaml)
  PAPERCLIP_COMPANY_ID         Override company ID (default from .paperclip.yaml)
  PAPERCLIP_API_TOKEN          Optional bearer token for authenticated instances
  PAPERCLIP_API_KEY            Fallback token variable name
  PAPERCLIP_SKILL_BINDINGS_FILE Override the bindings manifest path
EOF
}

if [[ "$MODE" != "status" && "$MODE" != "sync" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$PAPERCLIP_YAML" ]]; then
  echo "❌ Error: .paperclip.yaml not found at $PAPERCLIP_YAML"
  exit 1
fi

if [[ ! -f "$BINDINGS_FILE" ]]; then
  echo "❌ Error: skill bindings file not found at $BINDINGS_FILE"
  exit 1
fi

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "❌ Error: missing required command: ${cmd}" >&2
    exit 1
  }
}

require_cmd ruby
require_cmd python3
require_cmd curl

read_config_value() {
  local key_path="$1"
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0])
    value = ARGV[1].split(".").reduce(data) { |acc, key| acc.is_a?(Hash) ? acc[key] : nil }
    puts value.to_s
  ' "$PAPERCLIP_YAML" "$key_path"
}

normalize_locator() {
  local raw="${1:-}"
  RAW_VALUE="$raw" python3 - <<'PY'
import os
raw = os.environ.get("RAW_VALUE", "").strip()
if not raw:
    print("")
else:
    print(os.path.expandvars(os.path.expanduser(raw)))
PY
}

COMPANY_ID="${PAPERCLIP_COMPANY_ID_OVERRIDE:-$(read_config_value "company.id")}"
HOST="$(read_config_value "company.host")"
PORT="$(read_config_value "company.port")"

if [[ -z "$COMPANY_ID" ]]; then
  echo "❌ Error: failed to read company.id from $PAPERCLIP_YAML"
  exit 1
fi

if [[ -z "$PAPERCLIP_API_URL" ]]; then
  if [[ -z "$HOST" || -z "$PORT" ]]; then
    echo "❌ Error: failed to read company.host / company.port from $PAPERCLIP_YAML"
    exit 1
  fi
  PAPERCLIP_API_URL="http://${HOST}:${PORT}"
fi

AUTH_HEADER_ARGS=()
if [[ -n "$PAPERCLIP_API_TOKEN" ]]; then
  AUTH_HEADER_ARGS=(-H "Authorization: Bearer ${PAPERCLIP_API_TOKEN}")
fi

api_curl() {
  if [[ "${#AUTH_HEADER_ARGS[@]}" -gt 0 ]]; then
    curl -fsS "${AUTH_HEADER_ARGS[@]}" "$@"
    return
  fi
  curl -fsS "$@"
}

api_json_post() {
  local url="$1"
  local payload="$2"
  local args=(-fsS -X POST -H "Content-Type: application/json")
  if [[ "${#AUTH_HEADER_ARGS[@]}" -gt 0 ]]; then
    args+=("${AUTH_HEADER_ARGS[@]}")
  fi
  curl "${args[@]}" "$url" -d "$payload"
}

refresh_runtime_agents() {
  RUNTIME_AGENTS_JSON="$(api_curl "${PAPERCLIP_API_URL}/api/companies/${COMPANY_ID}/agents")"
}

refresh_company_skills() {
  COMPANY_SKILLS_JSON="$(api_curl "${PAPERCLIP_API_URL}/api/companies/${COMPANY_ID}/skills")"
}

runtime_agent_id_by_name() {
  local agent_name="$1"
  AGENT_NAME="$agent_name" RUNTIME_AGENTS_JSON="$RUNTIME_AGENTS_JSON" python3 - <<'PY'
import json
import os

target = os.environ["AGENT_NAME"]
agents = json.loads(os.environ.get("RUNTIME_AGENTS_JSON", "[]"))
for agent in agents:
    if agent.get("name") == target:
        print(agent.get("id", ""))
        break
PY
}

list_agent_bindings() {
  ruby -e '
    require "yaml"
    data = YAML.load_file(ARGV[0]) || {}
    Array(data["bindings"]).each do |binding|
      agent_name = binding["agent_name"].to_s
      Array(binding["desired_skills"]).each do |skill|
        puts [
          agent_name,
          skill["skill_alias"].to_s,
          skill["source_type"].to_s,
          skill["source_locator"].to_s,
          skill["env_patch_required"] ? "true" : "false"
        ].join("\t")
      end
    end
  ' "$BINDINGS_FILE"
}

resolve_skill_result() {
  local alias="$1"
  local source_type="$2"
  local source_locator="$3"
  local normalized_locator
  normalized_locator="$(normalize_locator "$source_locator")"

  SKILL_ALIAS="$alias" \
  SOURCE_TYPE="$source_type" \
  SOURCE_LOCATOR="$normalized_locator" \
  COMPANY_SKILLS_JSON="$COMPANY_SKILLS_JSON" \
  python3 - <<'PY'
import json
import os

alias = os.environ.get("SKILL_ALIAS", "").strip()
source_type = os.environ.get("SOURCE_TYPE", "").strip()
source_locator = os.environ.get("SOURCE_LOCATOR", "").strip()
skills = json.loads(os.environ.get("COMPANY_SKILLS_JSON", "[]"))

def normalize(value: str) -> str:
    return os.path.expandvars(os.path.expanduser((value or "").strip()))

exact_matches = []
for item in skills:
    item_type = (item.get("sourceType") or "").strip()
    item_locator = normalize(item.get("sourceLocator") or "")
    if source_locator and item_locator == source_locator and (not source_type or item_type == source_type):
        exact_matches.append(item)

if len(exact_matches) == 1:
    print("resolved\t%s\t%s\t%s" % (
        exact_matches[0].get("key", ""),
        exact_matches[0].get("name", ""),
        exact_matches[0].get("sourceLocator", ""),
    ))
    raise SystemExit

if len(exact_matches) > 1:
    print("conflict\t%s\tmultiple company skills matched sourceType+sourceLocator" % alias)
    raise SystemExit

if alias:
    alias_matches = []
    lowered = alias.lower()
    for item in skills:
      candidates = [
          (item.get("key") or ""),
          (item.get("name") or ""),
          (item.get("slug") or ""),
      ]
      if any(lowered == value.strip().lower() for value in candidates if value):
          alias_matches.append(item)
    if len(alias_matches) == 1:
        print("resolved\t%s\t%s\t%s" % (
            alias_matches[0].get("key", ""),
            alias_matches[0].get("name", ""),
            alias_matches[0].get("sourceLocator", ""),
        ))
        raise SystemExit
    if len(alias_matches) > 1:
        print("conflict\t%s\tmultiple company skills matched skill_alias" % alias)
        raise SystemExit

print("missing\t%s\tcompany skill not found" % alias)
PY
}

managed_skill_keys() {
  BINDINGS_TSV="$BINDINGS_TSV" COMPANY_SKILLS_JSON="$COMPANY_SKILLS_JSON" python3 - <<'PY'
import json
import os

skills = json.loads(os.environ.get("COMPANY_SKILLS_JSON", "[]"))
lines = [line for line in os.environ.get("BINDINGS_TSV", "").splitlines() if line.strip()]

def normalize(value: str) -> str:
    return os.path.expandvars(os.path.expanduser((value or "").strip()))

keys = set()
for line in lines:
    _agent_name, alias, source_type, source_locator, _env_patch_required = line.split("\t")
    source_locator = normalize(source_locator)
    matched = [
        item.get("key", "")
        for item in skills
        if normalize(item.get("sourceLocator") or "") == source_locator
        and ((not source_type) or (item.get("sourceType") or "") == source_type)
    ]
    keys.update(key for key in matched if key)

print("\n".join(sorted(keys)))
PY
}

current_agent_desired_skills() {
  local agent_id="$1"
  local payload
  if ! payload="$(api_curl "${PAPERCLIP_API_URL}/api/agents/${agent_id}/skills" 2>/dev/null)"; then
    return 1
  fi
  AGENT_SKILLS_JSON="$payload" python3 - <<'PY'
import json
import os

payload = json.loads(os.environ.get("AGENT_SKILLS_JSON", "{}"))
values = payload.get("desiredSkills") or []
print("\n".join(str(value) for value in values if value))
PY
}

import_company_skill() {
  local alias="$1"
  local source_type="$2"
  local source_locator="$3"
  local normalized_locator
  normalized_locator="$(normalize_locator "$source_locator")"

  if [[ "$source_type" != "local_path" ]]; then
    echo "  ⚠️  ${alias}: source_type=${source_type} 暂不支持自动导入，只能做对账" >&2
    return 1
  fi

  if [[ ! -d "$normalized_locator" ]]; then
    echo "  ⚠️  ${alias}: source path missing at ${normalized_locator}" >&2
    return 1
  fi

  api_json_post \
    "${PAPERCLIP_API_URL}/api/companies/${COMPANY_ID}/skills/import" \
    "{\"source\":\"${normalized_locator}\"}" >/dev/null
  return 0
}

sync_agent_desired_skills() {
  local agent_id="$1"
  local merged_keys="$2"
  local payload_json
  payload_json="$(MERGED_KEYS="$merged_keys" python3 - <<'PY'
import json
import os

values = [line.strip() for line in os.environ.get("MERGED_KEYS", "").splitlines() if line.strip()]
print(json.dumps({"desiredSkills": values}, ensure_ascii=False, separators=(",", ":")))
PY
)"

  api_json_post \
    "${PAPERCLIP_API_URL}/api/agents/${agent_id}/skills/sync" \
    "$payload_json" >/dev/null
}

print_header() {
  echo "Paperclip Agent Skill 对账"
  echo "=========================="
  echo "Repo root:      $REPO_ROOT"
  echo "Bindings file:  $BINDINGS_FILE"
  echo "API URL:        $PAPERCLIP_API_URL"
  echo "Company ID:     $COMPANY_ID"
  echo ""
}

BINDINGS_TSV="$(list_agent_bindings)"

if ! refresh_runtime_agents; then
  echo "❌ Error: failed to fetch runtime agents from ${PAPERCLIP_API_URL}" >&2
  echo "   If the remote instance requires auth, set PAPERCLIP_API_TOKEN first." >&2
  exit 1
fi

if ! refresh_company_skills; then
  echo "❌ Error: failed to fetch company skills from ${PAPERCLIP_API_URL}" >&2
  echo "   If the remote instance requires auth, set PAPERCLIP_API_TOKEN first." >&2
  exit 1
fi

GLOBAL_MANAGED_KEYS="$(managed_skill_keys)"
sync_failures=0
status_issues=0

print_header

UNIQUE_AGENT_NAMES="$(
  BINDINGS_TSV="$BINDINGS_TSV" python3 - <<'PY'
import os

seen = set()
for line in os.environ.get("BINDINGS_TSV", "").splitlines():
    if not line.strip():
        continue
    agent_name = line.split("\t", 1)[0].strip()
    if agent_name and agent_name not in seen:
        print(agent_name)
        seen.add(agent_name)
PY
)"

while IFS= read -r agent_name; do
  [[ -z "$agent_name" ]] && continue

  runtime_id="$(runtime_agent_id_by_name "$agent_name")"
  if [[ -z "$runtime_id" ]]; then
    echo "⚠️  ${agent_name}: runtime agent missing"
    status_issues=$((status_issues + 1))
    continue
  fi

  target_keys=()
  unresolved_count=0

  while IFS=$'\t' read -r binding_agent alias source_type source_locator env_patch_required; do
    [[ "$binding_agent" == "$agent_name" ]] || continue
    result="$(resolve_skill_result "$alias" "$source_type" "$source_locator")"
    status="$(printf '%s' "$result" | awk -F '\t' 'NR==1 { print $1 }')"
    if [[ "$status" == "resolved" ]]; then
      key="$(printf '%s' "$result" | awk -F '\t' 'NR==1 { print $2 }')"
      resolved_name="$(printf '%s' "$result" | awk -F '\t' 'NR==1 { print $3 }')"
      target_keys+=("$key")
      echo "• ${agent_name} -> ${alias}: resolved to ${key} (${resolved_name})"
      continue
    fi

    unresolved_count=$((unresolved_count + 1))
    status_issues=$((status_issues + 1))

    if [[ "$status" == "conflict" ]]; then
      message="$(printf '%s' "$result" | awk -F '\t' 'NR==1 { print $3 }')"
      echo "  ⚠️  ${agent_name} -> ${alias}: conflict (${message})"
      continue
    fi

    echo "  ⚠️  ${agent_name} -> ${alias}: missing company skill"

    if [[ "$MODE" == "sync" ]]; then
      if import_company_skill "$alias" "$source_type" "$source_locator"; then
        refresh_company_skills
        GLOBAL_MANAGED_KEYS="$(managed_skill_keys)"
        retry_result="$(resolve_skill_result "$alias" "$source_type" "$source_locator")"
        retry_status="$(printf '%s' "$retry_result" | awk -F '\t' 'NR==1 { print $1 }')"
        if [[ "$retry_status" == "resolved" ]]; then
          key="$(printf '%s' "$retry_result" | awk -F '\t' 'NR==1 { print $2 }')"
          resolved_name="$(printf '%s' "$retry_result" | awk -F '\t' 'NR==1 { print $3 }')"
          target_keys+=("$key")
          echo "  ✅ ${agent_name} -> ${alias}: imported and resolved to ${key} (${resolved_name})"
          unresolved_count=$((unresolved_count - 1))
        else
          echo "  ❌ ${agent_name} -> ${alias}: import attempted but still unresolved"
          sync_failures=$((sync_failures + 1))
        fi
      else
        sync_failures=$((sync_failures + 1))
      fi
    fi
  done <<<"$BINDINGS_TSV"

  if ! current_keys="$(current_agent_desired_skills "$runtime_id")"; then
    echo "  status: permission_denied"
    echo "  detail: token can read company agents/skills but cannot inspect or sync agent desiredSkills"
    echo ""
    sync_failures=$((sync_failures + 1))
    status_issues=$((status_issues + 1))
    continue
  fi
  managed_keys_for_agent="$(
    TARGET_KEYS="$(printf '%s\n' "${target_keys[@]:-}")" \
    CURRENT_KEYS="$current_keys" \
    GLOBAL_MANAGED_KEYS="$GLOBAL_MANAGED_KEYS" \
    python3 - <<'PY'
import os

target = {line.strip() for line in os.environ.get("TARGET_KEYS", "").splitlines() if line.strip()}
current = [line.strip() for line in os.environ.get("CURRENT_KEYS", "").splitlines() if line.strip()]
managed = {line.strip() for line in os.environ.get("GLOBAL_MANAGED_KEYS", "").splitlines() if line.strip()}

wrong = [key for key in current if key in managed and key not in target]
missing = [key for key in target if key not in current]
unchanged = [key for key in current if key in managed and key in target]

print("wrong=" + ",".join(wrong))
print("missing=" + ",".join(missing))
print("unchanged=" + ",".join(unchanged))
PY
  )"

  wrong_keys="$(printf '%s\n' "$managed_keys_for_agent" | sed -n 's/^wrong=//p')"
  missing_keys="$(printf '%s\n' "$managed_keys_for_agent" | sed -n 's/^missing=//p')"
  current_display="$(CURRENT_KEYS="$current_keys" python3 - <<'PY'
import os

values = [line.strip() for line in os.environ.get("CURRENT_KEYS", "").splitlines() if line.strip()]
print(",".join(values) if values else "none")
PY
  )"

  echo "  current desiredSkills: ${current_display}"

  if [[ "$unresolved_count" -eq 0 && -z "$wrong_keys" && -z "$missing_keys" ]]; then
    echo "  status: aligned"
  else
    echo "  status: drift"
    [[ -n "$wrong_keys" ]] && echo "  drift detail: wrong managed keys=${wrong_keys}"
    [[ -n "$missing_keys" ]] && echo "  drift detail: missing managed keys=${missing_keys}"
  fi

  if [[ "$MODE" == "sync" ]]; then
    if [[ "$unresolved_count" -gt 0 ]]; then
      echo "  ❌ skipped sync because some managed skills are unresolved"
      sync_failures=$((sync_failures + 1))
      echo ""
      continue
    fi

    merged_keys="$(
      TARGET_KEYS="$(printf '%s\n' "${target_keys[@]:-}")" \
      CURRENT_KEYS="$current_keys" \
      GLOBAL_MANAGED_KEYS="$GLOBAL_MANAGED_KEYS" \
      python3 - <<'PY'
import os

target = [line.strip() for line in os.environ.get("TARGET_KEYS", "").splitlines() if line.strip()]
current = [line.strip() for line in os.environ.get("CURRENT_KEYS", "").splitlines() if line.strip()]
managed = {line.strip() for line in os.environ.get("GLOBAL_MANAGED_KEYS", "").splitlines() if line.strip()}

merged = []
seen = set()
for key in current:
    if key in managed:
        continue
    if key not in seen:
        merged.append(key)
        seen.add(key)
for key in target:
    if key not in seen:
        merged.append(key)
        seen.add(key)

print("\n".join(merged))
PY
    )"

    if [[ "$(printf '%s\n' "$merged_keys" | paste -sd ',' -)" == "$(printf '%s\n' "$current_keys" | paste -sd ',' -)" ]]; then
      echo "  sync: no-op"
    else
      sync_agent_desired_skills "$runtime_id" "$merged_keys"
      echo "  sync: updated desiredSkills"
    fi
  fi

  echo ""
done <<<"$UNIQUE_AGENT_NAMES"

if [[ "$MODE" == "status" ]]; then
  if [[ "$status_issues" -eq 0 ]]; then
    echo "已对齐：绑定清单与运行时 desiredSkills 一致。"
  else
    echo "发现 ${status_issues} 处 skill 绑定问题。"
  fi
  exit 0
fi

if [[ "$sync_failures" -gt 0 ]]; then
  echo "❌ Sync finished with ${sync_failures} failure(s)."
  exit 1
fi

echo "✅ Sync complete."
