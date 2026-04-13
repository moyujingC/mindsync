#!/bin/zsh

set -euo pipefail

BACKEND_PORT="8100"
FRONTEND_PORT="4174"

function stop_port() {
  local port="$1"
  local name="$2"
  local pids

  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)
  if [ -z "$pids" ]; then
    echo "$name 未运行: $port"
    return 0
  fi

  echo "$name 停止中: $port ($pids)"
  kill $pids || true
}

stop_port "$BACKEND_PORT" "后端"
stop_port "$FRONTEND_PORT" "前端"

sleep 1

remaining_backend=$(lsof -tiTCP:"$BACKEND_PORT" -sTCP:LISTEN || true)
remaining_frontend=$(lsof -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN || true)

if [ -n "$remaining_backend" ]; then
  echo "后端仍在运行，强制停止: $remaining_backend"
  kill -9 $remaining_backend || true
fi

if [ -n "$remaining_frontend" ]; then
  echo "前端仍在运行，强制停止: $remaining_frontend"
  kill -9 $remaining_frontend || true
fi

echo "MindSync AIMandala 本地服务已停止。"
