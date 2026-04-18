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

export async function readState() {
  const dataPath = resolveDataPath();
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return JSON.parse(raw);
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
