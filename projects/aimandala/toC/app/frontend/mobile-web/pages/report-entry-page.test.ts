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
    expect(descriptor.statusLabel).toBe("待支付");
    expect(descriptor.title).toContain("Lite");
    expect(lite?.availability).toBe("available");
    expect(lite?.priceLabel).toBe("9.9 元");
    expect(lite?.cta).toContain("确认解读");
    expect(lite?.bulletsTitle).toBe("落笔成心，照见此刻的自己");
    expect(lite?.bullets).toContain("从线条与色彩中，看见你当下的真实心境");
    expect(lite?.bullets).toHaveLength(5);
    expect(lite?.bullets.join("")).not.toContain("Pro");
    expect(descriptor.cards).toHaveLength(1);
  });

  it("升级场景下切到 Pro 支付确认页并显示升级价", () => {
    const descriptor = createReportEntryPageDescriptor({
      theme: "intimate_relationship",
      reportType: "pro",
    });
    const ids = descriptor.cards.map((card) => card.id);

    expect(descriptor.themeLabel).toBe("亲密关系");
    expect(descriptor.statusLabel).toBe("待支付");
    expect(ids).toEqual(["pro"]);
    expect(descriptor.description).toContain("发起 Pro 升级");
    expect(descriptor.description).toContain("支付确认前不会展示 Pro 权益内容");
    expect(descriptor.paymentHint).toContain("支付确认前不会解锁 Pro 权益");
    expect(descriptor.cards[0]?.priceLabel).toBe("再付 29 元升级");
    expect(descriptor.cards[0]?.cta).toBe("升级 Pro版");
  });

  it("Pro 支付回调延迟时显示等待确认并禁用继续升级", () => {
    const descriptor = createReportEntryPageDescriptor(
      {
        theme: "wealth",
        reportType: "pro",
      },
      "pending",
    );

    expect(descriptor.statusLabel).toBe("等待支付确认");
    expect(descriptor.paymentHint).toContain("正在等待回调确认");
    expect(descriptor.cards[0]?.cta).toBe("等待确认中");
  });

  it("Pro 支付失败或取消时不表达权益已解锁", () => {
    const cancelled = createReportEntryPageDescriptor(
      {
        theme: "wealth",
        reportType: "pro",
      },
      "cancelled",
    );
    const error = createReportEntryPageDescriptor(
      {
        theme: "wealth",
        reportType: "pro",
      },
      "error",
    );

    expect(cancelled.paymentHint).toContain("Pro 权益未解锁");
    expect(error.paymentHint).toContain("Pro 权益未解锁");
    expect(cancelled.description).not.toContain("直接跳过");
    expect(error.description).not.toContain("直接跳过");
  });
});
