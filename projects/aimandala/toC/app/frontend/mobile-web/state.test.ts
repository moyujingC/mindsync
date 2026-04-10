import { describe, expect, it } from "vitest";

import { toStartCreatePayload } from "./state";

describe("mobile-web state", () => {
  it("toStartCreatePayload 会把 0-1 的三圈比例转成整数百分比", () => {
    const payload = toStartCreatePayload(
      {
        imagePath: "/tmp/sample.png",
        theme: "general",
        paintingIntention: "",
        paintingFeeling: "",
        innerRadius: 0.33,
        middleRadius: 0.66,
      },
      "user-1",
    );

    expect(payload.innerRadius).toBe(33);
    expect(payload.middleRadius).toBe(66);
  });

  it("toStartCreatePayload 保留已经是百分比的输入", () => {
    const payload = toStartCreatePayload(
      {
        imagePath: "/tmp/sample.png",
        theme: "general",
        paintingIntention: "",
        paintingFeeling: "",
        innerRadius: 33,
        middleRadius: 66,
      },
      "user-1",
    );

    expect(payload.innerRadius).toBe(33);
    expect(payload.middleRadius).toBe(66);
  });
});
