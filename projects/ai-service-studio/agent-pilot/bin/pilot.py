#!/usr/bin/env python3
"""Codex + Hermes + 飞书运营分诊试点的本地安全入口。

默认仅处理本地 JSON 演练数据。飞书读写命令模板必须由人工在私有配置中启用；
本文件不保存也不打印任何凭证。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config" / "pilot.example.json"
DEFAULT_FIXTURES = ROOT / "tests" / "fixtures.json"
SENSITIVE_PATTERNS = (
    r"(?i)\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|secret|password|passwd)\b",
    r"(?i)\b(sk|pk|ak)_[a-z0-9_-]{8,}\b",
    r"\b\d{17}[0-9Xx]\b",
    r"\b\d{16,19}\b",
    r"(?i)\b(手机号|电话|联系人|email|e-mail|邮箱)\b",
)
EXTERNAL_WRITE_WORDS = (
    "发送",
    "发消息",
    "创建",
    "修改",
    "更新状态",
    "写回",
    "报价",
    "预约",
    "联系客户",
    "send",
    "create",
    "update",
    "write",
)


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"找不到文件：{path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON 格式错误：{path}（{exc.msg}）") from exc


def load_config(path: Path | None) -> dict[str, Any]:
    config = load_json(path or DEFAULT_CONFIG)
    if not isinstance(config, dict):
        raise ValueError("配置文件必须是 JSON 对象")
    return config


def contains_sensitive_data(value: str) -> bool:
    return any(re.search(pattern, value) for pattern in SENSITIVE_PATTERNS)


def has_external_write_intent(task: dict[str, Any]) -> bool:
    if task.get("requires_external_write") is True:
        return True
    text = " ".join(str(task.get(key, "")) for key in ("title", "context"))
    return any(word.lower() in text.lower() for word in EXTERNAL_WRITE_WORDS)


def classify(task: dict[str, Any]) -> dict[str, Any]:
    title = str(task.get("title", "")).strip()
    context = str(task.get("context", "")).strip()
    safe_id = str(task.get("id", "")).strip() or "unknown"
    base = {"id": safe_id, "missing_fields": []}

    if contains_sensitive_data(" ".join((title, context))):
        return {
            **base,
            "classification": "blocked_sensitive_data",
            "priority": "high",
            "proposed_action": "停止自动处理；请在人工渠道脱敏后再创建任务。",
            "approval_required": True,
            "reason": "输入疑似含敏感凭证、身份信息或联系人资料，试点不会传递或回显该内容。",
        }
    if not title:
        return {
            **base,
            "classification": "needs_clarification",
            "priority": "low",
            "missing_fields": ["title"],
            "proposed_action": "补充一条不含敏感信息的任务标题，并说明希望得到的产物。",
            "approval_required": False,
            "reason": "缺少任务标题，无法判断要处理的对象。",
        }

    requested_category = str(task.get("category", "")).strip()
    category = requested_category if requested_category in {"research", "service_follow_up", "internal_work"} else ""
    text = f"{title} {context}".lower()
    if not category:
        if any(word in text for word in ("研究", "调研", "评论", "选题", "research")):
            category = "research"
        elif any(word in text for word in ("沟通", "跟进", "线索", "服务", "合作", "follow")):
            category = "service_follow_up"
        else:
            category = "internal_work"

    missing_fields: list[str] = []
    if not context:
        missing_fields.append("context")
    priority_hint = str(task.get("priority_hint", "")).strip()
    priority = priority_hint if priority_hint in {"high", "normal", "low"} else "normal"
    if missing_fields:
        priority = "low" if priority != "high" else priority

    requires_approval = has_external_write_intent(task)
    proposed_actions = {
        "research": "明确研究问题、公开来源范围和预期产物后，准备一份小样本研究请求。",
        "service_follow_up": "准备脱敏沟通问题清单和服务边界，由人工决定是否联系对方。",
        "internal_work": "拆成可验证的内部资料或系统动作，并标明负责人和完成条件。",
    }
    classification = "proposal_only" if requires_approval else category
    return {
        **base,
        "classification": classification,
        "priority": priority,
        "missing_fields": missing_fields,
        "proposed_action": proposed_actions[category],
        "approval_required": requires_approval,
        "reason": "任务涉及外部写入或联系，当前仅生成建议，等待人工明确确认。"
        if requires_approval
        else "根据任务类别生成只读的下一步建议。",
    }


def executable_status(command: str) -> str:
    return "available" if shutil.which(command) else "missing"


def run_check(config: dict[str, Any]) -> dict[str, Any]:
    hermes_cfg = config.get("hermes_gateway", {})
    feishu_cfg = config.get("feishu", {})
    cli_command = str(feishu_cfg.get("cli_command", "feishu-cli"))
    return {
        "mode": config.get("mode", "offline_simulation"),
        "codex": executable_status("codex"),
        "hermes": executable_status("hermes"),
        "hermes_gateway_enabled": bool(hermes_cfg.get("enabled", False)),
        "feishu_cli": executable_status(cli_command),
        "feishu_enabled": bool(feishu_cfg.get("enabled", False)),
        "feishu_write_enabled": bool(feishu_cfg.get("write_enabled", False)),
        "note": "missing 表示尚未安装；试点仍可用本地 JSON 做离线演练。",
    }


def render_json(value: Any, output: Path | None) -> None:
    content = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(content, encoding="utf-8")
    else:
        print(content, end="")


def load_tasks(path: Path) -> list[dict[str, Any]]:
    raw = load_json(path)
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list) or not all(isinstance(item, dict) for item in raw):
        raise ValueError("任务输入必须是一个 JSON 对象或对象数组")
    return raw


def hermes_route(task: dict[str, Any], config: dict[str, Any]) -> tuple[dict[str, Any] | None, str]:
    """调用 Hermes 的 OpenAI 兼容端点；任何错误都由调用方降级到本地规则。"""
    hermes_cfg = config.get("hermes_gateway", {})
    if not hermes_cfg.get("enabled", False):
        return None, "not_configured; deterministic_policy_used"
    key_env = str(hermes_cfg.get("api_key_env", "HERMES_GATEWAY_API_KEY"))
    api_key = os.environ.get(key_env)
    if not api_key:
        return None, f"requested_but_{key_env}_missing; deterministic_policy_used"
    base_url = str(hermes_cfg.get("base_url", "")).rstrip("/")
    if not base_url:
        return None, "requested_but_base_url_missing; deterministic_policy_used"

    safe_task = {
        key: task[key]
        for key in ("id", "title", "category", "status", "priority_hint", "context", "requires_external_write")
        if key in task
    }
    instruction = (
        "你是只读运营分诊器。严格返回一个 JSON 对象，字段为 classification、priority、"
        "missing_fields、proposed_action、approval_required、reason。禁止执行或建议执行外部写入；"
        "遇到敏感数据必须返回 blocked_sensitive_data，且不回显原文。"
    )
    payload = {
        "model": hermes_cfg.get("model") or "hermes-agent",
        "messages": [
            {"role": "system", "content": instruction},
            {"role": "user", "content": json.dumps(safe_task, ensure_ascii=False)},
        ],
        "stream": False,
    }
    request = urllib.request.Request(
        f"{base_url}/v1/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:  # nosec B310: URL comes from local private config
            body = json.loads(response.read().decode("utf-8"))
        content = body["choices"][0]["message"]["content"]
        result = json.loads(content)
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError, IndexError, json.JSONDecodeError):
        return None, "gateway_call_failed; deterministic_policy_used"

    required = {"classification", "priority", "missing_fields", "proposed_action", "approval_required", "reason"}
    if not isinstance(result, dict) or not required.issubset(result):
        return None, "gateway_result_invalid; deterministic_policy_used"
    if result.get("approval_required") is not True and has_external_write_intent(task):
        return None, "gateway_violated_write_policy; deterministic_policy_used"
    result["id"] = str(task.get("id", "unknown"))
    return result, "gateway_used"


def run_route(input_path: Path, output: Path | None, config: dict[str, Any]) -> int:
    results = []
    statuses = []
    for task in load_tasks(input_path):
        # 敏感内容永不发送至 Gateway，即使用户错误开启了远程配置。
        local_result = classify(task)
        if local_result["classification"] == "blocked_sensitive_data":
            results.append(local_result)
            statuses.append("sensitive_input_blocked_locally")
            continue
        gateway_result, status = hermes_route(task, config)
        results.append(gateway_result or local_result)
        statuses.append(status)
    result = {
        "mode": config.get("mode", "offline_simulation"),
        "hermes_status": statuses,
        "results": results,
    }
    render_json(result, output)
    return 0


def require_write_preconditions(config: dict[str, Any], approved: bool, confirmed: bool) -> None:
    feishu_cfg = config.get("feishu", {})
    if not feishu_cfg.get("enabled", False):
        raise ValueError("飞书适配器未启用；默认只允许离线演练。")
    if not feishu_cfg.get("write_enabled", False):
        raise ValueError("飞书写回未启用；请先在私有配置显式设置 write_enabled=true。")
    if not approved:
        raise ValueError("输入尚未标记为人工批准；禁止写回。")
    if not confirmed:
        raise ValueError("缺少 --confirm；禁止写回。")
    if not feishu_cfg.get("write_command"):
        raise ValueError("未配置 write_command；为避免误写，禁止执行。")


def run_write(args: argparse.Namespace, config: dict[str, Any]) -> int:
    require_write_preconditions(config, args.approved, args.confirm)
    raise ValueError("写回适配器尚未在本试点实现；请先完成只读飞书演练并另行确认。")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Codex + Hermes + 飞书运营分诊试点")
    parser.add_argument("--config", type=Path, help="私有配置文件路径；默认使用无凭证模板")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("check", help="检查本地运行依赖与安全开关")
    route = subparsers.add_parser("route", help="对本地 JSON 做只读分诊")
    route.add_argument("--input", type=Path, default=DEFAULT_FIXTURES, help="输入 JSON 文件")
    route.add_argument("--output", type=Path, help="可选的建议 JSON 输出路径")
    write = subparsers.add_parser("write", help="受控写回预检查（当前不会执行外部写入）")
    write.add_argument("--approved", action="store_true", help="表示人工已审阅并批准")
    write.add_argument("--confirm", action="store_true", help="二次确认执行外部写入")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        config = load_config(args.config)
        if args.command == "check":
            render_json(run_check(config), None)
            return 0
        if args.command == "route":
            return run_route(args.input, args.output, config)
        if args.command == "write":
            return run_write(args, config)
    except ValueError as exc:
        print(f"安全停止：{exc}", file=sys.stderr)
        return 2
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
