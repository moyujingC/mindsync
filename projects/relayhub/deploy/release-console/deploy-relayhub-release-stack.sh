#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=${REPO_ROOT:-/opt/aimandala-release/worktrees/relayhub-dev-deploy}
SOURCE_REPO=${SOURCE_REPO:-/opt/aimandala-release/app/mindsync}
REMOTE_NAME=${REMOTE_NAME:-origin}
BRANCH_NAME=${BRANCH_NAME:-relayhub/dev}
WORKTREE_PARENT=${WORKTREE_PARENT:-/opt/aimandala-release/worktrees}
WORKTREE_DIR=${WORKTREE_DIR:-$REPO_ROOT}
SKIP_GIT_SYNC=${SKIP_GIT_SYNC:-0}

CONSOLE_DIR=${CONSOLE_DIR:-$WORKTREE_DIR/projects/relayhub/console}
CONTROL_PLANE_DIR=${CONTROL_PLANE_DIR:-$WORKTREE_DIR/projects/relayhub/control-plane}
DEV_RELAY_DIR=${DEV_RELAY_DIR:-$WORKTREE_DIR/projects/relayhub/dev-relay}

PUBLISH_DIR=${PUBLISH_DIR:-/var/www/relayhub.jingshu.cc}
BACKUP_DIR=${BACKUP_DIR:-/var/www/relayhub.jingshu.cc.previous}
CONTROL_PLANE_DATA_DIR=${CONTROL_PLANE_DATA_DIR:-/var/lib/relayhub/control-plane}

CONTROL_PLANE_PORT=${CONTROL_PLANE_PORT:-4318}
DEV_RELAY_PORT=${DEV_RELAY_PORT:-4319}

install_node_deps() {
  local dir="$1"
  if [[ -f "$dir/package-lock.json" ]]; then
    npm --prefix "$dir" ci
  else
    npm --prefix "$dir" install
  fi
}

ensure_remote_branch_fetch() {
  local repo_dir="$1"
  local refspec="+refs/heads/$BRANCH_NAME:refs/remotes/$REMOTE_NAME/$BRANCH_NAME"
  if ! git -C "$repo_dir" config --get-all "remote.$REMOTE_NAME.fetch" | grep -Fqx "$refspec"; then
    git -C "$repo_dir" config --add "remote.$REMOTE_NAME.fetch" "$refspec"
  fi
}

echo "[relayhub-release] source repo: $SOURCE_REPO"
echo "[relayhub-release] worktree dir: $WORKTREE_DIR"
echo "[relayhub-release] branch: $BRANCH_NAME"
echo "[relayhub-release] skip git sync: $SKIP_GIT_SYNC"

if [[ "$SKIP_GIT_SYNC" != "1" ]]; then
  if [[ ! -d "$SOURCE_REPO/.git" && ! -f "$SOURCE_REPO/.git" ]]; then
    echo "source repo not found: $SOURCE_REPO" >&2
    exit 1
  fi

  mkdir -p "$WORKTREE_PARENT"
  ensure_remote_branch_fetch "$SOURCE_REPO"

  if [[ ! -d "$WORKTREE_DIR" ]]; then
    git -C "$SOURCE_REPO" fetch "$REMOTE_NAME" "refs/heads/$BRANCH_NAME:refs/remotes/$REMOTE_NAME/$BRANCH_NAME"
    git -C "$SOURCE_REPO" worktree add "$WORKTREE_DIR" "$REMOTE_NAME/$BRANCH_NAME"
  else
    ensure_remote_branch_fetch "$WORKTREE_DIR"
    git -C "$WORKTREE_DIR" fetch "$REMOTE_NAME" "refs/heads/$BRANCH_NAME:refs/remotes/$REMOTE_NAME/$BRANCH_NAME"
    git -C "$WORKTREE_DIR" checkout "$BRANCH_NAME"
    git -C "$WORKTREE_DIR" reset --hard "$REMOTE_NAME/$BRANCH_NAME"
  fi
elif [[ ! -d "$WORKTREE_DIR" ]]; then
  echo "worktree dir not found while SKIP_GIT_SYNC=1: $WORKTREE_DIR" >&2
  exit 1
fi

echo "[relayhub-release] install npm deps"
install_node_deps "$CONSOLE_DIR"
install_node_deps "$CONTROL_PLANE_DIR"
install_node_deps "$DEV_RELAY_DIR"

echo "[relayhub-release] build relayhub console trial"
(
  cd "$CONSOLE_DIR"
  RELAYHUB_CONSOLE_BASE_PATH=/ \
  RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane \
  RELAYHUB_DEV_RELAY_BASE_URL=/claude \
  RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch \
  RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api \
  RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models \
  npm run build:trial
)

echo "[relayhub-release] publish console"
sudo REPO_ROOT="$WORKTREE_DIR" \
  CONSOLE_DIR="$CONSOLE_DIR" \
  DIST_DIR="$CONSOLE_DIR/dist" \
  PUBLISH_DIR="$PUBLISH_DIR" \
  BACKUP_DIR="$BACKUP_DIR" \
  bash "$WORKTREE_DIR/projects/relayhub/deploy/release-console/deploy-relayhub-console-trial.sh"

echo "[relayhub-release] install control-plane service"
sudo REPO_ROOT="$WORKTREE_DIR" \
  WORKING_DIRECTORY="$CONTROL_PLANE_DIR" \
  PORT="$CONTROL_PLANE_PORT" \
  DATA_DIR="$CONTROL_PLANE_DATA_DIR" \
  bash "$WORKTREE_DIR/projects/relayhub/deploy/release-console/install-relayhub-control-plane-service.sh"

echo "[relayhub-release] install dev-relay service"
sudo REPO_ROOT="$WORKTREE_DIR" \
  WORKING_DIRECTORY="$DEV_RELAY_DIR" \
  PORT="$DEV_RELAY_PORT" \
  DATA_DIR="$CONTROL_PLANE_DATA_DIR" \
  bash "$WORKTREE_DIR/projects/relayhub/deploy/release-console/install-relayhub-dev-relay-service.sh"

echo "[relayhub-release] install nginx locations"
sudo CONTROL_PLANE_PORT="$CONTROL_PLANE_PORT" \
  bash "$WORKTREE_DIR/projects/relayhub/deploy/release-console/install-relayhub-control-plane-nginx-location.sh"
sudo CLAUDE_RELAY_PORT="$DEV_RELAY_PORT" \
  bash "$WORKTREE_DIR/projects/relayhub/deploy/release-console/install-relayhub-claude-nginx-location.sh"

echo "[relayhub-release] health checks"
curl -fsS "http://127.0.0.1:${CONTROL_PLANE_PORT}/health"
curl -fsS "http://127.0.0.1:${DEV_RELAY_PORT}/health"
curl -kfsS "https://relayhub.jingshu.cc/api/control-plane/health"
curl -kfsS "https://relayhub.jingshu.cc/claude/health"

echo "[relayhub-release] done"
