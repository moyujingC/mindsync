// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

vi.mock("../shared/api", () => ({
  createWealthReport: vi.fn(),
  uploadImage: vi.fn(),
}));

import * as api from "../shared/api";
import { createMobileWebGuestSession } from "./identity";
import { MobileWebRuntime } from "./runtime";
import type { MobileWebRouteInput } from "./router-plan";
import type { WealthReportResponse } from "../shared/types";

function createWealthReportResponse(): WealthReportResponse {
  return {
    success: true,
    report_id: "wealth-runtime-1",
    report_mode: "lite",
    final_report_md: "# 财富关系曼陀罗解读\n\n当前财富关系可以先看边界与行动。",
    final_report: {
      title: "财富关系曼陀罗解读",
      summary: "当前财富关系可以先看边界与行动。",
    },
    visual_draft: { visual_observation: {} },
    prompt_pack_manifest: { pack_id: "wealth-report-v1.0.0" },
    quality_gate: {},
    run_summary: {},
  };
}

function createUploadResponse() {
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

async function waitForAssertion(assertion: () => void): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await act(async () => {
        assertion();
      });
      return;
    } catch (error) {
      lastError = error;
      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });
    }
  }

  throw lastError;
}

describe("MobileWebRuntime", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    vi.mocked(api.createWealthReport).mockResolvedValue(
      createWealthReportResponse(),
    );
    vi.mocked(api.uploadImage).mockResolvedValue(createUploadResponse());
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    flushSync(() => {
      root.unmount();
    });
    await Promise.resolve();
    container.remove();
  });

  it("上传页开始解读时直接进入生成并调用当前财富报告入口", async () => {
    const input: MobileWebRouteInput = {
      route: "upload",
      params: {
        session: createMobileWebGuestSession("runtime-test"),
        draft: {
          imagePath: "blob:runtime-preview",
          theme: "wealth",
          reportType: "lite",
          reportVariant: "lite",
          redeemCode: "MVP-LITE",
          paintingIntention: "看见财富卡点",
          paintingFeeling: "平静",
          innerRadius: 0.36,
          middleRadius: 0.64,
          browserFile: new File(["mandala"], "mandala.png", {
            type: "image/png",
          }),
        },
      },
    };

    await act(async () => {
      root.render(<MobileWebRuntime input={input} />);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain("开始解读");
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("开始解读"),
    );
    expect(startButton).toBeTruthy();

    await act(async () => {
      startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(api.uploadImage).toHaveBeenCalledWith(expect.any(File));
      expect(api.createWealthReport).toHaveBeenCalledWith(
        expect.objectContaining({
          image_path: "/tmp/runtime-upload.png",
          storage_backend: "local",
          storage_key: "uploads/runtime-upload.png",
          report_mode: "lite",
          redeem_code: "MVP-LITE",
          painting_intention: "看见财富卡点",
          painting_feeling: "平静",
          inner_radius: 36,
          middle_radius: 64,
        }),
      );
    });
    expect(container.textContent).toContain("财富关系曼陀罗解读");
  });

  it("保留选择页入口，选择 Lite 时调用当前财富报告入口", async () => {
    const input: MobileWebRouteInput = {
      route: "reportEntry",
      params: {
        session: createMobileWebGuestSession("runtime-test"),
        draft: {
          imagePath: "blob:runtime-preview",
          theme: "wealth",
          reportType: "lite",
          reportVariant: "lite",
          redeemCode: "MVP-LITE",
          paintingIntention: "看见财富卡点",
          paintingFeeling: "平静",
          innerRadius: 0.36,
          middleRadius: 0.64,
          browserFile: new File(["mandala"], "mandala.png", {
            type: "image/png",
          }),
        },
      },
    };

    flushSync(() => {
      root.render(<MobileWebRuntime input={input} />);
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain("选择 Lite");
    });

    const liteButton = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("选择 Lite"),
    );
    expect(liteButton).toBeTruthy();

    await act(async () => {
      liteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(api.uploadImage).toHaveBeenCalledWith(expect.any(File));
      expect(api.createWealthReport).toHaveBeenCalledWith(
        expect.objectContaining({
          image_path: "/tmp/runtime-upload.png",
          storage_backend: "local",
          storage_key: "uploads/runtime-upload.png",
          report_mode: "lite",
          redeem_code: "MVP-LITE",
          painting_intention: "看见财富卡点",
          painting_feeling: "平静",
          inner_radius: 36,
          middle_radius: 64,
        }),
      );
    });
    expect(container.textContent).toContain("财富关系曼陀罗解读");
  });

  it("兑换码缺失时会保留明确错误而不是伪装成未生成报告", async () => {
    vi.mocked(api.createWealthReport).mockRejectedValueOnce(
      new Error("报告生成需要先配置可用的优惠券或兑换码。"),
    );

    const input: MobileWebRouteInput = {
      route: "upload",
      params: {
        session: createMobileWebGuestSession("runtime-test"),
        draft: {
          imagePath: "blob:runtime-preview",
          theme: "wealth",
          reportType: "lite",
          reportVariant: "lite",
          redeemCode: "",
          paintingIntention: "看见财富卡点",
          paintingFeeling: "平静",
          innerRadius: 0.36,
          middleRadius: 0.64,
          browserFile: new File(["mandala"], "mandala.png", {
            type: "image/png",
          }),
        },
      },
    };

    await act(async () => {
      root.render(<MobileWebRuntime input={input} />);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("开始解读"),
    );
    expect(startButton).toBeTruthy();

    await act(async () => {
      startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain(
        "报告生成需要先配置可用的优惠券或兑换码。",
      );
    });
    expect(container.textContent).not.toContain("报告内容待补齐");
  });

  it("上传页开始解读失败时会在当前页面展示错误", async () => {
    const input: MobileWebRouteInput = {
      route: "upload",
      params: {
        session: createMobileWebGuestSession("runtime-test"),
        draft: {
          imagePath: "/tmp/preview-only.png",
          theme: "wealth",
          reportType: "lite",
          reportVariant: "lite",
          redeemCode: "MVP-LITE",
          paintingIntention: "看见财富卡点",
          paintingFeeling: "平静",
          innerRadius: 0.36,
          middleRadius: 0.64,
        },
      },
    };

    await act(async () => {
      root.render(<MobileWebRuntime input={input} />);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("开始解读"),
    );
    expect(startButton).toBeTruthy();

    await act(async () => {
      startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain(
        "请先选择本地曼陀罗图片并完成上传。",
      );
    });
    expect(api.uploadImage).not.toHaveBeenCalled();
    expect(api.createWealthReport).not.toHaveBeenCalled();
  });
});
