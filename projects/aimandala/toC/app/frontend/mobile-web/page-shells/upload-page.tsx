import { MobileWebAppShell } from "../app-shell";
import { mobileWebRoutes } from "../routes";
import { createUploadPageDescriptor } from "../pages";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

export interface MobileWebUploadPageProps {
  draft: MobileWebUploadDraft;
  detection?: DetectCirclesResponse | null;
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
  onContinue?: () => void;
}

export function MobileWebUploadPage({
  draft,
  detection = null,
  onDraftChange,
  onContinue,
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
            <h3>上传表单</h3>
            <span className="mw-badge">
              {descriptor.draft.imagePath ? "已选择画作" : "等待上传"}
            </span>
          </div>
          <div className="mw-form-stack">
            <label className="mw-form-field">
              <span>画作文件路径</span>
              <input
                value={descriptor.draft.imagePath}
                onChange={(event) => {
                  onDraftChange?.({
                    imagePath: event.target.value,
                  });
                }}
                placeholder="/tmp/example-mandala.png"
              />
            </label>

            <label className="mw-form-field">
              <span>解读主题</span>
              <input
                value={descriptor.draft.theme}
                onChange={(event) => {
                  onDraftChange?.({
                    theme: event.target.value,
                  });
                }}
                placeholder="general"
              />
            </label>

            <label className="mw-form-field">
              <span>创作意图</span>
              <textarea
                rows={3}
                value={descriptor.draft.paintingIntention}
                onChange={(event) => {
                  onDraftChange?.({
                    paintingIntention: event.target.value,
                  });
                }}
                placeholder="例如：最近在整理内在状态"
              />
            </label>

            <label className="mw-form-field">
              <span>创作感受</span>
              <textarea
                rows={3}
                value={descriptor.draft.paintingFeeling}
                onChange={(event) => {
                  onDraftChange?.({
                    paintingFeeling: event.target.value,
                  });
                }}
                placeholder="例如：有些收束，也有些想打开"
              />
            </label>
          </div>
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

      <footer className="mw-footer-action">
        <button
          type="button"
          className="mw-primary-button"
          onClick={onContinue}
          disabled={!descriptor.draft.imagePath}
        >
          进入当前解读流程
        </button>
      </footer>
    </MobileWebAppShell>
  );
}
