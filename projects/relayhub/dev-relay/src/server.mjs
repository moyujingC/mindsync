import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { readState } from "../../control-plane/src/store.mjs";

const port = Number(process.env.PORT ?? 4319);
const relayTaskId = "task-claude-code";

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

function estimateInputTokens(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return Math.max(1, Math.ceil(raw.length / 4));
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

function resolveRelayBinding(state) {
  const task = state.tasks.find((item) => item.id === relayTaskId);
  if (!task) {
    return {
      ok: false,
      statusCode: 404,
      code: "task_not_found",
      message: "找不到 task-claude-code，当前 RelayHub 还没有 Claude Code 任务配置。"
    };
  }

  if (!task.defaultModelEntryId) {
    return {
      ok: false,
      statusCode: 409,
      code: "task_not_bound",
      message: "task-claude-code 还没有绑定默认模型，先去任务库绑定 Claude Code Web Coding。"
    };
  }

  const entry = state.modelEntries.find((item) => item.id === task.defaultModelEntryId);
  if (!entry) {
    return {
      ok: false,
      statusCode: 404,
      code: "model_entry_not_found",
      message: "任务当前绑定的模型入口不存在，请回任务库重新绑定。"
    };
  }

  if (entry.status !== "active") {
    return {
      ok: false,
      statusCode: 409,
      code: "model_not_active",
      message: "任务当前绑定的模型入口还未激活，先去模型库测试连接。"
    };
  }

  if (!entry.apiKey) {
    return {
      ok: false,
      statusCode: 409,
      code: "missing_api_key",
      message: "任务当前绑定的模型入口缺少 API Key，先去模型库补 Key。"
    };
  }

  return {
    ok: true,
    task,
    entry
  };
}

function anthropicBlocksToText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((block) => block && typeof block === "object" && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

function mapAnthropicMessagesToOpenAI(body) {
  const messages = [];

  if (typeof body.system === "string" && body.system.trim()) {
    messages.push({
      role: "system",
      content: body.system
    });
  } else if (Array.isArray(body.system)) {
    const systemText = anthropicBlocksToText(body.system);
    if (systemText) {
      messages.push({
        role: "system",
        content: systemText
      });
    }
  }

  for (const message of body.messages ?? []) {
    if (!message || typeof message !== "object") {
      continue;
    }

    if (message.role === "assistant" && Array.isArray(message.content)) {
      const toolUseBlock = message.content.find((block) => block?.type === "tool_use");
      if (toolUseBlock) {
        messages.push({
          role: "assistant",
          content: anthropicBlocksToText(message.content) || null,
          tool_calls: [
            {
              id: toolUseBlock.id ?? `toolu_${Date.now()}`,
              type: "function",
              function: {
                name: toolUseBlock.name,
                arguments: JSON.stringify(toolUseBlock.input ?? {})
              }
            }
          ]
        });
        continue;
      }
    }

    if (message.role === "user" && Array.isArray(message.content)) {
      const toolResultBlocks = message.content.filter((block) => block?.type === "tool_result");
      if (toolResultBlocks.length > 0) {
        for (const block of toolResultBlocks) {
          messages.push({
            role: "tool",
            tool_call_id: block.tool_use_id,
            content: anthropicBlocksToText(block.content)
          });
        }
        const userText = anthropicBlocksToText(
          message.content.filter((block) => block?.type === "text")
        );
        if (userText) {
          messages.push({
            role: "user",
            content: userText
          });
        }
        continue;
      }
    }

    messages.push({
      role: message.role,
      content: anthropicBlocksToText(message.content)
    });
  }

  return messages;
}

function mapAnthropicToolsToOpenAI(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return undefined;
  }

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.input_schema ?? { type: "object", properties: {} }
    }
  }));
}

function mapAnthropicToolChoiceToOpenAI(toolChoice) {
  if (!toolChoice) {
    return undefined;
  }

  if (typeof toolChoice === "string") {
    return toolChoice;
  }

  if (toolChoice.type === "auto" || toolChoice.type === "none" || toolChoice.type === "required") {
    return toolChoice.type === "required" ? "required" : toolChoice.type;
  }

  if (toolChoice.type === "tool" && toolChoice.name) {
    return {
      type: "function",
      function: {
        name: toolChoice.name
      }
    };
  }

  return undefined;
}

function mapFinishReasonToAnthropic(finishReason, hasToolUse) {
  if (hasToolUse || finishReason === "tool_calls") {
    return "tool_use";
  }

  if (finishReason === "length") {
    return "max_tokens";
  }

  return "end_turn";
}

function mapOpenAIChoiceToAnthropic(choice) {
  const message = choice?.message ?? {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const content = [];

  if (typeof message.content === "string" && message.content.length > 0) {
    content.push({
      type: "text",
      text: message.content
    });
  }

  for (const toolCall of toolCalls) {
    let parsedInput = {};
    try {
      parsedInput = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
    } catch {
      parsedInput = {};
    }

    content.push({
      type: "tool_use",
      id: toolCall.id,
      name: toolCall.function?.name ?? "unknown_tool",
      input: parsedInput
    });
  }

  return {
    id: choice?.id ?? undefined,
    role: "assistant",
    content,
    stop_reason: mapFinishReasonToAnthropic(choice?.finish_reason, toolCalls.length > 0)
  };
}

function writeSseEvent(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function buildAnthropicMessagePayload(entry, upstreamPayload, body) {
  const choice = upstreamPayload.choices?.[0] ?? {};
  const mappedChoice = mapOpenAIChoiceToAnthropic(choice);

  return {
    id: upstreamPayload.id ?? `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    model: entry.modelId,
    content: mappedChoice.content,
    stop_reason: mappedChoice.stop_reason,
    stop_sequence: null,
    usage: {
      input_tokens: upstreamPayload.usage?.prompt_tokens ?? estimateInputTokens(body),
      output_tokens: upstreamPayload.usage?.completion_tokens ?? 0
    }
  };
}

function writeAnthropicStreamingResponse(response, anthropicPayload) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache",
    connection: "keep-alive"
  });

  writeSseEvent(response, "message_start", {
    type: "message_start",
    message: {
      id: anthropicPayload.id,
      type: "message",
      role: "assistant",
      model: anthropicPayload.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: anthropicPayload.usage.input_tokens,
        output_tokens: 0
      }
    }
  });

  anthropicPayload.content.forEach((block, index) => {
    if (block.type === "text") {
      writeSseEvent(response, "content_block_start", {
        type: "content_block_start",
        index,
        content_block: {
          type: "text",
          text: ""
        }
      });
      writeSseEvent(response, "content_block_delta", {
        type: "content_block_delta",
        index,
        delta: {
          type: "text_delta",
          text: block.text
        }
      });
      writeSseEvent(response, "content_block_stop", {
        type: "content_block_stop",
        index
      });
      return;
    }

    if (block.type === "tool_use") {
      writeSseEvent(response, "content_block_start", {
        type: "content_block_start",
        index,
        content_block: block
      });
      writeSseEvent(response, "content_block_stop", {
        type: "content_block_stop",
        index
      });
    }
  });

  writeSseEvent(response, "message_delta", {
    type: "message_delta",
    delta: {
      stop_reason: anthropicPayload.stop_reason,
      stop_sequence: anthropicPayload.stop_sequence
    },
    usage: {
      output_tokens: anthropicPayload.usage.output_tokens
    }
  });
  writeSseEvent(response, "message_stop", {
    type: "message_stop"
  });
  response.end();
}

async function proxyChatCompletions(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return relayError(response, 400, "invalid_json", "请求体不是合法 JSON。");
  }

  const state = await readState();
  const resolved = resolveRelayBinding(state);
  if (!resolved.ok) {
    return relayError(response, resolved.statusCode, resolved.code, resolved.message);
  }

  const { task, entry } = resolved;
  const upstreamBody = {
    ...body,
    model: entry.modelId
  };
  const bodyText = JSON.stringify(upstreamBody);
  const relayContext = {
    taskId: task.id,
    modelEntryId: entry.id,
    modelId: entry.modelId,
    baseUrl: entry.baseUrl
  };

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(entry.baseUrl), {
      method: "POST",
      headers: buildForwardHeaders(request, entry.apiKey, bodyText),
      body: bodyText
    });
  } catch (error) {
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
    response.end();
    return;
  }

  await new Promise((resolve, reject) => {
    Readable.fromWeb(upstreamResponse.body).pipe(response);
    response.on("finish", resolve);
    response.on("error", reject);
  });
}

async function proxyAnthropicMessages(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return relayError(response, 400, "invalid_json", "请求体不是合法 JSON。");
  }

  const state = await readState();
  const resolved = resolveRelayBinding(state);
  if (!resolved.ok) {
    return relayError(response, resolved.statusCode, resolved.code, resolved.message);
  }

  const { task, entry } = resolved;
  const upstreamBody = {
    model: entry.modelId,
    messages: mapAnthropicMessagesToOpenAI(body),
    temperature: body.temperature,
    top_p: body.top_p,
    max_tokens: body.max_tokens,
    stream: false,
    tools: mapAnthropicToolsToOpenAI(body.tools),
    tool_choice: mapAnthropicToolChoiceToOpenAI(body.tool_choice) ?? (body.tools?.length ? "auto" : undefined)
  };
  const bodyText = JSON.stringify(upstreamBody);
  const relayContext = {
    taskId: task.id,
    modelEntryId: entry.id,
    modelId: entry.modelId,
    baseUrl: entry.baseUrl
  };

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(entry.baseUrl), {
      method: "POST",
      headers: buildForwardHeaders(request, entry.apiKey, bodyText),
      body: bodyText
    });
  } catch (error) {
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

    return relayError(
      response,
      upstreamResponse.status,
      "upstream_error",
      `RelayHub 转发失败，上游返回 ${upstreamResponse.status}：${upstreamMessage}`,
      relayContext
    );
  }

  const upstreamPayload = await upstreamResponse.json();
  const anthropicPayload = buildAnthropicMessagePayload(entry, upstreamPayload, body);

  if (body.stream) {
    writeAnthropicStreamingResponse(response, anthropicPayload);
    return;
  }

  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(anthropicPayload));
}

async function countAnthropicTokens(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return relayError(response, 400, "invalid_json", "请求体不是合法 JSON。");
  }

  return json(response, 200, {
    input_tokens: estimateInputTokens({
      system: body.system ?? null,
      messages: body.messages ?? [],
      tools: body.tools ?? []
    })
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

  if (method === "POST" && url.pathname === "/v1/messages") {
    return proxyAnthropicMessages(request, response);
  }

  if (method === "POST" && url.pathname === "/v1/messages/count_tokens") {
    return countAnthropicTokens(request, response);
  }

  return relayError(response, 404, "not_found", "Not found");
}

export function createDevRelayServer() {
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
  const server = createDevRelayServer();
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`relayhub dev-relay listening on http://127.0.0.1:${port}\n`);
  });
}
