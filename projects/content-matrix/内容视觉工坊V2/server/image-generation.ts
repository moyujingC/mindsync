import crypto from "node:crypto";
import type { GenerateImagesRequest } from "../src/app/api";

type OpenAICompatibleImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

type ParsedImageApiResponse = {
  payload: OpenAICompatibleImageResponse | null;
  rawText: string;
  isJson: boolean;
  contentType: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

function buildPrompt(request: GenerateImagesRequest) {
  const lines = [
    request.prompt.trim(),
    `用途：${request.purposeLabel}`,
    `风格：${request.styleName}`,
    `文章标题：${request.articleTitle}`,
  ];

  if (request.negativePrompt?.trim()) {
    lines.push(`避免：${request.negativePrompt.trim()}`);
  }

  return lines.filter(Boolean).join("\n");
}

function resolveModelSize(width: number, height: number) {
  if (width === height) return "1024x1024";
  return width > height ? "1536x1024" : "1024x1536";
}

async function readImageApiResponse(response: Response): Promise<ParsedImageApiResponse> {
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const looksJson =
    contentType.includes("application/json") ||
    rawText.trim().startsWith("{") ||
    rawText.trim().startsWith("[");

  if (!looksJson) {
    return {
      payload: null,
      rawText,
      isJson: false,
      contentType,
    };
  }

  try {
    return {
      payload: JSON.parse(rawText) as OpenAICompatibleImageResponse,
      rawText,
      isJson: true,
      contentType,
    };
  } catch {
    return {
      payload: null,
      rawText,
      isJson: false,
      contentType,
    };
  }
}

function buildNonJsonErrorMessage(status: number, contentType: string, rawText: string) {
  const compact = rawText.replace(/\s+/g, " ").trim().slice(0, 120);
  if (/<!doctype html/i.test(rawText) || contentType.includes("text/html")) {
    return `图片接口返回了 HTML 页面（${status}），不是图片 JSON。请检查图片网关或 API 基地址配置。`;
  }
  return `图片接口返回了非 JSON 响应（${status}）：${compact || "空响应"}`;
}

export async function generateImagesWithModel(request: GenerateImagesRequest) {
  const apiKey = requireEnv("AITECHFLUX_API_KEY");
  const baseUrl =
    process.env.AITECHFLUX_BASE_URL?.trim() || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_IMAGE_MODEL?.trim() || "gpt-image-2";

  let response: Response | null = null;
  let parsed: ParsedImageApiResponse | null = null;
  const url = `${baseUrl.replace(/\/$/, "")}/images/generations`;
  const body = JSON.stringify({
    model,
    prompt: buildPrompt(request),
    size: resolveModelSize(request.width, request.height),
    quality: "high",
    n: request.count,
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
    parsed = await readImageApiResponse(response);

    if (response.ok && parsed.isJson) {
      break;
    }

    const shouldRetry =
      attempt === 0 &&
      (!parsed.isJson || response.status >= 500 || response.status === 429);

    if (!shouldRetry) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  if (!response || !parsed) {
    throw new Error("图片接口请求失败，未拿到响应");
  }

  if (!parsed.isJson || !parsed.payload) {
    throw new Error(buildNonJsonErrorMessage(response.status, parsed.contentType, parsed.rawText));
  }

  const payload = parsed.payload;
  if (!response.ok) {
    throw new Error(payload.error?.message || `图片接口失败: ${response.status}`);
  }

  const images =
    payload.data
      ?.map((item) => {
        const imageUrl = item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : "");
        if (!imageUrl) return null;
        return {
          id: crypto.randomUUID(),
          imageUrl,
          prompt: buildPrompt(request),
          width: request.width,
          height: request.height,
          cardLink: request.cardLink,
        };
      })
      .filter(Boolean) ?? [];

  if (images.length === 0) {
    throw new Error("图片接口未返回可用图片");
  }

  return {
    id: `gen-${Date.now().toString(36)}`,
    source: "general-image" as const,
    title: request.articleTitle,
    purposeKey: request.purposeKey,
    purposeLabel: request.purposeLabel,
    presetLabel: request.presetLabel,
    styleName: request.styleName,
    images,
    createdAt: new Date().toISOString(),
  };
}
