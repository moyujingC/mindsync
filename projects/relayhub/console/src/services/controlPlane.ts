import {
  seedModelEntries,
  seedTaskRunRecords,
  seedTaskTemplates,
} from "../fixtures/controlPlaneData";
import type {
  GovernanceOverview,
  ModelEntry,
  ModelEntryInput,
  ModelEntryStatus,
  TaskModelStat,
  TaskRunRecord,
  TaskRunRecordInput,
  TaskStats,
  TaskTemplate,
  TaskTemplateInput,
} from "../models/controlPlane";

interface InternalModelEntry extends ModelEntry {
  apiKey: string | null;
}

interface ControlPlaneState {
  modelEntries: InternalModelEntry[];
  tasks: TaskTemplate[];
  runs: TaskRunRecord[];
  nextIds: {
    model: number;
    task: number;
    run: number;
  };
}

const MOCK_LATENCY_MS = 90;
const CONTROL_PLANE_BASE_URL = (import.meta.env.RELAYHUB_CONTROL_PLANE_BASE_URL ?? "").trim();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), MOCK_LATENCY_MS);
  });
}

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}...${trimmed.slice(-2)}`;
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

function createInitialState(): ControlPlaneState {
  return {
    modelEntries: seedModelEntries.map((item) => ({
      ...item,
      apiKey: item.hasStoredApiKey ? "seed-api-key" : null,
    })),
    tasks: clone(seedTaskTemplates),
    runs: clone(seedTaskRunRecords),
    nextIds: {
      model: 1,
      task: 1,
      run: 1,
    },
  };
}

let mockState = createInitialState();

function toPublicModelEntry(entry: InternalModelEntry): ModelEntry {
  const { apiKey: _apiKey, ...rest } = entry;
  return rest;
}

function nowStamp(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace(/\//g, "-");
}

function resolveConfiguredStatus(entry: InternalModelEntry): ModelEntryStatus {
  if (!entry.hasStoredApiKey) {
    return entry.source === "preset" ? "preset-unconfigured" : "configured-pending-test";
  }

  if (entry.status === "active") {
    return "active";
  }

  if (entry.status === "disabled") {
    return "disabled";
  }

  return "configured-pending-test";
}

function applyTestOutcome(
  entry: InternalModelEntry,
  outcome: {
    result: ModelEntry["lastTestResult"];
    code: ModelEntry["lastTestCode"];
    message: string;
    status: ModelEntryStatus;
    statusNote: string;
  },
) {
  entry.lastTestResult = outcome.result;
  entry.lastTestCode = outcome.code;
  entry.lastTestMessage = outcome.message;
  entry.status = outcome.status;
  entry.statusNote = outcome.statusNote;
}

function activeModelEntries(): ModelEntry[] {
  return mockState.modelEntries
    .filter((item) => item.status === "active")
    .map(toPublicModelEntry);
}

function withTaskModelName(task: TaskTemplate): TaskTemplate {
  const model = mockState.modelEntries.find((item) => item.id === task.defaultModelEntryId) ?? null;
  return {
    ...task,
    defaultModelEntryName: model?.name ?? null,
  };
}

function summarizeBestModel(modelStats: TaskModelStat[]): string {
  if (modelStats.length === 0) {
    return "当前还没有可比较的任务运行记录。";
  }

  const winner = [...modelStats].sort((left, right) => {
    if (right.excellent !== left.excellent) {
      return right.excellent - left.excellent;
    }

    if (right.usable !== left.usable) {
      return right.usable - left.usable;
    }

    return left.failed - right.failed;
  })[0]!;

  return `${winner.modelEntryName} 当前样本最好，共 ${winner.runs} 次记录，切换次数 ${winner.switchCount}。`;
}

function calculateTaskStats(taskId: string): TaskStats | null {
  const task = mockState.tasks.find((item) => item.id === taskId);
  if (!task) {
    return null;
  }

  const runs = mockState.runs
    .filter((item) => item.taskId === taskId)
    .sort((left, right) => left.ranAt.localeCompare(right.ranAt));

  const modelStatsMap = new Map<string, TaskModelStat>();
  let previousModelId: string | null = null;

  runs.forEach((run) => {
    const current = modelStatsMap.get(run.modelEntryId) ?? {
      modelEntryId: run.modelEntryId,
      modelEntryName: run.modelEntryName,
      runs: 0,
      excellent: 0,
      usable: 0,
      fair: 0,
      failed: 0,
      switchCount: 0,
      averageCostCny: null,
      averageLatencyMs: null,
      lastUsedAt: null,
    };

    current.runs += 1;
    current.lastUsedAt = run.ranAt;

    if (run.resultGrade === "优秀") {
      current.excellent += 1;
    } else if (run.resultGrade === "可用") {
      current.usable += 1;
    } else if (run.resultGrade === "一般") {
      current.fair += 1;
    } else {
      current.failed += 1;
    }

    if (run.costCny !== null) {
      const previousAverage = current.averageCostCny ?? 0;
      current.averageCostCny = Number(
        ((previousAverage * (current.runs - 1) + run.costCny) / current.runs).toFixed(2),
      );
    }

    if (run.latencyMs !== null) {
      const previousAverage = current.averageLatencyMs ?? 0;
      current.averageLatencyMs = Math.round(
        (previousAverage * (current.runs - 1) + run.latencyMs) / current.runs,
      );
    }

    if (previousModelId && previousModelId !== run.modelEntryId) {
      current.switchCount += 1;
    }

    modelStatsMap.set(run.modelEntryId, current);
    previousModelId = run.modelEntryId;
  });

  const modelStats = [...modelStatsMap.values()].sort((left, right) => right.runs - left.runs);

  return {
    taskId: task.id,
    taskName: task.name,
    totalRuns: runs.length,
    activeModels: modelStats.length,
    bestModelSummary: summarizeBestModel(modelStats),
    modelStats,
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CONTROL_PLANE_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `RelayHub control plane request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function listModelEntriesFromServer(): Promise<ModelEntry[]> {
  return requestJson<ModelEntry[]>("/models");
}

async function saveModelEntryToServer(input: ModelEntryInput): Promise<ModelEntry> {
  if (input.id) {
    return requestJson<ModelEntry>(`/models/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  return requestJson<ModelEntry>("/models", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function deleteModelEntryFromServer(id: string): Promise<void> {
  await requestJson<void>(`/models/${id}`, {
    method: "DELETE",
  });
}

async function testModelEntryConnectionFromServer(id: string): Promise<ModelEntry> {
  return requestJson<ModelEntry>(`/models/${id}/test`, {
    method: "POST",
  });
}

async function listTaskTemplatesFromServer(): Promise<TaskTemplate[]> {
  return requestJson<TaskTemplate[]>("/tasks");
}

async function saveTaskTemplateToServer(input: TaskTemplateInput): Promise<TaskTemplate> {
  if (input.id) {
    return requestJson<TaskTemplate>(`/tasks/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  return requestJson<TaskTemplate>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function deleteTaskTemplateFromServer(id: string): Promise<void> {
  await requestJson<void>(`/tasks/${id}`, {
    method: "DELETE",
  });
}

async function listTaskRunRecordsFromServer(): Promise<TaskRunRecord[]> {
  return requestJson<TaskRunRecord[]>("/runs");
}

async function recordTaskRunToServer(input: TaskRunRecordInput): Promise<TaskRunRecord> {
  return requestJson<TaskRunRecord>("/runs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function getTaskStatsFromServer(taskId: string): Promise<TaskStats | null> {
  return requestJson<TaskStats | null>(`/tasks/${taskId}/stats`);
}

async function getGovernanceOverviewFromServer(): Promise<GovernanceOverview> {
  return requestJson<GovernanceOverview>("/overview");
}

function shouldUseServer() {
  return CONTROL_PLANE_BASE_URL.length > 0;
}

export function resetMockControlPlaneState() {
  mockState = createInitialState();
}

export async function listModelEntries(): Promise<ModelEntry[]> {
  if (shouldUseServer()) {
    return listModelEntriesFromServer();
  }

  return delay(mockState.modelEntries.map(toPublicModelEntry));
}

export async function saveModelEntry(input: ModelEntryInput): Promise<ModelEntry> {
  if (shouldUseServer()) {
    return saveModelEntryToServer(input);
  }

  if (input.id) {
    const current = mockState.modelEntries.find((item) => item.id === input.id);
    if (!current) {
      throw new Error("没有找到要更新的模型条目。");
    }

    current.name = input.name.trim();
    current.providerLabel = input.providerLabel.trim();
    if (current.source !== "preset") {
      current.kind = input.kind;
      current.baseUrl = input.baseUrl.trim();
      current.modelId = input.modelId.trim();
    }
    current.purchaseUrl = input.purchaseUrl?.trim() || null;
    if (input.apiKey && input.apiKey.trim().length > 0) {
      current.apiKey = input.apiKey.trim();
      current.hasStoredApiKey = true;
      current.maskedApiKey = maskApiKey(input.apiKey);
    }
    current.status = resolveConfiguredStatus(current);
    current.statusNote = current.hasStoredApiKey
      ? "配置已保存，请手动测试连接后再绑定任务。"
      : "已保存基础配置，补 API Key 后可测试连接。";
    current.lastTestResult = "idle";
    current.lastTestCode = "not-tested";
    current.lastTestMessage = current.hasStoredApiKey
      ? "配置刚更新，请重新测试连接确认是否可用。"
      : "还缺 API Key，暂时无法开始测试连接。";

    return delay(toPublicModelEntry(current));
  }

  const nextId = `custom-model-${mockState.nextIds.model++}`;
  const apiKey = input.apiKey?.trim() ?? "";
  const created: InternalModelEntry = {
    id: nextId,
    name: input.name.trim(),
    providerLabel: input.providerLabel.trim(),
    kind: input.kind,
    source: "custom",
    baseUrl: input.baseUrl.trim(),
    modelId: input.modelId.trim(),
    catalogFamily: "openai-compatible",
    purchaseUrl: input.purchaseUrl?.trim() || null,
    status: apiKey ? "configured-pending-test" : "configured-pending-test",
    statusNote: apiKey
      ? "自定义模型已保存，请手动测试连接。"
      : "自定义模型已保存，补 API Key 后可测试连接。",
    hasStoredApiKey: apiKey.length > 0,
    maskedApiKey: apiKey.length > 0 ? maskApiKey(apiKey) : null,
    lastTestedAt: null,
    lastTestResult: "idle",
    lastTestCode: "not-tested",
    lastTestMessage: "还未开始测试连接。",
    presetPriority: null,
    recommendedTaskCategories: [],
    recommendedTaskIds: [],
    selectionReason: null,
    activationHint: null,
    costTier: null,
    capabilityTags: [],
    tags: ["自定义"],
    apiKey: apiKey || null,
  };
  mockState.modelEntries.unshift(created);
  return delay(toPublicModelEntry(created));
}

export async function deleteModelEntry(id: string): Promise<void> {
  if (shouldUseServer()) {
    return deleteModelEntryFromServer(id);
  }

  const entry = mockState.modelEntries.find((item) => item.id === id);
  if (!entry) {
    throw new Error("没有找到要删除的模型条目。");
  }

  if (entry.source === "preset") {
    entry.status = "disabled";
    entry.statusNote = "该预置条目已停用，可随时重新配置并测试连接。";
  } else {
    mockState.modelEntries = mockState.modelEntries.filter((item) => item.id !== id);
  }

  mockState.tasks = mockState.tasks.map((task) =>
    task.defaultModelEntryId === id
      ? { ...task, defaultModelEntryId: null, defaultModelEntryName: null }
      : task,
  );

  return delay(undefined);
}

export async function testModelEntryConnection(id: string): Promise<ModelEntry> {
  if (shouldUseServer()) {
    return testModelEntryConnectionFromServer(id);
  }

  const entry = mockState.modelEntries.find((item) => item.id === id);
  if (!entry) {
    throw new Error("没有找到要测试的模型条目。");
  }

  entry.lastTestedAt = nowStamp();

  if (!entry.hasStoredApiKey || !entry.apiKey) {
    applyTestOutcome(entry, {
      result: "missing-api-key",
      code: "missing_api_key",
      message: "缺少 API Key，先补密钥再重新测试连接。",
      status: "test-failed",
      statusNote: "测试失败：还缺 API Key。下一步先补密钥。",
    });
    return delay(toPublicModelEntry(entry));
  }

  if (!entry.baseUrl.startsWith("http")) {
    applyTestOutcome(entry, {
      result: "invalid-base-url",
      code: "invalid_base_url",
      message: "Base URL 不合法，需以 http:// 或 https:// 开头。",
      status: "test-failed",
      statusNote: "测试失败：Base URL 格式不对。下一步先修正地址。",
    });
    return delay(toPublicModelEntry(entry));
  }

  if (entry.baseUrl.includes("fail")) {
    applyTestOutcome(entry, {
      result: "upstream-unreachable",
      code: "upstream_unreachable",
      message: "已发起测试连接，但当前上游不可达或返回异常，请稍后重试。",
      status: "test-failed",
      statusNote: "测试失败：上游暂时不可达。下一步检查地址或稍后重试。",
    });
    return delay(toPublicModelEntry(entry));
  }

  applyTestOutcome(entry, {
    result: "success",
    code: "success",
    message: "测试连接通过，这个模型现在可以绑定到任务。",
    status: "active",
    statusNote: "连接测试通过，可以绑定到任务默认模型。",
  });
  return delay(toPublicModelEntry(entry));
}

export async function listTaskTemplates(): Promise<TaskTemplate[]> {
  if (shouldUseServer()) {
    return listTaskTemplatesFromServer();
  }

  return delay(mockState.tasks.map(withTaskModelName));
}

export async function saveTaskTemplate(input: TaskTemplateInput): Promise<TaskTemplate> {
  if (shouldUseServer()) {
    return saveTaskTemplateToServer(input);
  }

  if (input.id) {
    const current = mockState.tasks.find((item) => item.id === input.id);
    if (!current) {
      throw new Error("没有找到要更新的任务。");
    }

    current.name = input.name.trim();
    current.category = input.category;
    current.description = input.description.trim();
    current.defaultModelEntryId = input.defaultModelEntryId;
    current.switchNote = input.switchNote.trim();
    return delay(withTaskModelName(current));
  }

  const nextId = `custom-task-${mockState.nextIds.task++}`;
  const created: TaskTemplate = withTaskModelName({
    id: nextId,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    builtIn: false,
    defaultModelEntryId: input.defaultModelEntryId,
    defaultModelEntryName: null,
    switchNote: input.switchNote.trim(),
  });
  mockState.tasks.unshift(created);
  return delay(created);
}

export async function deleteTaskTemplate(id: string): Promise<void> {
  if (shouldUseServer()) {
    return deleteTaskTemplateFromServer(id);
  }

  const task = mockState.tasks.find((item) => item.id === id);
  if (!task) {
    throw new Error("没有找到要删除的任务。");
  }

  if (task.builtIn) {
    throw new Error("系统内置任务不能直接删除。");
  }

  mockState.tasks = mockState.tasks.filter((item) => item.id !== id);
  mockState.runs = mockState.runs.filter((item) => item.taskId !== id);
  return delay(undefined);
}

export async function listTaskRunRecords(): Promise<TaskRunRecord[]> {
  if (shouldUseServer()) {
    return listTaskRunRecordsFromServer();
  }

  return delay([...mockState.runs].sort((left, right) => right.ranAt.localeCompare(left.ranAt)));
}

export async function recordTaskRun(input: TaskRunRecordInput): Promise<TaskRunRecord> {
  if (shouldUseServer()) {
    return recordTaskRunToServer(input);
  }

  const task = mockState.tasks.find((item) => item.id === input.taskId);
  if (!task) {
    throw new Error("没有找到对应任务。");
  }

  const model = mockState.modelEntries.find((item) => item.id === input.modelEntryId);
  if (!model) {
    throw new Error("没有找到对应模型。");
  }

  const created: TaskRunRecord = {
    id: `custom-run-${mockState.nextIds.run++}`,
    taskId: task.id,
    taskName: task.name,
    modelEntryId: model.id,
    modelEntryName: model.name,
    ranAt: nowStamp(),
    summary: input.summary.trim(),
    resultGrade: input.resultGrade,
    costCny: input.costCny ?? null,
    latencyMs: input.latencyMs ?? null,
    note: input.note?.trim() ?? "",
  };

  mockState.runs.unshift(created);
  return delay(created);
}

export async function getTaskStats(taskId: string): Promise<TaskStats | null> {
  if (shouldUseServer()) {
    return getTaskStatsFromServer(taskId);
  }

  return delay(calculateTaskStats(taskId));
}

export async function getGovernanceOverview(): Promise<GovernanceOverview> {
  if (shouldUseServer()) {
    return getGovernanceOverviewFromServer();
  }

  const entries = mockState.modelEntries.map(toPublicModelEntry);
  const tasks = mockState.tasks.map(withTaskModelName);
  const pending = entries.filter((item) => item.status === "configured-pending-test").length;
  const active = entries.filter((item) => item.status === "active").length;
  const boundTasks = tasks.filter((item) => item.defaultModelEntryId !== null).length;
  const highlights: string[] = [];

  if (pending > 0) {
    highlights.push(`当前有 ${pending} 个模型已配置但尚未完成测试连接。`);
  }

  if (tasks.some((item) => item.defaultModelEntryId === null)) {
    highlights.push("仍有任务没有绑定默认模型，首次使用前需要补齐。");
  }

  if (mockState.runs.length > 0) {
    highlights.push("运行记录已经开始积累，可以用来做第一轮模型选择判断。");
  }

  return delay({
    totalEntries: entries.length,
    activeEntries: active,
    configuredPendingTest: pending,
    tasksBound: boundTasks,
    totalTasks: tasks.length,
    recentRunsCount: mockState.runs.length,
    highlights,
    recentRuns: [...mockState.runs].sort((left, right) => right.ranAt.localeCompare(left.ranAt)).slice(0, 5),
  });
}

export async function listActiveModelEntries(): Promise<ModelEntry[]> {
  if (shouldUseServer()) {
    const entries = await listModelEntriesFromServer();
    return entries.filter((item) => item.status === "active");
  }

  return delay(activeModelEntries());
}
