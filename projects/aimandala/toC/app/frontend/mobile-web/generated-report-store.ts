import { applyWealthReport, initialMandalaFlowState } from "../shared/core";
import type {
  InterpretationListQuery,
  InterpretationRecordResponse,
  InterpretationVersion,
  MandalaFlowState,
  WealthReportResponse,
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

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries.slice(0, 50)),
  );
}

function createSeedDraft(
  theme: string,
  imagePath: string,
): MobileWebUploadDraft {
  return {
    imagePath,
    theme,
    reportType: "lite",
    reportVariant: "lite",
    paintingIntention: "",
    paintingFeeling: "",
    innerRadius: 0.35,
    middleRadius: 0.65,
  };
}

function createSeedWealthReportResponse(args: {
  reportId: string;
  reportMode: InterpretationVersion;
  title: string;
  summary: string;
}): WealthReportResponse {
  return {
    success: true,
    report_id: args.reportId,
    report_mode: args.reportMode,
    final_report_md: `# ${args.title}\n\n${args.summary}`,
    final_report: {
      report_id: args.reportId,
      report_mode: args.reportMode,
      title: args.title,
      markdown: `# ${args.title}\n\n${args.summary}`,
    },
    visual_draft: {
      summary: args.summary,
    },
    prompt_pack_manifest: {},
    quality_gate: { passed: true },
    run_summary: {
      report_id: args.reportId,
      report_mode: args.reportMode,
    },
  };
}

function createSeedEntry(args: {
  reportId: string;
  userId: string;
  reportMode: InterpretationVersion;
  theme: string;
  createdAt: string;
  imagePath: string;
  title: string;
  summary: string;
}): GeneratedReportEntry {
  const draft = createSeedDraft(args.theme, args.imagePath);
  const response = createSeedWealthReportResponse({
    reportId: args.reportId,
    reportMode: args.reportMode,
    title: args.title,
    summary: args.summary,
  });

  return {
    reportId: args.reportId,
    userId: args.userId,
    reportMode: args.reportMode,
    theme: args.theme,
    createdAt: args.createdAt,
    draft,
    state: createStateFromWealthReport(response),
  };
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
    image_local_expires_at:
      entry.draft.uploadAsset?.imageLocalExpiresAt ?? null,
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

export function seedGeneratedReportsForDebug(
  userId: string,
): GeneratedReportEntry[] {
  const existing = readEntries();
  if (existing.length > 0) {
    return existing;
  }

  const seededEntries: GeneratedReportEntry[] = [
    createSeedEntry({
      reportId: "seed-history-001",
      userId,
      reportMode: "pro",
      theme: "intimate_relationship",
      createdAt: "2026-04-18T09:30:00+08:00",
      imagePath: "/tmp/aimandala-seed-001.png",
      title: "亲密关系 Pro 解读",
      summary:
        "这是一条本地调试 seed，用来撑起历史解读页的首屏布局和卡片状态。",
    }),
    createSeedEntry({
      reportId: "seed-history-002",
      userId,
      reportMode: "lite",
      theme: "mother_relationship",
      createdAt: "2026-04-17T20:18:00+08:00",
      imagePath: "/tmp/aimandala-seed-002.png",
      title: "母亲关系 Lite 解读",
      summary:
        "记录保留了 Lite 版本的最小报告结构，方便调试标题、时间和按钮样式。",
    }),
    createSeedEntry({
      reportId: "seed-history-003",
      userId,
      reportMode: "lite",
      theme: "father_relationship",
      createdAt: "2026-04-16T14:22:00+08:00",
      imagePath: "/tmp/aimandala-seed-003.png",
      title: "父亲关系 Lite 解读",
      summary: "用于调试历史页第二屏的普通记录卡、筛选和空态切换。",
    }),
    createSeedEntry({
      reportId: "seed-history-004",
      userId,
      reportMode: "pro",
      theme: "personal_growth",
      createdAt: "2026-04-15T20:10:00+08:00",
      imagePath: "/tmp/aimandala-seed-004.png",
      title: "个人成长 Pro 解读",
      summary: "用于调试 Pro 版本标签、时间排布和更长一点的记录列表表现。",
    }),
    createSeedEntry({
      reportId: "seed-history-005",
      userId,
      reportMode: "lite",
      theme: "career_development",
      createdAt: "2026-04-12T11:40:00+08:00",
      imagePath: "/tmp/aimandala-seed-005.png",
      title: "事业发展 Lite 解读",
      summary: "用于调试筛选条件下的结果列表密度。",
    }),
    createSeedEntry({
      reportId: "seed-history-006",
      userId,
      reportMode: "lite",
      theme: "parent_child_relationship",
      createdAt: "2026-04-10T08:05:00+08:00",
      imagePath: "/tmp/aimandala-seed-006.png",
      title: "亲子关系 Lite 解读",
      summary: "用于调试主题筛选和底部滚动区。",
    }),
  ];

  writeEntries(seededEntries);
  return seededEntries;
}

export function appendGeneratedReportForDebug(
  userId: string,
): GeneratedReportEntry {
  const existing = readEntries();
  const seedThemes = [
    "intimate_relationship",
    "mother_relationship",
    "father_relationship",
    "personal_growth",
    "career_development",
    "parent_child_relationship",
    "wealth",
  ];
  const nextIndex = existing.length + 1;
  const theme = seedThemes[nextIndex % seedThemes.length] ?? "wealth";
  const reportMode: InterpretationVersion =
    nextIndex % 3 === 0 ? "pro" : "lite";
  const createdAt = new Date(
    Date.now() - nextIndex * 36 * 60 * 1000,
  ).toISOString();

  const nextEntry = createSeedEntry({
    reportId: `seed-history-${String(Date.now())}`,
    userId,
    reportMode,
    theme,
    createdAt,
    imagePath: `/tmp/aimandala-seed-${nextIndex}.png`,
    title: `${theme} ${reportMode.toUpperCase()} 调试解读`,
    summary:
      "这是通过开发控制台即时追加的本地历史记录，用来继续调试历史列表布局和筛选状态。",
  });

  writeEntries([nextEntry, ...existing]);
  return nextEntry;
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
