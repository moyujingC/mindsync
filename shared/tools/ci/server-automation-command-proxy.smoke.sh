#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

bash -n "$REPO_ROOT/shared/tools/ci/server-automation-command-proxy.sh"
printf 'server-automation-command-proxy smoke ok\n'
