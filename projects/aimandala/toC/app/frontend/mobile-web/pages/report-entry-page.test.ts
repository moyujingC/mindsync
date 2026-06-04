import { describe, expect, it } from "vitest";

import { createReportEntryPageDescriptor } from "./report-entry-page";

describe("report-entry page descriptor", () => {
  it("在 wealth 议题下默认进入 Lite 付款页", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "wealth",
      reportType: "lite",
    });
    const lite = descriptor.cards.find((card) => card.id === "lite");

    expect(descriptor.themeLabel).toBe("财富关系");
    expect(descriptor.title).toContain("Lite");
    expect(lite?.availability).toBe("available");
    expect(lite?.priceLabel).toBe("9.9 元");
    expect(lite?.cta).toContain("确认支付");
    expect(descriptor.cards).toHaveLength(1);
  });

  it("升级场景下切到 Pro 付款页并显示补差价", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "intimate_relationship",
      reportType: "pro",
    });
    const ids = descriptor.cards.map((card) => card.id);

    expect(descriptor.themeLabel).toBe("亲密关系");
    expect(ids).toEqual(["pro"]);
    expect(descriptor.description).toContain("Pro 完整报告");
    expect(descriptor.cards[0]?.priceLabel).toBe("再付 29 元升级");
  });
});
