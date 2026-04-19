import http from "node:http";
import { fileURLToPath } from "node:url";
import { readState, toPublicModelEntry, writeState } from "./store.mjs";

const port = Number(process.env.PORT ?? 4318);
const proxyBasePath = "/api/control-plane";

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function noContent(response) {
  response.writeHead(204);
  response.end();
}

function notFound(response, message = "Not found") {
  json(response, 404, { message });
}

function badRequest(response, message) {
  json(response, 400, { message });
}

function maskApiKey(apiKey) {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}...${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

function nowStamp() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date()).replace(/\//g, "-");
}

function markTestOutcome(entry, outcome) {
  entry.lastTestResult = outcome.result;
  entry.lastTestCode = outcome.code;
  entry.lastTestMessage = outcome.message;
  entry.status = outcome.status;
  entry.statusNote = outcome.statusNote;
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw.length > 0 ? JSON.parse(raw) : {};
}

function updateTaskNames(state) {
  state.tasks = state.tasks.map((task) => {
    const model = state.modelEntries.find((item) => item.id === task.defaultModelEntryId) ?? null;
    return {
      ...task,
      defaultModelEntryName: model?.name ?? null
    };
  });
}

function getTaskStats(state, taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return null;
  }

  const runs = state.runs
    .filter((item) => item.taskId === taskId)
    .sort((left, right) => left.ranAt.localeCompare(right.ranAt));

  const statsMap = new Map();
  let previousModelId = null;

  for (const run of runs) {
    const current = statsMap.get(run.modelEntryId) ?? {
      modelEntryId: run.modelEntryId,
      modelEntryName: run.modelEntryName,
      runs: 0,
      excellent: 0,
      usable: 0,
      fair: 0,
      failed: 0,
      switchCount: 0,
      averageCostCny: null,
      averageLatencyMs: null,
      lastUsedAt: null
    };

    current.runs += 1;
    current.lastUsedAt = run.ranAt;
    if (run.resultGrade === "优秀") current.excellent += 1;
    else if (run.resultGrade === "可用") current.usable += 1;
    else if (run.resultGrade === "一般") current.fair += 1;
    else current.failed += 1;

    if (run.costCny !== null) {
      const previousAverage = current.averageCostCny ?? 0;
      current.averageCostCny = Number(
        ((previousAverage * (current.runs - 1) + run.costCny) / current.runs).toFixed(2)
      );
    }
    if (run.latencyMs !== null) {
      const previousAverage = current.averageLatencyMs ?? 0;
      current.averageLatencyMs = Math.round(
        (previousAverage * (current.runs - 1) + run.latencyMs) / current.runs
      );
    }
    if (previousModelId && previousModelId !== run.modelEntryId) {
      current.switchCount += 1;
    }

    statsMap.set(run.modelEntryId, current);
    previousModelId = run.modelEntryId;
  }

  const modelStats = [...statsMap.values()].sort((left, right) => right.runs - left.runs);
  const winner = modelStats[0] ?? null;

  return {
    taskId: task.id,
    taskName: task.name,
    totalRuns: runs.length,
    activeModels: modelStats.length,
    bestModelSummary: winner
      ? `${winner.modelEntryName} 当前样本最好，共 ${winner.runs} 次记录，切换次数 ${winner.switchCount}。`
      : "当前还没有可比较的任务运行记录。",
    modelStats
  };
}

function getOverview(state) {
  const totalEntries = state.modelEntries.length;
  const activeEntries = state.modelEntries.filter((item) => item.status === "active").length;
  const configuredPendingTest = state.modelEntries.filter(
    (item) => item.status === "configured-pending-test"
  ).length;
  const tasksBound = state.tasks.filter((item) => item.defaultModelEntryId !== null).length;
  const highlights = [];

  if (configuredPendingTest > 0) {
    highlights.push(`当前有 ${configuredPendingTest} 个模型已配置但尚未完成测试连接。`);
  }
  if (state.tasks.some((item) => item.defaultModelEntryId === null)) {
    highlights.push("仍有任务没有绑定默认模型，首次使用前需要补齐。");
  }
  if (state.runs.length > 0) {
    highlights.push("运行记录已经开始积累，可以用来做第一轮模型选择判断。");
  }

  return {
    totalEntries,
    activeEntries,
    configuredPendingTest,
    tasksBound,
    totalTasks: state.tasks.length,
    recentRunsCount: state.runs.length,
    highlights,
    recentRuns: [...state.runs].sort((left, right) => right.ranAt.localeCompare(left.ranAt)).slice(0, 5)
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const path = url.pathname.startsWith(proxyBasePath)
    ? url.pathname.slice(proxyBasePath.length) || "/"
    : url.pathname;
  const method = request.method ?? "GET";

  const state = await readState();
  updateTaskNames(state);

  if (method === "GET" && path === "/health") {
    return json(response, 200, { ok: true });
  }

  if (method === "GET" && path === "/overview") {
    return json(response, 200, getOverview(state));
  }

  if (method === "GET" && path === "/models") {
    return json(response, 200, state.modelEntries.map(toPublicModelEntry));
  }

  if (method === "POST" && path === "/models") {
    const body = await readJsonBody(request);
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const entry = {
      id: `custom-model-${state.nextIds.model++}`,
      name: String(body.name ?? "").trim(),
      providerLabel: String(body.providerLabel ?? "").trim(),
      kind: body.kind,
      source: "custom",
      baseUrl: String(body.baseUrl ?? "").trim(),
      modelId: String(body.modelId ?? "").trim(),
      catalogFamily: "openai-compatible",
      purchaseUrl: body.purchaseUrl ? String(body.purchaseUrl).trim() : null,
      status: "configured-pending-test",
      statusNote: apiKey ? "自定义模型已保存，请手动测试连接。" : "自定义模型已保存，补 API Key 后可测试连接。",
      hasStoredApiKey: apiKey.length > 0,
      maskedApiKey: apiKey.length > 0 ? maskApiKey(apiKey) : null,
      lastTestedAt: null,
      lastTestResult: "idle",
      lastTestCode: "not-tested",
      lastTestMessage: "还未开始测试连接。",
      tags: ["自定义"],
      apiKey: apiKey || null
    };
    state.modelEntries.unshift(entry);
    await writeState(state);
    return json(response, 201, toPublicModelEntry(entry));
  }

  if (path.startsWith("/models/")) {
    const id = path.split("/")[2];
    const entry = state.modelEntries.find((item) => item.id === id);
    if (!entry) {
      return notFound(response, "Model entry not found");
    }

    if (method === "PATCH" && path === `/models/${id}`) {
      const body = await readJsonBody(request);
      entry.name = String(body.name ?? entry.name).trim();
      entry.providerLabel = String(body.providerLabel ?? entry.providerLabel).trim();
      entry.kind = body.kind ?? entry.kind;
      entry.baseUrl = String(body.baseUrl ?? entry.baseUrl).trim();
      entry.modelId = String(body.modelId ?? entry.modelId).trim();
      entry.purchaseUrl = body.purchaseUrl ? String(body.purchaseUrl).trim() : entry.purchaseUrl;
      if (typeof body.apiKey === "string" && body.apiKey.trim().length > 0) {
        entry.apiKey = body.apiKey.trim();
        entry.hasStoredApiKey = true;
        entry.maskedApiKey = maskApiKey(body.apiKey);
      }
      entry.status = entry.hasStoredApiKey
        ? entry.status === "active" ? "active" : "configured-pending-test"
        : entry.source === "preset" ? "preset-unconfigured" : "configured-pending-test";
      entry.statusNote = entry.hasStoredApiKey
        ? "配置已保存，请手动测试连接后再绑定任务。"
        : "已保存基础配置，补 API Key 后可测试连接。";
      entry.lastTestResult = "idle";
      entry.lastTestCode = "not-tested";
      entry.lastTestMessage = entry.hasStoredApiKey
        ? "配置刚更新，请重新测试连接确认是否可用。"
        : "还缺 API Key，暂时无法开始测试连接。";
      await writeState(state);
      return json(response, 200, toPublicModelEntry(entry));
    }

    if (method === "DELETE" && path === `/models/${id}`) {
      if (entry.source === "preset") {
        entry.status = "disabled";
        entry.statusNote = "该预置条目已停用，可随时重新配置并测试连接。";
      } else {
        state.modelEntries = state.modelEntries.filter((item) => item.id !== id);
      }
      state.tasks = state.tasks.map((task) =>
        task.defaultModelEntryId === id
          ? { ...task, defaultModelEntryId: null, defaultModelEntryName: null }
          : task
      );
      await writeState(state);
      return noContent(response);
    }

    if (method === "POST" && path === `/models/${id}/test`) {
      entry.lastTestedAt = nowStamp();
      if (!entry.hasStoredApiKey || !entry.apiKey) {
        markTestOutcome(entry, {
          result: "missing-api-key",
          code: "missing_api_key",
          message: "缺少 API Key，先补密钥再重新测试连接。",
          status: "test-failed",
          statusNote: "测试失败：还缺 API Key。下一步先补密钥。"
        });
      } else if (!entry.baseUrl.startsWith("http")) {
        markTestOutcome(entry, {
          result: "invalid-base-url",
          code: "invalid_base_url",
          message: "Base URL 不合法，需以 http:// 或 https:// 开头。",
          status: "test-failed",
          statusNote: "测试失败：Base URL 格式不对。下一步先修正地址。"
        });
      } else if (entry.baseUrl.includes("fail")) {
        markTestOutcome(entry, {
          result: "upstream-unreachable",
          code: "upstream_unreachable",
          message: "已发起测试连接，但当前上游不可达或返回异常，请稍后重试。",
          status: "test-failed",
          statusNote: "测试失败：上游暂时不可达。下一步检查地址或稍后重试。"
        });
      } else {
        markTestOutcome(entry, {
          result: "success",
          code: "success",
          message: "测试连接通过，这个模型现在可以绑定到任务。",
          status: "active",
          statusNote: "连接测试通过，可以绑定到任务默认模型。"
        });
      }
      await writeState(state);
      return json(response, 200, toPublicModelEntry(entry));
    }
  }

  if (method === "GET" && path === "/tasks") {
    return json(response, 200, state.tasks);
  }

  if (method === "POST" && path === "/tasks") {
    const body = await readJsonBody(request);
    const task = {
      id: `custom-task-${state.nextIds.task++}`,
      name: String(body.name ?? "").trim(),
      category: body.category,
      description: String(body.description ?? "").trim(),
      builtIn: false,
      defaultModelEntryId: body.defaultModelEntryId ?? null,
      defaultModelEntryName: null,
      switchNote: String(body.switchNote ?? "").trim()
    };
    state.tasks.unshift(task);
    updateTaskNames(state);
    await writeState(state);
    return json(response, 201, state.tasks.find((item) => item.id === task.id));
  }

  if (path.startsWith("/tasks/")) {
    const segments = path.split("/");
    const id = segments[2];
    const task = state.tasks.find((item) => item.id === id);

    if (segments[3] === "stats" && method === "GET") {
      return json(response, 200, getTaskStats(state, id));
    }

    if (!task) {
      return notFound(response, "Task not found");
    }

    if (method === "PATCH" && path === `/tasks/${id}`) {
      const body = await readJsonBody(request);
      task.name = String(body.name ?? task.name).trim();
      task.category = body.category ?? task.category;
      task.description = String(body.description ?? task.description).trim();
      task.defaultModelEntryId = body.defaultModelEntryId ?? null;
      task.switchNote = String(body.switchNote ?? task.switchNote).trim();
      updateTaskNames(state);
      await writeState(state);
      return json(response, 200, state.tasks.find((item) => item.id === id));
    }

    if (method === "DELETE" && path === `/tasks/${id}`) {
      if (task.builtIn) {
        return badRequest(response, "Built-in task cannot be deleted");
      }
      state.tasks = state.tasks.filter((item) => item.id !== id);
      state.runs = state.runs.filter((item) => item.taskId !== id);
      await writeState(state);
      return noContent(response);
    }
  }

  if (method === "GET" && path === "/runs") {
    return json(response, 200, [...state.runs].sort((left, right) => right.ranAt.localeCompare(left.ranAt)));
  }

  if (method === "POST" && path === "/runs") {
    const body = await readJsonBody(request);
    const task = state.tasks.find((item) => item.id === body.taskId);
    const model = state.modelEntries.find((item) => item.id === body.modelEntryId);
    if (!task || !model) {
      return badRequest(response, "Task or model not found");
    }
    const run = {
      id: `custom-run-${state.nextIds.run++}`,
      taskId: task.id,
      taskName: task.name,
      modelEntryId: model.id,
      modelEntryName: model.name,
      ranAt: nowStamp(),
      summary: String(body.summary ?? "").trim(),
      resultGrade: body.resultGrade,
      costCny: typeof body.costCny === "number" ? body.costCny : null,
      latencyMs: typeof body.latencyMs === "number" ? body.latencyMs : null,
      note: typeof body.note === "string" ? body.note.trim() : ""
    };
    state.runs.unshift(run);
    await writeState(state);
    return json(response, 201, run);
  }

  return notFound(response);
}

export function createControlPlaneServer() {
  return http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      json(response, 500, { message: error instanceof Error ? error.message : "Unknown server error" });
    });
  });
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && currentFile === process.argv[1];

if (isDirectRun) {
  const server = createControlPlaneServer();
  server.listen(port, () => {
    console.log(`RelayHub control plane listening on http://127.0.0.1:${port}`);
  });
}
