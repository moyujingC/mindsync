import type { DetectCirclesResponse } from "../../shared/types";
import { getUploadAssetRef, type MobileWebUploadDraft } from "../state";

export interface UploadPageSection {
  id: string;
  title: string;
  description: string;
}

export interface UploadPageField {
  label: string;
  value: string;
}

export interface UploadPageChecklistItem {
  id: string;
  label: string;
  status: "done" | "pending";
}

export interface UploadPageDescriptor {
  pageId: "upload-page";
  title: string;
  subtitle: string;
  sections: UploadPageSection[];
  fields: UploadPageField[];
  checklist: UploadPageChecklistItem[];
  draft: MobileWebUploadDraft;
  detection: DetectCirclesResponse | null;
}

export function createUploadPageDescriptor(
  draft: MobileWebUploadDraft,
  detection: DetectCirclesResponse | null = null,
): UploadPageDescriptor {
  const uploadAsset = getUploadAssetRef(draft);

  return {
    pageId: "upload-page",
    title: "上传你的曼陀罗",
    subtitle: "先上传画作，再进入当前 To C 主路径的检测与解读流程。",
    sections: [
      {
        id: "image",
        title: "画作上传",
        description: draft.imagePath
          ? `当前图片路径：${draft.imagePath}`
          : "等待用户选择画作。",
      },
      {
        id: "theme",
        title: "主题与补充信息",
        description: `主题：${draft.theme}；意图：${draft.paintingIntention || "未填写"}；感受：${draft.paintingFeeling || "未填写"}`,
      },
      {
        id: "upload-meta",
        title: "上传对象标识",
        description: uploadAsset
          ? `当前已换到 ${uploadAsset.storageBackend || "unknown"} 存储；key：${uploadAsset.storageKey || "unknown"}。`
          : "当前还没有上传后的对象标识。",
      },
      {
        id: "circles",
        title: "三圈检测",
        description: detection
          ? `当前检测结果：内圈 ${Math.round(detection.inner_radius * 100)}%，中圈 ${Math.round(detection.middle_radius * 100)}%，方法 ${detection.method}。`
          : "等待调用 detect-circles 获取三圈建议。",
      },
    ],
    fields: [
      {
        label: "画作文件",
        value: draft.imagePath || "暂未选择",
      },
      {
        label: "解读主题",
        value: draft.theme || "general",
      },
      {
        label: "创作意图",
        value: draft.paintingIntention || "暂未填写",
      },
      {
        label: "创作感受",
        value: draft.paintingFeeling || "暂未填写",
      },
      {
        label: "运行时图片路径",
        value: uploadAsset?.runtimeImagePath || "尚未换到运行时路径",
      },
      {
        label: "存储后端",
        value: uploadAsset?.storageBackend || "尚未生成",
      },
      {
        label: "存储 Key",
        value: uploadAsset?.storageKey || "尚未生成",
      },
      {
        label: "远程图片 URL",
        value: uploadAsset?.imageUrl || "当前未返回",
      },
    ],
    checklist: [
      {
        id: "asset",
        label: "上传画作",
        status: draft.imagePath ? "done" : "pending",
      },
      {
        id: "context",
        label: "补充主题与创作信息",
        status:
          draft.theme || draft.paintingIntention || draft.paintingFeeling
            ? "done"
            : "pending",
      },
      {
        id: "detect",
        label: "等待三圈检测",
        status: detection ? "done" : "pending",
      },
    ],
    draft,
    detection,
  };
}
