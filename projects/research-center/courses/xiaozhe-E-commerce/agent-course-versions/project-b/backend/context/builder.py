"""把 Runtime Context、短期记忆和历史消息整理成受控模型上下文。疗愈场景无实时业务事实。"""

from __future__ import annotations

import re
from typing import Any

from api.schemas import ChatRequest, HistoryMessage, Intent
from safety.source_guard import inspect_source
from tools.planning import estimate_tokens


SESSION_MEMORIES: dict[str, dict[str, Any]] = {}
RECENT_WINDOW_SIZE = 4
MAX_HISTORY_TOKENS = 80
_PHONE_PATTERN = re.compile(r"\b1[3-9]\d{9}\b")
_EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_WECHAT_PATTERN = re.compile(r"(?:微信|weixin|wechat|wx)[：:\s]*([a-zA-Z0-9_-]{6,})", re.IGNORECASE)


def current_memory(session_id: str, runtime_user_id: str | None = None) -> dict[str, Any]:
    """短期记忆只保存当前会话内的意图、联系方式标记与危机信号标记。"""
    memory = SESSION_MEMORIES.get(session_id)
    if memory is None or (runtime_user_id and memory.get("runtime_user_id") not in {None, runtime_user_id}):
        memory = {
            "runtime_user_id": runtime_user_id,
            "recent_intent": None,
            "contact_collected": False,
            "crisis_flagged": False,
            "excluded_items": [],
            "write_decisions": [],
            "ttl": "session",
        }
        SESSION_MEMORIES[session_id] = memory
    elif runtime_user_id and memory.get("runtime_user_id") is None:
        memory["runtime_user_id"] = runtime_user_id
    return memory


def build_context(request: ChatRequest) -> tuple[dict[str, Any], dict[str, Any]]:
    """压缩历史消息并做来源安全标记，疗愈场景无订单等实时事实可注入。"""
    kept_history, dropped_history = _compress_history(request.history_messages)
    source_reports: list[dict[str, Any]] = []
    user_report = inspect_source("user_message", request.user_message)
    source_reports.append({key: value for key, value in user_report.items() if key != "sanitized_content"})
    model_context: list[str] = []
    for item in kept_history:
        report = inspect_source("history_messages", _redact_history(item.content))
        source_reports.append({key: value for key, value in report.items() if key != "sanitized_content"})
        model_context.append(f"[history/session] {item.role}: {report['sanitized_content']}")
    context_report = {
        "schema_version": "context_build_report_v1",
        "sources": ["runtime_context", "session_memory", "history_messages", "user_message"],
        "trust_order": ["runtime_context", "session_memory", "history_messages", "user_message"],
        "conflict_resolutions": [],
        "model_context": model_context,
        "source_safety": {
            "tainted": any(report["tainted"] for report in source_reports),
            "tainted_sources": sorted({report["source"] for report in source_reports if report["tainted"]}),
            "reports": source_reports,
        },
    }
    compression_report = {
        "schema_version": "context_compression_v1",
        "recent_window_size": RECENT_WINDOW_SIZE,
        "token_budget": MAX_HISTORY_TOKENS,
        "input_count": len(request.history_messages),
        "kept_count": len(kept_history),
        "dropped_count": len(dropped_history),
        "kept_indexes": [request.history_messages.index(item) for item in kept_history],
        "strategy": "recent_window",
        "relevance_score": {"recent_window": 100, "older_history": 20},
    }
    return context_report, compression_report


def update_memory(
    *,
    session_id: str,
    runtime_user_id: str,
    intent: Intent,
    user_message: str,
) -> dict[str, Any]:
    """只有显式确认的联系方式和危机信号写入记忆，隐私原文与内部文本不写入。"""
    memory = current_memory(session_id, runtime_user_id)
    decisions: list[dict[str, Any]] = []
    if re.search(r"1[3-9]\d{9}", user_message):
        decisions.append({"field": "phone_number", "accepted": False, "reason": "privacy_data"})
    if _WECHAT_PATTERN.search(user_message):
        memory["contact_collected"] = True
        decisions.append({"field": "contact_wechat", "accepted": True, "reason": "explicit_contact_leave"})
    if intent == "crisis":
        memory["crisis_flagged"] = True
        decisions.append({"field": "crisis_signal", "accepted": True, "reason": "crisis_detected"})
    if any(term in user_message for term in ("系统提示词", "审批令牌", "hidden reasoning")):
        decisions.append({"field": "internal_or_high_risk_text", "accepted": False, "reason": "unsafe_for_memory"})
    memory["recent_intent"] = intent
    memory["write_decisions"] = decisions
    return dict(memory)


def _compress_history(history: list[HistoryMessage]) -> tuple[list[HistoryMessage], list[HistoryMessage]]:
    recent_start = max(0, len(history) - RECENT_WINDOW_SIZE)
    selected_indexes = set(range(recent_start, len(history)))
    kept: list[HistoryMessage] = []
    used_tokens = 0
    for index in sorted(selected_indexes, reverse=True):
        item = history[index]
        tokens = estimate_tokens(item.content)
        if used_tokens + tokens <= MAX_HISTORY_TOKENS:
            kept.append(item)
            used_tokens += tokens
    kept.reverse()
    kept_ids = {id(item) for item in kept}
    return kept, [item for item in history if id(item) not in kept_ids]


def _redact_history(content: str) -> str:
    """历史消息进入模型上下文前先做基础隐私脱敏。"""
    return _EMAIL_PATTERN.sub("[email-redacted]", _PHONE_PATTERN.sub("[phone-redacted]", content))
