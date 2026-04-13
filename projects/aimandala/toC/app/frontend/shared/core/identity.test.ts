import { describe, expect, it } from "vitest";

import {
  buildFrontendUserSession,
  createAnonymousFrontendSession,
  createGuestCanonicalUserId,
  isGuestCanonicalUserId,
  normalizeCanonicalUserId,
  resolveCanonicalUserId,
} from "./identity";

describe("shared/core identity", () => {
  it("规范化 canonical user id 并跳过空值", () => {
    expect(normalizeCanonicalUserId("  user-1  ")).toBe("user-1");
    expect(normalizeCanonicalUserId("   ")).toBeNull();
    expect(resolveCanonicalUserId(undefined, "  ", "user-2")).toBe("user-2");
  });

  it("创建 guest canonical user id", () => {
    const canonicalUserId = createGuestCanonicalUserId("mobile-web", "  preview guest  ");

    expect(canonicalUserId).toBe("guest:mobile-web:preview-guest");
    expect(isGuestCanonicalUserId(canonicalUserId)).toBe(true);
  });

  it("构建实名和匿名 session", () => {
    const identified = buildFrontendUserSession({
      canonicalUserId: "user-3",
      channelId: "mobile-web",
      provider: "persisted",
    });
    const anonymous = createAnonymousFrontendSession({
      channelId: "miniapp",
      provider: "miniapp-preview",
      token: "preview",
    });

    expect(identified.displayLabel).toBe("user-3");
    expect(identified.isAnonymous).toBe(false);
    expect(anonymous.canonicalUserId).toBe("guest:miniapp:preview");
    expect(anonymous.displayLabel).toContain("匿名会话");
    expect(anonymous.isAnonymous).toBe(true);
  });
});
