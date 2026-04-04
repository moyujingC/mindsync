import { useEffect, useRef, useState } from "react";

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
  onSelectBrowserFile?: (filePath: string) => void;
}

export function UploadAssetCard({
  imagePath,
  onUseSample,
  onSelectBrowserFile,
}: UploadAssetCardProps) {
  const hasImage = Boolean(imagePath);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imagePath.startsWith("browser-file:")) {
      return;
    }

    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, [imagePath]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  return (
    <article className="mw-card mw-card--asset">
      <div className="mw-card__header">
        <h3>画作上传</h3>
        <span className="mw-badge">
          {hasImage ? "已载入预览路径" : "等待选择画作"}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="mw-visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          setPreviewUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return URL.createObjectURL(file);
          });
          onSelectBrowserFile?.(`browser-file:${file.name}`);
        }}
      />

      <button
        type="button"
        className="mw-upload-dropzone"
        onClick={handlePickFile}
      >
        <span className="mw-upload-dropzone__icon">+</span>
        <strong>{hasImage ? "重新选择一张画作" : "选择一张曼陀罗画作"}</strong>
        <small>
          当前先接浏览器原生选图，后续再把文件对象和上传接口正式串起来。
        </small>
      </button>

      <div className="mw-upload-actions">
        <button
          type="button"
          className="mw-secondary-button mw-secondary-button--inline"
          onClick={handlePickFile}
        >
          从当前设备选择
        </button>
        <button
          type="button"
          className="mw-secondary-button mw-secondary-button--inline"
          onClick={onUseSample}
        >
          使用示例路径
        </button>
      </div>

      {previewUrl ? (
        <div className="mw-upload-preview">
          <img
            src={previewUrl}
            alt="已选择画作预览"
            className="mw-upload-preview__image"
          />
        </div>
      ) : null}

      <div className="mw-upload-hint">
        <span>当前文件</span>
        <strong>{imagePath || "尚未选择文件"}</strong>
        <small>浏览器选图当前会回填为 `browser-file:文件名`，仅用于前端开发预览。</small>
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
  onPreviewDetect?: () => void;
}

export function UploadDetectionCard({
  detection,
  section,
  onPreviewDetect,
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

      {!detection ? (
        <button
          type="button"
          className="mw-secondary-button mw-secondary-button--inline"
          onClick={onPreviewDetect}
        >
          模拟三圈检测结果
        </button>
      ) : null}

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
