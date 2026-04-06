import { loadExistingReportPage, loadHistoryPage, loadLiteReportPage, loadUpgradePage, loadUploadPage } from "./loaders";
import type { MobileWebAppProps } from "./app";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";
import type { InterpretationListQuery } from "../shared/types";

export interface UploadRouteInput {
  draft: MobileWebUploadDraft;
  userId?: string;
}

export interface LiteReportRouteInput {
  draft: MobileWebUploadDraft;
  userId: string;
}

export interface ExistingReportRouteInput {
  interpretationId: string;
  uploadDraft?: MobileWebUploadDraft;
}

export interface HistoryRouteInput {
  userId: string;
  uploadDraft?: MobileWebUploadDraft;
  historyQuery?: InterpretationListQuery;
}

export type MobileWebRouteInput =
  | { route: "landing"; params: UploadRouteInput }
  | { route: "upload"; params: UploadRouteInput }
  | { route: "reportEntry"; params: UploadRouteInput }
  | { route: "loading"; params: LiteReportRouteInput }
  | { route: "report"; params: ExistingReportRouteInput }
  | { route: "reportLegacy"; params: ExistingReportRouteInput }
  | { route: "history"; params: HistoryRouteInput }
  | { route: "upgrade"; params: ExistingReportRouteInput };

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
      const report = await loadLiteReportPage(input.params);
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

    case "reportLegacy": {
      const report = await loadExistingReportPage(input.params.interpretationId);
      return {
        route: "reportLegacy",
        flowState: report.state,
        uploadDraft: input.params.uploadDraft,
      };
    }

    case "history": {
      const history = await loadHistoryPage(
        input.params.userId,
        input.params.historyQuery,
      );
      return {
        route: "history",
        records: history.records,
        uploadDraft: input.params.uploadDraft,
        historyQuery: input.params.historyQuery,
      };
    }

    case "upgrade": {
      const report = await loadUpgradePage(input.params.interpretationId);
      return {
        route: "upgrade",
        flowState: report.state,
        uploadDraft: input.params.uploadDraft,
      };
    }
  }

  return assertNever(input);
}

function assertNever(input: never): never {
  throw new Error(`Unsupported mobile web route: ${JSON.stringify(input)}`);
}

export function isReportLikeRoute(route: MobileWebRouteId): boolean {
  return route === "loading" || route === "report" || route === "reportLegacy" || route === "upgrade";
}
