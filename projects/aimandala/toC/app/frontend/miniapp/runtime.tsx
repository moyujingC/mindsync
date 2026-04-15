import { useEffect, useMemo, useState } from "react";

import { MobileWebApp } from "../mobile-web/app";
import { ensureUploadedImagePath } from "../mobile-web/upload-runtime";
import {
  pollMobileWebReportUntilReady,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "../mobile-web/controller";
import {
  getDraftReportVariant,
  mergeMobileWebUploadDraft,
  toMobileWebUploadAssetRef,
  toStartCreatePayload,
  type MobileWebReportProductType,
  type MobileWebUploadDraft,
} from "../mobile-web/state";
import {
  createInterpretation,
  createMiniappOrder,
  exchangeMiniappSession,
  getInterpretation,
  getInterpretationList,
  notifyMiniappWechatPayment,
  reconcileMiniappOrder,
} from "../shared/api";
import {
  applyError,
  getLiteStructuredReport,
  hasProReportAccess,
  initialMandalaFlowState,
  resolveSelfUnderstandingReportCta,
} from "../shared/core";
import type {
  FrontendUserSession,
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
} from "../shared/types";
import type { HistoryFilterId } from "../mobile-web/components/history-cards";
import type { MiniappRouteId } from "./routes";
import { createMiniappDraft, createMiniappPreviewProps } from "./fixtures";
import { getMiniappLiveConfig } from "./config";
import { resolveMiniappHostAdapter } from "./host";
import {
  persistMiniappSession,
  resolveMiniappSession,
  sessionFromMiniappExchange,
} from "./identity";

export interface MiniappRuntimeProps {
  route: MiniappRouteId;
  initialDraft?: MobileWebUploadDraft;
  initialSession?: FrontendUserSession;
}

function formatHistoryRefreshHint(date = new Date()): string {
  return `最近更新于 ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)}`;
}

export function MiniappRuntime({
  route,
  initialDraft,
  initialSession,
}: MiniappRuntimeProps) {
  const config = getMiniappLiveConfig();
  const environmentLabel = config.miniappLiveEnabled
    ? "当前为 miniapp live 联调"
    : "当前为 miniapp 灰度关闭联调";
  const environmentDetail = config.miniappLiveEnabled
    ? "当前会优先尝试走 miniapp session / order / payment / reconcile 真实链路；如宿主能力缺失，会回退到联调 stub。"
    : "miniapp live 能力默认关闭；当前仍可在联调环境中复用 API 合同和宿主占位能力。";
  const environmentTone: "preview" | "runtime" = config.miniappLiveEnabled
    ? "runtime"
    : "preview";

  const [activeRoute, setActiveRoute] = useState<MiniappRouteId>(route);
  const [draft, setDraft] = useState<MobileWebUploadDraft>(
    initialDraft ?? createMiniappDraft(),
  );
  const [session, setSession] = useState<FrontendUserSession>(
    initialSession ?? resolveMiniappSession(),
  );
  const [flowState, setFlowState] = useState<MandalaFlowState | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyQuery, setHistoryQuery] = useState<InterpretationListQuery>({
    filter: "all",
    limit: 20,
  });
  const [records, setRecords] = useState<InterpretationRecordResponse[]>([]);
  const [record, setRecord] = useState<InterpretationRecordResponse | null>(
    null,
  );
  const [historyStatusLabel, setHistoryStatusLabel] = useState<
    string | undefined
  >();
  const [historyStatusDetail, setHistoryStatusDetail] = useState<
    string | undefined
  >();
  const [historyRefreshHint, setHistoryRefreshHint] = useState<
    string | undefined
  >();
  const [historyRefreshBusy, setHistoryRefreshBusy] = useState(false);
  const [openingReportType, setOpeningReportType] =
    useState<InterpretationVersion | null>(null);

  useEffect(() => {
    setActiveRoute(route);
  }, [route]);

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
    }
  }, [
    initialDraft?.imagePath,
    initialDraft?.theme,
    initialDraft?.paintingFeeling,
    initialDraft?.paintingIntention,
    initialDraft?.reportType,
    initialDraft?.reportVariant,
  ]);

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [
    initialSession?.canonicalUserId,
    initialSession?.platformUserId,
    initialSession?.provider,
  ]);

  useEffect(() => {
    persistMiniappSession(session);
  }, [session]);

  const selectedVariant = getDraftReportVariant(draft);

  const fallbackPreviewProps = useMemo(
    () => createMiniappPreviewProps(activeRoute),
    [activeRoute],
  );

  async function ensureRuntimeSession(): Promise<FrontendUserSession> {
    if (config.miniappLiveEnabled && config.wechatSessionEnabled) {
      const host = resolveMiniappHostAdapter();
      const loginResult = await host.login();
      const exchanged = await exchangeMiniappSession({
        code: loginResult.code,
      });
      const nextSession = sessionFromMiniappExchange(exchanged);
      setSession(nextSession);
      return nextSession;
    }

    const exchanged = await exchangeMiniappSession({
      debug_canonical_user_id: session.canonicalUserId,
    });
    const nextSession = sessionFromMiniappExchange(exchanged);
    setSession(nextSession);
    return nextSession;
  }

  async function refreshHistory(query = historyQuery): Promise<void> {
    setHistoryRefreshBusy(true);
    try {
      const activeSession = await ensureRuntimeSession();
      const nextRecords = await getInterpretationList(
        activeSession.canonicalUserId,
        query,
      );
      setRecords(nextRecords);
      setHistoryStatusLabel("当前显示真实 miniapp 历史");
      setHistoryStatusDetail("历史记录已按 miniapp 当前用户与筛选条件刷新。");
      setHistoryRefreshHint(formatHistoryRefreshHint());
    } finally {
      setHistoryRefreshBusy(false);
    }
  }

  async function createOrReuseLiteFlow(
    reportType: MobileWebReportProductType,
  ): Promise<{
    interpretationId: string;
    state: MandalaFlowState;
    runtimeDraft: MobileWebUploadDraft;
  }> {
    const runtimeDraft = mergeMobileWebUploadDraft(draft, { reportType });
    setDraft(runtimeDraft);

    if (
      reportType === "pro" &&
      flowState?.interpretation?.interpretation_id &&
      flowState.report?.version === "lite"
    ) {
      return {
        interpretationId: flowState.interpretation.interpretation_id,
        state: flowState,
        runtimeDraft,
      };
    }

    const activeSession = await ensureRuntimeSession();
    const uploaded = await ensureUploadedImagePath(runtimeDraft, (resolved) => {
      setDraft((current) => ({
        ...current,
        uploadAsset: toMobileWebUploadAssetRef(resolved),
      }));
    });

    const result = await runMobileWebLiteFlow(
      toStartCreatePayload(
        {
          ...runtimeDraft,
          uploadAsset: toMobileWebUploadAssetRef(uploaded),
        },
        activeSession.canonicalUserId,
      ),
    );
    const interpretationId = result.state.interpretation?.interpretation_id;
    if (!interpretationId) {
      throw new Error("Lite 主链未返回 interpretation_id");
    }
    setFlowState(result.state);
    return {
      interpretationId,
      state: result.state,
      runtimeDraft: {
        ...runtimeDraft,
        uploadAsset: toMobileWebUploadAssetRef(uploaded),
      },
    };
  }

  async function purchaseProReport(interpretationId: string): Promise<void> {
    const activeSession = await ensureRuntimeSession();
    const order = await createMiniappOrder({
      interpretation_id: interpretationId,
      product_type: "pro",
      channel: "miniapp",
      open_id: activeSession.platformUserId ?? undefined,
      debug_canonical_user_id:
        config.miniappLiveEnabled && config.wechatSessionEnabled
          ? undefined
          : activeSession.canonicalUserId,
    });

    if (order.wechat_pay_payload?.mode === "wechatpay") {
      const host = resolveMiniappHostAdapter();
      await host.requestPayment(order.wechat_pay_payload.request_payment_args);
    }

    await notifyMiniappWechatPayment({
      order_id: order.order_id,
      event: "paid",
      payment_reference:
        order.wechat_pay_payload?.mode === "wechatpay"
          ? "miniapp-host-payment"
          : "miniapp-stub-payment",
    });
    await reconcileMiniappOrder(order.order_id);
  }

  async function handleChooseReportType(
    reportType: MobileWebReportProductType,
  ) {
    if (busy) {
      return;
    }

    setBusy(true);
    setActiveRoute("loading");
    try {
      const { interpretationId, state, runtimeDraft } =
        await createOrReuseLiteFlow(reportType);

      if (reportType === "pro") {
        await purchaseProReport(interpretationId);
        const refreshed = await refreshMobileWebReport(
          interpretationId,
          "pro",
          state,
        );
        setFlowState(refreshed.state);
        setDraft(runtimeDraft);
        const proReady =
          refreshed.report?.version === "pro" &&
          typeof refreshed.report.report === "string" &&
          refreshed.report.report.trim().length > 0;
        setActiveRoute(proReady ? "report" : "loading");
      } else if (state.step === "liteGenerating") {
        setActiveRoute("loading");
      } else {
        setActiveRoute("report");
      }

      await refreshHistory({
        ...historyQuery,
        filter: "all",
      });
    } catch (error) {
      setFlowState(
        applyError(
          initialMandalaFlowState,
          error instanceof Error ? error.message : "miniapp 运行链路失败",
        ),
      );
      setActiveRoute("report");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (
      activeRoute !== "loading" ||
      !flowState?.interpretation?.interpretation_id ||
      busy
    ) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const snapshot = await pollMobileWebReportUntilReady(
        flowState.interpretation!.interpretation_id,
        selectedVariant === "pro" ? "pro" : "lite",
        flowState,
        {
          onTick: ({ state }) => {
            if (!cancelled) {
              setFlowState(state);
            }
          },
        },
      );

      if (cancelled) {
        return;
      }

      setFlowState(snapshot.state);
      const ready =
        selectedVariant === "pro"
          ? snapshot.report?.version === "pro" &&
            typeof snapshot.report.report === "string" &&
            snapshot.report.report.trim().length > 0
          : snapshot.state.step !== "liteGenerating";
      setActiveRoute(ready ? "report" : "loading");
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [activeRoute, busy, flowState, selectedVariant]);

  const appProps =
    activeRoute === "history"
      ? {
          route: "history" as const,
          uploadDraft: draft,
          records,
          historyQuery,
          activeHistoryFilter:
            (historyQuery.filter as HistoryFilterId | undefined) ?? "all",
          historyActionBusy: busy,
          historyRefreshBusy,
          historyStatusLabel,
          historyStatusDetail,
          historyStatusTone: environmentTone,
          historyRefreshHint,
        }
      : activeRoute === "historyRecordDetail"
        ? {
            route: "historyRecordDetail" as const,
            uploadDraft: draft,
            record: record ?? fallbackPreviewProps.record,
            activeHistoryRecordReportType: openingReportType,
          }
        : {
            route: activeRoute,
            uploadDraft: draft,
            flowState: flowState ?? fallbackPreviewProps.flowState,
          };

  return (
    <MobileWebApp
      {...fallbackPreviewProps}
      {...appProps}
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      onLandingStart={() => {
        setActiveRoute("upload");
      }}
      onLandingOpenHistory={() => {
        setActiveRoute("history");
        void refreshHistory();
      }}
      onUploadDraftChange={(patch) => {
        setDraft((current) => mergeMobileWebUploadDraft(current, patch));
      }}
      onUploadContinue={() => {
        setActiveRoute("reportEntry");
      }}
      onUploadBack={() => {
        setActiveRoute("landing");
      }}
      onReportEntryBack={() => {
        setActiveRoute("upload");
      }}
      onReportEntryChooseReportType={(reportType) => {
        void handleChooseReportType(reportType);
      }}
      onLoadingLeaveLater={() => {
        setActiveRoute("history");
        void refreshHistory({
          ...historyQuery,
          filter: "pending",
        });
      }}
      onReportPrimaryAction={() => {
        if (!flowState) {
          return;
        }
        if (flowState.step === "error") {
          if (flowState.interpretation?.interpretation_id) {
            setActiveRoute("loading");
          } else {
            setActiveRoute("upload");
          }
          return;
        }

        const resultCta = resolveSelfUnderstandingReportCta({
          theme: draft.theme,
          canUpgrade: Boolean(
            flowState.report?.can_upgrade || flowState.status?.can_upgrade,
          ),
          hasProAccess: hasProReportAccess(flowState),
          structured: getLiteStructuredReport(flowState.report),
        });

        if (
          resultCta.intent === "open_pro_report" &&
          flowState.interpretation?.interpretation_id
        ) {
          setDraft((current) =>
            mergeMobileWebUploadDraft(current, { reportType: "pro" }),
          );
          setActiveRoute("loading");
          return;
        }

        if (resultCta.intent === "open_report_entry") {
          setActiveRoute("reportEntry");
          return;
        }

        setFlowState(null);
        setActiveRoute("upload");
      }}
      onReportSecondaryAction={() => {
        setFlowState(null);
        setActiveRoute("upload");
      }}
      onHistoryBackToUpload={() => {
        setActiveRoute("upload");
      }}
      onHistoryFilterChange={(filter) => {
        const nextQuery = {
          ...historyQuery,
          filter,
        };
        setHistoryQuery(nextQuery);
        void refreshHistory(nextQuery);
      }}
      onHistoryThemeChange={(theme) => {
        const nextQuery = {
          ...historyQuery,
          theme,
        };
        setHistoryQuery(nextQuery);
        void refreshHistory(nextQuery);
      }}
      onHistoryLimitChange={(limit) => {
        const nextQuery = {
          ...historyQuery,
          limit,
        };
        setHistoryQuery(nextQuery);
        void refreshHistory(nextQuery);
      }}
      onHistoryRefresh={() => {
        void refreshHistory();
      }}
      onHistoryOpenRecord={(interpretationId) => {
        void (async () => {
          const nextRecord = await getInterpretation(interpretationId);
          setRecord(nextRecord);
          setActiveRoute("historyRecordDetail");
        })();
      }}
      onHistoryRecordDetailBack={() => {
        setActiveRoute("history");
      }}
      onHistoryRecordDetailOpenReport={(reportType) => {
        if (!record) {
          return;
        }

        void (async () => {
          setOpeningReportType(reportType);
          try {
            const refreshed = await refreshMobileWebReport(
              record.interpretation_id,
              reportType,
              flowState ?? initialMandalaFlowState,
            );
            setDraft((current) =>
              mergeMobileWebUploadDraft(current, { reportType }),
            );
            setFlowState(refreshed.state);
            const ready =
              reportType === "pro"
                ? refreshed.report?.version === "pro" &&
                  typeof refreshed.report.report === "string" &&
                  refreshed.report.report.trim().length > 0
                : refreshed.state.step !== "liteGenerating";
            setActiveRoute(ready ? "report" : "loading");
          } finally {
            setOpeningReportType(null);
          }
        })();
      }}
    />
  );
}
