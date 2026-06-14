import {
  loadExistingReportPage,
  loadHistoryPage,
  loadLiteReportPage,
  loadUploadPage,
} from "./loaders";
import { resolveMobileWebCanonicalUserId } from "./identity";
import {
  getGeneratedReportEntry,
  listGeneratedReportRecords,
} from "./generated-report-store";
import type { MobileWebAppProps } from "./app";
import { isHistoryRecordDetailRoute, type MobileWebRouteId } from "./routes";
import {
  hasDraftResolvedCircleRadii,
  type MobileWebUploadDraft,
} from "./state";
import type {
  FrontendUserSession,
  InterpretationListQuery,
  InterpretationRecordResponse,
} from "../shared/types";

interface MobileWebSessionRouteInput {
  session?: FrontendUserSession;
  userId?: string;
}

export interface UploadRouteInput extends MobileWebSessionRouteInput {
  draft: MobileWebUploadDraft;
}

export interface LiteReportRouteInput extends MobileWebSessionRouteInput {
  draft: MobileWebUploadDraft;
}

export interface ExistingReportRouteInput {
  interpretationId: string;
  uploadDraft?: MobileWebUploadDraft;
}

export interface HistoryRecordDetailRouteInput {
  interpretationId: string;
  uploadDraft?: MobileWebUploadDraft;
}

export interface HistoryRecordDetailPreviewRouteInput {
  uploadDraft?: MobileWebUploadDraft;
}

export interface HistoryRouteInput extends MobileWebSessionRouteInput {
  uploadDraft?: MobileWebUploadDraft;
  historyQuery?: InterpretationListQuery;
}

export type MobileWebRouteInput =
  | { route: "landing"; params: UploadRouteInput }
  | { route: "upload"; params: UploadRouteInput }
  | { route: "reportEntry"; params: UploadRouteInput }
  | { route: "loading"; params: LiteReportRouteInput }
  | { route: "report"; params: ExistingReportRouteInput }
  | { route: "reportLite"; params: ExistingReportRouteInput }
  | { route: "reportPro"; params: ExistingReportRouteInput }
  | { route: "history"; params: HistoryRouteInput }
  | { route: "historyRecordDetail"; params: HistoryRecordDetailRouteInput }
  | {
      route: "historyRecordDetailNotUpgraded";
      params: HistoryRecordDetailPreviewRouteInput;
    }
  | {
      route: "historyRecordDetailGenerating";
      params: HistoryRecordDetailPreviewRouteInput;
    }
  | {
      route: "historyRecordDetailViewable";
      params: HistoryRecordDetailPreviewRouteInput;
    };

type HistoryRecordDetailPreviewState =
  | "not-upgraded"
  | "generating"
  | "viewable";

function matchesHistoryRecordDetailPreviewState(
  record: InterpretationRecordResponse,
  state: HistoryRecordDetailPreviewState,
): boolean {
  const hasLite = record.version_purchased.includes("lite");
  const hasPro = record.version_purchased.includes("pro");

  switch (state) {
    case "not-upgraded":
      return hasLite && !hasPro && record.status === "completed";
    case "generating":
      return hasLite && hasPro && record.generation_stage === "generating_pro";
    case "viewable":
      return hasLite && hasPro && record.status === "completed";
  }
}

function createHistoryRecordDetailPreviewRecord(
  state: HistoryRecordDetailPreviewState,
): InterpretationRecordResponse {
  const common = {
    user_id: "demo-user-id",
    theme: "intimate_relationship",
    three_circles: {
      inner_radius: 0.28,
      middle_radius: 0.62,
    },
    auto_detected: false,
    image_url: null,
    storage_backend: null,
    storage_key: null,
    image_local_expires_at: null,
  } satisfies Partial<InterpretationRecordResponse>;

  switch (state) {
    case "not-upgraded":
      return {
        ...common,
        interpretation_id: "preview-history-detail-not-upgraded",
        status: "completed",
        generation_stage: "report_ready",
        generation_progress: 100,
        version_purchased: ["lite"],
        can_upgrade: true,
        created_at: "2026-06-08T09:30:00+08:00",
      };
    case "generating":
      return {
        ...common,
        interpretation_id: "preview-history-detail-generating",
        status: "processing",
        generation_stage: "generating_pro",
        generation_progress: 62,
        version_purchased: ["lite", "pro"],
        can_upgrade: false,
        created_at: "2026-06-08T09:30:00+08:00",
        upgrade_history: [
          {
            from: "lite",
            to: "pro",
            price_diff: 39,
            at: "2026-06-08T10:12:00+08:00",
          },
        ],
      };
    case "viewable":
      return {
        ...common,
        interpretation_id: "preview-history-detail-viewable",
        status: "completed",
        generation_stage: "report_ready",
        generation_progress: 100,
        version_purchased: ["lite", "pro"],
        can_upgrade: false,
        created_at: "2026-06-08T09:30:00+08:00",
        upgrade_history: [
          {
            from: "lite",
            to: "pro",
            price_diff: 39,
            at: "2026-06-08T10:12:00+08:00",
          },
        ],
        pro_ready_at: "2026-06-08T10:34:00+08:00",
      };
  }
}

function resolveHistoryRecordDetailPreview(
  state: HistoryRecordDetailPreviewState,
  uploadDraft?: MobileWebUploadDraft,
): MobileWebAppProps {
  const record = createHistoryRecordDetailPreviewRecord(state);
  const matchedEntry = listGeneratedReportRecords({ limit: 100 }).find(
    (candidate) => matchesHistoryRecordDetailPreviewState(candidate, state),
  );

  return {
    route:
      state === "not-upgraded"
        ? "historyRecordDetailNotUpgraded"
        : state === "generating"
          ? "historyRecordDetailGenerating"
          : "historyRecordDetailViewable",
    record,
    uploadDraft: matchedEntry
      ? (getGeneratedReportEntry(matchedEntry.interpretation_id)?.draft ??
        uploadDraft)
      : uploadDraft,
  };
}

export async function resolveMobileWebRouteProps(
  input: MobileWebRouteInput,
): Promise<MobileWebAppProps> {
  switch (input.route) {
    case "landing": {
      return {
        route: "landing",
        uploadDraft: input.params.draft,
      };
    }

    case "upload": {
      const upload = await loadUploadPage(input.params.draft);
      return {
        route: "upload",
        uploadDraft: upload.draft,
      };
    }

    case "reportEntry": {
      if (!hasDraftResolvedCircleRadii(input.params.draft)) {
        const upload = await loadUploadPage(input.params.draft);
        return {
          route: "upload",
          uploadDraft: upload.draft,
        };
      }
      return {
        route: "reportEntry",
        uploadDraft: input.params.draft,
      };
    }

    case "loading": {
      const userId = resolveMobileWebCanonicalUserId(input.params);
      if (!userId) {
        throw new Error(
          "Mobile web loading route requires a canonical user session.",
        );
      }
      const report = await loadLiteReportPage({
        ...input.params,
        userId,
      });
      return {
        route: "loading",
        flowState: report.state,
        uploadDraft: input.params.draft,
      };
    }

    case "report":
    case "reportLite":
    case "reportPro": {
      const report = await loadExistingReportPage(
        input.params.interpretationId,
      );
      return {
        route: input.route,
        flowState: report.state,
        uploadDraft: input.params.uploadDraft,
      };
    }

    case "history": {
      const userId = resolveMobileWebCanonicalUserId(input.params);
      if (!userId) {
        throw new Error(
          "Mobile web history route requires a canonical user session.",
        );
      }
      const history = await loadHistoryPage(userId, input.params.historyQuery);
      return {
        route: "history",
        records: history.records,
        uploadDraft: input.params.uploadDraft,
        historyQuery: input.params.historyQuery,
      };
    }

    case "historyRecordDetail": {
      const entry = getGeneratedReportEntry(input.params.interpretationId);
      const record = listGeneratedReportRecords({ limit: 100 }).find(
        (candidate) =>
          candidate.interpretation_id === input.params.interpretationId,
      );
      if (!entry || !record) {
        throw new Error(`未找到本地历史记录：${input.params.interpretationId}`);
      }
      return {
        route: "historyRecordDetail",
        record,
        uploadDraft: entry.draft,
      };
    }

    case "historyRecordDetailNotUpgraded":
      return resolveHistoryRecordDetailPreview(
        "not-upgraded",
        input.params.uploadDraft,
      );

    case "historyRecordDetailGenerating":
      return resolveHistoryRecordDetailPreview(
        "generating",
        input.params.uploadDraft,
      );

    case "historyRecordDetailViewable":
      return resolveHistoryRecordDetailPreview(
        "viewable",
        input.params.uploadDraft,
      );
  }

  return assertNever(input);
}

function assertNever(input: never): never {
  throw new Error(`Unsupported mobile web route: ${JSON.stringify(input)}`);
}

export function isReportLikeRoute(route: MobileWebRouteId): boolean {
  return (
    route === "loading" ||
    route === "report" ||
    route === "reportLite" ||
    route === "reportPro" ||
    isHistoryRecordDetailRoute(route)
  );
}
