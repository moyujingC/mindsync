import { uploadImage } from "../shared/api";
import type { UploadImageResponse } from "../shared/types";
import {
  getDraftUploadImageResponse,
  type MobileWebUploadDraft,
} from "./state";

export async function ensureUploadedImagePath(
  draft: MobileWebUploadDraft,
  onResolved: (uploaded: UploadImageResponse) => void,
): Promise<UploadImageResponse> {
  const existingUpload = getDraftUploadImageResponse(draft);
  if (existingUpload) {
    return existingUpload;
  }

  if (draft.browserFile) {
    const uploaded = await uploadImage(draft.browserFile);
    onResolved(uploaded);
    return uploaded;
  }

  throw new Error("请先选择本地曼陀罗图片并完成上传。");
}
