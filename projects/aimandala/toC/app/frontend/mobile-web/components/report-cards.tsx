import type { ReportPageMetric, ReportPageSection } from "../pages";
import type { LiteStructuredReport } from "../../shared/types";

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
