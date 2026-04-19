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
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");
    vi.resetModules();
    const service = await import("../services/controlPlane");

    const entries = await service.listModelEntries();
    const relayPreset = entries.find((entry) => entry.id === "preset-ppchat-relay");

    expect(relayPreset?.presetPriority).toBe("recommended-first");
    expect(relayPreset?.recommendedTaskIds).toContain("task-claude-code");
    expect(relayPreset?.selectionReason).toContain("通用工具");
    expect(relayPreset?.activationHint).toContain("测试连接");
    expect(relayPreset?.capabilityTags).toContain("编码");
  });
});
