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

    expect(
      await screen.findByText("先把每个任务当前默认用的模型说清楚，需要换时直接在这里切"),
    ).toBeInTheDocument();
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

  it("shows activation-oriented save feedback in model library", async () => {
    renderRoute("/models");

    expect(await screen.findByText("模型条目总览")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("名称"), {
      target: { value: "新中转模型" },
    });
    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "example-provider" },
    });
    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "https://example.com/v1" },
    });
    fireEvent.change(screen.getByLabelText("模型标识"), {
      target: { value: "gpt-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增模型" }));

    expect(
      await screen.findByText("模型已保存，下一步请补齐 API Key 并测试连接完成激活。"),
    ).toBeInTheDocument();
  });

  it("shows purchase entry for presets with purchaseUrl", async () => {
    renderRoute("/models");

    expect(await screen.findByText("优先激活候选")).toBeInTheDocument();
    expect((await screen.findAllByText("去购买 / 充值")).length).toBeGreaterThan(0);
  });

  it("shows explicit failure reason when model test is missing api key", async () => {
    renderRoute("/models");

    const nameCell = await screen.findByText("Qwen Max 官方");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "测试连接" }));

    expect(
      await screen.findByText("“Qwen Max 官方”测试失败：缺少 API Key，先补密钥再重新测试连接。"),
    ).toBeInTheDocument();
  });

  it("shows next-step success guidance after model activation succeeds", async () => {
    renderRoute("/models");

    const nameCell = await screen.findByText("PPChat 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "测试连接" }));

    expect(
      await screen.findByText(
        "“PPChat 中转”已激活。下一步可去任务库绑定默认模型。适合先绑定：Claude Code Web Coding、Codex Repo Coding。",
      ),
    ).toBeInTheDocument();
  });

  it("shows priority preset guidance in the model library", async () => {
    renderRoute("/models");

    expect(await screen.findByText("优先激活候选")).toBeInTheDocument();
    expect(await screen.findByText("最适合作为通用工具和编码任务的首个激活候选，先跑通绑定路径最快。")).toBeInTheDocument();
    expect(
      (await screen.findAllByText("适合先绑定：Claude Code Web Coding、Codex Repo Coding。")).length,
    ).toBeGreaterThan(0);
  });

  it("shows task guidance when there are no active models to bind", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([]);

    renderRoute("/tasks");

    expect(
      await screen.findByText("先把每个任务当前默认用的模型说清楚，需要换时直接在这里切"),
    ).toBeInTheDocument();
    expect(await screen.findByText("当前还没有可绑定的已激活模型")).toBeInTheDocument();
    expect(await screen.findByText("先回模型库完成激活，再回来绑定任务。")).toBeInTheDocument();
  });

  it("allows quick switching a task default model from the task table", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/tasks");

    const taskName = await screen.findByText("Claude Code Web Coding");
    const row = taskName.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.change(within(row!).getByLabelText("Claude Code Web Coding-快速切换默认模型"), {
      target: { value: "preset-deepseek-v3" },
    });
    fireEvent.click(within(row!).getByRole("button", { name: "切换默认模型" }));

    expect(
      await screen.findByText("“Claude Code Web Coding”的默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。"),
    ).toBeInTheDocument();
    expect(await screen.findByText("DeepSeek V3 官方")).toBeInTheDocument();
  });

  it("shows recommended candidates for tasks based on active models", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/tasks");

    expect(await screen.findByText("推荐候选")).toBeInTheDocument();
    expect((await screen.findAllByText("推荐先从这些已激活模型里绑定。")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("当前绑定已在推荐候选内。")).length).toBeGreaterThan(0);
  });

  it("allows binding a previously unbound task from the task table", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/tasks");

    const taskName = await screen.findByText("Codex Repo Coding");
    const row = taskName.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.change(within(row!).getByLabelText("Codex Repo Coding-快速切换默认模型"), {
      target: { value: "preset-ppchat-relay" },
    });
    fireEvent.click(within(row!).getByRole("button", { name: "绑定默认模型" }));

    expect(
      await screen.findByText("“Codex Repo Coding”的默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。"),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("PPChat 中转")).not.toHaveLength(0);
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

  it("prefills the bound default model for the preferred task in runs", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("当前任务记录上下文")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("任务")).toHaveValue("task-therapy-summary");
      expect(screen.getByLabelText("模型")).toHaveValue("preset-deepseek-v3");
    });
    expect(await screen.findByText("当前任务默认模型：DeepSeek V3 官方")).toBeInTheDocument();
    expect(await screen.findByText("这次会按当前默认模型开始记录。")).toBeInTheDocument();
  });

  it("syncs the model field to the task default model when switching tasks in runs", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("当前任务记录上下文")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Claude Code Web Coding" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("任务"), {
      target: { value: "task-claude-code" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("模型")).toHaveValue("preset-ppchat-relay");
    });
    expect(await screen.findByText("当前任务默认模型：PPChat 中转")).toBeInTheDocument();
  });

  it("shows an explicit hint when the selected run task has no default model", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("当前任务记录上下文")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Codex Repo Coding" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("任务"), {
      target: { value: "task-codex-repo" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("模型")).toHaveValue("");
    });
    expect(await screen.findByText("当前任务尚未绑定默认模型。")).toBeInTheDocument();
    expect(
      await screen.findByText("先去任务库绑定默认模型，或这次临时手动选择一个已激活模型。"),
    ).toBeInTheDocument();
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
      await screen.findByText("运行记录已保存，任务统计已刷新。"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Claude Code Web Coding" })).toHaveClass(
        "is-active",
      );
    });
  });

  it("keeps the task context and clears only result inputs after recording a run", async () => {
    vi.spyOn(controlPlaneService, "listActiveModelEntries").mockResolvedValue([
      {
        ...seedModelEntries[2]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
      {
        ...seedModelEntries[1]!,
        status: "active",
        statusNote: "连接测试通过，可以绑定到任务默认模型。",
      },
    ]);

    renderRoute("/runs");

    expect(await screen.findByText("当前任务记录上下文")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Codex Repo Coding" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("任务"), {
      target: { value: "task-codex-repo" },
    });
    fireEvent.change(screen.getByLabelText("模型"), {
      target: { value: "preset-deepseek-v3" },
    });
    await waitFor(() => {
      expect(screen.getByLabelText("任务")).toHaveValue("task-codex-repo");
      expect(screen.getByLabelText("模型")).toHaveValue("preset-deepseek-v3");
    });
    fireEvent.change(screen.getByLabelText("结果摘要"), {
      target: { value: "这次仓库级实现结果可用，但还需要人工复核。" },
    });
    fireEvent.change(screen.getByLabelText("备注"), {
      target: { value: "临时切到国产模型。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "记录一次运行" }));

    expect(
      await screen.findByText("运行记录已保存，任务统计已刷新。这次记录使用的是临时选择模型，不会自动改动任务默认模型。"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText("任务")).toHaveValue("task-codex-repo");
      expect(screen.getByLabelText("模型")).toHaveValue("preset-deepseek-v3");
      expect(screen.getByLabelText("结果摘要")).toHaveValue("");
      expect(screen.getByLabelText("备注")).toHaveValue("");
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
