import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "./renderRoute";

describe("RelayHub console routes", () => {
  it("renders dashboard overview", async () => {
    renderRoute("/dashboard");

    expect(await screen.findByText("环境总览")).toBeInTheDocument();
    expect(await screen.findByText("决策摘要")).toBeInTheDocument();
  });

  it("renders provider route with empty-state provider metrics and restored filters", async () => {
    renderRoute(
      "/providers/freebridge-sandbox?kind=%E5%85%8D%E8%B4%B9%E5%9B%BD%E5%A4%96%20API&environment=%E5%BC%80%E5%8F%91%E7%89%88",
    );

    expect(await screen.findByText("当前没有 24 小时样本")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "免费国外 API" })).toHaveClass("is-active");
    expect(await screen.findByRole("button", { name: "开发版" })).toHaveClass("is-active");
  });

  it("renders eval recommendations route", async () => {
    renderRoute("/eval/recommendations");

    expect(await screen.findByText("中转站续费建议")).toBeInTheDocument();
    expect(await screen.findByText("任务级替代建议")).toBeInTheDocument();
  });
});
