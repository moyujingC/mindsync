#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST_SOURCE="${ROOT_DIR}/shared/tools/paperclip-local-executor.launchd.plist"
PLIST_TARGET="${HOME}/Library/LaunchAgents/com.moyujing.paperclip-local-executor.plist"
LOG_DIR="${HOME}/.paperclip-local-executor/logs"
RUNTIME_ANCHOR_DIR="${HOME}/.mindsync/runtime-anchor"
RUNTIME_MINDSYNC_DIR="${HOME}/.mindsync/runtime/mindsync"

sync_runtime_tools() {
  if [[ ! -d "${RUNTIME_MINDSYNC_DIR}/.git" ]]; then
    echo "⚠️ 未找到 runtime mindsync checkout，跳过脚本同步: ${RUNTIME_MINDSYNC_DIR}" >&2
    return 0
  fi

  mkdir -p "${RUNTIME_MINDSYNC_DIR}/shared"
  rsync -a --delete --exclude '.git/' "${ROOT_DIR}/shared/tools/" "${RUNTIME_MINDSYNC_DIR}/shared/tools/"
}

usage() {
  cat <<'EOF'
Usage:
  shared/tools/install-paperclip-local-executor-launchd.sh install
  shared/tools/install-paperclip-local-executor-launchd.sh unload
  shared/tools/install-paperclip-local-executor-launchd.sh status

Installs the local Mac Paperclip executor LaunchAgent.
EOF
}

command="${1:-}"
if [[ -z "$command" || "$command" == "-h" || "$command" == "--help" ]]; then
  usage
  exit 0
fi

mkdir -p "${HOME}/Library/LaunchAgents" "${LOG_DIR}" "${RUNTIME_ANCHOR_DIR}"

case "$command" in
  install)
    sync_runtime_tools
    cp "${PLIST_SOURCE}" "${PLIST_TARGET}"
    launchctl bootout "gui/$(id -u)" "${PLIST_TARGET}" >/dev/null 2>&1 || true
    launchctl bootstrap "gui/$(id -u)" "${PLIST_TARGET}"
    launchctl enable "gui/$(id -u)/com.moyujing.paperclip-local-executor"
    launchctl kickstart -k "gui/$(id -u)/com.moyujing.paperclip-local-executor"
    echo "Installed com.moyujing.paperclip-local-executor"
    ;;
  unload)
    launchctl bootout "gui/$(id -u)" "${PLIST_TARGET}" >/dev/null 2>&1 || true
    echo "Unloaded com.moyujing.paperclip-local-executor"
    ;;
  status)
    launchctl print "gui/$(id -u)/com.moyujing.paperclip-local-executor"
    ;;
  *)
    echo "Unknown command: ${command}" >&2
    usage >&2
    exit 1
    ;;
esac
