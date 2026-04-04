import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes } from "../routes";
import { createUploadPageDescriptor } from "../pages";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

export interface MobileWebUploadPageProps {
  draft: MobileWebUploadDraft;
  detection?: DetectCirclesResponse | null;
}

export function MobileWebUploadPage({
  draft,
  detection = null,
}: MobileWebUploadPageProps) {
  const descriptor = createUploadPageDescriptor(draft, detection);

  return (
    <MobileWebAppShell route={mobileWebRoutes[0]}>
      <section className="mw-hero-card">
        <p className="mw-kicker">起点</p>
        <h2>{descriptor.title}</h2>
        <p>{descriptor.subtitle}</p>
      </section>

      <section className="mw-card-grid">
        <article className="mw-card">
          <div className="mw-card__header">
            <h3>当前上传草稿</h3>
            <span className="mw-badge">
              {descriptor.draft.imagePath ? "已选择画作" : "等待上传"}
            </span>
          </div>
          <dl className="mw-field-list">
            {descriptor.fields.map((field) => (
              <div key={field.label} className="mw-field-list__row">
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="mw-card">
          <div className="mw-card__header">
            <h3>迁移期推荐流程</h3>
          </div>
          <ul className="mw-checklist">
            {descriptor.checklist.map((item) => (
              <li key={item.id} className={`mw-checklist__item mw-checklist__item--${item.status}`}>
                <span>{item.label}</span>
                <strong>{item.status === "done" ? "已就绪" : "待完成"}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mw-stack">
        {descriptor.sections.map((section) => (
          <article key={section.id} className="mw-card">
            <div className="mw-card__header">
              <h3>{section.title}</h3>
            </div>
            <p>{section.description}</p>
          </article>
        ))}
      </section>
    </MobileWebAppShell>
  );
}
