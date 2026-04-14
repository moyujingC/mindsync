import { getGenerationPresentation, getThemeDisplayName } from "../../shared/core";
import type {
  InterpretationRecordResponse,
  InterpretationUpgradeHistoryEntry,
  InterpretationVersion,
} from "../../shared/types";

export interface HistoryRecordDetailActionDescriptor {
  reportType: InterpretationVersion;
  label: string;
  statusLabel: string;
  statusDetail: string;
  enabled: boolean;
  emphasis: "primary" | "secondary";
}

export interface HistoryRecordDetailTimelineEntryDescriptor {
  id: string;
  title: string;
  detail: string;
}

export interface HistoryRecordDetailPageDescriptor {
  pageId: "history-record-detail-page";
  interpretationId: string;
  title: string;
  subtitle: string;
  themeLabel: string;
  versionSummary: string;
  statusLabel: string;
  statusDetail: string;
  progressLabel: string;
  actions: HistoryRecordDetailActionDescriptor[];
  timeline: HistoryRecordDetailTimelineEntryDescriptor[];
}

function getAvailableReportTypes(
  record: InterpretationRecordResponse,
): InterpretationVersion[] {
  const available = record.version_purchased.filter(
    (version): version is InterpretationVersion => version === "lite" || version === "pro",
  );

  return available.length ? available : ["lite"];
}

function formatHistoryCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatVersionLabel(version: InterpretationVersion): string {
  return version === "pro" ? "Pro" : "Lite";
}

function formatVersionSummary(versions: InterpretationVersion[]): string {
  return versions.map(formatVersionLabel).join(" / ");
}

function buildTimeline(
  record: InterpretationRecordResponse,
): HistoryRecordDetailTimelineEntryDescriptor[] {
  const timeline: HistoryRecordDetailTimelineEntryDescriptor[] = [
    {
      id: "created",
      title: "创建记录",
      detail: `${formatHistoryCreatedAt(record.created_at)} · 首次生成 Lite 主链路`,
    },
  ];

  (record.upgrade_history ?? []).forEach((entry, index) => {
    const typedEntry = entry as InterpretationUpgradeHistoryEntry;
    timeline.push({
      id: `upgrade-${index}`,
      title: `${formatVersionLabel(typedEntry.from as InterpretationVersion)} -> ${formatVersionLabel(typedEntry.to as InterpretationVersion)}`,
      detail: `${formatHistoryCreatedAt(typedEntry.at)} · 补差价 ${typedEntry.price_diff} 元`,
    });
  });

  return timeline;
}

export function createHistoryRecordDetailPageDescriptor(
  record: InterpretationRecordResponse,
): HistoryRecordDetailPageDescriptor {
  const presentation = getGenerationPresentation(record);
  const themeLabel = getThemeDisplayName(record.theme) ?? record.theme;
  const availableReportTypes = getAvailableReportTypes(record);
  const hasPro = availableReportTypes.includes("pro");
  const proReady = hasPro && presentation.isReady;
  const liteReady = availableReportTypes.includes("lite");

  return {
    pageId: "history-record-detail-page",
    interpretationId: record.interpretation_id,
    title: `${themeLabel} · 解读记录详情`,
    subtitle: `创建于 ${formatHistoryCreatedAt(record.created_at)}，先确认版本与状态，再进入具体报告。`,
    themeLabel,
    versionSummary: formatVersionSummary(availableReportTypes),
    statusLabel: hasPro && !proReady ? "Pro 生成中" : presentation.statusLabel,
    statusDetail: hasPro && !proReady
      ? "这条记录已经进入 Pro 升级流程，但完整 Pro 正文还在后台生成。"
      : availableReportTypes.length > 1
        ? "这条画作记录下已经有多个可查看版本，请明确选择本次要打开哪一个。"
        : "这条画作记录当前只有一个版本，也建议先从详情页确认后再进入。",
    progressLabel: presentation.progressLabel,
    actions: [
      {
        reportType: "lite",
        label: "打开 Lite 报告",
        statusLabel: liteReady ? "可查看" : "待生成",
        statusDetail: liteReady
          ? "当前 Lite 已可查看，会进入 Lite 报告页。"
          : "当前 Lite 还未准备好，会继续停留在生成进度态。",
        enabled: true,
        emphasis: hasPro ? "secondary" : "primary",
      },
      {
        reportType: "pro",
        label: proReady ? "打开 Pro 报告" : "查看 Pro 状态",
        statusLabel: hasPro ? (proReady ? "可查看" : "生成中") : "未购买",
        statusDetail: hasPro
          ? (proReady
            ? "当前 Pro 已可查看，会进入完整 Pro 报告页。"
            : "当前 Pro 仍在生成，会进入对应的等待 / 进度态。")
          : "当前记录还没有 Pro 权限，不会在这轮直接生成新的 Pro。",
        enabled: hasPro,
        emphasis: "primary",
      },
    ],
    timeline: buildTimeline(record),
  };
}
