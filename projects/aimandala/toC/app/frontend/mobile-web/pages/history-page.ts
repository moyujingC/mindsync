import { getGenerationPresentation } from "../../shared/core";
import { getThemeDisplayName } from "../../shared/core";
import type { InterpretationRecordResponse } from "../../shared/types";

export interface HistoryPageItemDescriptor {
  interpretationId: string;
  theme: string;
  themeLabel: string;
  title: string;
  subtitle: string;
  canOpenReport: boolean;
  reportVariant: "lite" | "pro";
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

export function createHistoryPageDescriptor(
  records: InterpretationRecordResponse[],
): HistoryPageDescriptor {
  const ready = records.filter((record) => getGenerationPresentation(record).isReady).length;

  return {
    pageId: "history-page",
    title: "历史解读",
    subtitle: "查看已经生成的 Lite / Pro 解读记录。",
    summary: {
      total: records.length,
      ready,
      pending: records.length - ready,
    },
    items: records.map((record) => {
      const presentation = getGenerationPresentation(record);
      const themeLabel = getThemeDisplayName(record.theme) ?? record.theme;
      const reportVariant = record.version_purchased.includes("pro") ? "pro" : "lite";
      const isPending = !presentation.isReady;

      let statusLabel = presentation.statusLabel;
      let statusDetail = presentation.statusDetail;
      let actionLabel = presentation.isReady ? "打开报告" : "查看进度";
      let statusTone: HistoryPageItemDescriptor["statusTone"] = presentation.isReady
        ? "ready"
        : "pending";
      let helperNote: string | undefined;

      if (reportVariant === "pro" && isPending) {
        statusLabel = "Pro 生成中";
        statusDetail = "Pro 完整解读已经开始生成。你可以先离开当前页面，稍后从历史记录回来查看。";
        actionLabel = "继续查看进度";
        statusTone = "proPending";
        helperNote = "后台仍在继续生成，不需要一直停留在等待页。";
      } else if (reportVariant === "pro" && presentation.isReady) {
        statusLabel = "可查看 Pro";
        statusDetail = "Pro 完整解读已生成，可直接进入完整报告查看结果。";
        actionLabel = "查看完整 Pro 报告";
        statusTone = "proReady";
        helperNote = "已包含三圈能量、失衡诊断与报告内 AI 问答。";
      } else if (reportVariant === "lite" && presentation.isReady) {
        actionLabel = "打开 Lite 报告";
      } else if (reportVariant === "lite" && isPending) {
        actionLabel = "查看生成进度";
      }

      return {
        interpretationId: record.interpretation_id,
        theme: record.theme,
        themeLabel,
        title: `${themeLabel} · ${reportVariant === "pro" ? "Pro" : "Lite"}`,
        subtitle: `创建于 ${formatHistoryCreatedAt(record.created_at)}`,
        canOpenReport: presentation.isReady,
        reportVariant,
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
