#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST_SOURCE="${ROOT_DIR}/shared/tools/paperclip-local-executor.launchd.plist"
PLIST_TARGET="${HOME}/Library/LaunchAgents/com.moyujing.paperclip-local-executor.plist"
LOG_DIR="${HOME}/.paperclip-local-executor/logs"

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

mkdir -p "${HOME}/Library/LaunchAgents" "${LOG_DIR}"

case "$command" in
  install)
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
