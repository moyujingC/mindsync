import type {
  GenerateWechatInlineImageRequest,
  GenerateWechatInlineImageResponse,
} from "../types";

export async function generateWechatInlineImage(
  request: GenerateWechatInlineImageRequest,
): Promise<GenerateWechatInlineImageResponse> {
  const response = await fetch("/api/generate-wechat-inline-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `generate-wechat-inline-image failed: ${response.status}`);
  }

  return (await response.json()) as GenerateWechatInlineImageResponse;
}
