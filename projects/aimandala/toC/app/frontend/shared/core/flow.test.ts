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
        current_reading: "整体稳定",
        visual_basis: "线条细密",
        pattern_interpretation: "情绪平稳",
        life_connection: "当下可以先稳住节奏。",
        lite_healing_guidance: {
          directions: [{ title: "先稳住节奏", content: "先不要急着推进，保留一点观察空间。" }],
          micro_practices: [{ title: "一句记录", content: "写下一句此刻最真实的感受。" }],
        },
        pro_report_entry: {
          title: "另一份更深的独立报告",
          summary: "如果你希望从更深层结构继续理解这张画，可以看看 Pro 报告。",
          product_note: "Pro 不是 Lite 的升级版，而是另一份独立购买的完整解读。",
        },
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
    expect(getLiteStructuredReport(completed.report)?.pro_report_entry.summary).toContain("更深层结构");
  });

  it("对 pro 报告直接进入 proReady 语义", () => {
    const proState = applyReport(initialMandalaFlowState, {
      interpretation_id: "ipt-pro-1",
      version: "pro",
      title: "一梳 Pro 版",
      overall_impression: "需要更深分析",
      structured: {
        topic_context: {
          topic: "general",
          topic_label: "全面解读",
          report_mode: "pro",
          orientation: {
            intro: "这份报告会从全面解读这个议题角度看这张画。",
            focus: "这个议题会从整体状态、能量分布、情绪模式和当下可走的一小步来理解这张画。",
            key_terms: [],
          },
        },
        deep_impression: "边界感偏强",
        evidence_digest: "线条边界清楚。",
        imbalance_diagnosis: "边界收紧。",
        root_cause_chain: {
          surface: "先控制。",
          mechanism: "用掌控感降低不确定。",
          core: "害怕失去主动权。",
        },
        deep_structure_interpretation: "这更像控制感背后的安全议题。",
        healing_plan: [],
      },
      report: "pro body",
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    });

    expect(proState.step).toBe("proReady");
    expect(proState.report?.version).toBe("pro");
    expect(getProStructuredReport(proState.report)?.deep_impression).toBe("边界感偏强");
  });
});
