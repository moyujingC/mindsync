import { afterEach, describe, expect, it } from "vitest";
import {
  bootstrapConsoleBrowserDeploymentRuntime,
  resolveConsoleEnvDeploymentRuntimeArgs,
} from "../app/consoleBrowserDeploymentRuntime";
import {
  createProvidersBrowserFetchLike,
  getDefaultProvidersBrowserFetch,
} from "../app/consoleBrowserFetch";
import {
  createGlobalProvidersBrowserFetchSource,
  createStaticProvidersBrowserFetchSource,
  defaultDisabledProvidersBrowserFetchSource,
  resolveProvidersBrowserFetchFromSource,
} from "../app/consoleBrowserFetchSource";
import {
  bootstrapConsoleAppRuntime,
  createConsoleAppRuntime,
  getDefaultConsoleAppRuntime,
} from "../app/consoleAppRuntime";
import {
  bootstrapConsoleDeploymentRuntime,
  resolveConsoleAppRuntimeOptions,
} from "../app/consoleDeploymentRuntime";
import {
  resolveProvidersAuthHeadersResolverFromDeploymentInput,
} from "../app/consoleProvidersAuthDeployment";
import {
  resolveProvidersAuthHeadersResolverFromTokenDeploymentInput,
} from "../app/consoleProvidersTokenDeployment";
import {
  resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption,
} from "../app/consoleProvidersAuthBrowserRuntime";
import {
  resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption,
} from "../app/consoleProvidersTokenBrowserRuntime";
import {
  bootstrapConsoleEnvDeploymentRuntime,
  bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch,
  bootstrapDefaultConsoleEnvDeploymentRuntime,
  resolveConsoleDeploymentRuntimeInputFromEnv,
} from "../app/consoleEnvDeploymentRuntime";
import {
  createProvidersAuthHeadersSource,
  createProvidersAuthHeadersSourceFactory,
  createProvidersAuthTokenSource,
  createProvidersAuthTokenSourceFactory,
  createGlobalProvidersAuthHeadersSource,
  createGlobalProvidersAuthTokenSource,
  createStaticProvidersAuthHeadersSource,
  createStaticProvidersAuthTokenSource,
  defaultDisabledProvidersAuthHeadersSource,
  defaultDisabledProvidersAuthTokenSource,
  getDefaultProvidersAuthHeaderResolver,
  getDefaultProvidersAuthTokenProvider,
  resolveProvidersAuthHeadersResolverFromTokenProvider,
  resolveProvidersAuthHeaderResolverFromSource,
  resolveProvidersAuthTokenProviderFromSource,
} from "../services/providersAuthHeaders";
import {
  getDashboardOverviewRaw,
  getEnvironmentRaw,
  getEvalOverviewRaw,
  getProviderRaw,
  listProvidersRaw,
} from "../services/consoleData";
import {
  createConsoleReadonlyDataSource,
  defaultConsoleReadonlyDataSource,
  mockProvidersReadonlyDataSource,
  resetConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import {
  createProvidersRuntimeBootstrap,
  createProvidersRuntimeBootstrapFromInput,
  getDefaultProvidersRuntimeBootstrap,
  resolveProvidersRuntimeBootstrapOptions,
} from "../services/providersRuntimeBootstrap";
import {
  createProvidersRuntimeDataSource,
  getProvidersRuntimeDataSource,
  getProvidersRuntimeDataSourceFromConfigSource,
  getProvidersRuntimeDataSourceFromFactory,
} from "../services/providersRuntimeDataSource";
import {
  getDefaultProvidersRuntimeConfig,
  resolveProvidersRuntimeDataSourceOptions,
} from "../services/providersRuntimeConfig";
import {
  createStaticProvidersRuntimeConfigSource,
  defaultProvidersRuntimeConfigSource,
  resolveProvidersRuntimeConfigFromSource,
} from "../services/providersRuntimeConfigSource";
import {
  createProvidersRuntimeConfigSource,
} from "../services/providersRuntimeConfigSourceFactory";
import {
  createProvidersRuntimeConfigSourceFromEnv,
  resolveProvidersRuntimeConfigFromEnv,
} from "../services/providersRuntimeEnvConfig";
import {
  adaptProviderDetailWirePayload,
  adaptProvidersCollectionWirePayload,
} from "../services/realProvidersAdapter";
import { createRealProvidersFetchTransport } from "../services/realProvidersFetchTransport";
import {
  buildProviderDetailPath,
  buildProvidersCollectionPath,
  createRealProvidersFetchDataSource,
  createRealProvidersReadonlyDataSource,
  realProvidersReadonlyDataSourceStub,
} from "../services/realProvidersDataSource";
import type {
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
  ProviderDetailContract,
} from "../contracts";
import type { ProvidersReadonlyTransportRequest } from "../services/realProvidersTransport";
import {
  createProvidersReadonlyCollectionEmptyPayload,
  createProvidersReadonlyCollectionSuccessPayload,
  createProvidersReadonlyDetailNotFoundPayload,
  createProvidersReadonlyDetailSuccessPayload,
  createProvidersReadonlyJsonResponse,
  PROVIDERS_READONLY_TRIAL_BASE_URL,
} from "./providersReadonlyContractFixtures";

describe("console readonly data source", () => {
  afterEach(() => {
    resetConsoleReadonlyDataSource();
  });

  it("returns dashboard contract response from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.getDashboardOverview();
    const typedResponse: DashboardOverviewContract = response;

    expect(typedResponse.meta.resource).toBe("dashboard");
    expect(typedResponse.meta.scope).toBe("overview");
    expect(typedResponse.overview.environments.length).toBeGreaterThan(0);
  });

  it("returns environments collection contract response from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.listEnvironments();
    const typedResponse: EnvironmentCollectionContract = response;

    expect(typedResponse.meta.resource).toBe("environments");
    expect(typedResponse.items.length).toBeGreaterThan(0);
  });

  it("returns not-found environment detail from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.getEnvironment("missing-environment");
    const typedResponse: EnvironmentDetailContract = response;

    expect(typedResponse.item).toBeNull();
    expect(typedResponse.meta.status).toBe("not-found");
  });

  it("preserves provider filter snapshot on default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });
    const typedResponse: ProviderCollectionContract = response;

    expect(typedResponse.meta.filters).toEqual({
      kind: "国产模型",
      environment: "评测版",
    });
  });

  it("returns empty provider collection status from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.listProviders({
      kind: "免费国外 API",
      environment: "心理疗愈生产版",
    });
    const typedResponse: ProviderCollectionContract = response;

    expect(typedResponse.items).toHaveLength(0);
    expect(typedResponse.meta.status).toBe("empty");
  });

  it("returns not-found provider detail from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.getProvider("missing-provider");
    const typedResponse: ProviderDetailContract = response;

    expect(typedResponse.item).toBeNull();
    expect(typedResponse.meta.status).toBe("not-found");
  });

  it("supports the recommended deployment env real-fetch smoke path", async () => {
    const requests: Array<{
      input: string;
      headers?: Record<string, string>;
    }> = [];
    const providerId = "provider-real-smoke";
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: PROVIDERS_READONLY_TRIAL_BASE_URL,
      },
      fetchImpl: async (input, init) => {
        requests.push({
          input,
          headers: init?.headers,
        });

        if (input.endsWith("/providers")) {
          return createProvidersReadonlyJsonResponse(
            200,
            createProvidersReadonlyCollectionSuccessPayload({
              id: providerId,
              name: "Providers Real Smoke",
              recommendation: "用于验证推荐入口",
            }),
          );
        }

        if (input.endsWith(`/providers/${providerId}`)) {
          return createProvidersReadonlyJsonResponse(
            200,
            createProvidersReadonlyDetailSuccessPayload({
              id: providerId,
              name: "Providers Real Smoke",
              description: "推荐 deployment env 入口 smoke test",
              recommendation: "用于验证推荐入口",
            }),
          );
        }

        return createProvidersReadonlyJsonResponse(404, null);
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer deployment-smoke",
      }),
    });

    const collection = await runtime.dataSource.listProviders();
    const detail = await runtime.dataSource.getProvider(providerId);
    const notFound = await runtime.dataSource.getProvider("missing-provider");

    expect(collection.items[0]?.id).toBe(providerId);
    expect(detail.item?.id).toBe(providerId);
    expect(notFound.item).toBeNull();
    expect(notFound.meta.status).toBe("not-found");
    expect(requests[0]?.headers).toEqual({
      authorization: "Bearer deployment-smoke",
    });
    expect(requests[0]?.input).toBe(`${PROVIDERS_READONLY_TRIAL_BASE_URL}/providers`);
    expect(requests[1]?.input).toBe(`${PROVIDERS_READONLY_TRIAL_BASE_URL}/providers/${providerId}`);
  });

  it("supports the recommended browser-fetch real-fetch smoke path with default and auth headers", async () => {
    const requests: Array<{
      input: string;
      headers?: Record<string, string>;
    }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: PROVIDERS_READONLY_TRIAL_BASE_URL,
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: "{\"x-env\":\"browser-smoke\"}",
      },
      browserFetch: async (input, init) => {
        requests.push({
          input,
          headers: init?.headers,
        });

        if (input.endsWith("/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B")) {
          return createProvidersReadonlyJsonResponse(
            200,
            createProvidersReadonlyCollectionSuccessPayload({
              id: "provider-browser-smoke",
              name: "Providers Browser Smoke",
              availableEnvironments: ["开发版"],
              p95Latency: 280,
              recommendation: "用于验证 browser 推荐入口",
            }),
          );
        }

        return createProvidersReadonlyJsonResponse(500, { message: "server error" });
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer browser-smoke",
      }),
    });

    const collection = await runtime.dataSource.listProviders({ kind: "国产模型" });

    await expect(runtime.dataSource.getProvider("provider-browser-smoke")).rejects.toThrow(
      "RelayHub providers fetch transport failed with status 500",
    );

    expect(collection.items[0]?.id).toBe("provider-browser-smoke");
    expect(requests[0]?.headers).toEqual({
      "x-env": "browser-smoke",
      authorization: "Bearer browser-smoke",
    });
    expect(requests[0]?.input).toBe(
      `${PROVIDERS_READONLY_TRIAL_BASE_URL}/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B`,
    );
  });

  it("supports the recommended browser-fetch-source real-fetch smoke path", async () => {
    const calls: Array<{
      input: string;
      init?: { method?: string; headers?: Record<string, string> };
    }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: PROVIDERS_READONLY_TRIAL_BASE_URL,
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: "{\"x-env\":\"browser-source-smoke\"}",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer browser-source-smoke",
      }),
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });

        if (input.endsWith("/providers")) {
          return createProvidersReadonlyJsonResponse(
            200,
            createProvidersReadonlyCollectionSuccessPayload({
              id: "provider-browser-source-smoke",
              name: "Providers Browser Source Smoke",
              recommendation: "用于验证 browser-fetch-source 推荐入口",
            }),
          );
        }

        if (input.endsWith("/providers/provider-browser-source-smoke")) {
          return createProvidersReadonlyJsonResponse(
            200,
            createProvidersReadonlyDetailSuccessPayload({
              id: "provider-browser-source-smoke",
              name: "Providers Browser Source Smoke",
              description: "推荐 browser-fetch-source 入口 smoke test",
              recommendation: "用于验证 browser-fetch-source 推荐入口",
            }),
          );
        }

        return createProvidersReadonlyJsonResponse(404, null);
      }),
    });

    const collection = await runtime.dataSource.listProviders();
    const detail = await runtime.dataSource.getProvider("provider-browser-source-smoke");
    const notFound = await runtime.dataSource.getProvider("missing-provider");

    expect(collection.items[0]?.id).toBe("provider-browser-source-smoke");
    expect(detail.item?.id).toBe("provider-browser-source-smoke");
    expect(notFound.item).toBeNull();
    expect(notFound.meta.status).toBe("not-found");
    expect(calls[0]).toEqual({
      input: `${PROVIDERS_READONLY_TRIAL_BASE_URL}/providers`,
      init: {
        method: "GET",
        headers: {
          "x-env": "browser-source-smoke",
          authorization: "Bearer browser-source-smoke",
        },
      },
    });
    expect(calls[1]?.input).toBe(
      `${PROVIDERS_READONLY_TRIAL_BASE_URL}/providers/provider-browser-source-smoke`,
    );
  });

  it("returns eval overview contract response from default datasource", async () => {
    const response = await defaultConsoleReadonlyDataSource.getEvalOverview();
    const typedResponse: EvalOverviewContract = response;

    expect(typedResponse.meta.resource).toBe("eval");
    expect(typedResponse.overview.recommendations.length).toBeGreaterThan(0);
  });

  it("keeps mock providers behavior in the default datasource factory", async () => {
    const datasource = createConsoleReadonlyDataSource();
    const response = await datasource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("returns mock providers source from the default runtime bootstrap", async () => {
    const bootstrap = getDefaultProvidersRuntimeBootstrap();
    const response = await bootstrap.providersSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("creates a providers runtime bootstrap with default mock behavior", async () => {
    const bootstrap = createProvidersRuntimeBootstrap();
    const response = await bootstrap.providersSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("resolves default runtime bootstrap input into default mock bootstrap options", () => {
    expect(resolveProvidersRuntimeBootstrapOptions()).toEqual({});
  });

  it("resolves source-factory-options bootstrap input into bootstrap options", () => {
    expect(
      resolveProvidersRuntimeBootstrapOptions({
        mode: "source-factory-options",
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "mock",
          },
        },
      }),
    ).toEqual({
      sourceFactoryOptions: {
        mode: "static",
        config: {
          mode: "mock",
        },
      },
    });
  });

  it("creates a providers runtime bootstrap from the default bootstrap input with mock behavior", async () => {
    const bootstrap = createProvidersRuntimeBootstrapFromInput();
    const response = await bootstrap.providersSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("returns mock providers from the default console app runtime", async () => {
    const runtime = getDefaultConsoleAppRuntime();
    const response = await runtime.dataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("creates a console app runtime with default mock behavior", async () => {
    const runtime = createConsoleAppRuntime();
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a console app runtime with default mock behavior from bootstrap input", async () => {
    const runtime = createConsoleAppRuntime({
      providersBootstrapInput: {
        mode: "default-mock",
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("resolves default deployment input into default console app runtime options", () => {
    expect(resolveConsoleAppRuntimeOptions()).toEqual({});
  });

  it("keeps default-mock deployment input equivalent to mock providers behavior", async () => {
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "default-mock",
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("resolves missing env deployment input to default-mock", () => {
    expect(resolveConsoleDeploymentRuntimeInputFromEnv({})).toEqual({
      mode: "default-mock",
    });
  });

  it("resolves mock env deployment input to default-mock", () => {
    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "mock",
      }),
    ).toEqual({
      mode: "default-mock",
    });
  });

  it("resolves invalid env runtime mode to default-mock", () => {
    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "bad-mode",
      }),
    ).toEqual({
      mode: "default-mock",
    });
  });

  it("resolves real-fetch env without baseUrl to default-mock", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "default-mock",
    });
  });

  it("resolves real-fetch env without fetchImpl to default-mock", () => {
    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      }),
    ).toEqual({
      mode: "default-mock",
    });
  });

  it("resolves real-fetch env into env deployment input", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
            '{"x-relayhub-scope":"providers-readonly"}',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
          '{"x-relayhub-scope":"providers-readonly"}',
      },
      fetchImpl,
    });
  });

  it("carries auth header resolver through env deployment input resolution", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });
    const authHeadersResolver = async () => ({
      authorization: "Bearer runtime-token",
    });

    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl,
        authHeadersResolver,
      ),
    ).toEqual({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl,
      authHeadersResolver,
    });
  });

  it("carries explicit auth header resolver through env deployment input resolution", async () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });
    const authHeadersResolver = async () => ({
      authorization: "Bearer startup-env-input-token",
    });

    const input = resolveConsoleDeploymentRuntimeInputFromEnv(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl,
      authHeadersResolver,
    );

    expect(input.mode).toBe("env");
    await expect(
      input.mode === "env" ? input.authHeadersResolver?.() : undefined,
    ).resolves.toEqual({
      authorization: "Bearer startup-env-input-token",
    });
  });

  it("resolves default browser deployment runtime input args without browser fetch", () => {
    const args = resolveConsoleEnvDeploymentRuntimeArgs();

    expect(args.browserFetch).toBeUndefined();
    expect(args.env).toBeDefined();
  });

  it("keeps default-mock browser deployment runtime equivalent to mock providers behavior", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "default-mock",
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("returns undefined from the default disabled browser fetch source", () => {
    expect(defaultDisabledProvidersBrowserFetchSource.getBrowserFetch()).toBeUndefined();
  });

  it("returns undefined when resolving without a browser fetch source", () => {
    expect(resolveProvidersBrowserFetchFromSource()).toBeUndefined();
  });

  it("returns undefined from the default disabled auth headers source", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      defaultDisabledProvidersAuthHeadersSource,
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns explicit resolver from a static auth headers source", async () => {
    const source = createStaticProvidersAuthHeadersSource(async () => ({
      authorization: "Bearer source-token",
    }));
    const resolver = resolveProvidersAuthHeaderResolverFromSource(source);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer source-token",
    });
  });

  it("returns undefined from a static auth headers source without resolver", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createStaticProvidersAuthHeadersSource(),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns disabled auth headers source from the default auth source factory", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSource(),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("keeps default-disabled auth source factory equivalent to disabled source", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSource({
        mode: "default-disabled",
      }),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns explicit resolver from a static auth source factory", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSource({
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer factory-token",
        }),
      }),
    );

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer factory-token",
    });
  });

  it("returns disabled-equivalent auth source from a static auth source factory without resolver", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSource({
        mode: "static",
      }),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("does not expose a global auth header resolver by default", () => {
    expect(getDefaultProvidersAuthHeaderResolver()).toBeUndefined();
  });

  it("returns headers from an explicitly created global auth headers source", async () => {
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer global-source-token",
    });

    try {
      const resolver = resolveProvidersAuthHeaderResolverFromSource(
        createGlobalProvidersAuthHeadersSource(),
      );

      await expect(resolver?.()).resolves.toEqual({
        authorization: "Bearer global-source-token",
      });
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("returns undefined from global auth headers source without global resolver", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createGlobalProvidersAuthHeadersSource(),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("does not expose a global auth token provider by default", () => {
    expect(getDefaultProvidersAuthTokenProvider()).toBeUndefined();
  });

  it("returns undefined from the default disabled auth token source", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      defaultDisabledProvidersAuthTokenSource,
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns explicit provider from a static auth token source", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createStaticProvidersAuthTokenSource(async () => "Bearer token-source-token"),
    );

    await expect(provider?.()).resolves.toBe("Bearer token-source-token");
  });

  it("returns undefined from a static auth token source without provider", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createStaticProvidersAuthTokenSource(),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns token from an explicitly created global auth token source", async () => {
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-token-provider-token";

    try {
      const provider = resolveProvidersAuthTokenProviderFromSource(
        createGlobalProvidersAuthTokenSource(),
      );

      await expect(provider?.()).resolves.toBe("Bearer global-token-provider-token");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("returns undefined from global auth token source without global provider", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createGlobalProvidersAuthTokenSource(),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns disabled token source from the default token source factory", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSource(),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("keeps default-disabled token source factory equivalent to disabled token source", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSource({
        mode: "default-disabled",
      }),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns explicit provider from a static token source factory", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSource({
        mode: "static",
        provider: async () => "Bearer token-source-factory-token",
      }),
    );

    await expect(provider?.()).resolves.toBe("Bearer token-source-factory-token");
  });

  it("returns disabled-equivalent token source from a static token source factory without provider", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSource({
        mode: "static",
      }),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns token from global token source factory mode", async () => {
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-token-source-factory-token";

    try {
      const provider = resolveProvidersAuthTokenProviderFromSource(
        createProvidersAuthTokenSource({
          mode: "global",
        }),
      );

      await expect(provider?.()).resolves.toBe("Bearer global-token-source-factory-token");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("returns disabled token source from the default token source composition factory", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSourceFactory(),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("keeps default-disabled token source composition factory equivalent to disabled token source", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSourceFactory({
        mode: "default-disabled",
      }),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns explicit provider from a static token source composition factory", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSourceFactory({
        mode: "static",
        provider: async () => "Bearer token-source-composition-token",
      }),
    );

    await expect(provider?.()).resolves.toBe("Bearer token-source-composition-token");
  });

  it("returns disabled-equivalent token source from a static token source composition factory without provider", async () => {
    const provider = resolveProvidersAuthTokenProviderFromSource(
      createProvidersAuthTokenSourceFactory({
        mode: "static",
      }),
    );

    await expect(provider?.()).resolves.toBeUndefined();
  });

  it("returns token from global token source composition factory mode", async () => {
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-token-source-composition-token";

    try {
      const provider = resolveProvidersAuthTokenProviderFromSource(
        createProvidersAuthTokenSourceFactory({
          mode: "global",
        }),
      );

      await expect(provider?.()).resolves.toBe("Bearer global-token-source-composition-token");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("returns undefined from the default token deployment input", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenDeploymentInput();

    expect(resolver).toBeUndefined();
  });

  it("returns headers from provider token deployment input mode", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenDeploymentInput({
      mode: "provider",
      authTokenProvider: async () => "Bearer token-deployment-provider-token",
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer token-deployment-provider-token",
    });
  });

  it("returns headers from source token deployment input mode", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenDeploymentInput({
      mode: "source",
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer token-deployment-source-token",
      ),
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer token-deployment-source-token",
    });
  });

  it("returns headers from source-factory token deployment input mode", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenDeploymentInput({
      mode: "source-factory",
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer token-deployment-source-factory-token",
      },
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer token-deployment-source-factory-token",
    });
  });

  it("returns headers from source-composition token deployment input mode", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenDeploymentInput({
      mode: "source-composition",
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer token-deployment-source-composition-token",
      },
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer token-deployment-source-composition-token",
    });
  });

  it("returns undefined from the default token browser runtime option", () => {
    expect(resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption()).toBeUndefined();
  });

  it("maps provider token browser runtime option into token deployment input", () => {
    expect(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption({
        mode: "provider",
        authTokenProvider: async () => "Bearer token-browser-provider-token",
      }),
    ).toEqual({
      mode: "provider",
      authTokenProvider: expect.any(Function),
    });
  });

  it("maps source token browser runtime option into token deployment input", () => {
    const authTokenSource = createStaticProvidersAuthTokenSource(
      async () => "Bearer token-browser-source-token",
    );

    expect(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption({
        mode: "source",
        authTokenSource,
      }),
    ).toEqual({
      mode: "source",
      authTokenSource,
    });
  });

  it("maps source-factory token browser runtime option into token deployment input", () => {
    expect(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption({
        mode: "source-factory",
        authTokenSourceFactoryOptions: {
          mode: "static",
          provider: async () => "Bearer token-browser-source-factory-token",
        },
      }),
    ).toEqual({
      mode: "source-factory",
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: expect.any(Function),
      },
    });
  });

  it("maps source-composition token browser runtime option into token deployment input", () => {
    expect(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption({
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer token-browser-source-composition-token",
        },
      }),
    ).toEqual({
      mode: "source-composition",
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: expect.any(Function),
      },
    });
  });

  it("passes through deployment-input token browser runtime option", () => {
    const tokenDeploymentInput = {
      mode: "source-composition" as const,
      authTokenSourceCompositionOptions: {
        mode: "static" as const,
        provider: async () => "Bearer token-browser-deployment-input-token",
      },
    };

    expect(
      resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption({
        mode: "deployment-input",
        tokenDeploymentInput,
      }),
    ).toEqual(tokenDeploymentInput);
  });

  it("maps auth token provider into auth headers resolver", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenProvider(async () =>
      "Bearer token-provider-token",
    );

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer token-provider-token",
    });
  });

  it("keeps auth token provider equivalent to no auth when token is undefined", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromTokenProvider(async () => undefined);

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns headers from global auth source factory mode", async () => {
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer global-factory-mode-token",
    });

    try {
      const resolver = resolveProvidersAuthHeaderResolverFromSource(
        createProvidersAuthHeadersSource({
          mode: "global",
        }),
      );

      await expect(resolver?.()).resolves.toEqual({
        authorization: "Bearer global-factory-mode-token",
      });
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("returns disabled source from the default auth source composition factory", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSourceFactory(),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("keeps default-disabled auth source composition factory equivalent to disabled source", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSourceFactory({
        mode: "default-disabled",
      }),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns explicit resolver from a static auth source composition factory", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSourceFactory({
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-factory-token",
        }),
      }),
    );

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer composition-factory-token",
    });
  });

  it("returns disabled-equivalent source from a static auth source composition factory without resolver", async () => {
    const resolver = resolveProvidersAuthHeaderResolverFromSource(
      createProvidersAuthHeadersSourceFactory({
        mode: "static",
      }),
    );

    await expect(resolver?.()).resolves.toBeUndefined();
  });

  it("returns headers from global auth source composition factory mode", async () => {
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer global-composition-token",
    });

    try {
      const resolver = resolveProvidersAuthHeaderResolverFromSource(
        createProvidersAuthHeadersSourceFactory({
          mode: "global",
        }),
      );

      await expect(resolver?.()).resolves.toEqual({
        authorization: "Bearer global-composition-token",
      });
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("resolves default providers auth deployment input to undefined", () => {
    expect(resolveProvidersAuthHeadersResolverFromDeploymentInput()).toBeUndefined();
  });

  it("resolves providers auth deployment resolver input", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput({
      mode: "resolver",
      authHeadersResolver: async () => ({
        authorization: "Bearer deployment-resolver-token",
      }),
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer deployment-resolver-token",
    });
  });

  it("resolves providers auth deployment source input", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput({
      mode: "source",
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer deployment-source-input-token",
      })),
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer deployment-source-input-token",
    });
  });

  it("resolves providers auth deployment source factory input", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput({
      mode: "source-factory",
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer deployment-source-factory-input-token",
        }),
      },
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer deployment-source-factory-input-token",
    });
  });

  it("resolves providers auth deployment source composition input", async () => {
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput({
      mode: "source-composition",
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer deployment-source-composition-input-token",
        }),
      },
    });

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer deployment-source-composition-input-token",
    });
  });

  it("resolves default providers auth browser runtime option to undefined", () => {
    expect(resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption()).toBeUndefined();
  });

  it("resolves providers auth browser runtime resolver option", async () => {
    const deploymentInput = resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption({
      mode: "resolver",
      authHeadersResolver: async () => ({
        authorization: "Bearer browser-runtime-resolver-token",
      }),
    });
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput(deploymentInput);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer browser-runtime-resolver-token",
    });
  });

  it("resolves providers auth browser runtime source option", async () => {
    const deploymentInput = resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption({
      mode: "source",
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer browser-runtime-source-token",
      })),
    });
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput(deploymentInput);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer browser-runtime-source-token",
    });
  });

  it("resolves providers auth browser runtime source factory option", async () => {
    const deploymentInput = resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption({
      mode: "source-factory",
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-runtime-source-factory-token",
        }),
      },
    });
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput(deploymentInput);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer browser-runtime-source-factory-token",
    });
  });

  it("resolves providers auth browser runtime source composition option", async () => {
    const deploymentInput = resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption({
      mode: "source-composition",
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-runtime-source-composition-token",
        }),
      },
    });
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput(deploymentInput);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer browser-runtime-source-composition-token",
    });
  });

  it("passes through providers auth browser runtime deployment input option", async () => {
    const deploymentInput = resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption({
      mode: "deployment-input",
      authDeploymentInput: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer browser-runtime-deployment-input-token",
        }),
      },
    });
    const resolver = resolveProvidersAuthHeadersResolverFromDeploymentInput(deploymentInput);

    await expect(resolver?.()).resolves.toEqual({
      authorization: "Bearer browser-runtime-deployment-input-token",
    });
  });

  it("returns explicit browser fetch from a static browser fetch source", async () => {
    const browserFetch = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(resolveProvidersBrowserFetchFromSource(createStaticProvidersBrowserFetchSource(browserFetch))).toBe(
      browserFetch,
    );
  });

  it("returns undefined from a static browser fetch source without browser fetch", () => {
    expect(resolveProvidersBrowserFetchFromSource(createStaticProvidersBrowserFetchSource())).toBeUndefined();
  });

  it("adapts browser fetch calls into ProvidersFetchLike", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const fetchLike = createProvidersBrowserFetchLike(async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: {
          forEach(callback) {
            callback("application/json", "content-type");
          },
        },
        json: async () => ({ items: [] }),
      };
    });

    const response = await fetchLike("https://relayhub.internal/api/providers", {
      method: "GET",
      headers: {
        "x-relayhub-scope": "providers-readonly",
      },
    });

    expect(calls).toEqual([
      {
        input: "https://relayhub.internal/api/providers",
        init: {
          method: "GET",
          headers: {
            "x-relayhub-scope": "providers-readonly",
          },
        },
      },
    ]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
  });

  it("exposes the default providers browser fetch adapter when global fetch exists", () => {
    expect(getDefaultProvidersBrowserFetch()).toBeTypeOf("function");
  });

  it("keeps invalid default headers JSON in env deployment input unresolved at this layer", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '{"x-relayhub-scope":',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '{"x-relayhub-scope":',
      },
      fetchImpl,
    });
  });

  it("keeps non-object default headers JSON in env deployment input unresolved at this layer", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveConsoleDeploymentRuntimeInputFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '["x-relayhub-scope"]',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '["x-relayhub-scope"]',
      },
      fetchImpl,
    });
  });

  it("returns mock providers source from the default runtime seam", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSource();
    const response = await runtimeDataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("uses browser fetch injection to bootstrap real-fetch env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
          '{"x-relayhub-scope":"providers-readonly"}',
      },
      async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-browser-fetch-real-fetch",
                name: "Provider Browser Fetch Real Fetch",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "browser fetch env bootstrap payload",
                recommendation: "适合作为 browser fetch 注入验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "browser-fetch-model", useCase: "browser fetch seam" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        };
      },
    );

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-browser-fetch-real-fetch");
    expect(response.meta.status).toBe("ready");
  });

  it("uses auth header resolver with env deployment runtime browser fetch injection", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
          '{"x-relayhub-scope":"providers-readonly"}',
      },
      async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [],
          }),
        };
      },
      async () => ({
        authorization: "Bearer env-browser-token",
      }),
    );

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
          authorization: "Bearer env-browser-token",
        },
      },
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses explicit auth header resolver with env deployment runtime browser fetch injection", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [],
          }),
        };
      },
      async () => ({
        authorization: "Bearer env-browser-auth-resolver-token",
      }),
    );

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          authorization: "Bearer env-browser-auth-resolver-token",
        },
      },
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses explicit auth header resolver with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleEnvDeploymentRuntime(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      async () => ({
        authorization: "Bearer explicit-startup-resolver-wins",
      }),
    );

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer explicit-startup-resolver-wins",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source with env deployment runtime browser fetch injection", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer deployment-source-token",
      })),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer deployment-source-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source factory options with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer deployment-factory-token",
        }),
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer deployment-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses global auth headers source factory mode with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer env-global-auth-token",
    });

    try {
      const runtime = bootstrapConsoleDeploymentRuntime({
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl: async (input, init) => {
          calls.push({ input, init });
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
        authHeadersSourceFactoryOptions: {
          mode: "global",
        },
      });

      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer env-global-auth-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("uses auth headers source composition options with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer deployment-composition-token",
        }),
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer deployment-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth deployment input with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authDeploymentInput: {
        mode: "source-composition",
        authHeadersSourceCompositionOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer env-auth-deployment-token",
          }),
        },
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-auth-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token provider with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authTokenProvider: async () => "Bearer env-token-provider-token",
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-token-provider-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer env-token-source-token",
      ),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-token-source-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source factory options with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer env-token-source-factory-token",
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-token-source-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source composition options with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer env-token-source-composition-token",
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-token-source-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token deployment input with env deployment runtime", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];

    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer env-token-deployment-token",
        },
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer env-token-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("falls back to mock when env deployment runtime browser fetch injection is missing", async () => {
    const runtime = bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch({
      RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
      RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("uses browser runtime input source to bootstrap real-fetch providers", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
          '{"x-relayhub-scope":"providers-readonly"}',
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-browser-runtime-source",
                name: "Provider Browser Runtime Source",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "browser runtime input source payload",
                recommendation: "适合作为 browser runtime input source 验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "browser-runtime-model", useCase: "browser runtime input source" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-browser-runtime-source");
    expect(response.meta.status).toBe("ready");
  });

  it("uses auth header resolver with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer browser-runtime-token",
      }),
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-runtime-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer browser-source-token",
      })),
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-source-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source factory options with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-factory-token",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses global auth headers source factory mode with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer browser-global-auth-token",
    });

    try {
      const runtime = bootstrapConsoleBrowserDeploymentRuntime({
        mode: "browser-fetch",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        authHeadersSourceFactoryOptions: {
          mode: "global",
        },
        browserFetch: async (input, init) => {
          calls.push({ input, init });
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
      });

      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer browser-global-auth-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("uses auth headers source composition options with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-composition-token",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth deployment input with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authDeploymentInput: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer browser-auth-deployment-token",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-auth-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth browser runtime option with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authBrowserRuntimeOption: {
        mode: "source-composition",
        authHeadersSourceCompositionOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer browser-runtime-option-token",
          }),
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-runtime-option-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token provider with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenProvider: async () => "Bearer browser-token-provider-token",
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-token-provider-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source factory options with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer browser-token-source-factory-token",
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-token-source-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source composition options with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer browser-token-source-composition-token",
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-token-source-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token deployment input with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer browser-token-deployment-token",
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-token-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token browser runtime option with browser-fetch runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenBrowserRuntimeOption: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer browser-token-browser-option-token",
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-token-browser-option-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("falls back to mock when browser runtime input source omits browser fetch", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("uses browser fetch source mode to bootstrap real-fetch providers", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
          '{"x-relayhub-scope":"providers-readonly"}',
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-browser-fetch-source",
                name: "Provider Browser Fetch Source",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "browser fetch source seam payload",
                recommendation: "适合作为 browser fetch source seam 验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "browser-fetch-source-model", useCase: "browser fetch source seam" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(calls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-browser-fetch-source");
    expect(response.meta.status).toBe("ready");
  });

  it("uses auth header resolver with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer browser-fetch-source-token",
      }),
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer browser-fetch-source-auth-token",
      })),
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-auth-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth headers source factory options with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-fetch-source-factory-token",
        }),
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses global auth headers source factory mode with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer browser-fetch-source-global-auth-token",
    });

    try {
      const runtime = bootstrapConsoleBrowserDeploymentRuntime({
        mode: "browser-fetch-source",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        authHeadersSourceFactoryOptions: {
          mode: "global",
        },
        browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
          calls.push({ input, init });
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        }),
      });

      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer browser-fetch-source-global-auth-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("uses auth headers source composition options with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer browser-fetch-source-composition-token",
        }),
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth deployment input with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authDeploymentInput: {
        mode: "source-factory",
        authHeadersSourceFactoryOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer browser-fetch-source-auth-deployment-token",
          }),
        },
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-auth-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth browser runtime option with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authBrowserRuntimeOption: {
        mode: "source-factory",
        authHeadersSourceFactoryOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer browser-fetch-source-runtime-option-token",
          }),
        },
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-runtime-option-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer browser-fetch-source-token-provider-token",
      ),
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token-provider-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source factory options with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer browser-fetch-source-token-source-factory-token",
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token-source-factory-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth token source composition options with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer browser-fetch-source-token-source-composition-token",
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token-source-composition-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token deployment input with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer browser-fetch-source-token-deployment-token",
        },
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token-deployment-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token browser runtime option with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenBrowserRuntimeOption: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer browser-fetch-source-token-browser-option-token",
        },
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer browser-fetch-source-token-browser-option-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses auth browser runtime option with browser-fetch-source runtime input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authBrowserRuntimeOption: {
        mode: "source-composition",
        authHeadersSourceCompositionOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer security-browser-fetch-source-token",
          }),
        },
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      }),
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer security-browser-fetch-source-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("uses token deployment input with global-browser-fetch runtime input", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{
      input: string;
      init?: { method?: string; headers?: Record<string, string> };
    }> = [];

    globalThis.fetch = (async (input, init) => {
      calls.push({
        input: String(input),
        init: init as { method?: string; headers?: Record<string, string> } | undefined,
      });

      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const runtime = bootstrapConsoleBrowserDeploymentRuntime({
        mode: "global-browser-fetch",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        tokenDeploymentInput: {
          mode: "source-composition",
          authTokenSourceCompositionOptions: {
            mode: "static",
            provider: async () => "Bearer security-global-browser-fetch-token",
          },
        },
      });

      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer security-global-browser-fetch-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("falls back to mock when browser fetch source mode resolves to undefined", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch-source",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      browserFetchSource: createStaticProvidersBrowserFetchSource(),
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("uses global browser fetch runtime option to bootstrap real-fetch providers", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({
      status: 200,
      headers: new Headers(),
      json: async () => ({ items: [] }),
    })) as unknown as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
    });
    try {
      const response = await runtime.dataSource.listProviders();

      expect(response.items).toHaveLength(0);
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses auth header resolver with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer global-browser-token",
      }),
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses auth headers source with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer global-auth-source-token",
      })),
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-auth-source-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses auth headers source factory options with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer global-factory-token",
        }),
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-factory-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses global auth headers source factory mode with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => ({
      authorization: "Bearer global-browser-global-auth-token",
    });
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "global",
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-global-auth-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("uses auth headers source composition options with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer global-browser-composition-token",
        }),
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-composition-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses auth deployment input with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authDeploymentInput: {
        mode: "source",
        authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
          authorization: "Bearer global-browser-auth-deployment-token",
        })),
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-auth-deployment-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses auth browser runtime option with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authBrowserRuntimeOption: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer global-browser-runtime-option-token",
        }),
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-runtime-option-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses global auth token source with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-browser-token-provider-token";
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSource: createGlobalProvidersAuthTokenSource(),
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token-provider-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("uses auth token source factory options with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-browser-token-source-factory-token";
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceFactoryOptions: {
        mode: "global",
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token-source-factory-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("uses auth token source composition options with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-browser-token-source-composition-token";
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceCompositionOptions: {
        mode: "global",
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token-source-composition-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("uses token deployment input with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-browser-token-deployment-token";
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "global",
        },
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token-deployment-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("uses token browser runtime option with global browser fetch runtime option", async () => {
    const originalFetch = globalThis.fetch;
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () =>
      "Bearer global-browser-token-browser-option-token";
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return {
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    }) as typeof fetch;

    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenBrowserRuntimeOption: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "global",
        },
      },
    });

    try {
      const response = await runtime.dataSource.listProviders();

      expect(calls[0]?.init?.headers).toEqual({
        authorization: "Bearer global-browser-token-browser-option-token",
      });
      expect(response.meta.status).toBe("empty");
    } finally {
      globalThis.fetch = originalFetch;
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("falls back to mock when global browser fetch runtime option lacks baseUrl", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("falls back to mock when global browser fetch runtime option receives invalid env mode", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "global-browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "bad-mode",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps env auth resolver on mock when fetchImpl is missing", async () => {
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer should-not-run",
      }),
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("treats disabled auth headers source like no auth resolver", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authHeadersSource: defaultDisabledProvidersAuthHeadersSource,
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toBeUndefined();
    expect(response.meta.status).toBe("empty");
  });

  it("keeps explicit auth resolver precedence over auth headers source", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer explicit-resolver-token",
      }),
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer source-should-not-win",
      })),
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer explicit-resolver-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth headers source precedence over auth headers source factory options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer source-wins-over-factory",
      })),
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer factory-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer source-wins-over-factory",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps explicit auth resolver precedence over auth source factory options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer explicit-over-factory",
      }),
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer factory-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer explicit-over-factory",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("treats disabled auth source factory like no auth resolver", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
      authHeadersSourceFactoryOptions: {
        mode: "default-disabled",
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toBeUndefined();
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth source factory options precedence over auth source composition options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer factory-wins-over-composition",
        }),
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer factory-wins-over-composition",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth source precedence over auth source composition options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSource: createStaticProvidersAuthHeadersSource(async () => ({
        authorization: "Bearer source-wins-over-composition",
      })),
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer source-wins-over-composition",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps explicit auth resolver precedence over auth source composition options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer resolver-wins-over-composition",
      }),
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer resolver-wins-over-composition",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth source composition options precedence over auth deployment input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-wins-over-deployment",
        }),
      },
      authDeploymentInput: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer deployment-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer composition-wins-over-deployment",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth deployment input precedence over auth browser runtime option", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authDeploymentInput: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer deployment-wins-over-browser-option",
        }),
      },
      authBrowserRuntimeOption: {
        mode: "resolver",
        authHeadersResolver: async () => ({
          authorization: "Bearer browser-option-should-not-win",
        }),
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer deployment-wins-over-browser-option",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth headers resolver precedence over auth token provider and auth token source", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer explicit-resolver-over-token",
      }),
      authTokenProvider: async () => "Bearer token-provider-should-not-win",
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer token-source-should-not-win",
      ),
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer explicit-resolver-over-token",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth headers source composition precedence over auth token provider", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceCompositionOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer composition-over-token-provider",
        }),
      },
      authTokenProvider: async () => "Bearer token-provider-should-not-win",
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer composition-over-token-provider",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth token provider precedence over auth token source", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenProvider: async () => "Bearer token-provider-wins",
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer token-source-should-not-win",
      ),
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer token-provider-wins",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth token source precedence over auth token source factory options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSource: createStaticProvidersAuthTokenSource(
        async () => "Bearer token-source-wins-over-factory",
      ),
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer token-source-factory-should-not-win",
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer token-source-wins-over-factory",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth token source factory options precedence over auth token source composition options", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceFactoryOptions: {
        mode: "static",
        provider: async () => "Bearer token-source-factory-wins-over-composition",
      },
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer token-source-composition-should-not-win",
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer token-source-factory-wins-over-composition",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps auth token source composition options precedence over token deployment input", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authTokenSourceCompositionOptions: {
        mode: "static",
        provider: async () => "Bearer token-source-composition-wins-over-deployment",
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer token-deployment-should-not-win",
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer token-source-composition-wins-over-deployment",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("keeps token deployment input precedence over token browser runtime option", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      tokenDeploymentInput: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer token-deployment-wins-over-browser-option",
        },
      },
      tokenBrowserRuntimeOption: {
        mode: "source-composition",
        authTokenSourceCompositionOptions: {
          mode: "static",
          provider: async () => "Bearer token-browser-option-should-not-win",
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer token-deployment-wins-over-browser-option",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("rethrows global auth token provider errors", async () => {
    const originalProvider = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__;
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = async () => {
      throw new Error("global token unavailable");
    };

    try {
      const runtime = bootstrapConsoleBrowserDeploymentRuntime({
        mode: "browser-fetch",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        authTokenSource: createGlobalProvidersAuthTokenSource(),
        browserFetch: async () => ({
          status: 200,
          json: async () => ({ items: [] }),
        }),
      });

      await expect(runtime.dataSource.listProviders()).rejects.toThrow("global token unavailable");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__?: () => Promise<string | undefined>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_TOKEN_PROVIDER__ = originalProvider;
    }
  });

  it("keeps lower-level auth inputs precedence over auth browser runtime option", async () => {
    const calls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersSourceFactoryOptions: {
        mode: "static",
        resolver: async () => ({
          authorization: "Bearer lower-level-factory-wins",
        }),
      },
      authBrowserRuntimeOption: {
        mode: "source-composition",
        authHeadersSourceCompositionOptions: {
          mode: "static",
          resolver: async () => ({
            authorization: "Bearer browser-option-should-not-win",
          }),
        },
      },
      browserFetch: async (input, init) => {
        calls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders();

    expect(calls[0]?.init?.headers).toEqual({
      authorization: "Bearer lower-level-factory-wins",
    });
    expect(response.meta.status).toBe("empty");
  });

  it("rethrows global auth resolver errors from auth source factory mode", async () => {
    const originalResolver = (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__;
    (
      globalThis as typeof globalThis & {
        __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
      }
    ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = async () => {
      throw new Error("global auth unavailable");
    };

    try {
      const runtime = bootstrapConsoleBrowserDeploymentRuntime({
        mode: "browser-fetch",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        authHeadersSourceFactoryOptions: {
          mode: "global",
        },
        browserFetch: async () => ({
          status: 200,
          json: async () => ({ items: [] }),
        }),
      });

      await expect(runtime.dataSource.listProviders()).rejects.toThrow("global auth unavailable");
    } finally {
      (
        globalThis as typeof globalThis & {
          __RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__?: () => Promise<Record<string, string>>;
        }
      ).__RELAYHUB_PROVIDERS_AUTH_HEADERS_RESOLVER__ = originalResolver;
    }
  });

  it("rethrows auth resolver errors from runtime injected browser fetch providers", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      authHeadersResolver: async () => {
        throw new Error("runtime auth unavailable");
      },
      browserFetch: async () => ({
        status: 200,
        json: async () => ({ items: [] }),
      }),
    });

    await expect(runtime.dataSource.listProviders()).rejects.toThrow("runtime auth unavailable");
  });

  it("reads global browser fetch only when global source is explicitly used", async () => {
    const browserFetch = resolveProvidersBrowserFetchFromSource(
      createGlobalProvidersBrowserFetchSource(),
    );

    expect(browserFetch).toBeTypeOf("function");
    expect(getDefaultProvidersBrowserFetch()).toBeTypeOf("function");
  });

  it("falls back to mock when browser runtime input source receives invalid env mode", async () => {
    const runtime = bootstrapConsoleBrowserDeploymentRuntime({
      mode: "browser-fetch",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "bad-mode",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      browserFetch: async () => ({
        status: 200,
        json: async () => ({ items: [] }),
      }),
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("resolves the default providers runtime config to mock", () => {
    expect(getDefaultProvidersRuntimeConfig()).toEqual({
      mode: "mock",
    });

    expect(resolveProvidersRuntimeDataSourceOptions(getDefaultProvidersRuntimeConfig())).toEqual({
      mode: "mock",
    });
  });

  it("resolves the default providers runtime config source to mock", () => {
    expect(resolveProvidersRuntimeConfigFromSource(defaultProvidersRuntimeConfigSource)).toEqual({
      mode: "mock",
    });
  });

  it("creates the default providers runtime config source from the factory", () => {
    expect(resolveProvidersRuntimeConfigFromSource(createProvidersRuntimeConfigSource())).toEqual({
      mode: "mock",
    });
  });

  it("creates a default-mock providers runtime config source from the factory", () => {
    expect(
      resolveProvidersRuntimeConfigFromSource(
        createProvidersRuntimeConfigSource({
          mode: "default-mock",
        }),
      ),
    ).toEqual({
      mode: "mock",
    });
  });

  it("returns mock providers source from the default runtime config source factory", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromFactory();
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("resolves missing runtime env to mock config", () => {
    expect(resolveProvidersRuntimeConfigFromEnv({})).toEqual({
      mode: "mock",
    });
  });

  it("resolves mock runtime env to mock config", () => {
    expect(
      resolveProvidersRuntimeConfigFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "mock",
      }),
    ).toEqual({
      mode: "mock",
    });
  });

  it("resolves invalid runtime env mode to mock config", () => {
    expect(
      resolveProvidersRuntimeConfigFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "bad-mode",
      }),
    ).toEqual({
      mode: "mock",
    });
  });

  it("resolves real-fetch runtime env without baseUrl to mock config", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveProvidersRuntimeConfigFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "mock",
    });
  });

  it("resolves real-fetch runtime env without fetchImpl to mock config", () => {
    expect(
      resolveProvidersRuntimeConfigFromEnv({
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      }),
    ).toEqual({
      mode: "mock",
    });
  });

  it("resolves real-fetch runtime env into config with default headers", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveProvidersRuntimeConfigFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
            '{"x-relayhub-scope":"providers-readonly"}',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      fetchImpl,
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
    });
  });

  it("ignores invalid default headers JSON in runtime env", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveProvidersRuntimeConfigFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '{"x-relayhub-scope":',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      fetchImpl,
    });
  });

  it("ignores non-object default headers JSON in runtime env", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveProvidersRuntimeConfigFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: '["x-relayhub-scope"]',
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      fetchImpl,
    });
  });

  it("ignores empty default headers JSON in runtime env", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveProvidersRuntimeConfigFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON: "{}",
        },
        fetchImpl,
      ),
    ).toEqual({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      fetchImpl,
    });
  });

  it("returns mock providers source when runtime mode is mock", async () => {
    const runtimeDataSource = createProvidersRuntimeDataSource({
      mode: "mock",
    });
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("returns mock providers source when runtime config mode is mock", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSource({
      mode: "mock",
    });
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("returns mock providers source from the default runtime config source seam", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromConfigSource();
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps the default runtime bootstrap routed through the runtime config source seam", async () => {
    const bootstrap = createProvidersRuntimeBootstrap();
    const sourceDataSource = getProvidersRuntimeDataSourceFromConfigSource();

    const [bootstrapResponse, sourceResponse] = await Promise.all([
      bootstrap.providersSource.getProvider("deepseek-direct"),
      sourceDataSource.getProvider("deepseek-direct"),
    ]);

    expect(bootstrapResponse.item?.id).toBe(sourceResponse.item?.id);
    expect(bootstrapResponse.meta.status).toBe(sourceResponse.meta.status);
  });

  it("returns mock providers source from a static mock runtime config source", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromConfigSource(
      createStaticProvidersRuntimeConfigSource({
        mode: "mock",
      }),
    );
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a static mock runtime config source from the factory", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromFactory({
      mode: "static",
      config: {
        mode: "mock",
      },
    });
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a providers runtime bootstrap with static mock options", async () => {
    const bootstrap = createProvidersRuntimeBootstrap({
      sourceFactoryOptions: {
        mode: "static",
        config: {
          mode: "mock",
        },
      },
    });
    const response = await bootstrap.providersSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a providers runtime bootstrap from bootstrap input with static mock options", async () => {
    const bootstrap = createProvidersRuntimeBootstrapFromInput({
      mode: "source-factory-options",
      sourceFactoryOptions: {
        mode: "static",
        config: {
          mode: "mock",
        },
      },
    });
    const response = await bootstrap.providersSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a console app runtime with static mock providers options", async () => {
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "mock",
          },
        },
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a console app runtime with static mock providers bootstrap input", async () => {
    const runtime = createConsoleAppRuntime({
      providersBootstrapInput: {
        mode: "source-factory-options",
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "mock",
          },
        },
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps providers bootstrap options higher priority than providers bootstrap input", async () => {
    const fetchCalls: string[] = [];
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async (input) => {
              fetchCalls.push(input);
              return {
                status: 200,
                json: async () => ({ items: [] }),
              };
            },
          },
        },
      },
      providersBootstrapInput: {
        mode: "source-factory-options",
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "mock",
          },
        },
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("resolves static deployment input into console app runtime options", () => {
    expect(
      resolveConsoleAppRuntimeOptions({
        mode: "static",
        config: {
          mode: "mock",
        },
      }),
    ).toEqual({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "mock",
          },
        },
      },
    });
  });

  it("resolves real-fetch providers runtime config into datasource options", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });
    const options = resolveProvidersRuntimeDataSourceOptions({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      fetchImpl,
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
    });

    expect(options).toEqual({
      mode: "real-fetch",
      fetchTransport: {
        baseUrl: "https://relayhub.internal/api",
        fetchImpl,
        defaultHeaders: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
  });

  it("switches providers runtime seam to real-fetch when requested", async () => {
    const runtimeDataSource = createProvidersRuntimeDataSource({
      mode: "real-fetch",
      fetchTransport: {
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async () => ({
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-runtime-real-fetch",
                name: "Provider Runtime Real Fetch",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "runtime seam real-fetch payload",
                recommendation: "适合作为 runtime seam 验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "runtime-real-model", useCase: "runtime seam" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        }),
      },
    });

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(response.items[0]?.id).toBe("provider-runtime-real-fetch");
    expect(response.meta.status).toBe("ready");
  });

  it("switches providers runtime config to real-fetch when requested", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtimeDataSource = getProvidersRuntimeDataSource({
      mode: "real-fetch",
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-runtime-config-real-fetch",
                name: "Provider Runtime Config Real Fetch",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "runtime config real-fetch payload",
                recommendation: "适合作为 runtime config 验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "runtime-config-real-model", useCase: "runtime config seam" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        };
      },
    });

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-runtime-config-real-fetch");
    expect(response.meta.status).toBe("ready");
  });

  it("switches providers runtime config source to real-fetch when requested", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtimeDataSource = getProvidersRuntimeDataSourceFromConfigSource(
      createStaticProvidersRuntimeConfigSource({
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        defaultHeaders: {
          "x-relayhub-scope": "providers-readonly",
        },
        fetchImpl: async (input, init) => {
          fetchCalls.push({ input, init });
          return {
            status: 200,
            json: async () => ({
              items: [
                {
                  id: "provider-runtime-config-source-real-fetch",
                  name: "Provider Runtime Config Source Real Fetch",
                  kind: "国产模型",
                  availableEnvironments: ["评测版"],
                  health: "healthy",
                  transparency: "完整",
                  errorRate: 0.2,
                  p95Latency: 610,
                  description: "runtime config source real-fetch payload",
                  recommendation: "适合作为 runtime config source 验证样本",
                  recommendationNote: "仅用于测试",
                  models: [{ name: "runtime-config-source-model", useCase: "runtime config source seam" }],
                  metrics: {
                    requests: 22,
                    tokens: 4800,
                    avgLatency: 340,
                    p95Latency: 610,
                    errorRate: 0.2,
                    cost: 4,
                  },
                },
              ],
            }),
          };
        },
      }),
    );

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-runtime-config-source-real-fetch");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a static real-fetch runtime config source from the factory", async () => {
    const fetchCalls: string[] = [];
    const runtimeDataSource = getProvidersRuntimeDataSourceFromFactory({
      mode: "static",
      config: {
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async (input) => {
          fetchCalls.push(input);
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
      },
    });

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a providers runtime bootstrap with static real-fetch options", async () => {
    const fetchCalls: string[] = [];
    const bootstrap = createProvidersRuntimeBootstrap({
      sourceFactoryOptions: {
        mode: "static",
        config: {
          mode: "real-fetch",
          baseUrl: "https://relayhub.internal/api",
          fetchImpl: async (input) => {
            fetchCalls.push(input);
            return {
              status: 200,
              json: async () => ({ items: [] }),
            };
          },
        },
      },
    });

    const response = await bootstrap.providersSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a providers runtime bootstrap from bootstrap input with static real-fetch options", async () => {
    const fetchCalls: string[] = [];
    const bootstrap = createProvidersRuntimeBootstrapFromInput({
      mode: "source-factory-options",
      sourceFactoryOptions: {
        mode: "static",
        config: {
          mode: "real-fetch",
          baseUrl: "https://relayhub.internal/api",
          fetchImpl: async (input) => {
            fetchCalls.push(input);
            return {
              status: 200,
              json: async () => ({ items: [] }),
            };
          },
        },
      },
    });

    const response = await bootstrap.providersSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a console app runtime with static real-fetch providers options", async () => {
    const fetchCalls: string[] = [];
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async (input) => {
              fetchCalls.push(input);
              return {
                status: 200,
                json: async () => ({ items: [] }),
              };
            },
          },
        },
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("maps static deployment input to static real-fetch providers behavior", async () => {
    const fetchCalls: string[] = [];
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "static",
      config: {
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async (input) => {
          fetchCalls.push(input);
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a runtime config source from env that can switch to real-fetch", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const runtimeDataSource = getProvidersRuntimeDataSourceFromConfigSource(
      createProvidersRuntimeConfigSourceFromEnv(
        {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON:
            '{"x-relayhub-scope":"providers-readonly"}',
        },
        async (input, init) => {
          fetchCalls.push({ input, init });
          return {
            status: 200,
            json: async () => ({
              items: [
                {
                  id: "provider-runtime-env-config-real-fetch",
                  name: "Provider Runtime Env Config Real Fetch",
                  kind: "国产模型",
                  availableEnvironments: ["评测版"],
                  health: "healthy",
                  transparency: "完整",
                  errorRate: 0.2,
                  p95Latency: 610,
                  description: "runtime env config real-fetch payload",
                  recommendation: "适合作为 runtime env config 验证样本",
                  recommendationNote: "仅用于测试",
                  models: [{ name: "runtime-env-config-model", useCase: "runtime env config seam" }],
                  metrics: {
                    requests: 22,
                    tokens: 4800,
                    avgLatency: 340,
                    p95Latency: 610,
                    errorRate: 0.2,
                    cost: 4,
                  },
                },
              ],
            }),
          };
        },
      ),
    );

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.items[0]?.id).toBe("provider-runtime-env-config-real-fetch");
    expect(response.meta.status).toBe("ready");
  });

  it("creates an env real-fetch runtime config source from the factory", async () => {
    const fetchCalls: string[] = [];
    const runtimeDataSource = getProvidersRuntimeDataSourceFromFactory({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input) => {
        fetchCalls.push(input);
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtimeDataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a providers runtime bootstrap with env real-fetch options", async () => {
    const fetchCalls: string[] = [];
    const bootstrap = createProvidersRuntimeBootstrap({
      sourceFactoryOptions: {
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl: async (input) => {
          fetchCalls.push(input);
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
      },
    });

    const response = await bootstrap.providersSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a providers runtime bootstrap from bootstrap input with env real-fetch options", async () => {
    const fetchCalls: string[] = [];
    const bootstrap = createProvidersRuntimeBootstrapFromInput({
      mode: "source-factory-options",
      sourceFactoryOptions: {
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl: async (input) => {
          fetchCalls.push(input);
          return {
            status: 200,
            json: async () => ({ items: [] }),
          };
        },
      },
    });

    const response = await bootstrap.providersSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates a console app runtime with env real-fetch providers options", async () => {
    const fetchCalls: string[] = [];
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "env",
          env: {
            RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
            RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          },
          fetchImpl: async (input) => {
            fetchCalls.push(input);
            return {
              status: 200,
              json: async () => ({ items: [] }),
            };
          },
        },
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("resolves env deployment input into console app runtime options", () => {
    const fetchImpl = async () => ({
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(
      resolveConsoleAppRuntimeOptions({
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl,
      }),
    ).toEqual({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "env",
          env: {
            RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
            RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
          },
          fetchImpl,
        },
      },
    });
  });

  it("maps env deployment input to env real-fetch providers behavior", async () => {
    const fetchCalls: string[] = [];
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      fetchImpl: async (input) => {
        fetchCalls.push(input);
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await runtime.dataSource.listProviders({ kind: "国产模型" });

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(response.meta.status).toBe("empty");
  });

  it("creates an env runtime config source that falls back to mock when required fields are missing", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromFactory({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
      },
    });
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a providers runtime bootstrap that falls back to mock for incomplete env options", async () => {
    const bootstrap = createProvidersRuntimeBootstrap({
      sourceFactoryOptions: {
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        },
      },
    });
    const response = await bootstrap.providersSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("creates a console app runtime that falls back to mock for incomplete env options", async () => {
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "env",
          env: {
            RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          },
        },
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps incomplete env deployment input on mock behavior", async () => {
    const runtime = bootstrapConsoleDeploymentRuntime({
      mode: "env",
      env: {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
      },
    });
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps providers runtime seam scoped to providers only", async () => {
    const runtimeDataSource = createProvidersRuntimeDataSource({
      mode: "real-fetch",
      fetchTransport: {
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async () => ({
          status: 200,
          json: async () => ({ items: [] }),
        }),
      },
    });

    const dashboardResponse = await defaultConsoleReadonlyDataSource.getDashboardOverview();
    const environmentResponse = await defaultConsoleReadonlyDataSource.getEnvironment("dev-relay");
    const providersResponse = await runtimeDataSource.listProviders();
    const evalResponse = await defaultConsoleReadonlyDataSource.getEvalOverview();

    expect(dashboardResponse.meta.resource).toBe("dashboard");
    expect(environmentResponse.item?.id).toBe("dev-relay");
    expect(providersResponse.meta.resource).toBe("providers");
    expect(evalResponse.meta.resource).toBe("eval");
  });

  it("keeps providers runtime bootstrap scoped to providers only", async () => {
    const bootstrap = createProvidersRuntimeBootstrap({
      sourceFactoryOptions: {
        mode: "env",
        env: {
          RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
          RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
        },
        fetchImpl: async () => ({
          status: 200,
          json: async () => ({ items: [] }),
        }),
      },
    });

    const dashboardResponse = await defaultConsoleReadonlyDataSource.getDashboardOverview();
    const environmentResponse = await defaultConsoleReadonlyDataSource.getEnvironment("dev-relay");
    const providersResponse = await bootstrap.providersSource.listProviders();
    const evalResponse = await defaultConsoleReadonlyDataSource.getEvalOverview();

    expect(dashboardResponse.meta.resource).toBe("dashboard");
    expect(environmentResponse.item?.id).toBe("dev-relay");
    expect(providersResponse.meta.resource).toBe("providers");
    expect(evalResponse.meta.resource).toBe("eval");
  });

  it("keeps console app runtime scoped to providers only", async () => {
    const runtime = createConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async () => ({
              status: 200,
              json: async () => ({ items: [] }),
            }),
          },
        },
      },
    });

    const dashboardResponse = await runtime.dataSource.getDashboardOverview();
    const environmentResponse = await runtime.dataSource.getEnvironment("dev-relay");
    const providersResponse = await runtime.dataSource.listProviders();
    const evalResponse = await runtime.dataSource.getEvalOverview();

    expect(dashboardResponse.meta.resource).toBe("dashboard");
    expect(environmentResponse.item?.id).toBe("dev-relay");
    expect(providersResponse.meta.resource).toBe("providers");
    expect(providersResponse.meta.status).toBe("empty");
    expect(evalResponse.meta.resource).toBe("eval");
  });

  it("installs console app runtime datasource for consoleData helpers", async () => {
    const fetchCalls: string[] = [];
    bootstrapConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async (input) => {
              fetchCalls.push(input);
              if (input.endsWith("/missing-provider")) {
                return {
                  status: 200,
                  json: async () => ({
                    item: null,
                  }),
                };
              }

              return {
                status: 200,
                json: async () => ({
                  items: [
                    {
                      id: "provider-app-runtime-installed",
                      name: "Provider App Runtime Installed",
                      kind: "国产模型",
                      availableEnvironments: ["评测版"],
                      health: "healthy",
                      transparency: "完整",
                      errorRate: 0.2,
                      p95Latency: 610,
                      description: "app runtime installed datasource payload",
                      recommendation: "适合作为 app runtime 验证样本",
                      recommendationNote: "仅用于测试",
                      models: [{ name: "app-runtime-model", useCase: "app runtime" }],
                      metrics: {
                        requests: 22,
                        tokens: 4800,
                        avgLatency: 340,
                        p95Latency: 610,
                        errorRate: 0.2,
                        cost: 4,
                      },
                    },
                  ],
                }),
              };
            },
          },
        },
      },
    });

    const providersResponse = await listProvidersRaw({ kind: "国产模型" });
    const providerResponse = await getProviderRaw("missing-provider");

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(fetchCalls[1]).toBe("https://relayhub.internal/api/providers/missing-provider");
    expect(providersResponse.items[0]?.id).toBe("provider-app-runtime-installed");
    expect(providerResponse.meta.status).toBe("not-found");
  });

  it("installs deployment runtime datasource for consoleData helpers", async () => {
    const fetchCalls: string[] = [];
    bootstrapConsoleDeploymentRuntime({
      mode: "static",
      config: {
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async (input) => {
          fetchCalls.push(input);
          if (input.endsWith("/missing-provider")) {
            return {
              status: 200,
              json: async () => ({
                item: null,
              }),
            };
          }

          return {
            status: 200,
            json: async () => ({
              items: [
                {
                  id: "provider-deployment-runtime-installed",
                  name: "Provider Deployment Runtime Installed",
                  kind: "国产模型",
                  availableEnvironments: ["评测版"],
                  health: "healthy",
                  transparency: "完整",
                  errorRate: 0.2,
                  p95Latency: 610,
                  description: "deployment runtime installed datasource payload",
                  recommendation: "适合作为 deployment runtime 验证样本",
                  recommendationNote: "仅用于测试",
                  models: [{ name: "deployment-runtime-model", useCase: "deployment runtime" }],
                  metrics: {
                    requests: 22,
                    tokens: 4800,
                    avgLatency: 340,
                    p95Latency: 610,
                    errorRate: 0.2,
                    cost: 4,
                  },
                },
              ],
            }),
          };
        },
      },
    });

    const providersResponse = await listProvidersRaw({ kind: "国产模型" });
    const providerResponse = await getProviderRaw("missing-provider");

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(fetchCalls[1]).toBe("https://relayhub.internal/api/providers/missing-provider");
    expect(providersResponse.items[0]?.id).toBe("provider-deployment-runtime-installed");
    expect(providerResponse.meta.status).toBe("not-found");
  });

  it("installs env deployment runtime datasource for consoleData helpers", async () => {
    const fetchCalls: string[] = [];
    bootstrapConsoleEnvDeploymentRuntime(
      {
        RELAYHUB_PROVIDERS_RUNTIME_MODE: "real-fetch",
        RELAYHUB_PROVIDERS_READONLY_BASE_URL: "https://relayhub.internal/api",
      },
      async (input) => {
        fetchCalls.push(input);
        if (input.endsWith("/missing-provider")) {
          return {
            status: 200,
            json: async () => ({
              item: null,
            }),
          };
        }

        return {
          status: 200,
          json: async () => ({
            items: [
              {
                id: "provider-env-deployment-runtime-installed",
                name: "Provider Env Deployment Runtime Installed",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.2,
                p95Latency: 610,
                description: "env deployment runtime installed datasource payload",
                recommendation: "适合作为 env deployment runtime 验证样本",
                recommendationNote: "仅用于测试",
                models: [{ name: "env-deployment-runtime-model", useCase: "env deployment runtime" }],
                metrics: {
                  requests: 22,
                  tokens: 4800,
                  avgLatency: 340,
                  p95Latency: 610,
                  errorRate: 0.2,
                  cost: 4,
                },
              },
            ],
          }),
        };
      },
    );

    const providersResponse = await listProvidersRaw({ kind: "国产模型" });
    const providerResponse = await getProviderRaw("missing-provider");

    expect(fetchCalls[0]).toBe(
      "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
    );
    expect(fetchCalls[1]).toBe("https://relayhub.internal/api/providers/missing-provider");
    expect(providersResponse.items[0]?.id).toBe("provider-env-deployment-runtime-installed");
    expect(providerResponse.meta.status).toBe("not-found");
  });

  it("keeps default env deployment runtime on mock providers behavior", async () => {
    const runtime = bootstrapDefaultConsoleEnvDeploymentRuntime();
    const response = await runtime.dataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps deployment runtime scoped to providers only", async () => {
    bootstrapConsoleDeploymentRuntime({
      mode: "static",
      config: {
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async () => ({
          status: 200,
          json: async () => ({ items: [] }),
        }),
      },
    });

    const dashboardResponse = await getDashboardOverviewRaw();
    const environmentResponse = await getEnvironmentRaw("dev-relay");
    const evalResponse = await getEvalOverviewRaw();

    expect(dashboardResponse.meta.resource).toBe("dashboard");
    expect(environmentResponse.item?.id).toBe("dev-relay");
    expect(evalResponse.meta.resource).toBe("eval");
  });

  it("keeps non-provider consoleData helpers on mock after app runtime bootstrap", async () => {
    bootstrapConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async () => ({
              status: 200,
              json: async () => ({ items: [] }),
            }),
          },
        },
      },
    });

    const dashboardResponse = await getDashboardOverviewRaw();
    const environmentResponse = await getEnvironmentRaw("dev-relay");
    const evalResponse = await getEvalOverviewRaw();

    expect(dashboardResponse.meta.resource).toBe("dashboard");
    expect(environmentResponse.item?.id).toBe("dev-relay");
    expect(evalResponse.meta.resource).toBe("eval");
  });

  it("resets the installed console datasource back to default mock behavior", async () => {
    bootstrapConsoleAppRuntime({
      providersBootstrapOptions: {
        sourceFactoryOptions: {
          mode: "static",
          config: {
            mode: "real-fetch",
            baseUrl: "https://relayhub.internal/api",
            fetchImpl: async () => ({
              status: 200,
              json: async () => ({ items: [] }),
            }),
          },
        },
      },
    });

    const installedResponse = await listProvidersRaw({ kind: "国产模型" });
    resetConsoleReadonlyDataSource();
    const resetResponse = await listProvidersRaw({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(installedResponse.meta.status).toBe("empty");
    expect(resetResponse.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("can switch provider list reads to the providers trial stub", async () => {
    const datasource = createConsoleReadonlyDataSource({
      providersSource: realProvidersReadonlyDataSourceStub,
    });
    const response = await datasource.listProviders({
      kind: "国产模型",
    });

    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.id).toBe("provider-real-stub");
    expect(response.meta.filters).toEqual({
      kind: "国产模型",
    });
  });

  it("keeps empty provider list semantics when switched to the providers trial stub", async () => {
    const datasource = createConsoleReadonlyDataSource({
      providersSource: realProvidersReadonlyDataSourceStub,
    });
    const response = await datasource.listProviders({
      kind: "第三方中转",
    });

    expect(response.items).toHaveLength(0);
    expect(response.meta.status).toBe("empty");
    expect(response.meta.filters).toEqual({
      kind: "第三方中转",
    });
  });

  it("can switch provider detail reads to the providers trial stub", async () => {
    const datasource = createConsoleReadonlyDataSource({
      providersSource: realProvidersReadonlyDataSourceStub,
    });
    const response = await datasource.getProvider("provider-real-stub");

    expect(response.item?.id).toBe("provider-real-stub");
    expect(response.meta.status).toBe("ready");
  });

  it("keeps not-found provider detail semantics when switched to the providers trial stub", async () => {
    const datasource = createConsoleReadonlyDataSource({
      providersSource: realProvidersReadonlyDataSourceStub,
    });
    const response = await datasource.getProvider("missing-provider");

    expect(response.item).toBeNull();
    expect(response.meta.status).toBe("not-found");
  });

  it("builds providers collection path without query when filters are empty", () => {
    expect(buildProvidersCollectionPath()).toBe("/providers");
  });

  it("builds providers collection path with only legal filters", () => {
    expect(
      buildProvidersCollectionPath({
        kind: "国产模型",
        environment: "评测版",
        health: "degraded",
      }),
    ).toBe(
      "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E8%AF%84%E6%B5%8B%E7%89%88&health=degraded",
    );
  });

  it("builds provider detail path from provider id", () => {
    expect(buildProviderDetailPath("provider-real-stub")).toBe("/providers/provider-real-stub");
  });

  it("adapts collection wire payload into items", () => {
    const payload = adaptProvidersCollectionWirePayload({
      items: [
        {
          id: "provider-wire-stub",
          name: "Providers Wire Stub",
          kind: "国产模型",
          availableEnvironments: ["评测版"],
          health: "healthy",
          transparency: "完整",
          errorRate: 0.2,
          p95Latency: 720,
          description: "wire collection payload",
          recommendation: "适合作为 adapter 验证样本",
          recommendationNote: "仅用于测试",
          models: [{ name: "wire-model", useCase: "adapter" }],
          metrics: {
            requests: 11,
            tokens: 2200,
            avgLatency: 300,
            p95Latency: 720,
            errorRate: 0.2,
            cost: 3,
          },
        },
      ],
    });

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]?.id).toBe("provider-wire-stub");
  });

  it("adapts empty collection wire payload into empty items", () => {
    const payload = adaptProvidersCollectionWirePayload(createProvidersReadonlyCollectionEmptyPayload());

    expect(payload.items).toEqual([]);
  });

  it("throws a clear error for invalid collection wire payload", () => {
    expect(() => adaptProvidersCollectionWirePayload({ item: null })).toThrow(
      "Providers collection wire payload is invalid",
    );
  });

  it("adapts detail wire payload into item", () => {
    const payload = adaptProviderDetailWirePayload({
      item: {
        id: "provider-detail-wire-stub",
        name: "Provider Detail Wire Stub",
        kind: "国产模型",
        availableEnvironments: ["评测版"],
        health: "healthy",
        transparency: "完整",
        errorRate: 0.1,
        p95Latency: 540,
        description: "wire detail payload",
        recommendation: "适合作为 detail adapter 样本",
        recommendationNote: "仅用于测试",
        models: [{ name: "detail-wire-model", useCase: "adapter" }],
        metrics: {
          requests: 8,
          tokens: 1400,
          avgLatency: 280,
          p95Latency: 540,
          errorRate: 0.1,
          cost: 2,
        },
      },
    });

    expect(payload.item?.id).toBe("provider-detail-wire-stub");
  });

  it("adapts null detail wire payload into not-found item", () => {
    const payload = adaptProviderDetailWirePayload(createProvidersReadonlyDetailNotFoundPayload());

    expect(payload.item).toBeNull();
  });

  it("throws a clear error for invalid detail wire payload", () => {
    expect(() => adaptProviderDetailWirePayload({ items: [] })).toThrow(
      "Providers detail wire payload is invalid",
    );
  });

  it("creates a real providers datasource that maps ready collection responses", async () => {
    const requestCalls: ProvidersReadonlyTransportRequest[] = [];
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async (input) => {
        requestCalls.push(input);
        return {
          data: {
            items: [
              {
                id: "provider-fetch-stub",
                name: "Providers Fetch Stub",
                kind: "国产模型",
                availableEnvironments: ["评测版"],
                health: "healthy",
                transparency: "完整",
                errorRate: 0.1,
                p95Latency: 640,
                description: "fetch trial",
                recommendation: "试点可用",
                recommendationNote: "仍为本地测试 request",
                models: [{ name: "fetch-stub-model", useCase: "fetch seam" }],
                metrics: {
                  requests: 88,
                  tokens: 12000,
                  avgLatency: 480,
                  p95Latency: 640,
                  errorRate: 0.1,
                  cost: 9,
                },
              },
            ],
          },
        };
      },
    });

    const response = await datasource.listProviders({
      kind: "国产模型",
      environment: "评测版",
      transparency: "全部",
    });

    expect(response.meta.status).toBe("ready");
    expect(response.items[0]?.id).toBe("provider-fetch-stub");
    expect(requestCalls[0]).toMatchObject({
      resource: "providers",
      scope: "collection",
      path: "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E8%AF%84%E6%B5%8B%E7%89%88",
      filters: {
        kind: "国产模型",
        environment: "评测版",
      },
    });
  });

  it("creates a real providers datasource that maps empty collection responses", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({ data: { items: [] } }),
    });

    const response = await datasource.listProviders({
      kind: "第三方中转",
    });

    expect(response.meta.status).toBe("empty");
    expect(response.items).toHaveLength(0);
  });

  it("does not pass mock error query semantics as transport-specific fields beyond forceError", async () => {
    const requestCalls: ProvidersReadonlyTransportRequest[] = [];
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async (input) => {
        requestCalls.push(input);
        return { data: { items: [] } };
      },
    });

    await datasource.listProviders({}, { forceError: true });

    expect(requestCalls[0]).toMatchObject({
      resource: "providers",
      scope: "collection",
      path: "/providers",
      forceError: true,
    });
    expect(requestCalls[0]).not.toHaveProperty("mock");
  });

  it("creates a real providers datasource that maps not-found detail responses", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({ data: { item: null } }),
    });

    const response = await datasource.getProvider("missing-provider");

    expect(response.meta.status).toBe("not-found");
    expect(response.item).toBeNull();
  });

  it("maps transport 404 null detail into not-found without invoking detail adapter", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({
        statusCode: 404,
        data: null,
      }),
      adapters: {
        detail: () => {
          throw new Error("detail adapter should not run for transport 404");
        },
      },
    });

    const response = await datasource.getProvider("missing-provider");

    expect(response.meta.status).toBe("not-found");
    expect(response.item).toBeNull();
  });

  it("rethrows transport errors from the real providers datasource", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => {
        throw new Error("Providers transport request failed");
      },
    });

    await expect(datasource.getProvider("provider-real-stub")).rejects.toThrow(
      "Providers transport request failed",
    );
  });

  it("rethrows adapter errors from the real providers datasource", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({ data: { invalid: true } }),
    });

    await expect(datasource.listProviders({ kind: "国产模型" })).rejects.toThrow(
      "Providers collection wire payload is invalid",
    );
  });

  it("supports custom wire adapters when creating the real providers datasource", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({
        data: {
          records: [
            {
              id: "provider-custom-adapter",
              name: "Provider Custom Adapter",
              kind: "国产模型",
              availableEnvironments: ["评测版"],
              health: "healthy",
              transparency: "完整",
              errorRate: 0.3,
              p95Latency: 660,
              description: "custom adapter payload",
              recommendation: "适合作为 adapter 扩展入口",
              recommendationNote: "仅用于测试自定义 adapter",
              models: [{ name: "custom-adapter-model", useCase: "adapter seam" }],
              metrics: {
                requests: 25,
                tokens: 5000,
                avgLatency: 330,
                p95Latency: 660,
                errorRate: 0.3,
                cost: 5,
              },
            },
          ],
        },
      }),
      adapters: {
        collection: (payload) => ({
          items:
            typeof payload === "object" && payload !== null && "records" in payload
              ? (payload.records as ProviderCollectionContract["items"])
              : [],
        }),
      },
    });

    const response = await datasource.listProviders({ kind: "国产模型" });

    expect(response.meta.status).toBe("ready");
    expect(response.items[0]?.id).toBe("provider-custom-adapter");
  });

  it("supports custom detail adapters when creating the real providers datasource", async () => {
    const datasource = createRealProvidersReadonlyDataSource({
      transport: async () => ({
        data: {
          record: {
            id: "provider-custom-detail-adapter",
            name: "Provider Custom Detail Adapter",
            kind: "国产模型",
            availableEnvironments: ["评测版"],
            health: "healthy",
            transparency: "完整",
            errorRate: 0.2,
            p95Latency: 610,
            description: "custom detail adapter payload",
            recommendation: "适合作为 detail adapter 扩展入口",
            recommendationNote: "仅用于测试自定义 detail adapter",
            models: [{ name: "custom-detail-model", useCase: "adapter seam" }],
            metrics: {
              requests: 18,
              tokens: 3600,
              avgLatency: 310,
              p95Latency: 610,
              errorRate: 0.2,
              cost: 4,
            },
          },
        },
      }),
      adapters: {
        detail: (payload) => ({
          item:
            typeof payload === "object" && payload !== null && "record" in payload
              ? (payload.record as ProviderDetailContract["item"])
              : null,
        }),
      },
    });

    const response = await datasource.getProvider("provider-custom-detail-adapter");

    expect(response.meta.status).toBe("ready");
    expect(response.item?.id).toBe("provider-custom-detail-adapter");
  });

  it("creates a real providers fetch transport for collection requests", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          headers: {
            forEach: (callback) => {
              callback("application/json", "content-type");
            },
          },
          json: async () => ({ items: [] }),
        };
      },
    });

    const response = await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      filters: { kind: "国产模型" },
    });

    expect(fetchCalls[0]).toEqual({
      input: "https://relayhub.internal/api/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      init: {
        method: "GET",
        headers: {
          "x-relayhub-scope": "providers-readonly",
        },
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual({ items: [] });
    expect(response.headers).toEqual({
      "content-type": "application/json",
    });
  });

  it("keeps using default headers when no auth header resolver is provided", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
    });

    expect(fetchCalls[0]?.init?.headers).toEqual({
      "x-relayhub-scope": "providers-readonly",
    });
  });

  it("merges auth resolver headers into the real providers fetch transport request", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer relayhub-token",
        "x-trace-id": "trace-123",
      }),
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
    });

    expect(fetchCalls[0]?.init?.headers).toEqual({
      "x-relayhub-scope": "providers-readonly",
      authorization: "Bearer relayhub-token",
      "x-trace-id": "trace-123",
    });
  });

  it("lets auth resolver headers override same-name default headers", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        authorization: "Bearer default-token",
        "x-relayhub-scope": "providers-readonly",
      },
      authHeadersResolver: async () => ({
        authorization: "Bearer resolved-token",
      }),
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
    });

    expect(fetchCalls[0]?.init?.headers).toEqual({
      authorization: "Bearer resolved-token",
      "x-relayhub-scope": "providers-readonly",
    });
  });

  it("leaves the request headers unchanged when auth resolver returns undefined", async () => {
    const fetchCalls: Array<{ input: string; init?: { method?: string; headers?: Record<string, string> } }> = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      defaultHeaders: {
        "x-relayhub-scope": "providers-readonly",
      },
      authHeadersResolver: async () => undefined,
      fetchImpl: async (input, init) => {
        fetchCalls.push({ input, init });
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
    });

    expect(fetchCalls[0]?.init?.headers).toEqual({
      "x-relayhub-scope": "providers-readonly",
    });
  });

  it("rethrows auth resolver errors from the real providers fetch transport", async () => {
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      authHeadersResolver: async () => {
        throw new Error("resolver unavailable");
      },
      fetchImpl: async () => ({
        status: 200,
        json: async () => ({ items: [] }),
      }),
    });

    await expect(
      transport({
        resource: "providers",
        scope: "collection",
        path: "/providers",
      }),
    ).rejects.toThrow("resolver unavailable");
  });

  it("creates a real providers fetch transport for detail requests", async () => {
    const fetchCalls: string[] = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api/",
      fetchImpl: async (input) => {
        fetchCalls.push(input);
        return {
          status: 200,
          json: async () => ({ item: null }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "detail",
      path: "/providers/provider-real-stub",
      providerId: "provider-real-stub",
    });

    expect(fetchCalls[0]).toBe("https://relayhub.internal/api/providers/provider-real-stub");
  });

  it("returns null data for 204 responses from the real providers fetch transport", async () => {
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 204,
        json: async () => {
          throw new Error("json should not be called");
        },
      }),
    });

    const response = await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
    });

    expect(response.statusCode).toBe(204);
    expect(response.data).toBeNull();
  });

  it("returns null data for 404 responses from the real providers fetch transport", async () => {
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 404,
        json: async () => {
          throw new Error("json should not be called");
        },
      }),
    });

    const response = await transport({
      resource: "providers",
      scope: "detail",
      path: "/providers/missing-provider",
      providerId: "missing-provider",
    });

    expect(response.statusCode).toBe(404);
    expect(response.data).toBeNull();
  });

  it("throws a clear error for non-success fetch transport statuses", async () => {
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 500,
        json: async () => ({ message: "server error" }),
      }),
    });

    await expect(
      transport({
        resource: "providers",
        scope: "collection",
        path: "/providers",
      }),
    ).rejects.toThrow("RelayHub providers fetch transport failed with status 500");
  });

  it("throws a clear error for invalid JSON from the real providers fetch transport", async () => {
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 200,
        json: async () => {
          throw new Error("invalid json");
        },
      }),
    });

    await expect(
      transport({
        resource: "providers",
        scope: "collection",
        path: "/providers",
      }),
    ).rejects.toThrow("RelayHub providers fetch transport returned invalid JSON");
  });

  it("does not let mock error semantics enter the real fetch transport URL", async () => {
    const fetchCalls: string[] = [];
    const transport = createRealProvidersFetchTransport({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async (input) => {
        fetchCalls.push(input);
        return {
          status: 200,
          json: async () => ({ items: [] }),
        };
      },
    });

    await transport({
      resource: "providers",
      scope: "collection",
      path: "/providers",
      forceError: false,
    });

    expect(fetchCalls[0]).toBe("https://relayhub.internal/api/providers");
    expect(fetchCalls[0]).not.toContain("mock=error");
  });

  it("maps detail 404 into not-found through the fetch datasource helper", async () => {
    const datasource = createRealProvidersFetchDataSource({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 404,
        json: async () => {
          throw new Error("json should not be called");
        },
      }),
    });

    const response = await datasource.getProvider("missing-provider");

    expect(response.meta.status).toBe("not-found");
    expect(response.item).toBeNull();
  });

  it("creates a usable datasource from the fetch transport helper", async () => {
    const datasource = createRealProvidersFetchDataSource({
      baseUrl: "https://relayhub.internal/api",
      fetchImpl: async () => ({
        status: 200,
        json: async () => ({
          items: [
            {
              id: "provider-fetch-helper",
              name: "Provider Fetch Helper",
              kind: "国产模型",
              availableEnvironments: ["评测版"],
              health: "healthy",
              transparency: "完整",
              errorRate: 0.2,
              p95Latency: 620,
              description: "fetch datasource helper payload",
              recommendation: "适合作为 helper 验证样本",
              recommendationNote: "仅用于测试",
              models: [{ name: "fetch-helper-model", useCase: "transport helper" }],
              metrics: {
                requests: 19,
                tokens: 4100,
                avgLatency: 320,
                p95Latency: 620,
                errorRate: 0.2,
                cost: 4,
              },
            },
          ],
        }),
      }),
    });

    const response = await datasource.listProviders({ kind: "国产模型" });

    expect(response.meta.status).toBe("ready");
    expect(response.items[0]?.id).toBe("provider-fetch-helper");
  });

  it("keeps explicit providersSource overrides above the runtime seam default", async () => {
    const datasource = createConsoleReadonlyDataSource({
      providersSource: {
        listProviders: async () => ({
          meta: {
            source: "local-mock",
            generatedAt: "2026-04-16T00:00:00+08:00",
            version: "v1",
            resource: "providers",
            scope: "collection",
            status: "ready",
          },
          items: [
            {
              id: "provider-explicit-override",
              name: "Provider Explicit Override",
              kind: "国产模型",
              availableEnvironments: ["评测版"],
              health: "healthy",
              transparency: "完整",
              errorRate: 0.1,
              p95Latency: 500,
              description: "explicit override payload",
              recommendation: "优先使用显式覆盖",
              recommendationNote: "仅用于测试显式覆盖优先级",
              models: [{ name: "override-model", useCase: "override seam" }],
              metrics: {
                requests: 9,
                tokens: 1200,
                avgLatency: 250,
                p95Latency: 500,
                errorRate: 0.1,
                cost: 1,
              },
            },
          ],
        }),
        getProvider: async () => ({
          meta: {
            source: "local-mock",
            generatedAt: "2026-04-16T00:00:00+08:00",
            version: "v1",
            resource: "providers",
            scope: "detail",
            status: "ready",
          },
          item: {
            id: "provider-explicit-override",
            name: "Provider Explicit Override",
            kind: "国产模型",
            availableEnvironments: ["评测版"],
            health: "healthy",
            transparency: "完整",
            errorRate: 0.1,
            p95Latency: 500,
            description: "explicit override payload",
            recommendation: "优先使用显式覆盖",
            recommendationNote: "仅用于测试显式覆盖优先级",
            models: [{ name: "override-model", useCase: "override seam" }],
            metrics: {
              requests: 9,
              tokens: 1200,
              avgLatency: 250,
              p95Latency: 500,
              errorRate: 0.1,
              cost: 1,
            },
          },
        }),
      },
    });

    const response = await datasource.listProviders();

    expect(response.items[0]?.id).toBe("provider-explicit-override");
  });

  it("rethrows real-fetch runtime errors without fallback", async () => {
    const runtimeDataSource = createProvidersRuntimeDataSource({
      mode: "real-fetch",
      fetchTransport: {
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async () => {
          throw new Error("runtime real-fetch failed");
        },
      },
    });

    await expect(runtimeDataSource.listProviders()).rejects.toThrow("runtime real-fetch failed");
  });

  it("rethrows real-fetch config source runtime errors without fallback", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSourceFromConfigSource(
      createStaticProvidersRuntimeConfigSource({
        mode: "real-fetch",
        baseUrl: "https://relayhub.internal/api",
        fetchImpl: async () => {
          throw new Error("runtime config source real-fetch failed");
        },
      }),
    );

    await expect(runtimeDataSource.listProviders()).rejects.toThrow(
      "runtime config source real-fetch failed",
    );
  });

  it("keeps the standalone mock providers datasource behavior unchanged", async () => {
    const response = await mockProvidersReadonlyDataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });
});
