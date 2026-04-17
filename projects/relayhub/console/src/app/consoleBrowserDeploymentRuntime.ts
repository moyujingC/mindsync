import type { ConsoleAppRuntime } from "./consoleAppRuntime";
import {
  bootstrapConsoleEnvDeploymentRuntime,
  bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch,
  getDefaultConsoleDeploymentRuntimeEnv,
} from "./consoleEnvDeploymentRuntime";
import {
  resolveProvidersAuthHeadersResolverFromDeploymentInput,
} from "./consoleProvidersAuthDeployment";
import {
  resolveProvidersAuthHeadersResolverFromTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import {
  resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption,
} from "./consoleProvidersAuthBrowserRuntime";
import {
  resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption,
} from "./consoleProvidersTokenBrowserRuntime";
import {
  resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput,
} from "./consoleProvidersSecurityBrowserRuntime";
import {
  createProvidersAuthHeadersSource,
  createProvidersAuthHeadersSourceFactory,
  createProvidersAuthTokenSource,
  createProvidersAuthTokenSourceFactory,
  resolveProvidersAuthHeadersResolverFromTokenProvider,
  resolveProvidersAuthHeaderResolverFromSource,
  resolveProvidersAuthTokenProviderFromSource,
} from "../services/providersAuthHeaders";
import type { ConsoleProvidersAuthDeploymentInput } from "./consoleProvidersAuthDeployment";
import type {
  ConsoleProvidersTokenDeploymentInput,
} from "./consoleProvidersTokenDeployment";
import type {
  ConsoleProvidersAuthBrowserRuntimeOption,
} from "./consoleProvidersAuthBrowserRuntime";
import type {
  ConsoleProvidersTokenBrowserRuntimeOption,
} from "./consoleProvidersTokenBrowserRuntime";
import type {
  ConsoleProvidersSecurityBrowserRuntimeInput,
} from "./consoleProvidersSecurityBrowserRuntime";
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
import {
  createGlobalProvidersBrowserFetchSource,
  defaultDisabledProvidersBrowserFetchSource,
  resolveProvidersBrowserFetchFromSource,
} from "./consoleBrowserFetchSource";
import type { ConsoleDeploymentRuntimeEnv } from "./consoleEnvDeploymentRuntime";
import type { ProvidersBrowserFetch } from "./consoleBrowserFetch";
import type { ProvidersBrowserFetchSource } from "./consoleBrowserFetchSource";

// Recommended app entry policy:
// - Preferred browser trial path is ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"
//   or "browser-fetch-source".
// - Higher-level auth/token/security wrappers stay available for compatibility, not as new default seams.
export type ConsoleBrowserDeploymentRuntimeInputMode =
  | "default-mock"
  | "browser-fetch"
  | "browser-fetch-source"
  | "global-browser-fetch";

export type ConsoleBrowserDeploymentRuntimeInput =
  | {
      mode?: "default-mock";
    }
  | {
      mode: "browser-fetch";
      env: ConsoleDeploymentRuntimeEnv;
      browserFetch?: ProvidersBrowserFetch;
      authHeadersResolver?: ProvidersAuthHeaderResolver;
      authHeadersSource?: ProvidersAuthHeadersSource;
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
      authBrowserRuntimeOption?: ConsoleProvidersAuthBrowserRuntimeOption;
      authTokenProvider?: ProvidersAuthTokenProvider;
      authTokenSource?: ProvidersAuthTokenSource;
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
      tokenBrowserRuntimeOption?: ConsoleProvidersTokenBrowserRuntimeOption;
      securityBrowserRuntimeInput?: ConsoleProvidersSecurityBrowserRuntimeInput;
    }
  | {
      mode: "browser-fetch-source";
      env: ConsoleDeploymentRuntimeEnv;
      browserFetchSource?: ProvidersBrowserFetchSource;
      authHeadersResolver?: ProvidersAuthHeaderResolver;
      authHeadersSource?: ProvidersAuthHeadersSource;
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
      authBrowserRuntimeOption?: ConsoleProvidersAuthBrowserRuntimeOption;
      authTokenProvider?: ProvidersAuthTokenProvider;
      authTokenSource?: ProvidersAuthTokenSource;
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
      tokenBrowserRuntimeOption?: ConsoleProvidersTokenBrowserRuntimeOption;
      securityBrowserRuntimeInput?: ConsoleProvidersSecurityBrowserRuntimeInput;
    }
  | {
      mode: "global-browser-fetch";
      env: ConsoleDeploymentRuntimeEnv;
      authHeadersResolver?: ProvidersAuthHeaderResolver;
      authHeadersSource?: ProvidersAuthHeadersSource;
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
      authDeploymentInput?: ConsoleProvidersAuthDeploymentInput;
      authBrowserRuntimeOption?: ConsoleProvidersAuthBrowserRuntimeOption;
      authTokenProvider?: ProvidersAuthTokenProvider;
      authTokenSource?: ProvidersAuthTokenSource;
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
      tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput;
      tokenBrowserRuntimeOption?: ConsoleProvidersTokenBrowserRuntimeOption;
      securityBrowserRuntimeInput?: ConsoleProvidersSecurityBrowserRuntimeInput;
    };

export interface ConsoleEnvDeploymentRuntimeArgs {
  env: ConsoleDeploymentRuntimeEnv;
  browserFetch?: ProvidersBrowserFetch;
  authHeadersResolver?: ProvidersAuthHeaderResolver;
}

function resolveAuthHeadersResolver(
  authHeadersResolver?: ProvidersAuthHeaderResolver,
  authHeadersSource?: ProvidersAuthHeadersSource,
  authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions,
  authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions,
  authDeploymentInput?: ConsoleProvidersAuthDeploymentInput,
  authBrowserRuntimeOption?: ConsoleProvidersAuthBrowserRuntimeOption,
  authTokenProvider?: ProvidersAuthTokenProvider,
  authTokenSource?: ProvidersAuthTokenSource,
  authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions,
  authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions,
  tokenDeploymentInput?: ConsoleProvidersTokenDeploymentInput,
  tokenBrowserRuntimeOption?: ConsoleProvidersTokenBrowserRuntimeOption,
  securityBrowserRuntimeInput?: ConsoleProvidersSecurityBrowserRuntimeInput,
): ProvidersAuthHeaderResolver | undefined {
  return (
    authHeadersResolver ??
    (
      authHeadersSource ||
      authHeadersSourceFactoryOptions ||
      authHeadersSourceCompositionOptions
        ? resolveProvidersAuthHeaderResolverFromSource(
            authHeadersSource ??
              (authHeadersSourceFactoryOptions
                ? createProvidersAuthHeadersSource(authHeadersSourceFactoryOptions)
                : authHeadersSourceCompositionOptions
                  ? createProvidersAuthHeadersSourceFactory(authHeadersSourceCompositionOptions)
                  : undefined),
          )
        : resolveProvidersAuthHeadersResolverFromDeploymentInput(
            authDeploymentInput ??
              resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption(
                authBrowserRuntimeOption,
              ),
          ) ??
          (
            authTokenProvider || authTokenSource
              ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                  authTokenProvider ??
                    resolveProvidersAuthTokenProviderFromSource(authTokenSource),
                )
              : authTokenSourceFactoryOptions
                ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                    resolveProvidersAuthTokenProviderFromSource(
                      createProvidersAuthTokenSource(authTokenSourceFactoryOptions),
                    ),
                  )
              : authTokenSourceCompositionOptions
                ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                    resolveProvidersAuthTokenProviderFromSource(
                      createProvidersAuthTokenSourceFactory(
                        authTokenSourceCompositionOptions,
                      ),
                    ),
                  )
              : resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
                  tokenDeploymentInput ??
                    resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption(
                      tokenBrowserRuntimeOption,
                    ),
                ) ??
                resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput(
                  securityBrowserRuntimeInput,
                )
          )
    )
  );
}

export function resolveConsoleEnvDeploymentRuntimeArgs(
  input: ConsoleBrowserDeploymentRuntimeInput = { mode: "default-mock" },
): ConsoleEnvDeploymentRuntimeArgs {
  if (input.mode === "browser-fetch") {
    return {
      env: input.env,
      browserFetch: input.browserFetch,
      authHeadersResolver: resolveAuthHeadersResolver(
        input.authHeadersResolver,
        input.authHeadersSource,
        input.authHeadersSourceFactoryOptions,
        input.authHeadersSourceCompositionOptions,
        input.authDeploymentInput,
        input.authBrowserRuntimeOption,
        input.authTokenProvider,
        input.authTokenSource,
        input.authTokenSourceFactoryOptions,
        input.authTokenSourceCompositionOptions,
        input.tokenDeploymentInput,
        input.tokenBrowserRuntimeOption,
        input.securityBrowserRuntimeInput,
      ),
    };
  }

  if (input.mode === "browser-fetch-source") {
    return {
      env: input.env,
      browserFetch: resolveProvidersBrowserFetchFromSource(
        input.browserFetchSource ?? defaultDisabledProvidersBrowserFetchSource,
      ),
      authHeadersResolver: resolveAuthHeadersResolver(
        input.authHeadersResolver,
        input.authHeadersSource,
        input.authHeadersSourceFactoryOptions,
        input.authHeadersSourceCompositionOptions,
        input.authDeploymentInput,
        input.authBrowserRuntimeOption,
        input.authTokenProvider,
        input.authTokenSource,
        input.authTokenSourceFactoryOptions,
        input.authTokenSourceCompositionOptions,
        input.tokenDeploymentInput,
        input.tokenBrowserRuntimeOption,
        input.securityBrowserRuntimeInput,
      ),
    };
  }

  if (input.mode === "global-browser-fetch") {
    return {
      env: input.env,
      browserFetch: resolveProvidersBrowserFetchFromSource(
        createGlobalProvidersBrowserFetchSource(),
      ),
      authHeadersResolver: resolveAuthHeadersResolver(
        input.authHeadersResolver,
        input.authHeadersSource,
        input.authHeadersSourceFactoryOptions,
        input.authHeadersSourceCompositionOptions,
        input.authDeploymentInput,
        input.authBrowserRuntimeOption,
        input.authTokenProvider,
        input.authTokenSource,
        input.authTokenSourceFactoryOptions,
        input.authTokenSourceCompositionOptions,
        input.tokenDeploymentInput,
        input.tokenBrowserRuntimeOption,
        input.securityBrowserRuntimeInput,
      ),
    };
  }

  return {
    env: getDefaultConsoleDeploymentRuntimeEnv(),
  };
}

export function bootstrapConsoleBrowserDeploymentRuntime(
  input: ConsoleBrowserDeploymentRuntimeInput = { mode: "default-mock" },
): ConsoleAppRuntime {
  const args = resolveConsoleEnvDeploymentRuntimeArgs(input);

  if (args.browserFetch) {
    return bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(
      args.env,
      args.browserFetch,
      args.authHeadersResolver,
    );
  }

  return bootstrapConsoleEnvDeploymentRuntime(args.env, undefined, args.authHeadersResolver);
}

export function bootstrapDefaultConsoleBrowserDeploymentRuntime(): ConsoleAppRuntime {
  return bootstrapConsoleBrowserDeploymentRuntime();
}
