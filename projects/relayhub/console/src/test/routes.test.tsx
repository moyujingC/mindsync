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

    expect(
      await screen.findByText("先接入一个可复用入口，再决定入口内当前用哪个模型"),
    ).toBeInTheDocument();
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
      await screen.findByText("先把每个任务当前默认走哪个入口内模型说清楚，需要换时直接在这里切"),
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

  it("shows AITechFlux as a preset relay entry with purchase guidance", async () => {
    renderRoute("/models");

    expect(await screen.findByText("AITechFlux 中转")).toBeInTheDocument();
    expect(await screen.findByText("第三方中转入口，可复用 URL + Key，并在工具内切换默认模型。")).toBeInTheDocument();
    expect(
      (await screen.findAllByText("适合先绑定：Claude Code Web Coding、Codex Repo Coding。")).length,
    ).toBeGreaterThan(0);
  });

  it("frames presets as reusable access entries in the model library", async () => {
    renderRoute("/models");

    expect(await screen.findByText("先接入一个可复用入口，再决定入口内当前用哪个模型")).toBeInTheDocument();
    expect(await screen.findByText("这些预置入口已经给好 URL、模型标识和购买入口，目标是让你少填一次配置。")).toBeInTheDocument();
  });

  it("shows explicit first-time setup steps in the model library hero", async () => {
    renderRoute("/models");

    expect(await screen.findByText("第一次接入可以按这 5 步走")).toBeInTheDocument();
    expect(await screen.findByText("1. 先选一个预置入口")).toBeInTheDocument();
    expect(await screen.findByText("2. 去购买 / 开通，拿到 API Key")).toBeInTheDocument();
    expect(await screen.findByText("3. 回来只补 API Key")).toBeInTheDocument();
    expect(await screen.findByText("4. 保存后手动测试连接")).toBeInTheDocument();
    expect(await screen.findByText("5. 激活后去任务库绑定")).toBeInTheDocument();
  });

  it("locks base url and model id editing for preset entries", async () => {
    renderRoute("/models");

    const nameCell = await screen.findByText("PPChat 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));

    expect(await screen.findByDisplayValue("https://code.ppchat.vip/v1")).toBeDisabled();
    expect(await screen.findByDisplayValue("gpt-5")).toBeDisabled();
    expect(await screen.findByDisplayValue("Coding Plan")).toBeDisabled();
    expect(await screen.findByText("URL 和默认模型标识已经配好；当前只需要补 API Key。保存后还不算激活，仍需要显式点击“测试连接”。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "获取可用模型" })).not.toBeInTheDocument();
  });

  it("keeps AITechFlux preset base url locked and uses fetched catalog for modelId selection", async () => {
    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));

    expect(await screen.findByDisplayValue("https://aitechflux.com/v1")).toBeDisabled();
    expect(await screen.findByDisplayValue("中转 API")).toBeDisabled();
    expect(await screen.findByText("URL 已经配好；当前先补 API Key。若默认模型不确定，先获取可用模型列表，再切当前模型。保存后还不算激活，仍需要显式点击“测试连接”。")).toBeInTheDocument();
    expect(await screen.findByText("这里填写的是你从对应平台拿回来的 API Key；它只在服务端脱敏保存，不会进入前端构建产物。")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "还没有 Key？先去开通 / 充值" })).toBeInTheDocument();
    expect(screen.queryByLabelText("模型标识")).not.toBeInTheDocument();
    expect(await screen.findByText("当前模型标识")).toBeInTheDocument();
  });

  it("fetches preset relay catalog and shows selectable upstream models", async () => {
    vi.spyOn(controlPlaneService, "getModelCatalog").mockResolvedValue({
      items: [
        { id: "高性能极速模型", label: "高性能极速模型" },
        { id: "高性能低价模型", label: "高性能低价模型" },
        { id: "Claude混合版", label: "Claude混合版" },
      ],
      fetchedAt: "2026-04-21 11:00",
    });

    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-aitechflux-test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "获取可用模型" }));

    expect(await screen.findByLabelText("可用模型列表")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "高性能低价模型" })).toBeInTheDocument();
    expect(await screen.findByText("已获取上游可用模型，可从列表中切换当前模型。")).toBeInTheDocument();
  });

  it("shows clear error when fetching preset relay catalog without api key", async () => {
    vi.spyOn(controlPlaneService, "getModelCatalog").mockRejectedValue(
      new Error("请先补 API Key，再获取可用模型列表。"),
    );

    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));
    fireEvent.click(screen.getByRole("button", { name: "获取可用模型" }));

    expect(await screen.findByText("请先补 API Key，再获取可用模型列表。")).toBeInTheDocument();
  });

  it("saves selected preset relay modelId and points to next test step", async () => {
    vi.spyOn(controlPlaneService, "getModelCatalog").mockResolvedValue({
      items: [
        { id: "高性能极速模型", label: "高性能极速模型" },
        { id: "高性能低价模型", label: "高性能低价模型" },
        { id: "Claude混合版", label: "Claude混合版" },
      ],
      fetchedAt: "2026-04-21 11:00",
    });

    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-aitechflux-test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "获取可用模型" }));
    fireEvent.change(await screen.findByLabelText("可用模型列表"), {
      target: { value: "高性能低价模型" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存配置" }));

    expect(
      await screen.findByText("当前模型已更新，下一步请测试连接确认该入口当前模型是否可用。"),
    ).toBeInTheDocument();
  });

  it("copies preset base url from the table and shows success feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText,
      },
    });

    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "复制 Base URL" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://aitechflux.com/v1");
    });
    expect(await screen.findByText("入口地址已复制，可去外部工具粘贴使用。")).toBeInTheDocument();
  });

  it("shows a non-blocking error when copying base url fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard-denied"));
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText,
      },
    });

    renderRoute("/models");

    const nameCell = await screen.findByText("AITechFlux 中转");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "复制 Base URL" }));

    expect(await screen.findByText("入口地址复制失败，请手动复制。")).toBeInTheDocument();
  });

  it("keeps custom entries fully editable in the model library", async () => {
    renderRoute("/models");

    fireEvent.change(screen.getByLabelText("名称"), {
      target: { value: "自定义入口" },
    });
    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "aitechflux.com" },
    });
    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "https://aitechflux.com/v1" },
    });
    fireEvent.change(screen.getByLabelText("模型标识"), {
      target: { value: "gpt-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增模型" }));

    const nameCell = await screen.findByText("自定义入口");
    const row = nameCell.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "编辑" }));

    expect(await screen.findByDisplayValue("https://aitechflux.com/v1")).not.toBeDisabled();
    expect(await screen.findByDisplayValue("gpt-5")).not.toBeDisabled();
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
        "“PPChat 中转”已激活。下一步可去任务库绑定默认模型；这个入口现在也可在外部工具中复用 Base URL + Key。适合先绑定：Claude Code Web Coding、Codex Repo Coding。",
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
      await screen.findByText("先把每个任务当前默认走哪个入口内模型说清楚，需要换时直接在这里切"),
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
    fireEvent.click(within(row!).getByRole("button", { name: "切换入口内默认模型" }));

    expect(
      await screen.findByText("“Claude Code Web Coding”的入口内默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。"),
    ).toBeInTheDocument();
    expect(await screen.findByText("DeepSeek V3 官方")).toBeInTheDocument();
  });

  it("lets users switch Claude Code current model from the dedicated task shortcut", async () => {
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

    expect(await screen.findByText("Claude Code 当前模型")).toBeInTheDocument();
    expect(await screen.findByText("当前绑定：PPChat 中转")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Claude Code 当前模型"), {
      target: { value: "preset-deepseek-v3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "切换 Claude Code 当前模型" }));

    expect(
      await screen.findByText("“Claude Code Web Coding”的入口内默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。"),
    ).toBeInTheDocument();
    expect(await screen.findByText("当前绑定：DeepSeek V3 官方")).toBeInTheDocument();
    expect(
      await screen.findByText("Claude Code 后续请求会自动跟随这个任务绑定，不需要你在 Claude Code 里再改 URL。"),
    ).toBeInTheDocument();
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
    fireEvent.click(within(row!).getByRole("button", { name: "绑定入口内默认模型" }));

    expect(
      await screen.findByText("“Codex Repo Coding”的入口内默认模型已切换。新的绑定会对后续使用和后续新运行记录生效。"),
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
