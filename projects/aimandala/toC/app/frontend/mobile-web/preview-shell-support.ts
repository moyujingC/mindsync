import type {
  FrontendUserSession,
  InterpretationListQuery,
  InterpretationRecordResponse,
  MandalaFlowState,
} from "../shared/types";
import {
  refreshMobileWebReport,
} from "./controller";
import type { MobileWebRouteInput } from "./router-plan";
import { mobileWebRoutes, type MobileWebRouteId } from "./routes";
import {
  getDraftReportVariant,
  type MobileWebUploadDraft,
} from "./state";

export const DEFAULT_PREVIEW_DRAFT: MobileWebUploadDraft = {
  imagePath: "/tmp/example-mandala.png",
  theme: "wealth",
  reportType: "lite",
  reportVariant: "lite",
  paintingIntention: "",
  paintingFeeling: "",
  innerRadius: 0.35,
  middleRadius: 0.65,
};

export const PREVIEW_ROUTE_OPTIONS: Array<{
  label: string;
  value: MobileWebRouteId;
}> = mobileWebRoutes
  .filter((route) => route.id !== "historyRecordDetail")
  .map((route) => ({
    label: route.previewLabel ?? route.title,
    value: route.id,
  }));

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
    case "reportLite":
    case "reportPro":
      return {
        route,
        params: {
          interpretationId,
          uploadDraft:
            route === "reportPro"
              ? { ...draft, reportType: "pro", reportVariant: "pro" }
              : { ...draft, reportType: "lite", reportVariant: "lite" },
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

    case "historyRecordDetailNotUpgraded":
    case "historyRecordDetailGenerating":
    case "historyRecordDetailViewable":
      return {
        route,
        params: {
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
  if (getDraftReportVariant(draft) === "pro" && state.report?.version !== "pro") {
    const proReport = await refreshMobileWebReport(
      interpretationId,
      "pro",
      state,
    );
    const proReady =
      proReport.report?.version === "pro" &&
      typeof proReport.report.report === "string" &&
      proReport.report.report.trim();

    finalState = proReport.state;
    setPreviewFlowState(finalState);
    setRoute(proReady ? "report" : "loading");
  } else {
    setPreviewFlowState(finalState);
    setRoute("report");
  }

  void userId;
  void historyQuery;
  setPreviewHistoryRecords(null);
  setPreviewHistoryStatusLabel("报告已写入历史记录");
  setPreviewHistoryStatusDetail("你可以从历史页重新打开这份报告，并继续测试报告追问。");
  setPreviewHistoryStatusTone("preview");
}
