#!/bin/bash
# sync-paperclip-project-workspaces.sh - 对齐 mindsync 注册表与 Paperclip 运行时项目工作区路径

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY_PATH="$ROOT_DIR/company/项目注册表.yaml"
PAPERCLIP_CONFIG_PATH="$ROOT_DIR/.paperclip.yaml"
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://127.0.0.1:3100}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:-}"
MINDSYNC_RUNTIME_ROOT="${MINDSYNC_RUNTIME_ROOT:-$ROOT_DIR}"
MODE="${1:-status}"

if [[ ! -f "$REGISTRY_PATH" ]]; then
  echo "❌ 未找到项目注册表: $REGISTRY_PATH"
  exit 1
fi

if [[ ! -f "$PAPERCLIP_CONFIG_PATH" ]]; then
  echo "❌ 未找到 Paperclip 配置: $PAPERCLIP_CONFIG_PATH"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ 需要 python3 才能运行该脚本"
  exit 1
fi

company_id="$(
  python3 - "$PAPERCLIP_CONFIG_PATH" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
company_id = ""
for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if line.startswith("id:") and company_id == "":
        company_id = line.split(":", 1)[1].strip().strip('"').strip("'")
        break
print(company_id)
PY
)"

if [[ -z "$company_id" ]]; then
  echo "❌ 无法从 $PAPERCLIP_CONFIG_PATH 解析 company.id"
  exit 1
fi

python3 - "$MODE" "$REGISTRY_PATH" "$PAPERCLIP_API_URL" "$company_id" "$PAPERCLIP_API_KEY" "$MINDSYNC_RUNTIME_ROOT" <<'PY'
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

mode, registry_path, api_url, company_id, api_key, runtime_root = sys.argv[1:7]

if mode not in {"status", "sync", "json"}:
    print("Usage: sync-paperclip-project-workspaces.sh {status|sync|json}", file=sys.stderr)
    sys.exit(1)


def request_json(url: str, method: str = "GET", payload: dict | None = None) -> object:
    data = None
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def parse_registry(path: Path) -> list[dict[str, str]]:
    objects: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    in_objects = False
    in_purpose = False

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if stripped == "objects:":
            in_objects = True
            continue

        if not in_objects:
            continue

        if line.startswith("  - "):
            if current:
                objects.append(current)
            current = {}
            in_purpose = False
            remainder = line[4:]
            if ":" in remainder:
                key, value = remainder.split(":", 1)
                current[key.strip()] = value.strip().strip('"')
            continue

        if current is None:
            continue

        if stripped.startswith("purpose:"):
            in_purpose = True
            continue

        if in_purpose:
            if line.startswith("      - ") or line.startswith("        "):
                continue
            in_purpose = False

        if not line.startswith("    "):
            continue

        if ":" not in stripped:
            continue

        key, value = stripped.split(":", 1)
        current[key.strip()] = value.strip().strip('"')

    if current:
        objects.append(current)

    result: list[dict[str, str]] = []
    for item in objects:
        if item.get("runtime_directory"):
            result.append(
                {
                    "name": item.get("name", ""),
                    "kind": item.get("kind", ""),
                    "runtime_directory": item.get("runtime_directory", ""),
                }
            )
    return result


registry = parse_registry(Path(registry_path))
registry_by_name = {item["name"]: item for item in registry}

try:
    runtime_projects = request_json(f"{api_url}/api/companies/{company_id}/projects")
except urllib.error.URLError as exc:
    print(f"❌ 无法连接 Paperclip API: {exc}", file=sys.stderr)
    sys.exit(1)

if not isinstance(runtime_projects, list):
    print("❌ Paperclip API 返回的项目列表格式异常", file=sys.stderr)
    sys.exit(1)

drifts: list[dict[str, str]] = []
missing_in_registry: list[str] = []
missing_in_runtime = sorted(set(registry_by_name) - {item.get("name", "") for item in runtime_projects})

for runtime_project in runtime_projects:
    name = runtime_project.get("name", "")
    primary = runtime_project.get("primaryWorkspace") or {}
    current_cwd = primary.get("cwd")
    registry_item = registry_by_name.get(name)
    if not registry_item:
      missing_in_registry.append(name)
      continue
    expected_cwd = str((Path(runtime_root) / registry_item["runtime_directory"]).resolve())
    if current_cwd != expected_cwd:
        drifts.append(
            {
                "name": name,
                "project_id": runtime_project.get("id", ""),
                "workspace_id": primary.get("id", ""),
                "current_cwd": current_cwd or "",
                "expected_cwd": expected_cwd,
            }
        )

report = {
    "company_id": company_id,
    "runtime_root": runtime_root,
    "registry_count": len(registry),
    "runtime_count": len(runtime_projects),
    "missing_in_runtime": missing_in_runtime,
    "missing_in_registry": missing_in_registry,
    "drifts": drifts,
}

if mode == "json":
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0)

print("Paperclip 项目工作区对账")
print(f"- 公司 ID: {company_id}")
print(f"- 运行时根目录: {runtime_root}")
print(f"- 注册表项目数: {len(registry)}")
print(f"- 运行时项目数: {len(runtime_projects)}")

if missing_in_runtime:
    print("- 仅存在于注册表的项目: " + "、".join(missing_in_runtime))

if missing_in_registry:
    print("- 仅存在于运行时的项目: " + "、".join(missing_in_registry))

if not drifts:
    print("- 工作区路径状态: 已对齐")
else:
    print("- 工作区路径漂移:")
    for drift in drifts:
        print(f"  - {drift['name']}:")
        print(f"    当前: {drift['current_cwd'] or '<空>'}")
        print(f"    期望: {drift['expected_cwd']}")

if mode == "status":
    sys.exit(0)

if not drifts:
    print("无需同步。")
    sys.exit(0)

for drift in drifts:
    if not drift["workspace_id"]:
        print(f"⚠️ 跳过 {drift['name']}：运行时没有 primary workspace")
        continue
    payload = {"cwd": drift["expected_cwd"]}
    updated = request_json(
        f"{api_url}/api/projects/{drift['project_id']}/workspaces/{drift['workspace_id']}",
        method="PATCH",
        payload=payload,
    )
    print(f"✅ 已同步 {drift['name']} -> {updated.get('cwd', drift['expected_cwd'])}")
PY
