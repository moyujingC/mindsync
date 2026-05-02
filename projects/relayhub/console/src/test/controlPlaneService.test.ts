import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe("control-plane service release wiring", () => {
  it("targets /api/control-plane when RELAYHUB_CONTROL_PLANE_BASE_URL is configured", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "/api/control-plane");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: "preset-1", status: "active" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    vi.resetModules();
    const service = await import("../services/controlPlane");
    await service.listModelEntries();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/control-plane/models",
      expect.objectContaining({
        headers: {
          "content-type": "application/json",
        },
      }),
    );
  });

  it("falls back to mock state when RELAYHUB_CONTROL_PLANE_BASE_URL is empty", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;

    vi.resetModules();
    const service = await import("../services/controlPlane");
    const entries = await service.listModelEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns detailed test failure semantics in mock mode", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    const result = await service.testModelEntryConnection("preset-qwen-max");

    expect(result.status).toBe("test-failed");
    expect(result.lastTestResult).toBe("missing-api-key");
    expect(result.lastTestCode).toBe("missing_api_key");
    expect(result.lastTestMessage).toContain("缺少 API Key");
  });

  it("exposes preset guidance metadata in mock mode", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    const entries = await service.listModelEntries();
    const relayPreset = entries.find((entry) => entry.id === "preset-ppchat-relay");

    expect(relayPreset?.presetPriority).toBe("recommended");
    expect(relayPreset?.recommendedTaskIds).toContain("task-codex-repo");
    expect(relayPreset?.selectionReason).toContain("OpenAI");
    expect(relayPreset?.activationHint).toContain("OpenAI/Codex");
    expect(relayPreset?.capabilityTags).toContain("编码");
  });

  it("targets /api/control-plane model catalog endpoint when server mode is enabled", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "/api/control-plane");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          items: [{ id: "高性能低价模型", label: "高性能低价模型" }],
          fetchedAt: "2026-04-21 10:30",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    vi.resetModules();
    const service = await import("../services/controlPlane");
    await service.getModelCatalog("preset-aitechflux-relay");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/control-plane/models/preset-aitechflux-relay/catalog",
      expect.objectContaining({
        headers: {
          "content-type": "application/json",
        },
      }),
    );
  });

  it("returns mock catalog entries for AITechFlux in mock mode", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    await service.saveModelEntry({
      id: "preset-aitechflux-relay",
      name: "AITechFlux 中转",
      providerLabel: "AITechFlux",
      kind: "relay-api",
      baseUrl: "https://aitechflux.com/v1",
      modelId: "claude-sonnet",
      apiKey: "sk-aitechflux-test",
    });

    const result = await service.getModelCatalog("preset-aitechflux-relay");

    expect(result.items.map((item) => item.id)).toEqual([
      "高性能极速模型",
      "高性能低价模型",
      "Claude混合版",
    ]);
    expect(result.items[1]?.label).toBe("高性能低价模型");
  });

  it("returns built-in mock catalog entries for AITechFlux even without api key in mock mode", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    const result = await service.getModelCatalog("preset-aitechflux-relay");

    expect(result.items.map((item) => item.id)).toEqual([
      "高性能极速模型",
      "高性能低价模型",
      "Claude混合版",
    ]);
  });

  it("reads and saves relay access token summary in mock mode", async () => {
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    const initial = await service.getRelayAccessSummary();
    expect(initial.hasStoredRelayToken).toBe(false);
    expect(initial.effectiveSource).toBe("missing");

    const saved = await service.saveRelayAccessToken("relayhub-ui-token");
    expect(saved.hasStoredRelayToken).toBe(true);
    expect(saved.effectiveSource).toBe("control-plane");
    expect(saved.maskedRelayToken).toContain("relayh");
  });
});
