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
    assert.ok(payload.length >= 4);
    assert.equal("apiKey" in payload[0], false);
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
    assert.match(payload.statusNote, /连接测试通过/);
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
