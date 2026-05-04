import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

async function withTempDataDir(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-control-plane-test-"));
  const previousDataDir = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = tempDir;
  try {
    await resetState();
    await run(tempDir);
  } finally {
    if (previousDataDir === undefined) {
      delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    } else {
      process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = previousDataDir;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test("GET /models returns public model entries without apiKey", async () => {
  await withTempDataDir(async () => {
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
});

test("POST /models stores api key in secrets file instead of state.json", async () => {
  await withTempDataDir(async (tempDir) => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/models`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: "Secret Relay",
          kind: "relay-api",
          providerLabel: "secret-provider",
          baseUrl: "https://secret.example.com/v1",
          modelId: "gpt-5",
          apiKey: "sk-secret-123"
        })
      });
      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.hasStoredApiKey, true);
      assert.equal(payload.maskedApiKey, "sk-sec...-123");

      const stateRaw = await fs.readFile(path.join(tempDir, "state.json"), "utf8");
      assert.equal(stateRaw.includes("sk-secret-123"), false);

      const secrets = JSON.parse(await fs.readFile(path.join(tempDir, "model-secrets.json"), "utf8"));
      assert.equal(secrets[payload.id].apiKey, "sk-secret-123");
    });
  });
});

test("POST /internal/resolve-entry-binding returns full binding with api key when authorized", async () => {
  const previousToken = process.env.RELAYHUB_INTERNAL_TOKEN;
  process.env.RELAYHUB_INTERNAL_TOKEN = "relayhub-internal-test";
  try {
    await withTempDataDir(async () => {
      await withServer(async (baseUrl) => {
        const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            apiKey: "sk-aitechflux-test"
          })
        });
        assert.equal(saveResponse.status, 200);

        const bindResponse = await fetch(`${baseUrl}/entry-bindings/entry-paperclip-claude-local-server`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            defaultModelEntryId: "preset-aitechflux-relay"
          })
        });
        assert.equal(bindResponse.status, 200);

        const relayResponse = await fetch(`${baseUrl}/relay-access`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            relayToken: "relayhub-gate-token-test"
          })
        });
        assert.equal(relayResponse.status, 200);

        const response = await fetch(`${baseUrl}/internal/resolve-entry-binding`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-relayhub-internal-token": "relayhub-internal-test"
          },
          body: JSON.stringify({
            entryId: "entry-paperclip-claude-local-server"
          })
        });
        assert.equal(response.status, 200);
        const payload = await response.json();

        assert.equal(payload.entryId, "entry-paperclip-claude-local-server");
        assert.equal(payload.alias, "relayhub-entry-paperclip-claude-local-server");
        assert.equal(payload.relayToken, "relayhub-gate-token-test");
        assert.equal(payload.defaultModelEntryId, "preset-aitechflux-relay");
        assert.equal(payload.resolvedModel.baseUrl, "https://aitechflux.com/v1");
        assert.equal(payload.resolvedModel.modelId, "claude-sonnet");
        assert.equal(payload.resolvedModel.apiKey, "sk-aitechflux-test");
        assert.equal(payload.resolvedModel.hasStoredApiKey, true);
      });
    });
  } finally {
    if (previousToken === undefined) {
      delete process.env.RELAYHUB_INTERNAL_TOKEN;
    } else {
      process.env.RELAYHUB_INTERNAL_TOKEN = previousToken;
    }
  }
});

test("POST /internal/resolve-entry-binding returns 401 when token is missing", async () => {
  const previousToken = process.env.RELAYHUB_INTERNAL_TOKEN;
  process.env.RELAYHUB_INTERNAL_TOKEN = "relayhub-internal-test";
  try {
    await withTempDataDir(async () => {
      await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/internal/resolve-entry-binding`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            entryId: "entry-paperclip-claude-local-server"
          })
        });
        assert.equal(response.status, 401);
      });
    });
  } finally {
    if (previousToken === undefined) {
      delete process.env.RELAYHUB_INTERNAL_TOKEN;
    } else {
      process.env.RELAYHUB_INTERNAL_TOKEN = previousToken;
    }
  }
});

test("GET /tasks includes the dev-relay built-in task matrix", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/tasks`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.ok(Array.isArray(payload));
    assert.ok(payload.some((item) => item.id === "task-dev-frontend"));
    assert.ok(payload.some((item) => item.id === "task-dev-backend"));
    assert.ok(payload.some((item) => item.id === "task-dev-test-fix"));
    assert.ok(payload.some((item) => item.id === "task-dev-docs"));
    assert.ok(payload.some((item) => item.id === "task-dev-research"));
  });
});

test("GET /entries returns the entry matrix including observe-only mobile Claude", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/entries`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.ok(Array.isArray(payload));
    const mobile = payload.find((item) => item.id === "entry-claude-mobile-observe");
    assert.ok(mobile);
    assert.equal(mobile.protocolFamily, "observe-only");
    assert.equal(mobile.controllable, false);
    assert.ok(payload.some((item) => item.id === "entry-paperclip-claude-local-mac"));
    assert.ok(payload.some((item) => item.id === "entry-paperclip-claude-local-server"));
  });
});

test("GET /entry-bindings returns per-entry default model bindings", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/entry-bindings`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.ok(Array.isArray(payload));
    const claudeLocalMac = payload.find((item) => item.entryId === "entry-paperclip-claude-local-mac");
    assert.ok(claudeLocalMac);
    assert.equal(typeof claudeLocalMac.statusNote, "string");
    assert.equal(claudeLocalMac.reasoningEffortOverride, null);
  });
});

test("GET /relay-access returns missing state by default", async () => {
  await withTempDataDir(async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/relay-access`);
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.equal(payload.hasStoredRelayToken, false);
      assert.equal(payload.maskedRelayToken, null);
      assert.equal(payload.effectiveSource, "missing");
    });
  });
});

test("PATCH /relay-access stores relay token separately from state.json", async () => {
  await withTempDataDir(async (tempDir) => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/relay-access`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          relayToken: "relayhub-gate-token-123"
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.equal(payload.hasStoredRelayToken, true);
      assert.equal(payload.effectiveSource, "control-plane");
      assert.match(payload.maskedRelayToken, /relayh\.\.\./);

      const stateRaw = await fs.readFile(path.join(tempDir, "state.json"), "utf8");
      assert.equal(stateRaw.includes("relayhub-gate-token-123"), false);

      const relayConfig = JSON.parse(await fs.readFile(path.join(tempDir, "relay-config.json"), "utf8"));
      assert.equal(relayConfig.relayToken, "relayhub-gate-token-123");
    });
  });
});

test("GET /entry-bindings/resolutions returns public resolved entry view without api key", async () => {
  await withTempDataDir(async () => {
    await withServer(async (baseUrl) => {
      const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test"
        })
      });
      assert.equal(saveResponse.status, 200);

      const response = await fetch(`${baseUrl}/entry-bindings/resolutions`);
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.ok(Array.isArray(payload));
      const resolved = payload.find((item) => item.entryId === "entry-paperclip-claude-local-server");
      assert.ok(resolved);
      assert.equal(resolved.alias, "relayhub-entry-paperclip-claude-local-server");
      assert.equal(resolved.clientFamily, "paperclip");
      assert.equal(resolved.reasoningEffortOverride, null);
      assert.equal(resolved.effectiveReasoningEffort, null);
      assert.equal(typeof resolved.resolvedModel.baseUrl, "string");
      assert.equal(typeof resolved.resolvedModel.modelId, "string");
      assert.equal(typeof resolved.resolvedModel.hasStoredApiKey, "boolean");
      assert.equal("apiKey" in resolved.resolvedModel, false);
    });
  });
});

test("PATCH /entry-bindings/:entryId updates the entry default model binding", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/entry-bindings/entry-codex-ide-local`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        defaultModelEntryId: "preset-siliconflow",
        fallbackModelEntryId: "preset-ppchat-relay",
        reasoningEffortOverride: "high",
        statusNote: "切到更便宜入口。"
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.defaultModelEntryId, "preset-siliconflow");
    assert.equal(payload.defaultModelEntryName, "SiliconFlow 通用目录");
    assert.equal(payload.fallbackModelEntryId, "preset-ppchat-relay");
    assert.equal(payload.reasoningEffortOverride, "high");
    assert.equal(payload.statusNote, "切到更便宜入口。");
  });
});

test("POST /internal/resolve-entry-binding returns override and effective reasoning effort", async () => {
  const previousToken = process.env.RELAYHUB_INTERNAL_TOKEN;
  process.env.RELAYHUB_INTERNAL_TOKEN = "relayhub-internal-test";
  try {
    await withTempDataDir(async () => {
      await withServer(async (baseUrl) => {
        const modelResponse = await fetch(`${baseUrl}/models/preset-ppchat-relay`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            modelId: "gpt-5.4",
            reasoningEffort: "medium",
            apiKey: "sk-ppchat-test"
          })
        });
        assert.equal(modelResponse.status, 200);

        const bindingResponse = await fetch(`${baseUrl}/entry-bindings/entry-paperclip-codex-local-server`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            defaultModelEntryId: "preset-deepseek-v4",
            fallbackModelEntryId: "preset-ppchat-relay",
            reasoningEffortOverride: "high"
          })
        });
        assert.equal(bindingResponse.status, 200);

        const relayResponse = await fetch(`${baseUrl}/relay-access`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            relayToken: "relayhub-codex-gate-token"
          })
        });
        assert.equal(relayResponse.status, 200);

        const response = await fetch(`${baseUrl}/internal/resolve-entry-binding`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-relayhub-internal-token": "relayhub-internal-test"
          },
          body: JSON.stringify({
            entryId: "entry-paperclip-codex-local-server"
          })
        });
        assert.equal(response.status, 200);
        const payload = await response.json();

        assert.equal(payload.alias, "relayhub-entry-paperclip-codex-local-server");
        assert.equal(payload.relayToken, "relayhub-codex-gate-token");
        assert.equal(payload.reasoningEffortOverride, "high");
        assert.equal(payload.resolvedModel.reasoningEffort, null);
        assert.equal(payload.effectiveReasoningEffort, "high");
      });
    });
  } finally {
    if (previousToken === undefined) {
      delete process.env.RELAYHUB_INTERNAL_TOKEN;
    } else {
      process.env.RELAYHUB_INTERNAL_TOKEN = previousToken;
    }
  }
});

test("readState backfills missing reasoningEffortOverride on legacy entry bindings", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-control-plane-legacy-"));
  const previousDataDir = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = tempDir;

  try {
    const legacyState = {
      modelEntries: [],
      entries: [],
      entryBindings: [
        {
          entryId: "entry-claude-ide-local",
          defaultModelEntryId: null,
          defaultModelEntryName: null,
          fallbackModelEntryId: null,
          fallbackModelEntryName: null,
          statusNote: "legacy binding"
        }
      ],
      tasks: [],
      runs: [],
      nextIds: {
        model: 1,
        task: 1,
        run: 1
      }
    };

    await fs.writeFile(path.join(tempDir, "state.json"), JSON.stringify(legacyState, null, 2), "utf8");
    await fs.writeFile(path.join(tempDir, "model-secrets.json"), JSON.stringify({}, null, 2), "utf8");

    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/entry-bindings`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload[0].reasoningEffortOverride, null);
    });
  } finally {
    if (previousDataDir === undefined) {
      delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    } else {
      process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = previousDataDir;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("POST /models/:id/test promotes a configured entry to active", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://code.ppchat.vip/v1/models") {
      return new Response(JSON.stringify({ data: [{ id: "gpt-5" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://code.ppchat.vip/v1/responses") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.stream) {
        return new Response(
          "event: response.output_text.delta\ndata: {\"type\":\"response.output_text.delta\",\"delta\":\"ok\"}\n\n"
            + "event: response.completed\ndata: {\"type\":\"response.completed\"}\n\n",
          {
            status: 200,
            headers: { "content-type": "text/event-stream; charset=utf-8" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          id: "resp_probe",
          object: "response",
          status: "completed",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (typeof input === "string" && input === "https://code.ppchat.vip/v1/chat/completions") {
      return new Response(
        JSON.stringify({
          id: "chatcmpl_probe",
          object: "chat.completion",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  try {
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
      assert.equal(payload.capabilities.responses.ok, true);
      assert.equal(payload.capabilities.responses.streamOk, true);
      assert.equal(payload.capabilities.chatCompletions.ok, true);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
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
    assert.equal(payload.modelId, "changed-model");
    assert.equal(payload.kind, "coding-plan");
    assert.equal(payload.providerLabel, "new-provider");
  });
});

test("PATCH /models/:id keeps AITechFlux preset base url and kind locked but allows model id update", async () => {
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
    assert.equal(payload.modelId, "changed-model");
    assert.equal(payload.kind, "relay-api");
    assert.equal(payload.providerLabel, "custom-provider");
  });
});

test("PATCH /models/:id resets stale capabilities after config changes", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-ppchat-relay`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        providerLabel: "relayhub-managed",
        modelId: "gpt-5-codex"
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.status, "configured-pending-test");
    assert.equal(payload.lastTestResult, "idle");
    assert.equal(payload.lastTestCode, "not-tested");
    assert.equal(payload.lastTestedAt, null);
    assert.equal(payload.capabilities.responses.ok, false);
    assert.equal(payload.capabilities.responses.streamOk, false);
    assert.equal(payload.capabilities.chatCompletions.ok, false);
  });
});

test("PATCH /models/:id persists reasoning effort", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-ppchat-relay`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        modelId: "gpt-5.4",
        reasoningEffort: "high"
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.modelId, "gpt-5.4");
    assert.equal(payload.reasoningEffort, "high");
  });
});

test("GET /models/:id/catalog returns upstream model list for preset relay entry with api key", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      assert.equal(init?.headers?.Authorization, "Bearer sk-aitechflux-test");
      return new Response(
        JSON.stringify({
          data: [
            { id: "高性能极速模型" },
            { id: "高性能低价模型" },
            { id: "Claude混合版" },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });
      assert.equal(saveResponse.status, 200);

      const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/catalog`);
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.ok(Array.isArray(payload.items));
      assert.deepEqual(
        payload.items.map((item) => item.id),
        ["高性能极速模型", "高性能低价模型", "Claude混合版"],
      );
      assert.match(payload.fetchedAt, /\d{4}-\d{2}-\d{2}/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GET /models/:id/catalog fails clearly when api key is missing", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/catalog`);
    assert.equal(response.status, 400);
    const payload = await response.json();

    assert.match(payload.message, /先补 API Key/);
  });
});

test("GET /models/:id/catalog rejects unsupported non-relay presets", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/models/preset-qwen-max/catalog`);
    assert.equal(response.status, 400);
    const payload = await response.json();

    assert.match(payload.message, /仅支持中转预置入口/);
  });
});

test("GET /models/:id/catalog returns upstream error summary when upstream is non-2xx", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      assert.equal(init?.headers?.Authorization, "Bearer sk-aitechflux-test");
      return new Response(JSON.stringify({ error: { message: "无可用通道" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });

      const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/catalog`);
      assert.equal(response.status, 502);
      const payload = await response.json();

      assert.match(payload.message, /上游返回异常/);
      assert.match(payload.message, /503/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GET /models/:id/catalog rejects invalid upstream payload", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      assert.equal(init?.headers?.Authorization, "Bearer sk-aitechflux-test");
      return new Response(JSON.stringify({ items: "not-an-array" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });

      const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/catalog`);
      assert.equal(response.status, 502);
      const payload = await response.json();

      assert.match(payload.message, /返回结构不合法/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("POST /models/:id/test marks chat-only relay as active but not Codex-bindable", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      return new Response(JSON.stringify({ data: [{ id: "claude-sonnet" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/responses") {
      return new Response(JSON.stringify({ error: { message: "responses unavailable" } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/chat/completions") {
      return new Response(
        JSON.stringify({
          id: "chatcmpl_chat_only",
          object: "chat.completion",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });
      assert.equal(saveResponse.status, 200);

      const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/test`, {
        method: "POST"
      });
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.equal(payload.status, "active");
      assert.equal(payload.lastTestResult, "responses-unavailable");
      assert.equal(payload.lastTestCode, "responses_unavailable");
      assert.match(payload.lastTestMessage, /responses unavailable|仅支持 chat\/completions/);
      assert.match(payload.statusNote, /仅支持 chat\/completions，不可绑定 Codex/);
      assert.equal(payload.capabilities.responses.ok, false);
      assert.equal(payload.capabilities.responses.streamOk, false);
      assert.equal(payload.capabilities.chatCompletions.ok, true);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("POST /models/:id/test marks stream-failed relay as test-failed with explicit Codex block reason", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      return new Response(JSON.stringify({ data: [{ id: "claude-sonnet" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/responses") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.stream) {
        return new Response("event: response.created\ndata: {\"type\":\"response.created\"}\n\n", {
          status: 200,
          headers: { "content-type": "text/event-stream; charset=utf-8" },
        });
      }

      return new Response(
        JSON.stringify({
          id: "resp_non_stream",
          object: "response",
          status: "completed",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/chat/completions") {
      return new Response(
        JSON.stringify({
          id: "chatcmpl_stream_fail",
          object: "chat.completion",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });
      assert.equal(saveResponse.status, 200);

      const response = await fetch(`${baseUrl}/models/preset-aitechflux-relay/test`, {
        method: "POST"
      });
      assert.equal(response.status, 200);
      const payload = await response.json();

      assert.equal(payload.status, "test-failed");
      assert.equal(payload.lastTestResult, "responses-stream-unavailable");
      assert.equal(payload.lastTestCode, "responses_stream_unavailable");
      assert.match(payload.statusNote, /Responses 流式失败，不可绑定 Codex/);
      assert.equal(payload.capabilities.responses.ok, true);
      assert.equal(payload.capabilities.responses.streamOk, false);
      assert.equal(payload.capabilities.chatCompletions.ok, true);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test("PATCH /tasks/:id rejects binding incompatible model to task-codex-repo", async () => {
  await resetState();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/tasks/task-codex-repo`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        defaultModelEntryId: "preset-ppchat-relay"
      })
    });

    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.equal(payload.code, "incompatible_model_binding");
    assert.match(payload.message, /Responses 流式探测/);
  });
});

test("PATCH /tasks/:id still allows binding chat-only active model to task-claude-code", async () => {
  await resetState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input === "https://aitechflux.com/v1/models") {
      return new Response(JSON.stringify({ data: [{ id: "claude-sonnet" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/responses") {
      return new Response(JSON.stringify({ error: { message: "responses unavailable" } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (typeof input === "string" && input === "https://aitechflux.com/v1/chat/completions") {
      return new Response(
        JSON.stringify({
          id: "chatcmpl_chat_only",
          object: "chat.completion",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  try {
    await withServer(async (baseUrl) => {
      const saveResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          apiKey: "sk-aitechflux-test",
        }),
      });
      assert.equal(saveResponse.status, 200);

      const testResponse = await fetch(`${baseUrl}/models/preset-aitechflux-relay/test`, {
        method: "POST"
      });
      assert.equal(testResponse.status, 200);

      const response = await fetch(`${baseUrl}/tasks/task-claude-code`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          defaultModelEntryId: "preset-aitechflux-relay"
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.defaultModelEntryId, "preset-aitechflux-relay");
      assert.equal(payload.defaultModelEntryName, "AITechFlux 中转");
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
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
