import {
  getDefaultProvidersRuntimeConfig,
} from "./providersRuntimeConfig";
import type { ProvidersRuntimeConfig } from "./providersRuntimeConfig";
import {
  createStaticProvidersRuntimeConfigSource,
} from "./providersRuntimeConfigSource";
import type { ProvidersRuntimeConfigSource } from "./providersRuntimeConfigSource";
import type { ProvidersFetchLike } from "./realProvidersFetchTransport";

export interface ProvidersRuntimeEnv {
  RELAYHUB_PROVIDERS_RUNTIME_MODE?: string;
  RELAYHUB_PROVIDERS_READONLY_BASE_URL?: string;
  RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON?: string;
}

function isSupportedRuntimeMode(
  value: string | undefined,
): value is NonNullable<ProvidersRuntimeConfig["mode"]> {
  return value === "mock" || value === "real-fetch";
}

function parseDefaultHeaders(
  value: string | undefined,
): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }

    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string",
    );

    return entries.length > 0 ? Object.fromEntries(entries) : {};
  } catch {
    return undefined;
  }
}

export function resolveProvidersRuntimeConfigFromEnv(
  env: ProvidersRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
): ProvidersRuntimeConfig {
  const mode = isSupportedRuntimeMode(env.RELAYHUB_PROVIDERS_RUNTIME_MODE)
    ? env.RELAYHUB_PROVIDERS_RUNTIME_MODE
    : "mock";

  if (mode !== "real-fetch" || !env.RELAYHUB_PROVIDERS_READONLY_BASE_URL || !fetchImpl) {
    return getDefaultProvidersRuntimeConfig();
  }

  const defaultHeaders = parseDefaultHeaders(env.RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON);

  return {
    mode: "real-fetch",
    baseUrl: env.RELAYHUB_PROVIDERS_READONLY_BASE_URL,
    fetchImpl,
    ...(defaultHeaders ? { defaultHeaders } : {}),
  };
}

export function createProvidersRuntimeConfigSourceFromEnv(
  env: ProvidersRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
): ProvidersRuntimeConfigSource {
  return createStaticProvidersRuntimeConfigSource(resolveProvidersRuntimeConfigFromEnv(env, fetchImpl));
}
