import type { HistoryPageDescriptor } from "../pages";
import type { ReactNode } from "react";

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
  onChange: (filter: HistoryFilterId) => void;
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
}: HistoryFilterTabsProps) {
  return (
    <section className="mw-filter-row" aria-label="历史记录筛选">
      {historyFilterOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`mw-filter-chip ${activeFilter === option.id ? "mw-filter-chip--active" : ""}`}
          onClick={() => {
            onChange(option.id);
          }}
        >
          {option.label}
        </button>
      ))}
    </section>
  );
}

export interface HistoryRecordsListProps {
  descriptor: HistoryPageDescriptor;
  activeFilter: HistoryFilterId;
}

function getEmptyStateCopy(activeFilter: HistoryFilterId): ReactNode {
  switch (activeFilter) {
    case "ready":
      return "当前还没有可直接打开的报告，可以先回到上传主路径生成一条记录。";
    case "pending":
      return "当前没有生成中的记录，后续新的解读流程会出现在这里。";
    case "all":
      return "当前用户还没有生成过 To C 解读，后续可从上传主路径进入。";
  }
}

export function HistoryRecordsList({
  descriptor,
  activeFilter,
}: HistoryRecordsListProps) {
  const filteredItems = descriptor.items.filter((item) => {
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
            <p className="mw-meta">Interpretation ID: {item.interpretationId}</p>
          </article>
        ))
      ) : (
        <article className="mw-card">
          <div className="mw-card__header">
            <h3>当前筛选下没有记录</h3>
          </div>
          <p>{getEmptyStateCopy(activeFilter)}</p>
        </article>
      )}
    </section>
  );
}
