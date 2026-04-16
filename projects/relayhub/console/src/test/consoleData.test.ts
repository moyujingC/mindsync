import { describe, expect, it } from "vitest";
import {
  getDashboardOverview,
  getDashboardOverviewRaw,
  getEnvironment,
  getEnvironmentRaw,
  getEvalOverview,
  getEvalOverviewRaw,
  listEnvironmentsRaw,
  listProviders,
  listProvidersRaw,
} from "../services/consoleData";
import type {
  DashboardOverviewContract,
  EnvironmentCollectionContract,
  EnvironmentDetailContract,
  EvalOverviewContract,
  ProviderCollectionContract,
} from "../contracts/console";

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

  it("exposes environment collection meta semantics through raw helper", async () => {
    const response = await listEnvironmentsRaw();
    const typedResponse: EnvironmentCollectionContract = response;

    expect(typedResponse.meta.resource).toBe("environments");
    expect(typedResponse.meta.scope).toBe("collection");
    expect(typedResponse.meta.status).toBe("ready");
  });

  it("returns null for missing environment detail", async () => {
    await expect(getEnvironment("missing-environment")).resolves.toBeNull();
  });

  it("marks missing environment detail as not-found in raw meta", async () => {
    const response = await getEnvironmentRaw("missing-environment");
    const typedResponse: EnvironmentDetailContract = response;

    expect(typedResponse.item).toBeNull();
    expect(typedResponse.meta.scope).toBe("detail");
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

  it("marks empty provider collections as empty in raw meta", async () => {
    const response = await listProvidersRaw({
      kind: "免费国外 API",
      environment: "心理疗愈生产版",
    });
    const typedResponse: ProviderCollectionContract = response;

    expect(typedResponse.items).toHaveLength(0);
    expect(typedResponse.meta.status).toBe("empty");
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
});
