import { useEffect, useRef, useState } from "react";

import { MobileWebApp } from "./app";
import { resolveMobileWebCanonicalUserId } from "./identity";
import { loadHistoryPage } from "./loaders";
import type { HistoryFilterId } from "./components/history-cards";
import {
  resolveMobileWebRouteProps,
  type MobileWebRouteInput,
} from "./router-plan";
import type { MobileWebAppProps } from "./app";
import {
  pollMobileWebReportUntilReady,
  runMobileWebReportFlow,
  refreshMobileWebReport,
} from "./controller";
import { ensureUploadedImagePath } from "./upload-runtime";
import {
  applyDetection,
  getGenerationPresentation,
  initialMandalaFlowState,
  selectImage,
} from "../shared/core";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
} from "../shared/types";
import {
  getDraftReportVariant,
  hasDraftResolvedCircleRadii,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebReportProductType,
  type MobileWebUploadDraft,
} from "./state";
import {
  getGeneratedReportEntry,
  saveGeneratedReport,
} from "./generated-report-store";

export interface MobileWebRouteLoaderState {
  loading: boolean;
  error: string | null;
  props: MobileWebAppProps | null;
}

type MobileWebRuntimePhase =
  | "idle"
  | "uploading_image"
  | "building_request"
  | "requesting_report"
  | "waiting_report"
  | "report_ready"
  | "failed";

const DEFAULT_INNER_RADIUS = 0.35;
const DEFAULT_MIDDLE_RADIUS = 0.65;

export function useMobileWebRouteLoader(
  input: MobileWebRouteInput,
): MobileWebRouteLoaderState {
  const [state, setState] = useState<MobileWebRouteLoaderState>({
    loading: true,
    error: null,
    props: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({
      loading: true,
      error: null,
      props: null,
    });

    resolveMobileWebRouteProps(input)
      .then((props) => {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: null,
          props,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load mobile web route",
          props: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [input]);

  return state;
}

export interface MobileWebRuntimeProps {
  input: MobileWebRouteInput;
  loadingFallback?: React.ReactNode;
  errorFallback?: (message: string) => React.ReactNode;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onDebugStateChange?: (state: {
    route: string;
    phase: MobileWebRuntimePhase;
    isBusy: boolean;
    isUploading: boolean;
    uploadErrorMessage: string | null;
    reportStage: string | null;
    reportId: string | null;
    imagePath: string | null;
  }) => void;
}

const defaultUploadDraft: MobileWebUploadDraft = {
  imagePath: "/tmp/example-mandala.png",
  theme: "wealth",
  reportType: "lite",
  reportVariant: "lite",
  paintingIntention: "",
  paintingFeeling: "",
  innerRadius: DEFAULT_INNER_RADIUS,
  middleRadius: DEFAULT_MIDDLE_RADIUS,
};

function normalizeCircleRatio(value: number): number {
  const normalized = value <= 1 ? value : value / 100;
  return Math.max(0, Math.min(1, normalized));
}

function buildManualDetection(
  innerRadius: number,
  middleRadius: number,
): DetectCirclesResponse {
  return {
    inner_radius: normalizeCircleRatio(innerRadius),
    middle_radius: normalizeCircleRatio(middleRadius),
    confidence: 1,
    method: "manual_confirmed",
    geometry_suggestion: null,
    debug_info: null,
  };
}

function createRuntimeLoadingState(
  draft: MobileWebUploadDraft,
  detection: DetectCirclesResponse,
): MandalaFlowState {
  const selected = selectImage(initialMandalaFlowState, draft.imagePath);
  const detected = applyDetection(selected, detection);

  return {
    ...detected,
    step: "liteGenerating",
  };
}

function createHistoryRuntimeLoadingState(
  interpretationId: string,
  reportType: InterpretationVersion,
  record: InterpretationRecordResponse,
  imagePath: string | null,
): MandalaFlowState {
  const baseState = imagePath
    ? selectImage(initialMandalaFlowState, imagePath)
    : initialMandalaFlowState;

  return {
    ...baseState,
    step:
      record.status === "completed" &&
      record.generation_progress >= 100 &&
      reportType === "pro"
        ? "proReady"
        : record.status === "completed" && record.generation_progress >= 100
          ? "liteReady"
          : "liteGenerating",
    interpretation: {
      success: true,
      interpretation_id: interpretationId,
      version: reportType,
      status: record.status,
      generation_stage: record.generation_stage,
      generation_progress: record.generation_progress,
      three_circles: {
        inner_radius: record.three_circles.inner_radius,
        middle_radius: record.three_circles.middle_radius,
      },
      auto_detected: record.auto_detected,
      existing: true,
      report_ready: record.status === "completed" && record.generation_progress >= 100,
    },
    status: {
      interpretation_id: interpretationId,
      status: record.status,
      generation_stage: record.generation_stage,
      generation_progress: record.generation_progress,
      report_ready: record.status === "completed" && record.generation_progress >= 100,
      version_purchased: record.version_purchased,
      three_circles: {
        inner_radius: record.three_circles.inner_radius,
        middle_radius: record.three_circles.middle_radius,
      },
      auto_detected: record.auto_detected,
      can_upgrade: record.can_upgrade,
      image_url: record.image_url,
      storage_backend: record.storage_backend,
      storage_key: record.storage_key,
      image_local_expires_at: record.image_local_expires_at,
    },
  };
}

function getDraftFromInput(
  input: MobileWebRouteInput,
): MobileWebUploadDraft | null {
  if (input.route === "landing" || input.route === "upload" || input.route === "reportEntry" || input.route === "loading") {
    return input.params.draft;
  }

  if (
    input.route === "report" ||
    input.route === "history" ||
    input.route === "historyRecordDetail"
  ) {
    return input.params.uploadDraft ?? null;
  }

  return null;
}

function getUserIdFromInput(input: MobileWebRouteInput): string | null {
  if (
    input.route === "landing" ||
    input.route === "upload" ||
    input.route === "reportEntry" ||
    input.route === "loading" ||
    input.route === "history"
  ) {
    return resolveMobileWebCanonicalUserId(input.params);
  }

  return null;
}

function formatHistoryRefreshHint(date = new Date()): string {
  return `最近更新于 ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)}`;
}

function resolveReportFooterState(
  flowState: MandalaFlowState | undefined,
  draft: MobileWebUploadDraft | null,
): {
  primaryLabel?: string;
  secondaryLabel?: string;
  footerHint?: string;
} {
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

  if ((draft?.reportType ?? draft?.reportVariant ?? "lite") === "lite") {
    return {
      primaryLabel: "升级到 Pro 版本",
      secondaryLabel: "重新上传画作",
      footerHint: "如果你想继续深入读这幅画，可以在 Lite 基础上升级到 Pro 完整解读。",
    };
  }

  return {};
}

export function MobileWebRuntime({
  input,
  loadingFallback = "Loading mobile web route...",
  errorFallback,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onDebugStateChange,
}: MobileWebRuntimeProps) {
  const { loading, error, props } = useMobileWebRouteLoader(input);
  const [runtimeProps, setRuntimeProps] = useState<MobileWebAppProps | null>(null);
  const [runtimeBusy, setRuntimeBusy] = useState(false);
  const [runtimePhase, setRuntimePhase] =
    useState<MobileWebRuntimePhase>("idle");
  const inputUploadDraft = getDraftFromInput(input);
  const userId = getUserIdFromInput(input);
  const [runtimeUploadDraft, setRuntimeUploadDraft] = useState<MobileWebUploadDraft | null>(
    inputUploadDraft ?? null,
  );
  const [runtimeUploadDetection, setRuntimeUploadDetection] =
    useState<DetectCirclesResponse | null>(null);
  const [runtimeUploadDetecting, setRuntimeUploadDetecting] = useState(false);
  const [runtimeUploadDetectError, setRuntimeUploadDetectError] =
    useState<string | null>(null);
  const [runtimeHistoryQuery, setRuntimeHistoryQuery] =
    useState<InterpretationListQuery>({ filter: "all", limit: 20 });
  const [runtimeHistoryBusy, setRuntimeHistoryBusy] = useState(false);
  const [runtimeHistoryRefreshing, setRuntimeHistoryRefreshing] = useState(false);
  const [runtimeHistoryOpeningId, setRuntimeHistoryOpeningId] = useState<string | null>(null);
  const [runtimeHistoryOpeningReportType, setRuntimeHistoryOpeningReportType] =
    useState<InterpretationVersion | null>(null);
  const [runtimeHistoryRefreshHint, setRuntimeHistoryRefreshHint] = useState<string | null>(null);
  const liveGenerationInFlightRef = useRef(false);
  const activeRuntimeUploadDraft = runtimeUploadDraft ?? runtimeProps?.uploadDraft ?? null;

  useEffect(() => {
    setRuntimeProps(props);
  }, [props]);

  useEffect(() => {
    if (!props?.historyQuery) {
      return;
    }

    setRuntimeHistoryQuery({
      filter: props.historyQuery.filter ?? "all",
      limit: props.historyQuery.limit ?? 20,
      theme: props.historyQuery.theme,
    });
  }, [
    props?.historyQuery?.filter,
    props?.historyQuery?.limit,
    props?.historyQuery?.theme,
  ]);

  useEffect(() => {
    if (!inputUploadDraft) {
      return;
    }

    setRuntimeUploadDraft(inputUploadDraft);
    setRuntimeHistoryQuery({ filter: "all", limit: 20 });
    setRuntimeHistoryOpeningId(null);
    setRuntimeHistoryOpeningReportType(null);
    setRuntimeHistoryRefreshHint(null);
  }, [
    inputUploadDraft?.imagePath,
    inputUploadDraft?.paintingFeeling,
    inputUploadDraft?.paintingIntention,
    inputUploadDraft?.theme,
    inputUploadDraft?.uploadAsset?.runtimeImagePath,
    inputUploadDraft?.uploadAsset?.storageBackend,
    inputUploadDraft?.uploadAsset?.storageKey,
    inputUploadDraft?.uploadAsset?.imageLocalExpiresAt,
    inputUploadDraft?.uploadAsset?.imageUrl,
  ]);

  useEffect(() => {
    if (
      !runtimeProps ||
      runtimeProps.route !== "history" ||
      !userId ||
      runtimeBusy ||
      runtimeHistoryBusy ||
      runtimeHistoryRefreshing
    ) {
      return;
    }

    const activeQuery = runtimeProps.historyQuery ?? runtimeHistoryQuery;
    const historyRecords = runtimeProps.records ?? [];
    const hasPendingRecords = historyRecords.some(
      (record) => !getGenerationPresentation(record).isReady,
    );
    if (!hasPendingRecords) {
      return;
    }

    let cancelled = false;

    const refreshHistory = async () => {
      setRuntimeHistoryRefreshing(true);

      try {
        let resolvedQuery = activeQuery;
        let history = await loadHistoryPage(userId, resolvedQuery);
        let switchedToReady = false;

        if (cancelled) {
          return;
        }

        if (resolvedQuery.filter === "pending" && history.records.length === 0) {
          const readyQuery: InterpretationListQuery = {
            ...resolvedQuery,
            filter: "ready",
          };
          const readyHistory = await loadHistoryPage(userId, readyQuery);
          if (cancelled) {
            return;
          }

          if (readyHistory.records.length > 0) {
            resolvedQuery = readyQuery;
            history = readyHistory;
            switchedToReady = true;
          }
        }

        const stillPending = history.records.some(
          (record) => !getGenerationPresentation(record).isReady,
        );

        setRuntimeHistoryQuery(resolvedQuery);
        setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
        setRuntimeProps((current) => {
          if (!current || current.route !== "history") {
            return current;
          }

          return {
            route: "history",
            records: history.records,
            uploadDraft: activeRuntimeUploadDraft ?? current.uploadDraft ?? undefined,
            historyQuery: resolvedQuery,
            historyStatusLabel: switchedToReady
              ? "已有新的完整报告可查看"
              : "已自动刷新历史记录",
            historyStatusDetail: switchedToReady
              ? "刚才生成中的解读已完成，历史页已自动切到“可查看”，方便你直接打开报告。"
              : stillPending
                ? "检测到仍有生成中的解读，已为你更新最新状态。"
                : "历史记录已更新到最新状态。",
            historyStatusTone: "runtime",
          };
        });
      } catch (historyError) {
        if (cancelled) {
          return;
        }

        setRuntimeProps((current) => {
          if (!current || current.route !== "history") {
            return current;
          }

          return {
            ...current,
            historyStatusLabel: "自动刷新暂时失败",
            historyStatusDetail:
              historyError instanceof Error
                ? historyError.message
                : "Failed to refresh interpretation history",
            historyStatusTone: "runtime",
          };
        });
      } finally {
        if (!cancelled) {
          setRuntimeHistoryRefreshing(false);
        }
      }
    };

    const timer = window.setInterval(() => {
      void refreshHistory();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    activeRuntimeUploadDraft,
    runtimeBusy,
    runtimeHistoryBusy,
    runtimeHistoryQuery,
    runtimeHistoryRefreshing,
    runtimeProps,
    userId,
  ]);

  useEffect(() => {
    if (
      !runtimeProps ||
      runtimeProps.route !== "loading" ||
      liveGenerationInFlightRef.current
    ) {
      return;
    }

    const loadingState = runtimeProps.flowState;
    if (!loadingState) {
      return;
    }

    const interpretationId =
      loadingState.interpretation?.interpretation_id;
    if (!interpretationId) {
      return;
    }

    let cancelled = false;

    setRuntimeBusy(true);
    const handleTick = (snapshot: { state: MandalaFlowState }) => {
      if (!cancelled) {
        setRuntimeProps((current) => (
          current && current.route === "loading"
            ? {
                ...current,
                flowState: snapshot.state,
              }
            : current
        ));
      }
    };

    const loadingTask = pollMobileWebReportUntilReady(
      interpretationId,
      "lite",
      loadingState,
      { onTick: handleTick },
    );

    void loadingTask
      .then(async (snapshot) => {
        if (cancelled) {
          return;
        }

        if (snapshot.state.step === "liteGenerating") {
          setRuntimeProps({
            route: "loading",
            flowState: snapshot.state,
            uploadDraft: currentUploadDraft ?? undefined,
          });
          return;
        }

        setRuntimeProps({
          route: "report",
          flowState: snapshot.state,
          uploadDraft: currentUploadDraft ?? undefined,
        });
      })
      .finally(() => {
        if (!cancelled) {
          setRuntimeBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    runtimeProps?.route,
    runtimeProps?.flowState?.interpretation?.interpretation_id,
    runtimeProps?.flowState?.step,
    runtimeProps?.flowState?.report?.version,
    runtimeUploadDraft?.reportVariant,
    runtimeProps?.uploadDraft?.reportVariant,
  ]);

  useEffect(() => {
    if (!onDebugStateChange) {
      return;
    }

    onDebugStateChange({
      route: runtimeProps?.route ?? input.route,
      phase: runtimePhase,
      isBusy: runtimeBusy || runtimeUploadDetecting,
      isUploading: runtimePhase === "uploading_image",
      uploadErrorMessage: runtimeUploadDetectError,
      reportStage: runtimeProps?.flowState?.step ?? null,
      reportId: runtimeProps?.flowState?.interpretation?.interpretation_id ?? null,
      imagePath:
        activeRuntimeUploadDraft?.uploadAsset?.runtimeImagePath ??
        activeRuntimeUploadDraft?.imagePath ??
        null,
    });
  }, [
    activeRuntimeUploadDraft?.imagePath,
    activeRuntimeUploadDraft?.uploadAsset?.runtimeImagePath,
    input.route,
    onDebugStateChange,
    runtimePhase,
    runtimeBusy,
    runtimeProps?.flowState?.interpretation?.interpretation_id,
    runtimeProps?.flowState?.step,
    runtimeProps?.route,
    runtimeUploadDetectError,
    runtimeUploadDetecting,
  ]);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    if (errorFallback) {
      return <>{errorFallback(error)}</>;
    }
    return <>{error}</>;
  }

  if (!props) {
    return <>Missing mobile web props</>;
  }

  if (!runtimeProps) {
    return <>Missing runtime mobile web props</>;
  }

  const currentUploadDraft = activeRuntimeUploadDraft;
  const uploadDraftForReturn = currentUploadDraft ?? defaultUploadDraft;
  const currentRuntimeProps = runtimeProps;
  const reportFooterState = resolveReportFooterState(
    currentRuntimeProps.flowState,
    currentUploadDraft,
  );

  async function handleReportPrimaryAction() {
    if (!currentRuntimeProps.flowState || runtimeBusy) {
      return;
    }

    const interpretationId =
      currentRuntimeProps.flowState.interpretation?.interpretation_id;

    if (currentRuntimeProps.route === "loading") {
      if (!interpretationId) {
        return;
      }

      setRuntimeBusy(true);
      try {
        const refreshed = await refreshMobileWebReport(
          interpretationId,
          "lite",
          currentRuntimeProps.flowState,
        );
        setRuntimeProps({
          route: refreshed.state.step === "liteGenerating" ? "loading" : "report",
          flowState: refreshed.state,
          uploadDraft: currentUploadDraft ?? undefined,
        });
      } finally {
        setRuntimeBusy(false);
      }
      return;
    }

    if (currentRuntimeProps.route === "report") {
      if (currentRuntimeProps.flowState.step === "error") {
        if (!interpretationId) {
          return;
        }

        setRuntimeBusy(true);
        try {
          const refreshed = await refreshMobileWebReport(
            interpretationId,
            "lite",
            currentRuntimeProps.flowState,
          );
          setRuntimeProps({
            route: refreshed.state.step === "liteGenerating" ? "loading" : "report",
            flowState: refreshed.state,
            uploadDraft: currentUploadDraft ?? undefined,
          });
        } finally {
          setRuntimeBusy(false);
        }
        return;
      }

      const isProReport =
        currentRuntimeProps.flowState.report?.version === "pro" ||
        currentRuntimeProps.flowState.step === "proReady";
      const isLiteDraft =
        (currentUploadDraft?.reportType ??
          currentUploadDraft?.reportVariant ??
          "lite") === "lite";

      if (!isProReport && isLiteDraft) {
        const nextDraft = mergeMobileWebUploadDraft(
          currentUploadDraft ?? uploadDraftForReturn,
          {
            reportType: "pro",
          },
        );
        setRuntimeUploadDraft(nextDraft);
        setRuntimeProps({
          route: "reportEntry",
          uploadDraft: nextDraft,
          flowState: currentRuntimeProps.flowState,
        });
        return;
      }

      setRuntimeProps({
        route: "upload",
        uploadDraft: currentUploadDraft ?? uploadDraftForReturn,
      });
      return;
    }

  }

  async function handleHistoryFilterChange(filter: HistoryFilterId) {
    const nextQuery: InterpretationListQuery = {
      ...runtimeHistoryQuery,
      filter,
    };

    if (!userId || runtimeHistoryBusy || filter === runtimeHistoryQuery.filter) {
      setRuntimeHistoryQuery(nextQuery);
      return;
    }

    setRuntimeHistoryBusy(true);
    setRuntimeHistoryQuery(nextQuery);
    try {
      const history = await loadHistoryPage(userId, nextQuery);
      setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
      setRuntimeProps({
        route: "history",
        records: history.records,
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "当前显示真实历史记录",
        historyStatusDetail: `历史页已按“${filter === "all" ? "全部" : filter === "ready" ? "可查看" : "生成中"}”筛选重新请求真实记录。`,
        historyStatusTone: "runtime",
      });
    } catch (historyError) {
      setRuntimeProps({
        route: "history",
        records: [],
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "真实历史记录拉取失败",
        historyStatusDetail:
          historyError instanceof Error
            ? historyError.message
            : "Failed to load interpretation history",
        historyStatusTone: "runtime",
      });
    } finally {
      setRuntimeHistoryBusy(false);
    }
  }

  async function handleHistoryThemeChange(theme?: string) {
    const nextQuery: InterpretationListQuery = {
      ...runtimeHistoryQuery,
      theme,
    };

    if (!userId || runtimeHistoryBusy || theme === runtimeHistoryQuery.theme) {
      setRuntimeHistoryQuery(nextQuery);
      return;
    }

    setRuntimeHistoryBusy(true);
    setRuntimeHistoryQuery(nextQuery);
    try {
      const history = await loadHistoryPage(userId, nextQuery);
      setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
      setRuntimeProps({
        route: "history",
        records: history.records,
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "当前显示真实历史记录",
        historyStatusDetail: `历史页已按${theme ? `议题“${theme}”` : "全部议题"}重新请求真实记录。`,
        historyStatusTone: "runtime",
      });
    } catch (historyError) {
      setRuntimeProps({
        route: "history",
        records: [],
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "真实历史记录拉取失败",
        historyStatusDetail:
          historyError instanceof Error
            ? historyError.message
            : "Failed to load interpretation history",
        historyStatusTone: "runtime",
      });
    } finally {
      setRuntimeHistoryBusy(false);
    }
  }

  async function handleHistoryLimitChange(limit: number) {
    const nextQuery: InterpretationListQuery = {
      ...runtimeHistoryQuery,
      limit,
    };

    if (!userId || runtimeHistoryBusy || limit === runtimeHistoryQuery.limit) {
      setRuntimeHistoryQuery(nextQuery);
      return;
    }

    setRuntimeHistoryBusy(true);
    setRuntimeHistoryQuery(nextQuery);
    try {
      const history = await loadHistoryPage(userId, nextQuery);
      setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
      setRuntimeProps({
        route: "history",
        records: history.records,
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "当前显示真实历史记录",
        historyStatusDetail: `历史页已按显示 ${limit} 条重新请求真实记录。`,
        historyStatusTone: "runtime",
      });
    } catch (historyError) {
      setRuntimeProps({
        route: "history",
        records: [],
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "真实历史记录拉取失败",
        historyStatusDetail:
          historyError instanceof Error
            ? historyError.message
            : "Failed to load interpretation history",
        historyStatusTone: "runtime",
      });
    } finally {
      setRuntimeHistoryBusy(false);
    }
  }

  async function handleHistoryRefresh() {
    if (!userId || runtimeBusy || runtimeHistoryBusy || runtimeHistoryRefreshing) {
      return;
    }

    const nextQuery =
      currentRuntimeProps.route === "history"
        ? (currentRuntimeProps.historyQuery ?? runtimeHistoryQuery)
        : runtimeHistoryQuery;

    setRuntimeHistoryBusy(true);
    try {
      const history = await loadHistoryPage(userId, nextQuery);
      setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
      setRuntimeProps({
        route: "history",
        records: history.records,
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "已手动刷新历史记录",
        historyStatusDetail: "当前已按现有筛选条件重新请求真实历史记录。",
        historyStatusTone: "runtime",
      });
    } catch (historyError) {
      setRuntimeProps((current) => (
        current && current.route === "history"
          ? {
              ...current,
              historyStatusLabel: "手动刷新失败",
              historyStatusDetail:
                historyError instanceof Error
                  ? historyError.message
                  : "Failed to load interpretation history",
              historyStatusTone: "runtime",
            }
          : current
      ));
    } finally {
      setRuntimeHistoryBusy(false);
    }
  }

  function findHistoryRecord(
    interpretationId: string,
  ): InterpretationRecordResponse | null {
    const records = currentRuntimeProps.records ?? [];
    return records.find((record) => record.interpretation_id === interpretationId) ?? null;
  }

  async function handleHistoryOpenRecord(
    interpretationId: string,
  ) {
    if (runtimeBusy || runtimeHistoryBusy) {
      return;
    }

    setRuntimeHistoryOpeningId(interpretationId);
    try {
      const record = findHistoryRecord(interpretationId);
      if (!record) {
        return;
      }
      const entry = getGeneratedReportEntry(interpretationId);
      if (entry) {
        setRuntimeUploadDraft(entry.draft);
      }

      setRuntimeProps({
        ...currentRuntimeProps,
        route: "historyRecordDetail",
        record,
        uploadDraft: entry?.draft ?? currentUploadDraft ?? undefined,
      });
    } finally {
      setRuntimeHistoryOpeningId(null);
    }
  }

  function handleReportSecondaryAction() {
    if (currentRuntimeProps.route === "loading") {
      setRuntimeProps({
        route: "upload",
        uploadDraft: uploadDraftForReturn,
      });
      return;
    }

    setRuntimeProps({
      route: "upload",
      uploadDraft: uploadDraftForReturn,
    });
  }

  function handleReportBackAction() {
    setRuntimeProps({
      route: "report",
      flowState: currentRuntimeProps.flowState,
      uploadDraft: uploadDraftForReturn,
    });
  }

  function handleHistoryBackToUpload() {
    setRuntimeProps({
      route: "upload",
      uploadDraft: uploadDraftForReturn,
    });
  }

  function handleHistoryRecordDetailBack() {
    setRuntimeHistoryOpeningReportType(null);
    setRuntimeProps({
      route: "history",
      records: currentRuntimeProps.records ?? [],
      uploadDraft: uploadDraftForReturn,
      historyQuery: runtimeHistoryQuery,
      historyStatusLabel: "已返回历史记录",
      historyStatusDetail: "你可以继续切换其他记录，或刷新查看最新状态。",
      historyStatusTone: "runtime",
    });
  }

  async function handleHistoryRecordDetailOpenReport(
    reportType: InterpretationVersion,
  ) {
    if (
      runtimeBusy ||
      runtimeHistoryBusy ||
      currentRuntimeProps.route !== "historyRecordDetail"
    ) {
      return;
    }

    const recordToOpen = currentRuntimeProps.record;
    if (!recordToOpen) {
      return;
    }

    const interpretationId = recordToOpen.interpretation_id;
    const imagePath =
      getGeneratedReportEntry(interpretationId)?.draft.uploadAsset?.runtimeImagePath ??
      getGeneratedReportEntry(interpretationId)?.draft.imagePath ??
      currentUploadDraft?.uploadAsset?.runtimeImagePath ??
      currentUploadDraft?.imagePath ??
      null;
    const storedDraft = getGeneratedReportEntry(interpretationId)?.draft;
    const nextDraft = mergeMobileWebUploadDraft(
      storedDraft ?? currentUploadDraft ?? uploadDraftForReturn,
      {
        reportType,
      },
    );

    setRuntimeHistoryOpeningReportType(reportType);
    setRuntimeUploadDraft(nextDraft);
    setRuntimeBusy(true);
    setRuntimePhase("waiting_report");
    setRuntimeProps({
      ...currentRuntimeProps,
      route: "loading",
      flowState: createHistoryRuntimeLoadingState(
        interpretationId,
        reportType,
        recordToOpen,
        imagePath,
      ),
      uploadDraft: nextDraft,
    });

    try {
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        reportType,
        createHistoryRuntimeLoadingState(
          interpretationId,
          reportType,
          recordToOpen,
          imagePath,
        ),
      );
      setRuntimeProps({
        route:
          refreshed.state.step === "liteGenerating" ||
          (reportType === "pro" && refreshed.state.step !== "proReady")
            ? "loading"
            : "report",
        flowState: refreshed.state,
        uploadDraft: nextDraft,
      });
      setRuntimePhase(
        refreshed.state.step === "error"
          ? "failed"
          : refreshed.state.step === "liteGenerating"
            ? "waiting_report"
            : "report_ready",
      );
    } finally {
      setRuntimeHistoryOpeningReportType(null);
      setRuntimeBusy(false);
    }
  }

  async function handleUploadContinue(forcedDraft?: MobileWebUploadDraft | null) {
    if (runtimeBusy) {
      return;
    }

    const draftToUse = forcedDraft ?? currentUploadDraft;

    if (!draftToUse) {
      return;
    }
    if (!userId) {
      setRuntimeUploadDetectError("Missing user id for mobile web runtime");
      return;
    }

    let resolvedDetection: DetectCirclesResponse;

    setRuntimeBusy(true);
    setRuntimePhase("uploading_image");
    setRuntimeUploadDetecting(true);
    setRuntimeUploadDetectError(null);
    liveGenerationInFlightRef.current = true;

    try {
      const resolvedImagePath = await ensureUploadedImagePath(
        draftToUse,
        (uploaded) => {
          setRuntimeUploadDraft((current) => (
            current
              ? {
                  ...current,
                  uploadAsset: toMobileWebUploadAssetRef(uploaded),
                }
              : current
          ));
        },
      );
      const nextAssetRef = toMobileWebUploadAssetRef(resolvedImagePath);
      setRuntimePhase("building_request");
      resolvedDetection =
        typeof draftToUse.innerRadius === "number" &&
        !Number.isNaN(draftToUse.innerRadius) &&
        typeof draftToUse.middleRadius === "number" &&
        !Number.isNaN(draftToUse.middleRadius)
          ? buildManualDetection(draftToUse.innerRadius, draftToUse.middleRadius)
          : (() => {
              throw new Error("请先手动确认三圈边界，再生成财富关系报告。");
            })();
      setRuntimeUploadDetection(resolvedDetection);
      setRuntimeProps({
        route: "loading",
        flowState: createRuntimeLoadingState(
          {
            ...draftToUse,
            uploadAsset: nextAssetRef,
          },
          resolvedDetection,
        ),
        uploadDraft: {
          ...draftToUse,
          uploadAsset: nextAssetRef,
        },
      });

      setRuntimePhase("requesting_report");
      const result = await runMobileWebReportFlow(
        toStartCreatePayload(
          {
            ...draftToUse,
            uploadAsset: nextAssetRef,
            innerRadius: resolvedDetection.inner_radius,
            middleRadius: resolvedDetection.middle_radius,
          },
          userId,
        ),
        getDraftReportVariant(draftToUse),
      );
      const nextDraft = {
        ...draftToUse,
        uploadAsset: nextAssetRef,
      };
      saveGeneratedReport({
        userId,
        draft: nextDraft,
        state: result.state,
      });
      setRuntimeProps({
        route: result.state.step === "liteGenerating" ? "loading" : "report",
        flowState: result.state,
        uploadDraft: nextDraft,
      });
      setRuntimePhase(result.state.step === "liteGenerating" ? "waiting_report" : "report_ready");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to continue upload";
      setRuntimeUploadDetectError(message);
      setRuntimeProps({
        route: "upload",
        uploadDraft: draftToUse,
      });
      setRuntimePhase("failed");
    } finally {
      setRuntimeUploadDetecting(false);
      setRuntimeBusy(false);
      liveGenerationInFlightRef.current = false;
    }
  }

  return (
    <MobileWebApp
      {...runtimeProps}
      onLandingStart={() => {
        setRuntimeProps({
          route: "upload",
          uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft ?? defaultUploadDraft,
        });
      }}
      onLandingOpenHistory={() => {
        if (!userId) {
          setRuntimeProps({
            route: "upload",
            uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft ?? defaultUploadDraft,
          });
          return;
        }

        setRuntimeHistoryBusy(true);
        void loadHistoryPage(userId, runtimeHistoryQuery)
          .then((history) => {
            setRuntimeHistoryRefreshHint(formatHistoryRefreshHint());
            setRuntimeProps({
              route: "history",
              records: history.records,
              uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft ?? undefined,
              historyQuery: runtimeHistoryQuery,
              historyStatusLabel: "当前显示真实历史记录",
              historyStatusDetail: "历史页已按当前查询条件请求真实记录。",
              historyStatusTone: "runtime",
            });
          })
          .catch((historyError) => {
            setRuntimeProps({
              route: "history",
              records: [],
              uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft ?? undefined,
              historyQuery: runtimeHistoryQuery,
              historyStatusLabel: "真实历史记录拉取失败",
              historyStatusDetail:
                historyError instanceof Error
                  ? historyError.message
                  : "Failed to load interpretation history",
              historyStatusTone: "runtime",
            });
          })
          .finally(() => {
            setRuntimeHistoryBusy(false);
          });
      }}
      uploadDraft={currentUploadDraft ?? runtimeProps.uploadDraft}
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      isUploading={runtimeBusy}
      uploadErrorMessage={runtimeUploadDetectError}
      detection={runtimeUploadDetection}
      onUploadDraftChange={(patch) => {
        setRuntimeUploadDetectError(null);
        setRuntimeUploadDraft((current) =>
          mergeMobileWebUploadDraft(current ?? defaultUploadDraft, patch),
        );
      }}
      onUploadBack={() => {
        setRuntimeUploadDetectError(null);
        setRuntimeProps({
          route: "landing",
          uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft,
        });
      }}
      onUploadContinue={() => {
        setRuntimeUploadDetectError(null);
        const nextDraft = mergeMobileWebUploadDraft(
          runtimeUploadDraft ?? runtimeProps.uploadDraft ?? defaultUploadDraft,
          {
            reportType: "lite",
          },
        );
        setRuntimeUploadDraft(nextDraft);
        if (!hasDraftResolvedCircleRadii(nextDraft)) {
          return;
        }
        setRuntimeProps({
          route: "reportEntry",
          uploadDraft: nextDraft,
        });
      }}
      onReportEntryBack={() => {
        const isProPayment =
          (runtimeUploadDraft?.reportType ??
            runtimeUploadDraft?.reportVariant ??
            "lite") === "pro";

        if (isProPayment && runtimeProps.flowState) {
          const nextDraft = mergeMobileWebUploadDraft(
            runtimeUploadDraft ?? uploadDraftForReturn,
            {
              reportType: "lite",
            },
          );
          setRuntimeUploadDraft(nextDraft);
          setRuntimeProps({
            route: "report",
            flowState: runtimeProps.flowState,
            uploadDraft: nextDraft,
          });
          return;
        }

        setRuntimeProps({
          route: "upload",
          uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft,
        });
      }}
      onReportEntryChooseReportType={(reportType: MobileWebReportProductType) => {
        const nextDraft = mergeMobileWebUploadDraft(
          runtimeUploadDraft ?? runtimeProps.uploadDraft ?? defaultUploadDraft,
          {
            reportType,
          },
        );
        setRuntimeUploadDraft(nextDraft);
        void handleUploadContinue(nextDraft);
      }}
      onLoadingLeaveLater={undefined}
      onReportPrimaryAction={handleReportPrimaryAction}
      onReportSecondaryAction={handleReportSecondaryAction}
      onReportBackAction={handleReportBackAction}
      reportPrimaryDisabled={runtimeBusy}
      reportPrimaryLabel={reportFooterState.primaryLabel}
      reportSecondaryLabel={reportFooterState.secondaryLabel}
      reportFooterHint={reportFooterState.footerHint}
      onHistoryBackToUpload={handleHistoryBackToUpload}
      historyQuery={runtimeProps.historyQuery ?? runtimeHistoryQuery}
      activeHistoryFilter={(runtimeProps.historyQuery?.filter as HistoryFilterId | undefined) ?? (runtimeHistoryQuery.filter as HistoryFilterId | undefined) ?? "all"}
      historyFilterBusy={runtimeHistoryBusy}
      historyActionBusy={
        runtimeBusy &&
        (currentRuntimeProps.route === "history" || currentRuntimeProps.route === "historyRecordDetail")
      }
      activeHistoryRecordId={runtimeHistoryOpeningId}
      activeHistoryRecordReportType={runtimeHistoryOpeningReportType}
      historyRefreshHint={runtimeHistoryRefreshHint ?? undefined}
      historyRefreshBusy={runtimeHistoryBusy || runtimeHistoryRefreshing}
      onHistoryFilterChange={handleHistoryFilterChange}
      onHistoryThemeChange={handleHistoryThemeChange}
      onHistoryLimitChange={handleHistoryLimitChange}
      onHistoryRefresh={handleHistoryRefresh}
      onHistoryOpenRecord={handleHistoryOpenRecord}
      onHistoryRecordDetailBack={handleHistoryRecordDetailBack}
      onHistoryRecordDetailOpenReport={handleHistoryRecordDetailOpenReport}
    />
  );
}
