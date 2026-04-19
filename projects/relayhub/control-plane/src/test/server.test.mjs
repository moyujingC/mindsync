import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createControlPlaneServer } from "../server.mjs";
import { resetState } from "../store.mjs";

async function withServer(run) {
  const server = createControlPlaneServer();
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

test("GET /models returns public model entries without apiKey", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.ok(Array.isArray(payload));
    assert.ok(payload.length >= 6);
    assert.equal("apiKey" in payload[0], false);
    assert.equal(payload[0].presetPriority !== undefined, true);
    assert.equal(Array.isArray(payload[0].recommendedTaskIds), true);
  });
});

test("POST /models/:id/test promotes a configured entry to active", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-ppchat-relay/test`, {
      method: "POST"
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.status, "active");
    assert.equal(payload.lastTestResult, "success");
    assert.equal(payload.lastTestCode, "success");
    assert.match(payload.lastTestMessage, /测试连接通过/);
    assert.match(payload.statusNote, /连接测试通过/);
  });
});

test("POST /models/:id/test returns missing API key semantics", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-qwen-max/test`, {
      method: "POST"
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.status, "test-failed");
    assert.equal(payload.lastTestResult, "missing-api-key");
    assert.equal(payload.lastTestCode, "missing_api_key");
    assert.match(payload.lastTestMessage, /缺少 API Key/);
  });
});

test("POST /models/:id/test returns invalid base URL semantics", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const updateResponse = await fetch(`${baseUrl}/models/preset-ppchat-relay`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        baseUrl: "bad-url"
      })
    });
    assert.equal(updateResponse.status, 200);

    const response = await fetch(`${baseUrl}/models/preset-ppchat-relay/test`, {
      method: "POST"
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.status, "test-failed");
    assert.equal(payload.lastTestResult, "invalid-base-url");
    assert.equal(payload.lastTestCode, "invalid_base_url");
    assert.match(payload.lastTestMessage, /Base URL 不合法/);
  });
});

test("GET /tasks/:id/stats returns aggregated task stats", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/tasks/task-claude-code/stats`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.taskId, "task-claude-code");
    assert.ok(payload.totalRuns >= 2);
    assert.ok(Array.isArray(payload.modelStats));
  });
});

test("GET /api/control-plane/health works behind same-origin reverse proxy prefix", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/control-plane/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.ok, true);
  });
});
