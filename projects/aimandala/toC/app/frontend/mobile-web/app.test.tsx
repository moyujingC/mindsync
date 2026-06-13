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
    expect(html).toContain("AI解读曼陀罗画作 · 探索内心世界");
    expect(html).toContain("来自东方的五行智慧");
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

  it("report 主路由默认不渲染 Lite 追问入口", () => {
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

    expect(html).toContain("解读报告(Lite版)");
    expect(html).not.toContain("输入你想继续追问的问题");
  });

  it("reportPro 路由渲染 Pro 报告与段落级追问", () => {
    const proFlowState: MandalaFlowState = {
      ...flowState,
      step: "proReady",
      status: {
        ...flowState.status!,
        version_purchased: ["lite", "pro"],
        can_upgrade: false,
      },
      report: {
        ...flowState.report!,
        version: "pro",
        title: "Pro 解读报告",
        report:
          "# Pro 解读报告\n## 深层主线\n你正在把注意力收回自己身上。\n\n## 深度解读\n画面中的收束感提示你正在保护真实感受。\n\n## 三圈能量\n内圈较稳，中圈有重复。\n\n## 模式形成原因\n你习惯先确认安全，再表达需要。\n\n## 调节建议\n这周可以先做一次小而真实的表达。",
      },
    };
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="reportPro"
        flowState={proFlowState}
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

    expect(html).toContain("Pro版完整解读");
    expect(html).toContain("追问");
    expect(html).toContain("请输入你想追问的问题");
    expect(html).toContain("追问记录");
    expect(html).not.toContain("AI 助手随时为你解答");
  });

  it("report 错误态不渲染正文占位和上传调试信息", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="report"
        flowState={{
          ...flowState,
          step: "error",
          report: null,
          lastError: "报告生成需要先配置可用的优惠券或兑换码。",
        }}
        uploadDraft={{
          imagePath: "/tmp/sample.png",
          theme: "wealth",
          paintingIntention: "",
          paintingFeeling: "",
          uploadAsset: {
            runtimeImagePath: "/tmp/runtime.png",
            storageBackend: "local",
            storageKey: "uploads/sample.png",
          },
        }}
        environmentLabel="当前为联调运行时"
      />,
    );

    expect(html).toContain("报告暂未生成");
    expect(html).toContain("当前流程有异常");
    expect(html).toContain("报告生成需要先配置可用的优惠券或兑换码。");
    expect(html).not.toContain("报告内容待补齐");
    expect(html).not.toContain("调试信息");
    expect(html).not.toContain("运行时图片路径");
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

  it("reportEntry 路由缺少三圈结果时回退到上传页", () => {
    const html = renderToStaticMarkup(
      <MobileWebApp
        route="reportEntry"
        uploadDraft={{
          imagePath: "/tmp/sample.png",
          theme: "wealth",
          paintingIntention: "",
          paintingFeeling: "",
        }}
      />,
    );

    expect(html).toContain("上传曼陀罗画作");
    expect(html).not.toContain("待支付");
    expect(html).not.toContain("确认解读");
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

  it("historyRecordDetail 路由会渲染版本进度与解读轨迹", () => {
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

    expect(html).toContain("解读详情");
    expect(html).toContain("查看 Lite");
    expect(html).toContain("查看 Pro");
    expect(html).toContain("这次解读的过程");
    expect(html).toContain("Lite");
    expect(html).toContain("Pro");
  });

  it("historyRecordDetail 三种状态路由都可直接渲染", () => {
    const notUpgraded = renderToStaticMarkup(
      <MobileWebApp
        route="historyRecordDetailNotUpgraded"
        record={{
          ...historyRecord,
          interpretation_id: "detail-not-upgraded",
          status: "completed",
          generation_stage: "report_ready",
          generation_progress: 100,
          version_purchased: ["lite"],
          can_upgrade: true,
        }}
      />,
    );
    const generating = renderToStaticMarkup(
      <MobileWebApp
        route="historyRecordDetailGenerating"
        record={{
          ...historyRecord,
          interpretation_id: "detail-generating",
          status: "processing",
          generation_stage: "generating_pro",
          generation_progress: 62,
          version_purchased: ["lite", "pro"],
          can_upgrade: false,
        }}
      />,
    );
    const viewable = renderToStaticMarkup(
      <MobileWebApp
        route="historyRecordDetailViewable"
        record={{
          ...historyRecord,
          interpretation_id: "detail-viewable",
          status: "completed",
          generation_stage: "report_ready",
          generation_progress: 100,
          version_purchased: ["lite", "pro"],
          can_upgrade: false,
        }}
      />,
    );

    expect(notUpgraded).toContain("查看 Lite");
    expect(notUpgraded).toContain("未升级");
    expect(generating).toContain("查看进度");
    expect(generating).toContain("生成中");
    expect(viewable).toContain("查看 Pro");
    expect(viewable).toContain("已可查看");
    expect(viewable).toContain("这是本次解读的第一步");
    expect(viewable).toContain("mw-history-detail-step--lite");
    expect(viewable).not.toContain("is-compact");
  });
});
