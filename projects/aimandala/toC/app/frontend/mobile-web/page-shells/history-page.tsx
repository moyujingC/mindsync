import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { type HistoryFilterId } from "../components/history-cards";
import type { InterpretationListQuery, InterpretationRecordResponse } from "../../shared/types";

const themeOptions = [
  { id: undefined, labelTop: "全面", labelBottom: "看看", icon: "star" },
  { id: "father_relationship", labelTop: "父亲", labelBottom: "关系", icon: "person" },
  { id: "mother_relationship", labelTop: "母亲", labelBottom: "关系", icon: "person" },
  { id: "intimate_relationship", labelTop: "亲密", labelBottom: "关系", icon: "group" },
  { id: "parent_child_relationship", labelTop: "亲子", labelBottom: "关系", icon: "moon" },
  { id: "wealth", labelTop: "财富", labelBottom: "关系", icon: "sparkle" },
  { id: "personal_growth", labelTop: "个人", labelBottom: "成长", icon: "star" },
  { id: "career_development", labelTop: "事业", labelBottom: "发展", icon: "sparkle" },
] as const;

const limitOptions = [
  { value: 10, label: "1 个月" },
  { value: 20, label: "3 个月" },
  { value: 50, label: "6 个月" },
  { value: 100, label: "12 个月" },
] as const;

export interface MobileWebHistoryPageProps {
  records: InterpretationRecordResponse[];
  historyQuery?: InterpretationListQuery;
  activeFilter?: HistoryFilterId;
  filterBusy?: boolean;
  historyStatusLabel?: string;
  historyStatusDetail?: string;
  historyStatusTone?: "preview" | "runtime";
  historyRefreshHint?: string;
  actionBusy?: boolean;
  activeRecordId?: string | null;
  refreshBusy?: boolean;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onBackToUpload?: () => void;
  onFilterChange?: (filter: HistoryFilterId) => void;
  onThemeChange?: (theme?: string) => void;
  onLimitChange?: (limit: number) => void;
  onRefresh?: () => void;
  onOpenRecord?: (interpretationId: string) => void;
}

export function MobileWebHistoryPage({
  records,
  historyQuery,
  activeFilter = "all",
  filterBusy = false,
  historyStatusLabel,
  historyStatusDetail,
  historyStatusTone = "preview",
  historyRefreshHint,
  actionBusy = false,
  activeRecordId = null,
  refreshBusy = false,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onBackToUpload,
  onFilterChange,
  onThemeChange,
  onLimitChange,
  onRefresh,
  onOpenRecord,
}: MobileWebHistoryPageProps) {
  const descriptor = createHistoryPageDescriptor(records);
  const activeTheme = historyQuery?.theme;
  const activeLimit = historyQuery?.limit ?? 20;
  const featuredItems = descriptor.items.slice(0, 4);
  const activeSummary = {
    ready: descriptor.summary.ready,
    pending: descriptor.summary.pending,
  };

  const renderIcon = (icon: (typeof themeOptions)[number]["icon"]) => {
    switch (icon) {
      case "person":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="7" r="3" />
            <path d="M7.5 20c.4-4 2.1-6 4.5-6s4.1 2 4.5 6" />
          </svg>
        );
      case "group":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <circle cx="16" cy="9" r="2.5" />
            <path d="M4.5 20c.5-4 2.4-6 5.5-6 2.1 0 3.6.9 4.5 2.7" />
            <path d="M14 14.5c2.8.1 4.6 1.9 5 5.5" />
          </svg>
        );
      case "moon":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 4.2a7 7 0 1 0 4.3 10.3A6 6 0 1 1 15.5 4.2Z" />
            <circle cx="8" cy="9" r="1.2" />
          </svg>
        );
      case "sparkle":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.5 14.4 9l5.6 2.3-5.6 2.3L12 19.5l-2.4-5.9L4 11.3 9.6 9Z" />
          </svg>
        );
      case "star":
      default:
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3.5 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 20l1-6-4.4-4.2 6-.9Z" />
          </svg>
        );
    }
  };

  const getRecordImage = (interpretationId: string) => {
    const record = records.find((candidate) => candidate.interpretation_id === interpretationId);
    return record?.image_url ?? undefined;
  };

  return (
    <MobileWebAppShell
      route={mobileWebRoutes.find((route) => route.id === "history") ?? mobileWebRoutes[0]}
      className="mw-history-shell"
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
      hideHeader
    >
      <div className="mw-history-page">
        <header className="mw-history-header">
          <button
            type="button"
            className="mw-history-back"
            aria-label="返回上传页"
            onClick={onBackToUpload}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
              <path d="M9 12h12" />
            </svg>
          </button>
          <h1>{descriptor.title}</h1>
        </header>

        <section className="mw-history-intro">
          <div className="mw-history-intro__sky" />
          <div className="mw-history-intro__moon" />
          <h2>查看已生成的解读记录</h2>
          <p>这里保留你已经生成过的所有解读记录，方便你随时回看。</p>
        </section>

        {historyStatusLabel ? (
          <section className={`mw-inline-banner mw-inline-banner--${historyStatusTone}`}>
            <strong>{historyStatusLabel}</strong>
            <p>{historyStatusDetail}</p>
            {historyRefreshHint ? <p>{historyRefreshHint}</p> : null}
            <button
              type="button"
              className="mw-history-refresh"
              onClick={onRefresh}
              disabled={refreshBusy || filterBusy || actionBusy}
            >
              {refreshBusy ? "刷新中..." : "立即刷新"}
            </button>
          </section>
        ) : null}

        <section className="mw-history-featured">
          <h2>待查看的解读</h2>
          <p>这里会优先显示还在生成中，或刚生成完成、还没来得及查看的报告。</p>
          <div className="mw-history-featured__list">
            {featuredItems.map((item, index) => {
              const imageUrl = getRecordImage(item.interpretationId);
              const isBusy = actionBusy && activeRecordId === item.interpretationId;
              const progressPercent = Number.parseInt(item.progressLabel.replace(/\D/g, ""), 10);

              return (
                <article
                  key={item.interpretationId}
                  className={`mw-history-record mw-history-record--${item.statusTone}`}
                >
                  <div
                    className={`mw-history-record__thumb mw-history-record__thumb--${index % 4}`}
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  />
                  <div className="mw-history-record__body">
                    <div className="mw-history-record__title-row">
                      <span className="mw-history-record__icon">{item.recordReady ? "♡" : "✧"}</span>
                      <h3>{item.themeLabel}</h3>
                    </div>
                    <div className="mw-history-record__meta">
                      <span className="mw-history-clock" aria-hidden="true" />
                      <span>{item.subtitle.replace("创建于 ", "")}</span>
                      <strong className={`mw-history-version mw-history-version--${item.focusReportType}`}>
                        {item.focusReportType === "pro" ? "Pro" : "Lite"}
                      </strong>
                    </div>
                    {!item.recordReady ? (
                      <div className="mw-history-record__progress">
                        <span>{Number.isNaN(progressPercent) ? item.progressLabel : `${progressPercent}%`}</span>
                        <div>
                          <i style={{ width: `${Number.isNaN(progressPercent) ? 55 : progressPercent}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="mw-history-record__action"
                    onClick={() => {
                      onOpenRecord?.(item.interpretationId);
                    }}
                    disabled={filterBusy || actionBusy}
                  >
                    <span aria-hidden="true">{item.recordReady ? "⊙" : "◔"}</span>
                    {isBusy ? "正在打开..." : item.recordReady ? "待查看" : "生成中"}
                  </button>
                  {!item.recordReady ? (
                    <span className="mw-history-sr">
                      阶段：{item.stageLabel} 进度：{item.progressLabel} {item.actionLabel}
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mw-history-all">
          <h2>全部历史记录</h2>
          <div className="mw-history-summary">
            <article>
              <strong>{activeSummary.ready}</strong>
              <span>可查看</span>
            </article>
            <article>
              <strong>{activeSummary.pending}</strong>
              <span>生成中</span>
            </article>
          </div>

          <section className="mw-history-filter-block">
            <h3>状态</h3>
            <div className="mw-history-pill-row">
              {[
                { id: "all", label: "全部" },
                { id: "ready", label: "可查看" },
                { id: "pending", label: "待查看" },
                { id: "pending", label: "生成中" },
              ].map((option, index) => (
                <button
                  key={`${option.label}-${index}`}
                  type="button"
                  className={`mw-history-pill${activeFilter === option.id ? " is-active" : ""}`}
                  onClick={() => onFilterChange?.(option.id as HistoryFilterId)}
                  disabled={filterBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="mw-history-filter-block">
            <h3>主题</h3>
            <div className="mw-history-theme-scroll">
              {themeOptions.map((theme) => {
                const active = theme.id ? activeTheme === theme.id : !activeTheme;
                return (
                  <button
                    key={theme.id ?? "all"}
                    type="button"
                    className={`mw-history-theme-card${active ? " is-active" : ""}`}
                    onClick={() => onThemeChange?.(theme.id)}
                    disabled={filterBusy}
                  >
                    {active ? <span className="mw-history-theme-card__check" /> : null}
                    <span className="mw-history-theme-card__icon">{renderIcon(theme.icon)}</span>
                    <strong>{theme.labelTop}<br />{theme.labelBottom}</strong>
                  </button>
                );
              })}
            </div>
            <div className="mw-history-theme-dots">
              {themeOptions.map((theme) => (
                <span key={`dot-${theme.id ?? "all"}`} className={!activeTheme && !theme.id ? "is-active" : ""} />
              ))}
            </div>
          </section>

          <section className="mw-history-filter-block">
            <h3>时间范围</h3>
            <div className="mw-history-pill-row mw-history-pill-row--time">
              <button type="button" className="mw-history-pill is-active" disabled={filterBusy}>
                最近几月
              </button>
              <button type="button" className="mw-history-pill" disabled={filterBusy}>
                自定义范围
              </button>
            </div>
            <div className="mw-history-pill-row mw-history-pill-row--time">
              {limitOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`mw-history-pill${activeLimit === option.value ? " is-active" : ""}`}
                  onClick={() => onLimitChange?.(option.value)}
                  disabled={filterBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {filterBusy ? (
            <section className="mw-inline-banner mw-inline-banner--runtime">
              <strong>正在切换历史筛选</strong>
              <p>当前正在按所选筛选条件重新请求真实历史记录。</p>
            </section>
          ) : null}

          {actionBusy ? (
            <section className="mw-inline-banner mw-inline-banner--runtime">
              <strong>正在打开历史记录</strong>
              <p>当前正在刷新这条记录的真实状态，并根据结果跳转到 loading 或 report。</p>
            </section>
          ) : null}

          <section className="mw-history-empty">
            <p>当前筛选条件下没有记录</p>
            <button
              type="button"
              className="mw-secondary-button"
              onClick={onBackToUpload}
            >
              ← 返回上传页
            </button>
          </section>
        </section>
      </div>
    </MobileWebAppShell>
  );
}
