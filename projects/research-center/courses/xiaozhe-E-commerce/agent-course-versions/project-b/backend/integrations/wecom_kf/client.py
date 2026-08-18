"""企业微信「微信客服」API 客户端：access_token 缓存、拉取消息、发送文本。

微信客服的 access_token 用「微信客服的 corpSecret」获取（不是自建应用 secret）。
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger("wecom_kf")

QYAPI_BASE = "https://qyapi.weixin.qq.com"
_TEXT_MAX_BYTES = 2048


def _truncate_utf8(text: str, max_bytes: int) -> str:
    """按 UTF-8 字节数安全截断，避免中文超长后出现半个字符。"""
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text
    return encoded[:max_bytes].decode("utf-8", errors="ignore")


class WecomKfClient:
    """封装微信客服 API 调用，进程内缓存 access_token。"""

    def __init__(self, corp_id: str, secret: str) -> None:
        self._corp_id = corp_id
        self._secret = secret
        self._token: str | None = None
        self._token_expires_at = 0.0
        self._http = httpx.Client(timeout=10.0)

    def _access_token(self) -> str:
        """取 access_token，提前 60 秒刷新避免边界过期。"""
        if self._token and time.time() < self._token_expires_at - 60:
            return self._token
        resp = self._http.get(
            f"{QYAPI_BASE}/cgi-bin/gettoken",
            params={"corpid": self._corp_id, "corpsecret": self._secret},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"获取 access_token 失败: {data}")
        self._token = data["access_token"]
        self._token_expires_at = time.time() + int(data.get("expires_in", 7200))
        return self._token

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        resp = self._http.post(
            f"{QYAPI_BASE}{path}",
            params={"access_token": self._access_token()},
            json=payload,
        )
        return resp.json()

    def sync_msg(self, token: str | None, open_kfid: str | None, cursor: str | None = None) -> dict[str, Any]:
        """增量拉取客服消息；token 是回调事件里的 Token（10 分钟内有效）。"""
        payload: dict[str, Any] = {"limit": 1000}
        if token:
            payload["token"] = token
        if open_kfid:
            payload["open_kfid"] = open_kfid
        if cursor:
            payload["cursor"] = cursor
        data = self._post("/cgi-bin/kf/sync_msg", payload)
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"sync_msg 失败: {data}")
        return data

    def send_text(self, open_kfid: str, external_userid: str, content: str) -> None:
        """给客户发文本；text.content 不超过 2048 字节，超出截断。"""
        payload = {
            "touser": external_userid,
            "open_kfid": open_kfid,
            "msgtype": "text",
            "text": {"content": _truncate_utf8(content, _TEXT_MAX_BYTES)},
        }
        data = self._post("/cgi-bin/kf/send_msg", payload)
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"send_msg 失败: {data}")

    def transfer_to_servicer(self, open_kfid: str, external_userid: str, servicer_userid: str) -> None:
        """把会话转给指定接待人员（service_state=3 由人工接待）。

        注意：转人工后 API 不能再 send_msg，故需先发话术再调用本方法。
        """
        payload = {
            "open_kfid": open_kfid,
            "external_userid": external_userid,
            "service_state": 3,
            "servicer_userid": servicer_userid,
        }
        data = self._post("/cgi-bin/kf/service_state/trans", payload)
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"service_state/trans 失败: {data}")
