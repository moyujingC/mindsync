import { describe, expect, it } from "vitest";

import {
  applyDetection,
  applyInterpretationCreated,
  applyReport,
  applyStatus,
  applyWealthReport,
  initialMandalaFlowState,
  selectImage,
} from "./flow";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  WealthReportResponse,
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
  auto_detected: false,
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
  auto_detected: false,
  can_upgrade: true,
};

describe("shared/core flow", () => {
  it("推进 lite 状态链路", () => {
    const selected = selectImage(initialMandalaFlowState, "/tmp/sample.png");
    const detected = applyDetection(selected, detection);
    const created = applyInterpretationCreated(detected, interpretation);
    const ready = applyStatus(created, readyStatus);

    expect(selected.selectedImage?.imagePath).toBe("/tmp/sample.png");
    expect(detected.step).toBe("detectingCircles");
    expect(created.step).toBe("liteGenerating");
    expect(ready.step).toBe("liteReady");
  });

  it("applyWealthReport 直挂新版返回结构", () => {
    const snapshot = applyWealthReport(initialMandalaFlowState, {
      success: true,
      report_id: "wealth-1",
      report_mode: "lite",
      final_report_md: "# 财富关系曼陀罗解读\n\n当前财富能量稳定。",
      final_report: {
        title: "财富关系曼陀罗解读",
        summary: "当前财富能量稳定。",
        persona: {
          persona_id: "manman",
          persona_version: "manman-report-companion-v0.1",
          display_name: "曼曼",
          role_label: "AI 报告陪读 avatar",
          scope: "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问",
          boundaries: ["不是心理咨询师"],
        },
      },
      visual_draft: { summary: "视觉草稿" },
      prompt_pack_manifest: { pack_id: "wealth-report-v1.0.0" },
      quality_gate: { status: "passed" },
      run_summary: { duration_ms: 1234 },
    } as WealthReportResponse);

    expect(snapshot.step).toBe("liteReady");
    expect(snapshot.report?.title).toBe("财富关系曼陀罗解读");
    expect(snapshot.report?.overall_impression).toBe("当前财富能量稳定。");
    expect(snapshot.report?.report).toContain("财富关系曼陀罗解读");
    expect(snapshot.report?.persona?.persona_id).toBe("manman");
    expect(snapshot.report?.persona?.display_name).toBe("曼曼");
    expect(snapshot.report?.visual_draft).toBeTruthy();
    expect(snapshot.report?.prompt_pack_manifest).toBeTruthy();
  });

  it("对 pro 报告直接进入 proReady 语义", () => {
    const proState = applyReport(initialMandalaFlowState, {
      interpretation_id: "ipt-pro-1",
      version: "pro",
      title: "一梳 Pro 版",
      overall_impression: "需要更深分析",
      structured: null,
      persona: null,
      report: "pro body",
      ai_qa_context: null,
      can_upgrade: false,
      upgrade_price: null,
      error: null,
    });

    expect(proState.step).toBe("proReady");
    expect(proState.report?.version).toBe("pro");
  });
});
