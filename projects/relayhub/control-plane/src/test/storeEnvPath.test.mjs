import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seedModelEntries, seedRuns, seedTasks } from "../seed-data.mjs";

test("control-plane store respects RELAYHUB_CONTROL_PLANE_DATA_DIR across module load", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-control-plane-env-"));
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = tempDir;

  try {
    const storeModule = await import(`../store.mjs?case=${Date.now()}`);
    const state = await storeModule.resetState();
    const persistedPath = path.join(tempDir, "state.json");
    const persisted = JSON.parse(await fs.readFile(persistedPath, "utf8"));

    assert.equal(persisted.modelEntries.length, state.modelEntries.length);
    assert.equal(persisted.tasks.length, state.tasks.length);
    assert.equal(persisted.runs.length, state.runs.length);
  } finally {
    delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("readState backfills newly added preset entries into an existing state file", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-control-plane-migrate-"));
  process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR = tempDir;

  try {
    const legacyState = {
      modelEntries: seedModelEntries
        .filter((entry) => entry.id !== "preset-aitechflux-relay")
        .map((entry) => structuredClone(entry)),
      tasks: structuredClone(seedTasks),
      runs: structuredClone(seedRuns),
      nextIds: {
        model: 1,
        task: 1,
        run: 1
      }
    };
    const persistedPath = path.join(tempDir, "state.json");
    await fs.writeFile(persistedPath, JSON.stringify(legacyState, null, 2), "utf8");

    const storeModule = await import(`../store.mjs?case=migrate-${Date.now()}`);
    const state = await storeModule.readState();
    const persisted = JSON.parse(await fs.readFile(persistedPath, "utf8"));

    assert.ok(state.modelEntries.some((entry) => entry.id === "preset-aitechflux-relay"));
    assert.ok(persisted.modelEntries.some((entry) => entry.id === "preset-aitechflux-relay"));
    assert.deepEqual(state.entryActivity, {});
    assert.deepEqual(persisted.entryActivity, {});
  } finally {
    delete process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR;
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
