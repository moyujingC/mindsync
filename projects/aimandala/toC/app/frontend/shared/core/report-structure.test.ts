import { describe, expect, it } from "vitest";

import {
  hasProReportAccess,
  resolveSelfUnderstandingReportCta,
} from "./report-structure";
import type { LiteStructuredReport } from "../types";

const baseStructuredReport: LiteStructuredReport = {
  title: "Lite 解读报告",
  overall_impression: "整体命中",
  visual_elements_rendered: "画面依据",
  emotion_portrait_rendered: "情绪画像",
  pro_teaser: "Pro 版解读",
  self_understanding_blocks: {
    pattern_naming: {
      pattern_name: "先靠近又缩回去",
    },
    reality_connection: {
      life_dimension: "亲密关系",
      typical_scene: "关系推进时会迟疑",
    },
    next_step: {
      direction: "先让自己慢一点靠近",
    },
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
    expect(cta.primaryLabel).toBe("看看 Pro 版解读");
    expect(cta.legacyCaption).toContain("Lite / Pro 选择页");
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
  });
});
