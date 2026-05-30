import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isReportFollowupEnabledMock } = vi.hoisted(() => ({
  isReportFollowupEnabledMock: vi.fn(),
}));

vi.mock("../../shared/api/config", async () => {
  const actual = await vi.importActual<typeof import("../../shared/api/config")>("../../shared/api/config");
  return {
    ...actual,
    isReportFollowupEnabled: isReportFollowupEnabledMock,
  };
});

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
  beforeEach(() => {
    isReportFollowupEnabledMock.mockReset();
    isReportFollowupEnabledMock.mockReturnValue(false);
  });

  it("feature flag off 时不显示追问入口", () => {
    const html = renderToStaticMarkup(<MobileWebReportPage state={flowState} />);

    expect(html).not.toContain("对这份报告有疑问，可以问曼曼");
  });

  it("feature flag on 时显示追问范围、输入提示和边界说明", () => {
    isReportFollowupEnabledMock.mockReturnValue(true);

    const html = renderToStaticMarkup(<MobileWebReportPage state={flowState} />);

    expect(html).toContain("对这份报告有疑问，可以问曼曼");
    expect(html).toContain("可以问：这段报告是什么意思");
    expect(html).toContain("输入你想继续追问的报告问题");
    expect(html).toContain("不能替代专业心理咨询、医疗建议、财务建议或重大现实决策");
  });
});
