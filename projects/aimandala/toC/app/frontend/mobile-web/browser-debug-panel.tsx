import { useEffect, useMemo, useState } from "react";

import { getInterpretationReportDebug } from "../shared/api";
import type { DetectCirclesResponse, MandalaFlowState } from "../shared/types";
import type { ApiDebugTraceEntry } from "../shared/api/debugTrace";
import type { ReportDebugProfileResponse } from "../shared/types";
import type {
  DebugTimelineEntry,
  DebugTimelineSnapshot,
  MobileWebRuntimeDebugSnapshot,
} from "./debug-observer";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";

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
}

interface StageDescriptor {
  key: string;
  label: string;
  description: string;
  state: "idle" | "running" | "done" | "error";
  detail: string;
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

function getLayerRecord(
  profile: ReportDebugProfileResponse | null,
  key: string,
): Record<string, unknown> | null {
  const raw = profile?.layers?.[key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return raw as Record<string, unknown>;
}

function buildLayerComparisonRows(input: {
  draftLayer: Record<string, unknown> | null;
  finalLayer: Record<string, unknown> | null;
  pairs: Array<{ label: string; draftKey: string; finalKey: string }>;
}): Array<{ label: string; draftValue: string; finalValue: string }> {
  const { draftLayer, finalLayer, pairs } = input;

  return pairs.map((pair) => ({
    label: pair.label,
    draftValue: formatUnknownText(draftLayer?.[pair.draftKey]),
    finalValue: formatUnknownText(finalLayer?.[pair.finalKey]),
  }));
}

function getFieldProvenanceList(
  profile: ReportDebugProfileResponse | null,
  key: "lite" | "pro",
): Array<Record<string, unknown>> {
  const raw = profile?.field_provenance?.[key];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function findLatestTrace(
  traces: ApiDebugTraceEntry[],
  matcher: (trace: ApiDebugTraceEntry) => boolean,
): ApiDebugTraceEntry | undefined {
  return traces.find(matcher);
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
      !trace.url.includes("/report") &&
      !trace.url.includes("/upgrade"),
  );
  const statusTrace = findLatestTrace(traces, (trace) => trace.url.includes("/status"));
  const liteReportTrace = findLatestTrace(
    traces,
    (trace) => trace.url.includes("/report") && !trace.url.includes("version=pro"),
  );
  const upgradeTrace = findLatestTrace(traces, (trace) => trace.url.includes("/upgrade"));
  const proReportTrace = findLatestTrace(
    traces,
    (trace) => trace.url.includes("/report") && trace.url.includes("version=pro"),
  );

  return [
    {
      key: "detect",
      label: "1. 三圈识别",
      description: "detect-circles",
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
      key: "upgrade",
      label: "5. Pro 升级入口",
      description: "upgradeInterpretation",
      state:
        reportVariant !== "pro"
          ? "idle"
          : upgradeTrace?.phase === "error"
            ? "error"
            : activeFlowState?.step === "upgradePlaceholder" || upgradeTrace?.phase === "success"
              ? "done"
              : activeFlowState?.step === "liteGenerating"
                ? "running"
                : "idle",
      detail:
        reportVariant !== "pro"
          ? "当前未选择 Pro 链路"
          : activeFlowState?.step === "upgradePlaceholder"
            ? "升级入口已打开"
            : upgradeTrace?.errorMessage ?? "等待 upgrade",
    },
    {
      key: "pro-report",
      label: "6. Pro 报告",
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

function getActiveReportSnapshot(
  previewMode: boolean,
  flowState: MandalaFlowState | null,
  runtimeSnapshot: MobileWebRuntimeDebugSnapshot | null,
): unknown {
  if (previewMode) {
    return flowState?.report ?? null;
  }

  return runtimeSnapshot?.report ?? null;
}

export function BrowserDebugPanel({
  route,
  previewMode,
  draft,
  interpretationId,
  userId,
  flowState,
  detection,
  detectError,
  detecting,
  runtimeSnapshot,
  apiTraces,
  timelineEntries,
  onClearApiTraces,
}: BrowserDebugPanelProps) {
  const activeFlowState = previewMode ? flowState : runtimeSnapshot?.flowState ?? null;
  const activeDetection = previewMode ? detection : runtimeSnapshot?.detection ?? null;
  const activeDetectError = previewMode ? detectError : runtimeSnapshot?.uploadDetectError ?? null;
  const activeDetecting = previewMode ? detecting : runtimeSnapshot?.uploadDetecting ?? false;
  const activeReport = getActiveReportSnapshot(previewMode, flowState, runtimeSnapshot);
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
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const sessionGroups = useMemo(() => {
    const groups = new Map<
      string,
      { sessionId: string; entries: DebugTimelineEntry[]; latest: DebugTimelineEntry }
    >();

    for (const entry of timelineEntries) {
      const current = groups.get(entry.sessionId);
      if (current) {
        current.entries.push(entry);
      } else {
        groups.set(entry.sessionId, {
          sessionId: entry.sessionId,
          entries: [entry],
          latest: entry,
        });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      entries: [...group.entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      latest: group.latest,
    }));
  }, [timelineEntries]);
  const activeSessionId = selectedSessionId ?? sessionGroups[0]?.sessionId ?? null;
  const activeSessionEntries = useMemo(
    () => sessionGroups.find((group) => group.sessionId === activeSessionId)?.entries ?? [],
    [activeSessionId, sessionGroups],
  );
  const selectedTimelineEntry = useMemo(
    () =>
      activeSessionEntries.find((entry) => entry.id === selectedTimelineId) ??
      activeSessionEntries[0] ??
      null,
    [activeSessionEntries, selectedTimelineId],
  );
  const replaySnapshot: DebugTimelineSnapshot | null =
    selectedTimelineEntry?.snapshot ?? null;
  const replayFlowState = replaySnapshot?.flowState ?? activeFlowState;
  const replayReport = replaySnapshot?.report ?? activeReport;
  const activeInterpretationId =
    replayFlowState?.interpretation?.interpretation_id ??
    activeFlowState?.interpretation?.interpretation_id ??
    interpretationId;
  const [reportDebugProfile, setReportDebugProfile] =
    useState<ReportDebugProfileResponse | null>(null);
  const [reportDebugLoading, setReportDebugLoading] = useState(false);
  const [reportDebugError, setReportDebugError] = useState<string | null>(null);
  const liteComparisonRows = useMemo(
    () =>
      buildLayerComparisonRows({
        draftLayer: getLayerRecord(reportDebugProfile, "layer_1_lite_draft"),
        finalLayer: getLayerRecord(reportDebugProfile, "layer_2_lite_final"),
        pairs: [
          { label: "标题", draftKey: "title", finalKey: "title" },
          { label: "整体印象", draftKey: "overall_impression", finalKey: "overall_impression" },
          { label: "画面元素", draftKey: "visual_elements", finalKey: "visual_elements_rendered" },
          { label: "情绪画像", draftKey: "emotion_portrait", finalKey: "emotion_portrait_rendered" },
          { label: "Pro 引导", draftKey: "pro_teaser", finalKey: "pro_teaser" },
        ],
      }),
    [reportDebugProfile],
  );
  const proComparisonRows = useMemo(
    () =>
      buildLayerComparisonRows({
        draftLayer: getLayerRecord(reportDebugProfile, "layer_3_pro_draft"),
        finalLayer: getLayerRecord(reportDebugProfile, "layer_4_pro_final"),
        pairs: [
          { label: "第一眼直觉", draftKey: "first_impression", finalKey: "ai_qa_context" },
          { label: "核心洞察表", draftKey: "core_insight_table", finalKey: "full_report_markdown" },
          { label: "根源分析", draftKey: "root_cause", finalKey: "full_report_markdown" },
          { label: "疗愈建议", draftKey: "healing_suggestions", finalKey: "full_report_markdown" },
        ],
      }),
    [reportDebugProfile],
  );
  const liteProvenance = useMemo(
    () => getFieldProvenanceList(reportDebugProfile, "lite"),
    [reportDebugProfile],
  );
  const proProvenance = useMemo(
    () => getFieldProvenanceList(reportDebugProfile, "pro"),
    [reportDebugProfile],
  );

  useEffect(() => {
    if (!sessionGroups.length) {
      setSelectedSessionId(null);
      setSelectedTimelineId(null);
      setIsReplaying(false);
      return;
    }

    setSelectedSessionId((current) => current ?? sessionGroups[0].sessionId);
  }, [sessionGroups]);

  useEffect(() => {
    if (!activeSessionEntries.length) {
      setSelectedTimelineId(null);
      return;
    }

    setSelectedTimelineId((current) => {
      const exists = activeSessionEntries.some((entry) => entry.id === current);
      return exists ? current : activeSessionEntries[0].id;
    });
  }, [activeSessionEntries]);

  useEffect(() => {
    if (!isReplaying || activeSessionEntries.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSelectedTimelineId((current) => {
        const index = activeSessionEntries.findIndex((entry) => entry.id === current);
        if (index < 0 || index === activeSessionEntries.length - 1) {
          return activeSessionEntries[0].id;
        }
        return activeSessionEntries[index + 1].id;
      });
    }, 1400);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSessionEntries, isReplaying]);

  useEffect(() => {
    if (!activeInterpretationId || previewMode) {
      return;
    }

    let cancelled = false;
    setReportDebugLoading(true);
    setReportDebugError(null);

    void getInterpretationReportDebug(activeInterpretationId)
      .then((profile) => {
        if (cancelled) {
          return;
        }
        setReportDebugProfile(profile);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setReportDebugProfile(null);
        setReportDebugError(error instanceof Error ? error.message : "拉取报告剖面失败");
      })
      .finally(() => {
        if (!cancelled) {
          setReportDebugLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeInterpretationId, previewMode]);

  return (
    <aside className="browser-shell__panel browser-shell__panel--side browser-shell__panel--observer">
      <div className="browser-shell__panel-header">
        <h2>生成观测面板</h2>
        <p className="muted">右侧专门看报告生成过程、接口来回和当前数据快照。</p>
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
            <strong>阶段</strong>
            <span>{activeFlowState?.step ?? "--"}</span>
          </div>
          <div className="browser-debug-chip">
            <strong>报告</strong>
            <span>{draft.reportVariant ?? draft.reportType ?? "lite"}</span>
          </div>
        </div>
      </section>

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
          <h3>任务分组与回放</h3>
          <button
            type="button"
            className="browser-debug-link"
            onClick={() => {
              setIsReplaying((current) => !current);
            }}
            disabled={activeSessionEntries.length <= 1}
          >
            {isReplaying ? "暂停" : "自动回放"}
          </button>
        </div>
        <div className="browser-debug-session-list">
          {sessionGroups.length === 0 ? (
            <p className="muted">还没有任务 session，先触发一次解读。</p>
          ) : (
            sessionGroups.map((group, index) => (
              <button
                key={group.sessionId}
                type="button"
                className={`browser-debug-session-item${activeSessionId === group.sessionId ? " browser-debug-session-item--active" : ""}`}
                onClick={() => {
                  setIsReplaying(false);
                  setSelectedSessionId(group.sessionId);
                  setSelectedTimelineId(group.entries[0]?.id ?? null);
                }}
              >
                <strong>任务 {sessionGroups.length - index}</strong>
                <span>{group.latest.title}</span>
                <small>
                  {group.entries.length} 步 · {formatClock(group.latest.createdAt)} · {group.latest.source}
                </small>
              </button>
            ))
          )}
        </div>
        <div className="browser-debug-replay-toolbar">
          <button
            type="button"
            className="browser-debug-mini-button"
            onClick={() => {
              if (!activeSessionEntries.length) {
                return;
              }
              setIsReplaying(false);
              setSelectedTimelineId((current) => {
                const index = activeSessionEntries.findIndex((entry) => entry.id === current);
                if (index <= 0) {
                  return activeSessionEntries[0].id;
                }
                return activeSessionEntries[index - 1].id;
              });
            }}
            disabled={activeSessionEntries.length === 0}
          >
            上一步
          </button>
          <button
            type="button"
            className="browser-debug-mini-button"
            onClick={() => {
              if (!activeSessionEntries.length) {
                return;
              }
              setIsReplaying(false);
              setSelectedTimelineId((current) => {
                const index = activeSessionEntries.findIndex((entry) => entry.id === current);
                if (index < 0 || index === activeSessionEntries.length - 1) {
                  return activeSessionEntries[activeSessionEntries.length - 1].id;
                }
                return activeSessionEntries[index + 1].id;
              });
            }}
            disabled={activeSessionEntries.length === 0}
          >
            下一步
          </button>
          <span className="muted">
            {selectedTimelineEntry
              ? `${formatClock(selectedTimelineEntry.createdAt)} · ${selectedTimelineEntry.source}`
              : "暂无快照"}
          </span>
        </div>
        <div className="browser-debug-timeline-list">
          {activeSessionEntries.length === 0 ? (
            <p className="muted">还没有可回放事件，先触发一次检测或报告生成。</p>
          ) : (
            activeSessionEntries.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={`browser-debug-timeline-item${selectedTimelineEntry?.id === entry.id ? " browser-debug-timeline-item--active" : ""}`}
                onClick={() => {
                  setIsReplaying(false);
                  setSelectedTimelineId(entry.id);
                }}
              >
                <span>{activeSessionEntries.length - index}</span>
                <div>
                  <strong>{entry.title}</strong>
                  <small>{entry.subtitle}</small>
                </div>
                <time>{formatClock(entry.createdAt)}</time>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="browser-debug-section">
        <div className="browser-debug-section__header">
          <h3>当前数据流</h3>
        </div>
        <div className="browser-debug-kv">
          <div>
            <span>userId</span>
            <strong>{userId}</strong>
          </div>
          <div>
            <span>interpretationId</span>
            <strong>{activeFlowState?.interpretation?.interpretation_id ?? interpretationId}</strong>
          </div>
          <div>
            <span>imagePath</span>
            <strong>{draft.uploadAsset?.runtimeImagePath ?? draft.imagePath}</strong>
          </div>
          <div>
            <span>上传后端</span>
            <strong>{draft.uploadAsset?.storageBackend ?? "--"}</strong>
          </div>
          <div>
            <span>状态进度</span>
            <strong>{replayFlowState?.status ? `${replayFlowState.status.generation_progress}%` : "--"}</strong>
          </div>
          <div>
            <span>检测状态</span>
            <strong>
              {(replaySnapshot?.detection ?? activeDetection)
                ? `ok (${(replaySnapshot?.detection ?? activeDetection)?.method})`
                : (replaySnapshot?.uploadDetecting ?? activeDetecting)
                  ? "running"
                  : replaySnapshot?.detectError ?? activeDetectError ?? "--"}
            </strong>
          </div>
        </div>
      </section>

      <section className="browser-debug-section">
        <div className="browser-debug-section__header">
          <h3>后台请求流</h3>
          <button type="button" className="browser-debug-link" onClick={onClearApiTraces}>
            清空
          </button>
        </div>
        <div className="browser-debug-request-list">
          {apiTraces.length === 0 ? (
            <p className="muted">当前还没有请求记录。切到 runtime 或触发检测后，这里会展示接口来回。</p>
          ) : (
            apiTraces.map((trace) => (
              <details key={trace.id} className={`browser-debug-request browser-debug-request--${trace.phase}`}>
                <summary>
                  <div>
                    <strong>{trace.method}</strong>
                    <span>{trace.url.split("/api/")[1] ?? trace.url}</span>
                  </div>
                  <div>
                    <span>{trace.phase}</span>
                    <span>{trace.durationMs ?? 0}ms</span>
                    <span>{formatClock(trace.finishedAt ?? trace.startedAt)}</span>
                  </div>
                </summary>
                <pre>{formatJson({
                  statusCode: trace.statusCode,
                  errorMessage: trace.errorMessage,
                  requestSummary: trace.requestSummary,
                  responseSummary: trace.responseSummary,
                })}</pre>
              </details>
            ))
          )}
        </div>
      </section>

      <section className="browser-debug-section">
        <div className="browser-debug-section__header">
          <h3>报告产生过程</h3>
          <button
            type="button"
            className="browser-debug-link"
            onClick={() => {
              if (!activeInterpretationId) {
                return;
              }
              setReportDebugProfile(null);
              setReportDebugError(null);
              setReportDebugLoading(true);
              void getInterpretationReportDebug(activeInterpretationId)
                .then((profile) => {
                  setReportDebugProfile(profile);
                })
                .catch((error) => {
                  setReportDebugError(error instanceof Error ? error.message : "拉取报告剖面失败");
                })
                .finally(() => {
                  setReportDebugLoading(false);
                });
            }}
            disabled={!activeInterpretationId}
          >
            刷新剖面
          </button>
        </div>
        {previewMode ? (
          <p className="muted">当前是 preview 模式，切到 runtime 并生成真实 interpretation 后，这里会显示后端分层产物。</p>
        ) : reportDebugLoading ? (
          <p className="muted">正在拉取 Layer0/Prompt/Draft/Final 剖面...</p>
        ) : reportDebugError ? (
          <p className="muted">{reportDebugError}</p>
        ) : reportDebugProfile ? (
          <>
            <div className="browser-debug-kv">
              <div>
                <span>主题</span>
                <strong>{reportDebugProfile.theme}</strong>
              </div>
              <div>
                <span>生成阶段</span>
                <strong>{reportDebugProfile.generation_stage}</strong>
              </div>
              <div>
                <span>进度</span>
                <strong>{reportDebugProfile.generation_progress}%</strong>
              </div>
              <div>
                <span>已购版本</span>
                <strong>{reportDebugProfile.version_purchased.join(", ") || "--"}</strong>
              </div>
            </div>
            {getLayerRecord(reportDebugProfile, "layer_0_raw") ? (
              <div className="browser-debug-layer-grid">
                <article className="browser-debug-layer-card">
                  <h4>五行分布</h4>
                  <div className="browser-debug-layer-stack">
                    {Object.entries(
                      (getLayerRecord(reportDebugProfile, "layer_0_raw")?.five_elements as Record<string, unknown>) ?? {},
                    ).map(([elementKey, elementValue]) => (
                      <details key={elementKey} className="browser-debug-layer-detail">
                        <summary>
                          <strong>{elementKey}</strong>
                        </summary>
                        <pre>{formatJson(elementValue)}</pre>
                      </details>
                    ))}
                  </div>
                </article>
                <article className="browser-debug-layer-card">
                  <h4>三圈能量</h4>
                  <div className="browser-debug-layer-stack">
                    {Object.entries(
                      (getLayerRecord(reportDebugProfile, "layer_0_raw")?.three_circles as Record<string, unknown>) ?? {},
                    ).map(([circleKey, circleValue]) => (
                      <details key={circleKey} className="browser-debug-layer-detail">
                        <summary>
                          <strong>{circleKey}</strong>
                        </summary>
                        <pre>{formatJson(circleValue)}</pre>
                      </details>
                    ))}
                  </div>
                </article>
                <article className="browser-debug-layer-card">
                  <h4>颜色分析</h4>
                  <pre>{formatJson(getLayerRecord(reportDebugProfile, "layer_0_raw")?.color_analysis ?? null)}</pre>
                </article>
                <article className="browser-debug-layer-card">
                  <h4>失衡候选</h4>
                  <div className="browser-debug-tag-list">
                    {Array.isArray(getLayerRecord(reportDebugProfile, "layer_0_raw")?.imbalance_candidates) &&
                    (getLayerRecord(reportDebugProfile, "layer_0_raw")?.imbalance_candidates as unknown[]).length > 0 ? (
                      (getLayerRecord(reportDebugProfile, "layer_0_raw")?.imbalance_candidates as unknown[]).map((item, index) => (
                        <span key={`${String(item)}-${index}`} className="browser-debug-tag">
                          {formatUnknownText(item)}
                        </span>
                      ))
                    ) : (
                      <span className="browser-debug-tag">--</span>
                    )}
                  </div>
                </article>
              </div>
            ) : null}
            {getLayerRecord(reportDebugProfile, "layer_1_lite_draft") ||
            getLayerRecord(reportDebugProfile, "layer_2_lite_final") ? (
              <article className="browser-debug-compare-card">
                <div className="browser-debug-section__header">
                  <h4>Lite 结构字段 {"->"} 最终展示</h4>
                  <span>Layer1 vs Layer2</span>
                </div>
                <div className="browser-debug-compare-table">
                  {liteComparisonRows.map((row) => (
                    <div key={row.label} className="browser-debug-compare-row">
                      <strong>{row.label}</strong>
                      <div>
                        <span>Draft</span>
                        <pre>{row.draftValue}</pre>
                      </div>
                      <div>
                        <span>Final</span>
                        <pre>{row.finalValue}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
            {liteProvenance.length > 0 ? (
              <article className="browser-debug-compare-card">
                <div className="browser-debug-section__header">
                  <h4>Lite 字段来源追踪</h4>
                  <span>final field provenance</span>
                </div>
                <div className="browser-debug-provenance-list">
                  {liteProvenance.map((item, index) => (
                    <details key={`${String(item.field)}-${index}`} className="browser-debug-provenance-item">
                      <summary>
                        <div>
                          <strong>{formatUnknownText(item.field)}</strong>
                          <span>{formatUnknownText(item.main_source)}</span>
                        </div>
                      </summary>
                      <div className="browser-debug-provenance-body">
                        <div className="browser-debug-provenance-block">
                          <span>Final</span>
                          <pre>{formatUnknownText(item.final_value)}</pre>
                        </div>
                        <div className="browser-debug-provenance-block">
                          <span>Upstream Inputs</span>
                          <pre>{formatJson(item.upstream_inputs)}</pre>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </article>
            ) : null}
            {getLayerRecord(reportDebugProfile, "layer_3_pro_draft") ||
            getLayerRecord(reportDebugProfile, "layer_4_pro_final") ? (
              <article className="browser-debug-compare-card">
                <div className="browser-debug-section__header">
                  <h4>Pro 结构字段 {"->"} 最终展示</h4>
                  <span>Layer3 vs Layer4</span>
                </div>
                <div className="browser-debug-compare-table">
                  {proComparisonRows.map((row) => (
                    <div key={row.label} className="browser-debug-compare-row">
                      <strong>{row.label}</strong>
                      <div>
                        <span>Draft</span>
                        <pre>{row.draftValue}</pre>
                      </div>
                      <div>
                        <span>Final</span>
                        <pre>{row.finalValue}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
            {proProvenance.length > 0 ? (
              <article className="browser-debug-compare-card">
                <div className="browser-debug-section__header">
                  <h4>Pro 字段来源追踪</h4>
                  <span>final field provenance</span>
                </div>
                <div className="browser-debug-provenance-list">
                  {proProvenance.map((item, index) => (
                    <details key={`${String(item.field)}-${index}`} className="browser-debug-provenance-item">
                      <summary>
                        <div>
                          <strong>{formatUnknownText(item.field)}</strong>
                          <span>{formatUnknownText(item.main_source)}</span>
                        </div>
                      </summary>
                      <div className="browser-debug-provenance-body">
                        <div className="browser-debug-provenance-block">
                          <span>Final</span>
                          <pre>{formatUnknownText(item.final_value)}</pre>
                        </div>
                        <div className="browser-debug-provenance-block">
                          <span>Upstream Inputs</span>
                          <pre>{formatJson(item.upstream_inputs)}</pre>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </article>
            ) : null}
            <div className="browser-debug-stage-list">
              {reportDebugProfile.steps.map((step) => (
                <details key={step.key} className={`browser-debug-request browser-debug-request--${step.status === "done" ? "success" : "error"}`}>
                  <summary>
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.key}</span>
                    </div>
                    <div>
                      <span>{step.status}</span>
                      <span>{formatClock(step.created_at ?? undefined)}</span>
                    </div>
                  </summary>
                  <pre>{formatJson(step.summary)}</pre>
                </details>
              ))}
            </div>
            <details className="browser-debug-json">
              <summary>完整 layers 原始数据</summary>
              <pre>{formatJson(reportDebugProfile.layers)}</pre>
            </details>
          </>
        ) : (
          <p className="muted">当前还没有 report 剖面数据。</p>
        )}
      </section>

      <section className="browser-debug-section">
        <div className="browser-debug-section__header">
          <h3>原始快照</h3>
        </div>
        <details className="browser-debug-json" open>
          <summary>flow state</summary>
          <pre>{formatJson(replayFlowState)}</pre>
        </details>
        <details className="browser-debug-json">
          <summary>report payload</summary>
          <pre>{formatJson(replayReport)}</pre>
        </details>
        <details className="browser-debug-json">
          <summary>selected replay snapshot</summary>
          <pre>{formatJson(replaySnapshot)}</pre>
        </details>
        <details className="browser-debug-json">
          <summary>runtime snapshot</summary>
          <pre>{formatJson(runtimeSnapshot)}</pre>
        </details>
      </section>
    </aside>
  );
}
