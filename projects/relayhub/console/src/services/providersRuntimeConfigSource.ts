import {
  getDefaultProvidersRuntimeConfig,
} from "./providersRuntimeConfig";
import type { ProvidersRuntimeConfig } from "./providersRuntimeConfig";

export interface ProvidersRuntimeConfigSource {
  getConfig: () => ProvidersRuntimeConfig;
}

export function createStaticProvidersRuntimeConfigSource(
  config: ProvidersRuntimeConfig = getDefaultProvidersRuntimeConfig(),
): ProvidersRuntimeConfigSource {
  return {
    getConfig: () => config,
  };
}

export const defaultProvidersRuntimeConfigSource = createStaticProvidersRuntimeConfigSource();

export function resolveProvidersRuntimeConfigFromSource(
  source: ProvidersRuntimeConfigSource = defaultProvidersRuntimeConfigSource,
): ProvidersRuntimeConfig {
  return source.getConfig();
}
