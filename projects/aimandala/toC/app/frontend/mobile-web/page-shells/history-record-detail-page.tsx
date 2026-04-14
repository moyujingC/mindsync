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
      <section className="mw-hero-card">
        <p className="mw-kicker">历史记录详情</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
        <p className="mw-meta">
          主题：{descriptor.themeLabel} · 可查看版本：{descriptor.versionSummary}
        </p>
      </section>

      <section className="mw-inline-banner mw-inline-banner--runtime">
        <strong>{descriptor.statusLabel}</strong>
        <p>{descriptor.statusDetail}</p>
        <p className="mw-meta">当前进度：{descriptor.progressLabel}</p>
      </section>

      <section className="am-stack mw-stack">
        {descriptor.actions.map((action) => {
          const isBusy = openingReportType === action.reportType;

          return (
            <article
              key={action.reportType}
              className={`am-card mw-card ${action.emphasis === "primary" ? "mw-card--history-proReady" : "mw-card--history-ready"}`}
            >
              <div className="am-card__header mw-card__header">
                <h3>{action.label}</h3>
                <span className={`am-badge mw-badge mw-badge--${action.enabled ? "ready" : "pending"}`}>
                  {action.statusLabel}
                </span>
              </div>
              <p>{action.statusDetail}</p>
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

      <section className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>版本演进</h3>
        </div>
        <div className="am-stack mw-stack">
          {descriptor.timeline.map((entry) => (
            <article key={entry.id}>
              <p><strong>{entry.title}</strong></p>
              <p className="mw-meta">{entry.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mw-footer-action">
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
