import { describe, expect, it } from "vitest";

import { toMobileWebUploadAssetRef, toStartCreatePayload } from "./state";

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

  it("toStartCreatePayload 会保留长期图片定位字段而不依赖临时 URL", () => {
    const payload = toStartCreatePayload(
      {
        imagePath: "/tmp/sample.png",
        theme: "general",
        paintingIntention: "",
        paintingFeeling: "",
        uploadAsset: {
          runtimeImagePath: "/tmp/runtime.png",
          storageBackend: "cos",
          storageKey: "aimandala/uploads/sample.png",
          imageLocalExpiresAt: "2026-04-13T00:00:00+00:00",
          imageUrl: "https://img.example.com/aimandala/uploads/sample.png?sign=demo",
        },
      },
      "user-1",
    );

    expect(payload.imagePath).toBe("/tmp/runtime.png");
    expect(payload.storageBackend).toBe("cos");
    expect(payload.storageKey).toBe("aimandala/uploads/sample.png");
    expect(payload.imageLocalExpiresAt).toBe("2026-04-13T00:00:00+00:00");
    expect(payload.imageUrl).toBeUndefined();
  });

  it("toMobileWebUploadAssetRef 会保存图片本地过期时间", () => {
    const assetRef = toMobileWebUploadAssetRef({
      image_path: "/tmp/runtime.png",
      storage_backend: "cos",
      storage_key: "aimandala/uploads/sample.png",
      image_local_expires_at: "2026-04-13T00:00:00+00:00",
      image_url: "https://img.example.com/aimandala/uploads/sample.png?sign=demo",
    });

    expect(assetRef.imageLocalExpiresAt).toBe("2026-04-13T00:00:00+00:00");
    expect(assetRef.imageUrl).toContain("sign=demo");
  });
});
