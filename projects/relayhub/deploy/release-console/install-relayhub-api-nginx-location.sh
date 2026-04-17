#!/usr/bin/env bash
set -euo pipefail

NGINX_SITE=${NGINX_SITE:-/etc/nginx/sites-available/ai-mandala}
UPSTREAM_BASE_URL=${UPSTREAM_BASE_URL:-}

if [ -z "$UPSTREAM_BASE_URL" ]; then
  echo "UPSTREAM_BASE_URL is required, for example: https://readonly.example.internal" >&2
  exit 1
fi

UPSTREAM_BASE_URL=${UPSTREAM_BASE_URL%/}
BACKUP_PATH="${NGINX_SITE}.relayhub-api-backup-$(date +%Y%m%d-%H%M%S)"

sudo cp "$NGINX_SITE" "$BACKUP_PATH"

python3 - "$NGINX_SITE" "$UPSTREAM_BASE_URL" <<'PY' > /tmp/relayhub-api-nginx-site
from pathlib import Path
import sys

site_path = Path(sys.argv[1])
upstream = sys.argv[2]
text = site_path.read_text()

block = f"""
    location = /relayhub-api {{
        return 301 /relayhub-api/;
    }}

    location /relayhub-api/ {{
        proxy_pass {upstream}/;
        proxy_http_version 1.1;
        proxy_set_header Host $proxy_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
"""

if "location /relayhub-api/" not in text:
    marker = "    location / {\n"
    if marker not in text:
        raise SystemExit("Could not find primary web.jingshu.cc location marker")
    text = text.replace(marker, block + "\n" + marker, 1)

print(text, end="")
PY

sudo cp /tmp/relayhub-api-nginx-site "$NGINX_SITE"
sudo nginx -t
sudo systemctl reload nginx

echo "RelayHub API nginx location installed"
echo "backup=$BACKUP_PATH"
