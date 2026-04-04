import { loadExistingReportPage, loadHistoryPage, loadLiteReportPage, loadUploadPage } from "./loaders";
import type { MobileWebAppProps } from "./app";
import type { MobileWebRouteId } from "./routes";
import type { MobileWebUploadDraft } from "./state";

export interface UploadRouteInput {
  draft: MobileWebUploadDraft;
}

export interface LiteReportRouteInput {
  draft: MobileWebUploadDraft;
  userId: string;
}

export interface ExistingReportRouteInput {
  interpretationId: string;
}

export interface HistoryRouteInput {
  userId: string;
}

export type MobileWebRouteInput =
  | { route: "upload"; params: UploadRouteInput }
  | { route: "loading"; params: LiteReportRouteInput }
  | { route: "report"; params: ExistingReportRouteInput }
  | { route: "history"; params: HistoryRouteInput }
  | { route: "upgrade"; params: ExistingReportRouteInput };

export async function resolveMobileWebRouteProps(
  input: MobileWebRouteInput,
): Promise<MobileWebAppProps> {
  switch (input.route) {
    case "upload": {
      const upload = await loadUploadPage(input.params.draft);
      return {
        route: "upload",
        uploadDraft: upload.draft,
      };
    }

    case "loading": {
      const report = await loadLiteReportPage(input.params);
      return {
        route: "loading",
        flowState: report.state,
      };
    }

    case "report": {
      const report = await loadExistingReportPage(input.params.interpretationId);
      return {
        route: "report",
        flowState: report.state,
      };
    }

    case "history": {
      const history = await loadHistoryPage(input.params.userId);
      return {
        route: "history",
        records: history.records,
      };
    }

    case "upgrade": {
      const report = await loadExistingReportPage(input.params.interpretationId);
      return {
        route: "upgrade",
        flowState: report.state,
      };
    }

    default:
      return assertNever(input.route);
  }
}

function assertNever(route: never): never {
  throw new Error(`Unsupported mobile web route: ${route}`);
}

export function isReportLikeRoute(route: MobileWebRouteId): boolean {
  return route === "loading" || route === "report" || route === "upgrade";
}
