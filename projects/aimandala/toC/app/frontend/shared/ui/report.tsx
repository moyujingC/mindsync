import {
  getGenerationPresentation,
} from "../core";
import type { MandalaFlowState } from "../types";

import type { SharedMetricItem, SharedReportSection } from "./types";

export interface SharedMetricsRowProps {
  metrics: SharedMetricItem[];
}

export function SharedMetricsRow({ metrics }: SharedMetricsRowProps) {
  return (
    <section className="am-metric-row mw-metric-row">
      {metrics.map((metric) => (
        <article key={metric.label} className="am-card am-card--metric mw-metric-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </section>
  );
}

export interface SharedReportSectionsProps {
  sections: SharedReportSection[];
}

export function SharedReportSections({ sections }: SharedReportSectionsProps) {
  return (
    <section className="am-stack mw-stack">
      {sections.map((section, index) => (
        <article
          key={section.id}
          className={`am-card am-card--report-section mw-card mw-card--report-section ${index === 0 ? "mw-card--report-section-lead" : ""}`}
        >
          <div className="am-card__header mw-card__header mw-card__header--section">
            <span className="mw-section-index">{String(index + 1).padStart(2, "0")}</span>
            <h3>{section.heading}</h3>
          </div>
          <p className="mw-prewrap">{section.body}</p>
        </article>
      ))}
    </section>
  );
}

const loadingStages = [
  "已接收画作",
  "三圈建议已确认",
  "正在生成新版报告",
  "正在整理报告正文",
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

export interface SharedLoadingProgressCardProps {
  state: MandalaFlowState;
}

export function SharedLoadingProgressCard({
  state,
}: SharedLoadingProgressCardProps) {
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
    ? "当前进度优先来自真实 status 接口；如结果仍未完成，页面会继续尝试刷新。"
    : "当前正在等待新版报告接口返回。";

  return (
    <section className="am-stack mw-stack">
      <article className="am-card am-card--accent mw-card mw-card--accent">
        <div className="am-card__header mw-card__header">
          <h3>正在生成新版解读报告</h3>
          <span className="am-badge mw-badge">{progress}%</span>
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

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
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
