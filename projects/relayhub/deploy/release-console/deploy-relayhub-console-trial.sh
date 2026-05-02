#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=${REPO_ROOT:-/opt/aimandala-release/app/mindsync}
FRONTEND_DIR=${FRONTEND_DIR:-"$REPO_ROOT/projects/relayhub/frontend"}
CONSOLE_DIR=${CONSOLE_DIR:-"$REPO_ROOT/projects/relayhub/console"}
DIST_DIR=${DIST_DIR:-"$FRONTEND_DIR/out"}
PUBLISH_DIR=${PUBLISH_DIR:-/var/www/web.jingshu.cc/relayhub}
BACKUP_DIR=${BACKUP_DIR:-/var/www/web.jingshu.cc/relayhub.previous}

if [ ! -d "$DIST_DIR" ]; then
  echo "dist directory not found: $DIST_DIR" >&2
  exit 1
fi

mkdir -p "$(dirname "$PUBLISH_DIR")"
rm -rf "$BACKUP_DIR"

if [ -d "$PUBLISH_DIR" ]; then
  mv "$PUBLISH_DIR" "$BACKUP_DIR"
fi

mkdir -p "$PUBLISH_DIR"
rsync -av --delete "$DIST_DIR"/ "$PUBLISH_DIR"/

echo "RelayHub console trial deployed to $PUBLISH_DIR"
