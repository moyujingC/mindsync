import { describe, expect, it } from "vitest";
import {
  getDashboardOverview,
  getEnvironment,
  getEvalOverview,
  listProviders,
} from "../services/consoleData";

describe("consoleData service", () => {
  it("unwraps dashboard overview payload", async () => {
    const dashboard = await getDashboardOverview();

    expect(dashboard.environments.length).toBeGreaterThan(0);
    expect(dashboard.decisions.length).toBeGreaterThan(0);
    expect(dashboard.recentRuns.length).toBeGreaterThan(0);
  });

  it("returns null for missing environment detail", async () => {
    await expect(getEnvironment("missing-environment")).resolves.toBeNull();
  });

  it("preserves provider filters after response unwrapping", async () => {
    const providers = await listProviders({
      kind: "免费国外 API",
      environment: "开发版",
    });

    expect(providers).toHaveLength(1);
    expect(providers[0]?.id).toBe("freebridge-sandbox");
  });

  it("unwraps eval overview payload", async () => {
    const evaluation = await getEvalOverview();

    expect(evaluation.recommendations.length).toBeGreaterThan(0);
    expect(evaluation.reports.length).toBeGreaterThan(0);
  });
});
