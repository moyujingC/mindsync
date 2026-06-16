import brandPattern from "../assets/pattern.webp";
import { SharedReportEntrySelectionPage } from "../../shared/ui";
import {
  createReportEntryPageDescriptor,
  type ReportPaymentState,
} from "../pages/report-entry-page";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";
import type { CSSProperties } from "react";

export interface MobileWebReportEntryPageProps {
  draft: MobileWebUploadDraft;
  paymentState?: ReportPaymentState;
  onBack?: () => void;
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onChooseReportType?: (reportType: MobileWebReportProductType) => void;
}

export function MobileWebReportEntryPage({
  draft,
  paymentState = "idle",
  onBack,
  onDraftChange,
  onChooseReportType,
}: MobileWebReportEntryPageProps) {
  const descriptor = createReportEntryPageDescriptor(draft, paymentState);
  const heroPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as CSSProperties;

  return (
    <SharedReportEntrySelectionPage
      descriptor={descriptor}
      onBack={onBack}
      redeemCode={draft.redeemCode ?? ""}
      onRedeemCodeChange={(redeemCode) => onDraftChange?.({ redeemCode })}
      onChoose={
        onChooseReportType
          ? (cardId) => onChooseReportType(cardId as MobileWebReportProductType)
          : undefined
      }
      heroPatternStyle={heroPatternStyle}
    />
  );
}
