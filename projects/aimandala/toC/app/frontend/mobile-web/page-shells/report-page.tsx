import { MobileWebAppShell } from "../app-shell";
import { createReportPageDescriptor } from "../pages";
import { mobileWebRoutes } from "../routes";
import { createMobileWebPageViewModel } from "../view-model";
import { getMobileWebPrimaryAction } from "../state";
import { getLiteStructuredReport } from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";

export interface MobileWebReportPageProps {
  state: MandalaFlowState;
}

export function MobileWebReportPage({ state }: MobileWebReportPageProps) {
  const viewModel = createMobileWebPageViewModel(
    state,
    getMobileWebPrimaryAction(state),
  );
  const descriptor = createReportPageDescriptor(viewModel);
  const structured = getLiteStructuredReport(state.report);

  return (
    <MobileWebAppShell route={mobileWebRoutes[2]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">一镜 Lite 版</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <section className="mw-metric-row">
        {descriptor.metrics.map((metric) => (
          <article key={metric.label} className="mw-metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      {structured ? (
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
      ) : null}

      <section className="mw-stack">
        {descriptor.sections.map((section) => (
          <article key={section.id} className="mw-card">
            <div className="mw-card__header">
              <h3>{section.heading}</h3>
            </div>
            <p className="mw-prewrap">{section.body}</p>
          </article>
        ))}
      </section>

      <footer className="mw-footer-action">
        <button type="button" className="mw-primary-button">
          {descriptor.primaryActionLabel}
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
