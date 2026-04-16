import { fireEvent, screen, waitFor } from "@testing-library/react";
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

  it("updates provider filters in the URL after interaction", async () => {
    renderRoute("/providers");

    fireEvent.click(await screen.findByRole("button", { name: "国产模型" }));
    fireEvent.click(await screen.findByRole("button", { name: "评测版" }));
    fireEvent.click(await screen.findByRole("button", { name: "状态:degraded" }));
    fireEvent.click(await screen.findByRole("button", { name: "透明度:完整" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E8%AF%84%E6%B5%8B%E7%89%88&health=degraded&transparency=%E5%AE%8C%E6%95%B4",
      );
    });
  });

  it("preserves provider filter query when opening provider detail links", async () => {
    renderRoute(
      "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E5%BF%83%E7%90%86%E7%96%97%E6%84%88%E7%94%9F%E4%BA%A7%E7%89%88",
    );

    fireEvent.click(await screen.findByRole("link", { name: "DeepSeek Direct" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers/deepseek-direct?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E5%BF%83%E7%90%86%E7%96%97%E6%84%88%E7%94%9F%E4%BA%A7%E7%89%88",
      );
    });

    expect(await screen.findByRole("heading", { name: "DeepSeek Direct" })).toBeInTheDocument();
  });

  it("renders provider list error state when using mock error query", async () => {
    renderRoute("/providers?mock=error");

    expect(await screen.findByText("provider 列表加载失败")).toBeInTheDocument();
    expect(await screen.findByText("provider 详情加载失败")).toBeInTheDocument();
  });

  it("renders eval recommendations route", async () => {
    renderRoute("/eval/recommendations");

    expect(await screen.findByText("中转站续费建议")).toBeInTheDocument();
    expect(await screen.findByText("任务级替代建议")).toBeInTheDocument();
  });

  it("renders environment policies route with production boundary copy", async () => {
    renderRoute("/environments/prod-aimandala/policies");

    expect(await screen.findByText("当前生产版只允许国产模型。")).toBeInTheDocument();
    const policyLinks = await screen.findAllByRole("link", { name: "Policies" });

    expect(
      policyLinks.some(
        (link) =>
          link.getAttribute("href") === "/environments/prod-aimandala/policies" &&
          link.classList.contains("is-active"),
      ),
    ).toBe(true);
  });

  it("renders environment runs route with empty state", async () => {
    renderRoute("/environments/prod-aimandala/runs");

    expect(await screen.findByText("当前还没有可展示的运行记录")).toBeInTheDocument();
  });

  it("renders environment not-found route", async () => {
    renderRoute("/environments/missing-environment/overview");

    expect(await screen.findByText("没有找到对应环境")).toBeInTheDocument();
  });

  it("renders environment mock error route", async () => {
    renderRoute("/environments/dev-relay/overview?mock=error");

    expect(await screen.findByText("环境详情加载失败")).toBeInTheDocument();
  });
});
