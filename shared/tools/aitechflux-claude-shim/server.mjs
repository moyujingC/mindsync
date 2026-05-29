#!/usr/bin/env node
import http from "node:http";

const PORT = Number(process.env.AITECHFLUX_CLAUDE_SHIM_PORT || 8787);
const UPSTREAM_BASE_URL =
  process.env.AITECHFLUX_BASE_URL || "https://aitechflux.com";

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function contentToSystemText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return JSON.stringify(content);

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part?.type === "text" && typeof part.text === "string") {
        return part.text;
      }
      return JSON.stringify(part);
    })
    .filter(Boolean)
    .join("\n");
}

function mergeSystem(existing, additions) {
  const existingText = existing ? contentToSystemText(existing) : "";
  const additionText = additions.map(contentToSystemText).filter(Boolean).join("\n\n");
  return [existingText, additionText].filter(Boolean).join("\n\n");
}

function normalizeAnthropicMessages(body) {
  if (!body || !Array.isArray(body.messages)) return body;

  const systemMessages = [];
  const messages = [];

  for (const message of body.messages) {
    if (message?.role === "system") {
      systemMessages.push(message.content);
      continue;
    }
    messages.push(message);
  }

  if (systemMessages.length === 0) return body;

  return {
    ...body,
    system: mergeSystem(body.system, systemMessages),
    messages,
  };
}

function buildHeaders(requestHeaders, bodyBuffer) {
  const hopByHopHeaders = new Set([
    "connection",
    "content-length",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]);

  const headers = {};
  for (const [name, value] of Object.entries(requestHeaders)) {
    if (hopByHopHeaders.has(name.toLowerCase())) continue;
    headers[name] = value;
  }
  headers["content-length"] = String(bodyBuffer.length);
  return headers;
}

function buildResponseHeaders(upstreamHeaders) {
  const headers = Object.fromEntries(upstreamHeaders.entries());
  delete headers["content-encoding"];
  delete headers["content-length"];
  return headers;
}

async function proxy(request, response) {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  const targetUrl = new URL(request.url || "/", UPSTREAM_BASE_URL);
  const inputBuffer = await readRequestBody(request);
  let outputBuffer = inputBuffer;

  if (request.method === "POST" && targetUrl.pathname === "/v1/messages") {
    const body = JSON.parse(inputBuffer.toString("utf8") || "{}");
    outputBuffer = Buffer.from(
      JSON.stringify(normalizeAnthropicMessages(body)),
      "utf8",
    );
  }

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: buildHeaders(request.headers, outputBuffer),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : outputBuffer,
  });

  response.writeHead(
    upstreamResponse.status,
    buildResponseHeaders(upstreamResponse.headers),
  );

  if (!upstreamResponse.body) {
    response.end();
    return;
  }

  for await (const chunk of upstreamResponse.body) {
    response.write(Buffer.from(chunk));
  }
  response.end();
}

const server = http.createServer((request, response) => {
  proxy(request, response).catch((error) => {
    response.writeHead(502, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: {
          type: "aitechflux_claude_shim_error",
          message: error instanceof Error ? error.message : String(error),
        },
      }),
    );
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`aitechflux-claude-shim listening on http://127.0.0.1:${PORT}`);
});
