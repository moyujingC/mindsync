import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileWebReportPage } from "./report-page";
import type { MandalaFlowState } from "../../shared/types";

const flowState: MandalaFlowState = {
  step: "liteReady",
  selectedImage: { imagePath: "/tmp/sample.png" },
  detection: null,
  geometry: null,
  interpretation: null,
  status: null,
  report: {
    interpretation_id: "report-1",
    version: "lite",
    title: "财富关系曼陀罗解读报告",
    overall_impression: null,
    structured: {
      report_id: "report-1",
      title: "财富关系曼陀罗解读报告",
      summary: "结构化整体印象优先展示。",
      persona: {
        persona_id: "manman",
        persona_version: "manman-report-companion-v0.1",
        display_name: "曼曼",
        role_label: "AI 报告陪读 avatar",
        scope: "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问",
        boundaries: ["不是心理咨询师"],
      },
      modules: [
        {
          id: "summary",
          type: "summary",
          order: 1,
          title: "整体印象",
          body: "结构化整体印象优先展示。",
        },
        {
          id: "insights",
          type: "insight_list",
          order: 2,
          title: "六个核心看见",
          items: [
            {
              id: "boundary",
              label: "关系边界",
              content: "你正在重新确认关系里的边界。",
            },
          ],
        },
        {
          id: "practice",
          type: "practice_suggestion",
          order: 3,
          title: "一个小实验",
          action: "今天先写下一句真实需要。",
          observe: "观察写下之后的身体感受。",
          body: "今天先写下一句真实需要。\n观察写下之后的身体感受。",
        },
      ],
    },
    persona: {
      persona_id: "manman",
      persona_version: "manman-report-companion-v0.1",
      display_name: "曼曼",
      role_label: "AI 报告陪读 avatar",
      scope: "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问",
      boundaries: ["不是心理咨询师"],
    },
    report: "# 财富关系曼陀罗解读报告\n\n## 三圈观察\n内圈较稳，中圈有重复。",
    ai_qa_context: null,
    can_upgrade: false,
    upgrade_price: null,
    error: null,
    visual_draft: { visual_draft_md: "## 三圈观察\n内圈较稳。" },
  },
  lastError: null,
};

describe("MobileWebReportPage followup", () => {
  it("Lite 报告页不显示追问入口", () => {
    const html = renderToStaticMarkup(<MobileWebReportPage state={flowState} />);

    expect(html).toContain("解读报告(Lite版)");
    expect(html).toContain("整体印象");
    expect(html).toContain("六个核心看见");
    expect(html).toContain("一个小实验");
    expect(html).toContain("升级到 Pro");
    expect(html).not.toContain("对这份报告有疑问，可以问曼曼");
    expect(html).not.toContain("输入你想继续追问的报告问题");
    expect(html).not.toContain("请输入你想追问的问题");
  });

  it("可以按运行时传入的升级文案渲染底部动作", () => {
    const html = renderToStaticMarkup(
      <MobileWebReportPage
        state={flowState}
        primaryLabel="升级到 Pro 版本"
        secondaryLabel="重新上传画作"
        footerHint="如果你想继续深入读这幅画，可以在 Lite 基础上升级到 Pro 完整解读。"
      />,
    );

    expect(html).toContain("升级到 Pro 版本");
    expect(html).toContain("如果你想继续深入读这幅画");
  });

  it("优先渲染结构化模块，不把 markdown 当主渲染内容", () => {
    const html = renderToStaticMarkup(<MobileWebReportPage state={flowState} />);

    expect(html).toContain("结构化整体印象优先展示。");
    expect(html).toContain("关系边界");
    expect(html).toContain("你正在重新确认关系里的边界。");
    expect(html).not.toContain("三圈观察");
  });

  it("只有 markdown 时仍能生成 Lite fallback 模块", () => {
    const html = renderToStaticMarkup(
      <MobileWebReportPage
        state={{
          ...flowState,
          report: {
            ...flowState.report!,
            structured: null,
            report: "# Lite 解读报告\n\n## 整体印象\n中心较稳，外圈有打开趋势。\n\n## 行动建议\n这周做一次轻量表达。",
          },
        }}
      />,
    );

    expect(html).toContain("整体印象");
    expect(html).toContain("六个核心看见");
    expect(html).toContain("一个小实验");
    expect(html).toContain("中心较稳，外圈有打开趋势。");
    expect(html).toContain("这周做一次轻量表达。");
  });
});
