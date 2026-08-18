"""收集人工在企业微信客户端的回话，作为智能体迭代素材。

人工客服转接后在企微客户端回复客户的消息（sync_msg 里 origin=5 且带
servicer_userid），是最有价值的迭代语料：能看出「客户问了什么 → agent 答了什么
→ 为什么转人工 → 人工最终怎么答」。这里把这类回话 append 成 JSONL，供后续
badcase 归因、评测集扩充和话术迭代使用。

存储位置默认 backend/data/wecom_kf_human_replies.jsonl，已被 .gitignore 忽略
（含真实客户对话，属隐私数据，不进版本库）。
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "wecom_kf_human_replies.jsonl"


class HumanReplyCollector:
    """把人工回话追加写入 JSONL，线程安全。"""

    def __init__(self, path: Path | None = None) -> None:
        self._path = path or DEFAULT_DATA_FILE
        self._lock = threading.Lock()

    def record(
        self,
        *,
        session_id: str,
        open_kfid: str,
        external_userid: str,
        servicer_userid: str,
        human_reply: str,
        history: list[dict[str, Any]],
        handoff_intent: str | None,
    ) -> None:
        """追加一条人工回话记录。

        history 是该会话最近几轮的「客户/agent 对话」快照，handoff_intent 是
        触发转人工的意图（crisis/ethics_boundary/transfer_human/intake_collect），
        便于后期把人工回话关联到具体转人工原因做迭代。
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "open_kfid": open_kfid,
            "external_userid": external_userid,
            "servicer_userid": servicer_userid,
            "handoff_intent": handoff_intent,
            "human_reply": human_reply,
            "history": history,
        }
        with self._lock:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with self._path.open("a", encoding="utf-8") as file:
                file.write(json.dumps(entry, ensure_ascii=False) + "\n")
