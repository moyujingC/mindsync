import {
  getGenerationPresentation,
  getThemeDisplayName,
} from "../../shared/core";
import type {
  InterpretationRecordResponse,
  InterpretationUpgradeHistoryEntry,
  InterpretationVersion,
} from "../../shared/types";

export type HistoryRecordDetailState =
  | "not-upgraded"
  | "generating"
  | "viewable";

export interface HistoryRecordDetailStepDescriptor {
  reportType: InterpretationVersion;
  stepLabel: string;
  title: string;
  statusLabel: string;
  statusTone: "jade" | "gold" | "muted";
  description: string;
  actionLabel: string;
  actionEmphasis: "primary" | "secondary" | "inline";
  showSpinner?: boolean;
  progressPercent?: number;
  progressHint?: string;
}

export interface HistoryRecordDetailTimelineEntryDescriptor {
  id: string;
  label: string;
  time?: string;
  state: "done" | "active" | "future";
}

export interface HistoryRecordDetailPageDescriptor {
  pageId: "history-record-detail-page";
  interpretationId: string;
  state: HistoryRecordDetailState;
  themeLabel: string;
  createdAtLabel: string;
  summaryStatusLabel: string;
  versionTrackLabel: string;
  imageUrl?: string | null;
  liteStep: HistoryRecordDetailStepDescriptor;
  proStep: HistoryRecordDetailStepDescriptor;
  timelineTitle: string;
  timelineSubtitle: string;
  timeline: HistoryRecordDetailTimelineEntryDescriptor[];
}

function getAvailableReportTypes(
  record: InterpretationRecordResponse,
): InterpretationVersion[] {
  const available = record.version_purchased.filter(
    (version): version is InterpretationVersion =>
      version === "lite" || version === "pro",
  );

  return available.length ? available : ["lite"];
}

function formatHistoryCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "/");
}

function getHistoryRecordDetailState(
  record: InterpretationRecordResponse,
): HistoryRecordDetailState {
  const presentation = getGenerationPresentation(record);
  const available = getAvailableReportTypes(record);
  const hasPro = available.includes("pro");

  if (!hasPro) {
    return "not-upgraded";
  }

  return presentation.isReady ? "viewable" : "generating";
}

function getGeneratingHint(progressPercent: number): string {
  if (progressPercent >= 85) {
    return "即将完成";
  }

  if (progressPercent >= 55) {
    return "预计还需 2-3 分钟";
  }

  return "预计还需 4-6 分钟";
}

function getUpgradeHistoryTime(
  record: InterpretationRecordResponse,
): string | undefined {
  const firstUpgrade = record.upgrade_history?.[0] as
    | InterpretationUpgradeHistoryEntry
    | undefined;
  return firstUpgrade?.at ? formatHistoryCreatedAt(firstUpgrade.at) : undefined;
}

function getProReadyTime(record: InterpretationRecordResponse): string | undefined {
  const proReadyAt = (record as InterpretationRecordResponse & { pro_ready_at?: string | null }).pro_ready_at;
  return proReadyAt ? formatHistoryCreatedAt(proReadyAt) : undefined;
}

function buildTimeline(
  record: InterpretationRecordResponse,
  state: HistoryRecordDetailState,
): HistoryRecordDetailTimelineEntryDescriptor[] {
  const createdAtLabel = formatHistoryCreatedAt(record.created_at);
  const upgradeAtLabel = getUpgradeHistoryTime(record);
  const proReadyAtLabel = getProReadyTime(record);
  const timeline: HistoryRecordDetailTimelineEntryDescriptor[] = [
    {
      id: "lite-ready",
      label: "Lite 初步解读已生成",
      time: createdAtLabel,
      state: "done",
    },
  ];

  if (state === "generating" || state === "viewable") {
    timeline.push({
      id: "pro-started",
      label: "你选择继续，升级到 Pro",
      time: upgradeAtLabel,
      state: "done",
    });
  }

  if (state === "viewable") {
    timeline.push({
      id: "pro-ready",
      label: "Pro 深入解读已为你完成",
      time: proReadyAtLabel,
      state: "done",
    });
  } else if (state === "generating") {
    timeline.push({
      id: "pro-generating",
      label: "Pro 深入解读正在生成",
      state: "active",
    });
  } else {
    timeline.push({
      id: "await-upgrade",
      label: "正在等待你决定是否升级到 Pro",
      state: "future",
    });
  }

  return timeline;
}

export function createHistoryRecordDetailPageDescriptor(
  record: InterpretationRecordResponse,
): HistoryRecordDetailPageDescriptor {
  const presentation = getGenerationPresentation(record);
  const state = getHistoryRecordDetailState(record);
  const themeLabel = getThemeDisplayName(record.theme) ?? record.theme;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(record.generation_progress ?? 0)),
  );

  return {
    pageId: "history-record-detail-page",
    interpretationId: record.interpretation_id,
    state,
    themeLabel,
    createdAtLabel: formatHistoryCreatedAt(record.created_at),
    summaryStatusLabel:
      state === "viewable"
        ? "Pro 已可查看"
        : state === "generating"
          ? "Pro 生成中"
          : "Lite 已可查看",
    versionTrackLabel: "Lite → Pro",
    imageUrl: record.image_url ?? null,
    liteStep: {
      reportType: "lite",
      stepLabel: "STEP · 01",
      title: "Lite 初步解读",
      statusLabel: "已可查看",
      statusTone: "jade",
      description: "这是本次解读的第一步，帮你快速看见画面中的初步象征与线索。",
      actionLabel: "查看 Lite",
      actionEmphasis: "secondary",
    },
    proStep: {
      reportType: "pro",
      stepLabel: "STEP · 02",
      title: "Pro 深入解读",
      statusLabel:
        state === "viewable"
          ? "已可查看"
          : state === "generating"
            ? "生成中"
            : "未升级",
      statusTone:
        state === "viewable"
          ? "gold"
          : state === "generating"
            ? "gold"
            : "muted",
      description:
        state === "viewable"
          ? "深度解读已生成完成，包含梳理、象征解读与追问能力。"
          : state === "generating"
            ? "深度解读正在生成，大约需要几分钟。"
            : "在 Lite 的基础上继续深入梳理。升级后可继续追问、继续对话。",
      actionLabel:
        state === "viewable"
          ? "查看 Pro"
          : state === "generating"
            ? "查看进度"
            : "升级到 Pro",
      actionEmphasis: state === "generating" ? "secondary" : "primary",
      showSpinner: state === "generating",
      progressPercent: state === "generating" ? progressPercent : undefined,
      progressHint:
        state === "generating" ? getGeneratingHint(progressPercent) : undefined,
    },
    timelineTitle: "这次解读的过程",
    timelineSubtitle: "我们一起走到这里",
    timeline: buildTimeline(record, state),
  };
}
