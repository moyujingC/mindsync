import {
  createProvidersAuthTokenSource,
  createProvidersAuthTokenSourceFactory,
  resolveProvidersAuthHeadersResolverFromTokenProvider,
  resolveProvidersAuthTokenProviderFromSource,
} from "../services/providersAuthHeaders";
import type {
  ProvidersAuthHeaderResolver,
  ProvidersAuthTokenProvider,
  ProvidersAuthTokenSource,
  ProvidersAuthTokenSourceCompositionOptions,
  ProvidersAuthTokenSourceFactoryOptions,
} from "../services/providersAuthHeaders";

export type ConsoleProvidersTokenDeploymentInputMode =
  | "default-disabled"
  | "provider"
  | "source"
  | "source-factory"
  | "source-composition";

export type ConsoleProvidersTokenDeploymentInput =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "provider";
      authTokenProvider?: ProvidersAuthTokenProvider;
    }
  | {
      mode: "source";
      authTokenSource?: ProvidersAuthTokenSource;
    }
  | {
      mode: "source-factory";
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
    }
  | {
      mode: "source-composition";
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
    };

export function resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(
  input: ConsoleProvidersTokenDeploymentInput = { mode: "default-disabled" },
): ProvidersAuthHeaderResolver | undefined {
  if (input.mode === "provider") {
    return resolveProvidersAuthHeadersResolverFromTokenProvider(input.authTokenProvider);
  }

  if (input.mode === "source") {
    return resolveProvidersAuthHeadersResolverFromTokenProvider(
      resolveProvidersAuthTokenProviderFromSource(input.authTokenSource),
    );
  }

  if (input.mode === "source-factory") {
    return resolveProvidersAuthHeadersResolverFromTokenProvider(
      resolveProvidersAuthTokenProviderFromSource(
        input.authTokenSourceFactoryOptions
          ? createProvidersAuthTokenSource(input.authTokenSourceFactoryOptions)
          : undefined,
      ),
    );
  }

  if (input.mode === "source-composition") {
    return resolveProvidersAuthHeadersResolverFromTokenProvider(
      resolveProvidersAuthTokenProviderFromSource(
        input.authTokenSourceCompositionOptions
          ? createProvidersAuthTokenSourceFactory(input.authTokenSourceCompositionOptions)
          : undefined,
      ),
    );
  }

  return undefined;
}
