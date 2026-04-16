import { describe, expect, it } from "vitest";
import {
  createConsoleReadonlyDataSource,
  defaultConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import {
  adaptProviderDetailWirePayload,
  adaptProvidersCollectionWirePayload,
} from "../services/realProvidersAdapter";
import {
  buildProviderDetailPath,
  buildProvidersCollectionPath,
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
});
