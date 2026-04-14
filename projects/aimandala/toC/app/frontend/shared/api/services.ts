import { getAimandalaApiBaseUrl } from "./config";
import { fetchJson } from "./httpClient";
import type {
  CreateMiniappOrderRequest,
  CreateInterpretationRequest,
  CreateInterpretationResponse,
  DetectCirclesRequest,
  DetectCirclesResponse,
  InterpretationVersion,
  InterpretationListFilter,
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
  KnowledgeBuildSummaryResponse,
  KnowledgeFixturePreviewRequest,
  KnowledgeFixturePreviewResponse,
  MiniappOrderResponse,
  MiniappSessionExchangeRequest,
  MiniappSessionExchangeResponse,
  NotifyMiniappWechatPaymentRequest,
  PricingInfo,
  ReconcileMiniappOrderResponse,
  ReportChatRequest,
  ReportChatResponse,
  ReportDebugProfileResponse,
  ReportResponse,
  UploadImageResponse,
  UpgradePlaceholderResponse,
} from "../types";

function buildUrl(path: string): string {
  return `${getAimandalaApiBaseUrl()}${path}`;
}

export async function detectCircles(
  payload: DetectCirclesRequest,
): Promise<DetectCirclesResponse> {
  return fetchJson<DetectCirclesResponse>(buildUrl("/api/v2/detect-circles"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const body = new FormData();
  body.append("file", file);

  return fetchJson<UploadImageResponse>(buildUrl("/api/v2/upload-image"), {
    method: "POST",
    body,
  });
}

export async function exchangeMiniappSession(
  payload: MiniappSessionExchangeRequest,
): Promise<MiniappSessionExchangeResponse> {
  return fetchJson<MiniappSessionExchangeResponse>(
    buildUrl("/api/v2/miniapp/session/exchange"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function createInterpretation(
  payload: CreateInterpretationRequest,
): Promise<CreateInterpretationResponse> {
  return fetchJson<CreateInterpretationResponse>(buildUrl("/api/v2/interpretations"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getInterpretation(
  interpretationId: string,
): Promise<InterpretationRecordResponse> {
  return fetchJson<InterpretationRecordResponse>(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}`),
  );
}

export async function getInterpretationStatus(
  interpretationId: string,
): Promise<InterpretationStatusResponse> {
  return fetchJson<InterpretationStatusResponse>(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/status`),
  );
}

export async function getInterpretationReport(
  interpretationId: string,
  version: InterpretationVersion,
): Promise<ReportResponse> {
  const url = new URL(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/report`),
  );
  url.searchParams.set("version", version);

  return fetchJson<ReportResponse>(url.toString());
}

export async function getInterpretationReportDebug(
  interpretationId: string,
): Promise<ReportDebugProfileResponse> {
  return fetchJson<ReportDebugProfileResponse>(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/report-debug`),
  );
}

export async function getKnowledgeBuildSummary(
  buildSelector: string,
): Promise<KnowledgeBuildSummaryResponse> {
  const url = new URL(buildUrl("/api/v2/debug/knowledge/build-summary"));
  url.searchParams.set("build", buildSelector);
  return fetchJson<KnowledgeBuildSummaryResponse>(url.toString());
}

export async function previewKnowledgeFixture(
  payload: KnowledgeFixturePreviewRequest,
): Promise<KnowledgeFixturePreviewResponse> {
  return fetchJson<KnowledgeFixturePreviewResponse>(
    buildUrl("/api/v2/debug/knowledge/fixture-preview"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function chatWithInterpretationReport(
  interpretationId: string,
  payload: ReportChatRequest,
): Promise<ReportChatResponse> {
  return fetchJson<ReportChatResponse>(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/chat`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getInterpretationList(
  userId: string,
  query: InterpretationListQuery = {},
): Promise<InterpretationRecordResponse[]> {
  const filter: InterpretationListFilter = query.filter ?? "all";
  const url = new URL(
    buildUrl(`/api/v2/users/${encodeURIComponent(userId)}/interpretations`),
  );
  if (filter !== "all") {
    url.searchParams.set("filter", filter);
  }
  if (query.limit !== undefined) {
    url.searchParams.set("limit", String(query.limit));
  }
  if (query.theme) {
    url.searchParams.set("theme", query.theme);
  }

  return fetchJson<InterpretationRecordResponse[]>(url.toString());
}

export async function upgradeInterpretation(
  interpretationId: string,
): Promise<UpgradePlaceholderResponse> {
  return fetchJson<UpgradePlaceholderResponse>(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/upgrade`),
    {
      method: "POST",
    },
  );
}

export async function getPricing(): Promise<PricingInfo> {
  return fetchJson<PricingInfo>(buildUrl("/api/v2/pricing"));
}

export async function createMiniappOrder(
  payload: CreateMiniappOrderRequest,
): Promise<MiniappOrderResponse> {
  return fetchJson<MiniappOrderResponse>(buildUrl("/api/v2/miniapp/orders"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getMiniappOrder(
  orderId: string,
): Promise<MiniappOrderResponse> {
  return fetchJson<MiniappOrderResponse>(
    buildUrl(`/api/v2/miniapp/orders/${encodeURIComponent(orderId)}`),
  );
}

export async function reconcileMiniappOrder(
  orderId: string,
): Promise<ReconcileMiniappOrderResponse> {
  return fetchJson<ReconcileMiniappOrderResponse>(
    buildUrl(`/api/v2/miniapp/orders/${encodeURIComponent(orderId)}/reconcile`),
    {
      method: "POST",
    },
  );
}

export async function notifyMiniappWechatPayment(
  payload: NotifyMiniappWechatPaymentRequest,
): Promise<MiniappOrderResponse> {
  return fetchJson<MiniappOrderResponse>(
    buildUrl("/api/v2/miniapp/payments/wechat/notify"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}
