import type {
  UploadPageChecklistItem,
  UploadPageField,
  UploadPageSection,
} from "../pages";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

export interface UploadFormCardProps {
  draft: MobileWebUploadDraft;
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
}

export interface UploadAssetCardProps {
  imagePath: string;
  onUseSample?: () => void;
}

export function UploadAssetCard({
  imagePath,
  onUseSample,
}: UploadAssetCardProps) {
  const hasImage = Boolean(imagePath);

  return (
    <article className="mw-card mw-card--asset">
      <div className="mw-card__header">
        <h3>画作上传</h3>
        <span className="mw-badge">
          {hasImage ? "已载入预览路径" : "等待选择画作"}
        </span>
      </div>

      <button
        type="button"
        className="mw-upload-dropzone"
        onClick={onUseSample}
      >
        <span className="mw-upload-dropzone__icon">+</span>
        <strong>{hasImage ? "更换画作路径" : "选择一张曼陀罗画作"}</strong>
        <small>
          当前先用占位方式承接手机端上传体验，后续再接真实文件选择能力。
        </small>
      </button>

      <div className="mw-upload-hint">
        <span>当前文件</span>
        <strong>{imagePath || "尚未选择文件"}</strong>
      </div>
    </article>
  );
}

export function UploadFormCard({
  draft,
  onDraftChange,
}: UploadFormCardProps) {
  return (
    <article className="mw-card">
      <div className="mw-card__header">
        <h3>上传表单</h3>
        <span className="mw-badge">
          {draft.imagePath ? "已选择画作" : "等待上传"}
        </span>
      </div>
      <div className="mw-form-stack">
        <label className="mw-form-field">
          <span>文件路径</span>
          <input
            value={draft.imagePath}
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
            value={draft.theme}
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
            value={draft.paintingIntention}
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
            value={draft.paintingFeeling}
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
  );
}

export interface UploadChecklistCardProps {
  checklist: UploadPageChecklistItem[];
}

export function UploadChecklistCard({
  checklist,
}: UploadChecklistCardProps) {
  return (
    <article className="mw-card">
      <div className="mw-card__header">
        <h3>迁移期推荐流程</h3>
      </div>
      <ul className="mw-checklist">
        {checklist.map((item) => (
          <li key={item.id} className={`mw-checklist__item mw-checklist__item--${item.status}`}>
            <span>{item.label}</span>
            <strong>{item.status === "done" ? "已就绪" : "待完成"}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

export interface UploadDetectionCardProps {
  detection: DetectCirclesResponse | null;
  section: UploadPageSection | undefined;
}

export function UploadDetectionCard({
  detection,
  section,
}: UploadDetectionCardProps) {
  return (
    <article className="mw-card">
      <div className="mw-card__header">
        <h3>{section?.title || "三圈检测"}</h3>
        <span className="mw-badge">
          {detection ? "已生成建议" : "等待检测"}
        </span>
      </div>

      <p>{section?.description || "等待调用 detect-circles 获取三圈建议。"}</p>

      {detection ? (
        <div className="mw-metric-row mw-metric-row--compact">
          <article className="mw-metric-card">
            <span>内圈半径</span>
            <strong>{Math.round(detection.inner_radius * 100)}%</strong>
          </article>
          <article className="mw-metric-card">
            <span>中圈半径</span>
            <strong>{Math.round(detection.middle_radius * 100)}%</strong>
          </article>
          <article className="mw-metric-card">
            <span>识别方法</span>
            <strong>{detection.method}</strong>
          </article>
        </div>
      ) : null}
    </article>
  );
}

export interface UploadDraftSummaryCardProps {
  fields: UploadPageField[];
  section: UploadPageSection | undefined;
}

export function UploadDraftSummaryCard({
  fields,
  section,
}: UploadDraftSummaryCardProps) {
  return (
    <article className="mw-card">
      <div className="mw-card__header">
        <h3>{section?.title || "主题与补充信息"}</h3>
      </div>
      <p>{section?.description}</p>
      <dl className="mw-field-list">
        {fields.map((field) => (
          <div key={field.label} className="mw-field-list__row">
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
