import { useEffect, useState } from "react";

import { MobileWebApp } from "./app";
import { loadHistoryPage } from "./loaders";
import type { HistoryFilterId } from "./components/history-cards";
import {
  resolveMobileWebRouteProps,
  type MobileWebRouteInput,
} from "./router-plan";
import type { MobileWebAppProps } from "./app";
import {
  openMobileWebUpgradeEntry,
  pollMobileWebReportUntilReady,
  runMobileWebLiteFlow,
  refreshMobileWebReport,
} from "./controller";
import { detectCircles, uploadImage } from "../shared/api";
import { applyDetection, initialMandalaFlowState, selectImage } from "../shared/core";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  MandalaFlowState,
} from "../shared/types";
import type { UploadImageResponse } from "../shared/types";
import {
  getDraftUploadImageResponse,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebUploadDraft,
} from "./state";

export interface MobileWebRouteLoaderState {
  loading: boolean;
  error: string | null;
  props: MobileWebAppProps | null;
}

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
}

const defaultUploadDraft: MobileWebUploadDraft = {
  imagePath: "/tmp/example-mandala.png",
  theme: "general",
  paintingIntention: "",
  paintingFeeling: "",
};

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

async function ensureUploadedImagePath(
  draft: MobileWebUploadDraft,
  onResolved: (uploaded: UploadImageResponse) => void,
): Promise<UploadImageResponse> {
  const existingUpload = getDraftUploadImageResponse(draft);
  if (existingUpload) {
    return existingUpload;
  }

  if (draft.browserFile) {
    const uploaded = await uploadImage(draft.browserFile);
    onResolved(uploaded);
    return uploaded;
  }

  const fallbackUpload = {
    success: true,
    image_path: draft.imagePath,
    storage_backend: "path",
    storage_key: draft.imagePath,
    original_filename: draft.imagePath.split("/").pop() || draft.imagePath,
    content_type: null,
    size_bytes: 0,
    image_url: null,
  };
  onResolved(fallbackUpload);
  return fallbackUpload;
}

function getDraftFromInput(
  input: MobileWebRouteInput,
): MobileWebUploadDraft | null {
  if (input.route === "upload" || input.route === "loading") {
    return input.params.draft;
  }

  if (input.route === "report" || input.route === "history" || input.route === "upgrade") {
    return input.params.uploadDraft ?? null;
  }

  return null;
}

function getUserIdFromInput(input: MobileWebRouteInput): string | null {
  if (input.route === "upload" || input.route === "loading" || input.route === "history") {
    return input.params.userId ?? null;
  }

  return null;
}

export function MobileWebRuntime({
  input,
  loadingFallback = "Loading mobile web route...",
  errorFallback,
  environmentLabel = "当前为联调运行时",
  environmentDetail = "页面会按当前 loader 和接口装配真实路由结果，具体表现取决于本地后端是否可用。",
  environmentTone = "runtime",
}: MobileWebRuntimeProps) {
  const { loading, error, props } = useMobileWebRouteLoader(input);
  const [runtimeProps, setRuntimeProps] = useState<MobileWebAppProps | null>(null);
  const [runtimeBusy, setRuntimeBusy] = useState(false);
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
  const [runtimeHistoryOpeningId, setRuntimeHistoryOpeningId] = useState<string | null>(null);

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
    setRuntimeUploadDetection(null);
    setRuntimeUploadDetecting(false);
    setRuntimeUploadDetectError(null);
    setRuntimeHistoryQuery({ filter: "all", limit: 20 });
    setRuntimeHistoryOpeningId(null);
  }, [
    inputUploadDraft?.imagePath,
    inputUploadDraft?.paintingFeeling,
    inputUploadDraft?.paintingIntention,
    inputUploadDraft?.theme,
    inputUploadDraft?.uploadAsset?.runtimeImagePath,
    inputUploadDraft?.uploadAsset?.storageBackend,
    inputUploadDraft?.uploadAsset?.storageKey,
    inputUploadDraft?.uploadAsset?.imageUrl,
  ]);

  useEffect(() => {
    if (
      !runtimeProps ||
      runtimeProps.route !== "loading" ||
      runtimeProps.flowState?.step !== "liteGenerating"
    ) {
      return;
    }

    const interpretationId =
      runtimeProps.flowState.interpretation?.interpretation_id;
    if (!interpretationId) {
      return;
    }

    let cancelled = false;

    setRuntimeBusy(true);
    void pollMobileWebReportUntilReady(
      interpretationId,
      runtimeProps.flowState,
      {
        onTick: (snapshot) => {
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
        },
      },
    )
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        setRuntimeProps({
          route: snapshot.state.step === "liteGenerating" ? "loading" : "report",
          flowState: snapshot.state,
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

  const currentRuntimeProps = runtimeProps;
  const currentUploadDraft = runtimeUploadDraft ?? runtimeProps.uploadDraft ?? null;
  const uploadDraftForReturn = currentUploadDraft ?? defaultUploadDraft;

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

    if (
      currentRuntimeProps.route === "report" ||
      currentRuntimeProps.route === "upgrade"
    ) {
      if (currentRuntimeProps.flowState.step === "error") {
        if (!interpretationId) {
          return;
        }

        setRuntimeBusy(true);
        try {
          const refreshed = await refreshMobileWebReport(
            interpretationId,
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

      const canOpenUpgrade = Boolean(
        currentRuntimeProps.route === "report" &&
        interpretationId &&
        (currentRuntimeProps.flowState.report?.can_upgrade ||
          currentRuntimeProps.flowState.status?.can_upgrade)
      );

      if (canOpenUpgrade && interpretationId) {
        setRuntimeBusy(true);
        try {
          const upgraded = await openMobileWebUpgradeEntry(
            interpretationId,
            currentRuntimeProps.flowState,
          );
          setRuntimeProps({
            route: "upgrade",
            flowState: upgraded.state,
            uploadDraft: currentUploadDraft ?? undefined,
          });
        } finally {
          setRuntimeBusy(false);
        }
        return;
      }

      if (userId) {
        setRuntimeBusy(true);
        try {
          const history = await loadHistoryPage(userId, runtimeHistoryQuery);
          setRuntimeProps({
            route: "history",
            records: history.records,
            uploadDraft: currentUploadDraft ?? undefined,
            historyQuery: runtimeHistoryQuery,
            historyStatusLabel: "当前显示真实历史记录",
            historyStatusDetail: "结果页已通过当前 runtime 拉取真实历史列表。",
            historyStatusTone: "runtime",
          });
        } catch (historyError) {
          setRuntimeProps({
            route: "history",
            records: [],
            uploadDraft: currentUploadDraft ?? undefined,
            historyQuery: runtimeHistoryQuery,
            historyStatusLabel: "真实历史记录拉取失败",
            historyStatusDetail:
              historyError instanceof Error
                ? historyError.message
                : "Failed to load interpretation history",
            historyStatusTone: "runtime",
          });
        } finally {
          setRuntimeBusy(false);
        }
        return;
      }

      if (!interpretationId) {
        return;
      }

      setRuntimeBusy(true);
      try {
        const refreshed = await refreshMobileWebReport(
          interpretationId,
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
      setRuntimeProps({
        route: "history",
        records: history.records,
        uploadDraft: currentUploadDraft ?? undefined,
        historyQuery: nextQuery,
        historyStatusLabel: "当前显示真实历史记录",
        historyStatusDetail: `历史页已按${theme ? `主题“${theme}”` : "全部主题"}重新请求真实记录。`,
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

  async function handleHistoryOpenRecord(
    interpretationId: string,
    canOpenReport: boolean,
  ) {
    if (runtimeBusy || runtimeHistoryBusy) {
      return;
    }

    setRuntimeBusy(true);
    setRuntimeHistoryOpeningId(interpretationId);
    try {
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        initialMandalaFlowState,
      );
      setRuntimeProps({
        route:
          canOpenReport || refreshed.state.step !== "liteGenerating"
            ? "report"
            : "loading",
        flowState: refreshed.state,
        uploadDraft: currentUploadDraft ?? undefined,
      });
    } finally {
      setRuntimeHistoryOpeningId(null);
      setRuntimeBusy(false);
    }
  }

  function handleReportSecondaryAction() {
    setRuntimeProps({
      route: "upload",
      uploadDraft: uploadDraftForReturn,
    });
  }

  function handleHistoryBackToUpload() {
    setRuntimeProps({
      route: "upload",
      uploadDraft: uploadDraftForReturn,
    });
  }

  async function handleUploadPreviewDetect() {
    if (!currentUploadDraft?.imagePath) {
      setRuntimeUploadDetectError("请先选择一张画作，再触发三圈检测。");
      return;
    }

    setRuntimeUploadDetecting(true);
    setRuntimeUploadDetectError(null);

    try {
      const resolvedImagePath = await ensureUploadedImagePath(
        currentUploadDraft,
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
      const detection = await detectCircles({
        image_path: resolvedImagePath.image_path,
      });
      setRuntimeUploadDetection(detection);
    } catch (detectError) {
      setRuntimeUploadDetection(null);
      setRuntimeUploadDetectError(
        detectError instanceof Error ? detectError.message : "三圈检测失败",
      );
    } finally {
      setRuntimeUploadDetecting(false);
    }
  }

  async function handleUploadContinue() {
    if (runtimeBusy) {
      return;
    }

    if (!runtimeUploadDetection) {
      setRuntimeUploadDetectError("请先完成三圈检测，再进入当前解读流程。");
      return;
    }

    if (!currentUploadDraft) {
      setRuntimeUploadDetectError("当前 runtime 缺少上传草稿，暂时无法继续。");
      return;
    }

    if (!userId) {
      setRuntimeUploadDetectError("当前 runtime 缺少 userId，暂时无法创建真实解读。");
      return;
    }

    setRuntimeBusy(true);
    setRuntimeUploadDetectError(null);

    try {
      const resolvedImagePath = await ensureUploadedImagePath(
        currentUploadDraft,
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
      setRuntimeProps({
        route: "loading",
        flowState: createRuntimeLoadingState(
          {
            ...currentUploadDraft,
            uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
          },
          runtimeUploadDetection,
        ),
        uploadDraft: {
          ...currentUploadDraft,
          uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
        },
      });

      const result = await runMobileWebLiteFlow(
        toStartCreatePayload(
          {
            ...currentUploadDraft,
            uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
            innerRadius: runtimeUploadDetection.inner_radius,
            middleRadius: runtimeUploadDetection.middle_radius,
          },
          userId,
        ),
      );

      setRuntimeProps({
        route: result.state.step === "liteGenerating" ? "loading" : "report",
        flowState: result.state,
        uploadDraft: {
          ...currentUploadDraft,
          uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
        },
      });
    } finally {
      setRuntimeBusy(false);
    }
  }

  return (
    <MobileWebApp
      {...runtimeProps}
      uploadDraft={runtimeProps.uploadDraft}
      uploadDetection={
        runtimeProps.route === "upload" ? runtimeUploadDetection : runtimeProps.uploadDetection
      }
      uploadDetecting={runtimeProps.route === "upload" ? runtimeUploadDetecting : false}
      uploadDetectError={
        runtimeProps.route === "upload" ? runtimeUploadDetectError : runtimeProps.uploadDetectError
      }
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      onUploadDraftChange={(patch) => {
        setRuntimeUploadDraft((current) =>
          mergeMobileWebUploadDraft(current ?? defaultUploadDraft, patch),
        );
        if (
          patch.imagePath !== undefined ||
          patch.theme !== undefined ||
          patch.paintingFeeling !== undefined ||
          patch.paintingIntention !== undefined
        ) {
          setRuntimeUploadDetection(null);
          setRuntimeUploadDetectError(null);
        }
      }}
      onUploadContinue={handleUploadContinue}
      onUploadPreviewDetect={handleUploadPreviewDetect}
      onReportPrimaryAction={handleReportPrimaryAction}
      onReportSecondaryAction={handleReportSecondaryAction}
      reportPrimaryDisabled={runtimeBusy}
      onHistoryBackToUpload={handleHistoryBackToUpload}
      historyQuery={runtimeProps.historyQuery ?? runtimeHistoryQuery}
      activeHistoryFilter={(runtimeProps.historyQuery?.filter as HistoryFilterId | undefined) ?? (runtimeHistoryQuery.filter as HistoryFilterId | undefined) ?? "all"}
      historyFilterBusy={runtimeHistoryBusy}
      historyActionBusy={runtimeBusy && currentRuntimeProps.route === "history"}
      activeHistoryRecordId={runtimeHistoryOpeningId}
      onHistoryFilterChange={handleHistoryFilterChange}
      onHistoryThemeChange={handleHistoryThemeChange}
      onHistoryLimitChange={handleHistoryLimitChange}
      onHistoryOpenRecord={handleHistoryOpenRecord}
    />
  );
}
