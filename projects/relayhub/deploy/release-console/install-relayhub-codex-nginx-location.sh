#!/usr/bin/env bash
set -euo pipefail

NGINX_SITE=${NGINX_SITE:-/etc/nginx/sites-available/ai-mandala}
CODEX_RELAY_PORT=${CODEX_RELAY_PORT:-4319}
BACKUP_PATH="${NGINX_SITE}.relayhub-codex-backup-$(date +%Y%m%d-%H%M%S)"

sudo cp "$NGINX_SITE" "$BACKUP_PATH"

python3 - "$NGINX_SITE" "$CODEX_RELAY_PORT" <<'PY' > /tmp/relayhub-codex-nginx-site
from pathlib import Path
import re
import sys

site_path = Path(sys.argv[1])
port = sys.argv[2]
text = site_path.read_text()

block = f"""
    location = /codex/v1 {{
        return 301 /codex/v1/;
    }}

    location /codex/v1/ {{
        rewrite ^/codex/v1/?(.*)$ /v1/$1 break;
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 600s;
        gzip off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }}
"""

pattern = re.compile(
    r"\n    location = /codex/v1 \{.*?\n    \}\n\n"
    r"    location /codex/v1/ \{.*?\n    \}\n",
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

sudo cp /tmp/relayhub-codex-nginx-site "$NGINX_SITE"
sudo nginx -t
sudo systemctl reload nginx

echo "RelayHub codex nginx location installed"
echo "backup=$BACKUP_PATH"
