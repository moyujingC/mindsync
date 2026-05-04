import brandPattern from "../assets/pattern.webp";
import { SharedReportEntrySelectionPage } from "../../shared/ui";
import { createReportEntryPageDescriptor } from "../pages/report-entry-page";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";
import type { CSSProperties } from "react";

export interface MobileWebReportEntryPageProps {
  draft: MobileWebUploadDraft;
  onBack?: () => void;
  onChooseReportType?: (reportType: MobileWebReportProductType) => void;
}

export function MobileWebReportEntryPage({
  draft,
  onBack,
  onChooseReportType,
}: MobileWebReportEntryPageProps) {
  const descriptor = createReportEntryPageDescriptor(draft);
  const heroPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as CSSProperties;

  return (
    <SharedReportEntrySelectionPage
      descriptor={descriptor}
      onBack={onBack}
      onChoose={
        onChooseReportType
          ? (cardId) => onChooseReportType(cardId as MobileWebReportProductType)
          : undefined
      }
      heroPatternStyle={heroPatternStyle}
    />
  );
}
