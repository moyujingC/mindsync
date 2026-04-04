import { MobileWebAppShell } from "../app-shell";
import { createReportPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { createMobileWebPageViewModel } from "../view-model";
import { getMobileWebPrimaryAction } from "../state";
import type { MandalaFlowState } from "../../shared/types";

export interface MobileWebReportPageProps {
  state: MandalaFlowState;
}

export function MobileWebReportPage({ state }: MobileWebReportPageProps) {
  const viewModel = createMobileWebPageViewModel(
    state,
    getMobileWebPrimaryAction(state),
  );
  const descriptor = createReportPageDescriptor(viewModel);

  return (
    <MobileWebAppShell route={mobileWebRoutes[2]}>
      <header>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </header>

      {descriptor.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.heading}</h3>
          <p>{section.body}</p>
        </section>
      ))}

      <footer>
        <button type="button">{descriptor.primaryActionLabel}</button>
      </footer>
    </MobileWebAppShell>
  );
}
