import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { readState } from "../../../control-plane/src/store.mjs";

const port = Number(process.env.PORT ?? 4320);

const AIMANDALA_MODEL_TASK_MAP = new Map([
  ["relayhub-task-aimandala-lite-report", "task-aimandala-lite-report"],
  ["relayhub-task-aimandala-pro-report", "task-aimandala-pro-report"],
  ["relayhub-task-aimandala-chat", "task-aimandala-chat"],
  ["relayhub-task-aimandala-vision", "task-aimandala-vision"]
]);

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function relayError(response, statusCode, code, message, relay = undefined) {
  json(response, statusCode, {
    error: {
      code,
      message
    },
    ...(relay ? { relay } : {})
  });
}

function nowIso() {
  return new Date().toISOString();
}

function makeRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function logRelayEvent(payload) {
  process.stdout.write(`${JSON.stringify({ at: nowIso(), ...payload })}\n`);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function buildUpstreamUrl(baseUrl) {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("chat/completions", normalized);
}

function copyUpstreamHeaders(upstreamHeaders) {
  const headers = {};

  for (const [key, value] of upstreamHeaders.entries()) {
    if (key.toLowerCase() === "content-length") {
      continue;
    }
    headers[key] = value;
  }

  return headers;
}

function buildForwardHeaders(request, apiKey, bodyText) {
  const headers = {};

  for (const [key, value] of Object.entries(request.headers)) {
    if (!value) {
      continue;
    }
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "authorization" || lower === "content-length") {
      continue;
    }
    headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  headers.authorization = `Bearer ${apiKey}`;
  headers["content-type"] = headers["content-type"] ?? "application/json";
  headers["content-length"] = Buffer.byteLength(bodyText).toString();

  return headers;
}

function resolveAimandalaTaskId(body) {
  const requestedModel = typeof body.model === "string" ? body.model.trim() : "";
  if (!requestedModel) {
    return {
      ok: false,
      statusCode: 400,
      code: "missing_task_model",
      message: "AI曼陀罗 请求必须显式传入任务模型别名。"
    };
  }

  const taskId = AIMANDALA_MODEL_TASK_MAP.get(requestedModel);
  if (!taskId) {
    return {
      ok: false,
      statusCode: 409,
      code: "unsupported_task_model",
      message: `不支持的 AI曼陀罗 任务模型别名：${requestedModel}。`,
      relay: {
        requestedModel
      }
    };
  }

  return {
    ok: true,
    requestedModel,
    taskId
  };
}

function resolveRelayBinding(state, taskId, requestedModel) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return {
      ok: false,
      statusCode: 404,
      code: "task_not_found",
      message: `找不到 ${taskId}，当前 RelayHub 还没有 AI曼陀罗 生产任务配置。`,
      relay: {
        taskId,
        requestedModel
      }
    };
  }

  if (!task.defaultModelEntryId) {
    return {
      ok: false,
      statusCode: 409,
      code: "task_not_bound",
      message: `${task.name} 还没有绑定默认模型，先去 RelayHub 任务库绑定。`,
      relay: {
        taskId: task.id,
        requestedModel
      }
    };
  }

  const entry = state.modelEntries.find((item) => item.id === task.defaultModelEntryId);
  if (!entry) {
    return {
      ok: false,
      statusCode: 404,
      code: "model_entry_not_found",
      message: "任务当前绑定的模型入口不存在，请回 RelayHub 任务库重新绑定。",
      relay: {
        taskId: task.id,
        requestedModel,
        modelEntryId: task.defaultModelEntryId
      }
    };
  }

  if (entry.kind !== "domestic-model") {
    return {
      ok: false,
      statusCode: 409,
      code: "provider_out_of_policy",
      message: "AI曼陀罗 生产任务只允许国产模型入口，当前绑定违反生产边界。",
      relay: {
        taskId: task.id,
        requestedModel,
        modelEntryId: entry.id,
        entryKind: entry.kind
      }
    };
  }

  if (entry.status !== "active") {
    return {
      ok: false,
      statusCode: 409,
      code: "model_not_active",
      message: "任务当前绑定的模型入口还未激活，先去 RelayHub 模型库测试连接。",
      relay: {
        taskId: task.id,
        requestedModel,
        modelEntryId: entry.id,
        baseUrl: entry.baseUrl
      }
    };
  }

  if (!entry.apiKey) {
    return {
      ok: false,
      statusCode: 409,
      code: "missing_api_key",
      message: "任务当前绑定的模型入口缺少 API Key，先去 RelayHub 模型库补 Key。",
      relay: {
        taskId: task.id,
        requestedModel,
        modelEntryId: entry.id,
        baseUrl: entry.baseUrl
      }
    };
  }

  if (!entry.capabilities?.chatCompletions?.ok) {
    return {
      ok: false,
      statusCode: 409,
      code: "chat_completions_not_ready",
      message: "当前绑定入口尚未通过 chat/completions 探测，不可用于 AI曼陀罗 生产链路。",
      relay: {
        taskId: task.id,
        requestedModel,
        modelEntryId: entry.id,
        baseUrl: entry.baseUrl
      }
    };
  }

  return {
    ok: true,
    task,
    entry
  };
}

async function proxyChatCompletions(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return relayError(response, 400, "invalid_json", "请求体不是合法 JSON。");
  }

  const resolvedTask = resolveAimandalaTaskId(body);
  if (!resolvedTask.ok) {
    return relayError(
      response,
      resolvedTask.statusCode,
      resolvedTask.code,
      resolvedTask.message,
      resolvedTask.relay
    );
  }

  const state = await readState();
  const resolved = resolveRelayBinding(state, resolvedTask.taskId, resolvedTask.requestedModel);
  if (!resolved.ok) {
    return relayError(response, resolved.statusCode, resolved.code, resolved.message, resolved.relay);
  }

  const { task, entry } = resolved;
  const upstreamBody = {
    ...body,
    model: entry.modelId
  };
  const bodyText = JSON.stringify(upstreamBody);
  const relayContext = {
    taskId: task.id,
    requestedModel: resolvedTask.requestedModel,
    modelEntryId: entry.id,
    modelId: entry.modelId,
    baseUrl: entry.baseUrl
  };
  const requestId = makeRequestId();
  const startedAt = Date.now();

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(entry.baseUrl), {
      method: "POST",
      headers: buildForwardHeaders(request, entry.apiKey, bodyText),
      body: bodyText
    });
  } catch (error) {
    logRelayEvent({
      requestId,
      route: "/v1/chat/completions",
      taskId: task.id,
      modelEntryId: entry.id,
      upstreamStatus: 502,
      durationMs: Date.now() - startedAt
    });
    return relayError(
      response,
      502,
      "upstream_unreachable",
      `上游不可达或连接失败：${error instanceof Error ? error.message : "unknown error"}`,
      relayContext
    );
  }

  if (!upstreamResponse.ok) {
    let upstreamPayload = null;
    let upstreamText = "";

    try {
      upstreamText = await upstreamResponse.text();
      upstreamPayload = upstreamText ? JSON.parse(upstreamText) : null;
    } catch {
      upstreamPayload = null;
    }

    const upstreamMessage =
      upstreamPayload && typeof upstreamPayload === "object" && upstreamPayload.error &&
      typeof upstreamPayload.error === "object" && typeof upstreamPayload.error.message === "string"
        ? upstreamPayload.error.message
        : upstreamText || `upstream returned ${upstreamResponse.status}`;

    logRelayEvent({
      requestId,
      route: "/v1/chat/completions",
      taskId: task.id,
      modelEntryId: entry.id,
      upstreamStatus: upstreamResponse.status,
      durationMs: Date.now() - startedAt
    });
    return relayError(
      response,
      upstreamResponse.status,
      "upstream_error",
      `RelayHub 转发失败，上游返回 ${upstreamResponse.status}：${upstreamMessage}`,
      relayContext
    );
  }

  response.writeHead(upstreamResponse.status, copyUpstreamHeaders(upstreamResponse.headers));
  if (!upstreamResponse.body) {
    logRelayEvent({
      requestId,
      route: "/v1/chat/completions",
      taskId: task.id,
      modelEntryId: entry.id,
      upstreamStatus: upstreamResponse.status,
      durationMs: Date.now() - startedAt
    });
    response.end();
    return;
  }

  await new Promise((resolve, reject) => {
    Readable.fromWeb(upstreamResponse.body).pipe(response);
    response.on("finish", resolve);
    response.on("error", reject);
  });

  logRelayEvent({
    requestId,
    route: "/v1/chat/completions",
    taskId: task.id,
    modelEntryId: entry.id,
    upstreamStatus: upstreamResponse.status,
    durationMs: Date.now() - startedAt
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const method = request.method ?? "GET";

  if (method === "GET" && url.pathname === "/health") {
    return json(response, 200, { ok: true });
  }

  if (method === "POST" && (url.pathname === "/chat/completions" || url.pathname === "/v1/chat/completions")) {
    return proxyChatCompletions(request, response);
  }

  return relayError(response, 404, "not_found", "Not found");
}

export function createAimandalaProdRelayServer() {
  return http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      relayError(
        response,
        500,
        "relay_internal_error",
        error instanceof Error ? error.message : "Unknown relay error"
      );
    });
  });
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && currentFile === process.argv[1];

if (isDirectRun) {
  const server = createAimandalaProdRelayServer();
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`relayhub prod-relay aimandala listening on http://127.0.0.1:${port}\n`);
  });
}
