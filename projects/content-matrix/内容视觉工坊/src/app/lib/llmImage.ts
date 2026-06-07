import OpenAI from "openai";
import { buildCardImagePrompt, buildCoverImagePrompt, buildWechatInlineImagePrompt } from "./imagePrompt";
import type {
  GenerateCardImageRequest,
  GenerateCardImageResponse,
  GenerateCoverImageRequest,
  GenerateCoverImageResponse,
  GenerateWechatInlineImageRequest,
  GenerateWechatInlineImageResponse,
} from "../types";

function getImageSizeFromRatio(ratio: string) {
  const normalized = ratio.replace(/\s+/g, "");
  if (normalized === "3:4" || normalized === "9:16") {
    return "1024x1536" as const;
  }
  if (normalized === "4:3" || normalized === "2.35:1" || normalized === "2.35:1") {
    return "1536x1024" as const;
  }
  return "1024x1024" as const;
}

function createImageClient() {
  const apiKey = process.env.AITECHFLUX_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AITECHFLUX_API_KEY");
  }

  const baseURL = process.env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1";

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

async function generateImage(prompt: string, ratio: string) {
  const model = process.env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";
  const client = createImageClient();

  const result = await client.images.generate({
    model,
    prompt,
    size: getImageSizeFromRatio(ratio),
    quality: "high",
    n: 1,
  });

  const first = result.data?.[0];
  const b64 = first?.b64_json;
  const url = first?.url;

  if (!b64 && !url) {
    throw new Error("Image generation returned no image payload");
  }

  return {
    provider: "image-model" as const,
    imageUrl: url || `data:image/png;base64,${b64}`,
    prompt,
  };
}

export async function generateCardImageWithModel(request: GenerateCardImageRequest): Promise<GenerateCardImageResponse> {
  const prompt = buildCardImagePrompt(request);
  return generateImage(prompt, request.ratio);
}

export async function generateCoverImageWithModel(request: GenerateCoverImageRequest): Promise<GenerateCoverImageResponse> {
  const prompt = buildCoverImagePrompt(request);
  return generateImage(prompt, request.ratio);
}

export async function generateWechatInlineImageWithModel(
  request: GenerateWechatInlineImageRequest,
): Promise<GenerateWechatInlineImageResponse> {
  const prompt = buildWechatInlineImagePrompt(request);
  return generateImage(prompt, request.ratio);
}
