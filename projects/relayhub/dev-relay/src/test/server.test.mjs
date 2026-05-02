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
        reasoningEffort: null,
        catalogFamily: "openai-compatible",
        apiKey: "sk-active",
        capabilities: {
          responses: { ok: true, streamOk: true },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-26 10:00",
          lastErrorMessage: null
        }
      },
      {
        id: "model-second",
        name: "Second Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:2/v1",
        modelId: "model-b",
        reasoningEffort: null,
        providerLabel: "AITechFlux",
        catalogFamily: "openai-compatible",
        apiKey: "sk-second",
        capabilities: {
          responses: { ok: true, streamOk: true },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-26 10:00",
          lastErrorMessage: null
        }
      },
      {
        id: "model-inactive",
        name: "Inactive Relay",
        status: "configured-pending-test",
        baseUrl: "http://127.0.0.1:3/v1",
        modelId: "model-c",
        reasoningEffort: null,
        catalogFamily: "openai-compatible",
        apiKey: "sk-inactive",
        capabilities: {
          responses: { ok: false, streamOk: false },
          chatCompletions: { ok: false },
          lastProbedAt: null,
          lastErrorMessage: null
        }
      },
      {
        id: "model-no-key",
        name: "No Key Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:4/v1",
        modelId: "model-d",
        reasoningEffort: null,
        catalogFamily: "openai-compatible",
        apiKey: null,
        capabilities: {
          responses: { ok: true, streamOk: true },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-26 10:00",
          lastErrorMessage: null
        }
      },
      {
        id: "model-chat-only",
        name: "Chat Only Relay",
        status: "active",
        baseUrl: "http://127.0.0.1:5/v1",
        modelId: "model-chat",
        reasoningEffort: null,
        catalogFamily: "openai-compatible",
        apiKey: "sk-chat-only",
        capabilities: {
          responses: { ok: false, streamOk: false },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-26 10:00",
          lastErrorMessage: "仅支持 chat/completions，不可绑定 Codex。"
        }
      }
    ],
    entries: [
      { id: "entry-claude-ide-local", alias: "relayhub-entry-claude-ide-local" },
      { id: "entry-codex-ide-local", alias: "relayhub-entry-codex-ide-local" },
    ],
    entryBindings: [
      {
        entryId: "entry-claude-ide-local",
        defaultModelEntryId: "model-active",
        defaultModelEntryName: "Active Relay",
        fallbackModelEntryId: null,
        fallbackModelEntryName: null,
        statusNote: "Claude IDE local binding",
      },
      {
        entryId: "entry-codex-ide-local",
        defaultModelEntryId: "model-active",
        defaultModelEntryName: "Active Relay",
        fallbackModelEntryId: null,
        fallbackModelEntryName: null,
        statusNote: "Codex IDE local binding",
      },
    ],
    tasks: [
      {
        id: "task-claude-code",
        name: "Claude Code Web Coding",
        defaultModelEntryId: "model-active"
      },
      {
        id: "task-codex-repo",
        name: "Codex Repo Coding",
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
  const secrets = Object.fromEntries(
    state.modelEntries
      .filter((item) => typeof item.apiKey === "string" && item.apiKey.trim())
      .map((item) => [
        item.id,
        {
          apiKey: item.apiKey,
          updatedAt: null,
        },
      ]),
  );
  await fs.writeFile(path.join(dataDir, "state.json"), JSON.stringify(state, null, 2), "utf8");
  await fs.writeFile(path.join(dataDir, "model-secrets.json"), JSON.stringify(secrets, null, 2), "utf8");
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

async function withRelayLogDir(run) {
  const logDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-dev-relay-log-"));
  const previous = process.env.RELAYHUB_DEV_RELAY_LOG_DIR;
  process.env.RELAYHUB_DEV_RELAY_LOG_DIR = logDir;

  try {
    await run({
      logDir,
      logFile: path.join(logDir, "claude-upstream-models.jsonl")
    });
  } finally {
    if (previous === undefined) {
      delete process.env.RELAYHUB_DEV_RELAY_LOG_DIR;
    } else {
      process.env.RELAYHUB_DEV_RELAY_LOG_DIR = previous;
    }
    await fs.rm(logDir, { recursive: true, force: true });
  }
}

async function withCodexRelayEnabled(run) {
  const previous = process.env.RELAYHUB_ENABLE_CODEX_RELAY;
  process.env.RELAYHUB_ENABLE_CODEX_RELAY = "1";

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.RELAYHUB_ENABLE_CODEX_RELAY;
    } else {
      process.env.RELAYHUB_ENABLE_CODEX_RELAY = previous;
    }
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

test("GET /v1/models returns disabled by default", async () => {
  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/models`);
      assert.equal(response.status, 503);
      const payload = await response.json();
      assert.equal(payload.error.code, "codex_relay_disabled");
    });
  });
});

test("GET /v1/models returns only the currently bound Codex model when explicitly enabled", async () => {
  await withCodexRelayEnabled(async () => {
    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/models`);
        assert.equal(response.status, 200);
        const payload = await response.json();

        assert.equal(payload.object, "list");
        assert.deepEqual(payload.data.map((item) => item.id), ["relayhub-entry-codex-ide-local", "model-a"]);
      });
    });
  });
});

test("GET /v1/models returns a clear error when task-codex-repo is not bound and explicitly enabled", async () => {
  const state = createState();
  state.entryBindings[1].defaultModelEntryId = null;
  state.entryBindings[1].defaultModelEntryName = null;

  await withCodexRelayEnabled(async () => {
    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/models`);
        assert.equal(response.status, 409);
        const payload = await response.json();
        assert.equal(payload.error.code, "entry_not_bound");
        assert.equal(payload.relay.entryId, "entry-codex-ide-local");
      });
    }, state);
  });
});

test("POST /v1/responses returns disabled by default", async () => {
  await withTempState(async () => {
    await withServer(createDevRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/responses`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          input: "hello",
          stream: false
        })
      });

      assert.equal(response.status, 503);
      const payload = await response.json();
      assert.equal(payload.error.code, "codex_relay_disabled");
    });
  });
});

test("POST /v1/responses forwards non-stream requests to the bound Codex upstream when explicitly enabled", async () => {
  let observedBody = null;
  let observedAuthorization = null;

  await withCodexRelayEnabled(async () => {
    await withMockUpstream(async (request, response) => {
      observedAuthorization = request.headers.authorization ?? null;
      observedBody = await readRequestJson(request);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        object: "response",
        id: "resp_1",
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "ok" }]
          }
        ]
      }));
    }, async (upstreamBaseUrl) => {
      const state = createState();
      state.modelEntries[0].baseUrl = upstreamBaseUrl;

      await withTempState(async () => {
        await withServer(createDevRelayServer(), async (baseUrl) => {
          const response = await fetch(`${baseUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "should-be-overridden",
              input: "Reply with exactly: ok",
              stream: false
            })
          });
          assert.equal(response.status, 200);
          const payload = await response.json();
          assert.equal(payload.object, "response");
        });
      }, state);

      assert.equal(observedAuthorization, "Bearer sk-active");
      assert.equal(observedBody.model, "model-a");
      assert.equal(observedBody.stream, false);
    });
  });
});

test("POST /v1/responses routes relayhub task alias to its own bound entry when explicitly enabled", async () => {
  let observedBody = null;

  await withCodexRelayEnabled(async () => {
    await withMockUpstream(async (request, response) => {
      observedBody = await readRequestJson(request);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        object: "response",
        id: "resp_task_alias",
        status: "completed",
        output: []
      }));
    }, async (upstreamBaseUrl) => {
      const state = createState();
      state.modelEntries[0].baseUrl = upstreamBaseUrl;
      state.tasks.push({
        id: "task-dev-backend",
        name: "开发后端改动",
        defaultModelEntryId: "model-active"
      });

      await withTempState(async () => {
        await withServer(createDevRelayServer(), async (baseUrl) => {
          const response = await fetch(`${baseUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "relayhub-task-dev-backend",
              input: "修一个接口 bug",
              stream: false
            })
          });
          assert.equal(response.status, 200);
        });
      }, state);

      assert.equal(observedBody.model, "model-a");
    });
  });
});

test("POST /v1/responses routes relayhub entry alias to its bound model when explicitly enabled", async () => {
  let observedBody = null;

  await withCodexRelayEnabled(async () => {
    await withMockUpstream(async (request, response) => {
      observedBody = await readRequestJson(request);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        object: "response",
        id: "resp_entry_alias",
        status: "completed",
        output: []
      }));
    }, async (upstreamBaseUrl) => {
      const state = createState();
      state.modelEntries[0].baseUrl = upstreamBaseUrl;

      await withTempState(async () => {
        await withServer(createDevRelayServer(), async (baseUrl) => {
          const response = await fetch(`${baseUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "relayhub-entry-codex-ide-local",
              input: "修一个接口 bug",
              stream: false
            })
          });
          assert.equal(response.status, 200);
        });
      }, state);

      assert.equal(observedBody.model, "model-a");
    });
  });
});

test("POST /v1/responses forwards stream requests to the bound Codex upstream when explicitly enabled", async () => {
  let observedBody = null;

  await withCodexRelayEnabled(async () => {
    await withMockUpstream(async (request, response) => {
      observedBody = await readRequestJson(request);
      response.writeHead(200, { "content-type": "text/event-stream; charset=utf-8" });
      response.write("event: response.created\n");
      response.write('data: {"type":"response.created"}\n\n');
      response.write("event: response.output_text.delta\n");
      response.write('data: {"delta":"ok","type":"response.output_text.delta"}\n\n');
      response.write("event: response.completed\n");
      response.write('data: {"type":"response.completed"}\n\n');
      response.end();
    }, async (upstreamBaseUrl) => {
      const state = createState();
      state.modelEntries[0].baseUrl = upstreamBaseUrl;

      await withTempState(async () => {
        await withServer(createDevRelayServer(), async (baseUrl) => {
          const response = await fetch(`${baseUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "ignored",
              input: "Reply with exactly: ok",
              stream: true
            })
          });
          assert.equal(response.status, 200);
          assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
          const text = await response.text();
          assert.match(text, /response\.created/);
          assert.match(text, /response\.output_text\.delta/);
          assert.match(text, /response\.completed/);
        });
      }, state);

      assert.equal(observedBody.model, "model-a");
      assert.equal(observedBody.stream, true);
    });
  });
});

test("POST /v1/responses returns a clear error when the Codex entry is not Responses-ready and explicitly enabled", async () => {
  const state = createState();
  state.tasks[1].defaultModelEntryId = "model-chat-only";

  await withCodexRelayEnabled(async () => {
    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/responses`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            input: "hello",
            stream: false
          })
        });

        assert.equal(response.status, 409);
        const payload = await response.json();
        assert.equal(payload.error.code, "responses_not_ready");
        assert.match(payload.error.message, /Responses 流式探测/);
      });
    }, state);
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

test("POST /chat/completions routes relayhub task alias to its own bound entry", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-task-alias",
      object: "chat.completion",
      model: observedBody.model,
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }]
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;
    state.tasks.push({
      id: "task-dev-docs",
      name: "开发文档整理",
      defaultModelEntryId: "model-active"
    });

    await withTempState(async () => {
      await withServer(createDevRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "relayhub-task-dev-docs",
            messages: [{ role: "user", content: "整理一版交付说明" }]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.model, "model-a");
      });
    }, state);

    assert.equal(observedBody.model, "model-a");
  });
});

test("POST /v1/messages routes relayhub entry alias to its bound model", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-entry-alias",
      object: "chat.completion",
      model: observedBody.model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "ok" },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 2
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
            model: "relayhub-entry-claude-ide-local",
            max_tokens: 64,
            messages: [{ role: "user", content: [{ type: "text", text: "hello relay" }] }]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.model, "model-a");
      });
    }, state);

    assert.equal(observedBody.model, "model-a");
  });
});

test("POST /chat/completions forwards reasoning_effort for GPT-5 style models", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-reasoning",
      object: "chat.completion",
      model: observedBody.model,
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }]
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;
    state.modelEntries[0].modelId = "gpt-5.4";
    state.modelEntries[0].reasoningEffort = "high";

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

        assert.equal(response.status, 200);
      });
    }, state);

    assert.equal(observedBody.model, "gpt-5.4");
    assert.equal(observedBody.reasoning_effort, "high");
  });
});

test("POST /v1/responses forwards reasoning.effort for GPT-5 style models when explicitly enabled", async () => {
  let observedBody = null;

  await withCodexRelayEnabled(async () => {
    await withMockUpstream(async (request, response) => {
      observedBody = await readRequestJson(request);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        object: "response",
        id: "resp_reasoning",
        status: "completed",
        output: []
      }));
    }, async (upstreamBaseUrl) => {
      const state = createState();
      state.modelEntries[0].baseUrl = upstreamBaseUrl;
      state.modelEntries[0].modelId = "gpt-5.4";
      state.modelEntries[0].reasoningEffort = "high";

      await withTempState(async () => {
        await withServer(createDevRelayServer(), async (baseUrl) => {
          const response = await fetch(`${baseUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              input: "hello",
              stream: false
            })
          });
          assert.equal(response.status, 200);
        });
      }, state);

      assert.equal(observedBody.model, "gpt-5.4");
      assert.equal(observedBody.reasoning.effort, "high");
    });
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

    await withRelayLogDir(async ({ logFile }) => {
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

      const logLines = (await fs.readFile(logFile, "utf8")).trim().split("\n");
      assert.equal(logLines.length, 1);
      const record = JSON.parse(logLines[0]);
      assert.equal(record.configuredModelId, "model-a");
      assert.equal(record.actualModelId, "model-a");
      assert.equal(record.stream, false);
    });

    assert.equal(observedBody.model, "model-a");
    assert.equal(observedBody.messages[0].role, "system");
    assert.equal(observedBody.messages[0].content, "You are a coding assistant.");
    assert.equal(observedBody.messages[1].role, "user");
    assert.equal(observedBody.messages[1].content, "hello relay");
  });
});

test("POST /v1/messages proxies natively to anthropic upstream for AITechFlux-style entries", async () => {
  let observedBody = null;
  let observedHeaders = null;
  let observedPath = null;

  await withMockUpstream(async (request, response) => {
    observedPath = request.url;
    observedHeaders = request.headers;
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "msg_native_1",
      type: "message",
      role: "assistant",
      model: observedBody.model,
      content: [{ type: "text", text: "ok" }],
      stop_reason: "end_turn",
      usage: {
        input_tokens: 12,
        output_tokens: 1
      }
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.tasks[0].defaultModelEntryId = "model-second";
    state.modelEntries[1].baseUrl = upstreamBaseUrl;
    state.modelEntries[1].modelId = "Claude混合版";

    await withRelayLogDir(async ({ logFile }) => {
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
              max_tokens: 64,
              messages: [
                { role: "user", content: [{ type: "text", text: "hello native" }] }
              ]
            })
          });

          assert.equal(response.status, 200);
          const payload = await response.json();
          assert.equal(payload.type, "message");
          assert.equal(payload.model, "Claude混合版");
          assert.equal(payload.content[0].text, "ok");
        });
      }, state);

      const logLines = (await fs.readFile(logFile, "utf8")).trim().split("\n");
      assert.equal(logLines.length, 1);
      const record = JSON.parse(logLines[0]);
      assert.equal(record.configuredModelId, "Claude混合版");
      assert.equal(record.actualModelId, "Claude混合版");
      assert.equal(record.stream, false);
    });

    assert.equal(observedPath, "/messages");
    assert.equal(observedBody.model, "Claude混合版");
    assert.equal(observedBody.messages[0].role, "user");
    assert.equal(observedBody.messages[0].content[0].text, "hello native");
    assert.equal(observedHeaders["x-api-key"], "sk-second");
    assert.equal(observedHeaders.authorization, "Bearer sk-second");
  });
});

test("POST /v1/messages collapses think blocks for native anthropic upstream responses", async () => {
  await withMockUpstream(async (_request, response) => {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "msg_native_think_1",
      type: "message",
      role: "assistant",
      model: "MiniMax",
      content: [
        {
          type: "text",
          text: "<think>first line\\nsecond line</think>\\n\\nok"
        }
      ],
      stop_reason: "end_turn",
      usage: {
        input_tokens: 10,
        output_tokens: 6
      }
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.tasks[0].defaultModelEntryId = "model-second";
    state.modelEntries[1].baseUrl = upstreamBaseUrl;
    state.modelEntries[1].modelId = "Claude混合版";

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
            max_tokens: 64,
            messages: [
              { role: "user", content: [{ type: "text", text: "hello native think" }] }
            ]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.match(payload.content[0].text, /［思考过程已折叠］/);
        assert.doesNotMatch(payload.content[0].text, /first line/);
        assert.doesNotMatch(payload.content[0].text, /second line/);
        assert.match(payload.content[0].text, /ok/);
      });
    }, state);
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

test("POST /v1/messages preserves all anthropic tool_use ids when sending tool results back upstream", async () => {
  const observedBodies = [];

  await withMockUpstream(async (request, response) => {
    observedBodies.push(await readRequestJson(request));
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-anthropic-tool-results",
      object: "chat.completion",
      model: "model-a",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "done"
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 18,
        completion_tokens: 6
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
            messages: [
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: "toolu_read",
                    name: "read_file",
                    input: { path: "README.md" }
                  },
                  {
                    type: "tool_use",
                    id: "toolu_search",
                    name: "search_files",
                    input: { pattern: "relay" }
                  }
                ]
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: "toolu_read",
                    content: [{ type: "text", text: "README body" }]
                  },
                  {
                    type: "tool_result",
                    tool_use_id: "toolu_search",
                    content: [{ type: "text", text: "matched server.mjs" }]
                  }
                ]
              }
            ]
          })
        });

        assert.equal(response.status, 200);
      });
    }, state);
  });

  assert.equal(observedBodies.length, 1);
  assert.deepEqual(observedBodies[0].messages, [
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "toolu_read",
          type: "function",
          function: {
            name: "read_file",
            arguments: "{\"path\":\"README.md\"}"
          }
        },
        {
          id: "toolu_search",
          type: "function",
          function: {
            name: "search_files",
            arguments: "{\"pattern\":\"relay\"}"
          }
        }
      ]
    },
    {
      role: "tool",
      tool_call_id: "toolu_read",
      content: "README body"
    },
    {
      role: "tool",
      tool_call_id: "toolu_search",
      content: "matched server.mjs"
    }
  ]);
});

test("POST /v1/messages returns anthropic streaming events when stream=true", async () => {
  let observedBody = null;

  await withMockUpstream(async (request, response) => {
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-anthropic-stream",
      object: "chat.completion",
      model: observedBody.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "relay stream ok"
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 16,
        completion_tokens: 4
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
            max_tokens: 64,
            stream: true,
            messages: [
              { role: "user", content: [{ type: "text", text: "hello stream" }] }
            ]
          })
        });

        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);

        const text = await response.text();
        assert.match(text, /event: message_start/);
        assert.match(text, /event: content_block_start/);
        assert.match(text, /event: content_block_delta/);
        assert.match(text, /relay stream ok/);
        assert.match(text, /event: message_delta/);
        assert.match(text, /event: message_stop/);
      });
    }, state);

    assert.equal(observedBody.model, "model-a");
    assert.equal(observedBody.stream, false);
  });
});

test("POST /v1/messages collapses think blocks for mapped OpenAI-compatible responses", async () => {
  await withMockUpstream(async (_request, response) => {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl-anthropic-think",
      object: "chat.completion",
      model: "model-a",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "<think>draft reasoning</think>\\nfinal answer"
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 16,
        completion_tokens: 4
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
            max_tokens: 64,
            messages: [
              { role: "user", content: [{ type: "text", text: "hello think cleanup" }] }
            ]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.match(payload.content[0].text, /［思考过程已折叠］/);
        assert.doesNotMatch(payload.content[0].text, /draft reasoning/);
        assert.match(payload.content[0].text, /final answer/);
      });
    }, state);
  });
});
