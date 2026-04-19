import type { ProvidersFetchLike } from "../services/realProvidersFetchTransport";

interface ProvidersBrowserFetchHeaders {
  forEach?: (callback: (value: string, key: string) => void) => void;
}

interface ProvidersBrowserFetchResponse {
  status: number;
  headers?: ProvidersBrowserFetchHeaders;
  json: () => Promise<unknown>;
}

export type ProvidersBrowserFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  },
) => Promise<ProvidersBrowserFetchResponse>;

export function createProvidersBrowserFetchLike(
  fetchImpl: ProvidersBrowserFetch,
): ProvidersFetchLike {
  return async (input, init) => fetchImpl(input, init);
}

export function getDefaultProvidersBrowserFetch(): ProvidersBrowserFetch | undefined {
  if (typeof globalThis.fetch !== "function") {
    return undefined;
  }

  return async (input, init) => {
    const response = await globalThis.fetch(input, init);

    return {
      status: response.status,
      headers: response.headers,
      json: async () => response.json(),
    };
  };
}
