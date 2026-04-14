import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MiniappApp } from "./app";

describe("MiniappApp", () => {
  it("historyRecordDetail 路由渲染 miniapp 静态详情页", () => {
    const html = renderToStaticMarkup(
      <MiniappApp route="historyRecordDetail" />,
    );

    expect(html).toContain("当前为 miniapp 静态壳预览");
    expect(html).toContain("历史记录详情");
    expect(html).toContain("打开 Lite 报告");
    expect(html).toContain("打开 Pro 报告");
  });

  it("history 路由渲染 miniapp 静态历史闭环", () => {
    const html = renderToStaticMarkup(
      <MiniappApp route="history" />,
    );

    expect(html).toContain("当前为 miniapp 静态壳预览");
    expect(html).toContain("历史记录");
    expect(html).toContain("查看记录详情");
  });
});
