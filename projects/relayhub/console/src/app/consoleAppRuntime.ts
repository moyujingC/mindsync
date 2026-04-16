import type { ConsoleReadonlyDataSource } from "../services/consoleDataSource";
import {
  createConsoleReadonlyDataSource,
  setConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import {
  createProvidersRuntimeBootstrap,
} from "../services/providersRuntimeBootstrap";
import type {
  ProvidersRuntimeBootstrapOptions,
} from "../services/providersRuntimeBootstrap";

export interface ConsoleAppRuntimeOptions {
  providersBootstrapOptions?: ProvidersRuntimeBootstrapOptions;
}

export interface ConsoleAppRuntime {
  dataSource: ConsoleReadonlyDataSource;
}

export function createConsoleAppRuntime(
  options: ConsoleAppRuntimeOptions = {},
): ConsoleAppRuntime {
  const providersBootstrap = createProvidersRuntimeBootstrap(options.providersBootstrapOptions);

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
