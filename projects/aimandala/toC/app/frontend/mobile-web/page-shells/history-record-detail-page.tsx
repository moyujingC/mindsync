import type { ReactNode } from "react";
import { MobileWebAppShell } from "../app-shell";
import { createHistoryRecordDetailPageDescriptor, type HistoryRecordDetailStepDescriptor } from "../pages";
import { mobileWebRoutes, type MobileWebRouteId } from "../routes";
import { SharedAppTopBar } from "../../shared/ui";
import type { InterpretationRecordResponse, InterpretationVersion } from "../../shared/types";
import historyDetailThumb from "../assets/history-dunhuang-pattern-clean.png";

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function LoaderIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={spinning ? "am-lucide-spin" : undefined}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 14.1 8.8 20 11 14.1 13.2 12 19 9.9 13.2 4 11 9.9 8.8 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8v4.6l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6 15 12 9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryRecordDetailStatusBadge({
  tone,
  label,
  spinning = false,
}: {
  tone: "jade" | "gold" | "muted";
  label: string;
  spinning?: boolean;
}) {
  const icon =
    tone === "jade" ? (
      <CheckIcon />
    ) : tone === "gold" && spinning ? (
      <LoaderIcon spinning />
    ) : tone === "gold" ? (
      <SparklesIcon />
    ) : (
      <LockIcon />
    );

  return (
    <span className={`mw-history-detail-badge mw-history-detail-badge--${tone}`}>
      <span className="mw-history-detail-badge__icon">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function HistoryRecordDetailTimeline({
  items,
}: {
  items: ReturnType<typeof createHistoryRecordDetailPageDescriptor>["timeline"];
}) {
  return (
    <div className="mw-history-detail-timeline__list">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <article
            key={item.id}
            className={`mw-history-detail-timeline__item mw-history-detail-timeline__item--${item.state}`}
          >
            <div className="mw-history-detail-timeline__rail" aria-hidden="true">
              <span className="mw-history-detail-timeline__dot" />
              {isLast ? null : <span className="mw-history-detail-timeline__line" />}
            </div>
            <div className="mw-history-detail-timeline__content">
              <p className="mw-history-detail-timeline__label">{item.label}</p>
              {item.time ? (
                <p className="mw-history-detail-timeline__time">{item.time}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function HistoryRecordDetailCard({
  as: Component = "section",
  className,
  children,
}: {
  as?: "article" | "section";
  className: string;
  children: ReactNode;
}) {
  return <Component className={className}>{children}</Component>;
}

function HistoryRecordDetailStepAction({
  step,
  busy,
  onOpenReportType,
}: {
  step: HistoryRecordDetailStepDescriptor;
  busy: boolean;
  onOpenReportType?: (reportType: InterpretationVersion) => void;
}) {
  const label = busy ? "打开中..." : step.actionLabel;
  const isInline = step.actionEmphasis === "inline";
  const buttonClassName = isInline
    ? "mw-history-detail-link"
    : step.actionEmphasis === "primary"
      ? "mw-primary-button"
      : "mw-secondary-button";

  return (
    <div className="mw-history-detail-step__actions">
      <button
        type="button"
        className={buttonClassName}
        disabled={busy}
        onClick={() => onOpenReportType?.(step.reportType)}
      >
        {isInline ? (
          <>
            <EyeIcon />
            <span>{label}</span>
            <ChevronRightIcon size={13} />
          </>
        ) : (
          <>
            {step.showSpinner && !busy ? <LoaderIcon spinning /> : step.reportType === "lite" ? <EyeIcon /> : null}
            <span>{label}</span>
            {step.actionEmphasis === "primary" ? <ChevronRightIcon /> : null}
          </>
        )}
      </button>
    </div>
  );
}

function HistoryRecordDetailStepCard({
  step,
  stateClassName,
  busy,
  onOpenReportType,
}: {
  step: HistoryRecordDetailStepDescriptor;
  stateClassName?: string;
  busy: boolean;
  onOpenReportType?: (reportType: InterpretationVersion) => void;
}) {
  const className = [
    "mw-history-detail-step",
    `mw-history-detail-step--${step.reportType}`,
    stateClassName,
  ].filter(Boolean).join(" ");

  return (
    <HistoryRecordDetailCard as="article" className={className}>
      <header className="mw-history-detail-step__header">
        <div>
          <p className="mw-history-detail-step__index">{step.stepLabel}</p>
          <h3>{step.title}</h3>
        </div>
        <HistoryRecordDetailStatusBadge
          tone={step.statusTone}
          label={step.statusLabel}
          spinning={step.showSpinner}
        />
      </header>

      <p className="mw-history-detail-step__body">{step.description}</p>

      {step.progressPercent != null ? (
        <div className="mw-history-detail-progress">
          <div className="mw-history-detail-progress__track">
            <i style={{ width: `${step.progressPercent}%` }} />
          </div>
          <div className="mw-history-detail-progress__meta">
            <span>{step.progressHint}</span>
            <span>{step.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      <HistoryRecordDetailStepAction
        step={step}
        busy={busy}
        onOpenReportType={onOpenReportType}
      />
    </HistoryRecordDetailCard>
  );
}

export interface MobileWebHistoryRecordDetailPageProps {
  route: MobileWebRouteId;
  record: InterpretationRecordResponse;
  openingReportType?: InterpretationVersion | null;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onBackToHistory?: () => void;
  onOpenReportType?: (reportType: InterpretationVersion) => void;
}

export function MobileWebHistoryRecordDetailPage({
  route,
  record,
  openingReportType = null,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onBackToHistory,
  onOpenReportType,
}: MobileWebHistoryRecordDetailPageProps) {
  const descriptor = createHistoryRecordDetailPageDescriptor(record);
  const liteBusy = openingReportType === "lite";
  const proBusy = openingReportType === "pro";

  return (
    <MobileWebAppShell
      route={mobileWebRoutes.find((item) => item.id === route) ?? mobileWebRoutes[0]}
      className="mw-history-shell"
      hideHeader
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
    >
      <div className="mw-history-page mw-history-detail-shell">
        <SharedAppTopBar
          title="解读详情"
          backLabel="返回历史记录"
          onBack={onBackToHistory}
          className="mw-history-topbar"
          style={{ ["--am-app-topbar-bleed" as string]: "0px" }}
        />

        <div className="mw-history-detail-page">
          <HistoryRecordDetailCard className="mw-history-detail-summary">
            <div
              className={`mw-history-detail-summary__thumb${descriptor.imageUrl ? " has-image" : ""}`}
              style={{
                ["--mw-history-detail-thumb-image" as string]: `url(${descriptor.imageUrl ?? historyDetailThumb})`,
              }}
              aria-hidden="true"
            />

            <div className="mw-history-detail-summary__copy">
              <p className="mw-history-detail-summary__eyebrow">本次议题</p>
              <h2>{descriptor.themeLabel}</h2>
              <p className="mw-history-detail-summary__time">
                <ClockIcon />
                <span>{descriptor.createdAtLabel}</span>
              </p>
            </div>

            <div className="mw-history-detail-summary__divider" aria-hidden="true" />

            <div className="mw-history-detail-summary__meta">
              <div className="mw-history-detail-summary__field">
                <span className="mw-history-detail-summary__label">当前状态</span>
                <HistoryRecordDetailStatusBadge
                  tone={
                    descriptor.state === "viewable"
                      ? "gold"
                      : descriptor.state === "generating"
                        ? "gold"
                        : "jade"
                  }
                  label={descriptor.summaryStatusLabel}
                  spinning={descriptor.state === "generating"}
                />
              </div>
              <div className="mw-history-detail-summary__field mw-history-detail-summary__field--end">
                <span className="mw-history-detail-summary__label">版本进度</span>
                <span className={`mw-history-detail-track mw-history-detail-track--${descriptor.state}`}>
                  <span>Lite</span>
                  <span className="mw-history-detail-track__arrow" aria-hidden="true">→</span>
                  <span>Pro</span>
                </span>
              </div>
            </div>
          </HistoryRecordDetailCard>

          <section className="mw-history-detail-flow">
            <div className="mw-history-detail-flow__heading">
              <span aria-hidden="true" />
              <strong>解读进度</strong>
            </div>

            <HistoryRecordDetailStepCard
              step={descriptor.liteStep}
              busy={liteBusy}
              onOpenReportType={onOpenReportType}
            />

            <div
              className={`mw-history-detail-connector${descriptor.state === "not-upgraded" ? " is-pending" : ""}`}
              aria-hidden="true"
            />

            <HistoryRecordDetailStepCard
              step={descriptor.proStep}
              stateClassName={`mw-history-detail-step--${descriptor.state}`}
              busy={proBusy}
              onOpenReportType={onOpenReportType}
            />
          </section>

          <HistoryRecordDetailCard className="mw-history-detail-timeline">
            <h3>{descriptor.timelineTitle}</h3>
            <p>{descriptor.timelineSubtitle}</p>
            <HistoryRecordDetailTimeline items={descriptor.timeline} />
          </HistoryRecordDetailCard>
        </div>
      </div>
    </MobileWebAppShell>
  );
}
