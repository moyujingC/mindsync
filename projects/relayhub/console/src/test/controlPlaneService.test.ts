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
});
