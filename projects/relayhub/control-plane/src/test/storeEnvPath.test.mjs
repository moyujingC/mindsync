import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
