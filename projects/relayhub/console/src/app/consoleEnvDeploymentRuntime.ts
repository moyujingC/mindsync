import {
  bootstrapConsoleDeploymentRuntime,
} from "./consoleDeploymentRuntime";
import type {
  ConsoleDeploymentRuntimeInput,
} from "./consoleDeploymentRuntime";
import type { ConsoleAppRuntime } from "./consoleAppRuntime";
import type { ProvidersAuthHeaderResolver } from "../services/providersAuthHeaders";
import {
  createProvidersBrowserFetchLike,
} from "./consoleBrowserFetch";
import type { ProvidersBrowserFetch } from "./consoleBrowserFetch";
import type { ProvidersFetchLike } from "../services/realProvidersFetchTransport";

export interface ConsoleDeploymentRuntimeEnv {
  readonly RELAYHUB_PROVIDERS_RUNTIME_MODE?: string;
  readonly RELAYHUB_PROVIDERS_READONLY_BASE_URL?: string;
  readonly RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON?: string;
}

export function getDefaultConsoleDeploymentRuntimeEnv(): ConsoleDeploymentRuntimeEnv {
  return import.meta.env;
}

export function resolveConsoleDeploymentRuntimeInputFromEnv(
  env: ConsoleDeploymentRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
  authHeadersResolver?: ProvidersAuthHeaderResolver,
): ConsoleDeploymentRuntimeInput {
  if (env.RELAYHUB_PROVIDERS_RUNTIME_MODE === "mock") {
    return { mode: "default-mock" };
  }

  if (
    env.RELAYHUB_PROVIDERS_RUNTIME_MODE !== "real-fetch" ||
    !env.RELAYHUB_PROVIDERS_READONLY_BASE_URL ||
    !fetchImpl
  ) {
    return { mode: "default-mock" };
  }

  return {
    mode: "env",
    env: {
      RELAYHUB_PROVIDERS_RUNTIME_MODE: env.RELAYHUB_PROVIDERS_RUNTIME_MODE,
      RELAYHUB_PROVIDERS_READONLY_BASE_URL: env.RELAYHUB_PROVIDERS_READONLY_BASE_URL,
      ...(env.RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON
        ? {
            RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
              env.RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON,
          }
        : {}),
    },
    fetchImpl,
    authHeadersResolver,
  };
}

export function bootstrapConsoleEnvDeploymentRuntime(
  env: ConsoleDeploymentRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
  authHeadersResolver?: ProvidersAuthHeaderResolver,
): ConsoleAppRuntime {
  return bootstrapConsoleDeploymentRuntime(
    resolveConsoleDeploymentRuntimeInputFromEnv(
      env,
      fetchImpl,
      authHeadersResolver,
    ),
  );
}

export function bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(
  env: ConsoleDeploymentRuntimeEnv,
  browserFetch?: ProvidersBrowserFetch,
  authHeadersResolver?: ProvidersAuthHeaderResolver,
): ConsoleAppRuntime {
  return bootstrapConsoleEnvDeploymentRuntime(
    env,
    browserFetch ? createProvidersBrowserFetchLike(browserFetch) : undefined,
    authHeadersResolver,
  );
}

export function bootstrapDefaultConsoleEnvDeploymentRuntime(): ConsoleAppRuntime {
  return bootstrapConsoleEnvDeploymentRuntime(getDefaultConsoleDeploymentRuntimeEnv());
}
