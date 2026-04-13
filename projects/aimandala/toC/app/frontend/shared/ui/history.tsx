import { getThemeDisplayName } from "../core";

import type {
  SharedHistoryFilterId,
  SharedHistoryRecordItem,
  SharedHistorySummary,
} from "./types";

export interface SharedHistorySummaryRowProps {
  summary: SharedHistorySummary;
}

export function SharedHistorySummaryRow({
  summary,
}: SharedHistorySummaryRowProps) {
  return (
    <section className="am-metric-row mw-metric-row">
      <article className="am-card am-card--metric mw-metric-card">
        <span>总记录数</span>
        <strong>{summary.total}</strong>
      </article>
      <article className="am-card am-card--metric mw-metric-card">
        <span>已可查看</span>
        <strong>{summary.ready}</strong>
      </article>
      <article className="am-card am-card--metric mw-metric-card">
        <span>生成中</span>
        <strong>{summary.pending}</strong>
      </article>
    </section>
  );
}

const historyFilterOptions: Array<{
  id: SharedHistoryFilterId;
  label: string;
}> = [
  { id: "all", label: "全部" },
  { id: "ready", label: "可查看" },
  { id: "pending", label: "生成中" },
];

export interface SharedHistoryFilterTabsProps {
  activeFilter: SharedHistoryFilterId;
  onChange?: (filter: SharedHistoryFilterId) => void;
  disabled?: boolean;
}

export function SharedHistoryFilterTabs({
  activeFilter,
  onChange,
  disabled = false,
}: SharedHistoryFilterTabsProps) {
  return (
    <section className="mw-filter-row" aria-label="历史记录筛选">
      {historyFilterOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`am-filter-chip mw-filter-chip ${activeFilter === option.id ? "mw-filter-chip--active" : ""}`}
          onClick={() => {
            onChange?.(option.id);
          }}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </section>
  );
}

export interface SharedHistoryThemeTabsProps {
  activeTheme?: string;
  themes: string[];
  onChange?: (theme?: string) => void;
  disabled?: boolean;
}

export function SharedHistoryThemeTabs({
  activeTheme,
  themes,
  onChange,
  disabled = false,
}: SharedHistoryThemeTabsProps) {
  const options = ["all", ...themes];

  return (
    <section className="mw-filter-row" aria-label="历史主题筛选">
      {options.map((theme) => {
        const isAll = theme === "all";
        const selected = isAll ? !activeTheme : activeTheme === theme;
        return (
          <button
            key={theme}
            type="button"
            className={`am-filter-chip mw-filter-chip ${selected ? "mw-filter-chip--active" : ""}`}
            onClick={() => {
              onChange?.(isAll ? undefined : theme);
            }}
            disabled={disabled}
          >
            {isAll ? "全部主题" : getThemeDisplayName(theme) ?? theme}
          </button>
        );
      })}
    </section>
  );
}

const historyLimitOptions = [10, 20, 50];

export interface SharedHistoryLimitTabsProps {
  activeLimit?: number;
  onChange?: (limit: number) => void;
  disabled?: boolean;
}

export function SharedHistoryLimitTabs({
  activeLimit = 20,
  onChange,
  disabled = false,
}: SharedHistoryLimitTabsProps) {
  return (
    <section className="mw-filter-row" aria-label="历史记录数量">
      {historyLimitOptions.map((limit) => (
        <button
          key={limit}
          type="button"
          className={`am-filter-chip mw-filter-chip ${activeLimit === limit ? "mw-filter-chip--active" : ""}`}
          onClick={() => {
            onChange?.(limit);
          }}
          disabled={disabled}
        >
          {`显示 ${limit} 条`}
        </button>
      ))}
    </section>
  );
}

function getProgressPercent(progressLabel: string): number | null {
  const match = progressLabel.match(/(\d{1,3})/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  if (Number.isNaN(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, value));
}

function getEmptyStateCopy(activeFilter: SharedHistoryFilterId, activeTheme?: string): string {
  const themeLabel = activeTheme ? (getThemeDisplayName(activeTheme) ?? activeTheme) : null;

  switch (activeFilter) {
    case "ready":
      return themeLabel
        ? `当前主题“${themeLabel}”下还没有可直接打开的报告，可以先回到上传主路径生成一条记录。`
        : "当前还没有可直接打开的报告，可以先回到上传主路径生成一条记录。";
    case "pending":
      return themeLabel
        ? `当前主题“${themeLabel}”下没有生成中的记录，后续新的解读流程会出现在这里。`
        : "当前没有生成中的记录，后续新的解读流程会出现在这里。";
    case "all":
      return themeLabel
        ? `当前主题“${themeLabel}”下还没有生成过 To C 解读，后续可从上传主路径进入。`
        : "当前用户还没有生成过 To C 解读，后续可从上传主路径进入。";
  }
}

export interface SharedHistoryRecordsListProps {
  items: SharedHistoryRecordItem[];
  activeFilter: SharedHistoryFilterId;
  activeTheme?: string;
  onOpenRecord?: (
    interpretationId: string,
    canOpenReport: boolean,
    reportVariant: "lite" | "pro",
  ) => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  activeRecordId?: string | null;
}

export function SharedHistoryRecordsList({
  items,
  activeFilter,
  activeTheme,
  onOpenRecord,
  actionDisabled = false,
  actionBusy = false,
  activeRecordId = null,
}: SharedHistoryRecordsListProps) {
  const filteredItems = items.filter((item) => {
    if (activeTheme && item.themeLabel !== (getThemeDisplayName(activeTheme) ?? activeTheme)) {
      return false;
    }

    switch (activeFilter) {
      case "ready":
        return item.canOpenReport;
      case "pending":
        return !item.canOpenReport;
      case "all":
        return true;
    }
  });

  return (
    <section className="am-stack mw-stack">
      {filteredItems.length ? (
        filteredItems.map((item) => {
          const progressPercent = getProgressPercent(item.progressLabel);

          return (
            <article
              key={item.interpretationId}
              className={`am-card mw-card mw-card--history-${item.statusTone}`}
            >
              <div className="am-card__header mw-card__header">
                <h3>{item.title}</h3>
                <span className={`am-badge mw-badge mw-badge--${item.statusTone}`}>{item.statusLabel}</span>
              </div>
              <p>{item.subtitle}</p>
              <p>{item.statusDetail}</p>
              {!item.canOpenReport ? (
                <section
                  className={`mw-history-progress ${item.statusTone === "proPending" ? "mw-history-progress--pro" : ""}`}
                >
                  <div className="mw-history-progress__row">
                    <p className="mw-meta">阶段：{item.stageLabel}</p>
                    <p className="mw-meta mw-history-progress__value">进度：{item.progressLabel}</p>
                  </div>
                  {progressPercent !== null ? (
                    <div className="mw-progress">
                      <div
                        className="mw-progress__bar"
                        style={{ width: `${Math.max(8, progressPercent)}%` }}
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}
              {item.helperNote ? (
                <p className="mw-meta mw-meta--soft">{item.helperNote}</p>
              ) : null}
              <p className="mw-meta">主题：{item.themeLabel} · 版本：{item.reportVariant === "pro" ? "Pro" : "Lite"}</p>
              <p className="mw-meta">Interpretation ID: {item.interpretationId}</p>
              <div className="mw-button-row">
                {actionBusy && activeRecordId === item.interpretationId ? (
                  <p className="mw-meta">当前正在刷新这条记录的真实状态。</p>
                ) : null}
                <button
                  type="button"
                  className="mw-secondary-button mw-secondary-button--inline"
                  onClick={() => {
                    onOpenRecord?.(
                      item.interpretationId,
                      item.canOpenReport,
                      item.reportVariant,
                    );
                  }}
                  disabled={actionDisabled}
                >
                  {actionBusy && activeRecordId === item.interpretationId
                    ? "正在打开..."
                    : item.actionLabel}
                </button>
              </div>
            </article>
          );
        })
      ) : (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>当前筛选下没有记录</h3>
          </div>
          <p>{getEmptyStateCopy(activeFilter, activeTheme)}</p>
        </article>
      )}
    </section>
  );
}
