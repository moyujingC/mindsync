import type {
  FrontendChannelId,
  FrontendIdentityProvider,
  FrontendUserSession,
} from "../types";

export interface BuildFrontendUserSessionInput {
  canonicalUserId: string;
  channelId: FrontendChannelId;
  provider: FrontendIdentityProvider;
  platformUserId?: string | null;
  displayLabel?: string | null;
  isAnonymous?: boolean;
}

const GUEST_SESSION_PREFIX = "guest:";

export function normalizeCanonicalUserId(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function resolveCanonicalUserId(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeCanonicalUserId(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function isGuestCanonicalUserId(
  canonicalUserId: string | null | undefined,
): boolean {
  const normalized = normalizeCanonicalUserId(canonicalUserId);
  return Boolean(normalized?.startsWith(GUEST_SESSION_PREFIX));
}

export function createGuestCanonicalUserId(
  channelId: FrontendChannelId,
  token: string,
): string {
  const normalizedToken = normalizeCanonicalUserId(token)?.replace(/\s+/g, "-") ?? "anonymous";
  return `${GUEST_SESSION_PREFIX}${channelId}:${normalizedToken}`;
}

export function buildFrontendUserSession(
  input: BuildFrontendUserSessionInput,
): FrontendUserSession {
  const canonicalUserId = normalizeCanonicalUserId(input.canonicalUserId);

  if (!canonicalUserId) {
    throw new Error("Frontend user session requires a canonicalUserId.");
  }

  const platformUserId = normalizeCanonicalUserId(input.platformUserId) ?? null;
  const isAnonymous =
    input.isAnonymous ?? isGuestCanonicalUserId(canonicalUserId);
  const displayLabel = normalizeCanonicalUserId(input.displayLabel)
    ?? (isAnonymous ? `匿名会话 ${canonicalUserId}` : canonicalUserId);

  return {
    canonicalUserId,
    channelId: input.channelId,
    provider: input.provider,
    platformUserId,
    displayLabel,
    isAnonymous,
  };
}

export function createAnonymousFrontendSession(input: {
  channelId: FrontendChannelId;
  provider: FrontendIdentityProvider;
  token: string;
  displayLabel?: string | null;
}): FrontendUserSession {
  return buildFrontendUserSession({
    canonicalUserId: createGuestCanonicalUserId(input.channelId, input.token),
    channelId: input.channelId,
    provider: input.provider,
    displayLabel: input.displayLabel,
    isAnonymous: true,
  });
}
