import OpenAI from "openai";
import { buildCardImagePrompt } from "./imagePrompt";
import type { GenerateCardImageRequest, GenerateCardImageResponse } from "../types";

export async function generateCardImageWithModel(request: GenerateCardImageRequest): Promise<GenerateCardImageResponse> {
  const apiKey = process.env.AITECHFLUX_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AITECHFLUX_API_KEY");
  }

  const baseURL = process.env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";
  const prompt = buildCardImagePrompt(request);

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const result = await client.images.generate({
    model,
    prompt,
    size: "1024x1536",
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
    provider: "image-model",
    imageUrl: url || `data:image/png;base64,${b64}`,
    prompt,
  };
}
