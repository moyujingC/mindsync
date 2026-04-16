import { describe, expect, it } from "vitest";
import {
  createConsoleReadonlyDataSource,
  defaultConsoleReadonlyDataSource,
} from "../services/mockConsoleDataSource";
import { realProvidersReadonlyDataSourceStub } from "../services/realProvidersDataSource";
import type {
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
  ProviderDetailContract,
} from "../contracts";

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
});
