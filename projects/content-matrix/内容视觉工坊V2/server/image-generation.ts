import crypto from "node:crypto";
import type { GenerateImagesRequest } from "../src/app/api";
import { HANDDRAWN_FLOW_EXPLAINER_STYLE_GUIDE } from "../src/app/style-guides";

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
  const styleGuide =
    request.styleName === "手绘流程讲解板"
      ? HANDDRAWN_FLOW_EXPLAINER_STYLE_GUIDE
      : "";
  const referenceImages = renderReferenceImages(request.referenceImages);
  const lines = [
    request.prompt.trim(),
    `用途：${request.purposeLabel}`,
    `目标规格：${request.presetLabel}，画面比例 ${request.width}:${request.height}`,
    `风格：${request.styleName}`,
    styleGuide,
    referenceImages,
    `文章标题：${request.articleTitle}`,
  ];

  if (request.negativePrompt?.trim()) {
    lines.push(`避免：${request.negativePrompt.trim()}`);
  }

  return lines.filter(Boolean).join("\n");
}

function renderReferenceImages(referenceImages: GenerateImagesRequest["referenceImages"]) {
  if (!referenceImages?.length) return "";
  const rendered = referenceImages
    .slice(0, 12)
    .map((image, index) => {
      const note = image.note ? `；参考要点：${image.note}` : "";
      return `${index + 1}. ${image.label}：${image.url}${note}`;
    })
    .join("\n");
  return `默认参考图（用于统一公众号封面和知识卡片的视觉风格，不要照抄构图或文字）：\n${rendered}`;
}

function resolveModelSize(request: GenerateImagesRequest) {
  if (request.purposeKey === "wx_cover") {
    // WeChat covers depend on the exact 900x383 composition; cropping a generic
    // landscape generation breaks the title safe area.
    return `${request.width}x${request.height}`;
  }

  const { width, height } = request;
  if (width === height) return "1024x1024";
  return width > height ? "1536x1024" : "1024x1536";
}

function hasImageApiConfig() {
  return Boolean(process.env.AITECHFLUX_API_KEY?.trim());
}

function buildLocalPlaceholderImage(request: GenerateImagesRequest, index: number) {
  const title =
    request.cardLink?.title ||
    request.coverLink?.title ||
    request.inlineLink?.sectionHeading ||
    request.articleTitle;
  const subtitle = request.purposeLabel;
  const palette =
    request.purposeKey === "xhs_card"
      ? { bg: "#F6F2EA", panel: "#FFFFFF", accent: "#7C8A9A", text: "#303642" }
      : request.purposeKey === "wx_cover"
        ? { bg: "#DDE7EF", panel: "#F7FAFC", accent: "#5C6F86", text: "#273241" }
        : { bg: "#EEF2F3", panel: "#FFFFFF", accent: "#6E7F7A", text: "#2F3A37" };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}">
      <rect width="100%" height="100%" fill="${palette.bg}"/>
      <rect x="${request.width * 0.08}" y="${request.height * 0.08}" width="${request.width * 0.84}" height="${request.height * 0.84}" rx="24" fill="${palette.panel}" opacity="0.92"/>
      <circle cx="${request.width * 0.82}" cy="${request.height * 0.18}" r="${Math.min(request.width, request.height) * 0.055}" fill="${palette.accent}" opacity="0.28"/>
      <rect x="${request.width * 0.15}" y="${request.height * 0.18}" width="${request.width * 0.16}" height="6" rx="3" fill="${palette.accent}" opacity="0.7"/>
      <text x="${request.width * 0.15}" y="${request.height * 0.36}" fill="${palette.text}" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${Math.max(22, Math.round(request.width * 0.045))}" font-weight="600">
        ${escapeSvgText(title).slice(0, 22)}
      </text>
      <text x="${request.width * 0.15}" y="${request.height * 0.48}" fill="${palette.text}" opacity="0.68" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${Math.max(14, Math.round(request.width * 0.024))}">
        ${escapeSvgText(subtitle)}
      </text>
      <text x="${request.width * 0.15}" y="${request.height * 0.78}" fill="${palette.accent}" opacity="0.9" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${Math.max(13, Math.round(request.width * 0.02))}">
        本地占位图 ${index + 1} · 配置 AITECHFLUX_API_KEY 后生成真实图片
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function generateLocalPlaceholderImages(request: GenerateImagesRequest) {
  const prompt = buildPrompt(request);
  return {
    id: `gen-${Date.now().toString(36)}`,
    source: "general-image" as const,
    title: request.articleTitle,
    purposeKey: request.purposeKey,
    purposeLabel: request.purposeLabel,
    presetLabel: request.presetLabel,
    styleName: `${request.styleName} · 本地占位`,
    images: Array.from({ length: request.count }, (_, index) => ({
      id: crypto.randomUUID(),
      imageUrl: buildLocalPlaceholderImage(request, index),
      prompt,
      width: request.width,
      height: request.height,
      cardLink: request.cardLink,
      inlineLink: request.inlineLink,
      coverLink: request.coverLink,
    })),
    createdAt: new Date().toISOString(),
  };
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
  if (!hasImageApiConfig()) {
    return generateLocalPlaceholderImages(request);
  }

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
    size: resolveModelSize(request),
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
          inlineLink: request.inlineLink,
          coverLink: request.coverLink,
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
