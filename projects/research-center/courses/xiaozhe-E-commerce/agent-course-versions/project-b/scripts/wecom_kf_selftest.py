"""微信客服 crypto 自测：验证签名、AES 加解密 roundtrip、echostr 验证回显。

运行：python scripts/wecom_kf_selftest.py（在 project-b 目录下）
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from integrations.wecom_kf.crypto import (  # noqa: E402
    WecomCryptoError,
    _signature,
    decrypt,
    encrypt,
    verify_signature,
    verify_url,
)

TOKEN = "QDG6eK"
AES_KEY = "jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C"
CORP_ID = "wx5823bf96d3bd56c7"


def test_roundtrip() -> None:
    plain = "<xml><ToUserName>wx5823bf96d3bd56c7</ToUserName><Token>abc</Token><OpenKfId>wk123</OpenKfId></xml>"
    cipher = encrypt(AES_KEY, plain, receiveid=CORP_ID)
    assert decrypt(AES_KEY, cipher, receiveid=CORP_ID) == plain
    try:
        decrypt(AES_KEY, cipher, receiveid="wrong-corp")
        raise AssertionError("receiveid 校验未生效")
    except WecomCryptoError:
        pass
    print("✓ AES 加解密 roundtrip 通过")


def test_signature() -> None:
    timestamp, nonce = "1409659589", "263014780"
    encrypt_val = encrypt(AES_KEY, "hello", receiveid=CORP_ID)
    sig = _signature(TOKEN, timestamp, nonce, encrypt_val)
    assert verify_signature(TOKEN, timestamp, nonce, encrypt_val, sig)
    assert not verify_signature(TOKEN, timestamp, nonce, encrypt_val, "deadbeef")
    print("✓ 签名校验通过")


def test_verify_url() -> None:
    timestamp, nonce = "1409659589", "263014780"
    expected = "hello-wecom"
    echostr = encrypt(AES_KEY, expected, receiveid=CORP_ID)
    sig = _signature(TOKEN, timestamp, nonce, echostr)
    assert verify_url(TOKEN, AES_KEY, sig, timestamp, nonce, echostr, receiveid=CORP_ID) == expected
    print("✓ URL 验证（echostr 回显）通过")


if __name__ == "__main__":
    test_roundtrip()
    test_signature()
    test_verify_url()
    print("全部通过")
