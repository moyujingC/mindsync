import {
  bootstrapConsoleAppRuntime,
} from "./consoleAppRuntime";
import {
  resolveProvidersAuthHeadersResolverFromDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import {
  resolveProvidersAuthHeadersResolverFromTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import {
  resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput,
} from "./consoleProvidersSecurityDeployment";
import {
  createProvidersAuthTokenSource,
  createProvidersAuthTokenSourceFactory,
  resolveProvidersAuthHeadersResolverFromTokenProvider,
  resolveProvidersAuthTokenProviderFromSource,
} from "../services/providersAuthHeaders";
import type { ConsoleAppRuntime, ConsoleAppRuntimeOptions } from "./consoleAppRuntime";
import type { ConsoleProvidersAuthDeploymentInput } from "./consoleProvidersAuthDeployment";
import type {
  ConsoleProvidersTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import type {
  ConsoleProvidersSecurityDeploymentInput,
} from "./consoleProvidersSecurityDeployment";
import type {
  ProvidersAuthHeaderResolver,
  ProvidersAuthHeadersSource,
  ProvidersAuthHeadersSourceCompositionOptions,
  ProvidersAuthHeadersSourceFactoryOptions,
  ProvidersAuthTokenProvider,
  ProvidersAuthTokenSourceCompositionOptions,
  ProvidersAuthTokenSource,
  ProvidersAuthTokenSourceFactoryOptions,
} from "../services/providersAuthHeaders";
import type { ProvidersRuntimeConfig } from "../services/providersRuntimeConfig";
import type { ProvidersRuntimeEnv } from "../services/providersRuntimeEnvConfig";
import type { ProvidersFetchLike } from "../services/realProvidersFetchTransport";

// Recommended app entry policy:
// - Preferred deployment trial path is ConsoleDeploymentRuntimeInput.mode = "env".
// - Existing auth/token/security wrappers remain compatibility-only during the current reduction phase.
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
      authHeadersResolver?: ProvidersAuthHeaderResolver;
      authHeadersSource?: ProvidersAuthHeadersSource;
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
      authTokenProvider?: ProvidersAuthTokenProvider;
      authTokenSource?: ProvidersAuthTokenSource;
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
      securityDeploymentInput?: ConsoleProvidersSecurityDeploymentInput;
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
    const authHeadersResolver =
      input.authHeadersResolver ??
      (
        !input.authHeadersSource &&
        !input.authHeadersSourceFactoryOptions &&
        !input.authHeadersSourceCompositionOptions
          ? (
              resolveProvidersAuthHeadersResolverFromDeploymentInput(input.authDeploymentInput) ??
              (
                input.authTokenProvider || input.authTokenSource
                  ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                      input.authTokenProvider ??
                        resolveProvidersAuthTokenProviderFromSource(input.authTokenSource),
                    )
                  : input.authTokenSourceFactoryOptions
                    ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                        resolveProvidersAuthTokenProviderFromSource(
                          createProvidersAuthTokenSource(input.authTokenSourceFactoryOptions),
                        ),
                      )
                  : input.authTokenSourceCompositionOptions
                    ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                        resolveProvidersAuthTokenProviderFromSource(
                          createProvidersAuthTokenSourceFactory(
                            input.authTokenSourceCompositionOptions,
                          ),
                        ),
                      )
                  : resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
                      input.tokenDeploymentInput,
                    ) ??
                    resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput(
                      input.securityDeploymentInput,
                    )
              )
            )
          : undefined
      );
    const sourceFactoryOptions = {
      mode: "env" as const,
      env: input.env,
      fetchImpl: input.fetchImpl,
      ...(authHeadersResolver ? { authHeadersResolver } : {}),
      ...(input.authHeadersSource ? { authHeadersSource: input.authHeadersSource } : {}),
      ...(input.authHeadersSourceFactoryOptions
        ? { authHeadersSourceFactoryOptions: input.authHeadersSourceFactoryOptions }
        : {}),
      ...(input.authHeadersSourceCompositionOptions
        ? { authHeadersSourceCompositionOptions: input.authHeadersSourceCompositionOptions }
        : {}),
    };

    return {
      providersBootstrapOptions: {
        sourceFactoryOptions,
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
