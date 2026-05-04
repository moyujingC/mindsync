import { useEffect, useMemo, useState } from "react";

import {
  getInterpretationReportDebug,
  getKnowledgeBuildSummary,
  previewKnowledgeFixture,
} from "../shared/api";
import type { ApiDebugTraceEntry } from "../shared/api/debugTrace";
import type {
  DetectCirclesResponse,
  InterpretationVersion,
  KnowledgeBuildSummaryResponse,
  KnowledgeFixturePreviewResponse,
  MandalaFlowState,
  ReportDebugProfileResponse,
} from "../shared/types";
import type {
  DebugTimelineEntry,
  MobileWebRuntimeDebugSnapshot,
} from "./debug-observer";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";

export type DebugWorkbenchTabId =
  | "layer0-first"
  | "pipeline"
  | "knowledge"
  | "report-trace"
  | "samples";

export const DEBUG_WORKBENCH_TABS: Array<{
  id: DebugWorkbenchTabId;
  label: string;
  description: string;
}> = [
  { id: "layer0-first", label: "Layer0 首层", description: "只看 input_package 与 visual_analysis_basis" },
  { id: "pipeline", label: "Pipeline", description: "链路时间线、任务回放、API traces、runtime snapshot" },
  { id: "knowledge", label: "Knowledge", description: "build summary、Layer0 evidence、source refs、字段到知识映射" },
  { id: "report-trace", label: "Report Trace", description: "field -> knowledge -> prompt snippet -> final field" },
  { id: "samples", label: "Samples", description: "固定 fixtures 回归摘要与 current / candidate diff" },
];

const PLACEHOLDER_INTERPRETATION_IDS = new Set(["", "demo-interpretation-id"]);

interface BrowserDebugPanelProps {
  route: MobileWebRouteId;
  previewMode: boolean;
  draft: MobileWebUploadDraft;
  interpretationId: string;
  userId: string;
  flowState: MandalaFlowState | null;
  detection: DetectCirclesResponse | null;
  detectError: string | null;
  detecting: boolean;
  runtimeSnapshot: MobileWebRuntimeDebugSnapshot | null;
  apiTraces: ApiDebugTraceEntry[];
  timelineEntries: DebugTimelineEntry[];
  onClearApiTraces: () => void;
  initialTab?: DebugWorkbenchTabId;
  preloadedReportDebugProfile?: ReportDebugProfileResponse | null;
  preloadedCurrentBuildSummary?: KnowledgeBuildSummaryResponse | null;
  preloadedCandidateBuildSummary?: KnowledgeBuildSummaryResponse | null;
  preloadedSamplePreview?: KnowledgeFixturePreviewResponse | null;
  preloadedCandidateBuildId?: string | null;
  disableWorkbenchFetch?: boolean;
}

interface StageDescriptor {
  key: string;
  label: string;
  description: string;
  state: "idle" | "running" | "done" | "error";
  detail: string;
}

interface FixtureComparisonRow {
  fixtureId: string;
  theme: string;
  currentVersion?: string | null;
  candidateVersion?: string | null;
  currentFallbackUsed?: boolean;
  candidateFallbackUsed?: boolean;
  currentWarningHitCount?: number;
  candidateWarningHitCount?: number;
  currentRegressionFlags: string[];
  candidateRegressionFlags: string[];
}

function formatClock(iso: string | undefined): string {
  if (!iso) {
    return "--";
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleTimeString("zh-CN", { hour12: false });
}

function formatJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function formatUnknownText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "--";
  }
  return formatJson(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toArrayRecords(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function getPromptFieldRecord(
  promptDebug: Record<string, unknown> | null,
  fieldKey: string | null,
): Record<string, unknown> | null {
  if (!promptDebug || !fieldKey || !Array.isArray(promptDebug.schema_fields)) {
    return null;
  }
  for (const item of promptDebug.schema_fields as unknown[]) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const field = item as Record<string, unknown>;
    const name = formatUnknownText(field.name);
    const mapped = formatUnknownText(field.mapped_final_field);
    if (includesNormalized(name, fieldKey) || includesNormalized(mapped, fieldKey)) {
      return field;
    }
  }
  return null;
}

function buildPromptMatchKeywords(
  fieldRecord: Record<string, unknown> | null,
  fieldKey: string | null,
): string[] {
  const keywords = new Set<string>();
  if (fieldKey) {
    keywords.add(fieldKey);
  }
  if (fieldRecord) {
    for (const candidate of [
      fieldRecord.name,
      fieldRecord.semantic_role,
      fieldRecord.mapped_final_field,
    ]) {
      if (typeof candidate === "string" && candidate.trim()) {
        candidate
          .split(/[/,]/)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => keywords.add(part));
      }
    }
  }
  return Array.from(keywords);
}

function getPromptRelevantLines(
  promptText: string,
  keywords: string[],
): Array<{ line: string; highlighted: boolean }> {
  const lines = promptText.split("\n");
  const matchedIndexes = new Set<number>();
  lines.forEach((line, index) => {
    if (keywords.some((keyword) => keyword && includesNormalized(line, keyword))) {
      for (let cursor = Math.max(0, index - 1); cursor <= Math.min(lines.length - 1, index + 1); cursor += 1) {
        matchedIndexes.add(cursor);
      }
    }
  });
  if (matchedIndexes.size === 0) {
    return lines.slice(0, 16).map((line) => ({ line, highlighted: false }));
  }
  return Array.from(matchedIndexes)
    .sort((a, b) => a - b)
    .map((index) => ({
      line: lines[index],
      highlighted: keywords.some((keyword) => keyword && includesNormalized(lines[index], keyword)),
    }));
}

function findLatestTrace(
  traces: ApiDebugTraceEntry[],
  matcher: (trace: ApiDebugTraceEntry) => boolean,
): ApiDebugTraceEntry | undefined {
  return traces.find(matcher);
}

function renderSimpleValue(value: unknown): string {
  if (typeof value === "string") {
    return value || "--";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => renderSimpleValue(item)).join(" / ") : "--";
  }
  if (value && typeof value === "object") {
    return formatJson(value);
  }
  return "--";
}

function createStageDescriptors(input: {
  previewMode: boolean;
  draft: MobileWebUploadDraft;
  flowState: MandalaFlowState | null;
  detection: DetectCirclesResponse | null;
  detectError: string | null;
  detecting: boolean;
  runtimeSnapshot: MobileWebRuntimeDebugSnapshot | null;
  traces: ApiDebugTraceEntry[];
}): StageDescriptor[] {
  const {
    previewMode,
    draft,
    flowState,
    detection,
    detectError,
    detecting,
    runtimeSnapshot,
    traces,
  } = input;
  const activeFlowState = previewMode ? flowState : runtimeSnapshot?.flowState ?? null;
  const activeDetection = previewMode ? detection : runtimeSnapshot?.detection ?? null;
  const activeDetectError = previewMode ? detectError : runtimeSnapshot?.uploadDetectError ?? null;
  const activeDetecting = previewMode ? detecting : runtimeSnapshot?.uploadDetecting ?? false;
  const reportVariant = draft.reportVariant ?? draft.reportType ?? "lite";
  const detectTrace = findLatestTrace(traces, (trace) => trace.url.includes("/detect-circles"));
  const createTrace = findLatestTrace(
    traces,
    (trace) =>
      trace.url.includes("/interpretations") &&
      !trace.url.includes("/status") &&
      !trace.url.includes("/report"),
  );
  const statusTrace = findLatestTrace(traces, (trace) => trace.url.includes("/status"));
  const liteReportTrace = findLatestTrace(
    traces,
    (trace) => trace.url.includes("/report") && !trace.url.includes("version=pro"),
  );
  const proReportTrace = findLatestTrace(
    traces,
    (trace) => trace.url.includes("/report") && trace.url.includes("version=pro"),
  );

  return [
    {
      key: "detect",
      label: "1. 三圈人工确认",
      description: "manual circle boundaries",
      state: activeDetectError
        ? "error"
        : activeDetecting || detectTrace?.phase === "pending"
          ? "running"
          : activeDetection
            ? "done"
            : "idle",
      detail: activeDetection
        ? `inner=${activeDetection.inner_radius} middle=${activeDetection.middle_radius} confidence=${activeDetection.confidence}`
        : activeDetectError ?? (detectTrace ? `${detectTrace.phase} · ${detectTrace.durationMs ?? 0}ms` : "等待触发"),
    },
    {
      key: "create",
      label: "2. 创建解读",
      description: "createInterpretation",
      state: activeFlowState?.interpretation
        ? "done"
        : createTrace?.phase === "success"
          ? "done"
          : createTrace?.phase === "error"
            ? "error"
            : createTrace
              ? "running"
              : "idle",
      detail: activeFlowState?.interpretation
        ? `${activeFlowState.interpretation.interpretation_id} · ${activeFlowState.interpretation.generation_stage}`
        : createTrace?.errorMessage ?? "等待 create",
    },
    {
      key: "status",
      label: "3. 生成状态",
      description: "status polling",
      state: activeFlowState?.step === "error"
        ? "error"
        : activeFlowState?.status?.report_ready
          ? "done"
          : activeFlowState?.status
            ? "running"
            : statusTrace?.phase === "error"
              ? "error"
              : statusTrace
                ? "running"
                : "idle",
      detail: activeFlowState?.status
        ? `${activeFlowState.status.generation_stage} · ${activeFlowState.status.generation_progress}%`
        : statusTrace?.errorMessage ?? "等待 status",
    },
    {
      key: "lite-report",
      label: "4. Lite 报告",
      description: "report(version=lite/default)",
      state:
        activeFlowState?.report?.version === "lite"
          ? "done"
          : liteReportTrace?.phase === "error"
            ? "error"
            : activeFlowState?.step === "liteGenerating"
              ? "running"
              : liteReportTrace
                ? "running"
                : "idle",
      detail:
        activeFlowState?.report?.version === "lite"
          ? `${activeFlowState.report.title ?? "Lite 报告已返回"}`
          : liteReportTrace?.errorMessage ?? "等待 Lite report",
    },
    {
      key: "pro-report",
      label: "5. Pro 报告",
      description: "report(version=pro)",
      state:
        reportVariant !== "pro"
          ? "idle"
          : activeFlowState?.report?.version === "pro"
            ? "done"
            : proReportTrace?.phase === "error"
              ? "error"
              : proReportTrace
                ? "running"
                : "idle",
      detail:
        reportVariant !== "pro"
          ? "当前未选择 Pro 链路"
          : activeFlowState?.report?.version === "pro"
            ? `${activeFlowState.report.title ?? "Pro 报告已返回"}`
            : proReportTrace?.errorMessage ?? "等待 Pro report",
    },
  ];
}

function groupSessions(entries: DebugTimelineEntry[]) {
  const groups = new Map<
    string,
    { sessionId: string; entries: DebugTimelineEntry[]; latest: DebugTimelineEntry }
  >();
  for (const entry of entries) {
    const existing = groups.get(entry.sessionId);
    if (existing) {
      existing.entries.push(entry);
      if (new Date(entry.createdAt).getTime() > new Date(existing.latest.createdAt).getTime()) {
        existing.latest = entry;
      }
      continue;
    }
    groups.set(entry.sessionId, {
      sessionId: entry.sessionId,
      entries: [entry],
      latest: entry,
    });
  }
  return Array.from(groups.values()).map((group) => ({
    ...group,
    entries: [...group.entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  }));
}

function getFieldEntries(profile: ReportDebugProfileResponse | null) {
  const lite = toArrayRecords(profile?.field_provenance ? toRecord(profile.field_provenance).lite : null).map((item) => ({
    version: "lite" as InterpretationVersion,
    field: String(item.field ?? ""),
    record: item,
  }));
  const pro = toArrayRecords(profile?.field_provenance ? toRecord(profile.field_provenance).pro : null).map((item) => ({
    version: "pro" as InterpretationVersion,
    field: String(item.field ?? ""),
    record: item,
  }));
  return [...lite, ...pro].filter((item) => item.field);
}

function getBuildSummaryFixtures(summary: KnowledgeBuildSummaryResponse | null) {
  return toArrayRecords(summary?.eval_summary ? toRecord(summary.eval_summary).fixtures : null);
}

function mergeFixtureRows(
  currentSummary: KnowledgeBuildSummaryResponse | null,
  candidateSummary: KnowledgeBuildSummaryResponse | null,
): FixtureComparisonRow[] {
  const currentFixtures = getBuildSummaryFixtures(currentSummary);
  const candidateFixtures = getBuildSummaryFixtures(candidateSummary);
  const rows = new Map<string, FixtureComparisonRow>();

  for (const item of currentFixtures) {
    const id = String(item.fixture_id ?? "");
    if (!id) {
      continue;
    }
    rows.set(id, {
      fixtureId: id,
      theme: String(item.theme ?? ""),
      currentVersion: String(item.version ?? ""),
      currentFallbackUsed: Boolean(item.fallback_used),
      currentWarningHitCount: Number(item.warning_hit_count ?? 0),
      currentRegressionFlags: Array.isArray(item.regression_flags)
        ? (item.regression_flags as string[])
        : [],
      candidateRegressionFlags: [],
    });
  }

  for (const item of candidateFixtures) {
    const id = String(item.fixture_id ?? "");
    if (!id) {
      continue;
    }
    const existing = rows.get(id);
    const nextRow: FixtureComparisonRow = existing ?? {
      fixtureId: id,
      theme: String(item.theme ?? ""),
      currentRegressionFlags: [],
      candidateRegressionFlags: [],
    };
    nextRow.theme = nextRow.theme || String(item.theme ?? "");
    nextRow.candidateVersion = String(item.version ?? "");
    nextRow.candidateFallbackUsed = Boolean(item.fallback_used);
    nextRow.candidateWarningHitCount = Number(item.warning_hit_count ?? 0);
    nextRow.candidateRegressionFlags = Array.isArray(item.regression_flags)
      ? (item.regression_flags as string[])
      : [];
    rows.set(id, nextRow);
  }

  return Array.from(rows.values()).sort((a, b) => a.fixtureId.localeCompare(b.fixtureId, "zh-CN"));
}

function getFixturePreviewVersion(row: FixtureComparisonRow): InterpretationVersion {
  const version = row.candidateVersion ?? row.currentVersion ?? "lite";
  return version === "pro" ? "pro" : "lite";
}

export function BrowserDebugPanel({
  route,
  previewMode,
  draft,
  interpretationId,
  userId: _userId,
  flowState,
  detection,
  detectError,
  detecting,
  runtimeSnapshot,
  apiTraces,
  timelineEntries,
  onClearApiTraces,
  initialTab = "layer0-first",
  preloadedReportDebugProfile = null,
  preloadedCurrentBuildSummary = null,
  preloadedCandidateBuildSummary = null,
  preloadedSamplePreview = null,
  preloadedCandidateBuildId = null,
  disableWorkbenchFetch = false,
}: BrowserDebugPanelProps) {
  const activeFlowState = previewMode ? flowState : runtimeSnapshot?.flowState ?? null;
  const activeInterpretationId =
    activeFlowState?.interpretation?.interpretation_id ?? interpretationId;
  const canFetchReportDebug =
    !previewMode &&
    !disableWorkbenchFetch &&
    Boolean(activeInterpretationId) &&
    !PLACEHOLDER_INTERPRETATION_IDS.has(activeInterpretationId);
  const stages = createStageDescriptors({
    previewMode,
    draft,
    flowState,
    detection,
    detectError,
    detecting,
    runtimeSnapshot,
    traces: apiTraces,
  });
  const sessionGroups = useMemo(() => groupSessions(timelineEntries), [timelineEntries]);

  const [activeTab, setActiveTab] = useState<DebugWorkbenchTabId>(initialTab);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessionGroups[0]?.sessionId ?? null,
  );
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(
    sessionGroups[0]?.entries[0]?.id ?? null,
  );
  const [reportDebugProfile, setReportDebugProfile] =
    useState<ReportDebugProfileResponse | null>(preloadedReportDebugProfile);
  const [reportDebugLoading, setReportDebugLoading] = useState(false);
  const [reportDebugError, setReportDebugError] = useState<string | null>(null);
  const [currentBuildSummary, setCurrentBuildSummary] =
    useState<KnowledgeBuildSummaryResponse | null>(preloadedCurrentBuildSummary);
  const [candidateBuildSummary, setCandidateBuildSummary] =
    useState<KnowledgeBuildSummaryResponse | null>(preloadedCandidateBuildSummary);
  const [candidateBuildIdInput, setCandidateBuildIdInput] =
    useState(preloadedCandidateBuildId ?? "");
  const [buildSummaryLoading, setBuildSummaryLoading] = useState(false);
  const [candidateBuildLoading, setCandidateBuildLoading] = useState(false);
  const [buildSummaryError, setBuildSummaryError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [samplePreview, setSamplePreview] =
    useState<KnowledgeFixturePreviewResponse | null>(preloadedSamplePreview);
  const [sampleLoadingId, setSampleLoadingId] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const activeSessionEntries = useMemo(
    () => sessionGroups.find((group) => group.sessionId === selectedSessionId)?.entries ?? [],
    [selectedSessionId, sessionGroups],
  );
  const selectedTimelineEntry = useMemo(
    () =>
      activeSessionEntries.find((entry) => entry.id === selectedTimelineId) ??
      activeSessionEntries[0] ??
      null,
    [activeSessionEntries, selectedTimelineId],
  );

  const knowledgeDebug = useMemo(
    () => toRecord(reportDebugProfile?.knowledge_debug),
    [reportDebugProfile],
  );
  const layer0Evidence = useMemo(
    () => toRecord(knowledgeDebug.layer0_evidence),
    [knowledgeDebug],
  );
  const inputPackage = useMemo(() => {
    const canonical = toRecord(knowledgeDebug.input_package);
    if (Object.keys(canonical).length) {
      return canonical;
    }
    const layer0Value = toRecord(layer0Evidence.input_package);
    if (Object.keys(layer0Value).length) {
      return layer0Value;
    }
    return toRecord(knowledgeDebug.review_input_package);
  }, [knowledgeDebug, layer0Evidence]);
  const visualAnalysisBasis = useMemo(() => {
    const canonical = toRecord(knowledgeDebug.visual_analysis_basis);
    if (Object.keys(canonical).length) {
      return canonical;
    }
    return toRecord(layer0Evidence.visual_analysis_basis);
  }, [knowledgeDebug, layer0Evidence]);
  const modelTrace = useMemo(
    () => toRecord(knowledgeDebug.model_trace),
    [knowledgeDebug],
  );
  const visionTrace = useMemo(
    () => toRecord(modelTrace.vision),
    [modelTrace],
  );
  const layer0Passed = useMemo(() => {
    const explicit = layer0Evidence.layer0_passed;
    if (typeof explicit === "boolean") {
      return explicit;
    }
    return true;
  }, [layer0Evidence]);
  const layer0FailureReason = useMemo(
    () => renderSimpleValue(layer0Evidence.layer0_failure_reason || visionTrace.failure_reason),
    [layer0Evidence, visionTrace],
  );
  const layer0Summary = useMemo(
    () => toRecord(knowledgeDebug.review_layer0_summary),
    [knowledgeDebug],
  );
  const circleCards = useMemo(() => {
    const circles = toRecord(visualAnalysisBasis.circles);
    return ["inner", "middle", "outer"].map((key) => ({
      key,
      label: key === "inner" ? "内圈" : key === "middle" ? "中圈" : "外圈",
      value: toRecord(circles[key]),
    }));
  }, [visualAnalysisBasis]);
  const directJudgment = useMemo(
    () => toRecord(visualAnalysisBasis.direct_judgment_hits),
    [visualAnalysisBasis],
  );
  const directJudgmentCatalog = useMemo(
    () => toArrayRecords(directJudgment.catalog_items),
    [directJudgment],
  );
  const directJudgmentHits = useMemo(
    () => toArrayRecords(directJudgment.hits),
    [directJudgment],
  );
  const crossCircleRelations = useMemo(
    () => toArrayRecords(visualAnalysisBasis.cross_circle_relations),
    [visualAnalysisBasis],
  );
  const knowledgeFieldMap = useMemo(
    () => toRecord(knowledgeDebug.field_to_knowledge_map),
    [knowledgeDebug],
  );
  const sourceRefs = useMemo(
    () => toArrayRecords(knowledgeDebug.source_refs),
    [knowledgeDebug],
  );
  const fieldEntries = useMemo(
    () => getFieldEntries(reportDebugProfile),
    [reportDebugProfile],
  );
  const diagnostics = useMemo(
    () => toRecord(reportDebugProfile?.diagnostics),
    [reportDebugProfile],
  );
  const insightContextSummary = useMemo(
    () => toRecord(reportDebugProfile?.insight_context_summary),
    [reportDebugProfile],
  );
  const evidenceSummary = useMemo(
    () => toRecord(reportDebugProfile?.evidence_summary),
    [reportDebugProfile],
  );
  const fallbackSummary = useMemo(
    () => toRecord(reportDebugProfile?.fallback_summary),
    [reportDebugProfile],
  );
  const topicContextTrace = useMemo(
    () => toRecord(knowledgeDebug.topic_context_trace),
    [knowledgeDebug],
  );
  const productBlockDebug = useMemo(
    () => toRecord(knowledgeDebug.product_block_debug),
    [knowledgeDebug],
  );
  const internalCompatibility = useMemo(
    () => toRecord(knowledgeDebug.internal_compatibility),
    [knowledgeDebug],
  );
  const fieldList = useMemo(() => {
    const keys = new Set<string>([
      ...fieldEntries.map((item) => item.field),
      ...Object.keys(knowledgeFieldMap),
    ]);
    return Array.from(keys).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [fieldEntries, knowledgeFieldMap]);
  const selectedFieldEntry = useMemo(
    () => fieldEntries.find((item) => item.field === selectedField) ?? null,
    [fieldEntries, selectedField],
  );
  const selectedFieldMapping = useMemo(
    () => toRecord(selectedField ? knowledgeFieldMap[selectedField] : null),
    [knowledgeFieldMap, selectedField],
  );
  const selectedSourceRefs = useMemo(() => {
    const sourcePaths = new Set(
      Array.isArray(selectedFieldMapping.source_paths)
        ? (selectedFieldMapping.source_paths as string[])
        : [],
    );
    return sourceRefs.filter((item) => sourcePaths.has(String(item.source_path ?? "")));
  }, [selectedFieldMapping, sourceRefs]);
  const activePromptDebug = useMemo(() => {
    const promptDebug = toRecord(reportDebugProfile?.prompt_debug);
    if (selectedFieldEntry?.version === "pro") {
      return toRecord(promptDebug.pro);
    }
    return toRecord(promptDebug.lite);
  }, [reportDebugProfile, selectedFieldEntry]);
  const selectedPromptField = useMemo(
    () => getPromptFieldRecord(activePromptDebug, selectedField),
    [activePromptDebug, selectedField],
  );
  const selectedPromptKeywords = useMemo(
    () => buildPromptMatchKeywords(selectedPromptField, selectedField),
    [selectedPromptField, selectedField],
  );
  const selectedPromptLines = useMemo(() => {
    const promptText = typeof activePromptDebug.prompt_preview === "string"
      ? activePromptDebug.prompt_preview
      : "";
    return getPromptRelevantLines(promptText, selectedPromptKeywords);
  }, [activePromptDebug, selectedPromptKeywords]);
  const mergedFixtureRows = useMemo(
    () => mergeFixtureRows(currentBuildSummary, candidateBuildSummary),
    [currentBuildSummary, candidateBuildSummary],
  );
  const candidateBuildSelector = useMemo(() => {
    const raw = String(toRecord(candidateBuildSummary?.build_info).build_selector ?? "").trim();
    if (raw) {
      return raw;
    }
    const buildId = candidateBuildIdInput.trim();
    return buildId ? `candidate:${buildId}` : null;
  }, [candidateBuildIdInput, candidateBuildSummary]);

  useEffect(() => {
    if (!sessionGroups.length) {
      setSelectedSessionId(null);
      setSelectedTimelineId(null);
      return;
    }
    setSelectedSessionId((current) => current ?? sessionGroups[0].sessionId);
    setSelectedTimelineId((current) => current ?? sessionGroups[0].entries[0]?.id ?? null);
  }, [sessionGroups]);

  useEffect(() => {
    if (!fieldList.length) {
      setSelectedField(null);
      return;
    }
    setSelectedField((current) => (current && fieldList.includes(current) ? current : fieldList[0]));
  }, [fieldList]);

  useEffect(() => {
    if (!mergedFixtureRows.length) {
      setSelectedSampleId(null);
      return;
    }
    setSelectedSampleId((current) =>
      current && mergedFixtureRows.some((row) => row.fixtureId === current)
        ? current
        : mergedFixtureRows[0].fixtureId,
    );
  }, [mergedFixtureRows]);

  useEffect(() => {
    if (!canFetchReportDebug) {
      return;
    }
    let cancelled = false;
    setReportDebugLoading(true);
    setReportDebugError(null);
    void getInterpretationReportDebug(activeInterpretationId)
      .then((profile) => {
        if (!cancelled) {
          setReportDebugProfile(profile);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setReportDebugProfile(null);
          setReportDebugError(error instanceof Error ? error.message : "拉取 report-debug 失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReportDebugLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeInterpretationId, canFetchReportDebug]);

  useEffect(() => {
    if (disableWorkbenchFetch || currentBuildSummary) {
      return;
    }
    let cancelled = false;
    setBuildSummaryLoading(true);
    setBuildSummaryError(null);
    void getKnowledgeBuildSummary("current")
      .then((summary) => {
        if (!cancelled) {
          setCurrentBuildSummary(summary);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setBuildSummaryError(error instanceof Error ? error.message : "拉取 current build summary 失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBuildSummaryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentBuildSummary, disableWorkbenchFetch]);

  async function handleLoadCandidateBuild() {
    if (disableWorkbenchFetch || !candidateBuildIdInput.trim()) {
      return;
    }
    setCandidateBuildLoading(true);
    setBuildSummaryError(null);
    try {
      const summary = await getKnowledgeBuildSummary(`candidate:${candidateBuildIdInput.trim()}`);
      setCandidateBuildSummary(summary);
    } catch (error) {
      setCandidateBuildSummary(null);
      setBuildSummaryError(error instanceof Error ? error.message : "载入 candidate build 失败");
    } finally {
      setCandidateBuildLoading(false);
    }
  }

  async function handlePreviewFixture(row: FixtureComparisonRow) {
    if (disableWorkbenchFetch) {
      setSelectedSampleId(row.fixtureId);
      return;
    }
    const buildSelector = candidateBuildSelector ?? "current";
    setSelectedSampleId(row.fixtureId);
    setSampleLoadingId(row.fixtureId);
    setSampleError(null);
    try {
      const preview = await previewKnowledgeFixture({
        fixture_id: row.fixtureId,
        build_selector: buildSelector,
        version: getFixturePreviewVersion(row),
      });
      setSamplePreview(preview);
    } catch (error) {
      setSamplePreview(null);
      setSampleError(error instanceof Error ? error.message : "拉取 fixture preview 失败");
    } finally {
      setSampleLoadingId(null);
    }
  }

  useEffect(() => {
    if (disableWorkbenchFetch || !selectedSampleId || samplePreview) {
      return;
    }
    const row = mergedFixtureRows.find((item) => item.fixtureId === selectedSampleId);
    if (!row) {
      return;
    }
    void handlePreviewFixture(row);
  }, [disableWorkbenchFetch, mergedFixtureRows, samplePreview, selectedSampleId]);

  return (
    <aside className="browser-shell__panel browser-shell__panel--side browser-shell__panel--observer">
      <div className="browser-shell__panel-header">
        <h2>本地知识工作台</h2>
        <p className="muted">右侧只服务本地调试：看链路、看知识、看字段追踪、看固定样本回放。</p>
      </div>

      <section className="browser-debug-section">
        <div className="browser-debug-metrics">
          <div className="browser-debug-chip">
            <strong>模式</strong>
            <span>{previewMode ? "preview" : "runtime"}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>路由</strong>
            <span>{route}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>解读</strong>
            <span>{activeInterpretationId || "--"}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>当前主题</strong>
            <span>{draft.theme || "--"}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>Insight</strong>
            <span>{String(toRecord(evidenceSummary.agent).name ?? "--")}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>Fallback</strong>
            <span>{fallbackSummary.used ? "used" : "clean"}</span>
          </div>
        </div>
        <div className="browser-debug-tabs" role="tablist" aria-label="Knowledge Workbench Tabs">
          {DEBUG_WORKBENCH_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`browser-debug-tab${activeTab === tab.id ? " browser-debug-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <strong>{tab.label}</strong>
              <span>{tab.description}</span>
            </button>
          ))}
        </div>
      </section>

      {activeTab === "layer0-first" ? (
        <>
          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>首层数据质量审阅</h3>
              <span>{reportDebugLoading ? "loading" : "ready"}</span>
            </div>
            {reportDebugError ? <p className="mw-inline-error">{reportDebugError}</p> : null}
            <p className="muted">
              当前只展示这次解读的输入包和客观视觉转述。知识命中、规则推导、报告映射先不放在这个审阅入口里。
            </p>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>input_package</h3>
              <span>输入包</span>
            </div>
            <div className="browser-debug-kv">
              <div>
                <span>image_ref</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.image).image_ref)}</strong>
              </div>
              <div>
                <span>topic</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.topic_input).topic)}</strong>
              </div>
              <div>
                <span>topic_label</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.topic_input).topic_label)}</strong>
              </div>
              <div>
                <span>circle source</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.circle_config).source)}</strong>
              </div>
              <div>
                <span>inner_radius</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.circle_config).inner_radius)}</strong>
              </div>
              <div>
                <span>middle_radius</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.circle_config).middle_radius)}</strong>
              </div>
              <div>
                <span>painting_intention</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.user_context).painting_intention)}</strong>
              </div>
              <div>
                <span>painting_feeling</span>
                <strong>{renderSimpleValue(toRecord(inputPackage.user_context).painting_feeling)}</strong>
              </div>
            </div>
            <details className="browser-debug-json">
              <summary>raw input_package</summary>
              <pre>{formatJson(inputPackage)}</pre>
            </details>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>visual_analysis_basis</h3>
              <span>客观视觉转述</span>
            </div>
            <div className="browser-debug-kv">
              <div>
                <span>Layer0 status</span>
                <strong>{layer0Passed ? "pass" : "fail"}</strong>
              </div>
              <div>
                <span>vision endpoint</span>
                <strong>{renderSimpleValue(visionTrace.endpoint_id)}</strong>
              </div>
              <div>
                <span>vision model</span>
                <strong>{renderSimpleValue(visionTrace.resolved_model)}</strong>
              </div>
              <div>
                <span>vision source</span>
                <strong>{renderSimpleValue(visionTrace.source)}</strong>
              </div>
              <div>
                <span>failure reason</span>
                <strong>{layer0FailureReason}</strong>
              </div>
            </div>
            <div className="browser-debug-grid">
              <article className="browser-debug-card">
                <h4>global_visual_summary</h4>
                <p>{renderSimpleValue(visualAnalysisBasis.global_visual_summary)}</p>
              </article>
              <article className="browser-debug-card">
                <h4>首层摘要</h4>
                <p>{renderSimpleValue(layer0Summary.visual_fact_summary)}</p>
                <p>{renderSimpleValue(layer0Summary.per_circle_observation_summary)}</p>
              </article>
              <article className="browser-debug-card">
                <h4>llm_color_observation</h4>
                <p>{renderSimpleValue(toRecord(visualAnalysisBasis.llm_color_observation).summary)}</p>
              </article>
              <article className="browser-debug-card">
                <h4>program_color_measurement</h4>
                <p>{renderSimpleValue(toRecord(visualAnalysisBasis.program_color_measurement).summary)}</p>
              </article>
            </div>

            <div className="browser-debug-section__header">
              <h3>direct_judgment_hits</h3>
              <span>{renderSimpleValue(directJudgment.catalog_version)}</span>
            </div>
            <div className="browser-debug-grid">
              <article className="browser-debug-card">
                <h4>命中结果</h4>
                {directJudgmentHits.length === 0 ? (
                  <p className="muted">暂无直断结果。</p>
                ) : (
                  directJudgmentHits.map((item) => (
                    <div key={String(item.judgment_id ?? Math.random())}>
                      <strong>{renderSimpleValue(item.judgment_label)}</strong>
                      <p>{renderSimpleValue(item.matched ? "matched" : "not matched")} · {renderSimpleValue(item.confidence)}</p>
                      <p>{renderSimpleValue(item.evidence_excerpt)}</p>
                    </div>
                  ))
                )}
              </article>
              <article className="browser-debug-card">
                <h4>catalog</h4>
                {directJudgmentCatalog.length === 0 ? (
                  <p className="muted">暂无 catalog。</p>
                ) : (
                  directJudgmentCatalog.map((item) => (
                    <div key={String(item.judgment_id ?? Math.random())}>
                      <strong>{renderSimpleValue(item.judgment_id)}</strong>
                      <p>{renderSimpleValue(item.judgment_label)}</p>
                    </div>
                  ))
                )}
              </article>
            </div>

            <div className="browser-debug-section__header">
              <h3>circle_band_metrics</h3>
              <span>圈带厚度</span>
            </div>
            <div className="browser-debug-kv">
              {["inner", "middle", "outer"].map((key) => {
                const metric = toRecord(toRecord(visualAnalysisBasis.circle_band_metrics)[key]);
                return (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{renderSimpleValue(metric.band_ratio)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="browser-debug-section__header">
              <h3>三圈观察</h3>
              <span>圈摘要 + 显著块</span>
            </div>
            <div className="browser-debug-grid">
              {circleCards.map(({ key, label, value }) => {
                const palette = toRecord(value.palette);
                const colorStats = toRecord(value.color_stats);
                const composition = toRecord(value.composition);
                const brushwork = toRecord(value.brushwork);
                const blocks = toArrayRecords(value.blocks);
                return (
                  <article key={key} className="browser-debug-card">
                    <h4>{label}</h4>
                    <p>{renderSimpleValue(value.observation_summary)}</p>
                    <div className="browser-debug-kv">
                      <div>
                        <span>canonical colors</span>
                        <strong>{renderSimpleValue(toStringArray(palette.canonical_color_labels))}</strong>
                      </div>
                      <div>
                        <span>depth_state</span>
                        <strong>{renderSimpleValue(colorStats.depth_state)}</strong>
                      </div>
                      <div>
                        <span>distribution</span>
                        <strong>{renderSimpleValue(colorStats.distribution)}</strong>
                      </div>
                      <div>
                        <span>whitespace_state</span>
                        <strong>{renderSimpleValue(composition.whitespace_state)}</strong>
                      </div>
                      <div>
                        <span>brushwork</span>
                        <strong>{renderSimpleValue(brushwork.stroke_quality)}</strong>
                      </div>
                      <div>
                        <span>blocks</span>
                        <strong>{String(blocks.length)}</strong>
                      </div>
                    </div>
                    {blocks.length ? (
                      <details className="browser-debug-json">
                        <summary>{label} 显著块 blocks</summary>
                        <pre>{formatJson(blocks)}</pre>
                      </details>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="browser-debug-section__header">
              <h3>cross_circle_relations</h3>
              <span>跨圈关系</span>
            </div>
            <div className="browser-debug-grid">
              {crossCircleRelations.length === 0 ? (
                <article className="browser-debug-card">
                  <p className="muted">暂无跨圈关系。</p>
                </article>
              ) : (
                crossCircleRelations.map((item, index) => (
                  <article key={`${String(item.from_circle)}-${String(item.to_circle)}-${index}`} className="browser-debug-card">
                    <h4>{renderSimpleValue(item.relation_type)}</h4>
                    <p>{renderSimpleValue(item.description)}</p>
                  </article>
                ))
              )}
            </div>

            <div className="browser-debug-section__header">
              <h3>prompt_meta</h3>
              <span>追溯</span>
            </div>
            <div className="browser-debug-kv">
              <div>
                <span>prompt_version</span>
                <strong>{renderSimpleValue(toRecord(visualAnalysisBasis.prompt_meta).prompt_version)}</strong>
              </div>
              <div>
                <span>analysis_scope</span>
                <strong>{renderSimpleValue(toRecord(visualAnalysisBasis.prompt_meta).analysis_scope)}</strong>
              </div>
            </div>

            <details className="browser-debug-json">
              <summary>raw visual_analysis_basis</summary>
              <pre>{formatJson(visualAnalysisBasis)}</pre>
            </details>
          </section>
        </>
      ) : null}

      {activeTab === "pipeline" ? (
        <>
          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>链路时间线</h3>
              <span>{stages.filter((item) => item.state === "done").length}/{stages.length}</span>
            </div>
            <div className="browser-debug-stage-list">
              {stages.map((stage) => (
                <article key={stage.key} className={`browser-debug-stage browser-debug-stage--${stage.state}`}>
                  <div className="browser-debug-stage__head">
                    <strong>{stage.label}</strong>
                    <span>{stage.description}</span>
                  </div>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>任务回放</h3>
              <span>{sessionGroups.length} 组</span>
            </div>
            <div className="browser-debug-session-list">
              {sessionGroups.length === 0 ? (
                <p className="muted">还没有 timeline entry，先触发一次链路。</p>
              ) : (
                sessionGroups.map((group) => (
                  <button
                    key={group.sessionId}
                    type="button"
                    className={`browser-debug-session-item${selectedSessionId === group.sessionId ? " browser-debug-session-item--active" : ""}`}
                    onClick={() => {
                      setSelectedSessionId(group.sessionId);
                      setSelectedTimelineId(group.entries[0]?.id ?? null);
                    }}
                  >
                    <strong>{group.latest.title}</strong>
                    <span>{group.latest.subtitle}</span>
                    <small>{group.entries.length} 步 · {formatClock(group.latest.createdAt)}</small>
                  </button>
                ))
              )}
            </div>
            {activeSessionEntries.length > 0 ? (
              <>
                <div className="browser-debug-timeline-list">
                  {activeSessionEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`browser-debug-timeline-item${selectedTimelineId === entry.id ? " browser-debug-timeline-item--active" : ""}`}
                      onClick={() => setSelectedTimelineId(entry.id)}
                    >
                      <strong>{entry.title}</strong>
                      <span>{entry.subtitle}</span>
                      <time>{formatClock(entry.createdAt)}</time>
                    </button>
                  ))}
                </div>
                <div className="browser-debug-json">
                  <summary>选中快照</summary>
                  <pre>{formatJson(selectedTimelineEntry?.snapshot ?? null)}</pre>
                </div>
              </>
            ) : null}
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>API Traces</h3>
              <button type="button" className="browser-debug-link" onClick={onClearApiTraces}>
                清空 traces
              </button>
            </div>
            <div className="browser-debug-request-list">
              {apiTraces.length === 0 ? (
                <p className="muted">暂无 API trace。</p>
              ) : (
                apiTraces.map((trace) => (
                  <details
                    key={trace.id}
                    className={`browser-debug-request browser-debug-request--${trace.phase}`}
                  >
                    <summary>
                      <div>
                        <strong>{trace.method} {trace.url}</strong>
                        <span>{trace.phase} · {trace.durationMs ?? 0}ms</span>
                      </div>
                    </summary>
                    <pre>{formatJson(trace)}</pre>
                  </details>
                ))
              )}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Runtime Snapshot</h3>
              <span>{runtimeSnapshot ? "ready" : "empty"}</span>
            </div>
            <div className="browser-debug-json">
              <pre>{formatJson(runtimeSnapshot)}</pre>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "knowledge" ? (
        <>
          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Build Summary</h3>
              <span>{buildSummaryLoading || candidateBuildLoading ? "loading" : "ready"}</span>
            </div>
            <div className="browser-debug-inline-form">
              <input
                className="browser-debug-input"
                value={candidateBuildIdInput}
                onChange={(event) => setCandidateBuildIdInput(event.target.value)}
                placeholder="candidate build id，例如 20260412-001"
              />
              <button
                type="button"
                className="browser-debug-mini-button"
                onClick={() => void handleLoadCandidateBuild()}
                disabled={candidateBuildLoading || !candidateBuildIdInput.trim()}
              >
                {candidateBuildLoading ? "载入中..." : "载入 Candidate"}
              </button>
            </div>
            {buildSummaryError ? <p className="mw-inline-error">{buildSummaryError}</p> : null}
            <div className="browser-debug-grid">
              {[currentBuildSummary, candidateBuildSummary].filter(Boolean).map((summary, index) => {
                const buildInfo = toRecord((summary as KnowledgeBuildSummaryResponse).build_info);
                const quality = toRecord((summary as KnowledgeBuildSummaryResponse).quality);
                const qualitySummary = toRecord(quality.summary);
                return (
                  <article key={String(buildInfo.build_selector ?? index)} className="browser-debug-card">
                    <h4>{String(buildInfo.build_selector ?? `build-${index + 1}`)}</h4>
                    <div className="browser-debug-kv">
                      <div><strong>pack</strong><span>{String(buildInfo.pack_id ?? "--")}</span></div>
                      <div><strong>build_id</strong><span>{String(buildInfo.build_id ?? "--")}</span></div>
                      <div><strong>generated_at</strong><span>{String(buildInfo.generated_at ?? "--")}</span></div>
                      <div><strong>themes</strong><span>{String(qualitySummary.theme_count ?? "--")}</span></div>
                      <div><strong>fallback hotspots</strong><span>{String(qualitySummary.fallback_hotspot_count ?? "--")}</span></div>
                      <div><strong>warning paths</strong><span>{String(qualitySummary.high_risk_warning_count ?? "--")}</span></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Quality Signals</h3>
              <span>fallback / warning / coverage</span>
            </div>
            <div className="browser-debug-grid">
              {[currentBuildSummary, candidateBuildSummary].filter(Boolean).map((summary, index) => {
                const quality = toRecord((summary as KnowledgeBuildSummaryResponse).quality);
                const hotspots = toArrayRecords(quality.fallback_hotspots);
                const warnings = toArrayRecords(quality.high_risk_warning_paths);
                return (
                  <article key={`quality-${index}`} className="browser-debug-card">
                    <h4>{String(toRecord((summary as KnowledgeBuildSummaryResponse).build_info).build_selector ?? `build-${index + 1}`)}</h4>
                    <strong className="browser-debug-subtitle">Fallback Hotspots</strong>
                    <pre>{formatJson(hotspots.slice(0, 8))}</pre>
                    <strong className="browser-debug-subtitle">High Risk Warning Paths</strong>
                    <pre>{formatJson(warnings.slice(0, 8))}</pre>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Insight Context</h3>
              <span>{reportDebugLoading ? "loading" : "ready"}</span>
            </div>
            {reportDebugError ? <p className="mw-inline-error">{reportDebugError}</p> : null}
            <div className="browser-debug-grid">
              <article className="browser-debug-card">
                <h4>Context Summary</h4>
                <pre>{formatJson(insightContextSummary)}</pre>
              </article>
              <article className="browser-debug-card">
                <h4>Evidence Summary</h4>
                <pre>{formatJson(evidenceSummary)}</pre>
              </article>
              <article className="browser-debug-card">
                <h4>Fallback Summary</h4>
                <pre>{formatJson(fallbackSummary)}</pre>
              </article>
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Topic Context Trace</h3>
              <span>{String(topicContextTrace.knowledge_route ?? "unknown")}</span>
            </div>
            <div className="browser-debug-json">
              <pre>{formatJson(topicContextTrace)}</pre>
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Layer0 Evidence</h3>
              <span>{reportDebugLoading ? "loading" : "ready"}</span>
            </div>
            {reportDebugError ? <p className="mw-inline-error">{reportDebugError}</p> : null}
            <div className="browser-debug-grid">
              {[
                { label: "input_package", value: layer0Evidence.input_package },
                { label: "visual_analysis_basis", value: layer0Evidence.visual_analysis_basis },
                { label: "visual_facts", value: layer0Evidence.visual_facts },
                { label: "knowledge_hits", value: layer0Evidence.knowledge_hits },
                { label: "rule_evaluations", value: layer0Evidence.rule_evaluations },
                { label: "theme_projection", value: layer0Evidence.theme_projection },
                { label: "fallback_summary", value: layer0Evidence.fallback_summary },
              ].map(({ label, value }) => (
                <article key={label} className="browser-debug-card">
                  <h4>{label}</h4>
                  <pre>{formatJson(value)}</pre>
                </article>
              ))}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Field To Knowledge</h3>
              <span>{fieldList.length} fields</span>
            </div>
            <div className="browser-debug-field-list">
              {fieldList.map((field) => (
                <button
                  key={field}
                  type="button"
                  className={`browser-debug-field-button${selectedField === field ? " browser-debug-field-button--active" : ""}`}
                  onClick={() => setSelectedField(field)}
                >
                  {field}
                </button>
              ))}
            </div>
            {selectedField ? (
              <div className="browser-debug-grid">
                <article className="browser-debug-card">
                  <h4>{selectedField}</h4>
                  <pre>{formatJson(selectedFieldMapping)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Source Refs</h4>
                  <div className="browser-debug-source-list">
                    {selectedSourceRefs.length === 0 ? (
                      <p className="muted">当前字段还没有 source ref。</p>
                    ) : (
                      selectedSourceRefs.map((ref) => (
                        <div key={`${String(ref.entity_id)}-${String(ref.source_path)}`} className="browser-debug-source-item">
                          <strong>{String(ref.entity_id ?? "--")}</strong>
                          <span>{String(ref.source_path ?? "--")}</span>
                          <small>{String(ref.absolute_path ?? "--")}</small>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {activeTab === "report-trace" ? (
        <>
          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Diagnostics</h3>
              <span>{fieldEntries.length} fields</span>
            </div>
            <div className="browser-debug-kv">
              {Object.entries(toRecord(diagnostics.summary)).slice(0, 8).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}</strong>
                  <span>{formatUnknownText(value)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Field Trace</h3>
              <span>按字段聚焦</span>
            </div>
            <div className="browser-debug-field-list">
              {fieldList.map((field) => (
                <button
                  key={field}
                  type="button"
                  className={`browser-debug-field-button${selectedField === field ? " browser-debug-field-button--active" : ""}`}
                  onClick={() => setSelectedField(field)}
                >
                  {field}
                </button>
              ))}
            </div>
            {selectedField ? (
              <div className="browser-debug-grid">
                <article className="browser-debug-card">
                  <h4>Field Provenance</h4>
                  <pre>{formatJson(selectedFieldEntry?.record ?? null)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Knowledge Mapping</h4>
                  <pre>{formatJson(selectedFieldMapping)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Prompt Schema Match</h4>
                  <pre>{formatJson(selectedPromptField)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Prompt Snippet</h4>
                  <div className="browser-debug-prompt-snippets">
                    {selectedPromptLines.map((item, index) => (
                      <div
                        key={`${selectedField ?? "field"}-${index}`}
                        className={`browser-debug-prompt-line${item.highlighted ? " browser-debug-prompt-line--active" : ""}`}
                      >
                        {item.line || " "}
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : null}
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Product Block Debug</h3>
              <span>final / narrative / evidence / prompt / quality</span>
            </div>
            <div className="browser-debug-grid">
              {Object.entries(productBlockDebug).map(([mode, blocks]) => (
                <article key={mode} className="browser-debug-card">
                  <h4>{mode}</h4>
                  <pre>{formatJson(blocks)}</pre>
                </article>
              ))}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Internal Compatibility</h3>
              <span>{String(internalCompatibility.compatibility_used ?? false)}</span>
            </div>
            <div className="browser-debug-json">
              <pre>{formatJson(internalCompatibility)}</pre>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "samples" ? (
        <>
          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Regression Summary</h3>
              <span>current / candidate</span>
            </div>
            <div className="browser-debug-grid">
              {[currentBuildSummary, candidateBuildSummary].filter(Boolean).map((summary, index) => {
                const evalSummary = toRecord((summary as KnowledgeBuildSummaryResponse).eval_summary);
                const evalMeta = toRecord(evalSummary.summary);
                return (
                  <article key={`eval-${index}`} className="browser-debug-card">
                    <h4>{String(toRecord((summary as KnowledgeBuildSummaryResponse).build_info).build_selector ?? `build-${index + 1}`)}</h4>
                    <div className="browser-debug-kv">
                      <div><strong>fixtures</strong><span>{String(evalMeta.fixture_count ?? "--")}</span></div>
                      <div><strong>fallbacks</strong><span>{String(evalMeta.fixture_fallback_count ?? "--")}</span></div>
                      <div><strong>warnings</strong><span>{String(evalMeta.warning_hit_count ?? "--")}</span></div>
                      <div><strong>structured missing</strong><span>{String(evalMeta.structured_missing_count ?? "--")}</span></div>
                      <div><strong>regression flags</strong><span>{String(evalMeta.regression_flag_count ?? "--")}</span></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Fixture List</h3>
              <span>{mergedFixtureRows.length}</span>
            </div>
            <div className="browser-debug-sample-list">
              {mergedFixtureRows.length === 0 ? (
                <p className="muted">当前还没有 eval summary。build-summary 成功后这里会显示固定样本。</p>
              ) : (
                mergedFixtureRows.map((row) => (
                  <button
                    key={row.fixtureId}
                    type="button"
                    className={`browser-debug-sample-item${selectedSampleId === row.fixtureId ? " browser-debug-sample-item--active" : ""}`}
                    onClick={() => void handlePreviewFixture(row)}
                  >
                    <strong>{row.fixtureId}</strong>
                    <span>{row.theme || "--"}</span>
                    <small>
                      current:{row.currentVersion ?? "--"} / candidate:{row.candidateVersion ?? "--"}
                    </small>
                    <small>
                      fallback {String(row.currentFallbackUsed ?? false)} {" to "} {String(row.candidateFallbackUsed ?? row.currentFallbackUsed ?? false)}
                    </small>
                    <small>
                      warning {row.currentWarningHitCount ?? 0} {" to "} {row.candidateWarningHitCount ?? row.currentWarningHitCount ?? 0}
                    </small>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="browser-debug-section">
            <div className="browser-debug-section__header">
              <h3>Selected Sample</h3>
              <span>{sampleLoadingId ? "loading" : "ready"}</span>
            </div>
            {sampleError ? <p className="mw-inline-error">{sampleError}</p> : null}
            {samplePreview ? (
              <div className="browser-debug-grid">
                <article className="browser-debug-card">
                  <h4>Fixture Meta</h4>
                  <pre>{formatJson(samplePreview.fixture_meta)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Report Summary</h4>
                  <pre>{formatJson(samplePreview.report_summary)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Knowledge Summary</h4>
                  <pre>{formatJson(samplePreview.knowledge_summary.summary ?? samplePreview.knowledge_summary)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Regression Flags</h4>
                  <pre>{formatJson(samplePreview.regression_flags)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Diff From Current</h4>
                  <pre>{formatJson(samplePreview.diff_from_current)}</pre>
                </article>
                <article className="browser-debug-card">
                  <h4>Source Paths</h4>
                  <div className="browser-debug-source-list">
                    {toArrayRecords(toRecord(samplePreview.knowledge_summary).source_refs).map((ref) => (
                      <div key={`${String(ref.entity_id)}-${String(ref.source_path)}`} className="browser-debug-source-item">
                        <strong>{String(ref.entity_id ?? "--")}</strong>
                        <span>{String(ref.source_path ?? "--")}</span>
                        <small>{String(ref.absolute_path ?? "--")}</small>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <p className="muted">选一个 fixture 后，这里会显示 current / candidate 的回归摘要和 diff。</p>
            )}
          </section>
        </>
      ) : null}
    </aside>
  );
}
