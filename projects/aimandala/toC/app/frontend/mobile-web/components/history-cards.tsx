import {
  SharedHistoryFilterTabs,
  SharedHistoryLimitTabs,
  SharedHistoryRecordsList,
  SharedHistorySummaryRow,
  SharedHistoryThemeTabs,
  type SharedHistoryFilterId,
} from "../../shared/ui";
import type { HistoryPageDescriptor } from "../pages";

export type HistoryFilterId = SharedHistoryFilterId;

export interface HistorySummaryRowProps {
  summary: HistoryPageDescriptor["summary"];
}

export function HistorySummaryRow({
  summary,
}: HistorySummaryRowProps) {
  return <SharedHistorySummaryRow summary={summary} />;
}

export interface HistoryFilterTabsProps {
  activeFilter: HistoryFilterId;
  onChange?: (filter: HistoryFilterId) => void;
  disabled?: boolean;
}

export function HistoryFilterTabs({
  activeFilter,
  onChange,
  disabled = false,
}: HistoryFilterTabsProps) {
  return <SharedHistoryFilterTabs activeFilter={activeFilter} onChange={onChange} disabled={disabled} />;
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
  return <SharedHistoryThemeTabs activeTheme={activeTheme} themes={themes} onChange={onChange} disabled={disabled} />;
}

export interface HistoryLimitTabsProps {
  activeLimit?: number;
  onChange?: (limit: number) => void;
  disabled?: boolean;
}

export function HistoryLimitTabs({
  activeLimit = 20,
  onChange,
  disabled = false,
}: HistoryLimitTabsProps) {
  return <SharedHistoryLimitTabs activeLimit={activeLimit} onChange={onChange} disabled={disabled} />;
}

export interface HistoryRecordsListProps {
  descriptor: HistoryPageDescriptor;
  activeFilter: HistoryFilterId;
  activeTheme?: string;
  onOpenRecord?: (interpretationId: string) => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  activeRecordId?: string | null;
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
  return (
    <SharedHistoryRecordsList
      items={descriptor.items}
      activeFilter={activeFilter}
      activeTheme={activeTheme}
      onOpenRecord={onOpenRecord}
      actionDisabled={actionDisabled}
      actionBusy={actionBusy}
      activeRecordId={activeRecordId}
    />
  );
}
