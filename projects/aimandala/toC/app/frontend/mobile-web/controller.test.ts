import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/api", () => ({
  createInterpretation: vi.fn(),
  detectCircles: vi.fn(),
  getInterpretationReport: vi.fn(),
  getInterpretationStatus: vi.fn(),
}));

import * as api from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";
import { refreshMobileWebReport, runMobileWebLiteFlow } from "./controller";

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
      auto_detected: false,
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
      auto_detected: false,
      can_upgrade: true,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue({
      interpretation_id: "ipt-1",
      version: "lite",
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
        visual_basis: "视觉清晰",
        pattern_interpretation: "情绪稳定",
        life_connection: "先停一下，再回应。",
        lite_healing_guidance: {
          directions: [{ title: "轻量方向", content: "先停一下，再回应。" }],
          micro_practices: [{ title: "小练习", content: "先写下一句话。" }],
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
    });

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
      storageBackend: "cos",
      storageKey: "aimandala/uploads/sample.png",
      imageLocalExpiresAt: "2026-04-13T00:00:00+00:00",
      theme: "general",
      paintingIntention: "看见自己",
      paintingFeeling: "平静",
      innerRadius: 10,
      middleRadius: 20,
    });

    expect(api.detectCircles).not.toHaveBeenCalled();
    expect(snapshot.state.step).toBe("liteReady");
    expect(snapshot.detection).toMatchObject({
      inner_radius: 0.1,
      middle_radius: 0.2,
      confidence: 1,
      method: "manual_confirmed",
    });
    expect(snapshot.state.detection).toMatchObject({
      inner_radius: 0.1,
      middle_radius: 0.2,
      confidence: 1,
      method: "manual_confirmed",
    });
    expect(snapshot.report?.version).toBe("lite");
    expect(api.createInterpretation).toHaveBeenCalledWith(
      expect.objectContaining({
        storage_backend: "cos",
        storage_key: "aimandala/uploads/sample.png",
        image_local_expires_at: "2026-04-13T00:00:00+00:00",
        inner_radius: 10,
        middle_radius: 20,
      }),
    );
    expect(api.getInterpretationReport).toHaveBeenCalledWith("ipt-1", "lite");
  });

  it("runMobileWebLiteFlow 缺少人工三圈参数时直接进入 error，不调用 detect", async () => {
    vi.mocked(api.createInterpretation).mockRejectedValue(
      new Error("manual three-circle boundaries are required"),
    );

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
    });

    expect(api.detectCircles).not.toHaveBeenCalled();
    expect(snapshot.state.step).toBe("error");
    expect(snapshot.state.lastError).toContain("manual three-circle boundaries are required");
  });

  it("refreshMobileWebReport 显式请求 lite 版本，避免 report 路由误落到 Pro", async () => {
    vi.mocked(api.getInterpretationStatus).mockResolvedValue({
      interpretation_id: "ipt-lite-route",
      status: "completed",
      generation_stage: "report_ready",
      generation_progress: 100,
      report_ready: true,
      version_purchased: ["lite", "pro"],
      three_circles: {
        inner_radius: 8,
        middle_radius: 16,
      },
      auto_detected: false,
      can_upgrade: false,
    });
    vi.mocked(api.getInterpretationReport).mockResolvedValue({
      interpretation_id: "ipt-lite-route",
      version: "lite",
      title: "一镜 Lite 版",
      overall_impression: "lite only",
      structured: null,
      report: "lite body",
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    });

    const snapshot = await refreshMobileWebReport(
      "ipt-lite-route",
      "lite",
      initialMandalaFlowState,
    );

    expect(api.getInterpretationReport).toHaveBeenCalledWith(
      "ipt-lite-route",
      "lite",
    );
    expect(snapshot.report?.version).toBe("lite");
    expect(snapshot.state.step).toBe("liteReady");
  });
});
