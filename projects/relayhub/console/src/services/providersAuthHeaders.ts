export type ProvidersAuthHeaders = Record<string, string>;
export type ProvidersAuthToken = string;
export type ProvidersAuthTokenProvider = () =>
  | ProvidersAuthToken
  | undefined
  | Promise<ProvidersAuthToken | undefined>;

export type ProvidersAuthHeaderResolver = () =>
  | ProvidersAuthHeaders
  | undefined
  | Promise<ProvidersAuthHeaders | undefined>;

export interface ProvidersAuthHeadersSource {
  getAuthHeaders: ProvidersAuthHeaderResolver;
}

export interface ProvidersAuthTokenSource {
  getAuthToken: ProvidersAuthTokenProvider;
}

type ProvidersAuthHeadersGlobalScope = typeof globalThis & {
  __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: ProvidersAuthHeaderResolver;
  __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: ProvidersAuthTokenProvider;
};

export type ProvidersAuthHeadersSourceMode = "default-disabled" | "static" | "global";
export type ProvidersAuthHeadersSourceFactoryMode = "default-disabled" | "static" | "global";
export type ProvidersAuthTokenSourceMode = "default-disabled" | "static" | "global";
export type ProvidersAuthTokenSourceFactoryMode = "default-disabled" | "static" | "global";
export type ProvidersAuthTokenSourceCompositionMode = "default-disabled" | "static" | "global";

export type ProvidersAuthHeadersSourceFactoryOptions =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "static";
      resolver?: ProvidersAuthHeaderResolver;
    }
  | {
      mode: "global";
    };

export type ProvidersAuthHeadersSourceCompositionOptions =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "static";
      resolver?: ProvidersAuthHeaderResolver;
    }
  | {
      mode: "global";
    };

export type ProvidersAuthTokenSourceFactoryOptions =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "static";
      provider?: ProvidersAuthTokenProvider;
    }
  | {
      mode: "global";
    };

export type ProvidersAuthTokenSourceCompositionOptions =
  | {
      mode?: "default-disabled";
    }
  | {
      mode: "static";
      provider?: ProvidersAuthTokenProvider;
    }
  | {
      mode: "global";
    };

export const defaultDisabledProvidersAuthHeadersSource: ProvidersAuthHeadersSource = {
  getAuthHeaders: async () => undefined,
};

export const defaultDisabledProvidersAuthTokenSource: ProvidersAuthTokenSource = {
  getAuthToken: async () => undefined,
};

export function createStaticProvidersAuthHeadersSource(
  resolver?: ProvidersAuthHeaderResolver,
): ProvidersAuthHeadersSource {
  return {
    getAuthHeaders: resolver ?? defaultDisabledProvidersAuthHeadersSource.getAuthHeaders,
  };
}

export function createStaticProvidersAuthTokenSource(
  provider?: ProvidersAuthTokenProvider,
): ProvidersAuthTokenSource {
  return {
    getAuthToken: provider ?? defaultDisabledProvidersAuthTokenSource.getAuthToken,
  };
}

export function getDefaultProvidersAuthHeaderResolver(): ProvidersAuthHeaderResolver | undefined {
  return (globalThis as ProvidersAuthHeadersGlobalScope)
    .__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
}

export function getDefaultProvidersAuthTokenProvider(): ProvidersAuthTokenProvider | undefined {
  return (globalThis as ProvidersAuthHeadersGlobalScope)
    .__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
}

export function createGlobalProvidersAuthHeadersSource(): ProvidersAuthHeadersSource {
  return {
    getAuthHeaders: async () => {
      const resolver = getDefaultProvidersAuthHeaderResolver();
      return resolver ? resolver() : undefined;
    },
  };
}

export function createGlobalProvidersAuthTokenSource(): ProvidersAuthTokenSource {
  return {
    getAuthToken: async () => {
      const provider = getDefaultProvidersAuthTokenProvider();
      return provider ? provider() : undefined;
    },
  };
}

export function createProvidersAuthHeadersSource(
  options: ProvidersAuthHeadersSourceFactoryOptions = { mode: "default-disabled" },
): ProvidersAuthHeadersSource {
  if (options.mode === "static") {
    return createStaticProvidersAuthHeadersSource(options.resolver);
  }

  if (options.mode === "global") {
    return createGlobalProvidersAuthHeadersSource();
  }

  return defaultDisabledProvidersAuthHeadersSource;
}

export function createProvidersAuthHeadersSourceFactory(
  options: ProvidersAuthHeadersSourceCompositionOptions = { mode: "default-disabled" },
): ProvidersAuthHeadersSource {
  if (options.mode === "static") {
    return createStaticProvidersAuthHeadersSource(options.resolver);
  }

  if (options.mode === "global") {
    return createGlobalProvidersAuthHeadersSource();
  }

  return defaultDisabledProvidersAuthHeadersSource;
}

export function createProvidersAuthTokenSource(
  options: ProvidersAuthTokenSourceFactoryOptions = { mode: "default-disabled" },
): ProvidersAuthTokenSource {
  if (options.mode === "static") {
    return createStaticProvidersAuthTokenSource(options.provider);
  }

  if (options.mode === "global") {
    return createGlobalProvidersAuthTokenSource();
  }

  return defaultDisabledProvidersAuthTokenSource;
}

export function createProvidersAuthTokenSourceFactory(
  options: ProvidersAuthTokenSourceCompositionOptions = { mode: "default-disabled" },
): ProvidersAuthTokenSource {
  if (options.mode === "static") {
    return createStaticProvidersAuthTokenSource(options.provider);
  }

  if (options.mode === "global") {
    return createGlobalProvidersAuthTokenSource();
  }

  return defaultDisabledProvidersAuthTokenSource;
}

export function resolveProvidersAuthTokenProviderFromSource(
  source: ProvidersAuthTokenSource = defaultDisabledProvidersAuthTokenSource,
): ProvidersAuthTokenProvider | undefined {
  return source.getAuthToken;
}

export function resolveProvidersAuthHeadersResolverFromTokenProvider(
  provider?: ProvidersAuthTokenProvider,
  headerName = "authorization",
): ProvidersAuthHeaderResolver | undefined {
  if (!provider) {
    return undefined;
  }

  return async () => {
    const token = await provider();

    if (!token) {
      return undefined;
    }

    return {
      [headerName]: token,
    };
  };
}

export function resolveProvidersAuthHeaderResolverFromSource(
  source: ProvidersAuthHeadersSource = defaultDisabledProvidersAuthHeadersSource,
): ProvidersAuthHeaderResolver | undefined {
  return source.getAuthHeaders;
}

export async function resolveProvidersAuthHeaders(
  resolver?: ProvidersAuthHeaderResolver,
): Promise<ProvidersAuthHeaders | undefined> {
  if (!resolver) {
    return undefined;
  }

  return resolver();
}
