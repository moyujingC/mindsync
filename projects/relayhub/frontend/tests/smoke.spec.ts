import { expect, test } from "@playwright/test";
import { createMockState } from "./control-plane-mocks";

test.beforeEach(async ({ page }) => {
  const state = createMockState();

  await page.route("**/api/control-plane/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/control-plane", "");
    const method = request.method();

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (method === "GET" && path === "/entry-bindings/resolutions") {
      return json(state.entries);
    }

    if (method === "PATCH" && path.startsWith("/entry-bindings/")) {
      const entryId = path.split("/").at(-1) ?? "";
      const payload = JSON.parse(request.postData() ?? "{}") as { reasoningEffortOverride?: "low" | "medium" | "high" | null };
      const entry = state.entries.find((item) => item.entryId === entryId);
      if (!entry) return json({ message: "not found" }, 404);
      entry.reasoningEffortOverride = payload.reasoningEffortOverride ?? null;
      entry.effectiveReasoningEffort = payload.reasoningEffortOverride ?? entry.resolvedModel?.reasoningEffort ?? null;
      return json(entry);
    }

    if (method === "GET" && path === "/models") {
      return json(state.models);
    }

    if (method === "POST" && path === "/models") {
      const payload = JSON.parse(request.postData() ?? "{}") as Record<string, string | null | undefined>;
      const created = {
        ...state.models[0],
        id: "custom-new-model",
        source: "custom" as const,
        name: String(payload.name ?? "新模型"),
        providerLabel: String(payload.providerLabel ?? ""),
        kind: (payload.kind as "coding-plan" | "domestic-model" | "relay-api") ?? "coding-plan",
        baseUrl: String(payload.baseUrl ?? ""),
        modelId: String(payload.modelId ?? ""),
        reasoningEffort: (payload.reasoningEffort as "low" | "medium" | "high" | null) ?? null,
        purchaseUrl: typeof payload.purchaseUrl === "string" ? payload.purchaseUrl : null,
        hasStoredApiKey: Boolean(payload.apiKey),
        maskedApiKey: payload.apiKey ? "sk-new...demo" : null,
        status: "configured-pending-test" as const,
        statusNote: "已保存，等待测试。",
      };
      state.models = [...state.models, created];
      return json(created, 200);
    }

    if (method === "PATCH" && path.startsWith("/models/")) {
      const id = path.split("/")[2] ?? "";
      const payload = JSON.parse(request.postData() ?? "{}") as Record<string, string | null | undefined>;
      const entry = state.models.find((item) => item.id === id);
      if (!entry) return json({ message: "not found" }, 404);
      entry.name = String(payload.name ?? entry.name);
      entry.providerLabel = String(payload.providerLabel ?? entry.providerLabel);
      entry.kind = (payload.kind as typeof entry.kind) ?? entry.kind;
      entry.baseUrl = String(payload.baseUrl ?? entry.baseUrl);
      entry.modelId = String(payload.modelId ?? entry.modelId);
      entry.reasoningEffort = (payload.reasoningEffort as typeof entry.reasoningEffort) ?? null;
      entry.purchaseUrl = typeof payload.purchaseUrl === "string" ? payload.purchaseUrl : entry.purchaseUrl;
      if (payload.apiKey) {
        entry.hasStoredApiKey = true;
        entry.maskedApiKey = "sk-upd...demo";
      }
      entry.status = "configured-pending-test";
      entry.statusNote = "已保存，等待测试。";
      return json(entry);
    }

    if (method === "DELETE" && path.startsWith("/models/")) {
      const id = path.split("/")[2] ?? "";
      state.models = state.models.filter((item) => item.id !== id);
      return route.fulfill({ status: 204, body: "" });
    }

    if (method === "POST" && path.endsWith("/test")) {
      const id = path.split("/")[2] ?? "";
      const entry = state.models.find((item) => item.id === id);
      if (!entry) return json({ message: "not found" }, 404);
      entry.status = "active";
      entry.statusNote = "测试通过，可用。";
      entry.lastTestedAt = "2026-05-02 11:30";
      entry.lastTestResult = "success";
      entry.lastTestCode = "ok";
      entry.lastTestMessage = "Smoke test passed.";
      entry.capabilities.responses.ok = true;
      entry.capabilities.responses.streamOk = true;
      entry.capabilities.chatCompletions.ok = true;
      entry.hasStoredApiKey = true;
      return json(entry);
    }

    if (method === "GET" && path.endsWith("/catalog")) {
      const id = path.split("/")[2] ?? "";
      return json(state.catalogs[id] ?? { items: [], fetchedAt: "2026-05-02T11:00:00.000Z" });
    }

    if (method === "GET" && path === "/relay-access") {
      return json(state.relayAccess);
    }

    if (method === "PATCH" && path === "/relay-access") {
      const payload = JSON.parse(request.postData() ?? "{}") as { relayToken?: string };
      state.relayAccess = {
        hasStoredRelayToken: Boolean(payload.relayToken),
        maskedRelayToken: payload.relayToken ? "relay...saved" : null,
        effectiveSource: payload.relayToken ? "control-plane" : "environment",
        updatedAt: "2026-05-02 11:40",
      };
      return json(state.relayAccess);
    }

    return json({ message: `Unhandled route: ${method} ${path}` }, 500);
  });
});

test("Entries 页能打开并保存入口覆盖", async ({ page }) => {
  await page.goto("/entries");

  await expect(page.getByRole("heading", { name: "入口矩阵" })).toBeVisible();
  await expect(page.getByTestId("entries-matrix-badge")).toContainText("2 个主入口");
  await expect(page.getByText("后台已配置")).toBeVisible();
  await expect(page.getByText("已观察到使用")).toBeVisible();
  await expect(page.getByText("尚未观察到使用")).toBeVisible();
  await expect(page.getByTestId("entry-card-entry-codex-ide-local")).toBeVisible();
  await expect(page.getByTestId("entry-card-entry-codex-ide-local").getByRole("heading", { name: "给 Codex 的一次性接入任务" })).toBeVisible();
  await expect(page.getByTestId("entry-task-prompt-entry-codex-ide-local")).toContainText("请帮我把 RelayHub 的这个入口接到 Codex 客户端里");

  await page.getByLabel("entry-codex-ide-local 推理强度覆盖").selectOption("high");
  await page.getByTestId("save-entry-entry-codex-ide-local").click();

  await expect(page.getByText("已为 entry-codex-ide-local 单独设置推理强度为 high。")).toBeVisible();
});

test("Models 页能打开、编辑并新增模型", async ({ page }) => {
  await page.goto("/models");

  await expect(page.getByRole("heading", { name: "预置模型" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "自定义模型" })).toBeVisible();
  await expect(page.getByTestId("models-editor-panel")).toBeVisible();

  await page.getByTestId("model-card-custom-claude-sonnet").getByRole("button", { name: "编辑" }).click();
  await page.getByLabel("模型名称").fill("Claude Sonnet 自建 Pro");
  await page.getByTestId("models-editor-panel").getByRole("button", { name: "获取模型列表" }).click();
  await expect(page.getByTestId("model-catalog-panel")).toBeVisible();
  await page.getByTestId("save-model-button").click();
  await expect(page.getByText("模型配置已保存。")).toBeVisible();

  await page.getByLabel("模型名称").fill("新接入模型");
  await page.getByLabel("Provider 上游提供方").fill("新中转");
  await page.getByLabel("模型类型").selectOption("relay-api");
  await page.getByLabel("Base URL").fill("https://new.example.com/v1");
  await page.getByLabel("modelId").fill("gpt-5-mini");
  await page.getByLabel("API Key").fill("sk-new-model");
  await page.getByTestId("save-model-button").click();

  await expect(page.getByText("模型已新建。")).toBeVisible();
});

test("Settings 页能打开并保存门禁 token", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByText("Relay 门禁")).toBeVisible();
  await expect(page.getByTestId("relay-token-panel")).toBeVisible();
  await page.getByLabel("新的 RelayHub 门禁 token").fill("relayhub-new-prod");
  await page.getByTestId("save-relay-token-button").click();

  await expect(page.getByText("RelayHub 门禁 token 已保存。以后客户端访问 RelayHub，会先认这把门禁卡。")).toBeVisible();
});
