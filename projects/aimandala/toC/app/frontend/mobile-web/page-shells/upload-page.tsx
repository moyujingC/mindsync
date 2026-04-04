import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes } from "../routes";
import { createUploadPageDescriptor } from "../pages";
import {
  UploadAssetCard,
  UploadChecklistCard,
  UploadDetectionCard,
  UploadDraftSummaryCard,
  UploadFormCard,
} from "../components/upload-cards";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

export interface MobileWebUploadPageProps {
  draft: MobileWebUploadDraft;
  detection?: DetectCirclesResponse | null;
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onContinue?: () => void;
}

export function MobileWebUploadPage({
  draft,
  detection = null,
  onDraftChange,
  onContinue,
}: MobileWebUploadPageProps) {
  const descriptor = createUploadPageDescriptor(draft, detection);
  const themeSection = descriptor.sections.find((section) => section.id === "theme");
  const detectionSection = descriptor.sections.find((section) => section.id === "circles");

  function handleUseSampleAsset() {
    if (descriptor.draft.imagePath) {
      return;
    }

    onDraftChange?.({
      imagePath: "/tmp/example-mandala.png",
    });
  }

  return (
    <MobileWebAppShell route={mobileWebRoutes[0]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">起点</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <section className="mw-stack">
        <UploadAssetCard
          imagePath={descriptor.draft.imagePath}
          onUseSample={handleUseSampleAsset}
        />
      </section>

      <section className="mw-card-grid">
        <UploadFormCard
          draft={descriptor.draft}
          onDraftChange={onDraftChange}
        />
        <UploadChecklistCard checklist={descriptor.checklist} />
      </section>

      <section className="mw-card-grid">
        <UploadDraftSummaryCard
          fields={descriptor.fields}
          section={themeSection}
        />
        <UploadDetectionCard
          detection={descriptor.detection}
          section={detectionSection}
        />
      </section>

      <footer className="mw-footer-action">
        <button
          type="button"
          className="mw-primary-button"
          onClick={onContinue}
          disabled={!descriptor.draft.imagePath}
        >
          进入当前解读流程
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
