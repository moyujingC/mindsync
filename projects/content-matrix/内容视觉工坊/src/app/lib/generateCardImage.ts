import type { GenerateCardImageRequest, GenerateCardImageResponse } from "../types";

export async function generateCardImage(request: GenerateCardImageRequest): Promise<GenerateCardImageResponse> {
  const response = await fetch("/api/generate-card-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `generate-card-image failed: ${response.status}`);
  }

  return (await response.json()) as GenerateCardImageResponse;
}
