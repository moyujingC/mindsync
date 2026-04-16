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

describe("consoleData service", () => {
  it("unwraps dashboard overview payload", async () => {
    const dashboard = await getDashboardOverview();

    expect(dashboard.environments.length).toBeGreaterThan(0);
    expect(dashboard.decisions.length).toBeGreaterThan(0);
    expect(dashboard.recentRuns.length).toBeGreaterThan(0);
  });

  it("exposes dashboard meta semantics through raw helper", async () => {
    const response = await getDashboardOverviewRaw();

    expect(response.meta.resource).toBe("dashboard");
    expect(response.meta.scope).toBe("overview");
    expect(response.meta.status).toBe("ready");
    expect(response.meta.version).toBe("v1");
  });

  it("exposes environment collection meta semantics through raw helper", async () => {
    const response = await listEnvironmentsRaw();

    expect(response.meta.resource).toBe("environments");
    expect(response.meta.scope).toBe("collection");
    expect(response.meta.status).toBe("ready");
  });

  it("returns null for missing environment detail", async () => {
    await expect(getEnvironment("missing-environment")).resolves.toBeNull();
  });

  it("marks missing environment detail as not-found in raw meta", async () => {
    const response = await getEnvironmentRaw("missing-environment");

    expect(response.item).toBeNull();
    expect(response.meta.scope).toBe("detail");
    expect(response.meta.status).toBe("not-found");
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

    expect(response.meta.resource).toBe("providers");
    expect(response.meta.scope).toBe("collection");
    expect(response.meta.status).toBe("ready");
    expect(response.meta.filters).toEqual({
      kind: "国产模型",
      environment: "评测版",
    });
  });

  it("marks empty provider collections as empty in raw meta", async () => {
    const response = await listProvidersRaw({
      kind: "免费国外 API",
      environment: "心理疗愈生产版",
    });

    expect(response.items).toHaveLength(0);
    expect(response.meta.status).toBe("empty");
  });

  it("unwraps eval overview payload", async () => {
    const evaluation = await getEvalOverview();

    expect(evaluation.recommendations.length).toBeGreaterThan(0);
    expect(evaluation.reports.length).toBeGreaterThan(0);
  });

  it("exposes eval meta semantics through raw helper", async () => {
    const response = await getEvalOverviewRaw();

    expect(response.meta.resource).toBe("eval");
    expect(response.meta.scope).toBe("overview");
    expect(response.meta.status).toBe("ready");
  });
});
