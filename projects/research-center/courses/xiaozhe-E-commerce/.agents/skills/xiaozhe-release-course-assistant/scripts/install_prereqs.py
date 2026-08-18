#!/usr/bin/env python3
"""Plan or install base environment dependencies for the XiaoZhe release package."""

from __future__ import annotations

import argparse
import platform
import re
import shutil
import subprocess
from dataclasses import dataclass


@dataclass(frozen=True)
class Target:
    name: str
    note: str
    mac_brew_packages: tuple[str, ...] = ()
    mac_brew_casks: tuple[str, ...] = ()
    windows_winget_ids: tuple[str, ...] = ()
    linux_hint: str = ""


TARGETS: dict[str, Target] = {
    "docker": Target(
        name="docker",
        note="需要 Docker 和 Docker Compose；桌面版安装后还需要手动打开一次，并等待 Docker Engine 启动。",
        mac_brew_casks=("docker",),
        windows_winget_ids=("Docker.DockerDesktop",),
        linux_hint="按发行版安装 Docker Engine 和 Docker Compose plugin，安装后将当前用户加入 docker 组并重新登录。",
    ),
    "python": Target(
        name="python",
        note="需要 Python 3.13+；不要使用系统自带的旧 Python。",
        mac_brew_packages=("python@3.13",),
        windows_winget_ids=("Python.Python.3.13",),
        linux_hint="安装 Python 3.13+。如果发行版仓库没有 3.13，请使用 pyenv 或发行版官方 backports/第三方源。",
    ),
    "node": Target(
        name="node",
        note="调试后台需要 Node.js 20.19+ 或 22.12+，并需要 npm。",
        mac_brew_packages=("node@22",),
        windows_winget_ids=("OpenJS.NodeJS.LTS",),
        linux_hint="安装 Node.js 22 LTS 或满足要求的 20.x 版本；优先使用 NodeSource、nvm、fnm 或发行版新版仓库。",
    ),
    "java": Target(
        name="java",
        note="可选：仅源码级本地验证需要 Java 17+；release 启动的电商后端使用 Docker 容器内 Java。",
        mac_brew_packages=("openjdk@17",),
        windows_winget_ids=("EclipseAdoptium.Temurin.17.JDK",),
        linux_hint="可选安装 OpenJDK 17+。仅在本地源码构建或测试电商后端时需要。",
    ),
    "maven": Target(
        name="maven",
        note="可选：仅源码级本地构建/测试需要 Maven；release 启动由 Dockerfile 在容器内构建。",
        mac_brew_packages=("maven",),
        windows_winget_ids=("Apache.Maven",),
        linux_hint="可选安装 Maven。仅在本地源码构建或测试电商后端时需要。",
    ),
}

DEFAULT_TARGETS = ("docker", "node", "python")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Actually run supported install commands. Omit for dry-run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview install commands without executing them. This is the default.",
    )
    parser.add_argument(
        "--only",
        nargs="+",
        choices=sorted(TARGETS),
        default=sorted(DEFAULT_TARGETS),
        help="Install/check only selected targets. Defaults to learner startup tools; add java/maven only for source-level local validation.",
    )
    parser.add_argument(
        "--platform",
        choices=("auto", "macos", "windows", "linux"),
        default="auto",
        help="Override platform planning for dry-run validation. Defaults to the current OS.",
    )
    parser.add_argument(
        "--assume-missing",
        action="store_true",
        help="Plan as if selected targets are missing. Useful for validating platform-specific dry-run output.",
    )
    return parser.parse_args()


def run_command(command: list[str]) -> tuple[bool, str]:
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=8)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False, ""
    output = result.stdout.strip().splitlines()
    return result.returncode == 0, output[0] if output else ""


def parse_version(text: str) -> tuple[int, ...] | None:
    match = re.search(r"(\d+)\.(\d+)(?:\.(\d+))?", text)
    if not match:
        return None
    return tuple(int(part) for part in match.groups(default="0"))


def version_at_least(text: str, minimum: tuple[int, ...]) -> bool:
    version = parse_version(text)
    return bool(version and version >= minimum)


def node_version_ok(text: str) -> bool:
    version = parse_version(text)
    return bool(version and (version >= (22, 12, 0) or version[0] == 20 and version >= (20, 19, 0)))


def command_ok(command: list[str]) -> bool:
    ok, _out = run_command(command)
    return ok


def python_ok() -> bool:
    candidates = (
        ["python3.13", "--version"],
        ["py", "-3.13", "--version"],
        ["python3", "--version"],
        ["python", "--version"],
    )
    for command in candidates:
        ok, out = run_command(command)
        if ok and version_at_least(out, (3, 13, 0)):
            return True
    return False


def target_missing(target: Target) -> bool:
    if target.name == "docker":
        return not (command_ok(["docker", "--version"]) and command_ok(["docker", "compose", "version"]))
    if target.name == "python":
        return not python_ok()
    if target.name == "node":
        node_ok, node_out = run_command(["node", "--version"])
        return not (node_ok and node_version_ok(node_out) and command_ok(["npm", "--version"]))
    if target.name == "java":
        ok, out = run_command(["java", "-version"])
        return not (ok and version_at_least(out, (17, 0, 0)))
    if target.name == "maven":
        return not command_ok(["mvn", "--version"])
    return True


def platform_key(override: str) -> str:
    if override != "auto":
        return override
    system = platform.system()
    if system == "Darwin":
        return "macos"
    if system == "Windows":
        return "windows"
    if system == "Linux":
        return "linux"
    return system.lower() or "unknown"


def run(command: list[str], execute: bool) -> int:
    printable = " ".join(command)
    if not execute:
        print(f"[DRY-RUN] {printable}")
        return 0
    print(f"[RUN] {printable}")
    return subprocess.run(command).returncode


def print_linux_hints(missing: list[Target]) -> None:
    print("\n## Linux 安装建议")
    print("- Linux 发行版差异较大，本脚本默认只输出安全的手动步骤，不自动改系统源。")
    for target in missing:
        print(f"- {target.name}: {target.linux_hint}")
    print("\n常见路径：")
    print("- Ubuntu/Debian: 先按 Docker 官方文档安装 Docker Engine + compose plugin；Python 3.13 可用 pyenv 或发行版 backports；Node.js 建议用 NodeSource/nvm/fnm。")
    print("- Fedora/RHEL: 使用 dnf 安装 Docker/Moby、Python/Node 对应新版包，或按 Docker/Node 官方文档配置仓库。")
    print("- Arch: 通常可用 pacman 安装 docker、docker-compose、python、nodejs、npm。")
    print("- 安装 Docker 后运行 `docker --version` 和 `docker compose version` 验证。")


def install_macos(missing: list[Target], execute: bool) -> int:
    brew = shutil.which("brew")
    if not brew:
        print("\n[MANUAL] 未检测到 Homebrew。请先安装 Homebrew，再重新运行本脚本。")
        print('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
        return 1 if execute else 0

    packages: list[str] = []
    casks: list[str] = []
    for target in missing:
        packages.extend(target.mac_brew_packages)
        casks.extend(target.mac_brew_casks)

    exit_code = 0
    if packages:
        exit_code = run([brew, "install", *sorted(set(packages))], execute) or exit_code
    if casks:
        exit_code = run([brew, "install", "--cask", *sorted(set(casks))], execute) or exit_code
    return exit_code


def install_windows(missing: list[Target], execute: bool) -> int:
    winget = shutil.which("winget")
    if not winget and execute:
        print("\n[MANUAL] 未检测到 winget。请用 Microsoft Store / 官方安装包安装缺失工具。")
        for target in missing:
            ids = ", ".join(target.windows_winget_ids) or "无 winget 包"
            print(f"- {target.name}: {target.note} 推荐 winget id: {ids}")
        return 1

    exit_code = 0
    for target in missing:
        for package_id in target.windows_winget_ids:
            command = [winget or "winget", "install", "--id", package_id, "-e"]
            exit_code = run(command, execute) or exit_code
    return exit_code


def main() -> int:
    args = parse_args()
    if args.yes and args.assume_missing:
        print("[ERROR] --assume-missing 只能用于 dry-run 验证，不能和 --yes 一起使用。")
        return 2

    key = platform_key(args.platform)
    selected = [TARGETS[name] for name in args.only]
    missing = selected if args.assume_missing else [target for target in selected if target_missing(target)]

    print("# 小哲电商课程基础环境安装计划")
    print(f"- 平台: {key}")
    print(f"- 模式: {'执行安装' if args.yes else 'dry-run 预览'}")
    print("- 默认范围: release 启动所需工具；Java/Maven 仅在显式 --only java maven 时处理。")

    if not missing:
        print("[OK] 选择的基础环境工具都已可用。")
        return 0

    print("\n## 缺失或不可用")
    for target in missing:
        print(f"- {target.name}: {target.note}")

    if key == "macos":
        exit_code = install_macos(missing, args.yes)
    elif key == "windows":
        exit_code = install_windows(missing, args.yes)
    elif key == "linux":
        print_linux_hints(missing)
        exit_code = 1 if args.yes else 0
    else:
        print(f"\n[MANUAL] 暂不识别平台 {key}，请按工具官方文档安装缺失项。")
        exit_code = 1 if args.yes else 0

    print("\n## 安装后动作")
    print("- 重新打开终端或刷新 shell PATH。")
    print("- 如果安装了 Docker Desktop 或 Docker Engine，请启动它并等待 Engine 可用。")
    print("- 重新运行 `scripts/preflight.py <release-root>`。")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
