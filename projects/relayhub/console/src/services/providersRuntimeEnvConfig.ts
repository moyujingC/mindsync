import {
  getDefaultProvidersRuntimeConfig,
} from "./providersRuntimeConfig";
import type { ProvidersRuntimeConfig } from "./providersRuntimeConfig";
import type { ProvidersAuthHeaderResolver } from "./providersAuthHeaders";
import {
  createStaticProvidersRuntimeConfigSource,
} from "./providersRuntimeConfigSource";
import type { ProvidersRuntimeConfigSource } from "./providersRuntimeConfigSource";
import type { ProvidersFetchLike } from "./realProvidersFetchTransport";

export interface ProvidersRuntimeEnv {
  RELAYHUB_PROVIDERS_RUNTIME_MODE?: string;
  RELAYHUB_PROVIDERS_READONLY_BASE_URL?: string;
  RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON?: string;
  RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT?: string;
}

// Runtime config governance:
// - real-fetch is explicit opt-in via RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch".
// - real-fetch still requires an explicit baseUrl plus fetchImpl; missing either keeps mock.
// - default headers are optional JSON object values; invalid or non-string values are ignored.
// - auth is only accepted as an explicit authHeadersResolver and is not read from env keys.
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

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  } catch {
    return undefined;
  }
}

export function resolveProvidersRuntimeConfigFromEnv(
  env: ProvidersRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
  authHeadersResolver?: ProvidersAuthHeaderResolver,
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
    ...(env.RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT === "openai-models"
      ? { wireContract: "openai-models" as const }
      : {}),
    ...(authHeadersResolver ? { authHeadersResolver } : {}),
  };
}

export function createProvidersRuntimeConfigSourceFromEnv(
  env: ProvidersRuntimeEnv,
  fetchImpl?: ProvidersFetchLike,
  authHeadersResolver?: ProvidersAuthHeaderResolver,
): ProvidersRuntimeConfigSource {
  return createStaticProvidersRuntimeConfigSource(
    resolveProvidersRuntimeConfigFromEnv(env, fetchImpl, authHeadersResolver),
  );
}
