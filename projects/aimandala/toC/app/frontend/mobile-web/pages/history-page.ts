import { getGenerationPresentation } from "../../shared/core";
import { getThemeDisplayName } from "../../shared/core";
import type { InterpretationVersion } from "../../shared/types";
import type { InterpretationRecordResponse } from "../../shared/types";

export interface HistoryPageItemDescriptor {
  interpretationId: string;
  theme: string;
  themeLabel: string;
  title: string;
  subtitle: string;
  createdAt: string;
  recordReady: boolean;
  availableReportTypes: InterpretationVersion[];
  focusReportType: InterpretationVersion;
  versionSummary: string;
  statusLabel: string;
  statusDetail: string;
  actionLabel: string;
  statusTone: "ready" | "pending" | "proReady" | "proPending";
  helperNote?: string;
  stageLabel: string;
  progressLabel: string;
}

export interface HistoryPageDescriptor {
  pageId: "history-page";
  title: string;
  subtitle: string;
  items: HistoryPageItemDescriptor[];
  summary: {
    total: number;
    ready: number;
    pending: number;
  };
}

const historyThemeDisplayNames: Record<string, string> = {
  wealth: "财富事业",
  wealth_career: "财富事业",
  career_development: "财富事业",
  personal_growth: "个人成长",
};

function getHistoryThemeDisplayName(theme: string): string {
  return historyThemeDisplayNames[theme] ?? getThemeDisplayName(theme) ?? theme;
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

function getAvailableReportTypes(
  record: InterpretationRecordResponse,
): InterpretationVersion[] {
  const available = record.version_purchased.filter(
    (version): version is InterpretationVersion => version === "lite" || version === "pro",
  );

  return available.length ? available : ["lite"];
}

function formatVersionSummary(
  reportTypes: InterpretationVersion[],
): string {
  return reportTypes.map((type) => (type === "pro" ? "Pro" : "Lite")).join(" / ");
}

export function createHistoryPageDescriptor(
  records: InterpretationRecordResponse[],
): HistoryPageDescriptor {
  const ready = records.filter((record) => getGenerationPresentation(record).isReady).length;

  return {
    pageId: "history-page",
    title: "历史解读",
    subtitle: "这里保留你已经生成过的所有解读记录，方便你随时回看",
    summary: {
      total: records.length,
      ready,
      pending: records.length - ready,
    },
    items: records.map((record) => {
      const presentation = getGenerationPresentation(record);
      const themeLabel = getHistoryThemeDisplayName(record.theme);
      const availableReportTypes = getAvailableReportTypes(record);
      const focusReportType = availableReportTypes.includes("pro") ? "pro" : "lite";
      const isPending = !presentation.isReady;

      let statusLabel = presentation.statusLabel;
      let statusDetail = presentation.statusDetail;
      let actionLabel = "查看记录详情";
      let statusTone: HistoryPageItemDescriptor["statusTone"] = presentation.isReady
        ? "ready"
        : "pending";
      let helperNote: string | undefined;

      if (focusReportType === "pro" && isPending) {
        statusLabel = "Pro 生成中";
        statusDetail = "Pro 完整解读已经开始生成。你可以先离开当前页面，稍后从历史记录回来查看。";
        actionLabel = "查看详情与进度";
        statusTone = "proPending";
        helperNote = "后台仍在继续生成，不需要一直停留在等待页。";
      } else if (focusReportType === "pro" && presentation.isReady) {
        statusLabel = "可查看 Pro";
        statusDetail = "这条记录已经拥有 Lite 与 Pro，可先进入详情页再选择要查看的版本。";
        actionLabel = "查看记录详情";
        statusTone = "proReady";
        helperNote = "已包含三圈能量、失衡诊断与报告内 AI 问答。";
      } else if (focusReportType === "lite" && presentation.isReady) {
        statusDetail = availableReportTypes.length > 1
          ? "这条记录已经有可查看版本，可先进入详情页，再决定打开 Lite 还是 Pro。"
          : "这条记录已经可以查看，可先进入详情页确认版本与状态。";
      } else if (focusReportType === "lite" && isPending) {
        actionLabel = "查看详情与进度";
      }

      return {
        interpretationId: record.interpretation_id,
        theme: record.theme,
        themeLabel,
        title: `${themeLabel} · 解读记录`,
        subtitle: `创建于 ${formatHistoryCreatedAt(record.created_at)}`,
        createdAt: record.created_at,
        recordReady: presentation.isReady,
        availableReportTypes,
        focusReportType,
        versionSummary: formatVersionSummary(availableReportTypes),
        statusLabel,
        statusDetail,
        actionLabel,
        statusTone,
        helperNote,
        stageLabel: presentation.stageLabel,
        progressLabel: presentation.progressLabel,
      };
    }),
  };
}
