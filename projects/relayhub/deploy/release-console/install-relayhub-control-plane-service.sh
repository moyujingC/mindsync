#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=${REPO_ROOT:-/opt/aimandala-release/app/mindsync}
SERVICE_NAME=${SERVICE_NAME:-relayhub-control-plane}
SERVICE_TEMPLATE=${SERVICE_TEMPLATE:-$REPO_ROOT/projects/relayhub/deploy/release-console/relayhub-control-plane.service.example}
SERVICE_TARGET=${SERVICE_TARGET:-/etc/systemd/system/${SERVICE_NAME}.service}
ENV_TARGET=${ENV_TARGET:-/etc/default/${SERVICE_NAME}}
PORT=${PORT:-4318}
DATA_DIR=${DATA_DIR:-/var/lib/relayhub/control-plane}

if [ ! -f "$SERVICE_TEMPLATE" ]; then
  echo "service template not found: $SERVICE_TEMPLATE" >&2
  exit 1
fi

sudo mkdir -p "$(dirname "$ENV_TARGET")" "$DATA_DIR" /var/log/relayhub
sudo chown -R www-data:www-data "$DATA_DIR" /var/log/relayhub

if [ ! -f "$ENV_TARGET" ]; then
  cat <<EOF | sudo tee "$ENV_TARGET" >/dev/null
PORT=$PORT
RELAYHUB_CONTROL_PLANE_DATA_DIR=$DATA_DIR
NODE_ENV=production
EOF
else
  echo "env file already exists: $ENV_TARGET"
fi

sudo cp "$SERVICE_TEMPLATE" "$SERVICE_TARGET"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl --no-pager --full status "$SERVICE_NAME"

echo "RelayHub control-plane service installed"
echo "service=$SERVICE_TARGET"
echo "env=$ENV_TARGET"
echo "data_dir=$DATA_DIR"
