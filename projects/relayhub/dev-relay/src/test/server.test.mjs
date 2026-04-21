import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { once } from "node:events";
import { createDevRelayServer } from "../server.mjs";

function createState() {
  return {
    modelEntries: [
      {
        id: "model-active",
        name: "Active Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:1/v1",
        modelId: "model-a",
        catalogFamily: "openai-compatible",
        apiKey: "sk-active"
      },
      {
        id: "model-second",
        name: "Second Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:2/v1",
        modelId: "model-b",
        catalogFamily: "openai-compatible",
        apiKey: "sk-second"
      },
      {
        id: "model-inactive",
        name: "Inactive Relay",
        status: "configured-pending-test",
        baseUrl: "http://127.0.0.1:3/v1",
        modelId: "model-c",
        catalogFamily: "openai-compatible",
        apiKey: "sk-inactive"
      },
      {
        id: "model-no-key",
        name: "No Key Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:4/v1",
        modelId: "model-d",
        catalogFamily: "openai-compatible",
        apiKey: null
      }
    ],
    tasks: [
      {
        id: "task-claude-code",
        name: "Claude Code Web Coding",
        defaultModelEntryId: "model-active"
      }
    ],
    runs: [],
    nextIds: {
      model: 1,
      task: 1,
      run: 1
    }
  };
}

async function withTempState(run, state = createState()) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-dev-relay-"));
  await fs.writeFile(path.join(dataDir, "state.json"), JSON.stringify(state, null, 2), "utf8");
  const previous = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = dataDir;

  try {
    await run({
      dataDir,
      async readState() {
        const raw = await fs.readFile(path.join(dataDir, "state.json"), "utf8");
        return JSON.parse(raw);
      },
      async writeState(nextState) {
        await fs.writeFile(path.join(dataDir, "state.json"), JSON.stringify(nextState, null, 2), "utf8");
      }
    });
  } finally {
    if (previous === undefined) {
      delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    } else {
      process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = previous;
    }
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}

async function withServer(server, run) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

async function withMockUpstream(handler, run) {
  const server = http.createServer(handler);
  await withServer(server, async (baseUrl) => {
    await run(baseUrl);
  });
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

test("GET /health returns ok", async () => {
  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    });
  });
});

test("POST /chat/completions forwards to the bound upstream and overrides model", async () => {
  let observedAuthorization = null;
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedAuthorization = request.headers.authorization ?? null;
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-1",
      object: "chat.completion",
      model: observedBody.model,
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }]
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;

    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "should-be-overridden",
            messages: [{ role: "user", content: "hello" }]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.model, "model-a");
      });
    }, state);

    assert.equal(observedAuthorization, "Bearer sk-active");
    assert.equal(observedBody.model, "model-a");
    assert.equal(observedBody.messages[0].content, "hello");
  });
});

test("POST /chat/completions returns a clear error when task-claude-code is not bound", async () => {
  const state = createState();
  state.tasks[0].defaultModelEntryId = null;

  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.match(payload.error.message, /先去任务库绑定/);
      assert.equal(payload.error.code, "task_not_bound");
    });
  }, state);
});

test("POST /chat/completions returns a clear error when the bound entry is not active", async () => {
  const state = createState();
  state.tasks[0].defaultModelEntryId = "model-inactive";

  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.match(payload.error.message, /先去模型库测试连接/);
      assert.equal(payload.error.code, "model_not_active");
    });
  }, state);
});

test("POST /chat/completions returns a clear error when the bound entry has no api key", async () => {
  const state = createState();
  state.tasks[0].defaultModelEntryId = "model-no-key";

  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.match(payload.error.message, /缺少 API Key/);
      assert.equal(payload.error.code, "missing_api_key");
    });
  }, state);
});

test("switching task-claude-code defaultModelEntryId changes subsequent relay requests", async () => {
  const observedModels = [];

  await withMockUpstream(async (request, response) => {
    const body = await readRequestJson(request);
    observedModels.push(body.model);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-2",
      object: "chat.completion",
      model: body.model,
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }]
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;
    state.modelEntries[1].baseUrl = upstreamBaseUrl;

    await withTempState(async ({ readState, writeState }) => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const first = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "hello" }]
          })
        });
        assert.equal(first.status, 200);

        const nextState = await readState();
        nextState.tasks[0].defaultModelEntryId = "model-second";
        await writeState(nextState);

        const second = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "hello again" }]
          })
        });
        assert.equal(second.status, 200);
      });
    }, state);

    assert.deepEqual(observedModels, ["model-a", "model-b"]);
  });
});

test("POST /chat/completions returns a clear error when the upstream is unreachable", async () => {
  const state = createState();
  state.modelEntries[0].baseUrl = "http://127.0.0.1:9/v1";

  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 502);
      const payload = await response.json();
      assert.equal(payload.error.code, "upstream_unreachable");
      assert.match(payload.error.message, /上游不可达|连接失败/);
    });
  }, state);
});

test("POST /chat/completions preserves upstream status and wraps error summary", async () => {
  await withMockUpstream(async (_request, response) => {
    response.writeHead(429, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      error: {
        message: "upstream rate limit",
        type: "rate_limit_error"
      }
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;

    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "hello" }]
          })
        });

        assert.equal(response.status, 429);
        const payload = await response.json();
        assert.match(payload.error.message, /upstream rate limit/);
        assert.equal(payload.error.code, "upstream_error");
        assert.equal(payload.relay.taskId, "task-claude-code");
        assert.equal(payload.relay.modelEntryId, "model-active");
      });
    }, state);
  });
});

test("POST /v1/messages/count_tokens returns a usable token count payload", async () => {
  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/messages/count_tokens`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "ignored-by-relay",
          system: "You are helpful.",
          messages: [
            { role: "user", content: [{ type: "text", text: "hello relay" }] }
          ]
        })
      });

      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(typeof payload.input_tokens, "number");
      assert.ok(payload.input_tokens > 0);
    });
  });
});

test("POST /v1/messages maps anthropic messages into upstream chat completions and returns anthropic text content", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-anthropic-1",
      object: "chat.completion",
      model: observedBody.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "relay says hello"
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 8
      }
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;

    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "ignored-by-relay",
            system: "You are a coding assistant.",
            max_tokens: 256,
            messages: [
              { role: "user", content: [{ type: "text", text: "hello relay" }] }
            ]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.role, "assistant");
        assert.equal(payload.content[0].type, "text");
        assert.equal(payload.content[0].text, "relay says hello");
        assert.equal(payload.model, "model-a");
        assert.equal(payload.stop_reason, "end_turn");
      });
    }, state);

    assert.equal(observedBody.model, "model-a");
    assert.equal(observedBody.messages[0].role, "system");
    assert.equal(observedBody.messages[0].content, "You are a coding assistant.");
    assert.equal(observedBody.messages[1].role, "user");
    assert.equal(observedBody.messages[1].content, "hello relay");
  });
});

test("POST /v1/messages maps anthropic tools to upstream tools and tool calls back to tool_use", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-anthropic-tool",
      object: "chat.completion",
      model: observedBody.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "read_file",
                  arguments: "{\"path\":\"README.md\"}"
                }
              }
            ]
          },
          finish_reason: "tool_calls"
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5
      }
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;

    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "ignored-by-relay",
            max_tokens: 256,
            tools: [
              {
                name: "read_file",
                description: "Read a file",
                input_schema: {
                  type: "object",
                  properties: {
                    path: { type: "string" }
                  },
                  required: ["path"]
                }
              }
            ],
            messages: [
              { role: "user", content: [{ type: "text", text: "read the readme" }] }
            ]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.stop_reason, "tool_use");
        assert.equal(payload.content[0].type, "tool_use");
        assert.equal(payload.content[0].name, "read_file");
        assert.deepEqual(payload.content[0].input, { path: "README.md" });
      });
    }, state);

    assert.equal(observedBody.tools[0].type, "function");
    assert.equal(observedBody.tools[0].function.name, "read_file");
    assert.equal(observedBody.tool_choice, "auto");
  });
});
