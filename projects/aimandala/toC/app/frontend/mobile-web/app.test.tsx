import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileWebApp } from "./app";
import type { InterpretationRecordResponse, MandalaFlowState } from "../shared/types";

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
    title: "Lite 解读报告",
    overall_impression: "你正在把注意力收回自己身上。",
    structured: {
      title: "Lite 解读报告",
      overall_impression: "你正在把注意力收回自己身上。",
      visual_elements_rendered: "中心更聚拢，外围更松。",
      emotion_portrait_rendered: "你在靠近和迟疑之间来回摆动。",
      pro_teaser: "可以继续看 Pro 版解读。",
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

const historyRecord: InterpretationRecordResponse = {
  interpretation_id: "ipt-history-1",
  user_id: "demo-user",
  theme: "general",
  status: "processing",
  generation_stage: "generating_lite",
  generation_progress: 52,
  version_purchased: ["pro"],
  three_circles: {
    inner_radius: 0.3,
    middle_radius: 0.62,
  },
  auto_detected: true,
  can_upgrade: false,
  created_at: "2026-04-11T08:00:00.000Z",
};

describe("MobileWebApp", () => {
  it("report 主路由默认渲染 Lite 解读报告页壳", () => {
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

    expect(html).toContain("你最近更想先稳住自己，再决定要不要继续靠近。");
    expect(html).toContain("阅读路径：画面依据 · 状态解释 · 模式命名 · 现实连接 · 一个下一步");
    expect(html).not.toContain("<h3>整体命中</h3>");
    expect(html).toContain("模式命名");
    expect(html).toContain("一个下一步");
    expect(html).toContain("看看 Pro 版解读");
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

  it("loading 路由在 Pro 等待中明确提示可去历史记录查看", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="loading"
        flowState={{
          ...flowState,
          step: "liteGenerating",
          status: {
            ...flowState.status!,
            status: "processing",
            generation_stage: "generating",
            generation_progress: 46,
            report_ready: false,
            version_purchased: ["lite", "pro"],
          },
          report: {
            ...flowState.report!,
            version: "lite",
            report: null,
          },
        }}
        uploadDraft={{
          imagePath: "/tmp/sample.png",
          theme: "general",
          reportType: "pro",
          reportVariant: "pro",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("Pro 解读会继续在后台生成");
    expect(html).toContain("历史页也会自动刷新，并支持你手动立即刷新");
    expect(html).toContain("稍后去历史记录查看");
  });

  it("history 路由会渲染刷新提示与生成中的阶段进度", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="history"
        records={[historyRecord]}
        historyQuery={{ filter: "pending", limit: 20, theme: "general" }}
        historyStatusLabel="Pro 解读仍在生成中"
        historyStatusDetail="你已经离开等待页，系统会继续在后台生成。"
        historyStatusTone="runtime"
        historyRefreshHint="最近更新于 16:20:00"
      />,
    );

    expect(html).toContain("立即刷新");
    expect(html).toContain("最近更新于 16:20:00");
    expect(html).toContain("阶段：正在生成 Lite 解读");
    expect(html).toContain("进度：约 52%");
    expect(html).toContain("继续查看进度");
  });
});
