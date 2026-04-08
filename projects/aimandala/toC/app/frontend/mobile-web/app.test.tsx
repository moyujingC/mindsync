import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileWebApp } from "./app";
import type { MandalaFlowState } from "../shared/types";

const flowState: MandalaFlowState = {
  step: "liteReady",
  selectedImage: {
    imagePath: "/tmp/sample.png",
  },
  detection: null,
  geometry: null,
  interpretation: {
    success: true,
    interpretation_id: "ipt-report-1",
    version: "lite",
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.63,
    },
    auto_detected: true,
    existing: false,
    report_ready: true,
  },
  status: {
    interpretation_id: "ipt-report-1",
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    report_ready: true,
    version_purchased: ["lite"],
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.63,
    },
    auto_detected: true,
    can_upgrade: true,
  },
  report: {
    interpretation_id: "ipt-report-1",
    version: "lite",
    title: "自我理解报告",
    overall_impression: "你正在把注意力收回自己身上。",
    structured: {
      title: "自我理解报告",
      overall_impression: "你正在把注意力收回自己身上。",
      visual_elements_rendered: "中心更聚拢，外围更松。",
      emotion_portrait_rendered: "你在靠近和迟疑之间来回摆动。",
      pro_teaser: "可以继续看更深层报告。",
      self_understanding_blocks: {
        opening_hit: "你最近更想先稳住自己，再决定要不要继续靠近。",
        visual_evidence: {
          summary: "中心颜色更浓，外围线条更轻。",
        },
        state_interpretation: {
          current_state: "你先把感受往内收。",
          emotional_tension: "一边想靠近，一边怕暴露太多。",
          explanation_chain: "所以画面出现了向内聚拢和向外舒展并存。",
        },
        pattern_naming: {
          pattern_name: "先靠近再缩回去",
          pattern_description: "你会先有表达冲动，随后又迅速回撤。",
          protective_logic: "这样能先保住安全感。",
        },
        reality_connection: {
          life_dimension: "亲密关系",
          typical_scene: "关系要更进一步时会想暂停一下。",
          current_impact: "会让对方感到你忽近忽远。",
        },
        next_step: {
          direction: "下一次先不急着解释自己。",
          action: "先把真实感受说出一句就好。",
        },
      },
    },
    report: null,
    ai_qa_context: null,
    can_upgrade: true,
    upgrade_price: 49,
    error: null,
  },
  lastError: null,
};

describe("MobileWebApp", () => {
  it("report 主路由默认渲染自我理解报告页壳", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="report"
        flowState={flowState}
        uploadDraft={{
          imagePath: "/tmp/sample.png",
          theme: "intimate_relationship",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("整体命中");
    expect(html).toContain("模式命名");
    expect(html).toContain("一个下一步");
    expect(html).toContain("看看更深层模式");
  });

  it("reportLegacy 仍保留旧报告页壳", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="reportLegacy"
        flowState={flowState}
        uploadDraft={{
          imagePath: "/tmp/sample.png",
          theme: "intimate_relationship",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("Lite版基础解读");
    expect(html).toContain("保存报告");
  });
});
