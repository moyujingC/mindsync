#!/usr/bin/env python3
"""Run learner environment preflight checks for a XiaoZhe public code root."""

from __future__ import annotations

import argparse
import json
import platform
import re
import shutil
import socket
import subprocess
from pathlib import Path

from check_release_root import agent_versions_root, frontend_root, missing_paths, optional_missing_paths, read_release_version


PLACEHOLDER_VALUES = {
    "",
    "你的模型平台 Key",
    "your-api-key",
    "your_key_here",
    "CHANGE_ME",
    "sk-xxx",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", type=Path, help="Public code root.")
    return parser.parse_args()


def run_command(command: list[str], timeout: int = 8) -> tuple[bool, str]:
    try:
        result = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    except FileNotFoundError:
        return False, "command not found"
    except subprocess.TimeoutExpired:
        return False, "timeout"
    output = result.stdout.strip().splitlines()
    return result.returncode == 0, output[0] if output else ""


def find_python_command() -> tuple[list[str] | None, str]:
    candidates = (
        (["python3.13"], "python3.13"),
        (["py", "-3.13"], "py -3.13"),
        (["python3"], "python3"),
        (["python"], "python"),
    )
    for command, label in candidates:
        executable = shutil.which(command[0])
        if executable:
            return [executable, *command[1:]], label
    return None, ""


def venv_python(root: Path) -> Path:
    if platform.system() == "Windows":
        return root / ".venv" / "Scripts" / "python.exe"
    return root / ".venv" / "bin" / "python"


def parse_version(text: str) -> tuple[int, ...] | None:
    match = re.search(r"(\d+)\.(\d+)(?:\.(\d+))?", text)
    if not match:
        return None
    return tuple(int(part) for part in match.groups(default="0"))


def pinned_requirements(path: Path) -> dict[str, str]:
    """Read the public repository's tested direct-dependency reference set."""
    if not path.exists():
        return {}
    pins: dict[str, str] = {}
    pattern = re.compile(r"^\s*([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?==([^\s;#]+)")
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        match = pattern.match(line)
        if match:
            pins[match.group(1)] = match.group(2)
    return pins


def installed_versions(python: Path, names: list[str]) -> tuple[bool, dict[str, str | None], str]:
    """Query distribution versions from the exact interpreter used by the course."""
    script = (
        "import importlib.metadata as metadata, json\n"
        f"names = {json.dumps(names)}\n"
        "versions = {}\n"
        "for name in names:\n"
        "    try:\n"
        "        versions[name] = metadata.version(name)\n"
        "    except metadata.PackageNotFoundError:\n"
        "        versions[name] = None\n"
        "print(json.dumps(versions))\n"
    )
    ok, output = run_command([str(python), "-c", script])
    if not ok:
        return False, {}, output
    try:
        parsed = json.loads(output)
    except json.JSONDecodeError:
        return False, {}, output
    return True, parsed, ""


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def read_env_value(path: Path, key: str) -> str | None:
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        name, sep, value = line.partition("=")
        if sep and name.strip() == key:
            return value.strip().strip("\"'")
    return None


def add(result: list[tuple[str, str, str]], status: str, item: str, detail: str) -> None:
    result.append((status, item, detail))


def main() -> int:
    args = parse_args()
    root = args.root.expanduser().resolve()
    results: list[tuple[str, str, str]] = []
    python_compatibility_hints: list[str] = []
    python_fault_signals: list[str] = []
    python_blockers: list[str] = []
    python_runtime_checks_ran = False

    missing = missing_paths(root)
    if missing:
        add(results, "FAIL", "course code root", "缺少 " + ", ".join(missing) + "；请提供云效/Codeup 课程代码仓根目录。")
    else:
        add(results, "OK", "course code root", f"{root} (云效/Codeup 代码仓)")
        release_version, release_version_error = read_release_version(root)
        add(
            results,
            "OK" if release_version else "WARN",
            "release version",
            release_version or f"未知；{release_version_error}",
        )
        optional_missing = optional_missing_paths(root)
        if optional_missing:
            add(
                results,
                "INFO",
                "course markdown",
                "未随包提供 " + ", ".join(optional_missing) + "；课程导读使用小哲课程助手内置精炼课程地图。",
            )
        runbook_paths = [root / "doc" / "运行手册.md", root / "docs" / "运行手册.md"]
        if not any(path.exists() for path in runbook_paths):
            add(
                results,
                "INFO",
                "runbook",
                "当前代码仓未找到 doc/运行手册.md；可能是旧版或不完整副本，请先更新云效/Codeup 代码仓。",
            )

    ok, out = run_command(["docker", "--version"])
    add(results, "OK" if ok else "FAIL", "Docker", out if ok else "未找到 Docker；请安装并启动 Docker Desktop 或 Docker Engine。")

    ok, out = run_command(["docker", "compose", "version"])
    add(results, "OK" if ok else "FAIL", "Docker Compose", out if ok else "Docker Compose 不可用；请确认 Docker Compose plugin 已安装。")

    python_cmd, python_label = find_python_command()
    python_available = False
    python_status = "FAIL"
    python_detail = "未找到常见 Python 命令"
    if python_cmd:
        ok, out = run_command([*python_cmd, "--version"])
        version = parse_version(out)
        if ok and version:
            python_available = True
            python_status = "OK" if (3, 13, 0) <= version < (3, 14, 0) else "WARN"
            python_detail = f"{out} ({python_label})"
            if version < (3, 13, 0):
                hint = "系统 Python 低于课程验证参考 3.13.x；版本差异本身不是故障。"
                python_detail += f"；兼容性提示：{hint}"
                python_compatibility_hints.append(hint)
            elif version >= (3, 14, 0):
                hint = "系统 Python 高于课程验证参考 3.13.x；版本差异本身不是故障。"
                python_detail += f"；兼容性提示：{hint}"
                python_compatibility_hints.append(hint)
        else:
            python_detail = f"{out or python_label}；命令存在但解释器无法正常运行或无法识别版本。"

    venv_py = venv_python(root)
    venv_available = False
    venv_result: tuple[str, str] | None = None
    if venv_py.exists():
        ok, out = run_command([str(venv_py), "--version"])
        version = parse_version(out)
        if ok and version:
            venv_available = True
            status = "OK" if (3, 13, 0) <= version < (3, 14, 0) else "WARN"
            detail = f"{venv_py.relative_to(root)} ({out})"
            if version < (3, 13, 0):
                hint = "仓库 .venv 低于课程验证参考 3.13.x；若出现语法或导入错误再做环境对照。"
                detail += f"；兼容性提示：{hint}"
                python_compatibility_hints.append(hint)
            elif version >= (3, 14, 0):
                hint = "仓库 .venv 高于课程验证参考 3.13.x；若出现 wheel 安装错误再做环境对照。"
                detail += f"；兼容性提示：{hint}"
                python_compatibility_hints.append(hint)
            venv_result = (status, detail)
        else:
            detail = f"{venv_py.relative_to(root)} 的解释器无法正常运行；当前 Agent 启动路径不可用。"
            venv_result = ("FAIL", detail)
            signal = f"虚拟环境解释器无法运行：{out or venv_py}"
            python_fault_signals.append(signal)
            python_blockers.append(signal)
    elif python_available:
        hint = "未发现仓库根目录 .venv；可继续使用已确认的隔离环境，也可按课程参考方式创建 .venv。"
        python_compatibility_hints.append(hint)
        venv_result = ("WARN", hint)
    else:
        detail = "未发现仓库根目录 .venv，且没有可用的系统 Python；当前无法启动 Agent。"
        venv_result = ("FAIL", detail)
        signal = "未找到可用的系统 Python 或仓库 .venv 解释器"
        python_fault_signals.append(signal)
        python_blockers.append(signal)

    if not python_available:
        if venv_available:
            hint = "未找到可用的全局 Python 命令，但仓库 .venv 解释器可用。"
            python_status = "WARN"
            python_detail += f"；兼容性提示：{hint}"
            python_compatibility_hints.append(hint)
        else:
            python_status = "FAIL"
            python_detail += "；仓库 .venv 也不可用，当前无法启动 Agent。"
            if not python_blockers:
                signal = "系统 Python 命令存在但解释器无法正常运行，且仓库 .venv 不可用"
                python_fault_signals.append(signal)
                python_blockers.append(signal)

    add(results, python_status, "Python", python_detail)
    if venv_result:
        add(results, venv_result[0], "Python virtualenv", venv_result[1])

    requirements_file = root / "requirements.txt"
    if venv_available and requirements_file.exists():
        python_runtime_checks_ran = True
        pip_env_ok, pip_env_out = run_command([str(venv_py), "-m", "pip", "--version"])
        add(
            results,
            "OK" if pip_env_ok else "WARN",
            "pip environment",
            pip_env_out if pip_env_out else "无法确认当前 .venv 对应的 pip 路径。",
        )
        if not pip_env_ok:
            python_fault_signals.append(f"pip 无法通过当前解释器运行：{pip_env_out or 'no output'}")

        expected = pinned_requirements(requirements_file)
        versions_ok, actual, version_error = installed_versions(venv_py, list(expected))
        if not versions_ok:
            add(results, "WARN", "Python package versions", f"无法读取 .venv 已安装版本：{version_error or 'unknown error'}；仅作提示。")
            python_fault_signals.append(f"无法读取已安装包版本：{version_error or 'unknown error'}")
        else:
            mismatches = [
                f"{name} 参考 {expected_version}，当前 {actual.get(name) or '未安装'}"
                for name, expected_version in expected.items()
                if actual.get(name) != expected_version
            ]
            if mismatches:
                preview = "；".join(mismatches[:5])
                if len(mismatches) > 5:
                    preview += f"；另有 {len(mismatches) - 5} 项"
                add(results, "WARN", "Python package versions", preview + "；版本差异是排查线索，不单独作为阻塞项。")
                python_compatibility_hints.append(preview + "；包版本差异不单独作为阻塞项。")
            else:
                add(results, "OK", "Python package versions", f"{len(expected)} 个直接依赖与课程参考 requirements.txt 一致。")

        pip_ok, pip_out = run_command([str(venv_py), "-m", "pip", "check"], timeout=20)
        add(
            results,
            "OK" if pip_ok else "WARN",
            "pip dependency consistency",
            (pip_out or "依赖关系正常。")
            if pip_ok
            else f"实际故障信号（依赖一致性）：{pip_out or 'pip check 执行失败。'}",
        )
        if not pip_ok:
            python_fault_signals.append(f"pip check：{pip_out or '执行失败'}")

        import_script = (
            "try:\n"
            "    from langchain.agents import create_agent\n"
            "    from langgraph.graph import StateGraph\n"
            "    from pydantic import BaseModel\n"
            "    from pydantic_settings import BaseSettings\n"
            "except Exception as exc:\n"
            "    print(f'{type(exc).__name__}: {exc}')\n"
            "    raise SystemExit(1)\n"
            "print('create_agent / StateGraph / Pydantic v2 imports OK')\n"
        )
        imports_ok, imports_out = run_command([str(venv_py), "-c", import_script], timeout=20)
        add(
            results,
            "OK" if imports_ok else "WARN",
            "course framework imports",
            imports_out if imports_ok else f"实际故障信号（关键导入）：{imports_out or '课程框架导入检查没有输出。'}",
        )
        if not imports_ok:
            python_fault_signals.append(f"关键框架导入：{imports_out or '检查失败'}")

    ok, out = run_command(["node", "--version"])
    node_version = parse_version(out)
    if ok and node_version and (node_version >= (22, 12, 0) or node_version >= (20, 19, 0) and node_version[0] == 20):
        add(results, "OK", "Node.js", out)
    else:
        add(results, "FAIL", "Node.js", f"{out or '未找到 node'}；调试后台需要 Node.js 20.19+ 或 22.12+。")

    ok, out = run_command(["npm", "--version"])
    add(results, "OK" if ok else "FAIL", "npm", out if ok else "未找到 npm；请安装 Node.js/npm。")

    add(
        results,
        "OK",
        "Java/Maven requirement",
        "release 启动不要求宿主机 Java/Maven；电商后端由 Docker Compose 在容器内构建并运行。",
    )

    for port, label in [(8081, "电商后端"), (8000, "Agent 后端"), (5173, "调试后台")]:
        if port_open(port):
            add(results, "WARN", f"端口 {port}", f"{label} 端口已有监听；如果要重启或换课，先确认是不是旧进程。")
        else:
            add(results, "OK", f"端口 {port}", "当前空闲。")

    versions_root = agent_versions_root(root)
    course_env = versions_root / "course.env"
    course_env_example = versions_root / "course.env.example"
    if not course_env.exists():
        add(results, "FAIL", "course.env", f"缺少 {course_env.relative_to(root)}；从 {course_env_example.relative_to(root)} 复制后填写 AGENT_OPENAI_API_KEY。")
    else:
        key = read_env_value(course_env, "AGENT_OPENAI_API_KEY")
        key_lower = key.lower() if key is not None else ""
        if key in PLACEHOLDER_VALUES or key is None or "你的" in key or "placeholder" in key_lower or key_lower.startswith("sk-test"):
            add(results, "FAIL", "AGENT_OPENAI_API_KEY", "course.env 里的 Key 仍是占位；请填写真实模型平台 Key。")
        else:
            add(results, "OK", "AGENT_OPENAI_API_KEY", "已填写，注意不要截图或分享。")

    frontend_package = frontend_root(root) / "package.json"
    add(
        results,
        "OK" if frontend_package.exists() else "FAIL",
        "frontend package",
        str(frontend_package.relative_to(root)) if frontend_package.exists() else "缺少 frontend/package.json；课程代码仓不完整。",
    )

    print("# 小哲电商课程代码仓环境预检")
    exit_code = 0
    for status, item, detail in results:
        print(f"- [{status}] {item}: {detail}")
        if status == "FAIL":
            exit_code = 1
    failed_items = {item for status, item, _detail in results if status == "FAIL"}
    warning_items = {item for status, item, _detail in results if status == "WARN"}
    if exit_code == 0:
        print("\n[OK] 预检没有发现阻塞项。WARN 只提供排查提示，不会因版本差异直接阻止运行。")
    else:
        print("\n[FIX] FAIL 表示当前启动路径缺少必要条件；WARN 只提供排查提示，不会因版本差异直接阻止运行。")
        if "AGENT_OPENAI_API_KEY" in failed_items or "course.env" in failed_items:
            print("[FIX] 模型 Key 缺失时，不要自动切到离线模式；请先指导用户完成真实 Key 配置：")
            print("      1. 到用户选择的 OpenAI-compatible 模型平台获取 API Key。")
            print(f"      2. 如果缺少 course.env，先复制：cp {course_env_example.relative_to(root)} {course_env.relative_to(root)}")
            print(f"      3. 编辑 {course_env.relative_to(root)}，把 AGENT_OPENAI_API_KEY 替换为真实 Key。")
            print("      4. 不要把 Key 粘贴到聊天、截图、Git 提交或公开日志里。")
            print("      5. 重新运行本预检，通过后再启动 Agent。")
            print("[FIX] 只有用户明确要求离线/无模型/禁用 LLM 时，才可用 AGENT_COURSE_DISABLE_LLM=1 启动。")
        launcher = "py -3.13" if platform.system() == "Windows" else "python3"
        print("[FIX] 如果 FAIL 项是 Docker/Node/npm 等基础环境缺失，先运行：")
        print(f"      {launcher} scripts/install_prereqs.py --dry-run")
        print(f"      确认计划无误并征得用户同意后，才可运行：{launcher} scripts/install_prereqs.py --yes")
        print("[FIX] macOS 使用 Homebrew 计划；Windows 使用 winget 计划；Linux 输出发行版相关手动步骤。")
        print("[FIX] 宿主机 Java/Maven 不是 release 启动必需项；只有做源码级本地验证时才单独检查或安装。")

    python_advisory_items = {
        "Python",
        "Python virtualenv",
        "pip environment",
        "Python package versions",
        "pip dependency consistency",
        "course framework imports",
    }
    if warning_items & python_advisory_items:
        print("[TIP] Python/依赖 WARN 只是提示可能存在兼容性或环境错位风险，不要求仅凭版本差异重建环境。")
        print("      如果目标课程已经能启动并通过关键接口，可记录提示后继续使用当前环境。")
        print("      如果确实出现安装、导入或运行错误，可保留旧环境并另建 CPython 3.13 `.venv` 做对照：")
        if platform.system() == "Windows":
            print("      py -3.13 -m venv .venv-course-reference")
            print("      .venv-course-reference\\Scripts\\python -m pip install -r requirements.txt")
        else:
            print("      python3.13 -m venv .venv-course-reference")
            print("      .venv-course-reference/bin/python -m pip install -r requirements.txt")
        print("      对照验证后再决定是否切换，不覆盖或删除当前环境。")

    print("\n# Python/依赖结构化结论")
    if python_compatibility_hints:
        compatibility_summary = "；".join(dict.fromkeys(python_compatibility_hints))
    elif python_blockers:
        compatibility_summary = "无版本差异可比较；当前缺少可用解释器，这属于启动条件缺失。"
    else:
        compatibility_summary = "未发现与课程验证参考环境的明确差异。"
    if python_fault_signals:
        fault_summary = "已观察到：" + "；".join(dict.fromkeys(python_fault_signals))
    elif python_runtime_checks_ran:
        fault_summary = "尚未观察到：本次 `pip check` 与关键框架导入均通过。"
    else:
        fault_summary = "尚未验证：未执行当前环境的 `pip check` 与关键框架导入，不能据此断言没有故障。"

    if python_blockers:
        judgement = "当前缺少可用的 Agent Python 启动路径，需要先处理解释器问题。"
        next_step = "保留现有文件，安装或定位可用 Python（课程参考为 CPython 3.13.x），创建/修复隔离环境后重新运行预检。"
    elif python_fault_signals:
        judgement = "已经出现具体 Python/依赖故障信号，不应只按版本号判断能否继续。"
        next_step = "保留当前环境和完整报错，先针对上述故障运行最小导入检查与目标课程 `/health`；需要时另建 3.13 对照环境。"
    elif python_runtime_checks_ran:
        judgement = "当前未观察到 Python/依赖故障；即使有版本提示，也可以继续验证目标课程。"
        next_step = "启动目标课程并检查 `/health`；如果正常，不必仅因版本差异重建环境。"
    else:
        judgement = "关键运行检查尚未完成，当前不能断言环境无故障。"
        next_step = "使用实际启动 Agent 的解释器运行 `python -m pip check`、关键导入检查和目标课程 `/health`。"

    print(f"- 兼容性提示：{compatibility_summary}")
    print(f"- 实际故障信号：{fault_summary}")
    print(f"- 当前判断：{judgement}")
    print(f"- 下一步：{next_step}")
    print("- 常见故障提示：No matching distribution、ResolutionImpossible、Failed building wheel、")
    print("  ModuleNotFoundError、ImportError/cannot import name、SyntaxError、后端进程退出，")
    print("  或目标课程 `/health` 连接失败/返回 5xx。")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
