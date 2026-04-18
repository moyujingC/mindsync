import type { ProvidersRuntimeDataSourceOptions } from "./providersRuntimeDataSource";
import type { ProvidersAuthHeaderResolver } from "./providersAuthHeaders";
import type {
  ProvidersFetchLike,
  ProvidersReadonlyTransportConfig,
} from "./realProvidersFetchTransport";

export type ProvidersRuntimeConfigMode = "mock" | "real-fetch";

export type ProvidersRuntimeConfig =
  | {
      mode?: "mock";
    }
  | {
      mode: "real-fetch";
      baseUrl: string;
      fetchImpl: ProvidersFetchLike;
      defaultHeaders?: Record<string, string>;
      wireContract?: "providers" | "openai-models";
    };

type ProvidersRuntimeResolvedConfig =
  | ProvidersRuntimeConfig
  | {
      mode: "real-fetch";
      baseUrl: string;
      fetchImpl: ProvidersFetchLike;
      defaultHeaders?: Record<string, string>;
      authHeadersResolver?: ProvidersAuthHeaderResolver;
      wireContract?: "providers" | "openai-models";
    };

export function getDefaultProvidersRuntimeConfig(): ProvidersRuntimeConfig {
  return { mode: "mock" };
}

function hasAuthHeadersResolver(
  config: Extract<ProvidersRuntimeResolvedConfig, { mode: "real-fetch" }>,
): config is Extract<ProvidersRuntimeResolvedConfig, { mode: "real-fetch" }> & {
  authHeadersResolver?: ProvidersAuthHeaderResolver;
} {
  return "authHeadersResolver" in config;
}

function toFetchTransportConfig(
  config: Extract<ProvidersRuntimeResolvedConfig, { mode: "real-fetch" }>,
): ProvidersReadonlyTransportConfig {
  return {
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    ...(config.defaultHeaders ? { defaultHeaders: config.defaultHeaders } : {}),
    ...(config.wireContract ? { wireContract: config.wireContract } : {}),
    ...(hasAuthHeadersResolver(config) && config.authHeadersResolver
      ? { authHeadersResolver: config.authHeadersResolver }
      : {}),
  };
}

export function resolveProvidersRuntimeDataSourceOptions(
  config: ProvidersRuntimeResolvedConfig = getDefaultProvidersRuntimeConfig(),
): ProvidersRuntimeDataSourceOptions {
  if (config.mode === "real-fetch") {
    return {
      mode: "real-fetch",
      fetchTransport: toFetchTransportConfig(config),
    };
  }

  return { mode: "mock" };
}
