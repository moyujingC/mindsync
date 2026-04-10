import { describe, expect, it } from "vitest";

import { createReportEntryPageDescriptor } from "./report-entry-page";

describe("report-entry page descriptor", () => {
  it("在 general 主题下仍显示 Lite / Pro 两种可选版本", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "general",
    });
    const lite = descriptor.cards.find((card) => card.id === "lite");
    const pro = descriptor.cards.find((card) => card.id === "pro");

    expect(descriptor.themeLabel).toBe("全面解读");
    expect(lite?.availability).toBe("available");
    expect(lite?.priceLabel).toBe("9.9 元");
    expect(pro?.availability).toBe("available");
    expect(pro?.priceLabel).toBe("39 元");
  });

  it("在具体主题下保留当前主题提示并展示两个版本", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "intimate_relationship",
    });
    const ids = descriptor.cards.map((card) => card.id);

    expect(descriptor.themeLabel).toBe("亲密关系");
    expect(ids).toEqual(["lite", "pro"]);
    expect(descriptor.description).toContain("先选这次想看的深度");
  });
});
