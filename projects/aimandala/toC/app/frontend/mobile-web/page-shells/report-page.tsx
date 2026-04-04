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
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryDisabled?: boolean;
}

export function MobileWebReportPage({
  state,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onPrimaryAction,
  onSecondaryAction,
  primaryDisabled = false,
}: MobileWebReportPageProps) {
  const viewModel = createMobileWebPageViewModel(
    state,
    getMobileWebPrimaryAction(state),
  );
  const descriptor = createReportPageDescriptor(viewModel);
  const structured = getLiteStructuredReport(state.report);
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const canRetryRefresh = Boolean(
    isError && state.interpretation?.interpretation_id,
  );
  const primaryLabel = isLoading
    ? "继续查看生成进度"
    : canRetryRefresh
      ? "重试刷新结果"
      : descriptor.primaryActionLabel;
  const secondaryLabel = isLoading || isError ? "返回上传页" : "重新上传画作";
  const footerHint = isLoading
    ? "当前仍在生成 Lite 结果，你可以继续等待，或先返回上传页调整输入。"
    : canRetryRefresh
      ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
    : isError
      ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
    : "Lite 结果已经准备好，你可以查看历史记录，或重新开始一轮新的上传。";

  return (
    <MobileWebAppShell
      route={mobileWebRoutes[2]}
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
    >
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
        <p className="mw-footer-hint">{footerHint}</p>
        <div className="mw-button-row">
          <button
            type="button"
            className="mw-secondary-button"
            onClick={onSecondaryAction}
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            className="mw-primary-button"
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </button>
        </div>
      </footer>
    </MobileWebAppShell>
  );
}
