import type {
  MandalaFlowState,
  StartCreatePayload,
  UploadImageResponse,
} from "../shared/types";

export interface MobileWebUploadAssetRef {
  runtimeImagePath: string;
  storageBackend: string;
  storageKey: string;
  imageUrl?: string | null;
}

export interface MobileWebUploadDraft {
  imagePath: string;
  theme: string;
  paintingIntention: string;
  paintingFeeling: string;
  innerRadius?: number;
  middleRadius?: number;
  browserFile?: File | null;
  uploadAsset?: MobileWebUploadAssetRef | null;
}

export function toMobileWebUploadAssetRef(
  uploaded: Pick<
    UploadImageResponse,
    "image_path" | "storage_backend" | "storage_key" | "image_url"
  >,
): MobileWebUploadAssetRef {
  return {
    runtimeImagePath: uploaded.image_path,
    storageBackend: uploaded.storage_backend,
    storageKey: uploaded.storage_key,
    imageUrl: uploaded.image_url || null,
  };
}

export function getUploadAssetRef(
  draft: MobileWebUploadDraft,
): MobileWebUploadAssetRef | null {
  return draft.uploadAsset || null;
}

export function getDraftRuntimeImagePath(
  draft: MobileWebUploadDraft,
): string {
  return getUploadAssetRef(draft)?.runtimeImagePath || draft.imagePath;
}

export function getDraftUploadImageResponse(
  draft: MobileWebUploadDraft,
): UploadImageResponse | null {
  const uploadAsset = getUploadAssetRef(draft);
  if (!uploadAsset) {
    return null;
  }

  return {
    success: true,
    image_path: uploadAsset.runtimeImagePath,
    storage_backend: uploadAsset.storageBackend,
    storage_key: uploadAsset.storageKey,
    original_filename: draft.browserFile?.name || draft.imagePath,
    content_type: draft.browserFile?.type || null,
    size_bytes: draft.browserFile?.size || 0,
    image_url: uploadAsset.imageUrl || null,
  };
}

export function mergeMobileWebUploadDraft(
  current: MobileWebUploadDraft,
  patch: Partial<MobileWebUploadDraft>,
): MobileWebUploadDraft {
  const nextDraft: MobileWebUploadDraft = {
    ...current,
    ...patch,
  };

  if (patch.imagePath !== undefined && patch.browserFile === undefined) {
    nextDraft.browserFile = null;
  }

  if (patch.imagePath !== undefined || patch.browserFile !== undefined) {
    nextDraft.uploadAsset = patch.uploadAsset !== undefined ? patch.uploadAsset : null;
  }

  return nextDraft;
}

export function toStartCreatePayload(
  draft: MobileWebUploadDraft,
  userId: string,
): StartCreatePayload {
  return {
    userId,
    imagePath: getDraftRuntimeImagePath(draft),
    theme: draft.theme,
    paintingIntention: draft.paintingIntention,
    paintingFeeling: draft.paintingFeeling,
    innerRadius: draft.innerRadius,
    middleRadius: draft.middleRadius,
  };
}

export function getMobileWebPrimaryAction(state: MandalaFlowState): string {
  switch (state.step) {
    case "idle":
      return "选择画作";
    case "detectingCircles":
      return "确认三圈";
    case "liteGenerating":
      return "等待一镜 Lite 版";
    case "liteReady":
      return "查看一镜 Lite 版";
    case "upgradePlaceholder":
      return "查看一梳 Pro 版入口";
    case "error":
      return "重新开始";
    default:
      return "继续";
  }
}
