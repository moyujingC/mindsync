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
  UploadAssetStatusCard,
} from "../components/report-cards";
import { getLiteStructuredReport } from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";
import type { MobileWebRouteId } from "../routes";
import { getUploadAssetRef, type MobileWebUploadDraft } from "../state";

export interface MobileWebReportPageProps {
  route?: MobileWebRouteId;
  state: MandalaFlowState;
  uploadDraft?: MobileWebUploadDraft;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryDisabled?: boolean;
}

export function MobileWebReportPage({
  route = "report",
  state,
  uploadDraft,
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
  const uploadAsset = uploadDraft ? getUploadAssetRef(uploadDraft) : null;
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const isUpgradeRoute = route === "upgrade" || state.step === "upgradePlaceholder";
  const canRetryRefresh = Boolean(
    isError && state.interpretation?.interpretation_id,
  );
  const canOpenUpgrade = Boolean(
    !isLoading &&
      !isError &&
      !isUpgradeRoute &&
      (state.report?.can_upgrade || state.status?.can_upgrade),
  );
  const existingHint = state.interpretation?.existing
    ? "当前命中了已有解读记录，本次直接复用了同一用户、同一图片、同一主题下的现有结果。"
    : null;
  const primaryLabel = isLoading
    ? "继续查看生成进度"
    : canRetryRefresh
      ? "重试刷新结果"
      : isUpgradeRoute
        ? "查看历史记录"
        : canOpenUpgrade
          ? "查看一梳 Pro 版入口"
      : descriptor.primaryActionLabel;
  const secondaryLabel = isLoading || isError ? "返回上传页" : "重新上传画作";
  const footerHint = isLoading
    ? "当前仍在生成 Lite 结果，你可以继续等待，或先返回上传页调整输入。"
    : canRetryRefresh
      ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
    : isUpgradeRoute
      ? "当前已经进入一梳 Pro 版兼容入口页，可以先回看历史记录，后续再继续补齐正式 Pro 生成主路径。"
    : canOpenUpgrade
      ? "一镜 Lite 版已经准备好，当前可以继续进入一梳 Pro 版入口，也可以重新上传新的画作。"
    : isError
      ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
      : "Lite 结果已经准备好，你可以查看历史记录，或重新开始一轮新的上传。";

  return (
    <MobileWebAppShell
      route={route === "upgrade" ? mobileWebRoutes[4] : mobileWebRoutes[2]}
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

      {existingHint ? (
        <section className="mw-inline-banner mw-inline-banner--runtime">
          <strong>当前复用了已有记录</strong>
          <p>{existingHint}</p>
        </section>
      ) : null}

      {isLoading ? <LoadingProgressCard state={state} /> : null}

      {uploadDraft ? (
        <UploadAssetStatusCard
          imagePath={uploadDraft.imagePath}
          uploadAsset={uploadAsset}
        />
      ) : null}

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
