import {
  getDefaultProvidersBrowserFetch,
} from "./consoleBrowserFetch";
import type { ProvidersBrowserFetch } from "./consoleBrowserFetch";

export interface ProvidersBrowserFetchSource {
  getBrowserFetch: () => ProvidersBrowserFetch | undefined;
}

export const defaultDisabledProvidersBrowserFetchSource: ProvidersBrowserFetchSource = {
  getBrowserFetch: () => undefined,
};

export function createStaticProvidersBrowserFetchSource(
  browserFetch?: ProvidersBrowserFetch,
): ProvidersBrowserFetchSource {
  return {
    getBrowserFetch: () => browserFetch,
  };
}

export function createGlobalProvidersBrowserFetchSource(): ProvidersBrowserFetchSource {
  return {
    getBrowserFetch: () => getDefaultProvidersBrowserFetch(),
  };
}

export function resolveProvidersBrowserFetchFromSource(
  source: ProvidersBrowserFetchSource = defaultDisabledProvidersBrowserFetchSource,
): ProvidersBrowserFetch | undefined {
  return source.getBrowserFetch();
}
