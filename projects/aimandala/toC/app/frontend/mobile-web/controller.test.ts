import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/api", () => ({
  createWealthReport: vi.fn(),
  uploadImage: vi.fn(),
}));

import * as api from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";
import {
  refreshMobileWebReport,
  runMobileWebLiteFlow,
  runMobileWebReportFlow,
} from "./controller";
import type {
  InterpretationVersion,
  WealthReportResponse,
} from "../shared/types";

function createWealthReportResponse(
  reportMode: InterpretationVersion = "lite",
): WealthReportResponse {
  return {
    success: true,
    report_id: "wealth-1",
    report_mode: reportMode,
    final_report_md: "# 财富关系曼陀罗解读\n\n当前财富能量稳定。",
    final_report: {
      title: "财富关系曼陀罗解读",
      summary: "当前财富能量稳定。",
    },
    visual_draft: { visual_observation: {} },
    prompt_pack_manifest: { pack_id: "wealth-report-v1.0.0" },
    quality_gate: {},
    run_summary: {},
  };
}

describe("mobile-web controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runMobileWebLiteFlow 使用人工三圈参数调用财富报告入口", async () => {
    vi.mocked(api.createWealthReport).mockResolvedValue(
      createWealthReportResponse(),
    );

    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
      storageBackend: "cos",
      storageKey: "aimandala/uploads/sample.png",
      theme: "wealth",
      redeemCode: "MVP-LITE",
      paintingIntention: "看见财富卡点",
      paintingFeeling: "平静",
      innerRadius: 10,
      middleRadius: 20,
    });

    expect(snapshot.state.step).toBe("liteReady");
    expect(snapshot.detection).toMatchObject({
      inner_radius: 0.1,
      middle_radius: 0.2,
      confidence: 1,
      method: "manual_confirmed",
    });
    expect(snapshot.report?.interpretation_id).toBe("wealth-1");
    expect(snapshot.report?.version).toBe("lite");
    expect(api.createWealthReport).toHaveBeenCalledWith(
      expect.objectContaining({
        image_path: "/tmp/sample.png",
        storage_backend: "cos",
        storage_key: "aimandala/uploads/sample.png",
        report_mode: "lite",
        redeem_code: "MVP-LITE",
        painting_intention: "看见财富卡点",
        painting_feeling: "平静",
        inner_radius: 10,
        middle_radius: 20,
      }),
    );
  });

  it("runMobileWebReportFlow 在 pro 模式下也会调用同一个财富报告入口", async () => {
    vi.mocked(api.createWealthReport).mockResolvedValue(
      createWealthReportResponse("pro"),
    );

    const snapshot = await runMobileWebReportFlow(
      {
        userId: "user-1",
        imagePath: "/tmp/sample.png",
        storageBackend: "cos",
        storageKey: "aimandala/uploads/sample.png",
        theme: "wealth",
        redeemCode: "MVP-PRO",
        paintingIntention: "看见财富卡点",
        paintingFeeling: "平静",
        innerRadius: 10,
        middleRadius: 20,
      },
      "pro",
    );

    expect(snapshot.report?.version).toBe("pro");
    expect(api.createWealthReport).toHaveBeenCalledWith(
      expect.objectContaining({
        report_mode: "pro",
        redeem_code: "MVP-PRO",
      }),
    );
  });

  it("runMobileWebLiteFlow 缺少人工三圈参数时直接进入 error", async () => {
    const snapshot = await runMobileWebLiteFlow({
      userId: "user-1",
      imagePath: "/tmp/sample.png",
    });

    expect(api.createWealthReport).not.toHaveBeenCalled();
    expect(snapshot.state.step).toBe("error");
    expect(snapshot.state.lastError).toContain(
      "manual three-circle boundaries are required",
    );
  });

  it("refreshMobileWebReport 在当前 API 下明确不可用", async () => {
    const snapshot = await refreshMobileWebReport(
      "wealth-1",
      "lite",
      initialMandalaFlowState,
    );

    expect(snapshot.state.step).toBe("error");
    expect(snapshot.state.lastError).toContain(
      "Report refresh is not available",
    );
  });
});
