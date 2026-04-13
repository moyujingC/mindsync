export interface SharedMetricItem {
  label: string;
  value: string;
}

export interface SharedReportSection {
  id: string;
  heading: string;
  body: string;
}

export interface SharedHistorySummary {
  total: number;
  ready: number;
  pending: number;
}

export type SharedHistoryFilterId = "all" | "ready" | "pending";

export type SharedHistoryStatusTone = "ready" | "pending" | "proReady" | "proPending";

export interface SharedHistoryRecordItem {
  interpretationId: string;
  title: string;
  subtitle: string;
  canOpenReport: boolean;
  reportVariant: "lite" | "pro";
  statusLabel: string;
  statusDetail: string;
  actionLabel: string;
  statusTone: SharedHistoryStatusTone;
  helperNote?: string;
  stageLabel: string;
  progressLabel: string;
  themeLabel: string;
}
