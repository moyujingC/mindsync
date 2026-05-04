export type FrontendChannelId = "mobile-web" | "miniapp";

export type FrontendIdentityProvider =
  | "query"
  | "persisted"
  | "guest"
  | "miniapp-preview"
  | "linked-wechat";

export interface FrontendUserSession {
  canonicalUserId: string;
  channelId: FrontendChannelId;
  provider: FrontendIdentityProvider;
  platformUserId?: string | null;
  displayLabel: string;
  isAnonymous: boolean;
}

export interface MiniappSessionExchangeRequest {
  code?: string | null;
  open_id?: string | null;
  debug_canonical_user_id?: string | null;
}

export interface MiniappSessionExchangeResponse {
  canonical_user_id: string;
  open_id: string;
  session_id?: string | null;
  linked: boolean;
  is_new_user?: boolean | null;
  display_label?: string | null;
}
