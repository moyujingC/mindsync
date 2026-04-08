import { useEffect, useMemo, useState } from "react";

import { MobileWebApp } from "./app";
import { createPreviewAppProps } from "./fixtures";
import {
  openMobileWebUpgradeEntry,
  pollMobileWebProReportUntilReady,
  pollMobileWebReportUntilReady,
  refreshMobileWebProReport,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "./controller";
import {
  createPreviewRouteInput,
  DEFAULT_PREVIEW_DRAFT,
  finalizePreviewSelectedReport,
  getRouteFromPathname,
  PREVIEW_POLLING_INTERVAL_MS,
  PREVIEW_POLLING_MAX_ATTEMPTS,
  PREVIEW_ROUTE_OPTIONS,
} from "./preview-shell-support";
import { MobileWebRuntime } from "./runtime";
import { mobileWebRoutes, type MobileWebRouteId } from "./routes";
import {
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebUploadDraft,
} from "./state";
import { ensureUploadedImagePath } from "./upload-runtime";
import type { HistoryFilterId } from "./components/history-cards";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  InterpretationRecordResponse,
  MandalaFlowState,
} from "../shared/types";
import { detectCircles, getInterpretationList } from "../shared/api";
import { initialMandalaFlowState } from "../shared/core";

export function MobileWebBrowserShell() {
  const [route, setRoute] = useState<MobileWebRouteId>(() =>
    typeof window === "undefined" ? "landing" : getRouteFromPathname(window.location.pathname),
  );
  const [draft, setDraft] = useState<MobileWebUploadDraft>(DEFAULT_PREVIEW_DRAFT);
  const [interpretationId, setInterpretationId] = useState("demo-interpretation-id");
  const [userId, setUserId] = useState("demo-user-id");
  const [previewMode, setPreviewMode] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [previewDetection, setPreviewDetection] =
    useState<DetectCirclesResponse | null>(null);
  const [previewDetecting, setPreviewDetecting] = useState(false);
  const [previewDetectError, setPreviewDetectError] = useState<string | null>(null);
  const [previewFlowState, setPreviewFlowState] =
    useState<MandalaFlowState | null>(null);
  const [previewFlowRunning, setPreviewFlowRunning] = useState(false);
  const [previewHistoryRecords, setPreviewHistoryRecords] =
    useState<InterpretationRecordResponse[] | null>(null);
  const [previewHistoryQuery, setPreviewHistoryQuery] =
    useState<InterpretationListQuery>({ filter: "all", limit: 20 });
  const [previewHistoryStatusLabel, setPreviewHistoryStatusLabel] =
    useState<string | null>(null);
  const [previewHistoryStatusDetail, setPreviewHistoryStatusDetail] =
    useState<string | null>(null);
  const [previewHistoryStatusTone, setPreviewHistoryStatusTone] =
    useState<"preview" | "runtime">("preview");
  const [previewHistoryOpeningId, setPreviewHistoryOpeningId] =
    useState<string | null>(null);

  const input = useMemo(
    () => createPreviewRouteInput(route, draft, interpretationId, userId, {
      filter: (previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all",
      limit: previewHistoryQuery.limit ?? 20,
      theme: previewHistoryQuery.theme,
    }),
    [draft, interpretationId, previewHistoryQuery.filter, previewHistoryQuery.limit, previewHistoryQuery.theme, route, userId],
  );
  const previewProps = useMemo(
    () =>
      createPreviewAppProps(
        route,
        draft,
        previewDetection,
        previewFlowState,
        previewHistoryRecords,
      ),
    [draft, previewDetection, previewFlowState, previewHistoryRecords, route],
  );

  async function refreshPreviewHistory(nextQuery: InterpretationListQuery) {
    if (draft.browserFile && !draft.uploadAsset) {
      setPreviewHistoryStatusLabel("当前显示占位历史记录");
      setPreviewHistoryStatusDetail("当前浏览器文件还没完成上传换路径，因此历史页先不请求真实接口。");
      setPreviewHistoryStatusTone("preview");
      setPreviewHistoryRecords(null);
      return;
    }

    try {
      const records = await getInterpretationList(userId, nextQuery);
      setPreviewHistoryRecords(records);
      setPreviewHistoryStatusLabel("当前显示真实历史记录");
      setPreviewHistoryStatusDetail("历史页已按当前查询条件重新请求真实记录。");
      setPreviewHistoryStatusTone("runtime");
    } catch (error) {
      setPreviewHistoryRecords(null);
      setPreviewHistoryStatusLabel("历史记录已回退到占位数据");
      setPreviewHistoryStatusDetail(
        `真实历史拉取失败：${error instanceof Error ? error.message : "unknown error"}`,
      );
      setPreviewHistoryStatusTone("preview");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextPath = mobileWebRoutes.find((item) => item.id === route)?.path ?? "/";
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
  }, [route]);

  useEffect(() => {
    if (!previewMode || route !== "loading") {
      return;
    }

    const currentInterpretationId =
      previewFlowState?.interpretation?.interpretation_id;
    if (!currentInterpretationId) {
      return;
    }

    const selectedVariant = draft.reportVariant ?? "lite";

    let cancelled = false;

    setPreviewFlowRunning(true);
    const handleTick = (snapshot: { state: MandalaFlowState }) => {
      if (!cancelled) {
        setPreviewFlowState(snapshot.state);
      }
    };

    const loadingTask = selectedVariant === "pro"
      ? (async () => {
          let liteSnapshot = previewFlowState?.step === "liteGenerating"
            ? await pollMobileWebReportUntilReady(
                currentInterpretationId,
                previewFlowState,
                {
                  intervalMs: PREVIEW_POLLING_INTERVAL_MS,
                  maxAttempts: PREVIEW_POLLING_MAX_ATTEMPTS,
                  onTick: handleTick,
                },
              )
            : { state: previewFlowState };

          if (liteSnapshot.state.step === "liteGenerating" || liteSnapshot.state.step === "error") {
            return liteSnapshot;
          }

          const upgradeSnapshot =
            liteSnapshot.state.step === "upgradePlaceholder"
              ? liteSnapshot
              : await openMobileWebUpgradeEntry(currentInterpretationId, liteSnapshot.state);

          handleTick(upgradeSnapshot);

          return pollMobileWebProReportUntilReady(
            currentInterpretationId,
            upgradeSnapshot.state,
            {
              intervalMs: PREVIEW_POLLING_INTERVAL_MS,
              maxAttempts: PREVIEW_POLLING_MAX_ATTEMPTS,
              onTick: handleTick,
            },
          );
        })()
      : pollMobileWebReportUntilReady(
          currentInterpretationId,
          previewFlowState,
          {
            intervalMs: PREVIEW_POLLING_INTERVAL_MS,
            maxAttempts: PREVIEW_POLLING_MAX_ATTEMPTS,
            onTick: handleTick,
          },
        );

    void loadingTask
      .then(async (snapshot) => {
        if (cancelled) {
          return;
        }

        setPreviewFlowState(snapshot.state);

        if (selectedVariant === "pro") {
          const proReady =
            snapshot.report?.version === "pro" &&
            typeof snapshot.report.report === "string" &&
            snapshot.report.report.trim();

          if (proReady) {
            setRoute("upgrade");
          }
          return;
        }

        if (snapshot.state.step !== "liteGenerating" && !cancelled) {
          await finalizePreviewSelectedReport({
            interpretationId: currentInterpretationId,
            state: snapshot.state,
            draft,
            userId,
            historyQuery: previewHistoryQuery,
            setPreviewFlowState,
            setPreviewHistoryRecords,
            setPreviewHistoryStatusLabel,
            setPreviewHistoryStatusDetail,
            setPreviewHistoryStatusTone,
            setRoute,
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewFlowRunning(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft, previewFlowState?.interpretation?.interpretation_id, previewHistoryQuery, previewMode, route, userId]);

  async function handlePreviewPrimaryAction() {
    if (route === "loading") {
      if (previewFlowRunning) {
        return;
      }
      const interpretationId = previewFlowState?.interpretation?.interpretation_id;
      if (interpretationId) {
        setPreviewFlowRunning(true);
        try {
          const refreshed = await refreshMobileWebReport(
            interpretationId,
            previewFlowState,
          );
          setPreviewFlowState(refreshed.state);
          if (refreshed.state.step !== "liteGenerating") {
            await finalizePreviewSelectedReport({
              interpretationId,
              state: refreshed.state,
              draft,
              userId,
              historyQuery: previewHistoryQuery,
              setPreviewFlowState,
              setPreviewHistoryRecords,
              setPreviewHistoryStatusLabel,
              setPreviewHistoryStatusDetail,
              setPreviewHistoryStatusTone,
              setRoute,
            });
          }
        } finally {
          setPreviewFlowRunning(false);
        }
        return;
      }
      setRoute("report");
      return;
    }

    if (route === "report") {
      if (previewFlowState?.step === "error") {
        const interpretationId = previewFlowState.interpretation?.interpretation_id;
        if (interpretationId) {
          setPreviewFlowRunning(true);
          try {
            const refreshed = await refreshMobileWebReport(
              interpretationId,
              previewFlowState,
            );
            setPreviewFlowState(refreshed.state);
            if (refreshed.state.step === "liteGenerating") {
              setRoute("loading");
            }
          } finally {
            setPreviewFlowRunning(false);
          }
          return;
        }

        setPreviewFlowState(null);
        setRoute("upload");
        return;
      }

      setRoute("reportEntry");
      return;
    }

    if (route === "upgrade") {
      const interpretationId = previewFlowState?.interpretation?.interpretation_id;
      if (!interpretationId || previewFlowRunning) {
        return;
      }

      setPreviewFlowRunning(true);
      try {
        const refreshed = await refreshMobileWebProReport(
          interpretationId,
          previewFlowState ?? initialMandalaFlowState,
        );
        setPreviewFlowState(refreshed.state);
      } finally {
        setPreviewFlowRunning(false);
      }
    }
  }

  function handlePreviewSecondaryAction() {
    if (route === "loading") {
      setRoute("reportEntry");
      return;
    }

    if (route === "report" || route === "upgrade") {
      setPreviewFlowState(null);
      setPreviewHistoryRecords(null);
      setPreviewHistoryQuery({ filter: "all", limit: 20 });
      setPreviewHistoryStatusLabel(null);
      setPreviewHistoryStatusDetail(null);
      setPreviewHistoryOpeningId(null);
      setRoute("upload");
    }
  }

  function handlePreviewBackAction() {
    if (route === "upgrade") {
      setRoute("reportEntry");
    }
  }

  async function handlePreviewOpenHistoryRecord(
    interpretationId: string,
    canOpenReport: boolean,
    reportVariant: "lite" | "pro",
  ) {
    if (previewFlowRunning) {
      return;
    }

    setPreviewFlowRunning(true);
    setPreviewHistoryOpeningId(interpretationId);
    try {
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        initialMandalaFlowState,
      );
      setPreviewFlowState(refreshed.state);
      setInterpretationId(interpretationId);
      setDraft((current) => ({
        ...current,
        reportVariant,
      }));

      if (reportVariant === "pro") {
        await finalizePreviewSelectedReport({
          interpretationId,
          state: refreshed.state,
          draft: {
            ...draft,
            reportVariant: "pro",
          },
          userId,
          historyQuery: previewHistoryQuery,
          setPreviewFlowState,
          setPreviewHistoryRecords,
          setPreviewHistoryStatusLabel,
          setPreviewHistoryStatusDetail,
          setPreviewHistoryStatusTone,
          setRoute,
        });
        return;
      }

      setRoute(
        canOpenReport || refreshed.state.step !== "liteGenerating"
          ? "report"
          : "loading",
      );
    } finally {
      setPreviewHistoryOpeningId(null);
      setPreviewFlowRunning(false);
    }
  }

  return (
    <div className="browser-shell">
      <section className={`browser-shell__viewport${import.meta.env.DEV ? "" : " browser-shell__viewport--clean"}`}>
        {import.meta.env.DEV ? (
          <div className="browser-shell__devbar">
          <div className="browser-shell__devbar-copy">
            <p className="eyebrow">一镜一梳 To C</p>
            <strong>mobile-web dev shell</strong>
            <span className="muted">
              开发辅助层，正式产品界面只看手机画面。
            </span>
          </div>

          <button
            type="button"
            className="browser-shell__toggle"
            onClick={() => {
              setControlsOpen((current) => !current);
            }}
          >
            {controlsOpen ? "收起开发控制" : "展开开发控制"}
          </button>
          </div>
        ) : null}

        {import.meta.env.DEV && controlsOpen ? (
          <aside className="browser-shell__panel browser-shell__panel--inline">
            <div className="browser-shell__panel-header">
              <h2>开发控制台</h2>
              <p className="muted">
                这里只用于本地预览和联调，不属于正式 mobile-web 页面。
              </p>
            </div>

            <div className="browser-shell__controls">
              <label className="field field--checkbox">
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(event) => {
                    setPreviewMode(event.target.checked);
                  }}
                />
                <span>使用本地预览模式（不请求后端）</span>
              </label>

              <label className="field">
                <span>路由</span>
                <select
                  value={route}
                  onChange={(event) => {
                    setRoute(event.target.value as MobileWebRouteId);
                  }}
                >
                  {PREVIEW_ROUTE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>图片路径</span>
                <input
                  value={draft.imagePath}
                  onChange={(event) => {
                    setDraft((current) => mergeMobileWebUploadDraft(current, {
                      imagePath: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>主题</span>
                <input
                  value={draft.theme}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      theme: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>创作意图</span>
                <textarea
                  rows={3}
                  value={draft.paintingIntention}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      paintingIntention: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>创作感受</span>
                <textarea
                  rows={3}
                  value={draft.paintingFeeling}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      paintingFeeling: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>interpretationId</span>
                <input
                  value={interpretationId}
                  onChange={(event) => {
                    setInterpretationId(event.target.value);
                  }}
                />
              </label>

              <label className="field">
                <span>userId</span>
                <input
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                  }}
                />
              </label>
            </div>
          </aside>
        ) : null}

        <div className="browser-shell__phone">
          {previewMode ? (
            <MobileWebApp
              {...previewProps}
              uploadDraft={draft}
              uploadDetection={previewDetection}
              uploadDetecting={previewDetecting}
              uploadDetectError={previewDetectError}
              activeHistoryFilter={(previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all"}
              historyQuery={previewHistoryQuery}
              historyActionBusy={previewFlowRunning && route === "history"}
              activeHistoryRecordId={previewHistoryOpeningId}
              historyStatusLabel={previewHistoryStatusLabel ?? undefined}
              historyStatusDetail={previewHistoryStatusDetail ?? undefined}
              historyStatusTone={previewHistoryStatusTone}
              environmentLabel={import.meta.env.DEV && route === "upload" ? "当前为本地预览模式" : undefined}
              environmentDetail={
                import.meta.env.DEV && route === "upload"
                  ? previewFlowRunning
                    ? "当前正在尝试刷新或执行真实 Lite 主路径，请先等待 create/status/report 链路返回。"
                    : "上传页的三圈检测可切到真实接口触发；其它页面默认保持正式界面观感。"
                  : undefined
              }
              environmentTone={import.meta.env.DEV ? "preview" : undefined}
              onLandingStart={() => {
                setRoute("upload");
              }}
              onLandingOpenHistory={() => {
                setRoute("history");
                void refreshPreviewHistory(previewHistoryQuery);
              }}
              onUploadDraftChange={(patch) => {
                setDraft((current) => mergeMobileWebUploadDraft(current, patch));
                if (patch.imagePath !== undefined) {
                  setPreviewDetection(null);
                  setPreviewDetectError(null);
                  setPreviewFlowState(null);
                  setPreviewHistoryRecords(null);
                  setPreviewHistoryQuery({ filter: "all", limit: 20 });
                  setPreviewHistoryStatusLabel(null);
                  setPreviewHistoryStatusDetail(null);
                }
              }}
              onUploadContinue={async () => {
                setPreviewFlowState(null);
                setRoute("reportEntry");
              }}
              onUploadBack={() => {
                setRoute("landing");
              }}
              onReportEntryBack={() => {
                setRoute("upload");
              }}
              onReportEntryChooseLite={async () => {
                const nextDraft = { ...draft, reportVariant: "lite" as const };
                setDraft(nextDraft);
                setPreviewFlowState(null);
                setRoute("loading");

                setPreviewFlowRunning(true);
                try {
                  const resolvedImagePath = await ensureUploadedImagePath(
                    nextDraft,
                    (uploaded) => {
                      setDraft((current) => ({
                        ...current,
                        uploadAsset: toMobileWebUploadAssetRef(uploaded),
                      }));
                    },
                  );
                  const result = await runMobileWebLiteFlow(
                    toStartCreatePayload(
                      {
                        ...nextDraft,
                        uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
                        innerRadius: previewDetection?.inner_radius ?? nextDraft.innerRadius,
                        middleRadius: previewDetection?.middle_radius ?? nextDraft.middleRadius,
                      },
                      userId,
                    ),
                  );
                  setPreviewFlowState(result.state);
                  if (result.state.step === "liteGenerating") {
                    setRoute("loading");
                    return;
                  }
                  await finalizePreviewSelectedReport({
                    interpretationId: result.state.interpretation?.interpretation_id ?? "demo-interpretation-id",
                    state: result.state,
                    draft: { ...nextDraft, uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath) },
                    userId,
                    historyQuery: previewHistoryQuery,
                    setPreviewFlowState,
                    setPreviewHistoryRecords,
                    setPreviewHistoryStatusLabel,
                    setPreviewHistoryStatusDetail,
                    setPreviewHistoryStatusTone,
                    setRoute,
                  });
                } catch {
                } finally {
                  setPreviewFlowRunning(false);
                }
              }}
              onReportEntryChoosePro={async () => {
                const nextDraft = { ...draft, reportVariant: "pro" as const };
                setDraft(nextDraft);
                setPreviewFlowState(null);
                setRoute("loading");

                setPreviewFlowRunning(true);
                try {
                  const resolvedImagePath = await ensureUploadedImagePath(
                    nextDraft,
                    (uploaded) => {
                      setDraft((current) => ({
                        ...current,
                        uploadAsset: toMobileWebUploadAssetRef(uploaded),
                      }));
                    },
                  );
                  const result = await runMobileWebLiteFlow(
                    toStartCreatePayload(
                      {
                        ...nextDraft,
                        uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
                        innerRadius: previewDetection?.inner_radius ?? nextDraft.innerRadius,
                        middleRadius: previewDetection?.middle_radius ?? nextDraft.middleRadius,
                      },
                      userId,
                    ),
                  );
                  setPreviewFlowState(result.state);
                  if (result.state.step === "liteGenerating") {
                    setRoute("loading");
                    return;
                  }
                  await finalizePreviewSelectedReport({
                    interpretationId: result.state.interpretation?.interpretation_id ?? "demo-interpretation-id",
                    state: result.state,
                    draft: { ...nextDraft, uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath) },
                    userId,
                    historyQuery: previewHistoryQuery,
                    setPreviewFlowState,
                    setPreviewHistoryRecords,
                    setPreviewHistoryStatusLabel,
                    setPreviewHistoryStatusDetail,
                    setPreviewHistoryStatusTone,
                    setRoute,
                  });
                } catch {
                } finally {
                  setPreviewFlowRunning(false);
                }
              }}
              onUploadPreviewDetect={async () => {
                if (!draft.imagePath) {
                  setPreviewDetectError("请先选择一张画作，再触发三圈检测。");
                  return;
                }

                setPreviewDetecting(true);
                setPreviewDetectError(null);

                try {
                  const resolvedImagePath = await ensureUploadedImagePath(
                    draft,
                    (uploaded) => {
                      setDraft((current) => ({
                        ...current,
                        uploadAsset: toMobileWebUploadAssetRef(uploaded),
                      }));
                    },
                  );
                  const detection = await detectCircles({
                    image_path: resolvedImagePath.image_path,
                  });
                  setPreviewDetection(detection);
                } catch (error) {
                  setPreviewDetectError(
                    error instanceof Error ? error.message : "三圈检测失败",
                  );
                  setPreviewDetection(null);
                } finally {
                  setPreviewDetecting(false);
                }
              }}
              onReportPrimaryAction={handlePreviewPrimaryAction}
              onReportSecondaryAction={handlePreviewSecondaryAction}
              onReportBackAction={handlePreviewBackAction}
              reportPrimaryDisabled={route === "loading" && previewFlowRunning}
              onHistoryBackToUpload={() => {
                setRoute("upload");
              }}
              onHistoryFilterChange={(filter) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  filter,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  filter,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryThemeChange={(theme) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  theme,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  theme,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryLimitChange={(limit) => {
                const nextQuery = {
                  ...previewHistoryQuery,
                  limit,
                };
                setPreviewHistoryQuery((current) => ({
                  ...current,
                  limit,
                }));
                if (route === "history") {
                  void refreshPreviewHistory(nextQuery);
                }
              }}
              onHistoryOpenRecord={handlePreviewOpenHistoryRecord}
            />
          ) : (
            <MobileWebRuntime
              input={input}
              loadingFallback={<div className="runtime-state">正在装配 mobile-web 路由...</div>}
              errorFallback={(message) => (
                <div className="runtime-state runtime-state--error">
                  <h2>路由装配失败</h2>
                  <p>{message}</p>
                </div>
              )}
              environmentLabel={import.meta.env.DEV && route === "upload" ? "当前为联调运行时" : undefined}
              environmentDetail={
                import.meta.env.DEV && route === "upload"
                  ? "页面会按当前 loader 和接口装配真实路由结果，具体表现取决于本地后端是否可用。"
                  : undefined
              }
              environmentTone={import.meta.env.DEV ? "runtime" : undefined}
            />
          )}
        </div>
      </section>
    </div>
  );
}
