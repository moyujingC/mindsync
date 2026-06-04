import { useCallback, useEffect, useMemo, useState } from "react";

import { MobileWebApp } from "./app";
import { MiniappApp } from "../miniapp/app";
import type { MiniappRouteId } from "../miniapp/routes";
import { createPreviewAppProps } from "./fixtures";
import {
  createBrowserFileFromFixture,
  mobileWebDevFixturePresets,
} from "./dev-fixtures";
import {
  pollMobileWebReportUntilReady,
  refreshMobileWebReport,
  runMobileWebReportFlow,
} from "./controller";
import {
  createPreviewRouteInput,
  DEFAULT_PREVIEW_DRAFT,
  finalizePreviewSelectedReport,
  getRouteFromPathname,
  isLocalDebugHost,
  PREVIEW_POLLING_INTERVAL_MS,
  PREVIEW_POLLING_MAX_ATTEMPTS,
  PREVIEW_ROUTE_OPTIONS,
} from "./preview-shell-support";
import { MobileWebRuntime } from "./runtime";
import {
  createMobileWebGuestSession,
  persistMobileWebSession,
  resolveMobileWebSession,
  updateMobileWebSessionCanonicalUserId,
} from "./identity";
import { mobileWebRoutes, type MobileWebRouteId } from "./routes";
import {
  getDraftReportVariant,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebReportProductType,
  type MobileWebUploadDraft,
} from "./state";
import { ensureUploadedImagePath } from "./upload-runtime";
import type { HistoryFilterId } from "./components/history-cards";
import type {
  FrontendUserSession,
  DetectCirclesResponse,
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
} from "../shared/types";
import {
  applyError,
  getGenerationPresentation,
  initialMandalaFlowState,
} from "../shared/core";

type RuntimeDebugState = {
  route: string;
  phase: "idle" | "uploading_image" | "building_request" | "requesting_report" | "waiting_report" | "report_ready" | "failed";
  isBusy: boolean;
  isUploading: boolean;
  uploadErrorMessage: string | null;
  reportStage: string | null;
  reportId: string | null;
  imagePath: string | null;
};

function isSameRuntimeDebugState(
  current: RuntimeDebugState | null,
  next: RuntimeDebugState,
) {
  return Boolean(
    current &&
      current.route === next.route &&
      current.phase === next.phase &&
      current.isBusy === next.isBusy &&
      current.isUploading === next.isUploading &&
      current.uploadErrorMessage === next.uploadErrorMessage &&
      current.reportStage === next.reportStage &&
      current.reportId === next.reportId &&
      current.imagePath === next.imagePath,
  );
}

function readBrowserShellInitialState() {
  const defaultDraft = DEFAULT_PREVIEW_DRAFT;

  if (typeof window === "undefined") {
    return {
      route: "landing" as MobileWebRouteId,
      draft: defaultDraft,
      interpretationId: "",
      session: createMobileWebGuestSession("ssr"),
      previewMode: import.meta.env.DEV,
      controlsOpen: import.meta.env.DEV,
      cleanMode: false,
      presetId: null as string | null,
    };
  }

  const url = new URL(window.location.href);
  const previewParam = url.searchParams.get("preview");
  const controlsParam = url.searchParams.get("controls");
  const cleanMode = url.searchParams.get("clean") === "1";
  const reportVariantParam = url.searchParams.get("reportVariant");
  const reportTypeParam = url.searchParams.get("reportType");
  const route = getRouteFromPathname(url.pathname);
  const localDebugEnabled = isLocalDebugHost(url.hostname) && !cleanMode;

  return {
    route,
    draft: {
      ...defaultDraft,
      imagePath: url.searchParams.get("imagePath") ?? defaultDraft.imagePath,
      theme: url.searchParams.get("theme") ?? defaultDraft.theme,
      reportVariant: reportVariantParam === "pro" ? "pro" : "lite",
      reportType: reportTypeParam === "pro"
        ? "pro"
        : reportTypeParam === "lite"
          ? "lite"
          : reportVariantParam === "pro"
            ? "pro"
            : "lite",
      paintingIntention: url.searchParams.get("paintingIntention") ?? defaultDraft.paintingIntention,
      paintingFeeling: url.searchParams.get("paintingFeeling") ?? defaultDraft.paintingFeeling,
    } satisfies MobileWebUploadDraft,
    interpretationId: url.searchParams.get("interpretationId") ?? "",
    session: resolveMobileWebSession({
      locationHref: url.toString(),
    }),
    previewMode: previewParam === "0" ? false : previewParam === "1" ? true : import.meta.env.DEV,
    controlsOpen: controlsParam === "0" ? false : controlsParam === "1" ? true : (import.meta.env.DEV || localDebugEnabled),
    cleanMode,
    presetId: url.searchParams.get("preset"),
  };
}

function formatHistoryRefreshHint(date = new Date()): string {
  return `最近更新于 ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)}`;
}

function resolvePreviewReportFooterState(
  flowState: MandalaFlowState | null,
  _draft: MobileWebUploadDraft,
) {
  if (!flowState || flowState.step === "liteGenerating" || flowState.step === "error") {
    return {};
  }

  const isProReport = flowState.report?.version === "pro" || flowState.step === "proReady";
  if (isProReport) {
    return {
      primaryLabel: "重新上传画作",
      secondaryLabel: "返回上传页",
      footerHint: "Pro 完整解读已经生成完成。你可以重新开始下一次解读，或回到上传页继续查看别的作品。",
    };
  }

  return {
    primaryLabel: "升级到 Pro 版本",
    secondaryLabel: "重新上传画作",
    footerHint: "如果你想继续深入读这幅画，可以在 Lite 基础上升级到 Pro 完整解读。",
  };
}

export function MobileWebBrowserShell() {
  const initialState = readBrowserShellInitialState();
  const [forceCleanMode] = useState(initialState.cleanMode);
  const [pendingPresetId] = useState<string | null>(initialState.presetId);
  const localDebugEnabled =
    typeof window !== "undefined" &&
    isLocalDebugHost(window.location.hostname) &&
    !forceCleanMode;
  const [route, setRoute] = useState<MobileWebRouteId>(initialState.route);
  const [draft, setDraft] = useState<MobileWebUploadDraft>(initialState.draft);
  const [interpretationId, setInterpretationId] = useState(initialState.interpretationId);
  const [session, setSession] = useState<FrontendUserSession>(initialState.session);
  const [userIdInput, setUserIdInput] = useState(initialState.session.canonicalUserId);
  const [previewMode, setPreviewMode] = useState(initialState.previewMode);
  const [previewChannel, setPreviewChannel] = useState<"mobile-web" | "miniapp">("mobile-web");
  const [controlsOpen, setControlsOpen] = useState(initialState.controlsOpen);
  const [previewFlowState, setPreviewFlowState] =
    useState<MandalaFlowState | null>(null);
  const [previewDetection, setPreviewDetection] =
    useState<DetectCirclesResponse | null>(null);
  const [previewDetectError, setPreviewDetectError] =
    useState<string | null>(null);
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
  const [previewHistoryRefreshHint, setPreviewHistoryRefreshHint] =
    useState<string | null>(null);
  const [previewHistoryRefreshing, setPreviewHistoryRefreshing] =
    useState(false);
  const [previewHistoryOpeningId, setPreviewHistoryOpeningId] =
    useState<string | null>(null);
  const [previewHistoryOpeningReportType, setPreviewHistoryOpeningReportType] =
    useState<InterpretationVersion | null>(null);
  const [fixtureLoadingId, setFixtureLoadingId] =
    useState<string | null>(null);
  const [runtimeDebugState, setRuntimeDebugState] = useState<RuntimeDebugState | null>(null);
  const userId = session.canonicalUserId;
  const activePreviewImagePath = draft.uploadAsset?.runtimeImagePath ?? draft.imagePath;
  const activePreviewStep = previewFlowState?.step ?? "idle";
  const activePreviewError =
    previewDetectError ??
    previewFlowState?.lastError ??
    previewFlowState?.report?.error ??
    null;
  const activePreviewReportId =
    previewFlowState?.interpretation?.interpretation_id ??
    previewHistoryOpeningId ??
    interpretationId ??
    null;
  const activeRuntimeState = previewMode ? null : runtimeDebugState;
  const panelRoute = previewMode ? route : activeRuntimeState?.route ?? route;
  const panelPhase = previewMode ? (previewFlowRunning ? "waiting_report" : "idle") : activeRuntimeState?.phase ?? "idle";
  const panelBusy = previewMode ? previewFlowRunning : activeRuntimeState?.isBusy ?? false;
  const panelUploading = previewMode ? previewFlowRunning && route === "upload" : activeRuntimeState?.isUploading ?? false;
  const panelError = previewMode ? activePreviewError : activeRuntimeState?.uploadErrorMessage ?? null;
  const panelReportStage = previewMode ? activePreviewStep : activeRuntimeState?.reportStage ?? "idle";
  const panelReportId = previewMode ? activePreviewReportId : activeRuntimeState?.reportId ?? null;
  const panelImagePath = previewMode ? activePreviewImagePath : activeRuntimeState?.imagePath ?? activePreviewImagePath;
  const previewReportFooterState = resolvePreviewReportFooterState(
    previewFlowState,
    draft,
  );

  const input = useMemo(
    () => createPreviewRouteInput(route, draft, interpretationId, session, {
      filter: (previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all",
      limit: previewHistoryQuery.limit ?? 20,
      theme: previewHistoryQuery.theme,
    }),
    [draft, interpretationId, previewHistoryQuery.filter, previewHistoryQuery.limit, previewHistoryQuery.theme, route, session],
  );
  const previewProps = useMemo(
    () =>
      createPreviewAppProps(
        route,
        draft,
        null,
        previewFlowState,
        previewHistoryRecords,
      ),
    [draft, previewFlowState, previewHistoryRecords, route],
  );
  const handleRuntimeDebugStateChange = useCallback((state: RuntimeDebugState) => {
    setRuntimeDebugState((current) => (
      isSameRuntimeDebugState(current, state) ? current : state
    ));
  }, []);

  useEffect(() => {
    setUserIdInput(session.canonicalUserId);
    persistMobileWebSession(session);
  }, [session]);

  function commitUserIdInput(nextValue: string) {
    setUserIdInput(nextValue);

    const nextSession = updateMobileWebSessionCanonicalUserId(session, nextValue);
    if (nextSession) {
      setSession(nextSession);
    }
  }

  async function refreshPreviewHistory(
    nextQuery: InterpretationListQuery,
    options?: {
      successLabel?: string;
      successDetail?: string;
      successTone?: "preview" | "runtime";
      failureLabel?: string;
      failureDetail?: string;
      failureTone?: "preview" | "runtime";
      preserveRecordsOnError?: boolean;
    },
  ) {
    void nextQuery;
    void options;
    if (draft.browserFile && !draft.uploadAsset) {
      setPreviewHistoryStatusLabel("当前显示占位历史记录");
      setPreviewHistoryStatusDetail("当前浏览器文件还没完成上传换路径，因此历史页先不请求真实接口。");
      setPreviewHistoryStatusTone("preview");
      setPreviewHistoryRecords(null);
      return;
    }

    setPreviewHistoryRecords(null);
    setPreviewHistoryStatusLabel("历史记录暂未接入当前报告 API");
    setPreviewHistoryStatusDetail("当前只保留财富报告生成入口，历史列表需要按新 report_id 存储模型重做。");
    setPreviewHistoryStatusTone("preview");
    setPreviewHistoryRefreshHint(formatHistoryRefreshHint());
  }

  useEffect(() => {
    if (
      route !== "history" ||
      previewHistoryRefreshing ||
      previewFlowRunning ||
      previewHistoryOpeningId ||
      !previewHistoryRecords?.some((record) => !getGenerationPresentation(record).isReady)
    ) {
      return;
    }

    let cancelled = false;

    const refreshHistory = async () => {
      setPreviewHistoryRefreshing(true);

      if (!cancelled) {
        setPreviewHistoryRecords(null);
        setPreviewHistoryRefreshHint(formatHistoryRefreshHint());
        setPreviewHistoryStatusLabel("历史记录暂未接入当前报告 API");
        setPreviewHistoryStatusDetail("自动刷新已停用；历史列表会在新报告存储模型完成后重做。");
        setPreviewHistoryStatusTone("preview");
      }
      setPreviewHistoryRefreshing(false);
    };

    const timer = window.setInterval(() => {
      void refreshHistory();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    previewFlowRunning,
    previewHistoryOpeningId,
    previewHistoryQuery,
    previewHistoryRecords,
    previewHistoryRefreshing,
    route,
    userId,
  ]);

  async function handlePreviewHistoryRefresh() {
    if (previewFlowRunning || previewHistoryRefreshing) {
      return;
    }

    await refreshPreviewHistory(previewHistoryQuery, {
      successLabel: "已手动刷新历史记录",
      successDetail: "当前已按现有筛选条件重新请求真实历史记录。",
      successTone: previewMode ? "preview" : "runtime",
      failureLabel: "手动刷新失败",
      failureTone: "preview",
      preserveRecordsOnError: true,
    });
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextPath = mobileWebRoutes.find((item) => item.id === route)?.path ?? "/";
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", `${nextPath}${window.location.search}`);
    }
  }, [route]);

  useEffect(() => {
    if (!pendingPresetId) {
      return;
    }

    void handleApplyFixturePreset(pendingPresetId);
  }, [pendingPresetId]);

  useEffect(() => {
    if (!previewMode || route !== "loading") {
      return;
    }

    const currentInterpretationId =
      previewFlowState?.interpretation?.interpretation_id;
    if (!currentInterpretationId) {
      return;
    }

    const selectedVariant = getDraftReportVariant(draft);

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
                "lite",
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

          if (
            liteSnapshot.state.report?.version === "pro" ||
            Boolean(
              liteSnapshot.state.report?.can_upgrade ||
                liteSnapshot.state.status?.can_upgrade,
            )
          ) {
            return pollMobileWebReportUntilReady(
              currentInterpretationId,
              "pro",
              liteSnapshot.state,
              {
                intervalMs: PREVIEW_POLLING_INTERVAL_MS,
                maxAttempts: PREVIEW_POLLING_MAX_ATTEMPTS,
                onTick: handleTick,
              },
            );
          }

          return pollMobileWebReportUntilReady(
            currentInterpretationId,
            "pro",
            liteSnapshot.state,
            {
              intervalMs: PREVIEW_POLLING_INTERVAL_MS,
              maxAttempts: PREVIEW_POLLING_MAX_ATTEMPTS,
              onTick: handleTick,
            },
          );
        })()
      : pollMobileWebReportUntilReady(
          currentInterpretationId,
          "lite",
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

          if (proReady || snapshot.state.step === "error") {
            setRoute("report");
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
            "lite",
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
              "lite",
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

      const isProReport =
        previewFlowState?.report?.version === "pro" ||
        previewFlowState?.step === "proReady";
      if (!isProReport) {
        setDraft((current) => mergeMobileWebUploadDraft(current, { reportType: "pro" }));
        setRoute("reportEntry");
        return;
      }

      setRoute("upload");
      return;
    }

  }

  async function handlePreviewLeaveLoadingLater() {
    const nextQuery = {
      ...previewHistoryQuery,
      filter: "pending" as const,
      theme: draft.theme,
    };

    setPreviewHistoryQuery(nextQuery);
    setRoute("history");
    await refreshPreviewHistory(nextQuery);
    setPreviewHistoryStatusLabel("Pro 解读仍在生成中");
    setPreviewHistoryStatusDetail("你已经离开等待页，系统会继续生成。稍后可从历史记录回来查看完整 Pro 报告。");
    setPreviewHistoryStatusTone(previewMode ? "preview" : "runtime");
  }

  function handlePreviewSecondaryAction() {
    if (route === "loading") {
      setRoute("upload");
      return;
    }

    if (route === "report") {
      setPreviewFlowState(null);
      setPreviewHistoryRecords(null);
      setPreviewHistoryQuery({ filter: "all", limit: 20 });
      setPreviewHistoryStatusLabel(null);
      setPreviewHistoryStatusDetail(null);
      setPreviewHistoryRefreshHint(null);
      setPreviewHistoryOpeningId(null);
      setRoute("upload");
    }
  }

  function handlePreviewBackAction() {}

  async function handlePreviewStartReport(reportType: MobileWebReportProductType) {
    if (previewFlowRunning) {
      return;
    }

    const nextDraft = mergeMobileWebUploadDraft(draft, {
      reportType,
    });
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
      const nextAssetRef = toMobileWebUploadAssetRef(resolvedImagePath);
      const result = await runMobileWebReportFlow(
        toStartCreatePayload(
          {
            ...nextDraft,
            uploadAsset: nextAssetRef,
          },
          userId,
        ),
        getDraftReportVariant(nextDraft),
      );
      const draftWithUpload = { ...nextDraft, uploadAsset: nextAssetRef };
      setPreviewFlowState(result.state);
      if (result.state.step === "liteGenerating") {
        setRoute("loading");
        return;
      }
      await finalizePreviewSelectedReport({
        interpretationId: result.state.interpretation?.interpretation_id ?? "demo-interpretation-id",
        state: result.state,
        draft: draftWithUpload,
        userId,
        historyQuery: previewHistoryQuery,
        setPreviewFlowState,
        setPreviewHistoryRecords,
        setPreviewHistoryStatusLabel,
        setPreviewHistoryStatusDetail,
        setPreviewHistoryStatusTone,
        setRoute,
      });
    } catch (error) {
      setPreviewFlowState(
        applyError(
          initialMandalaFlowState,
          error instanceof Error ? error.message : "报告生成失败，请稍后重试。",
        ),
      );
      setRoute("report");
    } finally {
      setPreviewFlowRunning(false);
    }
  }

  async function handlePreviewOpenHistoryRecord(
    interpretationId: string,
  ) {
    if (previewFlowRunning) {
      return;
    }

    setPreviewHistoryOpeningId(interpretationId);
    try {
      setInterpretationId(interpretationId);
      setRoute("historyRecordDetail");
    } finally {
      setPreviewHistoryOpeningId(null);
    }
  }

  async function handlePreviewOpenHistoryRecordReport(
    reportType: InterpretationVersion,
  ) {
    if (previewFlowRunning) {
      return;
    }

    setPreviewFlowRunning(true);
    setPreviewHistoryOpeningReportType(reportType);
    try {
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        reportType,
        initialMandalaFlowState,
      );
      setPreviewFlowState(refreshed.state);
      setInterpretationId(interpretationId);
      setDraft((current) => mergeMobileWebUploadDraft(current, { reportType }));

      if (reportType === "pro") {
        const proReady =
          refreshed.report?.version === "pro" &&
          typeof refreshed.report.report === "string" &&
          refreshed.report.report.trim();
        setRoute(proReady ? "report" : "loading");
        return;
      }

      setRoute(refreshed.state.step === "liteGenerating" ? "loading" : "report");
    } finally {
      setPreviewHistoryOpeningReportType(null);
      setPreviewFlowRunning(false);
    }
  }

  async function handleApplyFixturePreset(presetId: string) {
    const preset = mobileWebDevFixturePresets.find((item) => item.id === presetId);
    if (!preset || fixtureLoadingId) {
      return;
    }

    setFixtureLoadingId(presetId);
    try {
      const browserFile = await createBrowserFileFromFixture(preset);
      setDraft((current) => mergeMobileWebUploadDraft(current, {
        imagePath: preset.imageUrl,
        browserFile,
        uploadAsset: null,
        innerRadius: undefined,
        middleRadius: undefined,
        ...preset.draftPatch,
      }));
      setPreviewDetection(null);
      setPreviewDetectError(null);
      setPreviewFlowState(null);
      setPreviewHistoryRecords(null);
      setPreviewHistoryQuery({ filter: "all", limit: 20 });
      setPreviewHistoryStatusLabel(`已载入 ${preset.label}`);
      setPreviewHistoryStatusDetail("当前已填入测试图、默认议题和人工三圈比例，可直接进入解读生成。");
      setPreviewHistoryStatusTone("preview");
      setPreviewHistoryRefreshHint(null);
      setPreviewHistoryOpeningId(null);
      setRoute("upload");
    } finally {
      setFixtureLoadingId(null);
    }
  }

  return (
    <div className="browser-shell">
      <section className={`browser-shell__viewport${localDebugEnabled ? "" : " browser-shell__viewport--clean"}`}>
        {localDebugEnabled ? (
          <div className="browser-shell__devbar">
          <div className="browser-shell__devbar-copy">
            <p className="eyebrow">一镜一梳 To C</p>
            <strong>mobile-web dev shell</strong>
            <span className="muted">
              开发辅助层，正式产品界面只看手机画面。
            </span>
            <div className="browser-shell__version-badge" aria-label="当前联调壳层版本">
              <span className="browser-shell__version-label">Local Debug</span>
              <strong>v2026-04-20-layer0-first</strong>
            </div>
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

        <div className={`browser-shell__workspace${localDebugEnabled && controlsOpen ? " browser-shell__workspace--with-panel" : ""}`}>
          {localDebugEnabled && controlsOpen ? (
            <aside className="browser-shell__panel browser-shell__panel--side">
              <div className="browser-shell__panel-header">
                <h2>开发控制台</h2>
                <p className="muted">
                  这里只用于本地预览和联调，不属于正式 mobile-web 页面。
                </p>
              </div>

              <div className="browser-shell__controls">
                <div className="field">
                  <span>测试样本</span>
                  <div className="browser-shell__fixture-list">
                    {mobileWebDevFixturePresets.map((preset) => {
                      const isLoadingFixture = fixtureLoadingId === preset.id;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className="mw-secondary-button mw-secondary-button--inline browser-shell__fixture-button"
                          onClick={() => {
                            void handleApplyFixturePreset(preset.id);
                          }}
                          disabled={Boolean(fixtureLoadingId)}
                        >
                          <span>{preset.label}</span>
                          <span>{isLoadingFixture ? "载入中..." : "一键填充"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <section className="browser-shell__status-card" aria-label="当前联调状态">
                  <header className="browser-shell__status-card-header">
                    <strong>当前联调状态</strong>
                    <span>{previewMode ? "本地预览" : "真实联调"}</span>
                  </header>

                  <dl className="browser-shell__status-grid">
                    <div>
                      <dt>当前阶段</dt>
                      <dd>
                        {panelPhase === "uploading_image"
                          ? "上传图片"
                          : panelPhase === "building_request"
                            ? "整理请求"
                            : panelPhase === "requesting_report"
                              ? "请求报告"
                              : panelPhase === "waiting_report"
                                ? "等待结果"
                                : panelPhase === "report_ready"
                                  ? "报告已生成"
                                  : panelPhase === "failed"
                                    ? "失败"
                                    : "待机"}
                      </dd>
                    </div>
                    <div>
                      <dt>当前路由</dt>
                      <dd>{panelRoute}</dd>
                    </div>
                    <div>
                      <dt>生成中</dt>
                      <dd>{panelBusy ? "是" : "否"}</dd>
                    </div>
                    <div>
                      <dt>上传中</dt>
                      <dd>{panelUploading ? "是" : "否"}</dd>
                    </div>
                    <div>
                      <dt>报告阶段</dt>
                      <dd>{panelReportStage}</dd>
                    </div>
                    <div>
                      <dt>报告 ID</dt>
                      <dd>{panelReportId ?? "未生成"}</dd>
                    </div>
                    <div>
                      <dt>图片路径</dt>
                      <dd>{panelImagePath}</dd>
                    </div>
                    <div>
                      <dt>最近错误</dt>
                      <dd>{panelError ?? "无"}</dd>
                    </div>
                  </dl>
                </section>

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
                  <span>预览通道</span>
                  <select
                    value={previewChannel}
                    onChange={(event) => {
                      setPreviewChannel(event.target.value as "mobile-web" | "miniapp");
                    }}
                  >
                    <option value="mobile-web">mobile-web</option>
                    <option value="miniapp">miniapp</option>
                  </select>
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
                  <span>议题</span>
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
                    value={userIdInput}
                    onChange={(event) => {
                      commitUserIdInput(event.target.value);
                    }}
                    onBlur={() => {
                      setUserIdInput(session.canonicalUserId);
                    }}
                  />
                </label>
              </div>
            </aside>
          ) : null}

          <div className="browser-shell__phone">
          {previewMode ? (
            previewChannel === "miniapp" ? (
              <MiniappApp
                route={route as MiniappRouteId}
                mode="runtime"
                initialDraft={draft}
                initialSession={session}
              />
            ) : (
              <MobileWebApp
                {...previewProps}
                uploadDraft={draft}
                activeHistoryFilter={(previewHistoryQuery.filter as HistoryFilterId | undefined) ?? "all"}
                historyQuery={previewHistoryQuery}
                isUploading={previewFlowRunning && route === "upload"}
                historyActionBusy={
                  previewFlowRunning &&
                  (route === "history" || route === "historyRecordDetail")
                }
                activeHistoryRecordId={previewHistoryOpeningId}
                activeHistoryRecordReportType={previewHistoryOpeningReportType}
                historyStatusLabel={previewHistoryStatusLabel ?? undefined}
                historyStatusDetail={previewHistoryStatusDetail ?? undefined}
                historyStatusTone={previewHistoryStatusTone}
                historyRefreshHint={previewHistoryRefreshHint ?? undefined}
                historyRefreshBusy={previewHistoryRefreshing}
                environmentLabel={import.meta.env.DEV && route === "upload" ? "当前为本地预览模式" : undefined}
                environmentDetail={
                  import.meta.env.DEV && route === "upload"
                    ? previewFlowRunning
                      ? "当前正在尝试刷新或执行真实 Lite 主路径，请先等待 create/status/report 链路返回。"
                      : "上传页的三圈边界由用户手动调整；其它页面默认保持正式界面观感。"
                    : undefined
                }
                environmentTone={import.meta.env.DEV ? "preview" : undefined}
                detection={previewDetection}
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
                    setPreviewHistoryRefreshHint(null);
                  }
                }}
                onUploadContinue={async () => {
                  setDraft((current) => mergeMobileWebUploadDraft(current, { reportType: "lite" }));
                  setRoute("reportEntry");
                }}
                onUploadBack={() => {
                  setRoute("landing");
                }}
                onReportEntryBack={() => {
                  if ((draft.reportType ?? draft.reportVariant ?? "lite") === "pro" && previewFlowState) {
                    setDraft((current) => mergeMobileWebUploadDraft(current, { reportType: "lite" }));
                    setRoute("report");
                    return;
                  }
                  setRoute("upload");
                }}
                onReportEntryChooseReportType={async (reportType: MobileWebReportProductType) => {
                  await handlePreviewStartReport(reportType);
                }}
                onLoadingLeaveLater={() => {
                  void handlePreviewLeaveLoadingLater();
                }}
                onReportPrimaryAction={handlePreviewPrimaryAction}
                onReportSecondaryAction={handlePreviewSecondaryAction}
                onReportBackAction={handlePreviewBackAction}
                reportPrimaryDisabled={route === "loading" && previewFlowRunning}
                reportPrimaryLabel={previewReportFooterState.primaryLabel}
                reportSecondaryLabel={previewReportFooterState.secondaryLabel}
                reportFooterHint={previewReportFooterState.footerHint}
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
                onHistoryRefresh={() => {
                  void handlePreviewHistoryRefresh();
                }}
                onHistoryOpenRecord={handlePreviewOpenHistoryRecord}
                onHistoryRecordDetailBack={() => {
                  setRoute("history");
                }}
                onHistoryRecordDetailOpenReport={handlePreviewOpenHistoryRecordReport}
              />
            )
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
              onDebugStateChange={handleRuntimeDebugStateChange}
            />
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
