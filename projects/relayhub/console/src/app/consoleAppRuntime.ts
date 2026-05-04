import type { ConsoleReadonlyDataSource } from "../services/consoleDataSource";
import {
  createConsoleReadonlyDataSource,
  setConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import {
  createProvidersRuntimeBootstrap,
  createProvidersRuntimeBootstrapFromInput,
} from "../services/providersRuntimeBootstrap";
import type {
  ProvidersRuntimeBootstrapInput,
  ProvidersRuntimeBootstrapOptions,
} from "../services/providersRuntimeBootstrap";

export interface ConsoleAppRuntimeOptions {
  providersBootstrapOptions?: ProvidersRuntimeBootstrapOptions;
  providersBootstrapInput?: ProvidersRuntimeBootstrapInput;
}

export interface ConsoleAppRuntime {
  dataSource: ConsoleReadonlyDataSource;
}

export function createConsoleAppRuntime(
  options: ConsoleAppRuntimeOptions = {},
): ConsoleAppRuntime {
  const providersBootstrap = options.providersBootstrapOptions
    ? createProvidersRuntimeBootstrap(options.providersBootstrapOptions)
    : createProvidersRuntimeBootstrapFromInput(
        options.providersBootstrapInput,
      );

  return {
    dataSource: createConsoleReadonlyDataSource({
      providersSource: providersBootstrap.providersSource,
    }),
  };
}

export function bootstrapConsoleAppRuntime(
  options: ConsoleAppRuntimeOptions = {},
): ConsoleAppRuntime {
  const runtime = createConsoleAppRuntime(options);
  setConsoleReadonlyDataSource(runtime.dataSource);
  return runtime;
}

export function getDefaultConsoleAppRuntime(): ConsoleAppRuntime {
  return createConsoleAppRuntime();
}
