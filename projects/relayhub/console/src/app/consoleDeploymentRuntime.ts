import {
  bootstrapConsoleAppRuntime,
} from "./consoleAppRuntime";
import type { ConsoleAppRuntime, ConsoleAppRuntimeOptions } from "./consoleAppRuntime";
import type { ProvidersRuntimeConfig } from "../services/providersRuntimeConfig";
import type { ProvidersRuntimeEnv } from "../services/providersRuntimeEnvConfig";
import type { ProvidersFetchLike } from "../services/realProvidersFetchTransport";

export type ConsoleDeploymentRuntimeInputMode = "default-mock" | "static" | "env";

export type ConsoleDeploymentRuntimeInput =
  | {
      mode?: "default-mock";
    }
  | {
      mode: "static";
      config?: ProvidersRuntimeConfig;
    }
  | {
      mode: "env";
      env: ProvidersRuntimeEnv;
      fetchImpl?: ProvidersFetchLike;
    };

export function resolveConsoleAppRuntimeOptions(
  input: ConsoleDeploymentRuntimeInput = { mode: "default-mock" },
): ConsoleAppRuntimeOptions {
  if (input.mode === "static") {
    return {
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: input.config,
        },
      },
    };
  }

  if (input.mode === "env") {
    return {
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "env",
          env: input.env,
          fetchImpl: input.fetchImpl,
        },
      },
    };
  }

  return {};
}

export function bootstrapConsoleDeploymentRuntime(
  input: ConsoleDeploymentRuntimeInput = { mode: "default-mock" },
): ConsoleAppRuntime {
  return bootstrapConsoleAppRuntime(resolveConsoleAppRuntimeOptions(input));
}
