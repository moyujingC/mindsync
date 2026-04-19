import type { ProvidersRuntimeConfig } from "./providersRuntimeConfig";
import {
  createProvidersAuthHeadersSource,
  createProvidersAuthHeadersSourceFactory,
  createProvidersAuthTokenSource,
  createProvidersAuthTokenSourceFactory,
  resolveProvidersAuthHeadersResolverFromTokenProvider,
  resolveProvidersAuthHeaderResolverFromSource,
  resolveProvidersAuthTokenProviderFromSource,
} from "./providersAuthHeaders";
import type {
  ProvidersAuthHeaderResolver,
  ProvidersAuthHeadersSource,
  ProvidersAuthHeadersSourceCompositionOptions,
  ProvidersAuthHeadersSourceFactoryOptions,
  ProvidersAuthTokenProvider,
  ProvidersAuthTokenSourceCompositionOptions,
  ProvidersAuthTokenSource,
  ProvidersAuthTokenSourceFactoryOptions,
} from "./providersAuthHeaders";
import {
  createStaticProvidersRuntimeConfigSource,
  defaultProvidersRuntimeConfigSource,
} from "./providersRuntimeConfigSource";
import type { ProvidersRuntimeConfigSource } from "./providersRuntimeConfigSource";
import {
  createProvidersRuntimeConfigSourceFromEnv,
} from "./providersRuntimeEnvConfig";
import type { ProvidersRuntimeEnv } from "./providersRuntimeEnvConfig";
import type { ProvidersFetchLike } from "./realProvidersFetchTransport";

// Recommended entry policy:
// - Preferred services entry for new Providers runtime wiring is ProvidersRuntimeConfigSourceFactoryOptions.
// - Use mode = "env" or "static" here to drive explicit readonly real-fetch trials from services/runtime.
// - New Input / Option / SourceFactory / CompositionFactory / StartupInput wrappers should not be added
//   unless a real integration trial proves a concrete missing seam.
export type ProvidersRuntimeConfigSourceMode = "default-mock" | "static" | "env";

export type ProvidersRuntimeConfigSourceFactoryOptions =
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
      authTokenProvider?: ProvidersAuthTokenProvider;
      authTokenSource?: ProvidersAuthTokenSource;
      authTokenSourceFactoryOptions?: ProvidersAuthTokenSourceFactoryOptions;
      authTokenSourceCompositionOptions?: ProvidersAuthTokenSourceCompositionOptions;
    };

export function createProvidersRuntimeConfigSource(
  options: ProvidersRuntimeConfigSourceFactoryOptions = { mode: "default-mock" },
): ProvidersRuntimeConfigSource {
  if (options.mode === "static") {
    return createStaticProvidersRuntimeConfigSource(options.config);
  }

  if (options.mode === "env") {
    const authHeadersResolver =
      options.authHeadersResolver ??
      (
        options.authHeadersSource ||
        options.authHeadersSourceFactoryOptions ||
        options.authHeadersSourceCompositionOptions
          ? resolveProvidersAuthHeaderResolverFromSource(
              options.authHeadersSource ??
                (options.authHeadersSourceFactoryOptions
                  ? createProvidersAuthHeadersSource(options.authHeadersSourceFactoryOptions)
                  : options.authHeadersSourceCompositionOptions
                    ? createProvidersAuthHeadersSourceFactory(
                        options.authHeadersSourceCompositionOptions,
                      )
                    : undefined),
            )
          : options.authTokenProvider || options.authTokenSource
            ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                options.authTokenProvider ??
                  resolveProvidersAuthTokenProviderFromSource(options.authTokenSource),
              )
            : options.authTokenSourceFactoryOptions
              ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                  resolveProvidersAuthTokenProviderFromSource(
                    createProvidersAuthTokenSource(options.authTokenSourceFactoryOptions),
                  ),
                )
              : options.authTokenSourceCompositionOptions
                ? resolveProvidersAuthHeadersResolverFromTokenProvider(
                    resolveProvidersAuthTokenProviderFromSource(
                      createProvidersAuthTokenSourceFactory(
                        options.authTokenSourceCompositionOptions,
                      ),
                    ),
                  )
              : undefined
      );

    return createProvidersRuntimeConfigSourceFromEnv(
      options.env,
      options.fetchImpl,
      authHeadersResolver,
    );
  }

  return defaultProvidersRuntimeConfigSource;
}
