import http from "node:http";
import { fileURLToPath } from "node:url";
import { readSecrets, readState, toPublicModelEntry, writeSecrets, writeState } from "./store.mjs";

const port = Number(process.env.PORT ?? 4318);
const proxyBasePath = "/api/control-plane";
const PROBE_TIMEOUT_MS = 8000;
const AIMANDALA_TASK_IDS = new Set([
  "task-aimandala-lite-report",
  "task-aimandala-pro-report",
  "task-aimandala-chat",
  "task-aimandala-vision"
]);

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

function badGateway(response, message) {
  json(response, 502, { message });
}

function unauthorized(response, message = "Unauthorized") {
  json(response, 401, { message });
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

function defaultCapabilities(overrides = {}) {
  return {
    responses: {
      ok: false,
      streamOk: false,
      ...(overrides.responses ?? {})
    },
    chatCompletions: {
      ok: false,
      ...(overrides.chatCompletions ?? {})
    },
    lastProbedAt: overrides.lastProbedAt ?? null,
    lastErrorMessage: overrides.lastErrorMessage ?? null
  };
}

function normalizeReasoningEffort(value) {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function resolveEffectiveReasoningEffort(binding, modelEntry) {
  return normalizeReasoningEffort(binding?.reasoningEffortOverride) ?? normalizeReasoningEffort(modelEntry?.reasoningEffort);
}

function attachReasoningConfig(payload, entry, endpointKind) {
  const effort = normalizeReasoningEffort(entry.reasoningEffort);
  if (!effort) {
    return payload;
  }

  const modelId = String(entry.modelId ?? "").trim().toLowerCase();
  const isReasoningModel =
    modelId.startsWith("gpt-5") ||
    modelId.startsWith("o1") ||
    modelId.startsWith("o3") ||
    modelId.startsWith("o4");

  if (!isReasoningModel) {
    return payload;
  }

  if (endpointKind === "responses") {
    return {
      ...payload,
      reasoning: {
        effort
      }
    };
  }

  return {
    ...payload,
    reasoning_effort: effort
  };
}

function markTestOutcome(entry, outcome) {
  entry.lastTestResult = outcome.result;
  entry.lastTestCode = outcome.code;
  entry.lastTestMessage = outcome.message;
  entry.status = outcome.status;
  entry.statusNote = outcome.statusNote;
  entry.capabilities = {
    ...defaultCapabilities(),
    ...(entry.capabilities ?? {}),
    ...(outcome.capabilities ?? {})
  };
}

function getStoredApiKey(secrets, modelEntryId) {
  const item = secrets?.[modelEntryId];
  if (!item || typeof item !== "object") {
    return null;
  }
  return typeof item.apiKey === "string" && item.apiKey.trim() ? item.apiKey.trim() : null;
}

function setStoredApiKey(secrets, modelEntryId, apiKey) {
  const trimmed = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!trimmed) {
    delete secrets[modelEntryId];
    return;
  }

  secrets[modelEntryId] = {
    apiKey: trimmed,
    updatedAt: nowStamp()
  };
}

function buildModelEntryWithSecret(entry, secrets) {
  return {
    ...entry,
    apiKey: getStoredApiKey(secrets, entry.id)
  };
}

function requireInternalAuth(request, response) {
  const configuredToken = process.env.RELAYHUB_INTERNAL_TOKEN ?? "";
  if (!configuredToken.trim()) {
    unauthorized(response, "RelayHub internal token not configured");
    return false;
  }

  const incoming = request.headers["x-relayhub-internal-token"];
  if (incoming !== configuredToken) {
    unauthorized(response, "RelayHub internal token mismatch");
    return false;
  }

  return true;
}

function buildPublicEntryBindingResolution(state, secrets, entryId) {
  const relayEntry = state.entries.find((item) => item.id === entryId) ?? null;
  const binding = state.entryBindings.find((item) => item.entryId === entryId) ?? null;
  const resolvedModel = binding?.defaultModelEntryId
    ? state.modelEntries.find((item) => item.id === binding.defaultModelEntryId) ?? null
    : null;

  const effectiveReasoningEffort = resolveEffectiveReasoningEffort(binding, resolvedModel);

  return {
    entryId,
    alias: relayEntry?.alias ?? null,
    clientFamily: relayEntry?.clientFamily ?? null,
    adapterType: relayEntry?.adapterType ?? null,
    hostType: relayEntry?.hostType ?? null,
    protocolFamily: relayEntry?.protocolFamily ?? null,
    controllable: relayEntry?.controllable ?? false,
    defaultModelEntryId: binding?.defaultModelEntryId ?? null,
    fallbackModelEntryId: binding?.fallbackModelEntryId ?? null,
    reasoningEffortOverride: binding?.reasoningEffortOverride ?? null,
    effectiveReasoningEffort,
    statusNote: binding?.statusNote ?? null,
    resolvedModel: resolvedModel
      ? {
          id: resolvedModel.id,
          name: resolvedModel.name,
          baseUrl: resolvedModel.baseUrl,
          modelId: resolvedModel.modelId,
          reasoningEffort: resolvedModel.reasoningEffort ?? null,
          status: resolvedModel.status,
          hasStoredApiKey: Boolean(getStoredApiKey(secrets, resolvedModel.id))
        }
      : null
  };
}

function canFetchCatalog(entry) {
  return (
    entry.source === "preset" &&
    entry.kind === "relay-api" &&
    entry.catalogFamily === "openai-compatible"
  );
}

function buildCatalogUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, "")}/models`;
}

function buildResponsesUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, "")}/responses`;
}

function buildChatCompletionsUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function createProbeHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  };
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function tryProbeJson(url, init) {
  try {
    const response = await fetchWithTimeout(url, init);
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      payload,
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      payload: null,
      text: error instanceof Error ? error.message : "unknown error"
    };
  }
}

async function probeResponsesStream(entry) {
  try {
    const response = await fetchWithTimeout(buildResponsesUrl(entry.baseUrl), {
      method: "POST",
      headers: {
        ...createProbeHeaders(entry.apiKey),
        Accept: "text/event-stream"
      },
      body: JSON.stringify(attachReasoningConfig({
        model: entry.modelId,
        input: "Reply with exactly: ok",
        stream: true
      }, entry, "responses"))
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        message:
          summarizeUpstreamErrorBody(text ? safeJsonParse(text) : null) ??
          text ??
          `responses stream probe failed: ${response.status}`
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aggregated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      aggregated += decoder.decode(value, { stream: true });
      if (aggregated.includes("response.completed") || aggregated.includes("[DONE]")) {
        break;
      }
    }

    reader.releaseLock();

    if (!aggregated.trim()) {
      return {
        ok: false,
        message: "Responses 流式返回为空。"
      };
    }

    if (!aggregated.includes("response.completed") && !aggregated.includes("response.output_text.delta")) {
      return {
        ok: false,
        message: "Responses 流式返回不完整或无法识别。"
      };
    }

    return {
      ok: true,
      message: null
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "unknown error"
    };
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function probeModelEntryCapabilities(entry) {
  const capabilities = defaultCapabilities({
    lastProbedAt: nowStamp()
  });

  if (!entry.hasStoredApiKey || !entry.apiKey) {
    return {
      outcome: {
        result: "missing-api-key",
        code: "missing_api_key",
        message: "缺少 API Key，先补密钥再重新测试连接。",
        status: "test-failed",
        statusNote: "测试失败：还缺 API Key。下一步先补密钥。",
        capabilities
      }
    };
  }

  if (!entry.baseUrl.startsWith("http")) {
    return {
      outcome: {
        result: "invalid-base-url",
        code: "invalid_base_url",
        message: "Base URL 不合法，需以 http:// 或 https:// 开头。",
        status: "test-failed",
        statusNote: "测试失败：Base URL 格式不对。下一步先修正地址。",
        capabilities
      }
    };
  }

  let catalogMessage = null;
  if (entry.catalogFamily === "openai-compatible") {
    const catalogProbe = await tryProbeJson(buildCatalogUrl(entry.baseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${entry.apiKey}`
      }
    });
    if (!catalogProbe.ok) {
      catalogMessage =
        summarizeUpstreamErrorBody(catalogProbe.payload) ??
        catalogProbe.text ??
        "上游 /models 探测失败。";
    }
  }

  const responsesProbe = await tryProbeJson(buildResponsesUrl(entry.baseUrl), {
    method: "POST",
    headers: createProbeHeaders(entry.apiKey),
    body: JSON.stringify(attachReasoningConfig({
      model: entry.modelId,
      input: "Reply with exactly: ok",
      stream: false
    }, entry, "responses"))
  });
  capabilities.responses.ok = responsesProbe.ok;

  const streamProbe = responsesProbe.ok ? await probeResponsesStream(entry) : { ok: false, message: null };
  capabilities.responses.streamOk = responsesProbe.ok && streamProbe.ok;

  const chatProbe = await tryProbeJson(buildChatCompletionsUrl(entry.baseUrl), {
    method: "POST",
    headers: createProbeHeaders(entry.apiKey),
    body: JSON.stringify(attachReasoningConfig({
      model: entry.modelId,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      stream: false
    }, entry, "chat-completions"))
  });
  capabilities.chatCompletions.ok = chatProbe.ok;

  const firstFailure =
    catalogMessage ??
    (!responsesProbe.ok
      ? summarizeUpstreamErrorBody(responsesProbe.payload) ?? responsesProbe.text ?? "Responses 不可用。"
      : !streamProbe.ok
        ? streamProbe.message ?? "Responses 流式不可用。"
        : !chatProbe.ok
          ? summarizeUpstreamErrorBody(chatProbe.payload) ?? chatProbe.text ?? "chat/completions 不可用。"
          : null);

  capabilities.lastErrorMessage = firstFailure;

  if (capabilities.responses.ok && capabilities.responses.streamOk) {
    return {
      outcome: {
        result: "success",
        code: "success",
        message: "测试连接通过，这个模型可绑定 Claude，也可绑定 Codex。",
        status: "active",
        statusNote: "连接测试通过：可绑定 Codex。",
        capabilities
      }
    };
  }

  if (capabilities.responses.ok && !capabilities.responses.streamOk) {
    return {
      outcome: {
        result: "responses-stream-unavailable",
        code: "responses_stream_unavailable",
        message: firstFailure ?? "上游可达，但 Responses 流式不可用。",
        status: "test-failed",
        statusNote: "上游可达但 Responses 流式失败，不可绑定 Codex。",
        capabilities
      }
    };
  }

  if (!capabilities.responses.ok && capabilities.chatCompletions.ok) {
    return {
      outcome: {
        result: "responses-unavailable",
        code: "responses_unavailable",
        message: firstFailure ?? "仅支持 chat/completions，不可绑定 Codex。",
        status: "active",
        statusNote: "仅支持 chat/completions，不可绑定 Codex。",
        capabilities
      }
    };
  }

  return {
    outcome: {
      result: "upstream-unreachable",
      code: "upstream_unreachable",
      message: firstFailure ?? "已发起测试连接，但当前上游不可达或返回异常，请稍后重试。",
      status: "test-failed",
      statusNote: "测试失败：上游暂时不可达。下一步检查地址或稍后重试。",
      capabilities
    }
  };
}

function canBindTaskToEntry(taskId, entry) {
  if (!entry) {
    return {
      ok: true
    };
  }

  if (AIMANDALA_TASK_IDS.has(taskId) && entry.kind !== "domestic-model") {
    return {
      ok: false,
      message: "AI曼陀罗 生产任务只允许绑定国产模型入口。"
    };
  }

  if (taskId !== "task-codex-repo") {
    return {
      ok: true
    };
  }

  if (!entry.capabilities?.responses?.ok || !entry.capabilities?.responses?.streamOk) {
    return {
      ok: false,
      message: "当前入口尚未通过 Responses 流式探测，不可绑定给 Codex Repo Coding。"
    };
  }

  return {
    ok: true
  };
}

function summarizeUpstreamErrorBody(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim()
  ) {
    return payload.error.message.trim();
  }

  return null;
}

function normalizeCatalogItems(payload) {
  const sourceItems = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : null;

  if (!sourceItems) {
    return null;
  }

  const items = sourceItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const id = typeof item.id === "string" ? item.id.trim() : "";
      if (!id) {
        return null;
      }

      const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : id;
      const supportedEndpointTypes = Array.isArray(item.supportedEndpointTypes)
        ? item.supportedEndpointTypes.filter((value) => typeof value === "string")
        : undefined;

      return {
        id,
        label,
        ...(supportedEndpointTypes ? { supportedEndpointTypes } : {}),
      };
    })
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return items;
}

async function fetchModelCatalog(entry) {
  if (!entry.hasStoredApiKey || !entry.apiKey) {
    return {
      ok: false,
      statusCode: 400,
      message: "请先补 API Key，再获取可用模型列表。",
    };
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(buildCatalogUrl(entry.baseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${entry.apiKey}`,
      },
    });
  } catch {
    return {
      ok: false,
      statusCode: 502,
      message: "上游暂时不可达，暂时无法拉取可用模型列表。",
    };
  }

  let payload = null;
  try {
    payload = await upstreamResponse.json();
  } catch {
    payload = null;
  }

  if (!upstreamResponse.ok) {
    const upstreamMessage = summarizeUpstreamErrorBody(payload);
    return {
      ok: false,
      statusCode: 502,
      message: upstreamMessage
        ? `上游返回异常（${upstreamResponse.status}）：${upstreamMessage}`
        : `上游返回异常（${upstreamResponse.status}），暂时无法拉取可用模型列表。`,
    };
  }

  const items = normalizeCatalogItems(payload);
  if (!items) {
    return {
      ok: false,
      statusCode: 502,
      message: "上游 /models 返回结构不合法，暂时无法识别可用模型列表。",
    };
  }

  return {
    ok: true,
    payload: {
      items,
      fetchedAt: nowStamp(),
    },
  };
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw.trim().length > 0 ? JSON.parse(raw) : {};
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

function updateEntryBindingNames(state) {
  state.entryBindings = state.entryBindings.map((binding) => {
    const defaultModel = state.modelEntries.find((item) => item.id === binding.defaultModelEntryId) ?? null;
    const fallbackModel = state.modelEntries.find((item) => item.id === binding.fallbackModelEntryId) ?? null;
    return {
      ...binding,
      defaultModelEntryName: defaultModel?.name ?? null,
      fallbackModelEntryName: fallbackModel?.name ?? null
    };
  });
}

function getEntryBinding(state, entryId) {
  return state.entryBindings.find((item) => item.entryId === entryId) ?? null;
}

function resolveEntryBindingPayload(state, secrets, entryId) {
  const binding = getEntryBinding(state, entryId);
  if (!binding) {
    return {
      ok: false,
      status: 404,
      message: "Entry binding not found"
    };
  }

  if (!binding.defaultModelEntryId) {
    return {
      ok: false,
      status: 400,
      message: `Entry ${entryId} has no default model binding`
    };
  }

  const modelEntry = state.modelEntries.find((item) => item.id === binding.defaultModelEntryId);
  if (!modelEntry) {
    return {
      ok: false,
      status: 404,
      message: `Model ${binding.defaultModelEntryId} not found`
    };
  }

  const apiKey = getStoredApiKey(secrets, modelEntry.id);
  const effectiveReasoningEffort = resolveEffectiveReasoningEffort(binding, modelEntry);
  return {
    ok: true,
    payload: {
      entryId,
      defaultModelEntryId: binding.defaultModelEntryId,
      fallbackModelEntryId: binding.fallbackModelEntryId ?? null,
      reasoningEffortOverride: binding.reasoningEffortOverride ?? null,
      effectiveReasoningEffort,
      resolvedModel: {
        id: modelEntry.id,
        baseUrl: modelEntry.baseUrl,
        modelId: modelEntry.modelId,
        reasoningEffort: modelEntry.reasoningEffort ?? null,
        apiKey,
        hasStoredApiKey: Boolean(apiKey)
      }
    }
  };
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
  const tasksBound = state.entryBindings.filter((item) => item.defaultModelEntryId !== null).length;
  const highlights = [];

  if (configuredPendingTest > 0) {
    highlights.push(`当前有 ${configuredPendingTest} 个模型已配置但尚未完成测试连接。`);
  }
  if (state.entryBindings.some((item) => item.defaultModelEntryId === null)) {
    highlights.push("仍有入口没有绑定默认模型，首次使用前需要补齐。");
  }
  if (state.runs.length > 0) {
    highlights.push("运行记录已经开始积累，可以用来做第一轮模型选择判断。");
  }

  return {
    totalEntries,
    activeEntries,
    configuredPendingTest,
    tasksBound,
    totalTasks: state.entries.length,
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
  const secrets = await readSecrets();
  updateTaskNames(state);
  updateEntryBindingNames(state);

  if (method === "GET" && path === "/health") {
    return json(response, 200, { ok: true });
  }

  if (method === "GET" && path === "/overview") {
    return json(response, 200, getOverview(state));
  }

  if (method === "GET" && path === "/models") {
    return json(response, 200, state.modelEntries.map(toPublicModelEntry));
  }

  if (method === "GET" && path === "/entries") {
    return json(response, 200, state.entries);
  }

  if (method === "GET" && path === "/entry-bindings") {
    return json(response, 200, state.entryBindings);
  }

  if (method === "GET" && path === "/entry-bindings/resolutions") {
    return json(
      response,
      200,
      state.entryBindings.map((binding) =>
        buildPublicEntryBindingResolution(state, secrets, binding.entryId)
      )
    );
  }

  if (method === "POST" && path === "/internal/resolve-entry-binding") {
    if (!requireInternalAuth(request, response)) {
      return;
    }

    const body = await readJsonBody(request);
    const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
    if (!entryId) {
      return badRequest(response, "entryId is required");
    }

    const result = resolveEntryBindingPayload(state, secrets, entryId);
    if (!result.ok) {
      if (result.status === 404) {
        return notFound(response, result.message);
      }
      return badRequest(response, result.message);
    }

    return json(response, 200, result.payload);
  }

  if (path.startsWith("/entry-bindings/")) {
    const entryId = path.split("/")[2];
    const binding = getEntryBinding(state, entryId);
    if (!binding) {
      return notFound(response, "Entry binding not found");
    }

    if (method === "PATCH" && path === `/entry-bindings/${entryId}`) {
      const body = await readJsonBody(request);
      const nextDefaultId = body.defaultModelEntryId ?? null;
      const nextFallbackId = body.fallbackModelEntryId ?? null;
      const nextDefaultEntry = nextDefaultId
        ? state.modelEntries.find((item) => item.id === nextDefaultId) ?? null
        : null;
      const nextFallbackEntry = nextFallbackId
        ? state.modelEntries.find((item) => item.id === nextFallbackId) ?? null
        : null;

      binding.defaultModelEntryId = nextDefaultId;
      binding.defaultModelEntryName = nextDefaultEntry?.name ?? null;
      binding.fallbackModelEntryId = nextFallbackId;
      binding.fallbackModelEntryName = nextFallbackEntry?.name ?? null;
      binding.reasoningEffortOverride = normalizeReasoningEffort(body.reasoningEffortOverride);
      binding.statusNote = typeof body.statusNote === "string" && body.statusNote.trim()
        ? body.statusNote.trim()
        : binding.statusNote;
      await writeState(state);
      return json(response, 200, binding);
    }
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
      reasoningEffort: normalizeReasoningEffort(body.reasoningEffort),
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
      capabilities: defaultCapabilities(),
      presetPriority: null,
      recommendedTaskCategories: [],
      recommendedTaskIds: [],
      selectionReason: null,
      activationHint: null,
      costTier: null,
      capabilityTags: [],
      tags: ["自定义"]
    };
    state.modelEntries.unshift(entry);
    if (apiKey) {
      setStoredApiKey(secrets, entry.id, apiKey);
    }
    await writeState(state);
    await writeSecrets(secrets);
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
      const shouldClearApiKey = body.clearApiKey === true || body.apiKey === null;
      entry.name = String(body.name ?? entry.name).trim();
      entry.providerLabel = String(body.providerLabel ?? entry.providerLabel).trim();
      if (entry.source !== "preset") {
        entry.kind = body.kind ?? entry.kind;
        entry.baseUrl = String(body.baseUrl ?? entry.baseUrl).trim();
      }
      if (typeof body.modelId === "string" && body.modelId.trim().length > 0) {
        entry.modelId = body.modelId.trim();
      } else if (entry.source !== "preset") {
        entry.modelId = String(body.modelId ?? entry.modelId).trim();
      }
      entry.reasoningEffort = normalizeReasoningEffort(
        body.reasoningEffort ?? entry.reasoningEffort,
      );
      if (entry.source !== "preset") {
        entry.baseUrl = String(body.baseUrl ?? entry.baseUrl).trim();
      }
      entry.purchaseUrl = body.purchaseUrl ? String(body.purchaseUrl).trim() : entry.purchaseUrl;
      if (typeof body.apiKey === "string" && body.apiKey.trim().length > 0) {
        setStoredApiKey(secrets, entry.id, body.apiKey);
        entry.hasStoredApiKey = true;
        entry.maskedApiKey = maskApiKey(body.apiKey);
      } else if (shouldClearApiKey) {
        setStoredApiKey(secrets, entry.id, "");
        entry.hasStoredApiKey = false;
        entry.maskedApiKey = null;
      }
      entry.status = entry.hasStoredApiKey
        ? "configured-pending-test"
        : entry.source === "preset" ? "preset-unconfigured" : "configured-pending-test";
      entry.statusNote = entry.hasStoredApiKey
        ? "配置已保存，请手动测试连接后再绑定任务。"
        : "已保存基础配置，补 API Key 后可测试连接。";
      entry.lastTestedAt = null;
      entry.lastTestResult = "idle";
      entry.lastTestCode = "not-tested";
      entry.lastTestMessage = entry.hasStoredApiKey
        ? "配置刚更新，请重新测试连接确认是否可用。"
        : "还缺 API Key，暂时无法开始测试连接。";
      entry.capabilities = defaultCapabilities();
      await writeState(state);
      await writeSecrets(secrets);
      return json(response, 200, toPublicModelEntry(entry));
    }

    if (method === "GET" && path === `/models/${id}/catalog`) {
      if (!canFetchCatalog(entry)) {
        return badRequest(response, "当前仅支持中转预置入口获取可用模型列表。");
      }

      const result = await fetchModelCatalog(buildModelEntryWithSecret(entry, secrets));
      if (!result.ok) {
        if (result.statusCode === 400) {
          return badRequest(response, result.message);
        }
        return badGateway(response, result.message);
      }

      return json(response, 200, result.payload);
    }

    if (method === "DELETE" && path === `/models/${id}`) {
      if (entry.source === "preset") {
        entry.status = "disabled";
        entry.statusNote = "该预置条目已停用，可随时重新配置并测试连接。";
        entry.hasStoredApiKey = false;
        entry.maskedApiKey = null;
      } else {
        state.modelEntries = state.modelEntries.filter((item) => item.id !== id);
      }
      delete secrets[id];
      state.tasks = state.tasks.map((task) =>
        task.defaultModelEntryId === id
          ? { ...task, defaultModelEntryId: null, defaultModelEntryName: null }
          : task
      );
      state.entryBindings = state.entryBindings.map((binding) =>
        binding.defaultModelEntryId === id || binding.fallbackModelEntryId === id
          ? {
              ...binding,
              defaultModelEntryId: binding.defaultModelEntryId === id ? null : binding.defaultModelEntryId,
              defaultModelEntryName: binding.defaultModelEntryId === id ? null : binding.defaultModelEntryName,
              fallbackModelEntryId: binding.fallbackModelEntryId === id ? null : binding.fallbackModelEntryId,
              fallbackModelEntryName: binding.fallbackModelEntryId === id ? null : binding.fallbackModelEntryName,
            }
          : binding
      );
      await writeState(state);
      await writeSecrets(secrets);
      return noContent(response);
    }

    if (method === "POST" && path === `/models/${id}/test`) {
      entry.lastTestedAt = nowStamp();
      const probeResult = await probeModelEntryCapabilities(buildModelEntryWithSecret(entry, secrets));
      markTestOutcome(entry, probeResult.outcome);
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
      const nextEntryId = body.defaultModelEntryId ?? null;
      const nextEntry = nextEntryId
        ? state.modelEntries.find((item) => item.id === nextEntryId) ?? null
        : null;
      const bindingCheck = canBindTaskToEntry(task.id, nextEntry);
      if (!bindingCheck.ok) {
        return json(response, 409, {
          code: "incompatible_model_binding",
          message: bindingCheck.message
        });
      }
      task.name = String(body.name ?? task.name).trim();
      task.category = body.category ?? task.category;
      task.description = String(body.description ?? task.description).trim();
      task.defaultModelEntryId = nextEntryId;
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
