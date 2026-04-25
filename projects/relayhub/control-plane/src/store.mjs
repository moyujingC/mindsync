import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedModelEntries, seedRuns, seedTasks } from "./seed-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDataDir() {
  const configured = process.env.RELAYHUB_CONTROL_PLANE_DATA_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.resolve(__dirname, "..", "data");
}

function resolveDataPath() {
  return path.join(resolveDataDir(), "state.json");
}

function clone(value) {
  return structuredClone(value);
}

function createInitialState() {
  return {
    modelEntries: clone(seedModelEntries),
    tasks: clone(seedTasks),
    runs: clone(seedRuns),
    nextIds: {
      model: 1,
      task: 1,
      run: 1
    }
  };
}

function migrateMissingPresetModelEntries(state) {
  const existingEntries = Array.isArray(state.modelEntries) ? state.modelEntries : [];
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  const missingPresetEntries = seedModelEntries
    .filter((entry) => entry.source === "preset" && !existingIds.has(entry.id))
    .map((entry) => clone(entry));

  if (missingPresetEntries.length === 0) {
    return {
      changed: false,
      state
    };
  }

  return {
    changed: true,
    state: {
      ...state,
      modelEntries: [...existingEntries, ...missingPresetEntries]
    }
  };
}

export async function readState() {
  const dataPath = resolveDataPath();
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    const persisted = JSON.parse(raw);
    const migrated = migrateMissingPresetModelEntries(persisted);
    if (migrated.changed) {
      await writeState(migrated.state);
    }
    return migrated.state;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      const initial = createInitialState();
      await writeState(initial);
      return initial;
    }
    throw error;
  }
}

export async function writeState(state) {
  const dataDir = resolveDataDir();
  const dataPath = resolveDataPath();
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(state, null, 2), "utf8");
}

export function toPublicModelEntry(entry) {
  const { apiKey, ...rest } = entry;
  return rest;
}

export async function resetState() {
  const initial = createInitialState();
  await writeState(initial);
  return initial;
}
