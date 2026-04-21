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
    assert.ok(payload.length >= 7);
    assert.equal("apiKey" in payload[0], false);
    assert.equal(payload[0].presetPriority !== undefined, true);
    assert.equal(Array.isArray(payload[0].recommendedTaskIds), true);
    assert.ok(payload.some((item) => item.id === "preset-aitechflux-relay"));
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
    const createResponse = await fetch(`${baseUrl}/models`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Invalid URL Relay",
        kind: "relay-api",
        providerLabel: "custom-relay",
        baseUrl: "bad-url"
        ,
        modelId: "gpt-5",
        apiKey: "sk-test-invalid"
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    const response = await fetch(`${baseUrl}/models/${created.id}/test`, {
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

test("PATCH /models/:id keeps preset base url and model id locked", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-ppchat-relay`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        baseUrl: "https://changed.example.com/v1",
        modelId: "changed-model",
        kind: "relay-api",
        providerLabel: "new-provider"
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.baseUrl, "https://code.ppchat.vip/v1");
    assert.equal(payload.modelId, "gpt-5");
    assert.equal(payload.kind, "coding-plan");
    assert.equal(payload.providerLabel, "new-provider");
  });
});

test("PATCH /models/:id keeps AITechFlux preset base url, model id, and kind locked", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        baseUrl: "https://changed.example.com/v1",
        modelId: "changed-model",
        kind: "coding-plan",
        providerLabel: "custom-provider"
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.baseUrl, "https://aitechflux.com/v1");
    assert.equal(payload.modelId, "claude-sonnet");
    assert.equal(payload.kind, "relay-api");
    assert.equal(payload.providerLabel, "custom-provider");
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
