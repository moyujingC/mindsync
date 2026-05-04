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
    auto_detected: false,
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
    auto_detected: false,
    can_upgrade: true,
  },
  report: {
    interpretation_id: "ipt-report-1",
    version: "lite",
    title: "Lite 解读报告",
    overall_impression: "你正在把注意力收回自己身上。",
    structured: {
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
              explanation: "你在关系中能否感到自己可以被接住。",
            },
          ],
        },
      },
      current_reading: "你最近更想先稳住自己，再决定要不要继续靠近。",
      visual_basis: "中心颜色更浓，外围线条更轻。",
      pattern_interpretation: "你会先有表达冲动，随后又迅速回撤；这样能先保住安全感。",
      life_connection: "关系要更进一步时会想暂停一下，会让对方感到你忽近忽远。",
      lite_healing_guidance: {
        directions: [
          {
            title: "轻量调节方向",
            content: "先让自己慢一点，再决定要不要继续靠近。",
          },
        ],
        micro_practices: [
          {
            title: "一句小练习",
            content: "先把真实感受说出一句就好。",
          },
        ],
      },
      pro_report_entry: {
        title: "另一份更深的独立报告",
        summary: "如果你希望从更深层结构继续理解这张画，可以看看 Pro 报告。",
        product_note: "Pro 不是 Lite 的升级版，而是另一份独立购买的完整解读。",
      },
    },
    report: null,
    ai_qa_context: null,
    can_upgrade: true,
    upgrade_price: 39,
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
  auto_detected: false,
  can_upgrade: false,
  created_at: "2026-04-11T08:00:00.000Z",
  upgrade_history: [
    {
      from: "lite",
      to: "pro",
      price_diff: 39,
      at: "2026-04-11T08:20:00.000Z",
    },
  ],
};

describe("MobileWebApp", () => {
  it("landing 路由渲染首屏新文案与入口标签", () => {
    const html = renderToStaticMarkup(<MobileWebApp route="landing" />);

    expect(html).toContain("画出你的潜意识");
    expect(html).toContain("AI 解读曼陀罗画作  ·  探索内心世界");
    expect(html).toContain("融合阴阳五行三才的东方解读视角");
    expect(html).toContain("开始体验");
    expect(html).toContain("历史解读");
    expect(html).toContain("滑动了解详情");
  });

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
    expect(html).toContain("阅读路径：议题理解 · 当前命中 · 画面依据 · 模式解释 · 现实连接 · 轻量疗愈");
    expect(html).not.toContain("<h3>整体命中</h3>");
    expect(html).toContain("模式解释");
    expect(html).toContain("议题理解");
    expect(html).toContain("看看另一份更深的 Pro 报告");
    expect(html).toContain("更深层结构继续理解这张画");
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
    expect(html).toContain("查看详情与进度");
  });

  it("historyRecordDetail 路由会渲染版本选择与升级历史", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="historyRecordDetail"
        record={{
          ...historyRecord,
          status: "completed",
          generation_stage: "completed",
          generation_progress: 100,
          version_purchased: ["lite", "pro"],
        }}
      />,
    );

    expect(html).toContain("历史记录详情");
    expect(html).toContain("打开 Lite 报告");
    expect(html).toContain("打开 Pro 报告");
    expect(html).toContain("版本演进");
    expect(html).toContain("Lite / Pro");
  });
});
