import { describe, expect, it } from "vitest";

import {
  hasProReportAccess,
  resolveSelfUnderstandingReportCta,
} from "./report-structure";
import type { LiteStructuredReport } from "../types";

const baseStructuredReport: LiteStructuredReport = {
  topic_context: {
    topic: "intimate_relationship",
    topic_label: "亲密关系",
    report_mode: "lite",
    orientation: {
      intro: "这份报告会从亲密关系这个议题角度看这张画。",
      focus: "这个议题通常关注靠近、边界、安全感和依恋模式。",
      key_terms: [
        {
          term: "安全感",
          explanation: "你在关系里能否感到自己可以被接住。",
        },
      ],
    },
  },
  current_reading: "整体命中",
  visual_basis: "画面依据",
  pattern_interpretation: "先靠近又缩回去",
  life_connection: "亲密关系里，关系推进时会迟疑。",
  lite_healing_guidance: {
    directions: [{ title: "轻一点", content: "先把节奏放慢。" }],
    micro_practices: [{ title: "先写一句", content: "先写下一句真实感受。" }],
  },
  pro_report_entry: {
    title: "另一份更深的独立报告",
    summary: "如果你希望从更深层结构继续理解这张画，可以看看 Pro。",
    product_note: "Pro 是独立购买、独立成立的深度完整解读。",
  },
};

describe("shared/core report-structure", () => {
  it("识别已经拥有 Pro 访问权限的状态", () => {
    expect(
      hasProReportAccess({
        status: {
          interpretation_id: "ipt-1",
          status: "completed",
          generation_stage: "report_ready",
          generation_progress: 100,
          report_ready: true,
          version_purchased: ["lite", "pro"],
          three_circles: {
            inner_radius: 10,
            middle_radius: 20,
          },
          auto_detected: true,
          can_upgrade: false,
        },
        report: null,
      }),
    ).toBe(true);
  });

  it("对已有 Pro 权限返回直接查看 CTA", () => {
    const cta = resolveSelfUnderstandingReportCta({
      theme: "intimate_relationship",
      hasProAccess: true,
      canUpgrade: false,
      structured: baseStructuredReport,
    });

    expect(cta.intent).toBe("open_pro_report");
    expect(cta.primaryLabel).toBe("查看 Pro 版解读");
    expect(cta.footerHint).toContain("先靠近又缩回去");
    expect(cta.footerHint).toContain("亲密关系");
  });

  it("对可升级结果返回进入下一步选择 CTA", () => {
    const cta = resolveSelfUnderstandingReportCta({
      theme: "personal_growth",
      hasProAccess: false,
      canUpgrade: true,
      structured: baseStructuredReport,
    });

    expect(cta.intent).toBe("open_report_entry");
    expect(cta.primaryLabel).toBe("看看另一份更深的 Pro 报告");
    expect(cta.footerHint).toContain("更深层结构");
    expect(cta.legacyCaption).toContain("单独购买 Pro 深度报告");
  });

  it("对 general 主题且不可升级结果返回再画一幅 CTA", () => {
    const cta = resolveSelfUnderstandingReportCta({
      theme: "general",
      hasProAccess: false,
      canUpgrade: false,
      structured: baseStructuredReport,
    });

    expect(cta.intent).toBe("restart_upload");
    expect(cta.primaryLabel).toBe("带着这份理解再画一幅");
  });

  it("对具体主题且不可升级结果强调继续同一主题", () => {
    const cta = resolveSelfUnderstandingReportCta({
      theme: "father_relationship",
      hasProAccess: false,
      canUpgrade: false,
      structured: baseStructuredReport,
    });

    expect(cta.intent).toBe("restart_upload");
    expect(cta.primaryLabel).toBe("带着这个主题再画一幅");
    expect(cta.footerHint).toContain("父亲关系");
    expect(cta.footerHint).not.toContain("升级");
  });
});
