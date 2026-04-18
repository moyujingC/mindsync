import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConsoleRouterBasename } from "../app/consoleRouter";
import { seedModelEntries } from "../fixtures/controlPlaneData";
import * as controlPlaneService from "../services/controlPlane";
import { renderRoute } from "./renderRoute";

afterEach(() => {
  controlPlaneService.resetMockControlPlaneState();
  vi.restoreAllMocks();
});

describe("RelayHub console routes", () => {
  it("redirects root route to the model library", async () => {
    renderRoute("/");

    expect(await screen.findByText("先看哪些模型已经可用，哪些还差最后一步激活")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/models");
    });
  });

  it("normalizes router basename for release subpath deployment", () => {
    expect(getConsoleRouterBasename("/relayhub/")).toBe("/relayhub");
    expect(getConsoleRouterBasename("relayhub")).toBe("/relayhub");
    expect(getConsoleRouterBasename("/")).toBe("/");
  });

  it("renders provider route under /relayhub basename", async () => {
    renderRoute("/relayhub/providers", { basename: "/relayhub" });

    expect(
      await screen.findByText("OpenAI-compatible 模型目录试用"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/providers");
    });
  });

  it("renders task library route with built-in task copy", async () => {
    renderRoute("/tasks");

    expect(await screen.findByText("先绑定默认模型，再开始积累可比较的任务记录")).toBeInTheDocument();
    expect(await screen.findByText("Claude Code Web Coding")).toBeInTheDocument();
  });

  it("renders runs route with governance overview", async () => {
    renderRoute("/runs");

    expect(await screen.findByText("先把一次次真实使用记下来，再谈模型比较")).toBeInTheDocument();
    expect(await screen.findByText("治理概览")).toBeInTheDocument();
  });

  it("renders provider detail route under /relayhub basename", async () => {
    renderRoute("/relayhub/providers/deepseek-direct", { basename: "/relayhub" });

    expect(await screen.findByText("模型详情")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "DeepSeek Direct" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers/deepseek-direct",
      );
    });
  });

  it("renders dashboard overview", async () => {
    renderRoute("/dashboard");

    expect(await screen.findByText("当前闭环进度")).toBeInTheDocument();
    expect(await screen.findByText("下一步入口")).toBeInTheDocument();
  });

  it("keeps dashboard available but moves it out of core navigation", async () => {
    renderRoute("/dashboard");

    expect(await screen.findByText("当前闭环进度")).toBeInTheDocument();

    const coreNav = screen.getByLabelText("核心模块");
    const supportNav = screen.getByLabelText("支持模块");

    expect(within(coreNav).queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(within(coreNav).getByRole("link", { name: "模型库" })).toBeInTheDocument();
    expect(within(coreNav).getByRole("link", { name: "任务库" })).toBeInTheDocument();
    expect(within(coreNav).getByRole("link", { name: "运行记录" })).toBeInTheDocument();
    expect(within(supportNav).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("blocks model submission when required fields are missing", async () => {
    renderRoute("/models");

    expect(await screen.findByText("模型条目总览")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "新增模型" }));

    expect(
      await screen.findByText("请先补全必填项：名称、Provider、Base URL、模型标识。"),
    ).toBeInTheDocument();
  });

  it("shows task guidance when there are no active models to bind", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([]);

    renderRoute("/tasks");

    expect(await screen.findByText("先绑定默认模型，再开始积累可比较的任务记录")).toBeInTheDocument();
    expect(await screen.findByText("当前还没有可绑定的已激活模型")).toBeInTheDocument();
    expect(await screen.findByText("先回模型库完成激活，再回来绑定任务。")).toBeInTheDocument();
  });

  it("blocks run submission when required fields are missing", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("治理概览")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "记录一次运行" }));

    expect(await screen.findByText("请先补全必填项：任务、模型、结果摘要。")).toBeInTheDocument();
  });

  it("switches task stats to the submitted task after recording a run", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("治理概览")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Claude Code Web Coding" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "PPChat 中转" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("任务"), {
      target: { value: "task-claude-code" },
    });
    fireEvent.change(screen.getByLabelText("模型"), {
      target: { value: "preset-ppchat-relay" },
    });
    fireEvent.change(screen.getByLabelText("结果摘要"), {
      target: { value: "这次网页编码结果稳定，可继续作为默认候选。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "记录一次运行" }));

    expect(
      await screen.findByText("运行记录已保存，任务统计已切换到这次提交的任务。"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Claude Code Web Coding" })).toHaveClass(
        "is-active",
      );
    });
  });

  it("renders provider route with empty-state provider metrics and restored filters", async () => {
    renderRoute(
      "/providers/freebridge-sandbox?kind=%E5%85%8D%E8%B4%B9%E5%9B%BD%E5%A4%96%20API&environment=%E5%BC%80%E5%8F%91%E7%89%88",
    );

    expect(await screen.findByText("当前没有 24 小时样本")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "免费国外 API" })).toHaveClass("is-active");
    expect(await screen.findByRole("button", { name: "开发版" })).toHaveClass("is-active");
  });

  it("falls back to 全部 when provider query values are invalid", async () => {
    renderRoute(
      "/providers?kind=bad-value&environment=bad-value&health=bad-value&transparency=bad-value",
    );

    const allButtons = await screen.findAllByRole("button", { name: "全部" });

    expect(allButtons).toHaveLength(4);
    allButtons.forEach((button) => {
      expect(button).toHaveClass("is-active");
    });
  });

  it("cleans invalid provider query values after a valid interaction", async () => {
    renderRoute("/providers?kind=bad-value");

    fireEvent.click(await screen.findByRole("button", { name: "国产模型" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B",
      );
    });
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

  it("removes only the selected provider filter when clicking 全部 in a multi-filter URL", async () => {
    renderRoute(
      "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E8%AF%84%E6%B5%8B%E7%89%88&health=degraded",
    );

    fireEvent.click(screen.getAllByRole("button", { name: "全部" })[1]!);

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&health=degraded",
      );
    });
  });

  it("returns to a compact URL when clearing the only active provider filter", async () => {
    renderRoute("/providers?health=idle");

    fireEvent.click(screen.getAllByRole("button", { name: "全部" })[2]!);

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/providers");
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

  it("opens provider detail links with only legal provider filters after cleanup", async () => {
    renderRoute(
      "/providers?kind=bad-value&environment=%E5%BF%83%E7%90%86%E7%96%97%E6%84%88%E7%94%9F%E4%BA%A7%E7%89%88",
    );

    fireEvent.click(await screen.findByRole("button", { name: "国产模型" }));
    fireEvent.click(await screen.findByRole("link", { name: "DeepSeek Direct" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers/deepseek-direct?kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E5%BF%83%E7%90%86%E7%96%97%E6%84%88%E7%94%9F%E4%BA%A7%E7%89%88",
      );
    });
  });

  it("renders provider list error state when using mock error query", async () => {
    renderRoute("/providers?mock=error");

    expect(await screen.findByText("模型目录加载失败")).toBeInTheDocument();
    expect(await screen.findByText("模型详情加载失败")).toBeInTheDocument();
  });

  it("keeps mock error query when provider filters change", async () => {
    renderRoute("/providers?mock=error&kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B");

    fireEvent.click(await screen.findByRole("button", { name: "评测版" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/providers?mock=error&kind=%E5%9B%BD%E4%BA%A7%E6%A8%A1%E5%9E%8B&environment=%E8%AF%84%E6%B5%8B%E7%89%88",
      );
    });

    expect(await screen.findByText("模型目录加载失败")).toBeInTheDocument();
    expect(await screen.findByText("模型详情加载失败")).toBeInTheDocument();
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
