import { applyWealthReport, initialMandalaFlowState } from "../shared/core";
import type {
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
} from "../shared/types";
import type { MobileWebUploadDraft } from "./state";

const STORAGE_KEY = "aimandala.mobileWeb.generatedReports.v1";

export interface GeneratedReportEntry {
  reportId: string;
  userId: string;
  reportMode: InterpretationVersion;
  theme: string;
  createdAt: string;
  draft: MobileWebUploadDraft;
  state: MandalaFlowState;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeReportMode(value: unknown): InterpretationVersion {
  return value === "pro" ? "pro" : "lite";
}

function readEntries(): GeneratedReportEntry[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is GeneratedReportEntry => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.reportId === "string" &&
          typeof item.userId === "string" &&
          typeof item.theme === "string" &&
          typeof item.createdAt === "string" &&
          item.draft &&
          item.state
        );
      })
      .map((item) => ({
        ...item,
        reportMode: normalizeReportMode(item.reportMode),
      }));
  } catch {
    return [];
  }
}

function writeEntries(entries: GeneratedReportEntry[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

function toRecord(entry: GeneratedReportEntry): InterpretationRecordResponse {
  const radii = entry.state.detection ?? {
    inner_radius: entry.draft.innerRadius ?? 0.35,
    middle_radius: entry.draft.middleRadius ?? 0.65,
  };
  const imageUrl =
    entry.draft.uploadAsset?.imageUrl ||
    (/^https?:\/\//.test(entry.draft.imagePath) ? entry.draft.imagePath : null);

  return {
    interpretation_id: entry.reportId,
    user_id: entry.userId,
    theme: entry.theme,
    status: "completed",
    generation_stage: "report_ready",
    generation_progress: 100,
    version_purchased: [entry.reportMode],
    three_circles: {
      inner_radius: radii.inner_radius,
      middle_radius: radii.middle_radius,
    },
    auto_detected: false,
    can_upgrade: entry.reportMode === "lite",
    created_at: entry.createdAt,
    image_url: imageUrl,
    storage_backend: entry.draft.uploadAsset?.storageBackend ?? null,
    storage_key: entry.draft.uploadAsset?.storageKey ?? null,
    image_local_expires_at: entry.draft.uploadAsset?.imageLocalExpiresAt ?? null,
  };
}

export function saveGeneratedReport(args: {
  userId: string;
  draft: MobileWebUploadDraft;
  state: MandalaFlowState;
}): void {
  const report = args.state.report;
  const reportId = report?.interpretation_id;
  if (!reportId) {
    return;
  }

  const nextEntry: GeneratedReportEntry = {
    reportId,
    userId: args.userId,
    reportMode: normalizeReportMode(report.version),
    theme: args.draft.theme || "wealth",
    createdAt: new Date().toISOString(),
    draft: args.draft,
    state: args.state,
  };
  const existing = readEntries().filter((entry) => entry.reportId !== reportId);
  writeEntries([nextEntry, ...existing]);
}

export function listGeneratedReportRecords(
  query: InterpretationListQuery = {},
): InterpretationRecordResponse[] {
  const limit = query.limit ?? 20;
  return readEntries()
    .filter((entry) => !query.theme || entry.theme === query.theme)
    .map(toRecord)
    .filter((record) => {
      if (query.filter === "ready") {
        return record.status === "completed";
      }
      if (query.filter === "pending") {
        return record.status !== "completed";
      }
      return true;
    })
    .slice(0, limit);
}

export function getGeneratedReportEntry(
  reportId: string,
): GeneratedReportEntry | null {
  return readEntries().find((entry) => entry.reportId === reportId) ?? null;
}

export function restoreGeneratedReportState(
  reportId: string,
): MandalaFlowState | null {
  return getGeneratedReportEntry(reportId)?.state ?? null;
}

export function createStateFromWealthReport(
  response: Parameters<typeof applyWealthReport>[1],
): MandalaFlowState {
  return applyWealthReport(initialMandalaFlowState, response);
}
