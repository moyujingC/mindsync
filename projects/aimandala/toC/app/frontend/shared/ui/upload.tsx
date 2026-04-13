import type { DetectCirclesResponse } from "../types";

export interface SharedUploadChecklistItem {
  id: string;
  label: string;
  status: "done" | "pending";
}

export interface SharedUploadField {
  label: string;
  value: string;
}

export interface SharedUploadSection {
  id: string;
  title: string;
  description: string;
}

export interface SharedUploadChecklistCardProps {
  checklist: SharedUploadChecklistItem[];
}

export function SharedUploadChecklistCard({
  checklist,
}: SharedUploadChecklistCardProps) {
  return (
    <article className="am-card mw-card">
      <div className="am-card__header mw-card__header">
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

export interface SharedUploadDetectionCardProps {
  detection: DetectCirclesResponse | null;
  isDetecting?: boolean;
  detectError?: string | null;
  section?: SharedUploadSection;
  onPreviewDetect?: () => void;
}

export function SharedUploadDetectionCard({
  detection,
  isDetecting = false,
  detectError = null,
  section,
  onPreviewDetect,
}: SharedUploadDetectionCardProps) {
  return (
    <article className="am-card mw-card">
      <div className="am-card__header mw-card__header">
        <h3>{section?.title || "三圈检测"}</h3>
        <span className="am-badge mw-badge">
          {detection ? "已生成建议" : isDetecting ? "检测中" : "等待检测"}
        </span>
      </div>

      <p>{section?.description || "等待调用 detect-circles 获取三圈建议。"}</p>

      {!detection ? (
        <button
          type="button"
          className="mw-secondary-button mw-secondary-button--inline"
          onClick={onPreviewDetect}
          disabled={isDetecting}
        >
          {isDetecting ? "正在检测..." : "触发三圈检测"}
        </button>
      ) : null}

      {detectError ? (
        <p className="mw-inline-error">{detectError}</p>
      ) : null}

      {detection ? (
        <div className="mw-metric-row mw-metric-row--compact">
          <article className="am-card am-card--metric mw-metric-card">
            <span>内圈半径</span>
            <strong>{Math.round(detection.inner_radius * 100)}%</strong>
          </article>
          <article className="am-card am-card--metric mw-metric-card">
            <span>中圈半径</span>
            <strong>{Math.round(detection.middle_radius * 100)}%</strong>
          </article>
          <article className="am-card am-card--metric mw-metric-card">
            <span>识别方法</span>
            <strong>{detection.method}</strong>
          </article>
        </div>
      ) : null}
    </article>
  );
}

export interface SharedUploadDraftSummaryCardProps {
  fields: SharedUploadField[];
  section?: SharedUploadSection;
}

export function SharedUploadDraftSummaryCard({
  fields,
  section,
}: SharedUploadDraftSummaryCardProps) {
  return (
    <article className="am-card mw-card">
      <div className="am-card__header mw-card__header">
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
