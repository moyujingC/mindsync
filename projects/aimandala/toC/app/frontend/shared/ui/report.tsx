import {
  getGenerationPresentation,
  getProCircleEntries,
  getProCoreInsightEntries,
  getProImbalanceEntries,
  getProMicroEntries,
  getProRootCauseEntries,
  proImbalanceLabels,
  proReportSectionTitles,
  proRootCauseLabels,
} from "../core";
import type {
  LiteStructuredReport,
  MandalaFlowState,
  ProStructuredReport,
} from "../types";

import type { SharedMetricItem, SharedReportSection } from "./types";

function joinSections(parts: Array<string | null | undefined>): string {
  return parts.map((part) => (typeof part === "string" ? part.trim() : "")).filter(Boolean).join("\n\n");
}

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

export interface SharedStructuredReportCardsProps {
  structured: LiteStructuredReport;
}

export function SharedStructuredReportCards({
  structured,
}: SharedStructuredReportCardsProps) {
  const blocks = structured.self_understanding_blocks;
  const openingHit = blocks?.opening_hit || structured.overall_impression;
  const visualEvidence = blocks?.visual_evidence?.summary || structured.visual_elements_rendered;
  const stateInterpretation =
    joinSections([
      blocks?.state_interpretation?.current_state,
      blocks?.state_interpretation?.emotional_tension,
      blocks?.state_interpretation?.explanation_chain,
    ]) || structured.emotion_portrait_rendered;
  const patternNaming =
    joinSections([
      blocks?.pattern_naming?.pattern_name,
      blocks?.pattern_naming?.pattern_description,
      blocks?.pattern_naming?.protective_logic,
    ]) ||
    joinSections([
      structured.story?.pattern?.content,
      structured.story?.defense?.content,
    ]);
  const realityConnection =
    joinSections([
      blocks?.reality_connection?.typical_scene,
      blocks?.reality_connection?.current_impact,
    ]) ||
    joinSections([
      structured.theme_insights?.scene,
      structured.theme_insights?.impact,
    ]);
  const nextStep =
    joinSections([
      blocks?.next_step?.direction,
      blocks?.next_step?.action,
    ]) ||
    joinSections([
      structured.theme_insights?.awareness,
      structured.three_awareness?.[0]?.content,
    ]);

  return (
    <section className="am-stack mw-stack">
      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>整体命中</h3>
        </div>
        <p>{openingHit}</p>
      </article>

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>画面依据</h3>
        </div>
        <p>{visualEvidence}</p>
      </article>

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>状态解释</h3>
        </div>
        <p className="mw-prewrap">{stateInterpretation}</p>
      </article>

      {patternNaming ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>模式命名</h3>
          </div>
          <p className="mw-prewrap">{patternNaming}</p>
        </article>
      ) : null}

      {realityConnection ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>现实连接</h3>
          </div>
          <p className="mw-prewrap">{realityConnection}</p>
        </article>
      ) : null}

      {nextStep ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>一个下一步</h3>
          </div>
          <p className="mw-prewrap">{nextStep}</p>
        </article>
      ) : null}

      {structured.three_awareness?.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>日常小觉察</h3>
          </div>
          <div className="am-stack mw-stack" style={{ gap: 10 }}>
            {structured.three_awareness.map((item, index) => (
              <div key={`${item.day ?? index}-${item.title ?? index}`}>
                <strong>{item.title || `第 ${item.day ?? index + 1} 条`}</strong>
                <p className="mw-prewrap">{item.content || ""}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {structured.theme_insights?.scene || structured.theme_insights?.impact || structured.theme_insights?.awareness ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>主题洞察</h3>
          </div>
          <p className="mw-prewrap">
            {joinSections([
              structured.theme_insights?.scene,
              structured.theme_insights?.impact,
              structured.theme_insights?.awareness,
            ])}
          </p>
        </article>
      ) : null}

      {!patternNaming && !realityConnection && !nextStep ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>情绪画像</h3>
          </div>
          <p>{structured.emotion_portrait_rendered}</p>
        </article>
      ) : null}

      <article className="am-card am-card--accent mw-card mw-card--accent">
        <div className="am-card__header mw-card__header">
          <h3>进一步解读入口</h3>
          <span className="am-badge mw-badge">仅保留入口语义</span>
        </div>
        <p>{structured.pro_teaser}</p>
      </article>
    </section>
  );
}

function toDisplayLabel(
  key: string,
  labels?: Record<string, string>,
): string {
  const mapped = labels?.[key];
  if (mapped) {
    return mapped;
  }

  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderKeyValueRows(
  entries: Array<[string, string]>,
  labels?: Record<string, string>,
) {
  return (
    <div className="am-stack mw-stack" style={{ gap: 10 }}>
      {entries.map(([key, value]) => (
        <div key={key}>
          <strong>{toDisplayLabel(key, labels)}</strong>
          <p className="mw-prewrap">{value}</p>
        </div>
      ))}
    </div>
  );
}

export interface SharedProStructuredReportCardsProps {
  structured: ProStructuredReport;
}

export function SharedProStructuredReportCards({
  structured,
}: SharedProStructuredReportCardsProps) {
  const coreEntries = getProCoreInsightEntries(structured);
  const circleEntries = getProCircleEntries(structured);
  const microEntries = getProMicroEntries(structured);
  const imbalanceEntries = getProImbalanceEntries(structured);
  const rootCauseEntries = getProRootCauseEntries(structured);
  const healingSuggestions = (structured.healing_suggestions ?? []).filter(
    (item) => item.phase || item.focus || item.practice,
  );

  return (
    <section className="am-stack mw-stack">
      {structured.first_impression ? (
        <article className="am-card am-card--accent mw-card mw-card--accent">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.firstImpression}</h3>
            <span className="am-badge mw-badge">Pro</span>
          </div>
          <p className="mw-prewrap">{structured.first_impression}</p>
        </article>
      ) : null}

      {coreEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.coreTable}</h3>
          </div>
          {renderKeyValueRows(coreEntries)}
        </article>
      ) : null}

      {circleEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.circles}</h3>
          </div>
          <div className="am-stack mw-stack" style={{ gap: 10 }}>
            {circleEntries.map((item, index) => (
              <div key={`${item.label ?? index}-${index}`}>
                <strong>{item.label ?? `第 ${index + 1} 圈`}</strong>
                <p className="mw-prewrap">{item.reading}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {microEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.micro}</h3>
          </div>
          {renderKeyValueRows(microEntries)}
        </article>
      ) : null}

      {imbalanceEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.imbalance}</h3>
          </div>
          {renderKeyValueRows(imbalanceEntries, proImbalanceLabels)}
        </article>
      ) : null}

      {rootCauseEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.rootCause}</h3>
          </div>
          {renderKeyValueRows(rootCauseEntries, proRootCauseLabels)}
        </article>
      ) : null}

      {healingSuggestions.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.healing}</h3>
          </div>
          <div className="am-stack mw-stack" style={{ gap: 10 }}>
            {healingSuggestions.map((item, index) => (
              <div key={`${item.phase ?? index}-${index}`}>
                <strong>{item.phase || `阶段 ${index + 1}`}</strong>
                <p className="mw-prewrap">
                  {joinSections([
                    item.focus ? `聚焦：${item.focus}` : null,
                    item.practice ? `练习：${item.practice}` : null,
                  ])}
                </p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {!structured.first_impression &&
      !coreEntries.length &&
      !circleEntries.length &&
      !microEntries.length &&
      !imbalanceEntries.length &&
      !rootCauseEntries.length &&
      !healingSuggestions.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>Pro 结构已返回</h3>
          </div>
          <p>当前 Pro 报告已经回到小程序壳，但共享 UI 可直接展示的结构化字段还比较少。</p>
        </article>
      ) : null}
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
    ? "当前进度优先来自真实 status 接口；如结果仍未完成，页面会继续尝试轮询刷新。"
    : "当前仍以本地占位状态展示进度，后续会继续补齐更多真实运行态细节。";

  return (
    <section className="am-stack mw-stack">
      <article className="am-card am-card--accent mw-card mw-card--accent">
        <div className="am-card__header mw-card__header">
          <h3>正在生成一镜 Lite 版</h3>
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
