import {
  buildFrontendUserSession,
  createAnonymousFrontendSession,
  normalizeCanonicalUserId,
} from "../shared/core";
import type {
  FrontendUserSession,
  MiniappSessionExchangeResponse,
} from "../shared/types";

export const MINIAPP_SESSION_STORAGE_KEY = "aimandala.miniapp.session";

interface StoredMiniappSession {
  canonicalUserId: string;
  platformUserId?: string | null;
  displayLabel?: string | null;
  provider?: "miniapp-preview" | "linked-wechat";
  isAnonymous?: boolean;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseStoredSession(
  rawValue: string | null,
): StoredMiniappSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredMiniappSession;
    if (!normalizeCanonicalUserId(parsed?.canonicalUserId)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function createDefaultToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID().slice(0, 8);
  }

  return String(Date.now());
}

export function createMiniappGuestSession(
  token = createDefaultToken(),
): FrontendUserSession {
  return createAnonymousFrontendSession({
    channelId: "miniapp",
    provider: "miniapp-preview",
    token,
    displayLabel: "Miniapp 预览会话",
  });
}

export function resolveMiniappSession(): FrontendUserSession {
  const stored = parseStoredSession(
    getStorage()?.getItem(MINIAPP_SESSION_STORAGE_KEY) ?? null,
  );

  if (!stored) {
    return createMiniappGuestSession();
  }

  return buildFrontendUserSession({
    canonicalUserId: stored.canonicalUserId,
    channelId: "miniapp",
    provider: stored.provider ?? "miniapp-preview",
    platformUserId: stored.platformUserId,
    displayLabel: stored.displayLabel,
    isAnonymous: stored.isAnonymous,
  });
}

export function persistMiniappSession(session: FrontendUserSession): void {
  getStorage()?.setItem(
    MINIAPP_SESSION_STORAGE_KEY,
    JSON.stringify({
      canonicalUserId: session.canonicalUserId,
      platformUserId: session.platformUserId ?? null,
      displayLabel: session.displayLabel,
      provider:
        session.provider === "linked-wechat"
          ? "linked-wechat"
          : "miniapp-preview",
      isAnonymous: session.isAnonymous,
    } satisfies StoredMiniappSession),
  );
}

export function sessionFromMiniappExchange(
  payload: MiniappSessionExchangeResponse,
): FrontendUserSession {
  return buildFrontendUserSession({
    canonicalUserId: payload.canonical_user_id,
    channelId: "miniapp",
    provider: payload.linked ? "linked-wechat" : "miniapp-preview",
    platformUserId: payload.open_id,
    displayLabel: payload.display_label ?? payload.canonical_user_id,
    isAnonymous: payload.linked
      ? false
      : payload.canonical_user_id.startsWith("guest:"),
  });
}
