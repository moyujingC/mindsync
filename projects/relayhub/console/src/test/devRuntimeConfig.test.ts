import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("console dev runtime config", () => {
  it("defaults control-plane base url to /api/control-plane in dev mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "");
    vi.stubEnv("RELAYHUB_CONTROL_PLANE_BASE_URL", "");

    vi.resetModules();
    const service = await import("../services/controlPlane");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: "preset-1", status: "active" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

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
});
