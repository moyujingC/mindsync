#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTROL_PLANE_DIR="$ROOT_DIR/control-plane"
CONSOLE_DIR="$ROOT_DIR/console"
CONTROL_PLANE_PORT="${PORT:-4318}"
STARTED_CONTROL_PLANE=0

if lsof -iTCP:"$CONTROL_PLANE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[relayhub-console] detected existing control-plane on http://127.0.0.1:${CONTROL_PLANE_PORT}, reusing it"
else
  echo "[relayhub-console] starting control-plane on http://127.0.0.1:${CONTROL_PLANE_PORT}"
  (
    cd "$CONTROL_PLANE_DIR"
    PORT="$CONTROL_PLANE_PORT" npm start
  ) &
  CONTROL_PLANE_PID=$!
  STARTED_CONTROL_PLANE=1
fi

cleanup() {
  if [ "$STARTED_CONTROL_PLANE" -eq 1 ]; then
    kill "$CONTROL_PLANE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[relayhub-console] starting interactive console on http://127.0.0.1:5173"
cd "$CONSOLE_DIR"
npm run dev -- --host 127.0.0.1
