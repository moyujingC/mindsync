import { useEffect, useRef, useState } from "react";

import type {
  UploadPageChecklistItem,
  UploadPageField,
  UploadPageSection,
} from "../pages";
import type { DetectCirclesResponse } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";
import {
  SharedUploadChecklistCard,
  SharedUploadDetectionCard,
  SharedUploadDraftSummaryCard,
  type SharedUploadChecklistItem,
  type SharedUploadField,
  type SharedUploadSection,
} from "../../shared/ui";

export interface UploadFormCardProps {
  draft: MobileWebUploadDraft;
  onDraftChange?: (patch: Partial<MobileWebUploadDraft>) => void;
}

export interface UploadAssetCardProps {
  imagePath: string;
  onUseSample?: () => void;
  onSelectBrowserFile?: (filePath: string, file: File) => void;
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
          onSelectBrowserFile?.(`browser-file:${file.name}`, file);
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
          浏览器选图会保留本地预览，生成报告前会上传到后端并换成运行时可读取的图片路径。
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
        <small>本地文件会在点击生成报告后上传，成功后摘要区会展示存储后端、对象 key 和远程 URL。</small>
        {imagePath.startsWith("browser-file:") ? null : (
          <small>如果已经换到运行时路径，下面的摘要区会展示存储后端、对象 key 和远程 URL。</small>
        )}
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
          <span>解读议题</span>
          <input
            value={draft.theme}
            onChange={(event) => {
              onDraftChange?.({
                theme: event.target.value,
              });
            }}
            placeholder="wealth"
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
  return <SharedUploadChecklistCard checklist={checklist as SharedUploadChecklistItem[]} />;
}

export interface UploadDetectionCardProps {
  detection: DetectCirclesResponse | null;
  isDetecting?: boolean;
  detectError?: string | null;
  section: UploadPageSection | undefined;
  onPreviewDetect?: () => void;
}

export function UploadDetectionCard({
  detection,
  isDetecting = false,
  detectError = null,
  section,
  onPreviewDetect,
}: UploadDetectionCardProps) {
  return (
    <SharedUploadDetectionCard
      detection={detection}
      isDetecting={isDetecting}
      detectError={detectError}
      section={section as SharedUploadSection | undefined}
      onPreviewDetect={onPreviewDetect}
    />
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
    <SharedUploadDraftSummaryCard
      fields={fields as SharedUploadField[]}
      section={section as SharedUploadSection | undefined}
    />
  );
}
