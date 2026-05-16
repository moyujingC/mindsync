import { uploadImage } from "../shared/api";
import type { UploadImageResponse } from "../shared/types";
import {
  getDraftUploadImageResponse,
  type MobileWebUploadDraft,
} from "./state";

function createFallbackUploadResponse(
  draft: MobileWebUploadDraft,
): UploadImageResponse {
  return {
    success: true,
    image_path: draft.imagePath,
    storage_backend: "path",
    storage_key: draft.imagePath,
    original_filename: draft.imagePath.split("/").pop() || draft.imagePath,
    content_type: null,
    size_bytes: 0,
    image_url: null,
  };
}

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

  const fallbackUpload = createFallbackUploadResponse(draft);
  onResolved(fallbackUpload);
  return fallbackUpload;
}
