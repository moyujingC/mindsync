import brandPattern from "../assets/pattern.webp";
import { type MobileWebRouteId } from "../routes";
import {
  LoadingProgressCard,
  ReportSections,
} from "../components/report-cards";
import { getThemeDisplayName } from "../../shared/core";
import { createReportFollowup } from "../../shared/api";
import { isReportFollowupEnabled } from "../../shared/api/config";
import type { MandalaFlowState, ReportFollowupTurn } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";
import type { ReportPageSection } from "../pages";
import { useEffect, useState, type CSSProperties } from "react";

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
  primaryLabel?: string;
  secondaryLabel?: string;
  footerHint?: string;
}

interface FollowupMessage extends ReportFollowupTurn {
  references?: string[];
  boundary?: boolean;
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

function ReportBackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a3 3 0 1 0-2.82-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 14a3 3 0 1 0 2.82 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15.3 7.4 8.7 10.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.7 13.4 15.3 16.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReportSparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 14.1 8.8 20 11 14.1 13.2 12 19 9.9 13.2 4 11 9.9 8.8 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
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

function getRecordString(
  record: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildReportEvidenceSections(state: MandalaFlowState): ReportPageSection[] {
  const sections: ReportPageSection[] = [];
  const visualDraft = state.report?.visual_draft ?? null;
  const promptPackManifest = state.report?.prompt_pack_manifest ?? null;
  const qualityGate = state.report?.quality_gate ?? null;
  const runSummary = state.report?.run_summary ?? null;

  const visualDraftText =
    getRecordString(visualDraft, "visual_draft_md") ??
    getRecordString(visualDraft, "visual_observation_md") ??
    getRecordString(visualDraft, "summary") ??
    getRecordString(visualDraft, "global_visual_summary");
  if (visualDraftText) {
    sections.push({
      id: "visual-draft",
      heading: "视觉草稿",
      body: visualDraftText,
    });
  }

  const promptPackId =
    getRecordString(promptPackManifest, "pack_id") ??
    getRecordString(promptPackManifest, "id") ??
    getRecordString(promptPackManifest, "version");
  const qualityStatus =
    getRecordString(qualityGate, "status") ??
    getRecordString(qualityGate, "result") ??
    (typeof qualityGate?.passed === "boolean" ? (qualityGate.passed ? "passed" : "failed") : null);
  const runSummaryLines = runSummary
    ? Object.entries(runSummary)
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => `${key}: ${String(value)}`)
    : [];

  const runtimeText = [
    promptPackId ? `提示词包：${promptPackId}` : null,
    qualityStatus ? `质量门：${qualityStatus}` : null,
    runSummaryLines.length ? runSummaryLines.join("\n") : null,
  ]
    .filter((item): item is string => Boolean(item))
    .join("\n");

  if (runtimeText) {
    sections.push({
      id: "run-summary",
      heading: "运行摘要",
      body: runtimeText,
    });
  }

  return sections;
}

export function MobileWebReportPage({
  state,
  uploadDraft,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onPrimaryAction,
  onSecondaryAction,
  primaryDisabled = false,
  primaryLabel,
  secondaryLabel,
  footerHint,
}: MobileWebReportPageProps) {
  const [followupInput, setFollowupInput] = useState("");
  const [followupMessages, setFollowupMessages] = useState<FollowupMessage[]>([]);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const [followupStatus, setFollowupStatus] = useState<string | null>(null);
  const [followupSending, setFollowupSending] = useState(false);
  const previewImage = uploadDraft?.imagePath ?? state.selectedImage?.imagePath ?? null;
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const isProReport = state.report?.version === "pro" || state.step === "proReady";
  const canRetryRefresh = Boolean(isError && state.interpretation?.interpretation_id);
  const themeLabel = getThemeDisplayName(uploadDraft?.theme) ?? "财富关系";
  const existingHint = state.interpretation?.existing
    ? "当前命中了已有解读记录，本次直接复用了同一用户、同一图片、同一议题下的现有结果。"
    : null;
  const reportSections = parseReportSections(typeof state.report?.report === "string" ? state.report.report : null);
  const personaName = state.report?.persona?.display_name || "曼曼";
  const evidenceSections = buildReportEvidenceSections(state);
  const reportTitle = isError
    ? "报告暂未生成"
    : state.report?.title || (isProReport ? "一梳 Pro 版" : "你的曼陀罗解读");
  const reportSubtitle = isError
    ? "这次生成没有完成，请先查看下方提示，再返回上传页调整输入。"
    : isProReport
      ? "当前正在查看 Pro 版解读。"
      : state.report?.overall_impression ||
        `${personaName}已经帮你整理出这幅画里最核心的一条线索。`;
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
  const resolvedPrimaryLabel = primaryLabel ?? (isLoading
    ? "继续查看生成进度"
    : canRetryRefresh
      ? "重试刷新结果"
      : "重新上传画作");
  const resolvedSecondaryLabel = secondaryLabel ?? (isLoading || isError ? "返回上传页" : "重新上传画作");
  const resolvedFooterHint = footerHint ?? (isLoading
    ? `${personaName}正在整理这幅画里的线索。`
      : canRetryRefresh
        ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
        : isProReport
        ? "当前正在查看 Pro 版解读。"
        : isError
          ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
          : "这份报告已经按新版解读链路生成。你可以回到上传页，重新发起下一次解读。");
  const readingSections: ReportPageSection[] =
    reportSections.length > 0
      ? reportSections
      : [
          {
            id: "empty-report",
            heading: "报告内容待补齐",
            body: "当前还没有可展示的完整正文内容。请确认后端 /api/wealth-reports 已返回 final_report_md。",
          },
        ];
  const contentSections = isError ? [] : [...readingSections, ...evidenceSections];
  const readingPath =
    contentSections
      .map((section) => section.heading)
      .filter(Boolean)
      .join(" · ") || "完整解读 · 视觉草稿 · 运行摘要";
  const reportToneLabel = isProReport ? "一梳 Pro 版" : "一镜 Lite 版";
  const followupEnabled = isReportFollowupEnabled() && !isLoading && !isError && Boolean(state.report?.report);
  const reportPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as CSSProperties;

  useEffect(() => {
    setFollowupMessages([]);
    setFollowupInput("");
    setFollowupError(null);
    setFollowupStatus(null);
    setFollowupSending(false);
  }, [state.report?.interpretation_id]);

  async function handleSendFollowup() {
    const question = followupInput.trim();
    const report = state.report;
    if (!question || followupSending || !report?.interpretation_id || !report.report) {
      return;
    }
    const userMessage: FollowupMessage = { role: "user", content: question };
    const history = followupMessages;
    setFollowupMessages((current) => [...current, userMessage]);
    setFollowupInput("");
    setFollowupError(null);
    setFollowupStatus(`${personaName}正在基于这份报告整理线索。`);
    setFollowupSending(true);
    try {
      const response = await createReportFollowup({
        report_id: report.interpretation_id,
        question,
        report_mode: report.version,
        final_report_md: report.report,
        final_report: report.structured ?? {},
        visual_draft: report.visual_draft ?? null,
        history,
        theme: uploadDraft?.theme ?? "wealth",
        theme_label: themeLabel,
        painting_intention: uploadDraft?.paintingIntention ?? "",
        painting_feeling: uploadDraft?.paintingFeeling ?? "",
      });
      const references = response.referenced_report_sections
        .map((section) => section.title || section.label || section.excerpt || section.quote || "")
        .filter(Boolean)
        .slice(0, 3);
      setFollowupMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer_md,
          references,
          boundary: response.out_of_scope,
        },
      ]);
      setFollowupStatus(response.out_of_scope ? `${personaName}已把问题拉回本次报告边界。` : "已基于本次报告整理好回复。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "报告追问暂时不可用，请稍后再试。";
      setFollowupError(message);
      setFollowupStatus(null);
    } finally {
      setFollowupSending(false);
    }
  }

  return (
    <main className="mw-report-page" style={reportPatternStyle}>
      <nav className="mw-report-nav" aria-label="报告导航">
        <button type="button" className="mw-report-nav__button" onClick={onSecondaryAction} aria-label="返回上传页">
          <ReportBackIcon />
        </button>
        <div className="mw-report-nav__brand">
          <span>{isProReport ? "解读报告(Pro版)" : "解读报告(Lite版)"}</span>
        </div>
        <button type="button" className="mw-report-nav__button" aria-label="分享报告">
          <ReportShareIcon />
        </button>
      </nav>

      <section className="mw-report-hero">
        <div className="am-pattern-overlay" />
        <span className="mw-report-hero__glow" aria-hidden="true" />
        <span className="am-floating-particle mw-report-particle mw-report-particle--one" aria-hidden="true" />
        <span className="am-floating-particle mw-report-particle mw-report-particle--two" aria-hidden="true" />
        <span className="am-floating-particle mw-report-particle mw-report-particle--three" aria-hidden="true" />

        <div className="mw-report-hero__preview">
          <span className="mw-report-hero__preview-glow" aria-hidden="true" />
          <div className="mw-report-hero__image-shell">
            {previewImage ? (
              <img
                className="mw-report-hero__image"
                src={previewImage}
                alt="当前曼陀罗"
              />
            ) : (
              <span className="mw-report-hero__image-placeholder" aria-hidden="true" />
            )}
          </div>
          <span className="mw-report-hero__badge">{isProReport ? "Pro版" : "Lite版"}</span>
        </div>

        <div className="mw-report-hero__copy">
          <p className="mw-report-hero__brandline">一镜一梳 · {personaName}陪你一起读懂这幅画</p>
          <h1>{reportTitle}</h1>
          <span className="mw-report-hero__date">{generatedAt}生成</span>
          <p className="mw-report-hero__summary">{reportSubtitle}</p>
          <div className="mw-report-hero__meta">
            <span>{reportToneLabel}</span>
            <span>{themeLabel}</span>
            <span>{statusLabel}</span>
          </div>
        </div>
      </section>

      <section className="mw-report-content">
        <span className="mw-report-content__noise" aria-hidden="true" />

        {environmentLabel ? (
          <section className={`mw-inline-banner mw-inline-banner--${environmentTone}`}>
            <strong>{environmentLabel}</strong>
            <p>{environmentDetail}</p>
          </section>
        ) : null}

        {existingHint ? (
          <section className="mw-inline-banner mw-inline-banner--runtime">
            <strong>当前复用了已有记录</strong>
            <p>{existingHint}</p>
          </section>
        ) : null}

        {isLoading ? <LoadingProgressCard state={state} /> : null}

        {!isError ? (
          <section className="mw-report-story">
            <article className="mw-report-impression">
              <div className="mw-report-impression__title">
                <span aria-hidden="true" />
                <strong>整体印象</strong>
              </div>
              <p>{reportSubtitle}</p>
              {!isLoading && !isError ? (
                <small>阅读路径：{readingPath}</small>
              ) : null}
            </article>

            <div className="mw-report-story__intro">
              <ReportSparkleIcon />
              <span>报告正文</span>
              <i aria-hidden="true" />
            </div>
            <ReportSections sections={contentSections} />
          </section>
        ) : null}

        {state.lastError ? (
          <section className="mw-inline-banner mw-inline-banner--preview">
            <strong>当前流程有异常</strong>
            <p>{state.lastError}</p>
          </section>
        ) : null}

        {followupEnabled ? (
          <section className="mw-report-followup">
            <strong>对这份报告有疑问，可以问{personaName}。</strong>
            <p>{personaName}会基于本次画作和报告内容，陪你把某一段看得更清楚。</p>
            <p>可以问：这段报告是什么意思、这个画面线索如何理解、这周可以从哪里开始。不能问：诊断、预测、投资建议或让{personaName}替你做决定。</p>
            {followupMessages.length === 0 ? (
              <p>嗨，我是{personaName}。你可以问我这份解读里最在意的部分，我会陪你一起读清楚。</p>
            ) : null}
            {followupMessages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="mw-report-followup__message">
                <p>
                  <strong>{message.role === "user" ? "你" : personaName}：</strong>{message.content}
                </p>
                {message.boundary ? <p>这是一条边界回应。</p> : null}
                {message.references && message.references.length > 0 ? (
                  <p>参考报告段落：{message.references.join("、")}</p>
                ) : null}
              </div>
            ))}
            {followupStatus ? <p>{followupStatus}</p> : null}
            {followupError ? <p>{followupError}</p> : null}
            <div className="mw-button-row">
              <input
                value={followupInput}
                disabled={followupSending}
                onChange={(event) => setFollowupInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !followupSending) {
                    event.preventDefault();
                    void handleSendFollowup();
                  }
                }}
                placeholder="输入你想继续追问的报告问题"
              />
              <button type="button" className="mw-primary-button" disabled={followupSending || !followupInput.trim()} onClick={() => void handleSendFollowup()}>
                {followupSending ? `${personaName}正在整理这段线索` : `问${personaName}`}
              </button>
            </div>
            <p>{personaName}只能解释本次报告和画面线索，不能替代专业心理咨询、医疗建议、财务建议或重大现实决策。</p>
          </section>
        ) : null}

        <footer className="mw-footer-action">
          <div className="mw-footer-panel">
            <p className="mw-footer-hint">{resolvedFooterHint}</p>
            <div className="mw-button-row">
              <button type="button" className="mw-secondary-button" onClick={onSecondaryAction}>
                {resolvedSecondaryLabel}
              </button>
              <button type="button" className="mw-primary-button" onClick={onPrimaryAction} disabled={primaryDisabled}>
                {resolvedPrimaryLabel}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
