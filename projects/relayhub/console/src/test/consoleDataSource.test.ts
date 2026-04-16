import { describe, expect, it } from "vitest";
import {
  createConsoleReadonlyDataSource,
  defaultConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
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

type ProvidersReadonlyRequestInput = Parameters<
  Parameters<typeof createRealProvidersReadonlyDataSource>[0]
>[0];

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

  it("creates a real providers datasource that maps ready collection responses", async () => {
    const requestCalls: ProvidersReadonlyRequestInput[] = [];
    const datasource = createRealProvidersReadonlyDataSource(async (input) => {
      requestCalls.push(input);
      return {
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
      };
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
    const datasource = createRealProvidersReadonlyDataSource(async () => ({ items: [] }));

    const response = await datasource.listProviders({
      kind: "第三方中转",
    });

    expect(response.meta.status).toBe("empty");
    expect(response.items).toHaveLength(0);
  });

  it("does not pass mock error query semantics as request-specific fields beyond forceError", async () => {
    const requestCalls: ProvidersReadonlyRequestInput[] = [];
    const datasource = createRealProvidersReadonlyDataSource(async (input) => {
      requestCalls.push(input);
      return { items: [] };
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
    const datasource = createRealProvidersReadonlyDataSource(async () => ({ item: null }));

    const response = await datasource.getProvider("missing-provider");

    expect(response.meta.status).toBe("not-found");
    expect(response.item).toBeNull();
  });

  it("rethrows request errors from the real providers datasource", async () => {
    const datasource = createRealProvidersReadonlyDataSource(async () => {
      throw new Error("Providers fetch request failed");
    });

    await expect(datasource.getProvider("provider-real-stub")).rejects.toThrow(
      "Providers fetch request failed",
    );
  });
});
