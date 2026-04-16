import type { ProvidersReadonlyTransport, ProvidersReadonlyTransportRequest } from "./realProvidersTransport";

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
}

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

    const response = await config.fetchImpl(joinBaseUrlAndPath(config.baseUrl, request.path), {
      method: "GET",
      headers: config.defaultHeaders,
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
