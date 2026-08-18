"""企业微信「微信客服」回调编排。

链路：回调 POST 收到加密事件（kf_msg_or_event）-> 验签解密拿到 Token/OpenKfId
-> 后台线程 sync_msg 拉取客户消息 -> agent.chat 生成回复 -> send_msg 回客户。

注意：本阶段只发话术、不自动转人工。微信客服账号设为「通过 API 管理」后，
人工在企微客户端看不到 API 接待的会话，转接需在企微后台手动操作，
或后续补 service_state/trans 自动转接（TODO）。
"""

from __future__ import annotations

import logging
import threading
import xml.etree.ElementTree as ET
from collections import deque
from typing import Any

from api.schemas import ChatRequest, HistoryMessage
from config.settings import load_course_env, wecom_kf_config
from integrations.wecom_kf.client import WecomKfClient
from integrations.wecom_kf.crypto import WecomCryptoError, decrypt, verify_signature, verify_url as crypto_verify_url

logger = logging.getLogger("wecom_kf")

_HISTORY_SIZE = 4
_SEEN_MSGID_LIMIT = 10000


class WecomKfHandler:
    """微信客服 webhook 处理器，复用 Lesson41Agent 的 chat 编排。"""

    def __init__(self, agent: Any) -> None:
        self._agent = agent
        self._client: WecomKfClient | None = None
        self._lock = threading.Lock()
        self._seen_msgids: set[str] = set()
        self._history: dict[str, deque[HistoryMessage]] = {}

    def _client_for(self, cfg: dict[str, Any]) -> WecomKfClient:
        if self._client is None:
            self._client = WecomKfClient(cfg["corp_id"], cfg["secret"])
        return self._client

    def verify_url(self, msg_signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """GET 回调验证：验签 + 解密 echostr，返回明文（需原样回显）。"""
        load_course_env()
        cfg = wecom_kf_config()
        if not cfg["enabled"] or not (cfg["token"] and cfg["aes_key"]):
            raise WecomCryptoError("微信客服回调未配置")
        return crypto_verify_url(
            cfg["token"],
            cfg["aes_key"],
            msg_signature,
            timestamp,
            nonce,
            echostr,
            receiveid=cfg["corp_id"] or None,
        )

    def handle_event(self, body: str, msg_signature: str, timestamp: str, nonce: str) -> None:
        """POST 回调：验签解密后启后台线程处理，立即返回避免回调超时重试。"""
        load_course_env()
        cfg = wecom_kf_config()
        if not cfg["enabled"]:
            logger.info("微信客服回调未启用，忽略本次事件")
            return
        try:
            encrypt = ET.fromstring(body).findtext("Encrypt") or ""
            if not verify_signature(cfg["token"], timestamp, nonce, encrypt, msg_signature):
                raise WecomCryptoError("回调签名校验失败")
            event = ET.fromstring(decrypt(cfg["aes_key"], encrypt, receiveid=cfg["corp_id"] or None))
            kf_token = event.findtext("Token") or ""
            open_kfid = event.findtext("OpenKfId") or cfg["open_kfid"]
        except (WecomCryptoError, ET.ParseError) as exc:
            logger.warning("微信客服回调解析失败: %s", exc)
            return
        if not kf_token or not open_kfid:
            logger.warning("微信客服回调缺少 Token/OpenKfId")
            return
        threading.Thread(
            target=self._process_messages,
            args=(cfg, kf_token, open_kfid),
            daemon=True,
        ).start()

    def _process_messages(self, cfg: dict[str, Any], kf_token: str, open_kfid: str) -> None:
        try:
            client = self._client_for(cfg)
            cursor: str | None = None
            while True:
                data = client.sync_msg(kf_token, open_kfid, cursor)
                for msg in data.get("msg_list", []):
                    if msg.get("origin") == 3 and msg.get("msgtype") == "text":
                        self._handle_customer_text(client, msg)
                if not data.get("has_more"):
                    break
                cursor = data.get("next_cursor")
        except Exception:
            logger.exception("微信客服消息处理失败")

    def _handle_customer_text(self, client: WecomKfClient, msg: dict[str, Any]) -> None:
        msgid = msg.get("msgid", "")
        with self._lock:
            if msgid and msgid in self._seen_msgids:
                return
            if msgid:
                self._seen_msgids.add(msgid)
                if len(self._seen_msgids) > _SEEN_MSGID_LIMIT:
                    self._seen_msgids.clear()
        open_kfid = msg.get("open_kfid", "")
        external_userid = msg.get("external_userid", "")
        content = (msg.get("text") or {}).get("content", "")
        if not content or not external_userid:
            return
        session_id = f"{open_kfid}:{external_userid}"
        with self._lock:
            history = list(self._history.get(session_id, ()))
        response = self._agent.chat(
            ChatRequest(
                session_id=session_id,
                runtime_user_id=external_userid,
                runtime_nickname="微信客户",
                user_message=content,
                reasoning_view="off",
                debug=False,
                history_messages=history,
            )
        )
        answer = response.answer
        if answer:
            client.send_text(open_kfid, external_userid, answer)
        with self._lock:
            hist = self._history.setdefault(session_id, deque(maxlen=_HISTORY_SIZE))
            hist.append(HistoryMessage(role="user", content=content))
            hist.append(HistoryMessage(role="assistant", content=answer))
