import { MobileWebAppShell } from "../app-shell";
import { createHistoryPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import {
  type HistoryFilterId,
  HistoryFilterTabs,
  HistoryLimitTabs,
  HistoryRecordsList,
  HistorySummaryRow,
  HistoryThemeTabs,
} from "../components/history-cards";
import type { InterpretationListQuery, InterpretationRecordResponse } from "../../shared/types";

export interface MobileWebHistoryPageProps {
  records: InterpretationRecordResponse[];
  historyQuery?: InterpretationListQuery;
  activeFilter?: HistoryFilterId;
  filterBusy?: boolean;
  historyStatusLabel?: string;
  historyStatusDetail?: string;
  historyStatusTone?: "preview" | "runtime";
  actionBusy?: boolean;
  activeRecordId?: string | null;
  environmentLabel?: string;
  environmentDetail?: string;
  environmentTone?: "preview" | "runtime";
  onBackToUpload?: () => void;
  onFilterChange?: (filter: HistoryFilterId) => void;
  onThemeChange?: (theme?: string) => void;
  onLimitChange?: (limit: number) => void;
  onOpenRecord?: (
    interpretationId: string,
    canOpenReport: boolean,
    reportVariant: "lite" | "pro",
  ) => void;
}

export function MobileWebHistoryPage({
  records,
  historyQuery,
  activeFilter = "all",
  filterBusy = false,
  historyStatusLabel,
  historyStatusDetail,
  historyStatusTone = "preview",
  actionBusy = false,
  activeRecordId = null,
  environmentLabel,
  environmentDetail,
  environmentTone,
  onBackToUpload,
  onFilterChange,
  onThemeChange,
  onLimitChange,
  onOpenRecord,
}: MobileWebHistoryPageProps) {
  const descriptor = createHistoryPageDescriptor(records);
  const themeOptions = Array.from(new Set(records.map((record) => record.theme).filter(Boolean)));
  const activeTheme = historyQuery?.theme;
  const activeLimit = historyQuery?.limit ?? 20;

  return (
    <MobileWebAppShell
      route={mobileWebRoutes.find((route) => route.id === "history") ?? mobileWebRoutes[0]}
      environmentLabel={environmentLabel}
      environmentDetail={environmentDetail}
      environmentTone={environmentTone}
    >
      <section className="mw-hero-card">
        <p className="mw-kicker">历史记录</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      {historyStatusLabel ? (
        <section className={`mw-inline-banner mw-inline-banner--${historyStatusTone}`}>
          <strong>{historyStatusLabel}</strong>
          <p>{historyStatusDetail}</p>
        </section>
      ) : null}

      <HistorySummaryRow summary={descriptor.summary} />
      <HistoryFilterTabs
        activeFilter={activeFilter}
        onChange={onFilterChange}
        disabled={filterBusy}
      />
      <HistoryThemeTabs
        activeTheme={activeTheme}
        themes={activeTheme && !themeOptions.includes(activeTheme)
          ? [activeTheme, ...themeOptions]
          : themeOptions}
        onChange={onThemeChange}
        disabled={filterBusy}
      />
      <HistoryLimitTabs
        activeLimit={activeLimit}
        onChange={onLimitChange}
        disabled={filterBusy}
      />

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

      <HistoryRecordsList
        descriptor={descriptor}
        activeFilter={activeFilter}
        activeTheme={activeTheme}
        onOpenRecord={onOpenRecord}
        actionDisabled={filterBusy || actionBusy}
        actionBusy={actionBusy}
        activeRecordId={activeRecordId}
      />

      <footer className="mw-footer-action">
        <button
          type="button"
          className="mw-secondary-button"
          onClick={onBackToUpload}
        >
          返回上传页
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
