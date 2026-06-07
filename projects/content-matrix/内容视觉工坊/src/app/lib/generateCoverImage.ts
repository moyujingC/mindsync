import type { GenerateCoverImageRequest, GenerateCoverImageResponse } from "../types";

export async function generateCoverImage(request: GenerateCoverImageRequest): Promise<GenerateCoverImageResponse> {
  const response = await fetch("/api/generate-cover-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `generate-cover-image failed: ${response.status}`);
  }

  return (await response.json()) as GenerateCoverImageResponse;
}
