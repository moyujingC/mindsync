#!/usr/bin/env bash
set -euo pipefail

NGINX_SITE=${NGINX_SITE:-/etc/nginx/sites-available/ai-mandala}
CONTROL_PLANE_PORT=${CONTROL_PLANE_PORT:-4318}
BACKUP_PATH="${NGINX_SITE}.relayhub-control-plane-backup-$(date +%Y%m%d-%H%M%S)"

sudo cp "$NGINX_SITE" "$BACKUP_PATH"

python3 - "$NGINX_SITE" "$CONTROL_PLANE_PORT" <<'PY' > /tmp/relayhub-control-plane-nginx-site
from pathlib import Path
import re
import sys

site_path = Path(sys.argv[1])
port = sys.argv[2]
text = site_path.read_text()

block = f"""
    location = /api/control-plane {{
        return 301 /api/control-plane/;
    }}

    location /api/control-plane/ {{
        rewrite ^/api/control-plane/?(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
"""

pattern = re.compile(
    r"\n    location = /api/control-plane \{.*?\n    \}\n\n"
    r"    location /api/control-plane/ \{.*?\n    \}\n",
    re.DOTALL,
)

if pattern.search(text):
    text = pattern.sub(block + "\n", text, count=1)
else:
    marker = "    location = /api {\n"
    if marker in text:
      text = text.replace(marker, block + "\n" + marker, 1)
    else:
      marker = "    location / {\n"
      if marker not in text:
          raise SystemExit("Could not find relayhub server location marker")
      text = text.replace(marker, block + "\n" + marker, 1)

print(text, end="")
PY

sudo cp /tmp/relayhub-control-plane-nginx-site "$NGINX_SITE"
sudo nginx -t
sudo systemctl reload nginx

echo "RelayHub control-plane nginx location installed"
echo "backup=$BACKUP_PATH"
