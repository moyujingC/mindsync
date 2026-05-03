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

function resolveRelayConfigPath() {
  return path.join(resolveDataDir(), "relay-config.json");
}

async function writeJsonAtomically(targetPath, value) {
  const directory = path.dirname(targetPath);
  const tempPath = path.join(
    directory,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
  );
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tempPath, targetPath);
}

function clone(value) {
  return structuredClone(value);
}

function createInitialState() {
  return {
    modelEntries: clone(seedModelEntries),
    entries: clone(seedEntries),
    entryBindings: clone(seedEntryBindings),
    entryActivity: {},
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

function createInitialRelayConfig() {
  return {
    relayToken: null,
    updatedAt: null
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

function normalizeEntryBinding(binding) {
  return {
    ...binding,
    reasoningEffortOverride: normalizeReasoningEffort(binding?.reasoningEffortOverride)
  };
}

function normalizeEntryActivity(activity) {
  if (!activity || typeof activity !== "object" || Array.isArray(activity)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(activity).map(([entryId, value]) => {
      const record = value && typeof value === "object" ? value : {};
      return [
        entryId,
        {
          lastSuccessfulRequestAt:
            typeof record.lastSuccessfulRequestAt === "string" && record.lastSuccessfulRequestAt.trim()
              ? record.lastSuccessfulRequestAt.trim()
              : null,
          lastSuccessfulRequestId:
            typeof record.lastSuccessfulRequestId === "string" && record.lastSuccessfulRequestId.trim()
              ? record.lastSuccessfulRequestId.trim()
              : null,
          lastSuccessfulRoute:
            typeof record.lastSuccessfulRoute === "string" && record.lastSuccessfulRoute.trim()
              ? record.lastSuccessfulRoute.trim()
              : null,
          lastSuccessfulModelEntryId:
            typeof record.lastSuccessfulModelEntryId === "string" && record.lastSuccessfulModelEntryId.trim()
              ? record.lastSuccessfulModelEntryId.trim()
              : null
        }
      ];
    })
  );
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
      entryBindings: Array.isArray(state.entryBindings)
        ? state.entryBindings.map((binding) => normalizeEntryBinding(binding))
        : clone(seedEntryBindings).map((binding) => normalizeEntryBinding(binding)),
      entryActivity: normalizeEntryActivity(state.entryActivity),
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
    const normalizedState = {
      ...migrated.state,
      entryActivity: normalizeEntryActivity(migrated.state.entryActivity)
    };
    const needsRewrite =
      migrated.changed ||
      JSON.stringify(normalizedState.entryActivity) !== JSON.stringify(migrated.state.entryActivity ?? {});
    if (needsRewrite) {
      await writeState(normalizedState);
    }
    return normalizedState;
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

export async function readRelayConfig() {
  const relayConfigPath = resolveRelayConfigPath();
  try {
    const raw = await fs.readFile(relayConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      relayToken:
        parsed && typeof parsed.relayToken === "string" && parsed.relayToken.trim()
          ? parsed.relayToken.trim()
          : null,
      updatedAt:
        parsed && typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt.trim()
          : null
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      const initial = createInitialRelayConfig();
      await writeRelayConfig(initial);
      return initial;
    }
    throw error;
  }
}

export async function writeState(state) {
  const dataPath = resolveDataPath();
  await writeJsonAtomically(dataPath, state);
}

export async function writeSecrets(secrets) {
  const secretsPath = resolveSecretsPath();
  await writeJsonAtomically(secretsPath, secrets);
}

export async function writeRelayConfig(config) {
  const relayConfigPath = resolveRelayConfigPath();
  await writeJsonAtomically(relayConfigPath, config);
}

export async function recordEntrySuccessfulUsage({
  entryId,
  requestId,
  route,
  modelEntryId,
  at,
}) {
  const state = await readState();
  state.entryActivity = {
    ...(state.entryActivity && typeof state.entryActivity === "object" ? state.entryActivity : {}),
    [entryId]: {
      lastSuccessfulRequestAt: at,
      lastSuccessfulRequestId: requestId,
      lastSuccessfulRoute: route,
      lastSuccessfulModelEntryId: modelEntryId,
    },
  };
  await writeState(state);
}

export function toPublicModelEntry(entry) {
  const { apiKey, ...rest } = entry;
  return rest;
}

export async function resetState() {
  const initial = createInitialState();
  await writeState(initial);
  await writeSecrets(createInitialSecrets());
  await writeRelayConfig(createInitialRelayConfig());
  return initial;
}
