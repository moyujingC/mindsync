import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/api", () => ({
  createInterpretation: vi.fn(),
  detectCircles: vi.fn(),
  getInterpretationReport: vi.fn(),
  getInterpretationStatus: vi.fn(),
  upgradeInterpretation: vi.fn(),
}));

import * as api from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";
import {
  refreshMobileWebProReport,
  runMobileWebLiteFlow,
} from "./controller";

describe("mobile-web controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runMobileWebLiteFlow 在已有三圈参数时不再重复调用 detect", async () => {
    vi.mocked(api.createInterpretation).mockResolvedValue({
      success: true,
      interpretation_id: "ipt-1",
      version: "lite",
      status: "processing",
      generation_stage: "queued",
      generation_progress: 20,
      three_circles: {
        inner_radius: 10,
        middle_radius: 20,
      },
      auto_detected: true,
      existing: false,
      report_ready: false,
    });
    vi.mocked(api.getInterpretationStatus).mockResolvedValue({
      interpretation_id: "ipt-1",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      report_ready: true,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 10,
        middle_radius: 20,
      },
      auto_detected: true,
      can_upgrade: true,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue({
      interpretation_id: "ipt-1",
      version: "lite",
      title: "一镜 Lite 版",
      overall_impression: "稳定",
      structured: {
        title: "一镜 Lite 版",
        overall_impression: "稳定",
        visual_elements_rendered: "视觉清晰",
        emotion_portrait_rendered: "情绪稳定",
        pro_teaser: "继续看 Pro",
      },
      report: "lite body",
      ai_qa_context: null,
      can_upgrade: true,
      upgrade_price: 39,
      error: null,
    });

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
      theme: "general",
      paintingIntention: "看见自己",
      paintingFeeling: "平静",
      innerRadius: 10,
      middleRadius: 20,
    });

    expect(api.detectCircles).not.toHaveBeenCalled();
    expect(snapshot.state.step).toBe("liteReady");
    expect(snapshot.report?.version).toBe("lite");
    expect(api.createInterpretation).toHaveBeenCalledWith(
      expect.objectContaining({
        inner_radius: 10,
        middle_radius: 20,
      }),
    );
    expect(api.getInterpretationReport).toHaveBeenCalledWith("ipt-1");
  });

  it("runMobileWebLiteFlow 在缺少三圈参数时只调用一次 detect 并复用结果", async () => {
    vi.mocked(api.detectCircles).mockResolvedValue({
      inner_radius: 0.33,
      middle_radius: 0.66,
      confidence: 0.95,
      method: "unit-test",
    });
    vi.mocked(api.createInterpretation).mockResolvedValue({
      success: true,
      interpretation_id: "ipt-detect",
      version: "lite",
      status: "processing",
      generation_stage: "queued",
      generation_progress: 20,
      three_circles: {
        inner_radius: 33,
        middle_radius: 66,
      },
      auto_detected: false,
      existing: false,
      report_ready: false,
    });
    vi.mocked(api.getInterpretationStatus).mockResolvedValue({
      interpretation_id: "ipt-detect",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      report_ready: true,
      version_purchased: ["lite"],
      three_circles: {
        inner_radius: 33,
        middle_radius: 66,
      },
      auto_detected: false,
      can_upgrade: true,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue({
      interpretation_id: "ipt-detect",
      version: "lite",
      title: "一镜 Lite 版",
      overall_impression: "稳定",
      structured: {
        title: "一镜 Lite 版",
        overall_impression: "稳定",
        visual_elements_rendered: "视觉清晰",
        emotion_portrait_rendered: "情绪稳定",
        pro_teaser: "继续看 Pro",
      },
      report: "lite body",
      ai_qa_context: null,
      can_upgrade: true,
      upgrade_price: 39,
      error: null,
    });

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
      theme: "general",
    });

    expect(api.detectCircles).toHaveBeenCalledTimes(1);
    expect(api.createInterpretation).toHaveBeenCalledWith(
      expect.objectContaining({
        inner_radius: 33,
        middle_radius: 66,
      }),
    );
    expect(snapshot.state.step).toBe("liteReady");
  });

  it("runMobileWebLiteFlow 在 detect 接口失败时进入 error", async () => {
    vi.mocked(api.detectCircles).mockRejectedValue(new Error("detect failed"));

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
    });

    expect(snapshot.state.step).toBe("error");
    expect(snapshot.state.lastError).toContain("detect failed");
  });

  it("refreshMobileWebProReport 在 pro 未就绪时保留回落语义", async () => {
    vi.mocked(api.getInterpretationStatus).mockResolvedValue({
      interpretation_id: "ipt-2",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      report_ready: true,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 8,
        middle_radius: 16,
      },
      auto_detected: true,
      can_upgrade: false,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue({
      interpretation_id: "ipt-2",
      version: "lite",
      title: "一镜 Lite 版",
      overall_impression: "仍返回 lite",
      structured: null,
      report: "lite body",
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    });

    const snapshot = await refreshMobileWebProReport(
      "ipt-2",
      initialMandalaFlowState,
    );

    expect(api.getInterpretationReport).toHaveBeenCalledWith("ipt-2", "pro");
    expect(snapshot.state.step).toBe("liteReady");
    expect(snapshot.report?.version).toBe("lite");
  });
});
