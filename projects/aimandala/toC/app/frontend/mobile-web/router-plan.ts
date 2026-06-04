import { loadExistingReportPage, loadHistoryPage, loadLiteReportPage, loadUploadPage } from "./loaders";
import { resolveMobileWebCanonicalUserId } from "./identity";
import type { MobileWebAppProps } from "./app";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";
import type {
  FrontendUserSession,
  InterpretationListQuery,
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
  | { route: "history"; params: HistoryRouteInput }
  | { route: "historyRecordDetail"; params: HistoryRecordDetailRouteInput };

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
      return {
        route: "reportEntry",
        uploadDraft: input.params.draft,
      };
    }

    case "loading": {
      const userId = resolveMobileWebCanonicalUserId(input.params);
      if (!userId) {
        throw new Error("Mobile web loading route requires a canonical user session.");
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

    case "report": {
      const report = await loadExistingReportPage(input.params.interpretationId);
      return {
        route: "report",
        flowState: report.state,
        uploadDraft: input.params.uploadDraft,
      };
    }

    case "history": {
      const userId = resolveMobileWebCanonicalUserId(input.params);
      if (!userId) {
        throw new Error("Mobile web history route requires a canonical user session.");
      }
      const history = await loadHistoryPage(
        userId,
        input.params.historyQuery,
      );
      return {
        route: "history",
        records: history.records,
        uploadDraft: input.params.uploadDraft,
        historyQuery: input.params.historyQuery,
      };
    }

    case "historyRecordDetail": {
      throw new Error(
        `历史记录详情暂未接入当前财富报告 API：${input.params.interpretationId}`,
      );
    }

  }

  return assertNever(input);
}

function assertNever(input: never): never {
  throw new Error(`Unsupported mobile web route: ${JSON.stringify(input)}`);
}

export function isReportLikeRoute(route: MobileWebRouteId): boolean {
  return route === "loading" || route === "report";
}
