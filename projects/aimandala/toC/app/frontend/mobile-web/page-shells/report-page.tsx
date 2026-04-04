import { MobileWebAppShell } from "../app-shell";
import { createReportPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { createMobileWebPageViewModel } from "../view-model";
import { getMobileWebPrimaryAction } from "../state";
import {
  LoadingProgressCard,
  ReportMetricsRow,
  ReportSections,
  StructuredReportCards,
} from "../components/report-cards";
import { getLiteStructuredReport } from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";

export interface MobileWebReportPageProps {
  state: MandalaFlowState;
  onPrimaryAction?: () => void;
}

export function MobileWebReportPage({
  state,
  onPrimaryAction,
}: MobileWebReportPageProps) {
  const viewModel = createMobileWebPageViewModel(
    state,
    getMobileWebPrimaryAction(state),
  );
  const descriptor = createReportPageDescriptor(viewModel);
  const structured = getLiteStructuredReport(state.report);
  const isLoading = state.step === "liteGenerating";

  return (
    <MobileWebAppShell route={mobileWebRoutes[2]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">一镜 Lite 版</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <ReportMetricsRow metrics={descriptor.metrics} />

      {isLoading ? <LoadingProgressCard state={state} /> : null}

      {structured ? <StructuredReportCards structured={structured} /> : null}

      <ReportSections sections={descriptor.sections} />

      <footer className="mw-footer-action">
        <button
          type="button"
          className="mw-primary-button"
          onClick={onPrimaryAction}
        >
          {descriptor.primaryActionLabel}
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
