import type { LiteStructuredReport, MandalaFlowState } from "../../shared/types";
import type { MobileWebUploadAssetRef } from "../state";
import {
  SharedLoadingProgressCard,
  SharedMetricsRow,
  SharedReportSections,
  SharedStructuredReportCards,
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

export interface StructuredReportCardsProps {
  structured: LiteStructuredReport;
}

export function StructuredReportCards({
  structured,
}: StructuredReportCardsProps) {
  return <SharedStructuredReportCards structured={structured} />;
}

export interface ReportSectionsProps {
  sections: ReportPageSection[];
}

export function ReportSections({ sections }: ReportSectionsProps) {
  return <SharedReportSections sections={sections as SharedReportSection[]} />;
}

export interface UploadAssetStatusCardProps {
  imagePath: string;
  uploadAsset?: MobileWebUploadAssetRef | null;
}

export function UploadAssetStatusCard({
  imagePath,
  uploadAsset = null,
}: UploadAssetStatusCardProps) {
  return (
    <article className="mw-card mw-card--debug">
      <div className="mw-card__header">
        <h3>调试信息</h3>
        <span className="mw-badge">
          {uploadAsset ? "已换到运行时对象" : "仍使用当前路径"}
        </span>
      </div>
      <dl className="mw-field-list">
        <div className="mw-field-list__row">
          <dt>原始画作路径</dt>
          <dd>{imagePath || "暂未选择"}</dd>
        </div>
        <div className="mw-field-list__row">
          <dt>运行时图片路径</dt>
          <dd>{uploadAsset?.runtimeImagePath || "当前未换到运行时路径"}</dd>
        </div>
        <div className="mw-field-list__row">
          <dt>存储后端</dt>
          <dd>{uploadAsset?.storageBackend || "当前未生成"}</dd>
        </div>
        <div className="mw-field-list__row">
          <dt>存储 Key</dt>
          <dd>{uploadAsset?.storageKey || "当前未生成"}</dd>
        </div>
        <div className="mw-field-list__row">
          <dt>当前签名访问 URL</dt>
          <dd>{uploadAsset?.imageUrl || "当前未返回"}</dd>
        </div>
      </dl>
    </article>
  );
}

export interface LoadingProgressCardProps {
  state: MandalaFlowState;
}

export function LoadingProgressCard({
  state,
}: LoadingProgressCardProps) {
  return <SharedLoadingProgressCard state={state} />;
}
