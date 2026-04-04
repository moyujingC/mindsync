import type { ReactNode } from "react";

import { MobileWebHistoryPage } from "./page-shells/history-page";
import { MobileWebReportPage } from "./page-shells/report-page";
import { MobileWebUploadPage } from "./page-shells/upload-page";
import type { MobileWebRouteId } from "./routes";
import type {
  DetectCirclesResponse,
  InterpretationRecordResponse,
  MandalaFlowState,
} from "../shared/types";
import type { MobileWebUploadDraft } from "./state";

export interface MobileWebAppProps {
  route: MobileWebRouteId;
  uploadDraft?: MobileWebUploadDraft;
  uploadDetection?: DetectCirclesResponse | null;
  flowState?: MandalaFlowState;
  records?: InterpretationRecordResponse[];
  onUploadDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onUploadContinue?: () => void;
  onUploadPreviewDetect?: () => void;
  onReportPrimaryAction?: () => void;
  onHistoryBackToUpload?: () => void;
}

export function MobileWebApp({
  route,
  uploadDraft,
  uploadDetection,
  flowState,
  records = [],
  onUploadDraftChange,
  onUploadContinue,
  onUploadPreviewDetect,
  onReportPrimaryAction,
  onHistoryBackToUpload,
}: MobileWebAppProps): ReactNode {
  switch (route) {
    case "upload":
      if (!uploadDraft) {
        return "Missing upload draft";
      }
      return (
        <MobileWebUploadPage
          draft={uploadDraft}
          detection={uploadDetection}
          onDraftChange={onUploadDraftChange}
          onContinue={onUploadContinue}
          onPreviewDetect={onUploadPreviewDetect}
        />
      );

    case "loading":
    case "report":
    case "upgrade":
      if (!flowState) {
        return "Missing flow state";
      }
      return (
        <MobileWebReportPage
          state={flowState}
          onPrimaryAction={onReportPrimaryAction}
        />
      );

    case "history":
      return (
        <MobileWebHistoryPage
          records={records}
          onBackToUpload={onHistoryBackToUpload}
        />
      );

    default:
      return "Unknown route";
  }
}
