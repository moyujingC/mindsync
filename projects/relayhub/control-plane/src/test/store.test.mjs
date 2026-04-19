import test from "node:test";
import assert from "node:assert/strict";
import { readState, resetState } from "../store.mjs";

test("resetState seeds model entries, tasks, and runs", async () => {
  await resetState();
  const state = await readState();

  assert.ok(state.modelEntries.length >= 4);
  assert.ok(state.tasks.length >= 4);
  assert.ok(state.runs.length >= 3);
});
