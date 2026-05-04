import {
  createProvidersAuthHeadersSource,
  createProvidersAuthHeadersSourceFactory,
  resolveProvidersAuthHeaderResolverFromSource,
} from "../services/providersAuthHeaders";
import type {
  ProvidersAuthHeaderResolver,
  ProvidersAuthHeadersSource,
  ProvidersAuthHeadersSourceCompositionOptions,
  ProvidersAuthHeadersSourceFactoryOptions,
} from "../services/providersAuthHeaders";

export type ConsoleProvidersAuthDeploymentInputMode =
  | "default-disabled"
  | "resolver"
  | "source"
  | "source-factory"
  | "source-composition";

export type ConsoleProvidersAuthDeploymentInput =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "resolver";
      authHeadersResolver?: ProvidersAuthHeaderResolver;
    }
  | {
      mode: "source";
      authHeadersSource?: ProvidersAuthHeadersSource;
    }
  | {
      mode: "source-factory";
      authHeadersSourceFactoryOptions?: ProvidersAuthHeadersSourceFactoryOptions;
    }
  | {
      mode: "source-composition";
      authHeadersSourceCompositionOptions?: ProvidersAuthHeadersSourceCompositionOptions;
    };

export function resolveProvidersAuthHeadersResolverFromDeploymentInput(
  input: ConsoleProvidersAuthDeploymentInput = { mode: "default-disabled" },
): ProvidersAuthHeaderResolver | undefined {
  if (input.mode === "resolver") {
    return input.authHeadersResolver;
  }

  if (input.mode === "source") {
    return resolveProvidersAuthHeaderResolverFromSource(input.authHeadersSource);
  }

  if (input.mode === "source-factory") {
    return resolveProvidersAuthHeaderResolverFromSource(
      input.authHeadersSourceFactoryOptions
        ? createProvidersAuthHeadersSource(input.authHeadersSourceFactoryOptions)
        : undefined,
    );
  }

  if (input.mode === "source-composition") {
    return resolveProvidersAuthHeaderResolverFromSource(
      input.authHeadersSourceCompositionOptions
        ? createProvidersAuthHeadersSourceFactory(input.authHeadersSourceCompositionOptions)
        : undefined,
    );
  }

  return undefined;
}
