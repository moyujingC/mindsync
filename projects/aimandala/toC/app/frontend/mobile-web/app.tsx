import type { ReactNode } from "react";

import { MobileWebHistoryPage } from "./page-shells/history-page";
import { MobileWebReportPage } from "./page-shells/report-page";
import { MobileWebUploadPage } from "./page-shells/upload-page";
import type { HistoryFilterId } from "./components/history-cards";
import type { MobileWebRouteId } from "./routes";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
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
  historyQuery?: InterpretationListQuery;
  activeHistoryFilter?: HistoryFilterId;
  historyFilterBusy?: boolean;
  historyActionBusy?: boolean;
  activeHistoryRecordId?: string | null;
  historyStatusLabel?: string;
  historyStatusDetail?: string;
  historyStatusTone?: "preview" | "runtime";
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onUploadDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onUploadContinue?: () => void;
  onUploadPreviewDetect?: () => void;
  onReportPrimaryAction?: () => void;
  onReportSecondaryAction?: () => void;
  reportPrimaryDisabled?: boolean;
  onHistoryBackToUpload?: () => void;
  onHistoryFilterChange?: (filter: HistoryFilterId) => void;
  onHistoryThemeChange?: (theme?: string) => void;
  onHistoryLimitChange?: (limit: number) => void;
  onHistoryOpenRecord?: (interpretationId: string, canOpenReport: boolean) => void;
}

export function MobileWebApp({
  route,
  uploadDraft,
  uploadDetection,
  uploadDetecting = false,
  uploadDetectError = null,
  flowState,
  records = [],
  historyQuery,
  activeHistoryFilter = "all",
  historyFilterBusy = false,
  historyActionBusy = false,
  activeHistoryRecordId = null,
  historyStatusLabel,
  historyStatusDetail,
  historyStatusTone,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onUploadDraftChange,
  onUploadContinue,
  onUploadPreviewDetect,
  onReportPrimaryAction,
  onReportSecondaryAction,
  reportPrimaryDisabled = false,
  onHistoryBackToUpload,
  onHistoryFilterChange,
  onHistoryThemeChange,
  onHistoryLimitChange,
  onHistoryOpenRecord,
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
          route={route}
          state={flowState}
          uploadDraft={uploadDraft}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onPrimaryAction={onReportPrimaryAction}
          onSecondaryAction={onReportSecondaryAction}
          primaryDisabled={reportPrimaryDisabled}
        />
      );

    case "history":
      return (
        <MobileWebHistoryPage
          records={records}
          historyQuery={historyQuery}
          activeFilter={activeHistoryFilter}
          filterBusy={historyFilterBusy}
          actionBusy={historyActionBusy}
          activeRecordId={activeHistoryRecordId}
          historyStatusLabel={historyStatusLabel}
          historyStatusDetail={historyStatusDetail}
          historyStatusTone={historyStatusTone}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onBackToUpload={onHistoryBackToUpload}
          onFilterChange={onHistoryFilterChange}
          onThemeChange={onHistoryThemeChange}
          onLimitChange={onHistoryLimitChange}
          onOpenRecord={onHistoryOpenRecord}
        />
      );

    default:
      return "Unknown route";
  }
}
