import { MobileWebAppShell } from "../app-shell";
import { createHistoryRecordDetailPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import type { InterpretationRecordResponse, InterpretationVersion } from "../../shared/types";

export interface MobileWebHistoryRecordDetailPageProps {
  record: InterpretationRecordResponse;
  openingReportType?: InterpretationVersion | null;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onBackToHistory?: () => void;
  onOpenReportType?: (reportType: InterpretationVersion) => void;
}

export function MobileWebHistoryRecordDetailPage({
  record,
  openingReportType = null,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onBackToHistory,
  onOpenReportType,
}: MobileWebHistoryRecordDetailPageProps) {
  const descriptor = createHistoryRecordDetailPageDescriptor(record);

  return (
    <MobileWebAppShell
      route={
        mobileWebRoutes.find((route) => route.id === "historyRecordDetail") ?? mobileWebRoutes[0]
      }
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
    >
      <section className="mw-hero-card mw-history-detail-hero">
        <p className="mw-kicker">历史记录详情</p>
        <h2>{descriptor.title}</h2>
        <p className="mw-history-detail-hero__subtitle">{descriptor.subtitle}</p>
        <p className="mw-meta mw-history-detail-hero__meta">
          主题：{descriptor.themeLabel} · 可查看版本：{descriptor.versionSummary}
        </p>
      </section>

      <section className="mw-inline-banner mw-inline-banner--runtime mw-history-detail-status">
        <strong>{descriptor.statusLabel}</strong>
        <p>{descriptor.statusDetail}</p>
        <p className="mw-meta mw-history-detail-status__meta">当前进度：{descriptor.progressLabel}</p>
      </section>

      <section className="am-stack mw-stack mw-history-detail-actions">
        {descriptor.actions.map((action) => {
          const isBusy = openingReportType === action.reportType;

          return (
            <article
              key={action.reportType}
              className={`am-card mw-card mw-history-detail-action-card ${action.emphasis === "primary" ? "mw-card--history-proReady is-primary" : "mw-card--history-ready"}${!action.enabled ? " is-disabled" : ""}${isBusy ? " is-busy" : ""}`}
            >
              <div className="am-card__header mw-card__header">
                <h3>{action.label}</h3>
                <span className={`am-badge mw-badge mw-badge--${action.enabled ? "ready" : "pending"}`}>
                  {action.statusLabel}
                </span>
              </div>
              <p className="mw-history-detail-action-card__body">{action.statusDetail}</p>
              <div className="mw-button-row">
                <button
                  type="button"
                  className="mw-secondary-button mw-secondary-button--inline"
                  disabled={!action.enabled || isBusy}
                  onClick={() => {
                    onOpenReportType?.(action.reportType);
                  }}
                >
                  {isBusy ? "打开中..." : action.label}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="am-card mw-card mw-history-detail-timeline">
        <div className="am-card__header mw-card__header">
          <h3>版本演进</h3>
        </div>
        <div className="am-stack mw-stack mw-history-detail-timeline__list">
          {descriptor.timeline.map((entry) => (
            <article key={entry.id} className="mw-history-detail-timeline__item">
              <p className="mw-history-detail-timeline__title"><strong>{entry.title}</strong></p>
              <p className="mw-meta mw-history-detail-timeline__detail">{entry.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mw-footer-action mw-history-detail-footer">
        <button
          type="button"
          className="mw-secondary-button"
          onClick={onBackToHistory}
        >
          返回历史记录
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
