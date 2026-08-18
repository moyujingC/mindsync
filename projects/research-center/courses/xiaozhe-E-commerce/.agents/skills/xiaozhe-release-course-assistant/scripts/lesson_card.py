#!/usr/bin/env python3
"""Generate a lesson run card from a public code root."""

from __future__ import annotations

import argparse
from pathlib import Path

from check_release_root import agent_versions_root, frontend_root, missing_paths, optional_missing_paths, read_release_version


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Public code root.")
    parser.add_argument("lesson", type=int, help="Lesson number, 1-46.")
    parser.add_argument("--agent-port", default="8000", help="Agent backend port.")
    parser.add_argument("--frontend-port", default="5173", help="Debug workbench frontend port.")
    return parser.parse_args()


def one_match(root: Path, pattern: str) -> Path | None:
    matches = sorted(root.glob(pattern))
    return matches[0] if matches else None


def signals_for_lesson(lesson: int) -> list[str]:
    if lesson == 1:
        return ["终端里的 messages 输入输出", "模型返回的 assistant message"]
    if lesson == 46:
        return ["增强路线图", "生产边界", "项目表达与后续升级方向"]

    signals = ["answer"]
    if 7 <= lesson <= 16 or lesson in {22, 41, 42, 44}:
        signals.append("cost_summary / citations / rag")
    if lesson == 41 or 42 <= lesson <= 45:
        signals.append("session_state.model / route fallback reason")
    if lesson in {41, 42}:
        signals.append("session_state.rag.embedding / 在线或显式离线 Embedding")
    if 17 <= lesson <= 25 or lesson in {41, 42}:
        signals.append("tool_calls / observation")
    if 26 <= lesson <= 31 or lesson in {41, 43}:
        signals.append("workflow / HITL / resume_token")
    if 32 <= lesson <= 36 or lesson == 41:
        signals.append("session_state.memory / runtime_context / context_summary")
    if 37 <= lesson <= 41 or lesson in {42, 43, 44, 45}:
        signals.append("trace_event_v1 / eval_report_v1")
    if lesson <= 6:
        signals.append("早期课程中 RAG、Tool、Workflow、Trace 面板置灰通常是正常的")
    return signals


def needs_ecommerce_backend(lesson: int) -> bool:
    return 17 <= lesson <= 45


def needs_agent_backend(lesson: int) -> bool:
    return 2 <= lesson <= 45


def needs_model_key(lesson: int) -> bool:
    return 1 <= lesson <= 45


def needs_debug_workbench(lesson: int) -> bool:
    return 2 <= lesson <= 45


def venv_python_from(relative_depth: int) -> str:
    prefix = "../" * relative_depth
    return f"{prefix}.venv/bin/python"


def local_url(port: str, path: str = "") -> str:
    return f"http://localhost:{port}{path}"


def main() -> int:
    args = parse_args()
    root = args.root.expanduser().resolve()
    missing = missing_paths(root)
    if missing:
        print(f"[ERROR] 不是合格 release 根目录: {root}")
        print("[ERROR] 缺少: " + ", ".join(missing))
        return 2
    if not 1 <= args.lesson <= 46:
        print("[ERROR] lesson must be 1-46")
        return 2

    lesson_no = f"{args.lesson:02d}"
    versions_root = agent_versions_root(root)
    frontend_dir = frontend_root(root)
    story_file = one_match(root / "courses" / "story", f"{lesson_no}-*.md")
    code_dir = one_match(versions_root, f"lesson-{lesson_no}-*")
    scenario_files = sorted(code_dir.glob("scenario_*.json")) if code_dir else []
    optional_missing = optional_missing_paths(root)

    print(f"# 第 {lesson_no} 课运行卡片")
    print(f"\n- 课程代码仓根目录: `{root}`")
    print("- 包形态: 云效/Codeup 代码仓")
    release_version, _release_version_error = read_release_version(root)
    print(f"- 发布版本: `{release_version or '未知（旧版仓未提供 release-version.json）'}`")
    if story_file:
        print(f"- 课程正文: `{story_file.relative_to(root)}`")
    elif optional_missing:
        print("- 课程正文: 未随包提供；导读使用小哲课程助手内置精炼课程地图。")
    else:
        print("- 课程正文: 未找到，请检查课程文件是否完整。")
    print(f"- 代码/材料: `{code_dir.relative_to(root) if code_dir else '未找到'}`")
    print(f"- 电商后端: {'需要' if needs_ecommerce_backend(args.lesson) else '通常不需要'}。")
    env_path = versions_root / "course.env"
    print(f"- 模型 Key: {'需要 `' + env_path.relative_to(root).as_posix() + '`' if needs_model_key(args.lesson) else '不需要'}。")
    print("- Python 环境: 优先使用课程代码仓根目录下的 `.venv` 虚拟环境。")
    if 41 <= args.lesson <= 45:
        print("- 第 41 课运行时: 普通路由模型优先，高风险规则负责业务护栏；第 42-45 课复用这一运行时。")
    if args.lesson in {41, 42}:
        print("- RAG 模式: 默认使用真实 Embedding；只有明确离线学习时才设置 `AGENT_COURSE_OFFLINE_RAG=1`。")

    print("\n## Python 虚拟环境")
    print("macOS/Linux:")
    print("```bash")
    print("python3.13 -m venv .venv")
    print(".venv/bin/python -m pip install -r requirements.txt")
    print("```")
    print("Windows:")
    print("```powershell")
    print("py -3.13 -m venv .venv")
    print(".venv\\Scripts\\python -m pip install -r requirements.txt")
    print("```")

    print("\n## 启动命令")
    if needs_ecommerce_backend(args.lesson):
        print("```bash")
        print("docker compose -f docker-compose.infra.yml up -d --build mysql ecommerce-service")
        print("```")
    else:
        print("- 本课不依赖订单、物流、商品等实时业务事实时，可以先不启动电商后端。")

    if args.lesson == 1:
        print("```bash")
        fallback = agent_versions_root(root) / "lesson-01-*"
        print(f"cd {code_dir.relative_to(root) if code_dir else fallback.relative_to(root)}")
        print(f"{venv_python_from(2)} main.py")
        print("```")
    elif 2 <= args.lesson <= 41:
        backend = code_dir / "backend" if code_dir else agent_versions_root(root) / f"lesson-{lesson_no}-*" / "backend"
        print("```bash")
        print(f"cd {backend.relative_to(root) if code_dir else backend}")
        print(f"PORT={args.agent_port} {venv_python_from(3)} main.py")
        print("```")
    elif 42 <= args.lesson <= 45:
        backend = versions_root / "lesson-41-final-rehearsal" / "backend"
        print("```bash")
        print(f"cd {backend.relative_to(root)}")
        print(f"PORT={args.agent_port} {venv_python_from(3)} main.py")
        print("```")
        if scenario_files:
            print("\n## 场景材料")
            for scenario in scenario_files:
                print(f"- `{scenario.relative_to(root)}`")
    else:
        print("- 第 46 课不新增后端，阅读路线图和收束材料即可。")

    if needs_debug_workbench(args.lesson):
        print("\n## 调试后台")
        print("```bash")
        print(f"cd {frontend_dir.relative_to(root)}")
        print("npm install")
        if args.frontend_port == "5173":
            print("npm run dev")
        else:
            print(f"npm run dev -- --host 0.0.0.0 --port {args.frontend_port}")
        print("```")
        if args.agent_port != "8000":
            print(f"- Agent 使用了非默认端口，在 `{frontend_dir.relative_to(root) / '.env.local'}` 设置 `VITE_AGENT_BASE_URL=http://localhost:{args.agent_port}`。")

    print("\n## 启动后访问链接")
    access_links: list[tuple[str, str]] = []
    if needs_debug_workbench(args.lesson):
        access_links.append(("Agent 调试后台", local_url(args.frontend_port)))
    if needs_agent_backend(args.lesson):
        access_links.append(("Agent 健康检查", local_url(args.agent_port, "/health")))
        access_links.append(("Agent API 文档", local_url(args.agent_port, "/docs")))
    if needs_ecommerce_backend(args.lesson):
        access_links.append(("电商后端健康检查", local_url("8081", "/actuator/health")))
        access_links.append(("电商后台页面", local_url("8081", "/admin/")))
    if access_links:
        for label, url in access_links:
            print(f"- {label}: {url}")
        print("- 如果浏览器或终端代理影响 `localhost`，把链接中的 `localhost` 换成 `127.0.0.1` 再试。")
    else:
        print("- 本课没有需要打开的 HTTP 页面；按终端输出或课程材料确认即可。")

    print("\n## 健康检查")
    health_commands: list[str] = []
    if needs_ecommerce_backend(args.lesson):
        health_commands.append("curl --noproxy '*' http://127.0.0.1:8081/actuator/health")
    if needs_agent_backend(args.lesson):
        health_commands.append(f"curl --noproxy '*' http://127.0.0.1:{args.agent_port}/health")
    if needs_debug_workbench(args.lesson):
        health_commands.append(f"curl --noproxy '*' -I http://127.0.0.1:{args.frontend_port}")
    if health_commands:
        print("```bash")
        for command in health_commands:
            print(command)
        print("```")
    else:
        print("- 本课没有 HTTP 后端健康检查；按终端输出或课程材料确认即可。")

    print("\n## 应观察信号")
    for signal in signals_for_lesson(args.lesson):
        print(f"- {signal}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
