"""企业微信「微信客服」回调加解密，复现官方 WXBizMsgCrypt 核心算法。

算法依据企业微信加解密方案：
- EncodingAESKey（43 字符）-> Base64_Decode(key + "=") -> 32 字节 AESKey
- AES-256-CBC，IV = AESKey 前 16 字节，PKCS#7 填充（企业微信按 32 字节块填充）
- 明文 = 16B 随机串 + 4B msg_len（网络字节序）+ msg + receiveid（此处为 corpid）
- 签名 = sha1(sorted([token, timestamp, nonce, encrypt]))
"""

from __future__ import annotations

import base64
import hashlib
import os
import struct

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

_PKCS7_BLOCK_SIZE = 32


class WecomCryptoError(Exception):
    """微信客服回调验签或解密失败。"""


def _aes_key(encoding_aes_key: str) -> bytes:
    return base64.b64decode(encoding_aes_key + "=")


def _signature(token: str, timestamp: str, nonce: str, encrypt: str) -> str:
    raw = "".join(sorted([token, timestamp, nonce, encrypt]))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def verify_signature(token: str, timestamp: str, nonce: str, encrypt: str, msg_signature: str) -> bool:
    """校验回调签名，确认请求来自企业微信。"""
    return _signature(token, timestamp, nonce, encrypt) == msg_signature


def _aes_transform(aes_key: bytes, data: bytes, *, encrypt: bool) -> bytes:
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(aes_key[:16]))
    op = cipher.encryptor() if encrypt else cipher.decryptor()
    return op.update(data) + op.finalize()


def decrypt(encoding_aes_key: str, encrypt: str, receiveid: str | None = None) -> str:
    """解密回调密文，返回明文 msg；可选校验 receiveid（corpid）。"""
    aes_key = _aes_key(encoding_aes_key)
    rand_msg = _aes_transform(aes_key, base64.b64decode(encrypt), encrypt=False)
    pad = rand_msg[-1]
    if pad < 1 or pad > _PKCS7_BLOCK_SIZE:
        raise WecomCryptoError(f"PKCS#7 填充非法: {pad}")
    rand_msg = rand_msg[:-pad]
    msg_len = struct.unpack(">I", rand_msg[16:20])[0]
    msg = rand_msg[20:20 + msg_len].decode("utf-8")
    actual_receiveid = rand_msg[20 + msg_len:].decode("utf-8")
    if receiveid is not None and actual_receiveid != receiveid:
        raise WecomCryptoError(f"receiveid 不匹配: {actual_receiveid!r}")
    return msg


def encrypt(encoding_aes_key: str, msg: str, receiveid: str = "") -> str:
    """加密明文，供自测 roundtrip 与未来被动回复使用。"""
    aes_key = _aes_key(encoding_aes_key)
    msg_bytes = msg.encode("utf-8")
    plain = os.urandom(16) + struct.pack(">I", len(msg_bytes)) + msg_bytes + receiveid.encode("utf-8")
    pad_len = _PKCS7_BLOCK_SIZE - (len(plain) % _PKCS7_BLOCK_SIZE)
    plain += bytes([pad_len]) * pad_len
    encrypted = _aes_transform(aes_key, plain, encrypt=True)
    return base64.b64encode(encrypted).decode("utf-8")


def verify_url(
    token: str,
    encoding_aes_key: str,
    msg_signature: str,
    timestamp: str,
    nonce: str,
    echostr: str,
    receiveid: str | None = None,
) -> str:
    """GET 回调验证：验签 + 解密 echostr，返回明文（需原样回显）。"""
    if not verify_signature(token, timestamp, nonce, echostr, msg_signature):
        raise WecomCryptoError("回调签名校验失败")
    return decrypt(encoding_aes_key, echostr, receiveid=receiveid)
