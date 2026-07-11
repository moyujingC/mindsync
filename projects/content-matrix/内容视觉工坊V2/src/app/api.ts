import type {
  CoverPlannerRequest,
  CoverPlannerResponse,
  PlannerRequest,
  PlannerResponse,
} from "./content-planning";
import type { GenerationRecord } from "./workspace";

export type GenerateImagesRequest = {
  articleTitle: string;
  prompt: string;
  negativePrompt?: string;
  referenceImages?: Array<{
    label: string;
    url: string;
    note?: string;
  }>;
  width: number;
  height: number;
  count: number;
  purposeKey: string;
  purposeLabel: string;
  presetKey: string;
  presetLabel: string;
  styleName: string;
  inlineLinks?: Array<{
    index?: number;
    sectionKey: string;
    sectionHeading: string;
    sectionSummary: string;
  }>;
  inlineLink?: {
    index?: number;
    sectionKey: string;
    sectionHeading: string;
    sectionSummary: string;
  };
  cardLink?: {
    index: number;
    title: string;
    summary: string;
  };
  coverLink?: {
    index: number;
    title: string;
    variant?: "large" | "thumb";
  };
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

async function readApiJson<T>(response: Response) {
  return (await response.json()) as T | ApiErrorPayload;
}

function readApiErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return payload.message || payload.error || fallback;
}

export async function postPlanCards(request: PlannerRequest) {
  const response = await fetch("/api/plan-cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await readApiJson<PlannerResponse>(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, "内容拆解失败"));
  }

  return payload as PlannerResponse;
}

export async function postPlanCover(request: CoverPlannerRequest) {
  const response = await fetch("/api/plan-cover", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await readApiJson<CoverPlannerResponse>(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, "公众号封面文案规划失败"));
  }

  return payload as CoverPlannerResponse;
}

export async function postGenerateImages(request: GenerateImagesRequest) {
  const response = await fetch("/api/generate-images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await readApiJson<GenerationRecord>(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `${request.purposeLabel} 生成失败`));
  }

  return payload as GenerationRecord;
}

export async function downloadGeneratedImage(url: string) {
  if (url.startsWith("data:")) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("读取内嵌图片失败");
    }
    return await response.blob();
  }

  const response = await fetch(`/api/download-image?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new Error(readApiErrorMessage(payload || {}, "下载图片失败"));
  }

  return await response.blob();
}
