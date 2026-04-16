import type { ProvidersRuntimeDataSourceOptions } from "./providersRuntimeDataSource";
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
    };

export function getDefaultProvidersRuntimeConfig(): ProvidersRuntimeConfig {
  return { mode: "mock" };
}

function toFetchTransportConfig(
  config: Extract<ProvidersRuntimeConfig, { mode: "real-fetch" }>,
): ProvidersReadonlyTransportConfig {
  return {
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
    ...(config.defaultHeaders ? { defaultHeaders: config.defaultHeaders } : {}),
  };
}

export function resolveProvidersRuntimeDataSourceOptions(
  config: ProvidersRuntimeConfig = getDefaultProvidersRuntimeConfig(),
): ProvidersRuntimeDataSourceOptions {
  if (config.mode === "real-fetch") {
    return {
      mode: "real-fetch",
      fetchTransport: toFetchTransportConfig(config),
    };
  }

  return { mode: "mock" };
}
