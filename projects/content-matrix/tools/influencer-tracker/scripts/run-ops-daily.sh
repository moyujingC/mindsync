#!/bin/sh
set -eu

ROOT="/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker"
cd "$ROOT"

/usr/bin/env node src/cli/ops-daily.mjs --feishu config/feishu.local.json --pause-source >> logs/ops-daily.log 2>&1
