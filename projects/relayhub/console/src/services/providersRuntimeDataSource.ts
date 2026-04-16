import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import { mockProvidersReadonlyDataSource } from "./mockProvidersDataSource";
import { createRealProvidersFetchDataSource } from "./realProvidersDataSource";
import type { ProvidersReadonlyTransportConfig } from "./realProvidersFetchTransport";

export type ProvidersRuntimeMode = "mock" | "real-fetch";

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
  options?: ProvidersRuntimeDataSourceOptions,
): ProvidersRuntimeSource {
  return createProvidersRuntimeDataSource(options);
}
