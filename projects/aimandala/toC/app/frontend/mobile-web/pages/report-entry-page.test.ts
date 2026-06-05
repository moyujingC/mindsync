import { describe, expect, it } from "vitest";

import { createReportEntryPageDescriptor } from "./report-entry-page";

describe("report-entry page descriptor", () => {
  it("在 wealth 议题下默认进入 Lite 直生成页", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "wealth",
      reportType: "lite",
    });
    const lite = descriptor.cards.find((card) => card.id === "lite");

    expect(descriptor.themeLabel).toBe("财富关系");
    expect(descriptor.title).toContain("Lite");
    expect(lite?.availability).toBe("available");
    expect(lite?.priceLabel).toBe("9.9 元");
    expect(lite?.cta).toContain("开始解读");
    expect(lite?.bullets).toContain("看见这幅画最突出的情绪线索与当下状态");
    expect(lite?.bullets.join("")).not.toContain("Pro");
    expect(descriptor.cards).toHaveLength(1);
  });

  it("升级场景下切到 Pro 直生成页并显示升级价", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "intimate_relationship",
      reportType: "pro",
    });
    const ids = descriptor.cards.map((card) => card.id);

    expect(descriptor.themeLabel).toBe("亲密关系");
    expect(ids).toEqual(["pro"]);
    expect(descriptor.description).toContain("Pro 完整报告");
    expect(descriptor.cards[0]?.priceLabel).toBe("再付 29 元升级");
    expect(descriptor.cards[0]?.cta).toBe("升级 Pro版");
  });
});
