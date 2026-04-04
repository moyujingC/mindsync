import type { ReactNode } from "react";

import { MobileWebHistoryPage } from "./page-shells/history-page";
import { MobileWebReportPage } from "./page-shells/report-page";
import { MobileWebUploadPage } from "./page-shells/upload-page";
import type { MobileWebRouteId } from "./routes";
import type { InterpretationRecordResponse, MandalaFlowState } from "../shared/types";
import type { MobileWebUploadDraft } from "./state";

export interface MobileWebAppProps {
  route: MobileWebRouteId;
  uploadDraft?: MobileWebUploadDraft;
  flowState?: MandalaFlowState;
  records?: InterpretationRecordResponse[];
}

export function MobileWebApp({
  route,
  uploadDraft,
  flowState,
  records = [],
}: MobileWebAppProps): ReactNode {
  switch (route) {
    case "upload":
      if (!uploadDraft) {
        return "Missing upload draft";
      }
      return <MobileWebUploadPage draft={uploadDraft} />;

    case "loading":
    case "report":
    case "upgrade":
      if (!flowState) {
        return "Missing flow state";
      }
      return <MobileWebReportPage state={flowState} />;

    case "history":
      return <MobileWebHistoryPage records={records} />;

    default:
      return "Unknown route";
  }
}
