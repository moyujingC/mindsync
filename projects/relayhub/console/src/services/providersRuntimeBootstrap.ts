import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import {
  getProvidersRuntimeDataSourceFromFactory,
} from "./providersRuntimeDataSource";
import type { ProvidersRuntimeConfigSourceFactoryOptions } from "./providersRuntimeConfigSourceFactory";

type ProvidersRuntimeSource = Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider">;

export interface ProvidersRuntimeBootstrapOptions {
  sourceFactoryOptions?: ProvidersRuntimeConfigSourceFactoryOptions;
}

export interface ProvidersRuntimeBootstrap {
  providersSource: ProvidersRuntimeSource;
}

export function createProvidersRuntimeBootstrap(
  options: ProvidersRuntimeBootstrapOptions = {},
): ProvidersRuntimeBootstrap {
  return {
    providersSource: getProvidersRuntimeDataSourceFromFactory(options.sourceFactoryOptions),
  };
}

export function getDefaultProvidersRuntimeBootstrap(): ProvidersRuntimeBootstrap {
  return createProvidersRuntimeBootstrap();
}
