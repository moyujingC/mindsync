// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

vi.mock("../shared/api", () => ({
  createInterpretation: vi.fn(),
  detectCircles: vi.fn(),
  getInterpretationList: vi.fn(),
  getInterpretationReport: vi.fn(),
  getInterpretationStatus: vi.fn(),
  uploadImage: vi.fn(),
}));

import * as api from "../shared/api";
import { createMobileWebGuestSession } from "./identity";
import { MobileWebRuntime } from "./runtime";
import type { MobileWebRouteInput } from "./router-plan";

function createLiteReportResponse() {
  return {
    interpretation_id: "ipt-runtime-lite",
    version: "lite" as const,
    title: "一镜 Lite 版",
    overall_impression: "稳定",
    structured: {
      topic_context: {
        topic: "general",
        topic_label: "全面解读",
        report_mode: "lite",
        orientation: {
          intro: "这份报告会从全面解读这个议题角度看这张画。",
          focus: "这个议题会从整体状态、能量分布、情绪模式和当下可走的一小步来理解这张画。",
          key_terms: [],
        },
      },
      current_reading: "稳定",
      visual_basis: "内圈偏亮，中圈偏深，外圈填充稳定。",
      pattern_interpretation: "当前模式偏向先收束再回应。",
      life_connection: "可以先确认自己真正想回应的部分。",
      lite_healing_guidance: {
        directions: [{ title: "轻量方向", content: "先停一下，再回应。" }],
        micro_practices: [{ title: "小练习", content: "写下一句真实感受。" }],
      },
      pro_report_entry: {
        title: "另一份更深的独立报告",
        summary: "如果你希望从更深层结构继续理解这张画，可以看看 Pro 报告。",
        product_note: "Pro 是独立购买的深度完整解读。",
      },
    },
    report: "lite body",
    ai_qa_context: null,
    can_upgrade: true,
    upgrade_price: 39,
    error: null,
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
    vi.clearAllMocks();
    vi.mocked(api.createInterpretation).mockResolvedValue({
      success: true,
      interpretation_id: "ipt-runtime-lite",
      version: "lite",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      three_circles: {
        inner_radius: 36,
        middle_radius: 64,
      },
      auto_detected: false,
      existing: false,
      report_ready: true,
    });
    vi.mocked(api.getInterpretationStatus).mockResolvedValue({
      interpretation_id: "ipt-runtime-lite",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      report_ready: true,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 36,
        middle_radius: 64,
      },
      auto_detected: false,
      can_upgrade: true,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue(createLiteReportResponse());
    vi.mocked(api.getInterpretationList).mockResolvedValue([]);
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

  it("选择页使用已有人工三圈比例创建解读，不调用 detect", async () => {
    const input: MobileWebRouteInput = {
      route: "reportEntry",
      params: {
        session: createMobileWebGuestSession("runtime-test"),
        draft: {
          imagePath: "/tmp/manual-circle-mandala.png",
          theme: "general",
          reportType: "lite",
          reportVariant: "lite",
          paintingIntention: "看见自己",
          paintingFeeling: "平静",
          innerRadius: 0.36,
          middleRadius: 0.64,
        },
      },
    };

    flushSync(() => {
      root.render(<MobileWebRuntime input={input} />);
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain("选择 Lite");
    });

    const liteButton = Array.from(container.querySelectorAll("button")).find((item) =>
      item.textContent?.includes("选择 Lite"),
    );
    expect(liteButton).toBeTruthy();

    await act(async () => {
      liteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(api.createInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          image_path: "/tmp/manual-circle-mandala.png",
          inner_radius: 36,
          middle_radius: 64,
        }),
      );
    });
    expect(api.detectCircles).not.toHaveBeenCalled();
  });
});
