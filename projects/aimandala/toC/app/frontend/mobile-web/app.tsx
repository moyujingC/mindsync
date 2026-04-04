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
  uploadDetecting?: boolean;
  uploadDetectError?: string | null;
  flowState?: MandalaFlowState;
  records?: InterpretationRecordResponse[];
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onUploadDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onUploadContinue?: () => void;
  onUploadPreviewDetect?: () => void;
  onReportPrimaryAction?: () => void;
  onReportSecondaryAction?: () => void;
  onHistoryBackToUpload?: () => void;
}

export function MobileWebApp({
  route,
  uploadDraft,
  uploadDetection,
  uploadDetecting = false,
  uploadDetectError = null,
  flowState,
  records = [],
  environmentLabel,
  environmentDetail,
  environmentTone,
  onUploadDraftChange,
  onUploadContinue,
  onUploadPreviewDetect,
  onReportPrimaryAction,
  onReportSecondaryAction,
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
          isDetecting={uploadDetecting}
          detectError={uploadDetectError}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
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
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onPrimaryAction={onReportPrimaryAction}
          onSecondaryAction={onReportSecondaryAction}
        />
      );

    case "history":
      return (
        <MobileWebHistoryPage
          records={records}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onBackToUpload={onHistoryBackToUpload}
        />
      );

    default:
      return "Unknown route";
  }
}
