#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  ensure-python-ci-venv.sh <requirements-file> [extra-pip-package ...]

Creates or reuses a persistent CI virtualenv keyed by:
  - requirements file contents
  - python executable path
  - extra pip packages

Writes venv_dir=<path> to GITHUB_OUTPUT when available.
EOF
  exit 0
fi

REQUIREMENTS_FILE="$1"
shift || true
EXTRA_PACKAGES=("$@")

if [[ ! -f "$REQUIREMENTS_FILE" ]]; then
  echo "requirements file not found: $REQUIREMENTS_FILE" >&2
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_ROOT="${MINDSYNC_CI_VENV_ROOT:-$HOME/.cache/mindsync-ci/python}"
PIP_CACHE_DIR="${PIP_CACHE_DIR:-$HOME/.cache/pip}"

mkdir -p "$VENV_ROOT" "$PIP_CACHE_DIR"

HASH_INPUT_FILE="$(mktemp)"
cleanup() {
  rm -f "$HASH_INPUT_FILE"
}
trap cleanup EXIT

cat "$REQUIREMENTS_FILE" > "$HASH_INPUT_FILE"
{
  printf '\npython=%s\n' "$("$PYTHON_BIN" -c 'import sys; print(sys.executable)')"
  printf 'extra=%s\n' "${EXTRA_PACKAGES[*]:-}"
} >> "$HASH_INPUT_FILE"

if command -v sha256sum >/dev/null 2>&1; then
  ENV_HASH="$(sha256sum "$HASH_INPUT_FILE" | awk '{print substr($1, 1, 16)}')"
else
  ENV_HASH="$(shasum -a 256 "$HASH_INPUT_FILE" | awk '{print substr($1, 1, 16)}')"
fi

REQ_BASENAME="$(basename "$REQUIREMENTS_FILE" .txt)"
VENV_DIR="$VENV_ROOT/${REQ_BASENAME}-${ENV_HASH}"
READY_FILE="$VENV_DIR/.ready"

if [[ -f "$READY_FILE" && -x "$VENV_DIR/bin/python" ]]; then
  echo "[ci] Reusing Python CI venv: $VENV_DIR"
else
  TMP_VENV_DIR="${VENV_DIR}.tmp.$$"
  rm -rf "$TMP_VENV_DIR"
  echo "[ci] Creating Python CI venv: $VENV_DIR"
  "$PYTHON_BIN" -m venv "$TMP_VENV_DIR"
  export PIP_DISABLE_PIP_VERSION_CHECK=1
  export PIP_CACHE_DIR
  "$TMP_VENV_DIR/bin/python" -m pip install --upgrade pip setuptools wheel
  "$TMP_VENV_DIR/bin/python" -m pip install -r "$REQUIREMENTS_FILE" "${EXTRA_PACKAGES[@]}"
  touch "$TMP_VENV_DIR/.ready"
  rm -rf "$VENV_DIR"
  mv "$TMP_VENV_DIR" "$VENV_DIR"
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'venv_dir=%s\n' "$VENV_DIR" >> "$GITHUB_OUTPUT"
fi

echo "[ci] Python CI venv ready: $VENV_DIR"
