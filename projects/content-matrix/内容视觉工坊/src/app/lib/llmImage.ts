import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
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

function resolveReferenceImages(referenceImages: string[]) {
  const root = path.resolve(process.cwd(), "风格库");
  return referenceImages
    .map((fileName) => path.join(root, fileName))
    .filter((filePath) => fs.existsSync(filePath))
    .slice(0, 6);
}

async function generateImage(prompt: string, ratio: string, referenceImages: string[] = []) {
  const model = process.env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";
  const client = createImageClient();
  const usableReferenceImages = resolveReferenceImages(referenceImages);

  let result;
  let generationMode: "reference-edit" | "prompt-only" = "prompt-only";

  if (usableReferenceImages.length > 0) {
    try {
      result = await client.images.edit({
        model,
        image: usableReferenceImages.map((filePath) => fs.createReadStream(filePath)),
        prompt,
        size: getImageSizeFromRatio(ratio),
        quality: "high",
        n: 1,
      });
      generationMode = "reference-edit";
    } catch (error) {
      console.warn("[llmImage] reference-image edit failed, falling back to prompt-only generation:", error instanceof Error ? error.message : error);
    }
  }

  if (!result) {
    result = await client.images.generate({
      model,
      prompt,
      size: getImageSizeFromRatio(ratio),
      quality: "high",
      n: 1,
    });
  }

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
    generationMode,
  };
}

export async function generateCardImageWithModel(request: GenerateCardImageRequest): Promise<GenerateCardImageResponse> {
  const prompt = buildCardImagePrompt(request);
  return generateImage(prompt, request.ratio, request.styleReferenceImages);
}

export async function generateCoverImageWithModel(request: GenerateCoverImageRequest): Promise<GenerateCoverImageResponse> {
  const prompt = buildCoverImagePrompt(request);
  return generateImage(prompt, request.ratio, request.styleReferenceImages);
}

export async function generateWechatInlineImageWithModel(
  request: GenerateWechatInlineImageRequest,
): Promise<GenerateWechatInlineImageResponse> {
  const prompt = buildWechatInlineImagePrompt(request);
  return generateImage(prompt, request.ratio, request.styleReferenceImages);
}
