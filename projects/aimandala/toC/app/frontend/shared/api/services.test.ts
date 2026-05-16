import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

vi.mock("./httpClient", () => ({
  fetchJson: fetchJsonMock,
}));

vi.mock("./config", () => ({
  getAimandalaApiBaseUrl: () => "http://localhost:8000",
}));

import { createWealthReport, uploadImage } from "./services";

describe("shared/api services", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    fetchJsonMock.mockResolvedValue({});
  });

  it("createWealthReport uses the native wealth report endpoint", async () => {
    await createWealthReport({
      image_path: "/tmp/mandala.png",
      report_mode: "lite",
      painting_intention: "想看财富卡点",
      painting_feeling: "有点紧",
      inner_radius: 35,
      middle_radius: 65,
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/wealth-reports",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_path: "/tmp/mandala.png",
          report_mode: "lite",
          painting_intention: "想看财富卡点",
          painting_feeling: "有点紧",
          inner_radius: 35,
          middle_radius: 65,
        }),
      }),
    );
  });

  it("uploadImage sends browser files to the upload endpoint", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "mandala.png", {
      type: "image/png",
    });

    await uploadImage(file);

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/uploads",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
  });
});
