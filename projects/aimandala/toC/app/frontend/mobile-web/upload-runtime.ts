import { uploadImage } from "../shared/api";
import type { UploadImageResponse } from "../shared/types";
import {
  getDraftUploadImageResponse,
  type MobileWebUploadDraft,
} from "./state";

export interface EnsureUploadedImagePathOptions {
  allowExistingImagePath?: boolean;
}

export async function ensureUploadedImagePath(
  draft: MobileWebUploadDraft,
  onResolved: (uploaded: UploadImageResponse) => void,
  options: EnsureUploadedImagePathOptions = {},
): Promise<UploadImageResponse> {
  const existingUpload = getDraftUploadImageResponse(draft);
  if (existingUpload) {
    return existingUpload;
  }

  if (options.allowExistingImagePath && draft.imagePath) {
    const uploaded: UploadImageResponse = {
      success: true,
      image_path: draft.imagePath,
      storage_backend: "preview",
      storage_key: draft.imagePath,
      original_filename: draft.imagePath,
      content_type: null,
      size_bytes: 0,
      image_url: null,
      image_local_expires_at: null,
    };
    onResolved(uploaded);
    return uploaded;
  }

  if (draft.browserFile) {
    const uploaded = await uploadImage(draft.browserFile);
    onResolved(uploaded);
    return uploaded;
  }

  throw new Error("请先选择本地曼陀罗图片并完成上传。");
}
