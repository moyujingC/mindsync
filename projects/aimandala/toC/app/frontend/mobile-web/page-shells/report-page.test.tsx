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
      persona: {
        persona_id: "manman",
        persona_version: "manman-report-companion-v0.1",
        display_name: "曼曼",
        role_label: "AI 报告陪读 avatar",
        scope: "陪用户读懂本次曼陀罗报告，并在报告范围内回答追问",
        boundaries: ["不是心理咨询师"],
      },
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

    expect(html).not.toContain("对这份报告有疑问，可以问曼曼");
    expect(html).not.toContain("输入你想继续追问的报告问题");
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
});
