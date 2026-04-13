import brandPattern from "../assets/pattern.webp";
import { SharedReportEntrySelectionPage } from "../../shared/ui";
import { createReportEntryPageDescriptor } from "../pages/report-entry-page";
import type {
  MobileWebReportProductType,
  MobileWebUploadDraft,
} from "../state";

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

  return (
    <SharedReportEntrySelectionPage
      descriptor={descriptor}
      onBack={onBack}
      onChoose={
        onChooseReportType
          ? (cardId) => onChooseReportType(cardId as MobileWebReportProductType)
          : undefined
      }
      heroBackground={
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${brandPattern})`,
            backgroundSize: 280,
            backgroundRepeat: "repeat",
            opacity: 0.03,
          }}
        />
      }
    />
  );
}
