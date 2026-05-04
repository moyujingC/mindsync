const SESSION_STORAGE_KEY = "aimandala.native.linked.session";

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function persistSession(session) {
  try {
    wx.setStorageSync(SESSION_STORAGE_KEY, session);
  } catch {
    // Ignore storage errors during debug shell bootstrap.
  }
}

function readStoredSession() {
  try {
    return wx.getStorageSync(SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function requestLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        if (result && result.code) {
          resolve(result.code);
          return;
        }
        reject(new Error("wx.login 未返回可用 code"));
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

function exchangeSession(config, payload) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.apiBaseUrl.replace(/\/$/, "")}/api/v2/miniapp/session/exchange`,
      method: "POST",
      header: {
        "content-type": "application/json",
      },
      data: payload,
      success(response) {
        if (response.statusCode >= 400) {
          reject(
            new Error(
              (response.data && response.data.detail) ||
                "miniapp session exchange failed",
            ),
          );
          return;
        }
        resolve(response.data);
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

async function ensureMiniappSession(config, query) {
  const queryUserId = normalizeValue(query && query.userId);
  const queryOpenId = normalizeValue(query && query.openId);
  if (queryUserId && queryOpenId) {
    const session = {
      canonicalUserId: queryUserId,
      openId: queryOpenId,
      sessionId: normalizeValue(query && query.sessionId) || null,
      displayLabel: "微信已绑定会话",
    };
    persistSession(session);
    return session;
  }

  const stored = readStoredSession();
  if (stored && stored.canonicalUserId && stored.openId) {
    return stored;
  }

  const code = await requestLoginCode();
  const response = await exchangeSession(config, {
    code,
    debug_canonical_user_id:
      normalizeValue(query && query.debugCanonicalUserId) || null,
  });
  const session = {
    canonicalUserId: response.canonical_user_id,
    openId: response.open_id,
    sessionId: response.session_id || null,
    displayLabel: response.display_label || "微信已绑定会话",
  };
  persistSession(session);
  return session;
}

module.exports = {
  ensureMiniappSession,
};
