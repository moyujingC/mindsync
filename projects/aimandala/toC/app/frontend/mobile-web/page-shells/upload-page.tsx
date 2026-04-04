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
  onPreviewDetect?: () => void;
}

export function MobileWebUploadPage({
  draft,
  detection = null,
  onDraftChange,
  onContinue,
  onPreviewDetect,
}: MobileWebUploadPageProps) {
  const descriptor = createUploadPageDescriptor(draft, detection);
  const themeSection = descriptor.sections.find((section) => section.id === "theme");
  const detectionSection = descriptor.sections.find((section) => section.id === "circles");
  const canContinue = Boolean(descriptor.draft.imagePath && descriptor.detection);
  const footerHint = descriptor.draft.imagePath
    ? descriptor.detection
      ? "三圈建议已就绪，可以进入当前解读流程。"
      : "先完成三圈检测，再进入当前解读流程。"
    : "请先选择一张画作。";

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
          onSelectBrowserFile={(filePath) => {
            onDraftChange?.({
              imagePath: filePath,
            });
          }}
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
          onPreviewDetect={onPreviewDetect}
        />
      </section>

      <footer className="mw-footer-action">
        <p className="mw-footer-hint">{footerHint}</p>
        <button
          type="button"
          className="mw-primary-button"
          onClick={onContinue}
          disabled={!canContinue}
        >
          进入当前解读流程
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
