import {
  buildFrontendUserSession,
  createAnonymousFrontendSession,
  isGuestCanonicalUserId,
  normalizeCanonicalUserId,
} from "../shared/core";
import type { FrontendUserSession } from "../shared/types";

export const MOBILE_WEB_SESSION_STORAGE_KEY = "aimandala.mobile-web.session";

export interface MobileWebSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredMobileWebSession {
  canonicalUserId: string;
  platformUserId?: string | null;
  displayLabel?: string | null;
  isAnonymous?: boolean;
}

export interface ResolveMobileWebSessionOptions {
  locationHref?: string;
  storage?: MobileWebSessionStorage | null;
  guestToken?: string;
}

function getDefaultMobileWebSessionStorage(): MobileWebSessionStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getDefaultLocationHref(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
}

function createDefaultGuestToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }

  return String(Date.now());
}

function parseStoredMobileWebSession(
  rawValue: string | null,
): StoredMobileWebSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredMobileWebSession;
    if (!normalizeCanonicalUserId(parsed?.canonicalUserId)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getQueryUserId(locationHref: string | undefined): string | null {
  if (!locationHref) {
    return null;
  }

  try {
    const url = new URL(locationHref);
    return normalizeCanonicalUserId(url.searchParams.get("userId"));
  } catch {
    return null;
  }
}

export function createMobileWebGuestSession(
  guestToken = createDefaultGuestToken(),
): FrontendUserSession {
  return createAnonymousFrontendSession({
    channelId: "mobile-web",
    provider: "guest",
    token: guestToken,
    displayLabel: "Web 访客会话",
  });
}

function buildMobileWebSession(input: {
  canonicalUserId: string;
  provider: "query" | "persisted" | "guest";
  platformUserId?: string | null;
  displayLabel?: string | null;
  isAnonymous?: boolean;
}): FrontendUserSession {
  return buildFrontendUserSession({
    canonicalUserId: input.canonicalUserId,
    channelId: "mobile-web",
    provider: input.provider,
    platformUserId: input.platformUserId,
    displayLabel: input.displayLabel,
    isAnonymous: input.isAnonymous,
  });
}

export function resolveMobileWebSession(
  options: ResolveMobileWebSessionOptions = {},
): FrontendUserSession {
  const locationHref = options.locationHref ?? getDefaultLocationHref();
  const storage = options.storage ?? getDefaultMobileWebSessionStorage();
  const queryUserId = getQueryUserId(locationHref);

  if (queryUserId) {
    return buildMobileWebSession({
      canonicalUserId: queryUserId,
      provider: "query",
      displayLabel: isGuestCanonicalUserId(queryUserId) ? "Web 访客会话" : queryUserId,
    });
  }

  const stored = parseStoredMobileWebSession(
    storage?.getItem(MOBILE_WEB_SESSION_STORAGE_KEY) ?? null,
  );
  if (stored) {
    return buildMobileWebSession({
      canonicalUserId: stored.canonicalUserId,
      provider: "persisted",
      platformUserId: stored.platformUserId,
      displayLabel: stored.displayLabel,
      isAnonymous: stored.isAnonymous,
    });
  }

  return createMobileWebGuestSession(options.guestToken);
}

export function persistMobileWebSession(
  session: FrontendUserSession,
  storage: MobileWebSessionStorage | null = getDefaultMobileWebSessionStorage(),
): void {
  if (!storage) {
    return;
  }

  const serialized: StoredMobileWebSession = {
    canonicalUserId: session.canonicalUserId,
    platformUserId: session.platformUserId ?? null,
    displayLabel: session.displayLabel,
    isAnonymous: session.isAnonymous,
  };

  storage.setItem(
    MOBILE_WEB_SESSION_STORAGE_KEY,
    JSON.stringify(serialized),
  );
}

export function updateMobileWebSessionCanonicalUserId(
  currentSession: FrontendUserSession,
  nextCanonicalUserId: string,
): FrontendUserSession | null {
  const normalized = normalizeCanonicalUserId(nextCanonicalUserId);

  if (!normalized) {
    return null;
  }

  return buildMobileWebSession({
    canonicalUserId: normalized,
    provider: "query",
    platformUserId: currentSession.platformUserId,
    displayLabel: isGuestCanonicalUserId(normalized) ? "Web 访客会话" : normalized,
    isAnonymous: isGuestCanonicalUserId(normalized),
  });
}

export function resolveMobileWebCanonicalUserId(input: {
  session?: FrontendUserSession | null;
  userId?: string | null;
}): string | null {
  return normalizeCanonicalUserId(
    input.session?.canonicalUserId ?? input.userId ?? null,
  );
}
