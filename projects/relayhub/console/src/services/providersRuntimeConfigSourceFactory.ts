import type { ProvidersRuntimeConfig } from "./providersRuntimeConfig";
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
    };

export function createProvidersRuntimeConfigSource(
  options: ProvidersRuntimeConfigSourceFactoryOptions = { mode: "default-mock" },
): ProvidersRuntimeConfigSource {
  if (options.mode === "static") {
    return createStaticProvidersRuntimeConfigSource(options.config);
  }

  if (options.mode === "env") {
    return createProvidersRuntimeConfigSourceFromEnv(options.env, options.fetchImpl);
  }

  return defaultProvidersRuntimeConfigSource;
}
