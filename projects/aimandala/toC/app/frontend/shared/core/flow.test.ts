import { describe, expect, it } from "vitest";

import {
  applyDetection,
  applyInterpretationCreated,
  applyReport,
  applyStatus,
  getLiteStructuredReport,
  getProStructuredReport,
  initialMandalaFlowState,
  selectImage,
} from "./flow";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  ReportResponse,
} from "../types";

const detection: DetectCirclesResponse = {
  inner_radius: 12,
  middle_radius: 24,
  confidence: 0.92,
  method: "unit-test",
  geometry_suggestion: {
    shape_type: "circle",
    cx: 50,
    cy: 50,
    rx: 30,
    ry: 30,
    rotation: 0,
    inner_t: 0.4,
    middle_t: 0.7,
  },
};

const interpretation: CreateInterpretationResponse = {
  success: true,
  interpretation_id: "ipt-lite-1",
  version: "lite",
  status: "processing",
  generation_stage: "generating_lite",
  generation_progress: 30,
  three_circles: {
    inner_radius: 12,
    middle_radius: 24,
  },
  auto_detected: true,
  existing: false,
  report_ready: false,
};

const readyStatus: InterpretationStatusResponse = {
  interpretation_id: "ipt-lite-1",
  status: "completed",
  generation_stage: "report_ready",
  generation_progress: 100,
  report_ready: true,
  version_purchased: ["lite"],
  three_circles: {
    inner_radius: 12,
    middle_radius: 24,
  },
  auto_detected: true,
  can_upgrade: true,
};

describe("shared/core flow", () => {
  it("推进 lite 状态链路并提取结构化报告", () => {
    const selected = selectImage(initialMandalaFlowState, "/tmp/sample.png");
    const detected = applyDetection(selected, detection);
    const created = applyInterpretationCreated(detected, interpretation);
    const ready = applyStatus(created, readyStatus);

    const liteReport: ReportResponse = {
      interpretation_id: "ipt-lite-1",
      version: "lite",
      title: "一镜 Lite 版",
      overall_impression: "整体稳定",
      structured: {
        title: "一镜 Lite 版",
        overall_impression: "整体稳定",
        visual_elements_rendered: "线条细密",
        emotion_portrait_rendered: "情绪平稳",
        pro_teaser: "可继续查看 Pro",
      },
      report: "lite body",
      ai_qa_context: null,
      can_upgrade: true,
      upgrade_price: 39,
      error: null,
    };

    const completed = applyReport(ready, liteReport);

    expect(selected.selectedImage?.imagePath).toBe("/tmp/sample.png");
    expect(detected.step).toBe("detectingCircles");
    expect(created.step).toBe("liteGenerating");
    expect(ready.step).toBe("liteReady");
    expect(completed.step).toBe("liteReady");
    expect(getLiteStructuredReport(completed.report)?.pro_teaser).toBe("可继续查看 Pro");
  });

  it("对 pro 报告直接进入 proReady 语义", () => {
    const proState = applyReport(initialMandalaFlowState, {
      interpretation_id: "ipt-pro-1",
      version: "pro",
      title: "一梳 Pro 版",
      overall_impression: "需要更深分析",
      structured: {
        first_impression: "边界感偏强",
        root_cause: {
          pattern: "控制感",
        },
      },
      report: "pro body",
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    });

    expect(proState.step).toBe("proReady");
    expect(proState.report?.version).toBe("pro");
    expect(getProStructuredReport(proState.report)?.first_impression).toBe("边界感偏强");
  });
});
