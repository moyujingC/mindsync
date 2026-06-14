import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/api", () => ({
  uploadImage: vi.fn(),
}));

import * as api from "../shared/api";
import { ensureUploadedImagePath } from "./upload-runtime";
import type { UploadImageResponse } from "../shared/types";

function createUploadResponse(): UploadImageResponse {
  return {
    success: true,
    image_path: "/tmp/runtime-upload.png",
    storage_backend: "local",
    storage_key: "uploads/runtime-upload.png",
    original_filename: "mandala.png",
    content_type: "image/png",
    size_bytes: 8,
    image_url: "https://img.example.com/uploads/runtime-upload.png",
  };
}

describe("ensureUploadedImagePath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("优先复用已经完成的上传结果", async () => {
    const onResolved = vi.fn();

    const uploaded = await ensureUploadedImagePath(
      {
        imagePath: "/tmp/local-preview.png",
        theme: "wealth",
        paintingIntention: "",
        paintingFeeling: "",
        uploadAsset: {
          runtimeImagePath: "/tmp/runtime-upload.png",
          storageBackend: "local",
          storageKey: "uploads/runtime-upload.png",
          imageUrl: "https://img.example.com/uploads/runtime-upload.png",
        },
      },
      onResolved,
    );

    expect(uploaded.image_path).toBe("/tmp/runtime-upload.png");
    expect(uploaded.storage_key).toBe("uploads/runtime-upload.png");
    expect(api.uploadImage).not.toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
  });

  it("有浏览器文件时调用真实上传接口", async () => {
    const response = createUploadResponse();
    vi.mocked(api.uploadImage).mockResolvedValue(response);
    const onResolved = vi.fn();
    const file = new File(["mandala"], "mandala.png", { type: "image/png" });

    const uploaded = await ensureUploadedImagePath(
      {
        imagePath: "blob:local-preview",
        theme: "wealth",
        paintingIntention: "",
        paintingFeeling: "",
        browserFile: file,
      },
      onResolved,
    );

    expect(api.uploadImage).toHaveBeenCalledWith(file);
    expect(uploaded).toBe(response);
    expect(onResolved).toHaveBeenCalledWith(response);
  });

  it("没有已上传结果也没有浏览器文件时直接失败", async () => {
    await expect(
      ensureUploadedImagePath(
        {
          imagePath: "/tmp/local-preview.png",
          theme: "wealth",
          paintingIntention: "",
          paintingFeeling: "",
        },
        vi.fn(),
      ),
    ).rejects.toThrow("请先选择本地曼陀罗图片并完成上传。");

    expect(api.uploadImage).not.toHaveBeenCalled();
  });

  it("预览模式允许直接复用已有图片路径", async () => {
    const onResolved = vi.fn();

    const uploaded = await ensureUploadedImagePath(
      {
        imagePath: "/tmp/local-preview.png",
        theme: "wealth",
        paintingIntention: "",
        paintingFeeling: "",
      },
      onResolved,
      { allowExistingImagePath: true },
    );

    expect(uploaded).toMatchObject({
      image_path: "/tmp/local-preview.png",
      storage_backend: "preview",
      storage_key: "/tmp/local-preview.png",
    });
    expect(onResolved).toHaveBeenCalledWith(uploaded);
    expect(api.uploadImage).not.toHaveBeenCalled();
  });
});
