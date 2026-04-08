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
  pollMobileWebProReportUntilReady,
  pollMobileWebReportUntilReady,
  refreshMobileWebProReport,
  runMobileWebLiteFlow,
  refreshMobileWebReport,
} from "./controller";
import { ensureUploadedImagePath } from "./upload-runtime";
import { detectCircles } from "../shared/api";
import {
  applyDetection,
  getLiteStructuredReport,
  hasProReportAccess,
  initialMandalaFlowState,
  resolveSelfUnderstandingReportCta,
  selectImage,
} from "../shared/core";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  MandalaFlowState,
} from "../shared/types";
import {
  getDraftReportVariant,
  inferReportTypeFromVariant,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebReportProductType,
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
  reportType: "self_understanding",
  reportVariant: "lite",
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
function getDraftFromInput(
  input: MobileWebRouteInput,
): MobileWebUploadDraft | null {
  if (input.route === "landing" || input.route === "upload" || input.route === "reportEntry" || input.route === "loading") {
    return input.params.draft;
  }

  if (input.route === "report" || input.route === "reportLegacy" || input.route === "history" || input.route === "upgrade") {
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
      runtimeProps.route !== "loading"
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

    const selectedVariant = getDraftReportVariant(
      runtimeUploadDraft ?? runtimeProps.uploadDraft ?? defaultUploadDraft,
    );

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

    const loadingTask = selectedVariant === "pro"
      ? (async () => {
          const liteSnapshot = loadingState.step === "liteGenerating"
            ? await pollMobileWebReportUntilReady(
                interpretationId,
                loadingState,
                { onTick: handleTick },
              )
            : { state: loadingState };

          if (liteSnapshot.state.step === "liteGenerating" || liteSnapshot.state.step === "error") {
            return liteSnapshot;
          }

          if (hasProReportAccess(liteSnapshot.state)) {
            return pollMobileWebProReportUntilReady(
              interpretationId,
              liteSnapshot.state,
              { onTick: handleTick },
            );
          }

          const upgradeSnapshot =
            liteSnapshot.state.step === "upgradePlaceholder"
              ? liteSnapshot
              : await openMobileWebUpgradeEntry(interpretationId, liteSnapshot.state);

          handleTick(upgradeSnapshot);

          return pollMobileWebProReportUntilReady(
            interpretationId,
            upgradeSnapshot.state,
            { onTick: handleTick },
          );
        })()
      : pollMobileWebReportUntilReady(
          interpretationId,
          loadingState,
          { onTick: handleTick },
        );

    void loadingTask
      .then(async (snapshot) => {
        if (cancelled) {
          return;
        }

        if (selectedVariant === "pro") {
          const proReady =
            snapshot.report?.version === "pro" &&
            typeof snapshot.report.report === "string" &&
            snapshot.report.report.trim();

          if (snapshot.state.step === "error") {
            setRuntimeProps({
              route: "upgrade",
              flowState: snapshot.state,
              uploadDraft: currentUploadDraft ?? undefined,
            });
            return;
          }

          if (!proReady) {
            setRuntimeProps({
              route: "loading",
              flowState: snapshot.state,
              uploadDraft: currentUploadDraft ?? undefined,
            });
            return;
          }

          setRuntimeProps({
            route: "upgrade",
            flowState: snapshot.state,
            uploadDraft: currentUploadDraft ?? undefined,
          });
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

        await finalizeSelectedReport(
          interpretationId,
          snapshot.state,
          currentUploadDraft,
        );
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

  async function finalizeSelectedReport(
    interpretationId: string,
    state: MandalaFlowState,
    draft: MobileWebUploadDraft | null,
  ) {
    if (getDraftReportVariant(draft ?? defaultUploadDraft) === "pro" && interpretationId) {
      const upgraded = await openMobileWebUpgradeEntry(interpretationId, state);
      const proReport = await refreshMobileWebProReport(interpretationId, upgraded.state);
      const proReady =
        proReport.report?.version === "pro" &&
        typeof proReport.report.report === "string" &&
        proReport.report.report.trim();

      if (!proReady) {
        setRuntimeProps({
          route: "loading",
          flowState: proReport.state,
          uploadDraft: draft ?? undefined,
        });
        return;
      }

      setRuntimeProps({
        route: "upgrade",
        flowState: proReport.state,
        uploadDraft: draft ?? undefined,
      });
      return;
    }

    setRuntimeProps({
      route: "report",
      flowState: state,
      uploadDraft: draft ?? undefined,
    });
  }

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
        if (refreshed.state.step === "liteGenerating") {
          setRuntimeProps({
            route: "loading",
            flowState: refreshed.state,
            uploadDraft: currentUploadDraft ?? undefined,
          });
        } else {
          await finalizeSelectedReport(
            interpretationId,
            refreshed.state,
            currentUploadDraft,
          );
        }
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
            currentRuntimeProps.flowState,
          );
          if (refreshed.state.step === "liteGenerating") {
            setRuntimeProps({
              route: "loading",
              flowState: refreshed.state,
              uploadDraft: currentUploadDraft ?? undefined,
            });
          } else {
            await finalizeSelectedReport(
              interpretationId,
              refreshed.state,
              currentUploadDraft,
            );
          }
        } finally {
          setRuntimeBusy(false);
        }
        return;
      }

      const resultCta = resolveSelfUnderstandingReportCta({
        theme: currentUploadDraft?.theme,
        canUpgrade: Boolean(
          currentRuntimeProps.flowState.report?.can_upgrade ||
            currentRuntimeProps.flowState.status?.can_upgrade,
        ),
        hasProAccess: hasProReportAccess(currentRuntimeProps.flowState),
        structured: getLiteStructuredReport(currentRuntimeProps.flowState.report),
      });

      if (resultCta.intent === "open_upgrade_report") {
        const nextDraft = currentUploadDraft
          ? mergeMobileWebUploadDraft(currentUploadDraft, { reportVariant: "pro" })
          : mergeMobileWebUploadDraft(uploadDraftForReturn, { reportVariant: "pro" });

        setRuntimeUploadDraft(nextDraft);
        setRuntimeProps({
          route: "loading",
          flowState: currentRuntimeProps.flowState,
          uploadDraft: nextDraft,
        });
        return;
      }

      if (resultCta.intent === "restart_upload") {
        setRuntimeProps({
          route: "upload",
          uploadDraft: currentUploadDraft ?? uploadDraftForReturn,
        });
        return;
      }

      setRuntimeProps({
        route: "reportEntry",
        uploadDraft: currentUploadDraft ?? undefined,
      });
      return;
    }

    if (currentRuntimeProps.route === "upgrade") {
      if (!interpretationId) {
        return;
      }

      setRuntimeBusy(true);
      try {
        const refreshed = await refreshMobileWebProReport(
          interpretationId,
          currentRuntimeProps.flowState,
        );
        setRuntimeProps({
          route: "upgrade",
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
    reportVariant: "lite" | "pro",
  ) {
    if (runtimeBusy || runtimeHistoryBusy) {
      return;
    }

    setRuntimeBusy(true);
    setRuntimeHistoryOpeningId(interpretationId);
    try {
      const nextDraft = {
        ...(currentUploadDraft ?? uploadDraftForReturn),
        reportVariant,
        reportType: inferReportTypeFromVariant(reportVariant),
      };
      const refreshed = await refreshMobileWebReport(
        interpretationId,
        initialMandalaFlowState,
      );

      if (reportVariant === "pro") {
        await finalizeSelectedReport(
          interpretationId,
          refreshed.state,
          nextDraft,
        );
        return;
      }

      setRuntimeProps({
        route:
          canOpenReport || refreshed.state.step !== "liteGenerating"
            ? "report"
            : "loading",
        flowState: refreshed.state,
        uploadDraft: nextDraft,
      });
    } finally {
      setRuntimeHistoryOpeningId(null);
      setRuntimeBusy(false);
    }
  }

  function handleReportSecondaryAction() {
    if (currentRuntimeProps.route === "loading") {
      setRuntimeProps({
        route: "reportEntry",
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
    if (currentRuntimeProps.route === "upgrade") {
      setRuntimeProps({
        route: "reportEntry",
        uploadDraft: uploadDraftForReturn,
      });
      return;
    }

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

  async function handleUploadContinue(forcedDraft?: MobileWebUploadDraft | null) {
    if (runtimeBusy) {
      return;
    }

    if (!runtimeUploadDetection) {
      setRuntimeUploadDetectError("请先完成三圈检测，再进入当前解读流程。");
      return;
    }

    const draftToUse = forcedDraft ?? currentUploadDraft;

    if (!draftToUse) {
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
      setRuntimeProps({
        route: "loading",
        flowState: createRuntimeLoadingState(
          {
            ...draftToUse,
            uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
          },
          runtimeUploadDetection,
        ),
        uploadDraft: {
          ...draftToUse,
          uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
        },
      });

      const result = await runMobileWebLiteFlow(
        toStartCreatePayload(
          {
            ...draftToUse,
            uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
            innerRadius: runtimeUploadDetection?.inner_radius ?? draftToUse.innerRadius,
            middleRadius: runtimeUploadDetection?.middle_radius ?? draftToUse.middleRadius,
          },
          userId,
        ),
      );
      const nextDraft = {
        ...draftToUse,
        uploadAsset: toMobileWebUploadAssetRef(resolvedImagePath),
      };
      if (result.state.step === "liteGenerating") {
        setRuntimeProps({
          route: "loading",
          flowState: result.state,
          uploadDraft: nextDraft,
        });
      } else {
        await finalizeSelectedReport(
          result.state.interpretation?.interpretation_id ?? "",
          result.state,
          nextDraft,
        );
      }
    } finally {
      setRuntimeBusy(false);
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
      onUploadBack={() => {
        setRuntimeProps({
          route: "landing",
          uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft,
        });
      }}
      onUploadContinue={() => {
        setRuntimeProps({
          route: "reportEntry",
          uploadDraft: runtimeUploadDraft ?? runtimeProps.uploadDraft,
          uploadDetection: runtimeUploadDetection,
        });
      }}
      onUploadPreviewDetect={handleUploadPreviewDetect}
      onReportEntryBack={() => {
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
      onReportPrimaryAction={handleReportPrimaryAction}
      onReportSecondaryAction={handleReportSecondaryAction}
      onReportBackAction={handleReportBackAction}
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
