import { getInterpretationList } from "../shared/api";
import type {
  FrontendUserSession,
  InterpretationListQuery,
  InterpretationRecordResponse,
  MandalaFlowState,
} from "../shared/types";
import type { HistoryFilterId } from "./components/history-cards";
import {
  openMobileWebUpgradeEntry,
  refreshMobileWebProReport,
} from "./controller";
import type { MobileWebRouteInput } from "./router-plan";
import { mobileWebRoutes, type MobileWebRouteId } from "./routes";
import {
  getDraftReportVariant,
  type MobileWebUploadDraft,
} from "./state";

export const DEFAULT_PREVIEW_DRAFT: MobileWebUploadDraft = {
  imagePath: "/tmp/example-mandala.png",
  theme: "general",
  reportType: "lite",
  reportVariant: "lite",
  paintingIntention: "",
  paintingFeeling: "",
};

export const PREVIEW_ROUTE_OPTIONS: Array<{
  label: string;
  value: MobileWebRouteId;
}> = [
  { label: "落地页", value: "landing" },
  { label: "上传", value: "upload" },
  { label: "Lite / Pro 选择页", value: "reportEntry" },
  { label: "加载", value: "loading" },
  { label: "Lite 解读报告", value: "report" },
  { label: "报告旧版对照", value: "reportLegacy" },
  { label: "历史", value: "history" },
  { label: "历史记录详情", value: "historyRecordDetail" },
  { label: "Pro 解读报告", value: "upgrade" },
];

export const PREVIEW_POLLING_INTERVAL_MS = 1500;
export const PREVIEW_POLLING_MAX_ATTEMPTS = 8;

const LOCAL_DEBUG_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function isLocalDebugHost(hostname: string): boolean {
  return LOCAL_DEBUG_HOSTS.has(hostname);
}

export function getRouteFromPathname(pathname: string): MobileWebRouteId {
  const matched = mobileWebRoutes.find((route) => route.path === pathname);
  return matched?.id ?? "landing";
}

export function createPreviewRouteInput(
  route: MobileWebRouteId,
  draft: MobileWebUploadDraft,
  interpretationId: string,
  session: FrontendUserSession,
  historyQuery: InterpretationListQuery,
): MobileWebRouteInput {
  switch (route) {
    case "landing":
      return {
        route,
        params: {
          draft,
          session,
        },
      };

    case "upload":
    case "reportEntry":
      return {
        route,
        params: {
          draft,
          session,
        },
      };

    case "loading":
      return {
        route,
        params: {
          draft,
          session,
        },
      };

    case "report":
    case "reportLegacy":
    case "upgrade":
      return {
        route,
        params: {
          interpretationId,
          uploadDraft: draft,
        },
      };

    case "history":
      return {
        route,
        params: {
          session,
          uploadDraft: draft,
          historyQuery,
        },
      };

    case "historyRecordDetail":
      return {
        route,
        params: {
          interpretationId,
          uploadDraft: draft,
        },
      };
  }
}

export interface FinalizePreviewSelectedReportArgs {
  interpretationId: string;
  state: MandalaFlowState;
  draft: MobileWebUploadDraft;
  userId: string;
  historyQuery: InterpretationListQuery;
  setPreviewFlowState: (state: MandalaFlowState) => void;
  setPreviewHistoryRecords: (records: InterpretationRecordResponse[] | null) => void;
  setPreviewHistoryStatusLabel: (label: string | null) => void;
  setPreviewHistoryStatusDetail: (detail: string | null) => void;
  setPreviewHistoryStatusTone: (tone: "preview" | "runtime") => void;
  setRoute: (route: MobileWebRouteId) => void;
}

export async function finalizePreviewSelectedReport(
  args: FinalizePreviewSelectedReportArgs,
): Promise<void> {
  const {
    interpretationId,
    state,
    draft,
    userId,
    historyQuery,
    setPreviewFlowState,
    setPreviewHistoryRecords,
    setPreviewHistoryStatusLabel,
    setPreviewHistoryStatusDetail,
    setPreviewHistoryStatusTone,
    setRoute,
  } = args;

  let finalState = state;
  if (getDraftReportVariant(draft) === "pro") {
    const upgraded = await openMobileWebUpgradeEntry(
      interpretationId,
      state,
    );
    const proReport = await refreshMobileWebProReport(
      interpretationId,
      upgraded.state,
    );
    const proReady =
      proReport.report?.version === "pro" &&
      typeof proReport.report.report === "string" &&
      proReport.report.report.trim();

    finalState = proReport.state;
    setPreviewFlowState(finalState);
    setRoute(proReady ? "upgrade" : "loading");
  } else {
    setPreviewFlowState(finalState);
    setRoute("report");
  }

  try {
    const records = await getInterpretationList(userId, {
      filter: historyQuery.filter as HistoryFilterId | undefined,
      limit: historyQuery.limit,
      theme: historyQuery.theme,
    });
    setPreviewHistoryRecords(records);
    setPreviewHistoryStatusLabel("当前显示真实历史记录");
    setPreviewHistoryStatusDetail("刚完成的主路径结果已尝试回流到真实历史列表。");
    setPreviewHistoryStatusTone("runtime");
  } catch {
    setPreviewHistoryRecords(null);
    setPreviewHistoryStatusLabel("历史记录暂时回退到占位数据");
    setPreviewHistoryStatusDetail("真实主路径已执行，但历史列表拉取失败，因此仍显示 fixture。");
    setPreviewHistoryStatusTone("preview");
  }
}
