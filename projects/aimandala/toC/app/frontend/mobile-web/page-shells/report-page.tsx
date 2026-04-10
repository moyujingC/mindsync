import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes, type MobileWebRouteId } from "../routes";
import {
  LoadingProgressCard,
  ReportSections,
  UploadAssetStatusCard,
} from "../components/report-cards";
import {
  getLiteStructuredReport,
  getThemeDisplayName,
  hasProReportAccess,
  resolveSelfUnderstandingReportCta,
} from "../../shared/core";
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

function buildSelfUnderstandingSections(structured: NonNullable<ReturnType<typeof getLiteStructuredReport>>): ReportPageSection[] {
  const blocks = structured.self_understanding_blocks;
  if (!blocks) {
    return [];
  }

  const sections: ReportPageSection[] = [];

  const pushSection = (id: string, heading: string, body: string | null | undefined) => {
    if (typeof body !== "string" || !body.trim()) {
      return;
    }
    sections.push({
      id,
      heading,
      body: body.trim(),
    });
  };

  pushSection("opening-hit", "整体命中", blocks.opening_hit);
  pushSection("visual-evidence", "画面依据", blocks.visual_evidence?.summary);
  pushSection(
    "state-interpretation",
    "状态解释",
    [
      blocks.state_interpretation?.current_state,
      blocks.state_interpretation?.emotional_tension,
      blocks.state_interpretation?.explanation_chain,
    ]
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join("\n\n"),
  );
  pushSection(
    "pattern-naming",
    "模式命名",
    [
      blocks.pattern_naming?.pattern_name,
      blocks.pattern_naming?.pattern_description,
      blocks.pattern_naming?.protective_logic,
    ]
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join("\n\n"),
  );
  pushSection(
    "reality-connection",
    "现实连接",
    [
      blocks.reality_connection?.typical_scene,
      blocks.reality_connection?.current_impact,
    ]
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join("\n\n"),
  );
  pushSection(
    "next-step",
    "一个下一步",
    [
      blocks.next_step?.direction,
      blocks.next_step?.action,
    ]
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join("\n\n"),
  );

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
  const previewImage = uploadDraft?.imagePath ?? state.selectedImage?.imagePath ?? null;
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const isUpgradeRoute = route === "upgrade" || state.step === "upgradePlaceholder";
  const canRetryRefresh = Boolean(isError && state.interpretation?.interpretation_id);
  const themeLabel = getThemeDisplayName(uploadDraft?.theme) ?? "全面解读";
  const resultCta = resolveSelfUnderstandingReportCta({
    theme: uploadDraft?.theme,
    canUpgrade: Boolean(state.report?.can_upgrade || state.status?.can_upgrade),
    hasProAccess: hasProReportAccess(state),
    structured,
  });
  const existingHint = state.interpretation?.existing
    ? "当前命中了已有解读记录，本次直接复用了同一用户、同一图片、同一主题下的现有结果。"
    : null;
  const reportSections = parseReportSections(typeof state.report?.report === "string" ? state.report.report : null);
  const selfUnderstandingSections = structured ? buildSelfUnderstandingSections(structured) : [];
  const reportTitle = structured?.title || state.report?.title || (isUpgradeRoute ? "一梳 Pro 版" : "你的曼陀罗解读");
  const reportSubtitle = isUpgradeRoute
    ? "当前正在查看 Pro 版解读。"
    : structured?.self_understanding_blocks?.opening_hit ||
      structured?.overall_impression ||
      state.report?.overall_impression ||
      "曼曼已经把这一轮 Lite 版解读整理好了。";
  const generatedAt = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const statusLabel = isLoading
    ? `生成中 ${state.status?.generation_progress ?? state.interpretation?.generation_progress ?? 0}%`
    : isError
      ? "等待重试"
      : "已完成";
  const primaryLabel = isLoading
    ? "继续查看生成进度"
      : canRetryRefresh
        ? "重试刷新结果"
        : isUpgradeRoute
        ? "查看历史记录"
        : resultCta.primaryLabel;
  const secondaryLabel = isLoading || isError ? "返回上传页" : "重新上传画作";
  const footerHint = isLoading
      ? "当前仍在生成 Lite 结果，你可以继续等待，或先返回上传页调整输入。"
    : canRetryRefresh
      ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
      : isUpgradeRoute
        ? "当前已经进入一梳 Pro 版，可以先回看历史记录，或返回上传页重新开始。"
        : isError
          ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
          : resultCta.footerHint;
  const readingSections: ReportPageSection[] = selfUnderstandingSections.length
      ? selfUnderstandingSections
      : reportSections.length
        ? reportSections
        : structured
          ? [
              {
                id: "fallback-impression",
                heading: "整体命中",
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
  const summaryComparable = stripMarkdown(reportSubtitle);
  const dedupedSections = readingSections.filter(
    (section, index) =>
      !(index === 0 && stripMarkdown(section.body) === summaryComparable),
  );
  const contentSections =
    dedupedSections.length > 0 ? dedupedSections : readingSections;
  const readingPath =
    contentSections
      .map((section) => section.heading)
      .filter(Boolean)
      .join(" · ") || "整体命中 · 画面依据 · 状态解释";
  const reportToneLabel = isUpgradeRoute ? "一梳 Pro 版" : "一镜 Lite 版";

  return (
    <MobileWebAppShell
      route={
        mobileWebRoutes.find((item) => item.id === (route === "upgrade" ? "upgrade" : "report")) ??
        mobileWebRoutes[0]
      }
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      hideHeader
    >
      <section className="mw-report-hero">
        <div className="mw-report-hero__copy">
          <p className="mw-report-hero__brandline">一镜一梳 · 曼曼陪你慢一点看见这幅画</p>
          <p className="mw-kicker">{reportToneLabel}</p>
          <h2>{reportTitle}</h2>
          <p className="mw-report-hero__summary">{reportSubtitle}</p>
          <div className="mw-report-hero__meta">
            <span className="mw-badge">{isUpgradeRoute ? "Pro" : "Lite"}</span>
            <span className="mw-badge">{themeLabel}</span>
            <span className="mw-badge">{statusLabel}</span>
            <span className="mw-report-hero__date">{generatedAt}</span>
          </div>
          {!isLoading && !isError ? (
            <p className="mw-report-hero__path">阅读路径：{readingPath}</p>
          ) : null}
          {!isLoading && !isError ? (
            <p className="mw-report-hero__whisper">先看见，再理解，最后才是决定下一步。</p>
          ) : null}
        </div>
        {previewImage ? (
          <div className="mw-report-hero__preview">
            <img
              className="mw-report-hero__image"
              src={previewImage}
              alt="当前曼陀罗"
            />
          </div>
        ) : null}
      </section>

      {existingHint ? (
        <section className="mw-inline-banner mw-inline-banner--runtime">
          <strong>当前复用了已有记录</strong>
          <p>{existingHint}</p>
        </section>
      ) : null}

      {isLoading ? <LoadingProgressCard state={state} /> : null}

      <section className="mw-report-story">
        <div className="mw-report-story__intro">
          <span className="mw-report-story__eyebrow">疗愈阅读</span>
          <p>下面这一段，会沿着画面的线索，慢慢把这次状态展开。</p>
        </div>
        <ReportSections sections={contentSections} />
      </section>

      {state.lastError ? (
        <section className="mw-inline-banner mw-inline-banner--preview">
          <strong>当前流程有异常</strong>
          <p>{state.lastError}</p>
        </section>
      ) : null}

      <footer className="mw-footer-action">
        <div className="mw-footer-panel">
          <p className="mw-footer-hint">{footerHint}</p>
          <div className="mw-button-row">
            <button type="button" className="mw-secondary-button" onClick={onSecondaryAction}>
              {secondaryLabel}
            </button>
            <button type="button" className="mw-primary-button" onClick={onPrimaryAction} disabled={primaryDisabled}>
              {primaryLabel}
            </button>
          </div>
        </div>
      </footer>

      {environmentLabel && uploadDraft ? (
        <UploadAssetStatusCard imagePath={uploadDraft.imagePath} uploadAsset={uploadAsset} />
      ) : null}
    </MobileWebAppShell>
  );
}
