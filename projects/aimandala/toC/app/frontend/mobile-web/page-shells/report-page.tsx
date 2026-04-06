import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes, type MobileWebRouteId } from "../routes";
import {
  LoadingProgressCard,
  ReportMetricsRow,
  ReportSections,
  StructuredReportCards,
  UploadAssetStatusCard,
} from "../components/report-cards";
import { getLiteStructuredReport } from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";
import { getUploadAssetRef, type MobileWebUploadDraft } from "../state";
import type { ReportPageSection } from "../pages";

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

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function parseReportSections(markdown: string | null | undefined): ReportPageSection[] {
  if (!markdown) {
    return [];
  }

  const normalized = markdown.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const sections: ReportPageSection[] = [];
  let currentHeading = "完整解读";
  let buffer: string[] = [];

  const pushSection = () => {
    const body = stripMarkdown(buffer.join("\n")).trim();
    if (!body) return;
    sections.push({
      id: `${sections.length + 1}`,
      heading: stripMarkdown(currentHeading),
      body,
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const strongHeadingMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);

    if (headingMatch || strongHeadingMatch) {
      pushSection();
      currentHeading = headingMatch?.[1] ?? strongHeadingMatch?.[1] ?? currentHeading;
      buffer = [];
      continue;
    }

    if (line.trim() === "---") {
      continue;
    }

    buffer.push(line);
  }

  pushSection();
  return sections;
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
  const structured = getLiteStructuredReport(state.report);
  const uploadAsset = uploadDraft ? getUploadAssetRef(uploadDraft) : null;
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const isUpgradeRoute = route === "upgrade" || state.step === "upgradePlaceholder";
  const canRetryRefresh = Boolean(isError && state.interpretation?.interpretation_id);
  const canOpenUpgrade = Boolean(
    !isLoading && !isError && !isUpgradeRoute && (state.report?.can_upgrade || state.status?.can_upgrade),
  );
  const existingHint = state.interpretation?.existing
    ? "当前命中了已有解读记录，本次直接复用了同一用户、同一图片、同一主题下的现有结果。"
    : null;
  const reportSections = parseReportSections(typeof state.report?.report === "string" ? state.report.report : null);
  const reportTitle = structured?.title || state.report?.title || (isUpgradeRoute ? "一梳 Pro 版入口" : "你的曼陀罗解读");
  const reportSubtitle = isUpgradeRoute
    ? "当前先进入 Pro 版兼容入口，后续再补正式升级页设计；这里先把报告内容和主路径缝顺。"
    : structured?.overall_impression || state.report?.overall_impression || "曼曼已经把这一轮 Lite 版解读整理好了。";
  const primaryLabel = isLoading
    ? "继续查看生成进度"
    : canRetryRefresh
      ? "重试刷新结果"
      : isUpgradeRoute
        ? "查看历史记录"
        : canOpenUpgrade
          ? "查看一梳 Pro 版入口"
          : "开始新一轮上传";
  const secondaryLabel = isLoading || isError ? "返回上传页" : "重新上传画作";
  const footerHint = isLoading
    ? "当前仍在生成 Lite 结果，你可以继续等待，或先返回上传页调整输入。"
    : canRetryRefresh
      ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
      : isUpgradeRoute
        ? "当前已经进入一梳 Pro 版兼容入口页，可以先回看历史记录，后续再继续补齐正式 Pro 主路径。"
        : canOpenUpgrade
          ? "一镜 Lite 版已经准备好，当前可以继续进入一梳 Pro 版入口，也可以重新上传新的画作。"
          : isError
            ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
            : "Lite 结果已经准备好。现在先以内容为准，后续再对齐 Figma 设计稿。";
  const metrics = [
    {
      label: "当前版本",
      value: isUpgradeRoute ? "Pro 入口" : "Lite 结果",
    },
    {
      label: "解读状态",
      value: isLoading
        ? `生成中 ${state.status?.generation_progress ?? state.interpretation?.generation_progress ?? 0}%`
        : isError
          ? "等待重试"
          : "已完成",
    },
    {
      label: "日期",
      value: new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  const contentSections: ReportPageSection[] = reportSections.length
    ? reportSections
    : structured
      ? [
          {
            id: "fallback-impression",
            heading: "整体感受",
            body: structured.overall_impression,
          },
        ]
      : [
          {
            id: "empty-report",
            heading: "报告内容待补齐",
            body: "当前还没有可展示的完整正文内容。我们先把主路径和内容承载位置缝顺，后续再按 Figma 设计稿复刻正式报告页。",
          },
        ];

  return (
    <MobileWebAppShell
      route={
        mobileWebRoutes.find((item) => item.id === (route === "upgrade" ? "upgrade" : "report")) ??
        mobileWebRoutes[0]
      }
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
    >
      <section className="mw-hero-card">
        <p className="mw-kicker">{isUpgradeRoute ? "一梳 Pro 版兼容入口" : "一镜 Lite 版"}</p>
        <h2>{reportTitle}</h2>
        <p>{reportSubtitle}</p>
      </section>

      <ReportMetricsRow metrics={metrics} />

      {existingHint ? (
        <section className="mw-inline-banner mw-inline-banner--runtime">
          <strong>当前复用了已有记录</strong>
          <p>{existingHint}</p>
        </section>
      ) : null}

      {isLoading ? <LoadingProgressCard state={state} /> : null}

      {environmentLabel && uploadDraft ? (
        <UploadAssetStatusCard imagePath={uploadDraft.imagePath} uploadAsset={uploadAsset} />
      ) : null}

      {structured ? <StructuredReportCards structured={structured} /> : null}

      <ReportSections sections={contentSections} />

      {state.lastError ? (
        <section className="mw-inline-banner mw-inline-banner--preview">
          <strong>当前流程有异常</strong>
          <p>{state.lastError}</p>
        </section>
      ) : null}

      <footer className="mw-footer-action">
        <p className="mw-footer-hint">{footerHint}</p>
        <div className="mw-button-row">
          <button type="button" className="mw-secondary-button" onClick={onSecondaryAction}>
            {secondaryLabel}
          </button>
          <button type="button" className="mw-primary-button" onClick={onPrimaryAction} disabled={primaryDisabled}>
            {primaryLabel}
          </button>
        </div>
      </footer>
    </MobileWebAppShell>
  );
}
