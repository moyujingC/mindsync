"""记录微信客服的完整对话，作为智能体迭代素材。

把每一轮消息都追加成 JSONL（客户说了什么、agent 回了什么、人工回了什么），
用 sender 字段标明消息由谁发出，便于后期还原完整对话、做 badcase 归因和
话术迭代。转人工后的人工回复额外带 handoff_intent，关联「为什么转人工」。

存储位置默认 backend/data/wecom_kf_conversations.jsonl，已被 .gitignore 忽略
（含真实客户对话，属隐私数据，不进版本库）。
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

Sender = Literal["customer", "agent", "human"]

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "wecom_kf_conversations.jsonl"


class ConversationCollector:
    """把对话消息追加写入 JSONL，线程安全。"""

    def __init__(self, path: Path | None = None) -> None:
        self._path = path or DEFAULT_DATA_FILE
        self._lock = threading.Lock()

    def record(
        self,
        *,
        sender: Sender,
        session_id: str,
        open_kfid: str,
        external_userid: str,
        content: str,
        servicer_userid: str | None = None,
        handoff_intent: str | None = None,
    ) -> None:
        """追加一条对话消息。

        sender：customer=客户、agent=智能体、human=人工客服。
        servicer_userid 与 handoff_intent 仅对 human 消息有意义。
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "open_kfid": open_kfid,
            "external_userid": external_userid,
            "sender": sender,
            "servicer_userid": servicer_userid,
            "handoff_intent": handoff_intent,
            "content": content,
        }
        with self._lock:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with self._path.open("a", encoding="utf-8") as file:
                file.write(json.dumps(entry, ensure_ascii=False) + "\n")
