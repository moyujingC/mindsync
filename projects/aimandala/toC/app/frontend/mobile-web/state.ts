import type {
  MandalaFlowState,
  StartCreatePayload,
  UploadImageResponse,
} from "../shared/types";

export type MobileWebReportVariant = "lite" | "pro";
export type MobileWebReportProductType = MobileWebReportVariant;

export interface MobileWebUploadAssetRef {
  runtimeImagePath: string;
  storageBackend: string;
  storageKey: string;
  imageLocalExpiresAt?: string | null;
  imageUrl?: string | null;
}

export interface MobileWebUploadDraft {
  imagePath: string;
  theme: string;
  reportVariant?: MobileWebReportVariant;
  reportType?: MobileWebReportProductType;
  redeemCode?: string;
  paintingIntention: string;
  paintingFeeling: string;
  innerRadius?: number;
  middleRadius?: number;
  browserFile?: File | null;
  uploadAsset?: MobileWebUploadAssetRef | null;
}

export function inferReportTypeFromVariant(
  reportVariant?: MobileWebReportVariant,
): MobileWebReportProductType {
  return reportVariant === "pro" ? "pro" : "lite";
}

export function inferReportVariantFromType(
  reportType?: MobileWebReportProductType,
): MobileWebReportVariant {
  return reportType === "pro" ? "pro" : "lite";
}

export function getDraftReportType(
  draft: Pick<MobileWebUploadDraft, "reportType" | "reportVariant">,
): MobileWebReportProductType {
  return draft.reportType ?? inferReportTypeFromVariant(draft.reportVariant);
}

export function getDraftReportVariant(
  draft: Pick<MobileWebUploadDraft, "reportType" | "reportVariant">,
): MobileWebReportVariant {
  return draft.reportVariant ?? inferReportVariantFromType(draft.reportType);
}

export function toMobileWebUploadAssetRef(
  uploaded: Pick<
    UploadImageResponse,
    "image_path" | "storage_backend" | "storage_key" | "image_local_expires_at" | "image_url"
  >,
): MobileWebUploadAssetRef {
  return {
    runtimeImagePath: uploaded.image_path,
    storageBackend: uploaded.storage_backend,
    storageKey: uploaded.storage_key,
    imageLocalExpiresAt: uploaded.image_local_expires_at || null,
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

export function hasDraftResolvedCircleRadii(
  draft: Pick<MobileWebUploadDraft, "innerRadius" | "middleRadius">,
): boolean {
  return (
    typeof draft.innerRadius === "number" &&
    !Number.isNaN(draft.innerRadius) &&
    typeof draft.middleRadius === "number" &&
    !Number.isNaN(draft.middleRadius)
  );
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
    image_local_expires_at: uploadAsset.imageLocalExpiresAt || null,
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

  if (patch.reportType !== undefined && patch.reportVariant === undefined) {
    nextDraft.reportVariant = inferReportVariantFromType(patch.reportType);
  }

  if (patch.reportVariant !== undefined && patch.reportType === undefined) {
    nextDraft.reportType = inferReportTypeFromVariant(patch.reportVariant);
  }

  return nextDraft;
}

export function toStartCreatePayload(
  draft: MobileWebUploadDraft,
  userId: string,
): StartCreatePayload {
  const normalizeCirclePercent = (value?: number): number | undefined => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return undefined;
    }

    if (value <= 1) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  };

  return {
    userId,
    imagePath: getDraftRuntimeImagePath(draft),
    storageBackend: getUploadAssetRef(draft)?.storageBackend,
    storageKey: getUploadAssetRef(draft)?.storageKey,
    imageLocalExpiresAt: getUploadAssetRef(draft)?.imageLocalExpiresAt,
    theme: draft.theme,
    redeemCode: draft.redeemCode?.trim() || undefined,
    paintingIntention: draft.paintingIntention,
    paintingFeeling: draft.paintingFeeling,
    innerRadius: normalizeCirclePercent(draft.innerRadius),
    middleRadius: normalizeCirclePercent(draft.middleRadius),
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
    case "proReady":
      return "查看一梳 Pro 版";
    case "error":
      return "重新开始";
    default:
      return "继续";
  }
}
