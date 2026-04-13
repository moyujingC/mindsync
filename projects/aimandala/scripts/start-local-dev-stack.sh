#!/bin/zsh

set -euo pipefail

WORKSPACE_DIR="/Users/xinran/Downloads/dev/mindsync"
PROJECT_DIR="$WORKSPACE_DIR/projects/aimandala"
BACKEND_DIR="$PROJECT_DIR/toC/app/backend"
FRONTEND_DIR="$PROJECT_DIR/toC/app/frontend"
LOG_DIR="$PROJECT_DIR/.local-dev/logs"
BACKEND_LAUNCHER="$PROJECT_DIR/scripts/start-local-backend.command"
FRONTEND_LAUNCHER="$PROJECT_DIR/scripts/start-local-frontend.command"
BACKEND_PORT="8100"
FRONTEND_PORT="4174"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"

function ensure_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令: $cmd"
    exit 1
  fi
}

function port_is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

function wait_for_port() {
  local port="$1"
  local attempts="${2:-20}"
  local i=0

  while [ "$i" -lt "$attempts" ]; do
    if port_is_listening "$port"; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done

  return 1
}

function open_terminal_script() {
  local script_path="$1"
  open -a Terminal "$script_path"
}

ensure_command python3
ensure_command npm
ensure_command lsof
ensure_command curl
ensure_command open

if [ ! -d "$WORKSPACE_DIR" ]; then
  echo "找不到工作区目录: $WORKSPACE_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "找不到后端目录: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "找不到前端目录: $FRONTEND_DIR"
  exit 1
fi

if [ ! -f "$BACKEND_LAUNCHER" ]; then
  echo "找不到后端启动器: $BACKEND_LAUNCHER"
  exit 1
fi

if [ ! -f "$FRONTEND_LAUNCHER" ]; then
  echo "找不到前端启动器: $FRONTEND_LAUNCHER"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "前端依赖未安装，请先在 $FRONTEND_DIR 执行 npm install"
  exit 1
fi

mkdir -p "$LOG_DIR"

if port_is_listening "$BACKEND_PORT"; then
  echo "后端已在运行，跳过重复启动: $BACKEND_URL"
else
  open_terminal_script "$BACKEND_LAUNCHER"
fi

if port_is_listening "$FRONTEND_PORT"; then
  echo "前端已在运行，跳过重复启动: $FRONTEND_URL"
else
  open_terminal_script "$FRONTEND_LAUNCHER"
fi

if wait_for_port "$BACKEND_PORT" 20; then
  echo "后端已就绪: $BACKEND_URL"
else
  echo "后端启动超时，请查看 Terminal 中的后端窗口"
fi

if wait_for_port "$FRONTEND_PORT" 20; then
  echo "前端已就绪: $FRONTEND_URL"
else
  echo "前端启动超时，请查看 Terminal 中的前端窗口"
fi

open "$FRONTEND_URL" >/dev/null 2>&1 || true

echo "MindSync AIMandala 本地开发环境已发起启动。"
echo "后端: $BACKEND_URL"
echo "前端: $FRONTEND_URL"
echo "如果窗口已经打开，重复双击会自动复用当前端口。"
