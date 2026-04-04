import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes } from "../routes";
import { createUploadPageDescriptor } from "../pages";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

export interface MobileWebUploadPageProps {
  draft: MobileWebUploadDraft;
  detection?: DetectCirclesResponse | null;
}

export function MobileWebUploadPage({
  draft,
  detection = null,
}: MobileWebUploadPageProps) {
  const descriptor = createUploadPageDescriptor(draft, detection);

  return (
    <MobileWebAppShell route={mobileWebRoutes[0]}>
      <header>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </header>

      {descriptor.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          <p>{section.description}</p>
        </section>
      ))}
    </MobileWebAppShell>
  );
}
