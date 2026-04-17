import type { ProvidersReadonlyTransport, ProvidersReadonlyTransportRequest } from "./realProvidersTransport";
import { resolveProvidersAuthHeaders } from "./providersAuthHeaders";
import type { ProvidersAuthHeaderResolver } from "./providersAuthHeaders";

interface ProvidersFetchResponseLike {
  status: number;
  headers?: {
    forEach?: (callback: (value: string, key: string) => void) => void;
  };
  json: () => Promise<unknown>;
}

export type ProvidersFetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  },
) => Promise<ProvidersFetchResponseLike>;

export interface ProvidersReadonlyTransportConfig {
  baseUrl: string;
  fetchImpl: ProvidersFetchLike;
  defaultHeaders?: Record<string, string>;
  authHeadersResolver?: ProvidersAuthHeaderResolver;
}

// Transport error contract:
// - 204 and 404 return null data for datasource-level mapping.
// - other non-2xx statuses throw and do not fallback to mock.
// - auth headers are resolved explicitly; no credential store or env auth lookup happens here.
function joinBaseUrlAndPath(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${path}`;
}

function normalizeHeaders(
  headers?: ProvidersFetchResponseLike["headers"],
): Record<string, string> | undefined {
  if (!headers?.forEach) {
    return undefined;
  }

  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function createRealProvidersFetchTransport(
  config: ProvidersReadonlyTransportConfig,
): ProvidersReadonlyTransport {
  return async (request: ProvidersReadonlyTransportRequest) => {
    if (request.forceError) {
      throw new Error("RelayHub providers fetch transport forced error");
    }

    const authHeaders = await resolveProvidersAuthHeaders(config.authHeadersResolver);
    const requestHeaders =
      config.defaultHeaders || authHeaders
        ? {
            ...(config.defaultHeaders ?? {}),
            ...(authHeaders ?? {}),
          }
        : undefined;

    const response = await config.fetchImpl(joinBaseUrlAndPath(config.baseUrl, request.path), {
      method: "GET",
      headers: requestHeaders,
    });
    const headers = normalizeHeaders(response.headers);

    if (response.status === 204 || response.status === 404) {
      return {
        data: null,
        statusCode: response.status,
        headers,
      };
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`RelayHub providers fetch transport failed with status ${response.status}`);
    }

    try {
      return {
        data: await response.json(),
        statusCode: response.status,
        headers,
      };
    } catch {
      throw new Error("RelayHub providers fetch transport returned invalid JSON");
    }
  };
}
