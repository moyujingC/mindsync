import { afterEach, describe, expect, it } from "vitest";
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
  bootstrapConsoleEnvDeploymentRuntime,
  bootstrapDefaultConsoleEnvDeploymentRuntime,
  resolveConsoleDeploymentRuntimeInputFromEnv,
} from "../app/consoleEnvDeploymentRuntime";
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
  getDefaultProvidersRuntimeBootstrap,
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

  it("resolves the default providers runtime config to mock", () => {
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
