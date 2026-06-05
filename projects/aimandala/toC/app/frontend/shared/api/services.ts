import { getAimandalaApiBaseUrl } from "./config";
import { fetchJson } from "./httpClient";
import type {
  ReportFollowupRequest,
  ReportFollowupResponse,
  UploadImageResponse,
  WealthReportRecordResponse,
  WealthReportRequest,
  WealthReportResponse,
} from "../types";

function buildUrl(path: string): string {
  return `${getAimandalaApiBaseUrl()}${path}`;
}

export async function createWealthReport(
  payload: WealthReportRequest,
): Promise<WealthReportResponse> {
  return fetchJson<WealthReportResponse>(buildUrl("/api/wealth-reports"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listWealthReports(): Promise<WealthReportRecordResponse[]> {
  return fetchJson<WealthReportRecordResponse[]>(buildUrl("/api/wealth-reports"));
}

export async function getWealthReport(
  reportId: string,
): Promise<WealthReportResponse> {
  return fetchJson<WealthReportResponse>(
    buildUrl(`/api/wealth-reports/${encodeURIComponent(reportId)}`),
  );
}

export async function createReportFollowup(
  payload: ReportFollowupRequest,
): Promise<ReportFollowupResponse> {
  return fetchJson<ReportFollowupResponse>(buildUrl("/api/report-followups"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchJson<UploadImageResponse>(buildUrl("/api/uploads"), {
    method: "POST",
    body: formData,
  });
}
