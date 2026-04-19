import type { ConsoleReadonlyDataSource } from "./consoleDataSource";
import {
  getProvidersRuntimeDataSourceFromConfigSource,
} from "./providersRuntimeDataSource";
import {
  createProvidersRuntimeConfigSource,
} from "./providersRuntimeConfigSourceFactory";
import type { ProvidersRuntimeConfigSourceFactoryOptions } from "./providersRuntimeConfigSourceFactory";

type ProvidersRuntimeSource = Pick<ConsoleReadonlyDataSource, "listProviders" | "getProvider">;

// Bootstrap policy:
// - Keep bootstrap as a thin runtime container.
// - New real-fetch trials should prefer explicit sourceFactoryOptions over adding higher-level wrappers here.

export interface ProvidersRuntimeBootstrapOptions {
  sourceFactoryOptions?: ProvidersRuntimeConfigSourceFactoryOptions;
}

export type ProvidersRuntimeBootstrapInputMode =
  | "default-mock"
  | "source-factory-options";

export type ProvidersRuntimeBootstrapInput =
  | {
      mode?: "default-mock";
    }
  | {
      mode: "source-factory-options";
      sourceFactoryOptions?: ProvidersRuntimeConfigSourceFactoryOptions;
    };

export interface ProvidersRuntimeBootstrap {
  providersSource: ProvidersRuntimeSource;
}

export function resolveProvidersRuntimeBootstrapOptions(
  input: ProvidersRuntimeBootstrapInput = { mode: "default-mock" },
): ProvidersRuntimeBootstrapOptions {
  if (input.mode === "source-factory-options") {
    return {
      ...(input.sourceFactoryOptions
        ? { sourceFactoryOptions: input.sourceFactoryOptions }
        : {}),
    };
  }

  return {};
}

export function createProvidersRuntimeBootstrap(
  options: ProvidersRuntimeBootstrapOptions = {},
): ProvidersRuntimeBootstrap {
  return {
    providersSource: getProvidersRuntimeDataSourceFromConfigSource(
      createProvidersRuntimeConfigSource(options.sourceFactoryOptions),
    ),
  };
}

export function createProvidersRuntimeBootstrapFromInput(
  input: ProvidersRuntimeBootstrapInput = { mode: "default-mock" },
): ProvidersRuntimeBootstrap {
  return createProvidersRuntimeBootstrap(resolveProvidersRuntimeBootstrapOptions(input));
}

export function getDefaultProvidersRuntimeBootstrap(): ProvidersRuntimeBootstrap {
  return createProvidersRuntimeBootstrapFromInput();
}
