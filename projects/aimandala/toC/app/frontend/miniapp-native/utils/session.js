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

function createLocalSession(query) {
  const debugUserId = normalizeValue(query && query.debugCanonicalUserId);
  const token = Date.now().toString(36);
  return {
    canonicalUserId: debugUserId || `guest:miniapp:native:${token}`,
    openId: normalizeValue(query && query.openId) || "miniapp-native-preview",
    sessionId: null,
    displayLabel: "小程序本地预览会话",
  };
}

async function ensureMiniappSession(_config, query) {
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

  const session = createLocalSession(query);
  persistSession(session);
  return session;
}

module.exports = {
  ensureMiniappSession,
};
