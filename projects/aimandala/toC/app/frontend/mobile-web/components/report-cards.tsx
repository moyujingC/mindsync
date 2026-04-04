import { getGenerationPresentation } from "../../shared/core";
import type { ReportPageMetric, ReportPageSection } from "../pages";
import type { LiteStructuredReport, MandalaFlowState } from "../../shared/types";
import type { MobileWebUploadAssetRef } from "../state";

export interface ReportMetricsRowProps {
  metrics: ReportPageMetric[];
}

export function ReportMetricsRow({ metrics }: ReportMetricsRowProps) {
  return (
    <section className="mw-metric-row">
      {metrics.map((metric) => (
        <article key={metric.label} className="mw-metric-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </section>
  );
}

export interface StructuredReportCardsProps {
  structured: LiteStructuredReport;
}

export function StructuredReportCards({
  structured,
}: StructuredReportCardsProps) {
  return (
    <section className="mw-stack">
      <article className="mw-card">
        <div className="mw-card__header">
          <h3>整体感受</h3>
        </div>
        <p>{structured.overall_impression}</p>
      </article>

      <article className="mw-card">
        <div className="mw-card__header">
          <h3>视觉元素</h3>
        </div>
        <p>{structured.visual_elements_rendered}</p>
      </article>

      <article className="mw-card">
        <div className="mw-card__header">
          <h3>情绪画像</h3>
        </div>
        <p>{structured.emotion_portrait_rendered}</p>
      </article>

      <article className="mw-card mw-card--accent">
        <div className="mw-card__header">
          <h3>进一步解读入口</h3>
          <span className="mw-badge">仅保留入口语义</span>
        </div>
        <p>{structured.pro_teaser}</p>
      </article>
    </section>
  );
}

export interface ReportSectionsProps {
  sections: ReportPageSection[];
}

export function ReportSections({ sections }: ReportSectionsProps) {
  return (
    <section className="mw-stack">
      {sections.map((section) => (
        <article key={section.id} className="mw-card">
          <div className="mw-card__header">
            <h3>{section.heading}</h3>
          </div>
          <p className="mw-prewrap">{section.body}</p>
        </article>
      ))}
    </section>
  );
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
    <article className="mw-card">
      <div className="mw-card__header">
        <h3>当前图片对象</h3>
        <span className="mw-badge">
          {uploadAsset ? "已换到运行时对象" : "仍使用当前路径"}
        </span>
      </div>
      <dl className="mw-field-list">
        <div className="mw-field-list__row">
          <dt>当前画作路径</dt>
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
          <dt>远程图片 URL</dt>
          <dd>{uploadAsset?.imageUrl || "当前未返回"}</dd>
        </div>
      </dl>
    </article>
  );
}

const loadingStages = [
  "已接收画作",
  "三圈建议已确认",
  "正在生成 Lite 解读",
  "正在整理报告结构",
  "准备展示结果",
];

function getStageIndex(progress: number): number {
  if (progress >= 100) {
    return 4;
  }
  if (progress >= 75) {
    return 3;
  }
  if (progress >= 50) {
    return 2;
  }
  if (progress >= 25) {
    return 1;
  }
  return 0;
}

export interface LoadingProgressCardProps {
  state: MandalaFlowState;
}

export function LoadingProgressCard({
  state,
}: LoadingProgressCardProps) {
  const progress = state.status?.generation_progress ?? state.interpretation?.generation_progress ?? 0;
  const presentation = getGenerationPresentation(
    state.status ?? state.interpretation ?? {
      status: "processing",
      generation_stage: "starting",
      generation_progress: progress,
      report_ready: false,
    },
  );
  const currentStageIndex = getStageIndex(progress);
  const progressHint = state.status
    ? "当前进度优先来自真实 status 接口；如结果仍未完成，页面会继续尝试轮询刷新。"
    : "当前仍以本地占位状态展示进度，后续会继续补齐更多真实运行态细节。";

  return (
    <section className="mw-stack">
      <article className="mw-card mw-card--accent">
        <div className="mw-card__header">
          <h3>正在生成一镜 Lite 版</h3>
          <span className="mw-badge">{progress}%</span>
        </div>
        <p>当前阶段：{presentation.stageLabel}</p>
        <p>{presentation.statusDetail}</p>
        <div className="mw-progress">
          <div
            className="mw-progress__bar"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
        <small className="mw-meta">{progressHint}</small>
      </article>

      <article className="mw-card">
        <div className="mw-card__header">
          <h3>生成阶段</h3>
        </div>
        <ol className="mw-stage-list">
          {loadingStages.map((label, index) => (
            <li
              key={label}
              className={`mw-stage-list__item ${index <= currentStageIndex ? "mw-stage-list__item--active" : ""}`}
            >
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
