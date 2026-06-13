import { useState, type CSSProperties, type ReactNode } from "react";

import brandPattern from "../assets/pattern.webp";
import logoNiwu from "../assets/logo-niwu.webp";
import { type MobileWebRouteId } from "../routes";
import { LoadingProgressCard } from "../components/report-cards";
import {
  buildReportDocument,
  type ReportDocumentModule,
  type ReportDocumentModuleItem,
} from "../report-document";
import type { MandalaFlowState } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

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

interface LiteInsightViewModel {
  id: string;
  icon: string;
  label: string;
  color: string;
  content: string;
}

interface LitePracticeViewModel {
  action: string;
  observe: string;
}

const INSIGHT_FALLBACK_ICONS = ["○", "◇", "✦", "△", "◌", "✧"];
const INSIGHT_FALLBACK_COLORS = [
  "#5B8C5A",
  "#D4883E",
  "#4A7FB5",
  "#8B6AAE",
  "#C25B56",
  "#C8A066",
];

const PRO_DEEPER_POINTS = [
  "关系模式：这些线索背后，是怎样的相处与连接方式",
  "能量卡点：你目前的停滞，具体卡在了哪一环",
  "三圈能量：内在-关系-外在的深层互动地图",
  "模式形成的原因：这一切是如何一步步长出来的",
  "调节方向：可以从哪里开始，温和地松动它",
];

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

function ReportDownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ReportRefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-13.2 6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12A8 8 0 0 1 17.2 5.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 3v3.2h3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 20.9v-3.2H3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportArrowRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getModuleText(module: ReportDocumentModule): string {
  return [module.subtitle, module.body].filter(Boolean).join("\n").trim();
}

function isModuleType(module: ReportDocumentModule, keywords: string[]): boolean {
  const haystack = `${module.type ?? ""} ${module.title}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function splitPracticeText(text: string): LitePracticeViewModel {
  const cleaned = text.trim();
  const parts = cleaned
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    action:
      parts[0] ??
      "这周给自己留出十分钟，安静看一眼这幅画里最吸引你的部分，记录当下最直接的感受。",
    observe:
      parts.slice(1).join("\n") ||
      "观察：这个小动作之后，你的身体和情绪有没有出现一点松动或确认感。",
  };
}

function findSummaryText(
  summary: string,
  modules: ReportDocumentModule[],
): string {
  const summaryModule = modules.find((module) =>
    isModuleType(module, ["summary", "impression", "整体印象", "总览"]),
  );
  return summary || getModuleText(summaryModule ?? modules[0] ?? { body: "", id: "", title: "" });
}

function buildInsights(modules: ReportDocumentModule[], summaryText: string): LiteInsightViewModel[] {
  const insightModule = modules.find((module) =>
    isModuleType(module, ["insight", "core", "看见", "线索", "核心"]),
  );
  const sourceItems = insightModule?.items ?? [];

  if (sourceItems.length > 0) {
    return sourceItems.slice(0, 6).map((item, index) =>
      normalizeInsightItem(item, index),
    );
  }

  const practiceModule = findPracticeModule(modules);
  const candidates = modules.filter((module) => {
    if (module.id === insightModule?.id || module.id === practiceModule?.id) return false;
    if (isModuleType(module, ["summary", "impression", "整体印象", "总览"])) return false;
    return getModuleText(module).length > 0;
  });

  const generated = candidates.slice(0, 6).map((module, index) => ({
    id: module.id,
    icon: INSIGHT_FALLBACK_ICONS[index % INSIGHT_FALLBACK_ICONS.length],
    label: module.title,
    color: module.accent ?? INSIGHT_FALLBACK_COLORS[index % INSIGHT_FALLBACK_COLORS.length],
    content: getModuleText(module),
  }));

  if (generated.length > 0) return generated;

  return [
    {
      id: "summary-insight",
      icon: "○",
      label: "此刻的主线",
      color: "#9EAA9B",
      content:
        summaryText ||
        "这份 Lite 报告会先保留当前画面里最清晰的一条线索，帮助你从整体感觉进入后续观察。",
    },
  ];
}

function normalizeInsightItem(
  item: ReportDocumentModuleItem,
  index: number,
): LiteInsightViewModel {
  return {
    id: item.id,
    icon: item.icon ?? INSIGHT_FALLBACK_ICONS[index % INSIGHT_FALLBACK_ICONS.length],
    label: item.label,
    color: item.color ?? INSIGHT_FALLBACK_COLORS[index % INSIGHT_FALLBACK_COLORS.length],
    content: item.content,
  };
}

function findPracticeModule(modules: ReportDocumentModule[]): ReportDocumentModule | null {
  return (
    modules.find((module) =>
      isModuleType(module, ["practice", "suggestion", "experiment", "action", "实验", "建议", "行动", "练习"]),
    ) ?? null
  );
}

function buildPractice(modules: ReportDocumentModule[], summaryText: string): LitePracticeViewModel {
  const explicitPractice = findPracticeModule(modules);
  if (explicitPractice) {
    return {
      action:
        explicitPractice.action ??
        splitPracticeText(getModuleText(explicitPractice)).action,
      observe:
        explicitPractice.observe ??
        splitPracticeText(getModuleText(explicitPractice)).observe,
    };
  }

  const lastUsefulModule = [...modules].reverse().find((module) => getModuleText(module));
  if (lastUsefulModule) {
    return splitPracticeText(getModuleText(lastUsefulModule));
  }

  return splitPracticeText(summaryText);
}

function LiteReportModuleView({
  index,
  title,
  meta,
  accent,
  children,
}: {
  index: string;
  title: string;
  meta?: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="mw-lite-module">
      <div className="mw-lite-module__header">
        <span className="mw-lite-module__index" style={{ "--mw-lite-accent": accent } as CSSProperties}>
          {index}
        </span>
        <h2>{title}</h2>
        <span className="mw-lite-module__line" style={{ "--mw-lite-accent": accent } as CSSProperties} />
        {meta ? <span className="mw-lite-module__meta">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function LiteInsightModuleView({ insights }: { insights: LiteInsightViewModel[] }) {
  return (
    <div className="mw-lite-insight-list">
      {insights.map((insight, index) => (
        <article
          key={insight.id}
          className={`mw-lite-insight-card${index === insights.length - 1 ? " mw-lite-insight-card--last" : ""}`}
          style={{ "--mw-lite-insight-color": insight.color } as CSSProperties}
        >
          <span className="mw-lite-insight-card__bar" aria-hidden="true" />
          <div className="mw-lite-insight-card__header">
            <span className="mw-lite-insight-card__icon" aria-hidden="true">
              {insight.icon}
            </span>
            <h3>{insight.label}</h3>
          </div>
          <p>{insight.content}</p>
        </article>
      ))}
    </div>
  );
}

function LitePracticeModuleView({ practice }: { practice: LitePracticeViewModel }) {
  return (
    <article className="mw-lite-practice-card">
      <div className="am-pattern-overlay" />
      <span className="mw-lite-practice-card__glow" aria-hidden="true" />
      <p className="mw-lite-practice-card__action">
        <span aria-hidden="true">◇</span>
        {practice.action}
      </p>
      <p className="mw-lite-practice-card__observe">{practice.observe}</p>
      <div className="mw-lite-practice-card__footer">✦ 今天就可以尝试</div>
    </article>
  );
}

function LiteUpgradePromptView({
  onUpgrade,
  disabled,
  label,
}: {
  onUpgrade?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <section className="mw-lite-upgrade-card" aria-label="升级到 Pro">
      <div className="am-pattern-overlay" />
      <span className="mw-lite-upgrade-card__glow" aria-hidden="true" />
      <div className="mw-lite-upgrade-track">
        <span className="mw-lite-upgrade-track__lite">Lite 已完成</span>
        <span className="mw-lite-upgrade-track__bridge" aria-hidden="true">
          <i />
          <ReportArrowRightIcon />
          <b />
        </span>
        <span className="mw-lite-upgrade-track__pro">Pro 深度版</span>
      </div>

      <h2>继续看见更深的一层</h2>
      <p className="mw-lite-upgrade-card__copy">
        Lite 已经帮你看见本次画作的核心线索。若你想继续理解这些线索背后的关系模式、能量卡点与调节方向，可以升级到 Pro 深度解读。
      </p>

      <div className="mw-lite-upgrade-card__points">
        <span className="mw-lite-upgrade-card__points-label">
          Pro 会在 Lite 的基础上，继续为你展开：
        </span>
        {PRO_DEEPER_POINTS.map((point, index) => (
          <div className="mw-lite-upgrade-point" key={point}>
            <span>{index + 1}</span>
            <p>{point}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mw-lite-upgrade-card__button"
        onClick={onUpgrade}
        disabled={disabled}
      >
        {label ?? "升级到 Pro"}
      </button>
      <div className="mw-lite-upgrade-card__price">
        <span>升级后可继续追问 / 继续梳理</span>
        <i aria-hidden="true" />
        <span>+¥29</span>
      </div>
    </section>
  );
}

function LiteBottomActionsView({
  saved,
  saveLabel,
  reuploadLabel,
  onSave,
  onReupload,
}: {
  saved: boolean;
  saveLabel?: string;
  reuploadLabel?: string;
  onSave: () => void;
  onReupload?: () => void;
}) {
  return (
    <div className="mw-lite-bottom-actions">
      <button type="button" className="mw-lite-bottom-actions__save" onClick={onSave}>
        <ReportDownloadIcon />
        {saved ? "已保存" : saveLabel ?? "保存报告"}
      </button>
      <button type="button" className="mw-lite-bottom-actions__restart" onClick={onReupload}>
        <ReportRefreshIcon />
        {reuploadLabel ?? "重新上传"}
      </button>
    </div>
  );
}

function LiteFooterBrandingView() {
  return (
    <footer className="mw-lite-footer-brand" aria-label="一镜一梳">
      <img src={logoNiwu} alt="" />
      <span>一镜一梳</span>
    </footer>
  );
}

export function MobileWebReportPage({
  state,
  uploadDraft,
  environmentLabel,
  environmentDetail,
  environmentTone = "preview",
  onPrimaryAction,
  onSecondaryAction,
  primaryDisabled = false,
  primaryLabel,
  secondaryLabel,
  footerHint,
}: MobileWebReportPageProps) {
  const [saved, setSaved] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const previewImage =
    uploadDraft?.imagePath ??
    state.report?.image_url ??
    state.selectedImage?.imagePath ??
    null;
  const isLoading = state.step === "liteGenerating";
  const isError = state.step === "error";
  const canRetryRefresh = Boolean(isError && state.interpretation?.interpretation_id);
  const reportDocument = buildReportDocument(state, "lite");
  const summaryText = findSummaryText(reportDocument.summary, reportDocument.modules);
  const insights = buildInsights(reportDocument.modules, summaryText);
  const practice = buildPractice(reportDocument.modules, summaryText);
  const personaName = state.report?.persona?.display_name || "曼曼";
  const reportTitle = isError
    ? "报告暂未生成"
    : reportDocument.title || "你的曼陀罗解读";
  const generatedAt = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const resolvedUpgradeLabel =
    primaryLabel && /升级|Pro/i.test(primaryLabel) ? primaryLabel : "升级到 Pro";
  const resolvedSecondaryLabel =
    secondaryLabel && !/上传画作/.test(secondaryLabel)
      ? secondaryLabel
      : "重新上传";
  const resolvedFooterHint =
    footerHint ??
    (isLoading
      ? `${personaName}正在整理这幅画里的线索。`
      : canRetryRefresh
        ? "这次结果拉取没有顺利完成，你可以先重试刷新当前结果，或返回上传页重新开始。"
        : isError
          ? "这次主路径没有顺利完成，你可以返回上传页调整输入后重试。"
          : "");
  const reportPatternStyle = {
    ["--am-pattern-image" as string]: `url(${brandPattern})`,
  } as CSSProperties;

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="mw-report-page" style={reportPatternStyle}>
      <nav className="mw-report-nav" aria-label="报告导航">
        <button type="button" className="mw-report-nav__button" onClick={onSecondaryAction} aria-label="返回上传页">
          <ReportBackIcon />
        </button>
        <div className="mw-report-nav__brand">
          <img src={logoNiwu} alt="" />
          <span>解读报告(Lite版)</span>
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
        <span className="am-floating-particle mw-report-particle mw-report-particle--four" aria-hidden="true" />

        <div className="mw-report-hero__preview">
          <span className="mw-report-hero__preview-glow" aria-hidden="true" />
          <div className="mw-report-hero__image-shell">
            {previewImage && !imageLoadFailed ? (
              <img
                className="mw-report-hero__image"
                src={previewImage}
                alt="当前曼陀罗"
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <span className="mw-report-hero__image-placeholder" aria-hidden="true" />
            )}
          </div>
          <span className="mw-report-hero__badge">Lite版</span>
        </div>

        <div className="mw-report-hero__copy">
          <h1>{reportTitle}</h1>
          <div className="mw-report-hero__date-line">
            <span>{generatedAt}生成</span>
            <i aria-hidden="true" />
            <span>初步解读</span>
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

        {state.interpretation?.existing ? (
          <section className="mw-inline-banner mw-inline-banner--runtime">
            <strong>当前复用了已有记录</strong>
            <p>当前命中了已有解读记录，本次直接复用了同一用户、同一图片、同一议题下的现有结果。</p>
          </section>
        ) : null}

        {isLoading ? <LoadingProgressCard state={state} /> : null}

        {!isError ? (
          <div className="mw-lite-report-body">
            <LiteReportModuleView index="01" title="整体印象" accent="#9EAA9B">
              <article className="mw-lite-cream-card">
                <p>{summaryText || "当前报告还在整理整体印象，稍后会在这里展示这幅画最清晰的第一层线索。"}</p>
              </article>
            </LiteReportModuleView>

            <LiteReportModuleView
              index="02"
              title="六个核心看见"
              meta={`${insights.length} 项`}
              accent="#C87850"
            >
              <LiteInsightModuleView insights={insights} />
            </LiteReportModuleView>

            <LiteReportModuleView index="03" title="一个小实验" accent="#D4A054">
              <LitePracticeModuleView practice={practice} />
            </LiteReportModuleView>

            <LiteUpgradePromptView
              onUpgrade={onPrimaryAction}
              disabled={primaryDisabled}
              label={resolvedUpgradeLabel}
            />

            <LiteBottomActionsView
              saved={saved}
              saveLabel="保存报告"
              reuploadLabel={resolvedSecondaryLabel}
              onSave={handleSave}
              onReupload={onSecondaryAction}
            />

            {resolvedFooterHint ? <p className="mw-lite-footer-hint">{resolvedFooterHint}</p> : null}

            <LiteFooterBrandingView />
          </div>
        ) : null}

        {state.lastError ? (
          <section className="mw-inline-banner mw-inline-banner--preview">
            <strong>当前流程有异常</strong>
            <p>{state.lastError}</p>
          </section>
        ) : null}

        {isError ? (
          <footer className="mw-footer-action">
            <div className="mw-footer-panel">
              <p className="mw-footer-hint">{resolvedFooterHint}</p>
              <div className="mw-button-row">
                <button type="button" className="mw-secondary-button" onClick={onSecondaryAction}>
                  返回上传页
                </button>
                <button type="button" className="mw-primary-button" onClick={onPrimaryAction} disabled={primaryDisabled}>
                  {canRetryRefresh ? "重试刷新结果" : "重新上传画作"}
                </button>
              </div>
            </div>
          </footer>
        ) : null}
      </section>
    </main>
  );
}
