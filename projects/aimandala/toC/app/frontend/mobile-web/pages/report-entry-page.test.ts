import { describe, expect, it } from "vitest";

import { createReportEntryPageDescriptor } from "./report-entry-page";

describe("report-entry page descriptor", () => {
  it("在 general 主题下提示议题聚焦报告需要具体主题", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "general",
    });
    const issueFocus = descriptor.cards.find((card) => card.id === "issue_focus");

    expect(issueFocus?.availability).toBe("theme_required");
    expect(issueFocus?.cta).toBe("先选一个具体主题");
  });

  it("默认推荐自我理解报告，并开放深层模式报告", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "intimate_relationship",
    });
    const selfUnderstanding = descriptor.cards.find((card) => card.id === "self_understanding");
    const deepPattern = descriptor.cards.find((card) => card.id === "deep_pattern");

    expect(selfUnderstanding?.recommended).toBe(true);
    expect(selfUnderstanding?.availability).toBe("available");
    expect(deepPattern?.availability).toBe("available");
  });
});
