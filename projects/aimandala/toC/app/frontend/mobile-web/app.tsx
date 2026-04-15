import type { ReactNode } from "react";

import { MobileWebLandingPage } from "./page-shells/landing-page";
import { MobileWebLoadingPage } from "./page-shells/loading-page";
import { MobileWebHistoryPage } from "./page-shells/history-page";
import { MobileWebHistoryRecordDetailPage } from "./page-shells/history-record-detail-page";
import { MobileWebReportEntryPage } from "./page-shells/report-entry-page";
import { MobileWebReportPage } from "./page-shells/report-page";
import { MobileWebLegacyReportPage } from "./page-shells/report-page-legacy";
import { MobileWebUploadPage } from "./page-shells/upload-page";
import type { HistoryFilterId } from "./components/history-cards";
import type { MobileWebRouteId } from "./routes";
import type {
  DetectCirclesResponse,
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
} from "../shared/types";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "./state";
import { getDraftReportVariant } from "./state";

export interface MobileWebAppProps {
  route: MobileWebRouteId;
  uploadDraft?: MobileWebUploadDraft;
  uploadDetection?: DetectCirclesResponse | null;
  uploadDetecting?: boolean;
  uploadDetectError?: string | null;
  flowState?: MandalaFlowState;
  records?: InterpretationRecordResponse[];
  historyQuery?: InterpretationListQuery;
  record?: InterpretationRecordResponse;
  activeHistoryFilter?: HistoryFilterId;
  historyFilterBusy?: boolean;
  historyActionBusy?: boolean;
  activeHistoryRecordId?: string | null;
  activeHistoryRecordReportType?: InterpretationVersion | null;
  historyStatusLabel?: string;
  historyStatusDetail?: string;
  historyStatusTone?: "preview" | "runtime";
  historyRefreshHint?: string;
  historyRefreshBusy?: boolean;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onLandingStart?: () => void;
  onLandingOpenHistory?: () => void;
  onUploadDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onUploadContinue?: () => void;
  onUploadPreviewDetect?: () => void;
  onUploadBack?: () => void;
  onReportEntryBack?: () => void;
  onReportEntryChooseReportType?: (reportType: MobileWebReportProductType) => void;
  onLoadingLeaveLater?: () => void;
  onReportPrimaryAction?: () => void;
  onReportSecondaryAction?: () => void;
  onReportBackAction?: () => void;
  reportPrimaryDisabled?: boolean;
  onHistoryBackToUpload?: () => void;
  onHistoryFilterChange?: (filter: HistoryFilterId) => void;
  onHistoryThemeChange?: (theme?: string) => void;
  onHistoryLimitChange?: (limit: number) => void;
  onHistoryRefresh?: () => void;
  onHistoryOpenRecord?: (interpretationId: string) => void;
  onHistoryRecordDetailBack?: () => void;
  onHistoryRecordDetailOpenReport?: (reportType: InterpretationVersion) => void;
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
  record,
  activeHistoryFilter = "all",
  historyFilterBusy = false,
  historyActionBusy = false,
  activeHistoryRecordId = null,
  activeHistoryRecordReportType = null,
  historyStatusLabel,
  historyStatusDetail,
  historyStatusTone,
  historyRefreshHint,
  historyRefreshBusy = false,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onLandingStart,
  onLandingOpenHistory,
  onUploadDraftChange,
  onUploadContinue,
  onUploadPreviewDetect,
  onUploadBack,
  onReportEntryBack,
  onReportEntryChooseReportType,
  onLoadingLeaveLater,
  onReportPrimaryAction,
  onReportSecondaryAction,
  reportPrimaryDisabled = false,
  onHistoryBackToUpload,
  onHistoryFilterChange,
  onHistoryThemeChange,
  onHistoryLimitChange,
  onHistoryRefresh,
  onHistoryOpenRecord,
  onHistoryRecordDetailBack,
  onHistoryRecordDetailOpenReport,
}: MobileWebAppProps): ReactNode {
  switch (route) {
    case "landing":
      return (
        <MobileWebLandingPage
          onStart={onLandingStart}
          onOpenHistory={onLandingOpenHistory}
        />
      );

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
          onBack={onUploadBack}
        />
      );

    case "reportEntry":
      if (!uploadDraft) {
        return "Missing upload draft";
      }
      return (
        <MobileWebReportEntryPage
          draft={uploadDraft}
          onBack={onReportEntryBack}
          onChooseReportType={onReportEntryChooseReportType}
        />
      );

    case "loading":
      if (!flowState) {
        return "Missing flow state";
      }
      return (
        <MobileWebLoadingPage
          state={flowState}
          isPro={uploadDraft ? getDraftReportVariant(uploadDraft) === "pro" : false}
          onBack={onReportSecondaryAction}
          onClose={onReportSecondaryAction}
          onLeaveLater={onLoadingLeaveLater}
        />
      );

    case "report":
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

    case "reportLegacy":
      if (!flowState) {
        return "Missing flow state";
      }
      return (
        <MobileWebLegacyReportPage
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
          historyRefreshHint={historyRefreshHint}
          refreshBusy={historyRefreshBusy}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onBackToUpload={onHistoryBackToUpload}
          onFilterChange={onHistoryFilterChange}
          onThemeChange={onHistoryThemeChange}
          onLimitChange={onHistoryLimitChange}
          onRefresh={onHistoryRefresh}
          onOpenRecord={onHistoryOpenRecord}
        />
      );

    case "historyRecordDetail":
      if (!record) {
        return "Missing history record";
      }
      return (
        <MobileWebHistoryRecordDetailPage
          record={record}
          openingReportType={activeHistoryRecordReportType}
          environmentLabel={environmentLabel}
          environmentDetail={environmentDetail}
          environmentTone={environmentTone}
          onBackToHistory={onHistoryRecordDetailBack}
          onOpenReportType={onHistoryRecordDetailOpenReport}
        />
      );

    default:
      return "Unknown route";
  }
}
