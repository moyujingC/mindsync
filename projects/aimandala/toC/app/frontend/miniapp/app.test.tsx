import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MiniappApp } from "./app";
import { getMiniappLiveConfig } from "./config";

describe("MiniappApp", () => {
  it("historyRecordDetail 路由渲染 miniapp 静态详情页", () => {
    const html = renderToStaticMarkup(
      <MiniappApp route="historyRecordDetail" mode="preview" />,
    );

    expect(html).toContain("当前为 miniapp 静态壳预览");
    expect(html).toContain("历史记录详情");
    expect(html).toContain("打开 Lite 报告");
    expect(html).toContain("打开 Pro 报告");
  });

  it("history 路由渲染 miniapp 静态历史闭环", () => {
    const html = renderToStaticMarkup(
      <MiniappApp route="history" mode="preview" />,
    );

    expect(html).toContain("当前为 miniapp 静态壳预览");
    expect(html).toContain("历史记录");
    expect(html).toContain("待查看");
    expect(html).toContain("生成中");
  });

  it("runtime 模式会在历史页渲染 miniapp 联调环境标识", () => {
    const html = renderToStaticMarkup(
      <MiniappApp route="history" mode="runtime" />,
    );

    expect(html).toContain("当前为 miniapp 灰度关闭联调");
  });

  it("miniapp live 配置默认关闭", () => {
    expect(getMiniappLiveConfig()).toEqual({
      miniappLiveEnabled: false,
      wechatSessionEnabled: false,
    });
  });
});
