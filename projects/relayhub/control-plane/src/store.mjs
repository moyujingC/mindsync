import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedEntryBindings, seedEntries, seedModelEntries, seedRuns, seedTasks } from "./seed-data.mjs";

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

function resolveSecretsPath() {
  return path.join(resolveDataDir(), "model-secrets.json");
}

function clone(value) {
  return structuredClone(value);
}

function createInitialState() {
  return {
    modelEntries: clone(seedModelEntries),
    entries: clone(seedEntries),
    entryBindings: clone(seedEntryBindings),
    tasks: clone(seedTasks),
    runs: clone(seedRuns),
    nextIds: {
      model: 1,
      task: 1,
      run: 1
    }
  };
}

function createInitialSecrets() {
  return {
    "preset-ppchat-relay": {
      apiKey: "seed-api-key",
      updatedAt: null
    }
  };
}

function defaultCapabilities() {
  return {
    responses: {
      ok: false,
      streamOk: false
    },
    chatCompletions: {
      ok: false
    },
    lastProbedAt: null,
    lastErrorMessage: null
  };
}

function normalizeReasoningEffort(value) {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function migrateMissingPresetModelEntries(state) {
  const existingEntries = Array.isArray(state.modelEntries) ? state.modelEntries : [];
  let changed = false;
  const normalizedExistingEntries = existingEntries.map((entry) => {
    const rawApiKey = typeof entry?.apiKey === "string" && entry.apiKey.trim()
      ? entry.apiKey.trim()
      : null;
    const nextEntry = {
      ...entry,
      capabilities: entry && typeof entry === "object" && entry.capabilities
        ? entry.capabilities
        : defaultCapabilities(),
      reasoningEffort: normalizeReasoningEffort(entry?.reasoningEffort),
      hasStoredApiKey: entry?.hasStoredApiKey ?? Boolean(rawApiKey),
      maskedApiKey: entry?.maskedApiKey ?? null
    };
    delete nextEntry.apiKey;
    if (
      nextEntry.capabilities !== entry?.capabilities ||
      nextEntry.reasoningEffort !== (entry?.reasoningEffort ?? null) ||
      nextEntry.hasStoredApiKey !== (entry?.hasStoredApiKey ?? Boolean(rawApiKey)) ||
      "apiKey" in (entry ?? {})
    ) {
      changed = true;
    }
    return nextEntry;
  });
  const existingIds = new Set(normalizedExistingEntries.map((entry) => entry.id));
  const missingPresetEntries = seedModelEntries
    .filter((entry) => entry.source === "preset" && !existingIds.has(entry.id))
    .map((entry) => clone(entry));

  if (missingPresetEntries.length === 0 && !changed) {
    return {
      changed: false,
      state: {
        ...state,
        modelEntries: normalizedExistingEntries
      }
    };
  }

  return {
    changed: true,
    state: {
      ...state,
      entries: Array.isArray(state.entries) ? state.entries : clone(seedEntries),
      entryBindings: Array.isArray(state.entryBindings) ? state.entryBindings : clone(seedEntryBindings),
      modelEntries: [...normalizedExistingEntries, ...missingPresetEntries]
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

export async function readSecrets() {
  const secretsPath = resolveSecretsPath();
  try {
    const raw = await fs.readFile(secretsPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      const initial = createInitialSecrets();
      await writeSecrets(initial);
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

export async function writeSecrets(secrets) {
  const dataDir = resolveDataDir();
  const secretsPath = resolveSecretsPath();
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(secretsPath, JSON.stringify(secrets, null, 2), "utf8");
}

export function toPublicModelEntry(entry) {
  const { apiKey, ...rest } = entry;
  return rest;
}

export async function resetState() {
  const initial = createInitialState();
  await writeState(initial);
  await writeSecrets(createInitialSecrets());
  return initial;
}
