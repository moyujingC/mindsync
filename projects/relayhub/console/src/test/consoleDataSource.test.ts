import { describe, expect, it } from "vitest";
import {
  createConsoleReadonlyDataSource,
  defaultConsoleReadonlyDataSource,
  mockProvidersReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import {
  createProvidersRuntimeDataSource,
  getProvidersRuntimeDataSource,
} from "../services/providersRuntimeDataSource";
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

  it("returns mock providers source from the default runtime seam", async () => {
    const runtimeDataSource = getProvidersRuntimeDataSource();
    const response = await runtimeDataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });

  it("returns mock providers source when runtime mode is mock", async () => {
    const runtimeDataSource = createProvidersRuntimeDataSource({
      mode: "mock",
    });
    const response = await runtimeDataSource.getProvider("deepseek-direct");

    expect(response.item?.id).toBe("deepseek-direct");
    expect(response.meta.status).toBe("ready");
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

  it("keeps the standalone mock providers datasource behavior unchanged", async () => {
    const response = await mockProvidersReadonlyDataSource.listProviders({
      kind: "国产模型",
      environment: "评测版",
    });

    expect(response.items.some((item) => item.id === "deepseek-direct")).toBe(true);
  });
});
