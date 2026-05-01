export type ModelEntryKind = "coding-plan" | "domestic-model" | "relay-api";
export type ModelEntrySource = "preset" | "custom";
export type PresetPriority = "recommended-first" | "recommended" | "optional";
export type CostTier = "高" | "中" | "低";
export type ReasoningEffort = "low" | "medium" | "high";
export type ModelEntryStatus =
  | "preset-unconfigured"
  | "configured-pending-test"
  | "active"
  | "test-failed"
  | "disabled";
export type ModelEntryTestResult =
  | "idle"
  | "success"
  | "missing-api-key"
  | "invalid-base-url"
  | "upstream-unreachable"
  | "responses-unavailable"
  | "responses-stream-unavailable";
export type ModelEntryTestCode =
  | "not-tested"
  | "success"
  | "missing_api_key"
  | "invalid_base_url"
  | "upstream_unreachable"
  | "responses_unavailable"
  | "responses_stream_unavailable";
export type EntryClientFamily = "claude" | "codex" | "paperclip";
export type EntryAdapterType = "claude_local" | "codex_local" | "pi_local" | "hermes_local" | null;
export type EntryHostType = "mac" | "server" | "external-observe";
export type EntryProtocolFamily =
  | "anthropic-messages"
  | "openai-responses"
  | "openai-chat-completions"
  | "observe-only";
export type TaskCategory = "通用工具" | "业务任务";
export type RunResultGrade = "优秀" | "可用" | "一般" | "失败";

export interface ModelEntryCapabilities {
  responses: {
    ok: boolean;
    streamOk: boolean;
  };
  chatCompletions: {
    ok: boolean;
  };
  lastProbedAt: string | null;
  lastErrorMessage: string | null;
}

export interface ModelEntry {
  id: string;
  name: string;
  providerLabel: string;
  kind: ModelEntryKind;
  source: ModelEntrySource;
  baseUrl: string;
  modelId: string;
  reasoningEffort: ReasoningEffort | null;
  catalogFamily: "openai-compatible";
  purchaseUrl: string | null;
  status: ModelEntryStatus;
  statusNote: string;
  hasStoredApiKey: boolean;
  maskedApiKey: string | null;
  lastTestedAt: string | null;
  lastTestResult: ModelEntryTestResult;
  lastTestCode: ModelEntryTestCode;
  lastTestMessage: string;
  capabilities: ModelEntryCapabilities;
  presetPriority: PresetPriority | null;
  recommendedTaskCategories: TaskCategory[];
  recommendedTaskIds: string[];
  selectionReason: string | null;
  activationHint: string | null;
  costTier: CostTier | null;
  capabilityTags: string[];
  tags: string[];
}

export interface ModelEntryInput {
  id?: string;
  name: string;
  providerLabel: string;
  kind: ModelEntryKind;
  source?: ModelEntrySource;
  baseUrl: string;
  modelId: string;
  reasoningEffort: ReasoningEffort | null;
  purchaseUrl?: string | null;
  apiKey?: string;
}

export interface ModelCatalogItem {
  id: string;
  label: string;
  supportedEndpointTypes?: string[];
}

export interface ModelCatalogResponse {
  items: ModelCatalogItem[];
  fetchedAt: string;
}

export interface RelayEntry {
  id: string;
  name: string;
  clientFamily: EntryClientFamily;
  adapterType: EntryAdapterType;
  hostType: EntryHostType;
  protocolFamily: EntryProtocolFamily;
  controllable: boolean;
  description: string;
  alias: string | null;
  notes: string[];
}

export interface EntryBinding {
  entryId: string;
  defaultModelEntryId: string | null;
  defaultModelEntryName: string | null;
  fallbackModelEntryId: string | null;
  fallbackModelEntryName: string | null;
  statusNote: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  builtIn: boolean;
  defaultModelEntryId: string | null;
  defaultModelEntryName: string | null;
  switchNote: string;
}

export interface TaskTemplateInput {
  id?: string;
  name: string;
  category: TaskCategory;
  description: string;
  defaultModelEntryId: string | null;
  switchNote: string;
}

export interface TaskRunRecord {
  id: string;
  taskId: string;
  taskName: string;
  modelEntryId: string;
  modelEntryName: string;
  ranAt: string;
  summary: string;
  resultGrade: RunResultGrade;
  costCny: number | null;
  latencyMs: number | null;
  note: string;
}

export interface TaskRunRecordInput {
  taskId: string;
  modelEntryId: string;
  summary: string;
  resultGrade: RunResultGrade;
  costCny?: number | null;
  latencyMs?: number | null;
  note?: string;
}

export interface TaskModelStat {
  modelEntryId: string;
  modelEntryName: string;
  runs: number;
  excellent: number;
  usable: number;
  fair: number;
  failed: number;
  switchCount: number;
  averageCostCny: number | null;
  averageLatencyMs: number | null;
  lastUsedAt: string | null;
}

export interface TaskStats {
  taskId: string;
  taskName: string;
  totalRuns: number;
  activeModels: number;
  bestModelSummary: string;
  modelStats: TaskModelStat[];
}

export interface GovernanceOverview {
  totalEntries: number;
  activeEntries: number;
  configuredPendingTest: number;
  tasksBound: number;
  totalTasks: number;
  recentRunsCount: number;
  highlights: string[];
  recentRuns: TaskRunRecord[];
}
