import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import { mockProvidersReadonlyDataSource } from "./mockProvidersDataSource";
import {
  resolveProvidersRuntimeDataSourceOptions,
} from "./providersRuntimeConfig";
import type {
  ProvidersRuntimeConfig,
  ProvidersRuntimeConfigMode,
} from "./providersRuntimeConfig";
import {
  resolveProvidersRuntimeConfigFromSource,
} from "./providersRuntimeConfigSource";
import type { ProvidersRuntimeConfigSource } from "./providersRuntimeConfigSource";
import { createRealProvidersFetchDataSource } from "./realProvidersDataSource";
import type { ProvidersReadonlyTransportConfig } from "./realProvidersFetchTransport";

export type ProvidersRuntimeMode = ProvidersRuntimeConfigMode;

export type ProvidersRuntimeDataSourceOptions =
  | {
      mode?: "mock";
    }
  | {
      mode: "real-fetch";
      fetchTransport: ProvidersReadonlyTransportConfig;
    };

type ProvidersRuntimeSource = Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider">;

export function createProvidersRuntimeDataSource(
  options: ProvidersRuntimeDataSourceOptions = { mode: "mock" },
): ProvidersRuntimeSource {
  if (options.mode === "real-fetch") {
    return createRealProvidersFetchDataSource(options.fetchTransport);
  }

  return mockProvidersReadonlyDataSource;
}

export function getProvidersRuntimeDataSource(
  config?: ProvidersRuntimeConfig,
): ProvidersRuntimeSource {
  return createProvidersRuntimeDataSource(resolveProvidersRuntimeDataSourceOptions(config));
}

export function getProvidersRuntimeDataSourceFromConfigSource(
  source?: ProvidersRuntimeConfigSource,
): ProvidersRuntimeSource {
  return getProvidersRuntimeDataSource(resolveProvidersRuntimeConfigFromSource(source));
}
