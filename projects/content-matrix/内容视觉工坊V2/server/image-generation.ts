import crypto from "node:crypto";

export type GenerateImagesRequest = {
  articleTitle: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  count: number;
  purposeKey: string;
  purposeLabel: string;
  presetKey: string;
  presetLabel: string;
  styleName: string;
};

type OpenAICompatibleImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
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

export async function generateImagesWithModel(request: GenerateImagesRequest) {
  const apiKey = requireEnv("AITECHFLUX_API_KEY");
  const baseUrl =
    process.env.AITECHFLUX_BASE_URL?.trim() || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_IMAGE_MODEL?.trim() || "gpt-image-2";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(request),
      size: resolveModelSize(request.width, request.height),
      quality: "high",
      n: request.count,
    }),
  });

  const payload = (await response.json()) as OpenAICompatibleImageResponse;
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
