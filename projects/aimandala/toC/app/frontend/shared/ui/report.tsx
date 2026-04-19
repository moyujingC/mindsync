import {
  getGenerationPresentation,
  getProRootCauseEntries,
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
  const orientation = structured.topic_context.orientation;
  const keyTerms = orientation.key_terms ?? [];
  const currentReading = structured.current_reading;
  const visualBasis = structured.visual_basis;
  const patternInterpretation = structured.pattern_interpretation;
  const lifeConnection = structured.life_connection;
  const healingDirections = (structured.lite_healing_guidance?.directions ?? []).filter(
    (item) => item?.title || item?.content,
  );
  const microPractices = (structured.lite_healing_guidance?.micro_practices ?? []).filter(
    (item) => item?.title || item?.content,
  );
  const proReportEntry = structured.pro_report_entry;

  return (
    <section className="am-stack mw-stack">
      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>议题理解</h3>
          <span className="am-badge mw-badge">{structured.topic_context.topic_label}</span>
        </div>
        <p className="mw-prewrap">{joinSections([orientation.intro, orientation.focus])}</p>
        {keyTerms.length ? (
          <div className="am-stack mw-stack am-stack-gap-sm">
            {keyTerms.map((item, index) => (
              <div key={`${item.term || index}-${index}`}>
                <strong>{item.term || `关键词 ${index + 1}`}</strong>
                <p className="mw-prewrap">{item.explanation || ""}</p>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>当前命中</h3>
        </div>
        <p>{currentReading}</p>
      </article>

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>画面依据</h3>
        </div>
        <p>{visualBasis}</p>
      </article>

      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>模式命名</h3>
        </div>
        <p className="mw-prewrap">{patternInterpretation}</p>
      </article>

      {lifeConnection ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>现实连接</h3>
          </div>
          <p className="mw-prewrap">{lifeConnection}</p>
        </article>
      ) : null}

      {healingDirections.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>轻量调节方向</h3>
          </div>
          <div className="am-stack mw-stack am-stack-gap-sm">
            {healingDirections.map((item, index) => (
              <div key={`${item.title ?? index}-${index}`}>
                <strong>{item.title || `方向 ${index + 1}`}</strong>
                <p className="mw-prewrap">{item.content || ""}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {microPractices.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>现在可以先做的小练习</h3>
          </div>
          <div className="am-stack mw-stack am-stack-gap-sm">
            {microPractices.map((item, index) => (
              <div key={`${item.title ?? index}-${index}`}>
                <strong>{item.title || `练习 ${index + 1}`}</strong>
                <p className="mw-prewrap">{item.content || ""}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="am-card am-card--accent mw-card mw-card--accent">
        <div className="am-card__header mw-card__header">
          <h3>{proReportEntry?.title || "另一份更深的独立报告"}</h3>
          <span className="am-badge mw-badge">独立产品入口</span>
        </div>
        <p>{proReportEntry?.summary || ""}</p>
        {proReportEntry?.product_note ? <p>{proReportEntry.product_note}</p> : null}
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
    <div className="am-stack mw-stack am-stack-gap-sm">
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
  const rootCauseEntries = getProRootCauseEntries(structured);
  const healingPlan = (structured.healing_plan ?? []).filter(
    (item) => item.phase || item.focus || item.practice,
  );
  const orientation = structured.topic_context.orientation;

  return (
    <section className="am-stack mw-stack">
      <article className="am-card mw-card">
        <div className="am-card__header mw-card__header">
          <h3>议题理解</h3>
          <span className="am-badge mw-badge">{structured.topic_context.topic_label}</span>
        </div>
        <p className="mw-prewrap">{joinSections([orientation.intro, orientation.focus])}</p>
      </article>

      {structured.deep_impression ? (
        <article className="am-card am-card--accent mw-card mw-card--accent">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.deepImpression}</h3>
            <span className="am-badge mw-badge">Pro</span>
          </div>
          <p className="mw-prewrap">{structured.deep_impression}</p>
        </article>
      ) : null}

      {structured.evidence_digest ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.evidenceDigest}</h3>
          </div>
          <p className="mw-prewrap">{structured.evidence_digest}</p>
        </article>
      ) : null}

      {structured.imbalance_diagnosis ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.imbalanceDiagnosis}</h3>
          </div>
          <p className="mw-prewrap">{structured.imbalance_diagnosis}</p>
        </article>
      ) : null}

      {rootCauseEntries.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.rootCauseChain}</h3>
          </div>
          {renderKeyValueRows(rootCauseEntries, proRootCauseLabels)}
        </article>
      ) : null}

      {structured.deep_structure_interpretation ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.deepStructure}</h3>
          </div>
          <p className="mw-prewrap">{structured.deep_structure_interpretation}</p>
        </article>
      ) : null}

      {healingPlan.length ? (
        <article className="am-card mw-card">
          <div className="am-card__header mw-card__header">
            <h3>{proReportSectionTitles.healingPlan}</h3>
          </div>
          <div className="am-stack mw-stack am-stack-gap-sm">
            {healingPlan.map((item, index) => (
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

      {!structured.deep_impression &&
      !structured.evidence_digest &&
      !structured.imbalance_diagnosis &&
      !rootCauseEntries.length &&
      !structured.deep_structure_interpretation &&
      !healingPlan.length ? (
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
