import test from "node:test";
import assert from "node:assert/strict";
import { readState, resetState } from "../store.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seedRuns, seedTasks } from "../seed-data.mjs";

test("resetState seeds model entries, tasks, and runs", async () => {
  await resetState();
  const state = await readState();

  assert.ok(state.modelEntries.length >= 4);
  assert.ok(state.tasks.length >= 4);
  assert.ok(state.runs.length >= 3);
});

test("readState migrates legacy deepseek v3 ids to the canonical v4 id", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-control-plane-deepseek-migrate-"));
  const previous = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = tempDir;

  try {
    const legacyState = {
      modelEntries: [
        {
          id: "preset-deepseek-v3",
          name: "DeepSeek V4 官方",
          providerLabel: "DeepSeek Platform",
          kind: "domestic-model",
          source: "preset",
          baseUrl: "https://api.deepseek.com/v1",
          modelId: "deepseek-v4-pro",
          reasoningEffort: null,
          catalogFamily: "openai-compatible",
          purchaseUrl: "https://platform.deepseek.com/",
          status: "configured-pending-test",
          statusNote: "legacy",
          hasStoredApiKey: true,
          maskedApiKey: "sk-legacy",
          lastTestedAt: null,
          lastTestResult: "idle",
          lastTestCode: "not-tested",
          lastTestMessage: "legacy",
          capabilities: {
            responses: { ok: false, streamOk: false },
            chatCompletions: { ok: false },
            lastProbedAt: null,
            lastErrorMessage: null
          },
          presetPriority: "recommended-first",
          recommendedTaskCategories: ["业务任务"],
          recommendedTaskIds: ["task-therapy-summary"],
          selectionReason: "legacy",
          activationHint: "legacy",
          costTier: "中",
          capabilityTags: ["摘要"],
          tags: ["国产模型"]
        }
      ],
      tasks: seedTasks.map((task) => ({
        ...task,
        defaultModelEntryId: task.defaultModelEntryId === "preset-deepseek-v3" ? "preset-deepseek-v3" : task.defaultModelEntryId
      })),
      runs: seedRuns.map((run) => ({
        ...run,
        modelEntryId: run.modelEntryId === "preset-deepseek-v3" ? "preset-deepseek-v3" : run.modelEntryId
      })),
      nextIds: { model: 1, task: 1, run: 1 }
    };

    await fs.writeFile(path.join(tempDir, "state.json"), JSON.stringify(legacyState, null, 2), "utf8");
    const state = await import(`../store.mjs?migrate=${Date.now()}`).then((m) => m.readState());
    assert.ok(state.modelEntries.some((entry) => entry.id === "preset-deepseek-v4"));
    assert.equal(state.modelEntries.some((entry) => entry.id === "preset-deepseek-v3"), false);
    assert.ok(state.tasks.every((task) => task.defaultModelEntryId !== "preset-deepseek-v3"));
    assert.ok(state.runs.every((run) => run.modelEntryId !== "preset-deepseek-v3"));
  } finally {
    if (previous === undefined) {
      delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    } else {
      process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = previous;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
