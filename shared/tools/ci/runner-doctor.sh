#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
RUNNER_SERVICE_NAME="${RUNNER_SERVICE_NAME:-mindsync-ci-runner.service}"
HEARTBEAT_SERVICE_NAME="${HEARTBEAT_SERVICE_NAME:-paperclip-heartbeat.service}"
HEARTBEAT_TIMER_NAME="${HEARTBEAT_TIMER_NAME:-paperclip-heartbeat.timer}"
RUNNER_NAME="${RUNNER_HEARTBEAT_RUNNER_NAME:-mindsync-ci}"
EXPECT_LABELS="${RUNNER_HEARTBEAT_EXPECT_LABELS:-self-hosted,linux,mindsync-ci,aimandala}"
WORKFLOW_FILE="${RUNNER_HEARTBEAT_WORKFLOW_FILE:-aimandala-ci.yml}"
BRANCH="${RUNNER_HEARTBEAT_BRANCH:-main}"
ENV_FILE="${RUNNER_DOCTOR_ENV_FILE:-}"
STRICT_MODE=0
JSON_ONLY=0

usage() {
  cat <<'EOF'
Usage:
  shared/tools/ci/runner-doctor.sh [--strict] [--json-only] [--env-file <path>]

Environment:
  GITHUB_REPOSITORY
  GITHUB_TOKEN
  RUNNER_HEARTBEAT_RUNNER_NAME
  RUNNER_HEARTBEAT_EXPECT_LABELS
  RUNNER_HEARTBEAT_WORKFLOW_FILE
  RUNNER_HEARTBEAT_BRANCH
  RUNNER_DOCTOR_ENV_FILE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT_MODE=1
      shift
      ;;
    --json-only)
      JSON_ONLY=1
      shift
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      if [[ -z "$ENV_FILE" ]]; then
        echo "--env-file requires a path" >&2
        usage >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -r "$ENV_FILE" ]]; then
    echo "env file is not readable: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [[ -z "${GITHUB_REPOSITORY:-}" || -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_REPOSITORY and GITHUB_TOKEN are required" >&2
  exit 1
fi

print_systemd_status() {
  local unit="$1"
  if command -v systemctl >/dev/null 2>&1; then
    echo "## ${unit}"
    systemctl status "$unit" --no-pager || true
    echo
  fi
}

if [[ "$JSON_ONLY" != "1" ]]; then
  echo "# Runner Doctor"
  echo
  print_systemd_status "$RUNNER_SERVICE_NAME"
  print_systemd_status "$HEARTBEAT_TIMER_NAME"
  print_systemd_status "$HEARTBEAT_SERVICE_NAME"

  echo "## Git Baseline"
  git -C "$REPO_ROOT" rev-parse --short HEAD || true
  git -C "$REPO_ROOT" branch --show-current || true
  git -C "$REPO_ROOT" status --short || true
  echo
  echo "## GitHub / Workflow Diagnosis"
fi

set +e
node "$REPO_ROOT/shared/tools/ci/check-runner-heartbeat.mjs" \
  --mode doctor \
  --print-json 1 \
  --repository "$GITHUB_REPOSITORY" \
  --github-token "$GITHUB_TOKEN" \
  --workflow-file "$WORKFLOW_FILE" \
  --branch "$BRANCH" \
  --runner-name "$RUNNER_NAME" \
  --expect-labels "$EXPECT_LABELS"
exit_code=$?
set -e
if [[ "$STRICT_MODE" == "1" ]]; then
  exit "$exit_code"
fi
exit 0
