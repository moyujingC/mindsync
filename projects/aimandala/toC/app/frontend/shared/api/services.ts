import { getAimandalaApiBaseUrl } from "./config";
import { fetchJson } from "./httpClient";
import type {
  CreateInterpretationRequest,
  CreateInterpretationResponse,
  DetectCirclesRequest,
  DetectCirclesResponse,
  InterpretationRecordResponse,
  InterpretationStatusResponse,
  PricingInfo,
  ReportResponse,
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
  version?: string,
): Promise<ReportResponse> {
  const url = new URL(
    buildUrl(`/api/v2/interpretations/${encodeURIComponent(interpretationId)}/report`),
  );
  if (version) {
    url.searchParams.set("version", version);
  }

  return fetchJson<ReportResponse>(url.toString());
}

export async function getInterpretationList(
  userId: string,
): Promise<InterpretationRecordResponse[]> {
  return fetchJson<InterpretationRecordResponse[]>(
    buildUrl(`/api/v2/users/${encodeURIComponent(userId)}/interpretations`),
  );
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
