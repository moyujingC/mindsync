import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { once } from "node:events";
import { createAimandalaProdRelayServer } from "../server.mjs";

function createState() {
  return {
    modelEntries: [
      {
        id: "domestic-active",
        name: "DeepSeek V3 官方",
        kind: "domestic-model",
        status: "active",
        baseUrl: "http://127.0.0.1:1/v1",
        modelId: "deepseek-chat",
        apiKey: "sk-domestic",
        capabilities: {
          responses: { ok: false, streamOk: false },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-27 09:00",
          lastErrorMessage: null
        }
      },
      {
        id: "relay-active",
        name: "PPChat 中转",
        kind: "coding-plan",
        status: "active",
        baseUrl: "http://127.0.0.1:2/v1",
        modelId: "gpt-5",
        apiKey: "sk-relay",
        capabilities: {
          responses: { ok: true, streamOk: true },
          chatCompletions: { ok: true },
          lastProbedAt: "2026-04-27 09:00",
          lastErrorMessage: null
        }
      }
    ],
    tasks: [
      {
        id: "task-aimandala-lite-report",
        name: "AI曼陀罗 Lite 报告",
        defaultModelEntryId: "domestic-active"
      },
      {
        id: "task-aimandala-pro-report",
        name: "AI曼陀罗 Pro 报告",
        defaultModelEntryId: "domestic-active"
      },
      {
        id: "task-aimandala-chat",
        name: "AI曼陀罗 报告追问",
        defaultModelEntryId: "domestic-active"
      },
      {
        id: "task-aimandala-vision",
        name: "AI曼陀罗 三圈识别",
        defaultModelEntryId: "domestic-active"
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
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-aimandala-prod-relay-"));
  await fs.writeFile(path.join(dataDir, "state.json"), JSON.stringify(state, null, 2), "utf8");
  const previous = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = dataDir;

  try {
    await run();
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
    await withServer(createAimandalaProdRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    });
  });
});

test("POST /v1/chat/completions routes AI曼陀罗 task alias to the bound domestic model", async () => {
  let observedBody = null;
  let observedAuthorization = null;

  await withMockUpstream(async (request, response) => {
    observedAuthorization = request.headers.authorization ?? null;
    observedBody = await readRequestJson(request);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      id: "chatcmpl_prod",
      object: "chat.completion",
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }]
    }));
  }, async (upstreamBaseUrl) => {
    const state = createState();
    state.modelEntries[0].baseUrl = upstreamBaseUrl;

    await withTempState(async () => {
      await withServer(createAimandalaProdRelayServer(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "relayhub-task-aimandala-lite-report",
            messages: [{ role: "user", content: "hello" }]
          })
        });

        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.id, "chatcmpl_prod");
      });
    }, state);
  });

  assert.equal(observedAuthorization, "Bearer sk-domestic");
  assert.equal(observedBody.model, "deepseek-chat");
});

test("POST /v1/chat/completions rejects unsupported task alias", async () => {
  await withTempState(async () => {
    await withServer(createAimandalaProdRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.equal(payload.error.code, "unsupported_task_model");
    });
  });
});

test("POST /v1/chat/completions rejects non-domestic bound entry for AI曼陀罗 task", async () => {
  const state = createState();
  state.tasks[0].defaultModelEntryId = "relay-active";

  await withTempState(async () => {
    await withServer(createAimandalaProdRelayServer(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "relayhub-task-aimandala-lite-report",
          messages: [{ role: "user", content: "hello" }]
        })
      });

      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.equal(payload.error.code, "provider_out_of_policy");
    });
  }, state);
});
