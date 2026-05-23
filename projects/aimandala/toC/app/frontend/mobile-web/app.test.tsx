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
      title: "Lite 解读报告",
      summary: "你正在把注意力收回自己身上。",
      report_mode: "lite",
    },
    report: "# Lite 解读报告\n\n你正在把注意力收回自己身上。",
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
  theme: "wealth",
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
          theme: "wealth",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("这份报告已经按新版解读链路生成");
    expect(html).toContain("阅读路径：Lite 解读报告");
    expect(html).toContain("重新上传画作");
  });

  it("loading 路由在 Pro 等待中不再提示后台历史入口", () => {
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
          theme: "wealth",
          reportType: "pro",
          reportVariant: "pro",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("Pro 版完整解读");
    expect(html).toContain("正在生成基础线索，随后展开 Pro 深度分析");
    expect(html).not.toContain("Pro 解读会继续在后台生成");
    expect(html).not.toContain("稍后去历史记录查看");
  });

  it("history 路由会渲染刷新提示与生成中的阶段进度", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="history"
        records={[historyRecord]}
        historyQuery={{ filter: "pending", limit: 20, theme: "wealth" }}
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
