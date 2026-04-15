"""Miniapp live runtime helpers for batch E gray integration."""

from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _flag_enabled(name: str, default: bool = False) -> bool:
    value = os.getenv(name, "").strip().lower()
    if not value:
        return default
    return value in {"1", "true", "yes", "on"}


def _env(name: str) -> str | None:
    value = os.getenv(name, "").strip()
    return value or None


@dataclass(frozen=True)
class MiniappGrayConfig:
    miniapp_live_enabled: bool
    wechat_session_enabled: bool
    wechat_pay_enabled: bool


@dataclass(frozen=True)
class WechatSessionInfo:
    open_id: str
    union_id: str | None = None
    session_key: str | None = None


@dataclass(frozen=True)
class WechatPayConfig:
    app_id: str
    mch_id: str
    api_v3_key: str


@dataclass(frozen=True)
class WechatRequestPaymentArgs:
    timeStamp: str
    nonceStr: str
    package: str
    signType: str
    paySign: str

    def to_dict(self) -> dict[str, str]:
        return {
            "timeStamp": self.timeStamp,
            "nonceStr": self.nonceStr,
            "package": self.package,
            "signType": self.signType,
            "paySign": self.paySign,
        }


@dataclass(frozen=True)
class WechatPayPayload:
    mode: str
    order_id: str
    next_action: str
    dry_run: bool
    request_payment_args: WechatRequestPaymentArgs

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "order_id": self.order_id,
            "next_action": self.next_action,
            "dry_run": self.dry_run,
            "request_payment_args": self.request_payment_args.to_dict(),
        }


def get_miniapp_gray_config() -> MiniappGrayConfig:
    return MiniappGrayConfig(
        miniapp_live_enabled=_flag_enabled("AIMANDALA_MINIAPP_LIVE_ENABLED", default=False),
        wechat_session_enabled=_flag_enabled("AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED", default=False),
        wechat_pay_enabled=_flag_enabled("AIMANDALA_MINIAPP_WECHAT_PAY_ENABLED", default=False),
    )


def _session_endpoint() -> str | None:
    explicit = _env("AIMANDALA_MINIAPP_WECHAT_CODE2SESSION_URL")
    if explicit:
        return explicit
    app_id = _env("AIMANDALA_MINIAPP_WECHAT_APP_ID")
    secret = _env("AIMANDALA_MINIAPP_WECHAT_APP_SECRET")
    if not app_id or not secret:
        return None
    return (
        "https://api.weixin.qq.com/sns/jscode2session"
        f"?appid={app_id}&secret={secret}&grant_type=authorization_code"
    )


def _build_request(url: str) -> Request:
    return Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "aimandala-miniapp-runtime/0.1",
        },
        method="GET",
    )


def exchange_wechat_session(code: str) -> WechatSessionInfo:
    endpoint = _session_endpoint()
    if not endpoint:
        raise ValueError("wechat session runtime is not configured")

    separator = "&" if "?" in endpoint else "?"
    request = _build_request(f"{endpoint}{separator}js_code={code}")

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise ValueError(f"wechat session exchange failed: HTTP {error.code}") from error
    except URLError as error:
        raise ValueError("wechat session exchange failed: network error") from error
    except json.JSONDecodeError as error:
        raise ValueError("wechat session exchange failed: invalid response") from error

    if payload.get("errcode"):
        raise ValueError(
            f"wechat session exchange failed: {payload.get('errmsg', 'unknown error')}"
        )

    open_id = str(payload.get("openid") or "").strip()
    if not open_id:
        raise ValueError("wechat session exchange failed: missing openid")

    union_id = str(payload.get("unionid") or "").strip() or None
    session_key = str(payload.get("session_key") or "").strip() or None
    return WechatSessionInfo(
        open_id=open_id,
        union_id=union_id,
        session_key=session_key,
    )


def get_wechat_pay_config() -> WechatPayConfig:
    app_id = _env("AIMANDALA_MINIAPP_WECHAT_APP_ID")
    mch_id = _env("AIMANDALA_MINIAPP_WECHAT_PAY_MCH_ID")
    api_v3_key = _env("AIMANDALA_MINIAPP_WECHAT_PAY_API_V3_KEY")
    if not app_id or not mch_id or not api_v3_key:
        raise ValueError("wechat pay runtime is not fully configured")
    return WechatPayConfig(
        app_id=app_id,
        mch_id=mch_id,
        api_v3_key=api_v3_key,
    )


def build_wechatpay_payload(
    *,
    order_id: str,
    payable_amount: float,
    dry_run: bool,
) -> WechatPayPayload:
    config = get_wechat_pay_config()
    digest = hashlib.sha1(f"{order_id}:{payable_amount}".encode("utf-8")).hexdigest()
    request_args = WechatRequestPaymentArgs(
        timeStamp=str(1_760_000_000 + int(digest[:6], 16) % 1_000_000),
        nonceStr=digest[:16],
        package=f"prepay_id=mock_{order_id}",
        signType="RSA",
        paySign=hashlib.sha1(
            f"{config.app_id}:{config.mch_id}:{order_id}:{payable_amount}".encode("utf-8")
        ).hexdigest(),
    )
    return WechatPayPayload(
        mode="wechatpay",
        order_id=order_id,
        next_action="wait_for_payment_confirmation",
        dry_run=dry_run,
        request_payment_args=request_args,
    )
