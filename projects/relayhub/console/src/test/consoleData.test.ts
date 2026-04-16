import { describe, expect, it } from "vitest";
import {
  getDashboardOverview,
  getDashboardOverviewReadonlyApiResponse,
  getDashboardOverviewRaw,
  getEnvironment,
  getEnvironmentReadonlyApiResponse,
  getEnvironmentRaw,
  getEvalOverview,
  getEvalOverviewReadonlyApiResponse,
  getEvalOverviewRaw,
  getProvider,
  getProviderReadonlyApiResponse,
  listEnvironmentsRaw,
  listEnvironmentsReadonlyApiResponse,
  listProviders,
  listProvidersReadonlyApiResponse,
  listProvidersRaw,
} from "../services/consoleData";
import type {
  DashboardOverviewContract,
  DashboardOverviewReadonlyApiResponse,
  EnvironmentCollectionContract,
  EnvironmentCollectionReadonlyApiResponse,
  EnvironmentDetailContract,
  EnvironmentDetailReadonlyApiResponse,
  EvalOverviewContract,
  EvalOverviewReadonlyApiResponse,
  ProviderCollectionContract,
  ProviderCollectionReadonlyApiResponse,
  ProviderDetailReadonlyApiResponse,
} from "../contracts";

describe("consoleData service", () => {
  it("unwraps dashboard overview payload", async () => {
    const dashboard = await getDashboardOverview();

    expect(dashboard.environments.length).toBeGreaterThan(0);
    expect(dashboard.decisions.length).toBeGreaterThan(0);
    expect(dashboard.recentRuns.length).toBeGreaterThan(0);
  });

  it("exposes dashboard meta semantics through raw helper", async () => {
    const response = await getDashboardOverviewRaw();
    const typedResponse: DashboardOverviewContract = response;

    expect(typedResponse.meta.resource).toBe("dashboard");
    expect(typedResponse.meta.scope).toBe("overview");
    expect(typedResponse.meta.status).toBe("ready");
    expect(typedResponse.meta.version).toBe("v1");
  });

  it("adapts dashboard raw helper into readonly api response shape", async () => {
    const response = await getDashboardOverviewReadonlyApiResponse();
    const typedResponse: DashboardOverviewReadonlyApiResponse = response;

    expect(typedResponse.meta.resource).toBe("dashboard");
    expect(typedResponse.data.environments.length).toBeGreaterThan(0);
    expect(typedResponse.data.decisions.length).toBeGreaterThan(0);
  });

  it("exposes environment collection meta semantics through raw helper", async () => {
    const response = await listEnvironmentsRaw();
    const typedResponse: EnvironmentCollectionContract = response;

    expect(typedResponse.meta.resource).toBe("environments");
    expect(typedResponse.meta.scope).toBe("collection");
    expect(typedResponse.meta.status).toBe("ready");
  });

  it("adapts environment collection into readonly api response shape", async () => {
    const response = await listEnvironmentsReadonlyApiResponse();
    const typedResponse: EnvironmentCollectionReadonlyApiResponse = response;

    expect(typedResponse.meta.resource).toBe("environments");
    expect(Array.isArray(typedResponse.data)).toBe(true);
    expect(typedResponse.data.length).toBeGreaterThan(0);
  });

  it("returns null for missing environment detail", async () => {
    await expect(getEnvironment("missing-environment")).resolves.toBeNull();
  });

  it("maps environment detail contract into the page model shape", async () => {
    const environment = await getEnvironment("prod-aimandala");

    expect(environment?.name).toBe("心理疗愈生产版");
    expect(environment?.policySummary).toContain("当前生产版只允许国产模型。");
    expect(environment?.runs).toEqual([]);
  });

  it("marks missing environment detail as not-found in raw meta", async () => {
    const response = await getEnvironmentRaw("missing-environment");
    const typedResponse: EnvironmentDetailContract = response;

    expect(typedResponse.item).toBeNull();
    expect(typedResponse.meta.scope).toBe("detail");
    expect(typedResponse.meta.status).toBe("not-found");
  });

  it("adapts missing environment detail into readonly api response shape", async () => {
    const response = await getEnvironmentReadonlyApiResponse("missing-environment");
    const typedResponse: EnvironmentDetailReadonlyApiResponse = response;

    expect(typedResponse.data).toBeNull();
    expect(typedResponse.meta.status).toBe("not-found");
  });

  it("preserves provider filters after response unwrapping", async () => {
    const providers = await listProviders({
      kind: "免费国外 API",
      environment: "开发版",
    });

    expect(providers).toHaveLength(1);
    expect(providers[0]?.id).toBe("freebridge-sandbox");
  });

  it("exposes provider filter snapshot through raw meta", async () => {
    const response = await listProvidersRaw({
      kind: "国产模型",
      environment: "评测版",
    });
    const typedResponse: ProviderCollectionContract = response;

    expect(typedResponse.meta.resource).toBe("providers");
    expect(typedResponse.meta.scope).toBe("collection");
    expect(typedResponse.meta.status).toBe("ready");
    expect(typedResponse.meta.filters).toEqual({
      kind: "国产模型",
      environment: "评测版",
    });
  });

  it("adapts provider collection into readonly api response shape", async () => {
    const response = await listProvidersReadonlyApiResponse({
      kind: "国产模型",
      environment: "评测版",
    });
    const typedResponse: ProviderCollectionReadonlyApiResponse = response;

    expect(Array.isArray(typedResponse.data)).toBe(true);
    expect(typedResponse.meta.filters).toEqual({
      kind: "国产模型",
      environment: "评测版",
    });
  });

  it("marks empty provider collections as empty in raw meta", async () => {
    const response = await listProvidersRaw({
      kind: "免费国外 API",
      environment: "心理疗愈生产版",
    });
    const typedResponse: ProviderCollectionContract = response;

    expect(typedResponse.items).toHaveLength(0);
    expect(typedResponse.meta.status).toBe("empty");
  });

  it("keeps empty provider collections as empty in readonly api response shape", async () => {
    const response = await listProvidersReadonlyApiResponse({
      kind: "免费国外 API",
      environment: "心理疗愈生产版",
    });

    expect(response.data).toHaveLength(0);
    expect(response.meta.status).toBe("empty");
  });

  it("maps provider detail contract into the page model shape", async () => {
    const provider = await getProvider("deepseek-direct");

    expect(provider?.name).toBe("DeepSeek Direct");
    expect(provider?.models.length).toBeGreaterThan(0);
    expect(provider?.metrics?.requests).toBeGreaterThan(0);
  });

  it("adapts missing provider detail into readonly api response shape", async () => {
    const response = await getProviderReadonlyApiResponse("missing-provider");
    const typedResponse: ProviderDetailReadonlyApiResponse = response;

    expect(typedResponse.data).toBeNull();
    expect(typedResponse.meta.status).toBe("not-found");
  });

  it("unwraps eval overview payload", async () => {
    const evaluation = await getEvalOverview();

    expect(evaluation.recommendations.length).toBeGreaterThan(0);
    expect(evaluation.reports.length).toBeGreaterThan(0);
  });

  it("exposes eval meta semantics through raw helper", async () => {
    const response = await getEvalOverviewRaw();
    const typedResponse: EvalOverviewContract = response;

    expect(typedResponse.meta.resource).toBe("eval");
    expect(typedResponse.meta.scope).toBe("overview");
    expect(typedResponse.meta.status).toBe("ready");
  });

  it("adapts eval overview into readonly api response shape", async () => {
    const response = await getEvalOverviewReadonlyApiResponse();
    const typedResponse: EvalOverviewReadonlyApiResponse = response;

    expect(typedResponse.meta.resource).toBe("eval");
    expect(typedResponse.data.recommendations.length).toBeGreaterThan(0);
    expect(typedResponse.data.reports.length).toBeGreaterThan(0);
  });
});
