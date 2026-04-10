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

      return {
        interpretationId: record.interpretation_id,
        theme: record.theme,
        themeLabel,
        title: `${themeLabel} · ${reportVariant === "pro" ? "Pro" : "Lite"}`,
        subtitle: `创建于 ${formatHistoryCreatedAt(record.created_at)}`,
        canOpenReport: presentation.isReady,
        reportVariant,
        statusLabel: presentation.statusLabel,
        statusDetail: presentation.statusDetail,
      };
    }),
  };
}
