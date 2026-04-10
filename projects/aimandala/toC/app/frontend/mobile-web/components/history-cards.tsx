import type { HistoryPageDescriptor } from "../pages";
import type { ReactNode } from "react";
import { getThemeDisplayName } from "../../shared/core";

export type HistoryFilterId = "all" | "ready" | "pending";

export interface HistorySummaryRowProps {
  summary: HistoryPageDescriptor["summary"];
}

export function HistorySummaryRow({
  summary,
}: HistorySummaryRowProps) {
  return (
    <section className="mw-metric-row">
      <article className="mw-metric-card">
        <span>总记录数</span>
        <strong>{summary.total}</strong>
      </article>
      <article className="mw-metric-card">
        <span>已可查看</span>
        <strong>{summary.ready}</strong>
      </article>
      <article className="mw-metric-card">
        <span>生成中</span>
        <strong>{summary.pending}</strong>
      </article>
    </section>
  );
}

export interface HistoryFilterTabsProps {
  activeFilter: HistoryFilterId;
  onChange?: (filter: HistoryFilterId) => void;
  disabled?: boolean;
}

const historyFilterOptions: Array<{
  id: HistoryFilterId;
  label: string;
}> = [
  { id: "all", label: "全部" },
  { id: "ready", label: "可查看" },
  { id: "pending", label: "生成中" },
];

export function HistoryFilterTabs({
  activeFilter,
  onChange,
  disabled = false,
}: HistoryFilterTabsProps) {
  return (
    <section className="mw-filter-row" aria-label="历史记录筛选">
      {historyFilterOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`mw-filter-chip ${activeFilter === option.id ? "mw-filter-chip--active" : ""}`}
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

export interface HistoryThemeTabsProps {
  activeTheme?: string;
  themes: string[];
  onChange?: (theme?: string) => void;
  disabled?: boolean;
}

export function HistoryThemeTabs({
  activeTheme,
  themes,
  onChange,
  disabled = false,
}: HistoryThemeTabsProps) {
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
            className={`mw-filter-chip ${selected ? "mw-filter-chip--active" : ""}`}
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

export interface HistoryLimitTabsProps {
  activeLimit?: number;
  onChange?: (limit: number) => void;
  disabled?: boolean;
}

const historyLimitOptions = [10, 20, 50];

export function HistoryLimitTabs({
  activeLimit = 20,
  onChange,
  disabled = false,
}: HistoryLimitTabsProps) {
  return (
    <section className="mw-filter-row" aria-label="历史记录数量">
      {historyLimitOptions.map((limit) => (
        <button
          key={limit}
          type="button"
          className={`mw-filter-chip ${activeLimit === limit ? "mw-filter-chip--active" : ""}`}
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

export interface HistoryRecordsListProps {
  descriptor: HistoryPageDescriptor;
  activeFilter: HistoryFilterId;
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

function getEmptyStateCopy(activeFilter: HistoryFilterId, activeTheme?: string): ReactNode {
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

export function HistoryRecordsList({
  descriptor,
  activeFilter,
  activeTheme,
  onOpenRecord,
  actionDisabled = false,
  actionBusy = false,
  activeRecordId = null,
}: HistoryRecordsListProps) {
  const filteredItems = descriptor.items.filter((item) => {
    if (activeTheme && item.theme !== activeTheme) {
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
    <section className="mw-stack">
      {filteredItems.length ? (
        filteredItems.map((item) => (
          <article key={item.interpretationId} className="mw-card">
            <div className="mw-card__header">
              <h3>{item.title}</h3>
              <span className="mw-badge">{item.statusLabel}</span>
            </div>
            <p>{item.subtitle}</p>
            <p>{item.statusDetail}</p>
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
                  : item.canOpenReport
                    ? "打开报告"
                    : "查看进度"}
              </button>
            </div>
          </article>
        ))
      ) : (
        <article className="mw-card">
          <div className="mw-card__header">
            <h3>当前筛选下没有记录</h3>
          </div>
          <p>{getEmptyStateCopy(activeFilter, activeTheme)}</p>
        </article>
      )}
    </section>
  );
}
