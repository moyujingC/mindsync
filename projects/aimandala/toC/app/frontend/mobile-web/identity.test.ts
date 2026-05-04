import { describe, expect, it } from "vitest";

import {
  MOBILE_WEB_SESSION_STORAGE_KEY,
  persistMobileWebSession,
  resolveMobileWebCanonicalUserId,
  resolveMobileWebSession,
  updateMobileWebSessionCanonicalUserId,
} from "./identity";

function createStorage(seed?: Record<string, string>) {
  const store = new Map(Object.entries(seed ?? {}));

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("mobile-web identity adapter", () => {
  it("优先读取 query userId", () => {
    const storage = createStorage({
      [MOBILE_WEB_SESSION_STORAGE_KEY]: JSON.stringify({
        canonicalUserId: "persisted-user",
      }),
    });

    const session = resolveMobileWebSession({
      locationHref: "https://example.com/report?userId=query-user",
      storage,
      guestToken: "guest-seed",
    });

    expect(session.canonicalUserId).toBe("query-user");
    expect(session.provider).toBe("query");
  });

  it("在没有 query 时回落到 persisted session，再回落到 guest", () => {
    const persistedStorage = createStorage({
      [MOBILE_WEB_SESSION_STORAGE_KEY]: JSON.stringify({
        canonicalUserId: "persisted-user",
        displayLabel: "Persisted User",
      }),
    });

    const persisted = resolveMobileWebSession({
      locationHref: "https://example.com/history",
      storage: persistedStorage,
      guestToken: "guest-seed",
    });
    const guest = resolveMobileWebSession({
      locationHref: "https://example.com/history",
      storage: createStorage(),
      guestToken: "guest-seed",
    });

    expect(persisted.canonicalUserId).toBe("persisted-user");
    expect(persisted.provider).toBe("persisted");
    expect(guest.canonicalUserId).toBe("guest:mobile-web:guest-seed");
    expect(guest.provider).toBe("guest");
  });

  it("可持久化并更新当前 session", () => {
    const storage = createStorage();
    const session = resolveMobileWebSession({
      locationHref: "https://example.com/history",
      storage,
      guestToken: "guest-seed",
    });
    const updated = updateMobileWebSessionCanonicalUserId(session, "  linked-user  ");

    expect(updated?.canonicalUserId).toBe("linked-user");

    persistMobileWebSession(updated!, storage);

    const persisted = JSON.parse(
      storage.getItem(MOBILE_WEB_SESSION_STORAGE_KEY) ?? "{}",
    ) as { canonicalUserId?: string };
    expect(persisted.canonicalUserId).toBe("linked-user");
  });

  it("优先从 session 解析 canonical user id", () => {
    expect(
      resolveMobileWebCanonicalUserId({
        session: {
          canonicalUserId: "session-user",
          channelId: "mobile-web",
          provider: "persisted",
          displayLabel: "Session User",
          isAnonymous: false,
        },
        userId: "legacy-user",
      }),
    ).toBe("session-user");
  });
});
