import type { MandalaFlowState } from "../../shared/types";
import {
  SharedLoadingProgressCard,
  SharedMetricsRow,
  SharedReportSections,
  type SharedMetricItem,
  type SharedReportSection,
} from "../../shared/ui";
import type { ReportPageMetric, ReportPageSection } from "../pages";

export interface ReportMetricsRowProps {
  metrics: ReportPageMetric[];
}

export function ReportMetricsRow({ metrics }: ReportMetricsRowProps) {
  return <SharedMetricsRow metrics={metrics as SharedMetricItem[]} />;
}

export interface ReportSectionsProps {
  sections: ReportPageSection[];
}

export function ReportSections({ sections }: ReportSectionsProps) {
  return <SharedReportSections sections={sections as SharedReportSection[]} />;
}

export interface LoadingProgressCardProps {
  state: MandalaFlowState;
}

export function LoadingProgressCard({
  state,
}: LoadingProgressCardProps) {
  return <SharedLoadingProgressCard state={state} />;
}
