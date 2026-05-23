export interface MiniappLiveConfig {
  miniappLiveEnabled: boolean;
  wechatSessionEnabled: boolean;
}

function readEnvFlag(name: string): boolean {
  const metaEnv = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  const value = metaEnv?.[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getMiniappLiveConfig(): MiniappLiveConfig {
  return {
    miniappLiveEnabled: readEnvFlag("VITE_AIMANDALA_MINIAPP_LIVE_ENABLED"),
    wechatSessionEnabled: readEnvFlag(
      "VITE_AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED",
    ),
  };
}
